import mongoose from "mongoose";

const categorySchema = mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  image: { type: String }, // đường dẫn ảnh (banner nhỏ)
});

const Category = mongoose.model("Category", categorySchema);
export default Category;
