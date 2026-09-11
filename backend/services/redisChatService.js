// services/redisChatService.js
import { getRedisClient } from '../config/redis.js';

/**
 * ✅ REDIS KEY NAMING CONVENTION
 * 
 * chat:session:{userId}:{sessionId}        → Session metadata
 * chat:messages:{userId}:{sessionId}       → List of messages
 * chat:active:{userId}                     → Set of active sessionIds
 * chat:stats:{userId}                      → User statistics
 */

class RedisChatService {
  constructor() {
    this.TTL = {
      SESSION: 7 * 24 * 60 * 60, // 7 days
      MESSAGES: 7 * 24 * 60 * 60, // 7 days
      ACTIVE_SESSIONS: 30 * 24 * 60 * 60, // 30 days
    };
  }

  /**
   * Lấy redis client và kiểm tra trạng thái hoạt động
   */
  getRedis() {
    try {
      return getRedisClient();
    } catch (e) {
      console.warn("⚠️ Cannot get Redis client, fallback to memory:", e.message);
      return null;
    }
  }

  // Tạo hoặc lấy session
  async getOrCreateSession(userId, sessionId = null) {
    const redis = this.getRedis();
    if (!sessionId) {
      sessionId = `${userId}_${Date.now()}`;
    }

    if (!redis) {
      console.warn(`⚠️ Redis offline: Using temporary memory session ${sessionId}`);
      return sessionId;
    }

    try {
      const sessionKey = `chat:session:${userId}:${sessionId}`;
      const exists = await redis.exists(sessionKey);

      if (!exists) {
        const sessionData = {
          sessionId,
          userId,
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          messageCount: 0,
        };
        await redis.hSet(sessionKey, sessionData);
        await redis.expire(sessionKey, this.TTL.SESSION);

        await redis.sAdd(`chat:active:${userId}`, sessionId);
        await redis.expire(`chat:active:${userId}`, this.TTL.ACTIVE_SESSIONS);

        console.log(`✅ Created new Redis session: ${sessionId}`);
      } else {
        await redis.hSet(sessionKey, 'lastActivity', new Date().toISOString());
        await redis.expire(sessionKey, this.TTL.SESSION);
      }
    } catch (err) {
      console.error("❌ Redis error in getOrCreateSession:", err.message);
    }

    return sessionId;
  }

  // Set/merge session meta
  async setSessionMeta(userId, sessionId = null, metaPatch = {}) {
    const redis = this.getRedis();
    if (!sessionId) sessionId = await this.getOrCreateSession(userId);
    
    if (!redis) {
      return metaPatch;
    }

    try {
      const sessionKey = `chat:session:${userId}:${sessionId}`;
      const existing = await redis.hGet(sessionKey, 'meta');
      let meta = {};
      try { meta = existing ? JSON.parse(existing) : {}; } catch (e) { meta = {}; }

      meta = { ...meta, ...metaPatch };

      await redis.hSet(sessionKey, { meta: JSON.stringify(meta), lastActivity: new Date().toISOString() });
      await redis.expire(sessionKey, this.TTL.SESSION);
      return meta;
    } catch (err) {
      console.error("❌ Redis error in setSessionMeta:", err.message);
      return metaPatch;
    }
  }

  // Get session meta
  async getSessionMeta(userId, sessionId = null) {
    const redis = this.getRedis();
    if (!sessionId) sessionId = await this.getOrCreateSession(userId);
    
    if (!redis) {
      return {};
    }

    try {
      const sessionKey = `chat:session:${userId}:${sessionId}`;
      const raw = await redis.hGet(sessionKey, 'meta');
      try { return raw ? JSON.parse(raw) : {}; } catch (e) { return {}; }
    } catch (err) {
      console.error("❌ Redis error in getSessionMeta:", err.message);
      return {};
    }
  }

  // Thêm message vào session
  async addMessage(userId, sessionId, role, content, functionCalls = null) {
    const message = {
      role,
      content,
      timestamp: new Date().toISOString(),
      functionCalls: functionCalls ? JSON.stringify(functionCalls) : null,
    };

    const redis = this.getRedis();
    if (!redis) {
      console.warn(`⚠️ Redis offline: Message not saved in history (${role})`);
      return message;
    }

    try {
      const messagesKey = `chat:messages:${userId}:${sessionId}`;
      const sessionKey = `chat:session:${userId}:${sessionId}`;

      await redis.rPush(messagesKey, JSON.stringify(message));
      await redis.expire(messagesKey, this.TTL.MESSAGES);

      const messageCount = await redis.lLen(messagesKey);
      await redis.hSet(sessionKey, {
        lastActivity: new Date().toISOString(),
        messageCount: messageCount.toString(),
      });
      await redis.expire(sessionKey, this.TTL.SESSION);

      console.log(`📝 Added message to Redis: ${role} - ${sessionId}`);
    } catch (err) {
      console.error("❌ Redis error in addMessage:", err.message);
    }

    return message;
  }

