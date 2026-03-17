// utils/aiAgent/agentCore.js
import axios from "axios";
import { tools, getToolDeclarations } from "./toolRegistry.js";
import redisChatService from "../../services/redisChatService.js";
import { processInput, getSessionSummary } from "./contextManager.js";
import { normalizeSlang } from "./processors/slangNormalizer.js";
import SYSTEM_INSTRUCTION from "./promptTemplates.js"; // ✅ IMPORT PROMPT TỪ FILE CHUNG

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

/**
 * ✅ MAIN AGENT với Context Loading từ Redis + ENHANCED LOGGING
 */
export async function runAgent(
  message,
  context = [],
  userId = null,
  token = null,
  sessionId = null
) {
  try {
    console.log("\n" + "=".repeat(60));
    console.log("🤖 NEW REQUEST:", message);
    console.log("👤 User:", userId || "anonymous");
    console.log("📝 Session:", sessionId || "will create new");
    console.log("=".repeat(60));

    // Chuẩn hóa từ lóng
    const normalizedMessage = normalizeSlang(message);
    console.log(`🔤 Slang normalized: "${message}" → "${normalizedMessage}"`);

    // Validate authentication
    const requiresAuth =
      normalizedMessage.toLowerCase().includes("giỏ") ||
      normalizedMessage.toLowerCase().includes("đơn hàng") ||
      normalizedMessage.toLowerCase().includes("thêm vào giỏ");

    if (requiresAuth && (!userId || !token)) {
      return {
        reply: "Bạn cần đăng nhập để sử dụng tính năng này nhé! 🔐",
        success: false,
        requiresAuth: true,
      };
    }

    // Lấy hoặc tạo session + load history
    let currentSessionId = sessionId || `anon_${Date.now()}`;
    let conversationHistory = [];
    let messageToUse = normalizedMessage;
    let resolvedReference = null;
    let sessionSummaryText = null;

    if (userId) {
      currentSessionId = await redisChatService.getOrCreateSession(
        userId,
        currentSessionId
      );
      console.log(`🔄 Using session: ${currentSessionId}`);

      // TỐI ƯU HÓA: Chạy 3 tác vụ Async độc lập (lấy tin nhắn, lấy tóm tắt, xử lý input) CÙNG LÚC để giảm độ trễ
      const [recentMessagesResult, processedResult, sessionSummaryResult] = await Promise.allSettled([
        redisChatService.getMessages(userId, currentSessionId, 15, 0),
        processInput(normalizedMessage, userId, currentSessionId),
        getSessionSummary(userId, currentSessionId)
      ]);

      // 1. Gán kết quả recentMessages
      if (recentMessagesResult.status === 'fulfilled' && recentMessagesResult.value) {
        conversationHistory = recentMessagesResult.value.map((msg) => ({
          role: msg.role === "assistant" ? "model" : "user",
          content: msg.content,
          _timestamp: msg.timestamp,
          _functionCalls: msg.functionCalls,
        }));
        console.log(`📚 Loaded ${conversationHistory.length} messages from Redis`);
      }

      // 2. Gán kết quả processed Input
      if (processedResult.status === 'fulfilled' && processedResult.value) {
        const processed = processedResult.value;
        if (processed.text) messageToUse = processed.text;
        if (processed.resolved) {
          resolvedReference = processed.resolved;
          if (resolvedReference && resolvedReference.success && resolvedReference.product) {
            const product = resolvedReference.product;
            const refText = `[PRODUCT_CONTEXT: User đang đề cập đến sản phẩm: name="${product.name}", productId="${product.id}", price=${product.price}]`;
            conversationHistory.push({ role: "system", content: refText });
            console.log(`📎 Added context reference: ${refText}`);
          }
        }
      }

      // 3. Gán kết quả sessionSummary
      if (sessionSummaryResult.status === 'fulfilled' && sessionSummaryResult.value) {
        sessionSummaryText = sessionSummaryResult.value;
        conversationHistory.unshift({ role: "system", content: sessionSummaryText });
        console.log("📋 Added session summary to context");
      }
    } else {
      console.log(`👻 Anonymous session: ${currentSessionId}`);
      // Với user ẩn danh, vẫn xử lý input cơ bản (không có Redis)
      try {
        const processed = await processInput(normalizedMessage, null, currentSessionId);
        if (processed && processed.text) messageToUse = processed.text;
      } catch (e) {
        console.warn("⚠️ inputProcessor error:", e.message);
      }
    }

    // Lưu message đã xử lý
    if (userId && currentSessionId) {
      await redisChatService.addMessage(
        userId,
        currentSessionId,
        "user",
        messageToUse,
        resolvedReference ? { resolved: resolvedReference } : null
      );
      console.log(`✅ Saved processed user message to Redis`);
    }

    // Tạo conversation contents với lịch sử
    const contents = buildContents(messageToUse, conversationHistory);
    const functionDeclarations = getToolDeclarations();

    // 🔍 LOG BEFORE CALLING GEMINI
    console.log("\n" + "=".repeat(60));
    console.log("📤 SENDING TO GEMINI:");
    console.log(
      "📊 System Instruction Length:",
      SYSTEM_INSTRUCTION.length,
      "chars"
    );
    console.log("📊 Total Contents Parts:", contents.length);
    console.log(
      "📊 Function Declarations:",
      functionDeclarations.length,
      "tools"
    );
    console.log("📝 User Message:", messageToUse);
    console.log(
      "🔧 Available Tools:",
      functionDeclarations.map((f) => f.name).join(", ")
    );
    console.log("=".repeat(60));

    // Thực thi agent loop
    let response = await callGemini(contents, functionDeclarations);

    // 🔍 LOG GEMINI FIRST RESPONSE
    console.log("\n" + "=".repeat(60));
    console.log("📥 GEMINI FIRST RESPONSE:");
    console.log("🤖 Has Function Calls:", !!response.functionCalls);
    if (response.functionCalls) {
      console.log(
        "🔧 Function Calls:",
        response.functionCalls
          .map((fc) => `${fc.name}(${JSON.stringify(fc.args)})`)
          .join(", ")
      );
    } else {
      console.log("⚠️ NO FUNCTION CALLS - Agent will respond with text only");
    }
    console.log("💬 Has Text Response:", !!response.text);
    if (response.text) {
      console.log(
        "📝 Text Preview:",
        response.text.substring(0, 200) +
          (response.text.length > 200 ? "..." : "")
      );
    }
    console.log("=".repeat(60));

    let iterationCount = 0;
    const maxIterations = 5;
    const allFunctionCalls = [];

    while (response.functionCalls && iterationCount < maxIterations) {
      iterationCount++;
      console.log(`\n🔄 ITERATION ${iterationCount}:`);

      const functionResponses = await executeFunctions(
        response.functionCalls,
        userId,
        token,
        currentSessionId
      );

      allFunctionCalls.push(
        ...response.functionCalls.map((fc, idx) => ({
          name: fc.name,
          args: fc.args,
          result: functionResponses[idx].response,
          timestamp: new Date().toISOString(),
        }))
      );

      // 🚀 Vá lỗi "missing thought_signature": Giữ nguyên cấu trúc parts ban đầu của Gemini trả về
      contents.push({
        role: "model",
        parts: response.functionCallsOriginalParts || response.functionCalls.map((fc) => ({
          functionCall: { name: fc.name, args: fc.args },
        })),
      });

      contents.push({
        role: "user",
        parts: functionResponses.map((fr) => ({
          functionResponse: { name: fr.name, response: fr.response },
        })),
      });

      response = await callGemini(contents, functionDeclarations);

      // 🔍 LOG SUBSEQUENT RESPONSES
      console.log(`📥 ITERATION ${iterationCount} RESPONSE:`);
      console.log("🤖 Has More Function Calls:", !!response.functionCalls);
      if (response.functionCalls) {
        console.log(
          "🔧 Next Functions:",
          response.functionCalls.map((fc) => fc.name).join(", ")
        );
      }
    }

    const finalText =
      response.text || "Xin lỗi, tôi không thể xử lý yêu cầu này.";

    // 🔍 LOG FINAL RESULT
    console.log("\n" + "=".repeat(60));
    console.log("✅ FINAL RESULT:");
    console.log("📊 Total Iterations:", iterationCount);
    console.log("📊 Total Function Calls:", allFunctionCalls.length);
    console.log(
      "🔧 Functions Used:",
      [...new Set(allFunctionCalls.map((fc) => fc.name))].join(", ")
    );
    console.log("💬 Final Text Length:", finalText.length, "chars");
    console.log("=".repeat(60) + "\n");

    // Build structured payload - Enhanced & Optimized
    let assistantPayload = null;
    try {
      const products = [];

      for (const fc of allFunctionCalls) {
        const name = fc.name;
        const result = fc.result;

        if (!result || !result.success) continue;

        if (name === "search_products" && Array.isArray(result.data)) {
          for (const p of result.data) {
            const formattedProduct = formatProductForPayload(p);
            if (formattedProduct) products.push(formattedProduct);
          }
        } else if (name === "get_product_detail" && result.data) {
          const formattedProduct = formatProductForPayload(result.data);
          if (formattedProduct) products.push(formattedProduct);
        }
      }

      if (products.length > 0) {
        assistantPayload = { products };
      }
    } catch (e) {
      console.warn("⚠️ Could not build assistantPayload:", e.message);
      assistantPayload = null;
    }

    // Lưu response vào Redis
    if (userId && currentSessionId) {
      await redisChatService.addMessage(
        userId,
        currentSessionId,
        "assistant",
        finalText,
        allFunctionCalls.length > 0 ? allFunctionCalls : null
      );
    }

    // TRẢ VỀ ĐẦY ĐỦ
    return {
      reply: finalText,
      success: true,
      iterations: iterationCount,
      sessionId: currentSessionId,
      resolvedReference: resolvedReference,
      payload: assistantPayload,
      hasPayload: !!assistantPayload,
      productCount: assistantPayload?.products?.length || 0,
    };
  } catch (error) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ AGENT ERROR:");
    console.error("📛 Error Message:", error.message);
    console.error("📛 Error Stack:", error.stack);
    if (error.response) {
      console.error("📛 API Response Status:", error.response.status);
      console.error(
        "📛 API Response Data:",
        JSON.stringify(error.response.data, null, 2)
      );
    }
    console.error("=".repeat(60) + "\n");

    return {
      reply: "Xin lỗi, hệ thống đang gặp sự cố. Vui lòng thử lại sau! 🙏",
      success: false,
      error: error.message,
    };
  }
}

