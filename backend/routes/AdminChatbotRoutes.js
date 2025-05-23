// routes/chatbotAdmin.js
import express from "express";
import askAdminQuestion from "../utils/AdminChatbot.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Middleware bảo vệ admin mới dùng được chatbot admin
router.post("/", protect, admin, async (req, res) => {
  const { question } = req.body;
  const token = req.headers.authorization?.split(" ")[1];

  if (!question) {
    return res.status(400).json({ error: "Câu hỏi không được để trống" });
  }

  try {
    const response = await askAdminQuestion(question, token);
    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: "Đã có lỗi xảy ra khi xử lý yêu cầu" });
  }
});

export default router;
