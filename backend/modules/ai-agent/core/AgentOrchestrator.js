// modules/ai-agent/core/AgentOrchestrator.js
// ============================================
// AGENT ORCHESTRATOR — Bộ điều phối trung tâm của AI Agent
// ============================================

import { GeminiStreamClient } from "../llm/GeminiStreamClient.js";
import { conversationMemory } from "../memory/ConversationMemory.js";
import { normalizeSlang, processInput } from "../memory/ContextResolver.js";
import { IntentRouter } from "./IntentRouter.js";
import { PromptEngine } from "./PromptEngine.js";
import { ToolRegistry } from "../tools/ToolRegistry.js";

const AUTH_KEYWORDS = [
  "giỏ", "đơn hàng", "thêm vào giỏ", "giỏ hàng",
  "mua", "thanh toán", "đặt hàng", "checkout", "hủy đơn", "đơn của tôi",
];

export class AgentOrchestrator {
  constructor(llmClient = new GeminiStreamClient(), memory = conversationMemory) {
    this.llmClient = llmClient;
    this.memory = memory;
  }

  async processRequest(
    message,
    context = [],
    userId = null,
    token = null,
    sessionId = null,
    onChunk = null,
    options = {}
  ) {
    try {
      console.log("\n" + "=".repeat(60));
      console.log("🤖 [AgentOrchestrator] REQUEST:", message);
      console.log("👤 User:", userId || "anonymous");
      console.log("📝 Session:", sessionId || "will create new");
      console.log("=".repeat(60));

      // 1. Chuẩn hóa từ lóng tiếng Việt
      const normalizedMessage = normalizeSlang(message);

      // 2. Auth Shield: Bảo vệ các thao tác nhạy cảm
      const requiresAuth = AUTH_KEYWORDS.some((kw) =>
        normalizedMessage.toLowerCase().includes(kw)
      );

      if (requiresAuth && (!userId || !token)) {
        return {
          reply: "Bạn cần đăng nhập để sử dụng tính năng này nhé! 🔐",
          success: false,
          requiresAuth: true,
        };
      }

      // 3. Khởi tạo Session và nạp Context
      let currentSessionId = sessionId || `anon_${Date.now()}`;
      let conversationHistory = [];
      let messageToUse = normalizedMessage;
      let resolvedReference = null;
      let sessionSummaryText = null;

      if (userId) {
        currentSessionId = await this.memory.getOrCreateSession(userId, currentSessionId);

        const [historyRes, processedRes, summaryRes] = await Promise.allSettled([
          this.memory.loadHistory(userId, currentSessionId, 8),
          processInput(normalizedMessage, userId, currentSessionId),
          this.memory.getSessionSummary(userId, currentSessionId),
        ]);

        if (historyRes.status === "fulfilled" && historyRes.value) {
          conversationHistory = historyRes.value;
        }

        if (processedRes.status === "fulfilled" && processedRes.value) {
          const processed = processedRes.value;
          if (processed.text) messageToUse = processed.text;
          if (processed.resolved && processed.resolved.success && processed.resolved.product) {
            resolvedReference = processed.resolved;
            const p = resolvedReference.product;
            const refText = `[PRODUCT_CONTEXT: User đang đề cập đến sản phẩm: name="${p.name}", productId="${p.id}", price=${p.price}]`;
            messageToUse = `${refText}\n${messageToUse}`;
          }
        }

        if (summaryRes.status === "fulfilled" && summaryRes.value) {
          sessionSummaryText = summaryRes.value;
        }
      } else {
        try {
          const processed = await processInput(normalizedMessage, null, currentSessionId);
          if (processed && processed.text) messageToUse = processed.text;
        } catch (e) {
          console.warn("⚠️ Anonymous input processing warning:", e.message);
        }
      }

      // Lưu tin nhắn người dùng vào bộ nhớ
      if (userId && currentSessionId) {
        await this.memory.saveUserMessage(
          userId,
          currentSessionId,
          messageToUse,
          resolvedReference ? { resolved: resolvedReference } : null
        );
      }

      // 4. Intent Routing & Lọc Tools
      const intentResult = IntentRouter.detectIntent(messageToUse, conversationHistory);
      const systemInstruction = PromptEngine.buildSystemInstruction(
        intentResult.domains || intentResult.domain,
        sessionSummaryText
      );

      const allDeclarations = ToolRegistry.getDeclarations();
      const functionDeclarations = IntentRouter.filterToolDeclarations(
        intentResult.toolSet,
        allDeclarations
      );

      const contents = this._buildContents(messageToUse, conversationHistory);

      // 5. Vòng lặp Agent tương tác với LLM
      let response = await this.llmClient.streamGenerateContent(
        contents,
        functionDeclarations,
        systemInstruction,
        (chunkText) => {
          if (onChunk) onChunk(chunkText, currentSessionId);
        }
      );

      let iterationCount = 0;
      const maxIterations = 5;
      const allFunctionCalls = [];

      while (response.functionCalls && iterationCount < maxIterations) {
        iterationCount++;
        console.log(`\n🔄 [AgentOrchestrator] Vòng lặp suy luận ${iterationCount}:`);

        const functionResponses = await Promise.all(
          response.functionCalls.map(async (fc) => {
            console.log(`  🛠️ Thực thi tool: ${fc.name}`);
            try {
              const params = {
                ...fc.args,
                userId,
                token,
                sessionId: fc.args?.sessionId || currentSessionId,
              };

              const executionContext = {
                userId,
                token,
                sessionId: currentSessionId,
                clientSupportsWebMCP: !!options.clientSupportsWebMCP,
                socket: options.socket || null,
              };

              const startTime = Date.now();
              const result = await ToolRegistry.executeTool(fc.name, params, executionContext);
              const duration = Date.now() - startTime;

              console.log(`  ✅ Thành công (${duration}ms):`, result.message || "OK");

              return {
                name: fc.name,
                response: { success: true, ...result },
              };
            } catch (err) {
              console.error(`  ❌ Lỗi khi thực thi ${fc.name}:`, err.message);
              return {
                name: fc.name,
                response: { success: false, error: err.message },
              };
            }
          })
        );

        allFunctionCalls.push(
          ...response.functionCalls.map((fc, idx) => ({
            name: fc.name,
            args: fc.args,
            result: functionResponses[idx].response,
            timestamp: new Date().toISOString(),
          }))
        );

        contents.push({
          role: "model",
          parts: response.functionCallsOriginalParts || response.functionCalls.map((fc) => ({
            functionCall: { name: fc.name, args: fc.args },
          })),
        });

        contents.push({
          role: "user",
          parts: functionResponses.map((fr) => ({
            functionResponse: {
              name: fr.name,
              response: this._sanitizeToolResponse(fr.name, fr.response),
            },
          })),
        });

        // Giãn cách 600ms giữa các vòng gọi để tránh Burst Rate Limit (429) của Google Gemini
        await new Promise((r) => setTimeout(r, 600));

        response = await this.llmClient.streamGenerateContent(
          contents,
          functionDeclarations,
          systemInstruction,
          (chunkText) => {
            if (onChunk) onChunk(chunkText, currentSessionId);
          }
        );
      }

      const finalText = response.text || "Xin lỗi, tôi không thể xử lý yêu cầu này.";

      // 6. Định dạng Payload và lưu tin nhắn trợ lý ảo
      let assistantPayload = this._buildAssistantPayload(allFunctionCalls);

      if (userId && currentSessionId) {
        await this.memory.saveAssistantMessage(
          userId,
          currentSessionId,
          finalText,
          allFunctionCalls.length > 0 ? allFunctionCalls : null
        );
      }

      return {
        reply: finalText,
        success: true,
        iterations: iterationCount,
        sessionId: currentSessionId,
        resolvedReference,
        payload: assistantPayload,
        hasPayload: !!assistantPayload,
        productCount: assistantPayload?.products?.length || 0,
        _debug: {
          domain: intentResult.domain,
          domains: intentResult.domains,
          confidence: intentResult.confidence,
        },
      };
    } catch (error) {
      console.error("❌ [AgentOrchestrator] ERROR:", error);
      return {
        reply: "Xin lỗi, hệ thống đang gặp sự cố nhỏ. Vui lòng thử lại sau! 🙏",
        success: false,
        error: error.message,
      };
    }
  }

