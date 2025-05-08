import express from "express";
import {
  createUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  deleteUser,
  updateUserByAdmin,
  getAllUsers,
  forgotPassword,
  getUserOrders,
  resetPasswordPage,
  resetPassword,
  updatePassword,
  getUserById,
  searchUsers,
} from "../controller/UserController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Đăng ký tài khoản
router.post("/register", createUser);

// ✅ Đăng nhập
router.post("/login", loginUser);

// ✅ Lấy thông tin cá nhân (cần xác thực)
router.get("/profile", protect, getUserProfile);

// ✅ Cập nhật hồ sơ cá nhân (cần xác thực)
router.put("/profile", protect, updateUserProfile);

// ✅ Cập nhật mật khẩu (cần xác thực)
router.put("/update-password", protect, updatePassword);

// ✅ Lấy danh sách đơn hàng của user (cần xác thực)
router.get("/order", protect, getUserOrders);

// ✅ Quên mật khẩu - gửi email để lấy lại mật khẩu
router.post("/forgot-password", forgotPassword);

// ✅ Hiển thị trang reset mật khẩu (sử dụng token từ email)
router.get("/reset-password/:token", resetPasswordPage);

// ✅ Thực hiện reset mật khẩu với token
router.post("/reset-password/:token", resetPassword);

// ✅ Lấy danh sách tất cả người dùng (Chỉ Admin)
router.get("/", protect, admin, getAllUsers);

// ✅ Xóa người dùng (Chỉ Admin)
router.delete("/:id", protect, admin, deleteUser);

// ✅ Cập nhật thông tin người dùng (Chỉ Admin)
router.put("/:id", protect, admin, updateUserByAdmin);

// ✅ Lấy thông tin người dùng theo ID (Chỉ Admin hoặc người dùng chính xác)
router.get("/search", protect, admin, searchUsers);
router.get("/:id", protect, admin, getUserById);

export default router;
