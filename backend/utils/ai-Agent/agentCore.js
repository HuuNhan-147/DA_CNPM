// utils/aiAgent/agentCore.js
import axios from "axios";
import https from "https";
import { StringDecoder } from "string_decoder"; // ✅ Import StringDecoder để giải mã UTF-8 stream an toàn
import { tools, getToolDeclarations } from "./toolRegistry.js";
import redisChatService from "../../services/redisChatService.js";
import { processInput, getSessionSummary } from "./contextManager.js";
import { normalizeSlang } from "./processors/slangNormalizer.js";
import { buildSystemInstruction } from "./promptTemplates.js"; // ✅ MODULAR PROMPT
import { detectIntent, filterToolDeclarations } from "./intentRouter.js"; // ✅ INTENT ROUTER

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash"; // Fallback an toàn

// Tối ưu network: Tái sử dụng TCP connection để giảm độ trễ SSL handshake
const httpsAgent = new https.Agent({ keepAlive: true });
console.log(`🤖 AI Agent initialized | Model: ${GEMINI_MODEL}`);

/**
 * ✅ MAIN AGENT với Context Loading từ Redis + ENHANCED LOGGING + STREAMING SUPPORT
 */
export async function runAgent(
  message,
  context = [],
  userId = null,
  token = null,
  sessionId = null,
  onChunk = null // Callback hỗ trợ stream chữ về client thời gian thực: (text, sessionId) => void
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

    // ✅ BUG-006: Mở rộng danh sách từ khóa nhạy cảm cần bảo mật xác thực
    const AUTH_KEYWORDS = [
      "giỏ", "đơn hàng", "thêm vào giỏ", "giỏ hàng",
      "mua", "thanh toán", "đặt hàng", "checkout", "hủy đơn", "đơn của tôi"
    ];
    const requiresAuth = AUTH_KEYWORDS.some(kw => normalizedMessage.toLowerCase().includes(kw));

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
        redisChatService.getMessages(userId, currentSessionId, 8, 0), // TỐI ƯU HÓA: Giảm context từ 15 xuống 8 để giảm gánh nặng payload
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
            
            // ✅ BUG-019: Nối context trực tiếp vào message hiện tại thay vì đẩy thành 1 turn chat giả có role: system/user
            messageToUse = `${refText}\n${messageToUse}`;
            console.log(`📎 Added context reference directly to message: ${refText}`);
          }
        }
      }

      // 3. Gán kết quả sessionSummary
      if (sessionSummaryResult.status === 'fulfilled' && sessionSummaryResult.value) {
        sessionSummaryText = sessionSummaryResult.value;
        console.log("📋 Session summary loaded, will append to system instructions");
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

    // Lưu message đã xử lý vào Redis
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

    // ✅ MODULAR ROUTER: Xác định domain + chọn đúng prompt & tools
    const intentResult = detectIntent(messageToUse, conversationHistory);
    
    // ✅ BUG-019: Nối tóm tắt phiên chat trực tiếp vào System Instructions của Gemini thay vì push role: user giả
    const baseSystemInstruction = buildSystemInstruction(intentResult.domains || intentResult.domain);
    const SYSTEM_INSTRUCTION = sessionSummaryText
      ? `${baseSystemInstruction}\n\n[TÓM TẮT PHIÊN CHAT TRƯỚC ĐÓ]:\n${sessionSummaryText}`
      : baseSystemInstruction;

    const allDeclarations = getToolDeclarations();
    const functionDeclarations = filterToolDeclarations(intentResult.toolSet, allDeclarations);

    // Tạo conversation contents với lịch sử
    const contents = buildContents(messageToUse, conversationHistory);

    // 🔍 LOG BEFORE CALLING GEMINI
    console.log("\n" + "=".repeat(60));
    console.log("📤 SENDING TO GEMINI:");
    console.log("🎯 Domains:", intentResult.domains ? intentResult.domains.join(", ") : intentResult.domain, "| Confidence:", intentResult.confidence);
    console.log(
      "📊 System Instruction Length:",
      SYSTEM_INSTRUCTION.length,
      "chars"
    );
    console.log("📊 Total Contents Parts:", contents.length);
    console.log(
      "📊 Function Declarations:",
      functionDeclarations.length,
      `tools (filtered from ${allDeclarations.length})`
    );
    console.log("📝 User Message:", messageToUse);
    console.log(
      "🔧 Active Tools:",
      functionDeclarations.map((f) => f.name).join(", ")
    );
    console.log("=".repeat(60));

    // Thực thi agent loop sử dụng Streaming để tăng hiệu năng phản hồi
    let response = await callGeminiStream(contents, functionDeclarations, SYSTEM_INSTRUCTION, (chunkText) => {
      if (onChunk) onChunk(chunkText, currentSessionId); // Truyền kèm currentSessionId thời gian thực
    });

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

      // ✅ TỐI ƯU: Giảm delay từ 1000ms -> 100ms để tăng tốc độ phản hồi đáng kể
      await new Promise((r) => setTimeout(r, 100));

      response = await callGeminiStream(contents, functionDeclarations, SYSTEM_INSTRUCTION, (chunkText) => {
        if (onChunk) onChunk(chunkText, currentSessionId);
      });

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
      _debug: { domain: intentResult.domain, domains: intentResult.domains, confidence: intentResult.confidence },
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

  // TỐI ƯU HÓA & SỬA BUG-019: Loại bỏ hoàn toàn role system bị gán thành user
  conversationHistory.forEach((msg) => {
    if (msg.role === "user" || msg.role === "assistant" || msg.role === "model") {
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

/**
 * ✅ TỐI ƯU HÓA: API gọi Gemini dưới dạng HTTP Stream (chunked transfer encoding)
 * và phát từng phần text (chunk) về client thông qua callback onChunk.
 * Sử dụng giải pháp phân tích dòng mới (line-based parsing) để giải quyết triệt để lỗi ngoặc nhọn lồng nhau.
 */
async function callGeminiStream(contents, functionDeclarations, systemInstruction, onChunk) {
  const maxRetries = 4;
  const baseDelay = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔌 Calling Gemini Stream API (attempt ${attempt}/${maxRetries})...`);

      const payload = {
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents,
        tools: [{ functionDeclarations }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
        },
      };

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?key=${GEMINI_API_KEY}`,
        payload,
        {
          headers: { "Content-Type": "application/json" },
          responseType: "stream", // Nhận HTTP stream
          timeout: 60000,
          httpsAgent: httpsAgent,
        }
      );

      let fullText = "";
      const originalParts = [];
      const decoder = new StringDecoder("utf8"); // ✅ Đảm bảo giải mã UTF-8 an toàn trên dòng stream

      return new Promise((resolve, reject) => {
        let buffer = "";

        response.data.on("data", (chunk) => {
          // Giải mã an toàn chunk nhị phân
          buffer += decoder.write(chunk);

          // ✅ Giải pháp phân tích dòng (Line-based JSON stream parsing)
          // Google stream luôn phân tách các JSON object đẹp bằng ký tự xuống dòng (\n)
          let lines = buffer.split("\n");
          // Giữ dòng cuối cùng chưa hoàn thiện lại trong buffer để ghép với chunk sau
          buffer = lines.pop() || "";

          for (let line of lines) {
            line = line.trim();
            if (!line) continue;
            if (line === "[" || line === "]") continue;
            // Xóa dấu phẩy phân tách các phần tử JSON array ở đầu/cuối dòng
            if (line.startsWith(",")) line = line.substring(1).trim();
            if (line.endsWith(",")) line = line.substring(0, line.length - 1).trim();
            if (!line) continue;

            try {
              const jsonObj = JSON.parse(line);
              const candidate = jsonObj.candidates?.[0];
              const content = candidate?.content;
              const text = content?.parts?.filter(p => p.text).map(p => p.text).join("");

              if (text) {
                fullText += text;
                if (onChunk) onChunk(text); // Stream chunk text hợp lệ về client
              }

              const parts = content?.parts?.filter(p => p.functionCall || p.text) || [];
              originalParts.push(...parts);
            } catch (e) {
              // Dòng JSON chưa hoàn chỉnh do bị cắt giữa các packet, đưa trở lại buffer để xử lý lượt sau
              buffer = line + "\n" + buffer;
            }
          }
        });

        response.data.on("end", () => {
          // Xử lý nốt phần buffer còn lại
          buffer += decoder.end();

          if (buffer.trim()) {
            let line = buffer.trim();
            if (line.startsWith(",")) line = line.substring(1).trim();
            if (line.endsWith(",")) line = line.substring(0, line.length - 1).trim();
            if (line !== "[" && line !== "]") {
              try {
                const jsonObj = JSON.parse(line);
                const candidate = jsonObj.candidates?.[0];
                const content = candidate?.content;
                const text = content?.parts?.filter(p => p.text).map(p => p.text).join("");
                if (text) {
                  fullText += text;
                  if (onChunk) onChunk(text);
                }
                const parts = content?.parts?.filter(p => p.functionCall || p.text) || [];
                originalParts.push(...parts);
              } catch (e) {}
            }
          }

          const originalFunctionCallParts = originalParts.filter((part) => part.functionCall);
          const functionCalls = originalFunctionCallParts.map((part) => ({
            name: part.functionCall.name,
            args: part.functionCall.args || {},
          }));

          console.log(`✅ Gemini Stream completed. Total characters: ${fullText.length}`);

          resolve({
            functionCalls: functionCalls.length > 0 ? functionCalls : null,
            functionCallsOriginalParts: originalFunctionCallParts,
            text: fullText || null,
          });
        });

        response.data.on("error", (err) => {
          reject(err);
        });
      });

    } catch (err) {
      const status = err?.response?.status;
      const isRetryable = !status || status >= 500 || status === 429;

      console.warn(
        `⚠️ callGeminiStream attempt ${attempt} failed. Status: ${status}, Message:`,
        err?.message || err
      );

      if (attempt < maxRetries && isRetryable) {
        const jitter = Math.floor(Math.random() * 300);
        const currentBaseDelay = status === 429 ? baseDelay * 3 : baseDelay;
        const delay = currentBaseDelay * Math.pow(2, attempt - 1) + jitter;
        
        console.log(`🔄 Retrying Stream in ${delay}ms (${attempt + 1}/${maxRetries})`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      if (status === 429 || status === 503) {
        return {
          functionCalls: null,
          text: "Hệ thống hiện đang bận xử lý nhiều yêu cầu. Bạn thử lại sau nhé.",
        };
      }
      throw err;
    }
  }

  return {
    functionCalls: null,
    text: "Hệ thống bận. Vui lòng thử lại sau.",
  };
}
