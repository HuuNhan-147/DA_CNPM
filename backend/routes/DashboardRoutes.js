import express from "express";
import {
  getDashboardStats,
  getMonthlyRevenue,
  getTopSellingProducts,
  getLatestOrders,
  getLatestUsers,
  getOrderStatusStats,
} from "../controller/DashboardController.js";

import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Middleware bảo vệ: chỉ admin mới truy cập được
// Định nghĩa các route
router.get("/stats", protect, admin, getDashboardStats); // Tổng quan dashboard
router.get("/monthly-revenue", protect, admin, getMonthlyRevenue); // Doanh thu theo tháng
router.get("/top-products", protect, admin, getTopSellingProducts); // Top bán chạy
router.get("/latest-orders", protect, admin, getLatestOrders); // Đơn mới nhất
router.get("/latest-users", protect, admin, getLatestUsers); // Người dùng mới nhất
router.get("/order-status", protect, admin, getOrderStatusStats); // Trạng thái đơn hàng

export default router;
