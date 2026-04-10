import mongoose from "mongoose";



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
    specifications: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Specification",
      },
    ],

    /* ⭐ ĐÁNH GIÁ */
    rating: {
      type: Number,
      default: 0,
    },

    numReviews: {
      type: Number,
      default: 0,
    },

    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
  },
  { timestamps: true }
);

/* =======================
   MODEL EXPORT
======================= */
const Product = mongoose.model("Product", productSchema);
export default Product;