  // Lấy messages của session
  async getMessages(userId, sessionId, limit = 50, offset = 0) {
    const redis = this.getRedis();
    if (!redis) {
      return [];
    }

    try {
      const messagesKey = `chat:messages:${userId}:${sessionId}`;
      const exists = await redis.exists(messagesKey);
      if (!exists) {
        return [];
      }

      const start = -limit - offset;
      const end = offset === 0 ? -1 : -offset - 1;

      const messages = await redis.lRange(messagesKey, start, end);
      return messages.map((msg) => JSON.parse(msg));
    } catch (err) {
      console.error("❌ Redis error in getMessages:", err.message);
      return [];
    }
  }

  // Lấy danh sách active sessions
  async getActiveSessions(userId) {
    const redis = this.getRedis();
    if (!redis) {
      return [];
    }

    try {
      const activeKey = `chat:active:${userId}`;
      const sessionIds = await redis.sMembers(activeKey);

      const sessions = await Promise.all(
        sessionIds.map(async (sessionId) => {
          const sessionKey = `chat:session:${userId}:${sessionId}`;
          const data = await redis.hGetAll(sessionKey);

          if (Object.keys(data).length === 0) {
            await redis.sRem(activeKey, sessionId);
            return null;
          }

          return {
            sessionId,
            lastActivity: data.lastActivity,
            messageCount: parseInt(data.messageCount || 0),
            createdAt: data.createdAt,
          };
        })
      );

      return sessions.filter(Boolean).sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
    } catch (err) {
      console.error("❌ Redis error in getActiveSessions:", err.message);
      return [];
    }
  }

  // Xóa session
  async deleteSession(userId, sessionId) {
    const redis = this.getRedis();
    if (!redis) return;

    try {
      const sessionKey = `chat:session:${userId}:${sessionId}`;
      const messagesKey = `chat:messages:${userId}:${sessionId}`;
      const activeKey = `chat:active:${userId}`;

      await redis.del(sessionKey);
      await redis.del(messagesKey);
      await redis.sRem(activeKey, sessionId);

      console.log(`🗑️ Deleted Redis session: ${sessionId}`);
    } catch (err) {
      console.error("❌ Redis error in deleteSession:", err.message);
    }
  }

  // Tìm kiếm trong messages
  async searchMessages(userId, keyword, limit = 20) {
    const redis = this.getRedis();
    if (!redis) return [];

    try {
      const sessions = await this.getActiveSessions(userId);
      const results = [];

      for (const session of sessions) {
        const messages = await this.getMessages(userId, session.sessionId, 100, 0);
        const matches = messages.filter((msg) => msg.content.toLowerCase().includes(keyword.toLowerCase()));

        if (matches.length > 0) {
          results.push({
            sessionId: session.sessionId,
            matches,
            lastActivity: session.lastActivity,
          });
        }

        if (results.length >= limit) break;
      }

      return results;
    } catch (err) {
      console.error("❌ Redis error in searchMessages:", err.message);
      return [];
    }
  }

  // Get statistics
  async getStats(userId) {
    const redis = this.getRedis();
    if (!redis) {
      return { totalActiveSessions: 0, totalMessages: 0, lastActivity: null };
    }

    try {
      const sessions = await this.getActiveSessions(userId);
      const totalMessages = sessions.reduce((sum, s) => sum + s.messageCount, 0);

      return {
        totalActiveSessions: sessions.length,
        totalMessages,
        lastActivity: sessions[0]?.lastActivity || null,
      };
    } catch (err) {
      console.error("❌ Redis error in getStats:", err.message);
      return { totalActiveSessions: 0, totalMessages: 0, lastActivity: null };
    }
  }

  // Xóa tất cả sessions của user
  async deleteAllSessions(userId) {
    const redis = this.getRedis();
    if (!redis) return;

    try {
      const sessions = await this.getActiveSessions(userId);
      for (const session of sessions) {
        await this.deleteSession(userId, session.sessionId);
      }
      console.log(`🗑️ Deleted all sessions for user ${userId}`);
    } catch (err) {
      console.error("❌ Redis error in deleteAllSessions:", err.message);
    }
  }
}

export default new RedisChatService();
