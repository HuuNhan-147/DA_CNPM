// utils/aiAgent/agentCore.js (FIXED CONTEXT LOADING)
import axios from "axios";
import { tools, getToolDeclarations } from "./toolRegistry.js";
import redisChatService from "../../services/redisChatService.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const SYSTEM_INSTRUCTION = `Bạn là E-ComMate - trợ lý mua sắm thông minh cho người Việt.

NHIỆM VỤ CHÍNH:
- Giúp khách hàng tìm kiếm sản phẩm
- Thêm sản phẩm vào giỏ hàng
- Xem giỏ hàng và đơn hàng
- Trả lời thân thiện, tự nhiên bằng tiếng Việt

QUY TẮC XỬ LÝ "THÊM VÀO GIỎ HÀNG":

1. KHI user nói: "thêm [tên sản phẩm] vào giỏ"
   → BẮT BUỘC: Gọi search_products(keyword="tên sản phẩm") TRƯỚC
   → SAU ĐÓ: Dùng productId từ kết quả để gọi add_to_cart
   → KHÔNG BAO GIỜ hỏi user về productId

2. KHI user nói: "thêm nó vào giỏ" / "thêm cái này vào giỏ" / "thêm vào giỏ"
   → XEM LỊCH SỬ: Tìm sản phẩm vừa được đề cập gần nhất
   → Dùng productId của sản phẩm đó để gọi add_to_cart
   → VÍ DỤ:
      User: "tư vấn iPhone 17"
      Bot: "iPhone 17 Pro Max có giá 38.490.000 VNĐ..."
      User: "thêm nó vào giỏ"
      → Bot phải nhớ iPhone 17 và thêm vào giỏ

3. LUỒNG CHUẨN:
   Input: "thêm iPhone 15 vào giỏ"
   Step 1: search_products(keyword="iPhone 15")
   Step 2: Nhận kết quả [{id: "abc123", name: "iPhone 15 Pro"}]
   Step 3: add_to_cart(productId="abc123", quantity=1)
   Step 4: "Đã thêm iPhone 15 Pro vào giỏ hàng của bạn!"

4. XỬ LÝ SỐ LƯỢNG:
   - "thêm 3 iPhone" → quantity=3
   - "thêm nó vào giỏ" → quantity=1

5. NHIỀU SẢN PHẨM:
   "thêm iPhone và Samsung"
   → search iPhone → add to cart
   → search Samsung → add to cart

6. TÌM KIẾM KHÔNG CÓ KẾT QUẢ:
   "Xin lỗi, không tìm thấy sản phẩm này trong cửa hàng."

