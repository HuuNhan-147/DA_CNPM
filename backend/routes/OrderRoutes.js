import express from "express";
import {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getUserOrders,
  deleteOrder,
} from "../controller/OrderController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Route tạo đơn hàng (Chỉ dành cho người dùng đã đăng nhập)
router.post("/", protect, createOrder);

// Route lấy tất cả đơn hàng (Dành cho Admin)
router.get("/", protect, admin, getAllOrders);

// Route lấy danh sách đơn hàng của người dùng (Chỉ dành cho người dùng đã đăng nhập)
router.get("/me", protect, getUserOrders); // Đổi từ "/get" thành "/me"

// Route lấy chi tiết đơn hàng (Chỉ dành cho người dùng đã đăng nhập và Admin, kiểm tra quyền)
router.get("/:id", protect, getOrderById);

// Route xóa đơn hàng (Chỉ dành cho Admin)
router.delete("/:id", protect, deleteOrder);

// Route cập nhật trạng thái thanh toán (Chỉ dành cho người dùng đã đăng nhập)
router.put("/:id/pay", protect, updateOrderToPaid);

// Route cập nhật trạng thái giao hàng (Chỉ dành cho Admin)
router.put("/:id/deliver", protect, admin, updateOrderToDelivered);

export default router;
