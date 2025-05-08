import express from "express";
import {
  getCart, // ✅ Lấy giỏ hàng của người dùng
  addToCart, // ✅ Thêm sản phẩm vào giỏ hàng
  updateCartItem, // ✅ Cập nhật số lượng sản phẩm
  removeFromCart, // ✅ Xóa sản phẩm khỏi giỏ hàng
  checkout,
  getCartItemCount, // ✅ Thanh toán & tạo đơn hàng
} from "../controller/CartController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getCart); // ✅ Xem giỏ hàng
router.post("/add", protect, addToCart); // ✅ Thêm vào giỏ hàng
router.put("/update", protect, updateCartItem); // ✅ Cập nhật giỏ hàng
router.delete("/:productId", protect, removeFromCart); // ✅ Xóa sản phẩm
router.post("/checkout", protect, checkout); // ✅ Thanh toán
router.get("/count", protect, getCartItemCount);
export default router;
