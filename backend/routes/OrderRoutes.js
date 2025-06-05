import express from "express";
import {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getUserOrders,
  deleteOrder,
  updateOrderStatus,
  searchOrders,
  searchOrdersByUserName,
} from "../controller/OrderController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Route tạo đơn hàng (Chỉ dành cho người dùng đã đăng nhập)
router.post("/", protect, createOrder);

// Route lấy tất cả đơn hàng (Dành cho Admin)
router.get("/", protect, admin, getAllOrders);

// Route lấy danh sách đơn hàng của người dùng (Chỉ dành cho người dùng đã đăng nhập)
router.get("/me", protect, getUserOrders);
router.get("/search", searchOrders);
router.get("/search-user",searchOrdersByUserName);
// Route lấy chi tiết đơn hàng (Chỉ dành cho người dùng đã đăng nhập và Admin)
router.get("/:id", protect, getOrderById);

// Route cập nhật trạng thái thanh toán (Chỉ dành cho người dùng đã đăng nhập)
router.put("/:id/pay", protect, updateOrderToPaid);

// Route cập nhật trạng thái giao hàng (Chỉ dành cho Admin)
router.put("/:id/deliver", protect, admin, updateOrderToDelivered);

// Route cập nhật trạng thái đơn hàng (Chỉ dành cho Admin)
router.put("/:id/status", protect, admin, updateOrderStatus);

// Route xóa đơn hàng (Chỉ dành cho Admin)
router.delete("/:id", protect, deleteOrder);
export default router;
