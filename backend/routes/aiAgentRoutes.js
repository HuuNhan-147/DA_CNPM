import express from "express";
import { aiAgent } from "../utils/ai-Agent/index.js";
import { getContext, updateContext } from "../utils/ai-Agent/contextManager.js";
import { protect } from "../middleware/authMiddleware.js";
import redisChat from "../services/redisChatService.js";

const router = express.Router();

// Protected agent endpoint: requires valid Bearer token. `protect` sets req.user
router.post("/", protect, async (req, res) => {
  try {
    const userId = req.user?._id?.toString();
    const { message } = req.body;

    // Load per-user context (in-memory or Redis depending on contextManager implementation)
    const context = await getContext(userId);

    // Also load session meta (lastViewedProducts) from Redis and append to context so the LLM
    // can resolve pronouns like "nó" or ordinal references "con thứ 2".
    try {
      const meta = await redisChat.getSessionMeta(userId);
      if (meta && Array.isArray(meta.lastViewedProducts) && meta.lastViewedProducts.length > 0) {
        // Build a short textual summary
        const summary = meta.lastViewedProducts
          .map((p, i) => `${i + 1}) ${p.name} (id:${p.id}, giá:${p.price || 'N/A'})`)
          .join('\n');

        // Add as an assistant message so it's included in the LLM context
        context.push({ role: 'assistant', content: `SESSION_LAST_VIEWED:\n${summary}` });
      }
    } catch (e) {
      console.warn('Could not load session meta for ai-agent:', e.message);
    }

    // Extract token from header (forward to agent/tools that might need it)
    const token = req.headers.authorization?.replace("Bearer ", "") || null;

    const reply = await aiAgent.run(message, context, userId, token);

    // Persist context back (in case agent modified it)
    await updateContext(userId, context);

    res.json(reply);
  } catch (error) {
    console.error('aiAgent route error:', error);
    res.status(500).json({ error: "AI Agent error" });
  }
});

export default router;
