import asyncHandler from "express-async-handler";
import Category from "../models/CategoryModel.js";

// 🔹 API lấy danh sách danh mục
export const getCategories = asyncHandler(async (req, res) => {
  try {
    const categories = await Category.find({}, "name description"); // Chỉ lấy tên danh mục
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
});
// ✅ Lấy danh mục theo ID
export const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (category) {
    res.json(category);
  } else {
    res.status(404).json({ message: "Danh mục không tồn tại!" });
  }
});

// ✅ Thêm danh mục (Chỉ Admin)
export const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  // Kiểm tra tên có hợp lệ không
  if (!name) {
    return res.status(400).json({ message: "Tên là bắt buộc!" });
  }

  // Kiểm tra xem danh mục đã tồn tại chưa
  const categoryExists = await Category.findOne({ name });
  if (categoryExists) {
    return res.status(400).json({ message: "Danh mục đã tồn tại!" });
  }

  // Tạo mới danh mục
  const category = new Category({
    name,
    description: description || "", // Nếu không có mô tả, mặc định là chuỗi rỗng
  });

  try {
    const createdCategory = await category.save();
    res.status(201).json(createdCategory);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi tạo danh mục!", error: error.message });
  }
});

// ✅ Cập nhật danh mục (Chỉ Admin)
// ✅ Cập nhật danh mục (Chỉ Admin)
export const updateCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const category = await Category.findById(req.params.id);

  if (!category) {
    return res.status(404).json({ message: "Danh mục không tồn tại!" });
  }

  // Cập nhật thông tin khác
  category.name = name || category.name;
  category.description = description || category.description; // Mô tả không bắt buộc

  const updatedCategory = await category.save();
  res.json(updatedCategory);
});

// ✅ Xóa danh mục (Chỉ Admin)
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return res.status(404).json({ message: "Danh mục không tồn tại!" });
  }

  await category.deleteOne();
  res.json({ message: "Danh mục đã được xóa!" });
});
