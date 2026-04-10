import Category from "../models/CategoryModel.js";

export const getCategories = async () => {
  return await Category.find({}, "name description");
};

export const getCategoryById = async (id) => {
  const category = await Category.findById(id);
  if (!category) throw new Error("Danh mục không tồn tại!");
  return category;
};

export const createCategory = async (name, description) => {
  if (!name) throw new Error("Tên là bắt buộc!");

  const categoryExists = await Category.findOne({ name });
  if (categoryExists) throw new Error("Danh mục đã tồn tại!");

  const category = new Category({
    name,
    description: description || "",
  });

  return await category.save();
};

export const updateCategory = async (id, name, description) => {
  const category = await Category.findById(id);
  if (!category) throw new Error("Danh mục không tồn tại!");

  category.name = name || category.name;
  category.description = description || category.description;

  return await category.save();
};

export const deleteCategory = async (id) => {
  const category = await Category.findById(id);
  if (!category) throw new Error("Danh mục không tồn tại!");

  await category.deleteOne();
  return true;
};
