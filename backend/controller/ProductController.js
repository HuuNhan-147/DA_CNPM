import * as productService from "../services/ProductService.js";
import asyncHandler from "express-async-handler";

const parseFormData = (data) => {
  if (typeof data === "string") {
    data = data.replace(/^"|"$/g, "");
    if (!isNaN(data)) return Number(data);
  }
  return data;
};

export const getAllProducts = async (req, res) => {
  try {
    const products = await productService.getAllProducts();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    res.status(200).json(product);
  } catch (error) {
    res.status(error.message === "Sản phẩm không tồn tại!" ? 404 : 500).json({ 
      message: error.message || "Lỗi server!" 
    });
  }
};

export const createProduct = asyncHandler(async (req, res) => {
  try {
    const savedProduct = await productService.createProduct(req.body, req.file);
    res.status(201).json({
      message: "Thêm sản phẩm thành công!",
      product: savedProduct,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export const updateProduct = asyncHandler(async (req, res) => {
  try {
    const updatedProduct = await productService.updateProduct(req.params.id, req.body, req.file);
    res.status(200).json({
      message: "Cập nhật sản phẩm thành công!",
      product: updatedProduct,
    });
  } catch (error) {
    const status = error.message === "Sản phẩm không tồn tại!" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
});

export const deleteProduct = async (req, res) => {
  try {
    await productService.deleteProduct(req.params.id);
    res.json({ message: "Xóa sản phẩm thành công!" });
  } catch (error) {
    res.status(error.message === "Sản phẩm không tồn tại!" ? 404 : 500).json({ 
      message: error.message 
    });
  }
};

export const getProducts = asyncHandler(async (req, res) => {
  try {
    const products = await productService.getProducts(req.query);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
});

export const addReview = asyncHandler(async (req, res) => {
  try {
    const result = await productService.addReview(req.params.id, req.user, req.body);
    res.status(201).json(result);
  } catch (error) {
    const status = error.message === "Không tìm thấy sản phẩm!" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
});

export const getReviews = asyncHandler(async (req, res) => {
  try {
    const reviews = await productService.getReviews(req.params.id);
    res.json(reviews);
  } catch (error) {
    res.status(error.message === "Không tìm thấy sản phẩm!" ? 404 : 500).json({ 
      message: error.message 
    });
  }
});
