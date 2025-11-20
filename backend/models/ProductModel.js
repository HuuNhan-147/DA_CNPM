import mongoose from "mongoose";
const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Người đánh giá
    name: { type: String, required: true }, // Tên người đánh giá
    rating: { type: Number, required: true, min: 1, max: 5 }, // Số sao (1-5)
    comment: { type: String, required: true }, // Nội dung bình luận
  },
  { timestamps: true }
);
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    price: { type: Number, required: true }, // lưu integer VNĐ, ví dụ 38490000
    image: { type: String, required: true },
    category: {
      type: mongoose.Schema.Types.ObjectId, // ✅ Đúng kiểu dữ liệu
      ref: "Category", // ✅ Liên kết với bảng Category
      required: true,
    },
    rating: { type: Number, default: 0 },
    countInStock: { type: Number, required: true },
    description: { type: String, required: true },
    numReviews: { type: Number, default: 0 }, // Số lượng đánh giá
    reviews: [reviewSchema], // Danh sách đánh giá
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);
export default Product;
