import express from "express";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  addReview,
  getReviews,
} from "../controller/ProductController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

// ✅ IMPORT upload CLOUDINARY
import upload from "../middleware/upload.js";

const router = express.Router();

/* ======================
   🛒 PRODUCT ROUTES
====================== */

// 📌 Lấy danh sách sản phẩm
router.get("/", getAllProducts);

// 🔍 Tìm kiếm & lọc sản phẩm
router.get("/search", getProducts);

// 📌 Lấy chi tiết sản phẩm
router.get("/:id", getProductById);

// ➕ Thêm sản phẩm (Admin)
router.post(
  "/",
  protect,
  admin,
  upload.single("image"), // ✅ CLOUDINARY
  createProduct
);

// ✏️ Cập nhật sản phẩm (Admin)
router.put(
  "/:id",
  protect,
  admin,
  upload.single("image"), // ✅ CLOUDINARY
  updateProduct
);

// ❌ Xóa sản phẩm (Admin)
router.delete("/:id", protect, admin, deleteProduct);

/* ======================
   ⭐ PRODUCT REVIEWS
====================== */

// ✍️ Thêm đánh giá
router.post("/:id/reviews", protect, addReview);

// 📄 Lấy danh sách đánh giá
router.get("/:id/reviews", getReviews);

export default router;
