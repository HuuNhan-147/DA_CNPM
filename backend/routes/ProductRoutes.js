import express from "express";
import multer from "multer";
import path from "path";
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

const router = express.Router();

// ✅ Cấu hình Multer để lưu ảnh sản phẩm
const storage = multer.diskStorage({
  destination: "uploads/", // Thư mục lưu ảnh
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Tạo tên file ngẫu nhiên
  },
});
const upload = multer({ storage });

// 🛒 **Quản lý sản phẩm**
router.get("/", getAllProducts); // 📌 Lấy danh sách sản phẩm
router.get("/search", getProducts); // 🔍 Tìm kiếm & lọc sản phẩm
router.get("/:id", getProductById); // 📌 Lấy chi tiết sản phẩm theo ID

// 🛠️ **Chỉ Admin có quyền thêm/sửa/xóa sản phẩm**
router.post("/", protect, admin, upload.single("image"), createProduct); // ➕ Thêm sản phẩm
router.put("/:id", protect, admin, upload.single("image"), updateProduct); // ✏️ Cập nhật sản phẩm
router.delete("/:id", protect, admin, deleteProduct); // ❌ Xóa sản phẩm

// ⭐ **Quản lý đánh giá sản phẩm**
router.post("/:id/reviews", protect, addReview); // ✍️ Thêm đánh giá (yêu cầu đăng nhập)
router.get("/:id/reviews", getReviews); // 📄 Lấy danh sách đánh giá sản phẩm

export default router;
