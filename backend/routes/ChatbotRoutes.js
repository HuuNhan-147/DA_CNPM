import express from "express"; // Sử dụng import thay vì require
import askQuestion from "../utils/chatbot.js";

const router = express.Router();

// Endpoint chatbot
router.post("/", async (req, res) => {
  const { question } = req.body; // Lấy câu hỏi từ body request

  if (!question) {
    return res.status(400).json({ error: "Câu hỏi không được để trống" });
  }

  try {
    const response = await askQuestion(question); // Gọi hàm chatbot để nhận phản hồi
    res.json({ response }); // Trả về phản hồi cho frontend
  } catch (error) {
    res.status(500).json({ error: "Đã có lỗi xảy ra khi xử lý yêu cầu" });
  }
});

export default router; // Sử dụng export default thay vì module.exports
