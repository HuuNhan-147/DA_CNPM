import mongoose from "mongoose";

/* =======================
   REVIEW SCHEMA
======================= */
const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },      // tên người đánh giá
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: { type: String, required: true },   // nội dung đánh giá
  },
  { timestamps: true }
);

/* =======================
   SPECIFICATION SCHEMA
   (THÔNG SỐ KỸ THUẬT)
======================= */
const specificationSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,        // VD: RAM, CPU, Pin
    },
    value: {
      type: String,
      required: true,        // VD: 16, A17 Pro
    },
    unit: {
      type: String,          // VD: GB, mAh, inch
    },
    group: {
      type: String,          // VD: Cấu hình, Màn hình
    },
  },
  { _id: false }
);

/* =======================
   PRODUCT SCHEMA
======================= */
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,        // lưu VNĐ dạng số nguyên
    },

    image: {
      type: String,
      required: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    countInStock: {
      type: Number,
      required: true,
      default: 0,
    },

    /* ⭐ THÔNG SỐ KỸ THUẬT */
    specifications: [specificationSchema],

    /* ⭐ ĐÁNH GIÁ */
    rating: {
      type: Number,
      default: 0,
    },

    numReviews: {
      type: Number,
      default: 0,
    },

    reviews: [reviewSchema],
  },
  { timestamps: true }
);

/* =======================
   MODEL EXPORT
======================= */
const Product = mongoose.model("Product", productSchema);
export default Product;