function buildContents(message, conversationHistory) {
  const contents = [];

  // System instruction
  contents.push({
    role: "user",
    parts: [{ text: SYSTEM_INSTRUCTION }],
  });
  contents.push({
    role: "model",
    parts: [
      {
        text: "Tôi hiểu rõ! Tôi sẽ thực hiện các CRITICAL RULES ngay lập tức: Gọi search_products khi user tìm sản phẩm, gọi get_cart() trước khi tạo đơn hàng, thực hiện quy trình tự động không chờ đợi.",
      },
    ],
  });

  conversationHistory.forEach((msg) => {
    if (msg.role === "system") {
      contents.push({ role: "user", parts: [{ text: msg.content }] });
    } else {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }
  });

  contents.push({ role: "user", parts: [{ text: message }] });
  console.log(`📦 Built ${contents.length} content parts for Gemini`);
  return contents;
}

/** TỐI ƯU HÓA: Helper function phục vụ format sản phẩm nhanh, tránh lặp code */
function formatProductForPayload(p) {
  if (!p || !(p.id || p._id) || !(p.name || p.title)) return null;

  // Xử lý ảnh
  let imageUrl = p.image || p.images?.[0] || "/images/placeholder-product.jpg";
  if (imageUrl && !imageUrl.startsWith("http")) {
    const cleanPath = imageUrl.startsWith("/") ? imageUrl.slice(1) : imageUrl;
    imageUrl = `http://localhost:5000/${cleanPath}`;
  }

  // Xử lý category
  let categoryName = "uncategorized";
  if (p.categoryName && typeof p.categoryName === "string") {
    categoryName = p.categoryName;
  } else if (p.category?.name && typeof p.category.name === "string") {
    categoryName = p.category.name;
  } else if (typeof p.category === "string") {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(p.category);
    if (!isObjectId && p.category.trim() !== "") {
      categoryName = p.category;
    }
  }

  return {
    _id: p.id || p._id,
    name: p.name || p.title,
    price: p.price || 0,
    image: imageUrl,
    category: categoryName,
    rating: p.rating || 4.5,
    countInStock: p.countInStock || 10,
    description: p.description || `${p.name || p.title} - Sản phẩm chất lượng cao`,
    numReviews: p.numReviews || 0,
    reviews: p.reviews || [],
    createdAt: p.createdAt || new Date().toISOString(),
    updatedAt: p.updatedAt || new Date().toISOString(),
    quantity: p.quantity || 0,
  };
}

