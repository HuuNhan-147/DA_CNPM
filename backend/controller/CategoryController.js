import asyncHandler from "express-async-handler";
import * as categoryService from "../services/CategoryService.js";

export const getCategories = asyncHandler(async (req, res) => {
  try {
    const categories = await categoryService.getCategories();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
});

export const getCategoryById = asyncHandler(async (req, res) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);
    res.json(category);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

export const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  try {
    const createdCategory = await categoryService.createCategory(name, description);
    res.status(201).json(createdCategory);
  } catch (error) {
    const status = error.message === "Tên là bắt buộc!" || error.message === "Danh mục đã tồn tại!" ? 400 : 500;
    res.status(status).json({ message: error.message });
  }
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  try {
    const updatedCategory = await categoryService.updateCategory(req.params.id, name, description);
    res.json(updatedCategory);
  } catch (error) {
    res.status(error.message === "Danh mục không tồn tại!" ? 404 : 500).json({ message: error.message });
  }
});

export const deleteCategory = asyncHandler(async (req, res) => {
  try {
    await categoryService.deleteCategory(req.params.id);
    res.json({ message: "Danh mục đã được xóa!" });
  } catch (error) {
    res.status(error.message === "Danh mục không tồn tại!" ? 404 : 500).json({ message: error.message });
  }
});
