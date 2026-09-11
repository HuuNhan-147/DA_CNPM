import express from "express";
import { runAgent } from "../modules/ai-agent/index.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, async (req, res) => {
  try {
    const userId = req.user?._id?.toString();
    const { message, sessionId } = req.body;
    const token = req.headers.authorization?.replace("Bearer ", "") || null;

    console.log(`📱 Client request:`, { 
      userId, 
      message, 
      sessionId: sessionId || 'none',
      messageLength: message?.length || 0
    });

    const result = await runAgent(
      message,
      [], // context
      userId,
      token, 
      sessionId
    );

    // ✅ THÊM DEBUG LOG QUAN TRỌNG
    console.log(`📱 Agent result from core:`, { 
      success: result.success,
      hasPayload: !!result.payload,
      productCount: result.payload?.products?.length || 0,
      sessionId: result.sessionId,
      iterations: result.iterations
    });

    // ✅ TRẢ VỀ ĐẦY ĐỦ TẤT CẢ DỮ LIỆU
    res.json({
      success: result.success,
      reply: result.reply,
      sessionId: result.sessionId,
      requiresAuth: result.requiresAuth,
      payload: result.payload, // ✅ QUAN TRỌNG: Thêm dòng này
      iterations: result.iterations, // ✅ Thêm
      resolvedReference: result.resolvedReference, // ✅ Thêm
      hasPayload: result.hasPayload, // ✅ Thêm
      productCount: result.productCount // ✅ Thêm
    });

    console.log(`📤 Sent to client:`, {
      success: result.success,
      hasPayload: !!result.payload,
      productCount: result.payload?.products?.length || 0
    });

  } catch (error) {
    console.error('❌ AI Agent route error:', error);
    res.status(500).json({ 
      success: false,
      reply: "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại!",
      sessionId: null,
      payload: null
    });
  }
});

export default router;