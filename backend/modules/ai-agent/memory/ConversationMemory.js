// modules/ai-agent/memory/ConversationMemory.js
import redisChatService from "../../../services/redisChatService.js";

export class ConversationMemory {
  constructor(redisService = redisChatService) {
    this.redis = redisService;
  }

  /**
   * Tạo hoặc lấy sessionId hợp lệ
   */
  async getOrCreateSession(userId, sessionId = null) {
    if (!userId) return sessionId || `anon_${Date.now()}`;
    return await this.redis.getOrCreateSession(userId, sessionId);
  }

  /**
   * Nạp lịch sử tin nhắn từ Redis
   * @param {string} userId
   * @param {string} sessionId
   * @param {number} limit
   */
  async loadHistory(userId, sessionId, limit = 8) {
    if (!userId || !sessionId) return [];
    try {
      const messages = await this.redis.getMessages(userId, sessionId, limit, 0);
      if (!messages || !Array.isArray(messages)) return [];

      return messages.map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        content: msg.content,
        _timestamp: msg.timestamp,
        _functionCalls: msg.functionCalls,
      }));
    } catch (err) {
      console.warn("⚠️ ConversationMemory: loadHistory failed, using empty history:", err.message);
      return [];
    }
  }

  /**
   * Lưu tin nhắn người dùng vào Redis
   */
  async saveUserMessage(userId, sessionId, content, meta = null) {
    if (!userId || !sessionId) return;
    try {
      await this.redis.addMessage(userId, sessionId, "user", content, meta);
    } catch (err) {
      console.warn("⚠️ ConversationMemory: saveUserMessage failed:", err.message);
    }
  }

  /**
   * Lưu tin nhắn trợ lý ảo vào Redis
   */
  async saveAssistantMessage(userId, sessionId, content, functionCalls = null) {
    if (!userId || !sessionId) return;
    try {
      await this.redis.addMessage(
        userId,
        sessionId,
        "assistant",
        content,
        functionCalls && functionCalls.length > 0 ? functionCalls : null
      );
    } catch (err) {
      console.warn("⚠️ ConversationMemory: saveAssistantMessage failed:", err.message);
    }
  }

  /**
   * Lấy tóm tắt các sản phẩm đã xem trong session
   */
  async getSessionSummary(userId, sessionId, limit = 10) {
    if (!userId || !sessionId) return null;
    try {
      const meta = await this.redis.getSessionMeta(userId, sessionId);
      let lastViewed = [];

      if (Array.isArray(meta)) {
        lastViewed = meta;
      } else if (meta && Array.isArray(meta.lastViewedProducts)) {
        lastViewed = meta.lastViewedProducts;
      } else if (meta && Array.isArray(meta.last_viewed_products)) {
        lastViewed = meta.last_viewed_products;
      }

      if (!lastViewed || lastViewed.length === 0) return null;

      const productList = lastViewed.slice(0, limit).map((p, idx) => {
        const name = p.name || p.title || "(sản phẩm)";
        const price = p.price ? ` - ${new Intl.NumberFormat("vi-VN").format(p.price)} VNĐ` : "";
        return `${idx + 1}. ${name}${price}`;
      });

      return `SẢN PHẨM ĐÃ XEM: ${productList.join("; ")} | Tổng: ${lastViewed.length} sản phẩm`;
    } catch (err) {
      console.warn("⚠️ ConversationMemory: getSessionSummary error:", err.message);
      return null;
    }
  }

  /**
   * Lưu danh sách sản phẩm vừa xem
   */
  async saveLastViewedProducts(userId, sessionId, products) {
    if (!userId || !sessionId || !Array.isArray(products) || products.length === 0) return;
    try {
      const slim = products.map((p) => ({
        id: p.id || p._id?.toString(),
        name: p.name,
        price: p.price,
      }));
      await this.redis.setSessionMeta(userId, sessionId, { lastViewedProducts: slim });
    } catch (err) {
      console.warn("⚠️ ConversationMemory: saveLastViewedProducts error:", err.message);
    }
  }
}

export const conversationMemory = new ConversationMemory();