HÃY TỰ NHIÊN, THÂN THIỆN VÀ LUÔN HOÀN THÀNH YÊU CẦU!`;

/**
 * ✅ MAIN AGENT với Context Loading từ Redis
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

    // Validate authentication
    const requiresAuth =
      message.toLowerCase().includes("giỏ") ||
      message.toLowerCase().includes("đơn hàng");

    if (requiresAuth && (!userId || !token)) {
      return {
        reply: "Bạn cần đăng nhập để sử dụng tính năng này nhé! 🔐",
        success: false,
        requiresAuth: true,
      };
    }

    // ============================================
    // ✅ BƯỚC 1: LẤY HOẶC TẠO SESSION + LOAD HISTORY
    // ============================================
    let currentSessionId = sessionId;
    let conversationHistory = [];

    if (userId) {
      // Lấy hoặc tạo session
      currentSessionId = await redisChatService.getOrCreateSession(
        userId,
        sessionId
      );

      // ⭐ KEY FIX: Load lịch sử từ Redis (10 messages gần nhất)
      const recentMessages = await redisChatService.getMessages(
        userId,
        currentSessionId,
        10, // limit
        0   // offset
      );

      // Convert sang format cho Gemini
      conversationHistory = recentMessages.map((msg) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      }));

      console.log(`📚 Loaded ${conversationHistory.length} messages from Redis`);
      if (conversationHistory.length > 0) {
        console.log("📖 Recent context:");
        conversationHistory.slice(-3).forEach((msg, idx) => {
          console.log(`   [${idx + 1}] ${msg.role}: ${msg.content.substring(0, 80)}...`);
        });
      }

      // Merge với context được truyền vào (nếu có)
      conversationHistory = [...conversationHistory, ...context];
    }

    // ============================================
    // ✅ BƯỚC 2: LƯU MESSAGE USER VÀO REDIS
    // ============================================
    if (userId && currentSessionId) {
      await redisChatService.addMessage(
        userId,
        currentSessionId,
        "user",
        message
      );
      console.log(`✅ Saved user message to Redis`);
    }

    // Tạo conversation contents với lịch sử
    const contents = buildContents(message, conversationHistory);
    const functionDeclarations = getToolDeclarations();

    // ============================================
    // ✅ BƯỚC 3: THỰC THI AGENT LOOP
    // ============================================
    let response = await callGemini(contents, functionDeclarations);
    let iterationCount = 0;
    const maxIterations = 5;
    const allFunctionCalls = [];

    while (response.functionCalls && iterationCount < maxIterations) {
      iterationCount++;

      console.log(`\n🔄 ITERATION ${iterationCount}:`);
      console.log(
        "Functions to call:",
        response.functionCalls.map(
          (fc) => `${fc.name}(${JSON.stringify(fc.args)})`
        )
      );

      // Execute functions
      const functionResponses = await executeFunctions(
        response.functionCalls,
        userId,
        token
      );

      // Lưu function calls
      allFunctionCalls.push(
        ...response.functionCalls.map((fc, idx) => ({
          name: fc.name,
          args: fc.args,
          result: functionResponses[idx].response,
        }))
      );

      // Update conversation
      contents.push({
        role: "model",
        parts: response.functionCalls.map((fc) => ({
          functionCall: { name: fc.name, args: fc.args },
        })),
      });

      contents.push({
        role: "user",
        parts: functionResponses.map((fr) => ({
          functionResponse: { name: fr.name, response: fr.response },
        })),
      });

      // Get next response
      response = await callGemini(contents, functionDeclarations);
    }

    const finalText =
      response.text || "Xin lỗi, tôi không thể xử lý yêu cầu này.";

    // ============================================
    // ✅ BƯỚC 4: LƯU RESPONSE ASSISTANT VÀO REDIS
    // ============================================
    if (userId && currentSessionId) {
      await redisChatService.addMessage(
        userId,
        currentSessionId,
        "assistant",
        finalText,
        allFunctionCalls.length > 0 ? allFunctionCalls : null
      );
      console.log(`✅ Saved assistant response to Redis`);
    }

    console.log("\n✅ FINAL RESPONSE:", finalText);
    console.log("Iterations:", iterationCount);
    console.log("Session ID:", currentSessionId);
    console.log("=".repeat(60) + "\n");

    return {
      reply: finalText,
      success: true,
      iterations: iterationCount,
      sessionId: currentSessionId,
    };
  } catch (error) {
    console.error("\n❌ AGENT ERROR:", error.message);

    if (error.response) {
      console.error("API Response:", error.response.data);
    }

    return {
      reply: "Xin lỗi, hệ thống đang gặp sự cố. Vui lòng thử lại sau! 🙏",
      success: false,
      error: error.message,
    };
  }
}

/**
 * ✅ BUILD CONVERSATION CONTENTS với History
 */
function buildContents(message, conversationHistory) {
  return [
    // System instruction
    {
      role: "user",
      parts: [{ text: SYSTEM_INSTRUCTION }],
    },
    {
      role: "model",
      parts: [
        {
          text: "Tôi hiểu rõ! Tôi sẽ luôn nhớ sản phẩm trong lịch sử và tìm kiếm sản phẩm trước khi thêm vào giỏ hàng.",
        },
      ],
    },
    // ⭐ Previous conversation history
    ...conversationHistory.map((c) => ({
      role: c.role === "assistant" ? "model" : "user",
      parts: [{ text: c.content }],
    })),
    // Current message
    {
      role: "user",
      parts: [{ text: message }],
    },
  ];
}

/**
 * ✅ EXECUTE FUNCTIONS
 */
async function executeFunctions(functionCalls, userId, token) {
  return Promise.all(
    functionCalls.map(async (fc) => {
      console.log(`  🛠️ Executing: ${fc.name}`);

      try {
        const params = { ...fc.args, userId, token };
        const result = await tools[fc.name](params);

        console.log(`  ✅ Success:`, result.message || "OK");

        return {
          name: fc.name,
          response: {
            success: true,
            ...result,
          },
        };
      } catch (error) {
        console.error(`  ❌ Error:`, error.message);

        return {
          name: fc.name,
          response: {
            success: false,
            error: error.message,
          },
        };
      }
    })
  );
}

/**
 * ✅ CALL GEMINI API với Retry Logic
 */
async function callGemini(contents, functionDeclarations) {
  const maxRetries = 3;
  const baseDelay = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
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
        throw new Error("No content in response");
      }

      // Parse function calls
      const functionCalls = content.parts
        ?.filter((part) => part.functionCall)
        .map((part) => ({
          name: part.functionCall.name,
          args: part.functionCall.args || {},
        }));

      // Parse text
      const text = content.parts
        ?.filter((part) => part.text)
        .map((part) => part.text)
        .join("\n");

      return {
        functionCalls: functionCalls?.length > 0 ? functionCalls : null,
        text: text || null,
      };
    } catch (err) {
      const status = err?.response?.status;
      const isRetryable = !status || status >= 500;

      console.warn(`callGemini attempt ${attempt} failed:`, err?.message || err);

      if (attempt < maxRetries && isRetryable) {
        const jitter = Math.floor(Math.random() * 300);
        const delay = baseDelay * Math.pow(2, attempt - 1) + jitter;
        console.log(`Retrying in ${delay}ms (${attempt + 1}/${maxRetries})`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      if (status === 503 || err?.response?.data?.error?.status === 'UNAVAILABLE') {
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