async function executeFunctions(
  functionCalls,
  userId,
  token,
  sessionId = null
) {
  return Promise.all(
    functionCalls.map(async (fc) => {
      console.log(`  🛠️ Executing: ${fc.name}`);
      console.log(`  📋 Args:`, JSON.stringify(fc.args, null, 2));

      try {
        const params = {
          ...fc.args,
          userId,
          token,
          sessionId: fc.args?.sessionId || sessionId,
        };

        const startTime = Date.now();
        const result = await tools[fc.name](params);
        const duration = Date.now() - startTime;

        console.log(`  ✅ Success (${duration}ms):`, result.message || "OK");
        console.log(
          `  📊 Result:`,
          JSON.stringify(result, null, 2).substring(0, 500) + "..."
        );

        return {
          name: fc.name,
          response: { success: true, ...result },
        };
      } catch (error) {
        console.error(`  ❌ Error in ${fc.name}:`, error.message);
        console.error(`  📛 Error Stack:`, error.stack);
        return {
          name: fc.name,
          response: { success: false, error: error.message },
        };
      }
    })
  );
}

async function callGemini(contents, functionDeclarations) {
  const maxRetries = 3;
  const baseDelay = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `🔌 Calling Gemini API (attempt ${attempt}/${maxRetries})...`
      );

      const response = await axios.post(
        `${GEMINI_URL}?key=${GEMINI_API_KEY}`,
        {
          contents,
          tools: [{ functionDeclarations }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
          },
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 30000,
        }
      );

      const candidate = response.data.candidates?.[0];
      const content = candidate?.content;

      if (!content) {
        console.error("❌ No content in Gemini response");
        console.error(
          "📛 Full response:",
          JSON.stringify(response.data, null, 2)
        );
        throw new Error("No content in response");
      }

      // 🚀 LẤY ORIGINAL PARTS ĐỂ TRÁNH LỖI MISSING THOUGHT_SIGNATURE
      const originalFunctionCallParts = content.parts?.filter((part) => part.functionCall);

      const functionCalls = originalFunctionCallParts
        ?.map((part) => ({
          name: part.functionCall.name,
          args: part.functionCall.args || {},
        }));

      const text = content.parts
        ?.filter((part) => part.text)
        .map((part) => part.text)
        .join("\n");

      console.log(`✅ Gemini responded successfully`);

      return {
        functionCalls: functionCalls?.length > 0 ? functionCalls : null,
        functionCallsOriginalParts: originalFunctionCallParts, // Lưu lại để truyền lại vòng tiếp theo
        text: text || null,
      };
    } catch (err) {
      const status = err?.response?.status;
      const isRetryable = !status || status >= 500;

      console.warn(
        `⚠️ callGemini attempt ${attempt} failed:`,
        err?.message || err
      );

      if (err?.response?.data) {
        console.error(
          "📛 Gemini Error Response:",
          JSON.stringify(err.response.data, null, 2)
        );
      }

      if (attempt < maxRetries && isRetryable) {
        const jitter = Math.floor(Math.random() * 300);
        const delay = baseDelay * Math.pow(2, attempt - 1) + jitter;
        console.log(`🔄 Retrying in ${delay}ms (${attempt + 1}/${maxRetries})`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      if (
        status === 503 ||
        err?.response?.data?.error?.status === "UNAVAILABLE"
      ) {
        return {
          functionCalls: null,
          text: "Hệ thống đang bận. Vui lòng thử lại sau vài phút.",
        };
      }

      throw err;
    }
  }

  return {
    functionCalls: null,
    text: "Hệ thống hiện đang bận. Vui lòng thử lại sau.",
  };
}