  _buildContents(message, conversationHistory) {
    const contents = [];
    conversationHistory.forEach((msg) => {
      if (msg.role === "user" || msg.role === "assistant" || msg.role === "model") {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        });
      }
    });
    contents.push({ role: "user", parts: [{ text: message }] });
    return contents;
  }

  _buildAssistantPayload(allFunctionCalls) {
    try {
      // Nếu lượt này là hành động giỏ hàng / đơn hàng / thanh toán, không đính kèm card tìm kiếm sản phẩm
      const hasActionThatReplacesProductCard = allFunctionCalls.some((fc) =>
        [
          "add_to_cart",
          "add_from_last_viewed",
          "remove_from_cart",
          "update_cart",
          "create_order",
          "cancel_order",
          "create_vnpay_payment",
        ].includes(fc.name)
      );

      if (hasActionThatReplacesProductCard) {
        return null;
      }

      const products = [];
      for (const fc of allFunctionCalls) {
        const { name, result } = fc;
        if (!result || !result.success) continue;

        if (name === "search_products") {
          const items = Array.isArray(result.data)
            ? result.data
            : (result.data?.data && Array.isArray(result.data.data))
            ? result.data.data
            : [];

          for (const p of items) {
            const formatted = this._formatProductForPayload(p);
            if (formatted) products.push(formatted);
          }
        } else if (name === "get_product_detail" && result.data) {
          const productObj = result.data?.data || result.data;
          const formatted = this._formatProductForPayload(productObj);
          if (formatted) products.push(formatted);
        }
      }
      return products.length > 0 ? { products } : null;
    } catch (e) {
      console.warn("⚠️ Could not build assistantPayload:", e.message);
      return null;
    }
  }

  _formatProductForPayload(p) {
    if (!p || !(p.id || p._id) || !(p.name || p.title)) return null;

    let imageUrl = p.image || p.images?.[0] || "/images/placeholder-product.jpg";
    if (imageUrl && !imageUrl.startsWith("http")) {
      const cleanPath = imageUrl.startsWith("/") ? imageUrl.slice(1) : imageUrl;
      imageUrl = `http://localhost:5000/${cleanPath}`;
    }

    const categoryText =
      (typeof p.categoryName === "string" ? p.categoryName : (p.categoryName?.name || p.category?.name)) ||
      "uncategorized";

    return {
      _id: p.id || p._id,
      name: p.name || p.title,
      price: p.price || 0,
      image: imageUrl,
      category: categoryText,
      rating: p.rating || 5,
      countInStock: p.countInStock ?? (p.inStock ? 10 : 0),
      description: p.description || `${p.name || p.title} - Sản phẩm chất lượng cao`,
      numReviews: p.numReviews || 0,
      reviews: p.reviews || [],
      createdAt: p.createdAt || new Date().toISOString(),
      updatedAt: p.updatedAt || new Date().toISOString(),
      quantity: p.quantity || 0,
    };
  }

  _sanitizeToolResponse(toolName, rawResponse) {
    if (!rawResponse) return { success: false, error: "Empty response" };
    try {
      if (toolName === "search_products") {
        let items = [];
        if (Array.isArray(rawResponse.data)) {
          items = rawResponse.data;
        } else if (rawResponse.data?.data && Array.isArray(rawResponse.data.data)) {
          items = rawResponse.data.data;
        }

        const simplified = items.slice(0, 5).map((p) => ({
          id: p.id || p._id,
          name: p.name || p.title,
          price: p.price,
          inStock: p.inStock ?? (p.countInStock > 0),
          category: typeof p.categoryName === "string" ? p.categoryName : (p.categoryName?.name || p.category?.name || "Khác"),
        }));

        return {
          success: rawResponse.success ?? true,
          total: simplified.length,
          products: simplified,
        };
      }

      if (toolName === "get_cart" || toolName === "add_to_cart" || toolName === "update_cart") {
        const root = rawResponse.data || rawResponse;
        const cartObj = root.cart?.cart || root.cart || root;
        const rawItems = cartObj.cartItems || cartObj.items || root.cartItems || root.items || [];
        const items = Array.isArray(rawItems) ? rawItems : [];

        const simplifiedItems = items.slice(0, 10).map((i) => {
          const prod = i.product || {};
          return {
            productId: i.productId || prod._id || prod.id || i.id || i._id,
            name: i.name || prod.name || "Sản phẩm",
            quantity: i.quantity || 1,
            price: i.price || prod.price || 0,
          };
        });

        const totalPrice =
          root.totalPrice ||
          root.total ||
          root.cart?.totalPrice ||
          cartObj.totalPrice ||
          cartObj.total ||
          items.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0);
        const totalItems = items.reduce((sum, i) => sum + (i.quantity || 1), 0);

        return {
          success: true,
          totalItems,
          totalPrice,
          items: simplifiedItems,
        };
      }

      if (toolName === "create_order") {
        const root = rawResponse.data || rawResponse;
        const order = root.order || root;
        return {
          success: true,
          message: root.message || "Đặt hàng thành công",
          orderId: order._id || order.id || root.orderId,
          orderCode: order.orderCode || root.orderCode,
          totalPrice: order.payment?.totalPrice || order.totalPrice || root.totalPrice || 0,
        };
      }

      if (toolName === "create_vnpay_payment") {
        const root = rawResponse.data || rawResponse;
        return {
          success: root.success ?? true,
          message: root.message || "Tạo liên kết thanh toán thành công",
          paymentUrl: root.paymentUrl || root.url,
          orderCode: root.orderCode,
          totalPrice: root.totalPrice,
        };
      }

      return rawResponse;
    } catch (e) {
      return rawResponse;
    }
  }
}

export const orchestrator = new AgentOrchestrator();
export const runAgent = (message, context, userId, token, sessionId, onChunk, options = {}) =>
  orchestrator.processRequest(message, context, userId, token, sessionId, onChunk, options);
