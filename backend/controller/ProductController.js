import Product from "../models/ProductModel.js";
import Category from "../models/CategoryModel.js";
import asyncHandler from "express-async-handler";

/* ======================
   UTILS
====================== */
const parseFormData = (data) => {
  if (typeof data === "string") {
    data = data.replace(/^"|"$/g, "");
    if (!isNaN(data)) return Number(data);
  }
  return data;
};

/* ======================
   1. GET ALL PRODUCTS
====================== */
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate("category", "name");

    const updatedProducts = products.map((product) => ({
      ...product._doc,
      category: product.category
        ? product.category.name
        : "Không có danh mục",
      image: product.image || "", // ✅ Cloudinary URL
    }));

    res.status(200).json(updatedProducts);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
};

/* ======================
   2. GET PRODUCT BY ID
====================== */
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category", "name");

    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại!" });
    }

    res.status(200).json({
      ...product._doc,
      image: product.image || "",
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
};

/* ======================
   3. CREATE PRODUCT
====================== */
export const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    price,
    category,
    rating = 0,
    countInStock,
    description,
    specifications,
  } = req.body;

  // ❌ KHÔNG parseFormData
  // multer + cloudinary đã xử lý xong

  if (!name || !price || !category || !countInStock) {
    return res.status(400).json({ message: "Thiếu thông tin sản phẩm!" });
  }

  const existingCategory = await Category.findById(category);
  if (!existingCategory) {
    return res.status(400).json({ message: "Danh mục không hợp lệ!" });
  }

  // ✅ BẮT BUỘC CÓ ẢNH
  if (!req.file || !req.file.path) {
    return res.status(400).json({ message: "Upload ảnh thất bại!" });
  }

  let parsedSpecifications = [];
  if (specifications) {
    try {
      parsedSpecifications = JSON.parse(specifications);
    } catch {
      parsedSpecifications = [];
    }
  }

  const product = new Product({
    name: name.trim(),
    price: Number(price),
    image: req.file.path, // ✅ CLOUDINARY URL
    category: existingCategory._id,
    rating: Number(rating),
    countInStock: Number(countInStock),
    description: description?.trim() || "",
    specifications: parsedSpecifications,
  });

  const savedProduct = await product.save();

  res.status(201).json({
    message: "Thêm sản phẩm thành công!",
    product: savedProduct,
  });
});

/* ======================
   4. UPDATE PRODUCT
====================== */
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ message: "Sản phẩm không tồn tại!" });
  }

  let {
    name,
    price,
    category,
    rating,
    countInStock,
    description,
    specifications,
  } = req.body;

  if (name !== undefined) product.name = parseFormData(name);
  if (price !== undefined)
    product.price = parseFloat(parseFormData(price));
  if (rating !== undefined)
    product.rating = parseFloat(parseFormData(rating));
  if (countInStock !== undefined)
    product.countInStock = parseInt(parseFormData(countInStock));
  if (description !== undefined)
    product.description = parseFormData(description);

  if (specifications !== undefined) {
    if (typeof specifications === "string") {
      specifications = JSON.parse(specifications);
    }
    product.specifications = specifications;
  }

  if (category !== undefined) {
    const existingCategory = await Category.findById(category);
    if (!existingCategory) {
      return res.status(400).json({ message: "Danh mục không hợp lệ!" });
    }
    product.category = existingCategory._id;
  }

  // ✅ Nếu có upload ảnh mới → ghi đè URL Cloudinary
  if (req.file) {
    product.image = req.file.path;
  }

  const updatedProduct = await product.save();

  res.status(200).json({
    message: "Cập nhật sản phẩm thành công!",
    product: updatedProduct,
  });
});

/* ======================
   5. DELETE PRODUCT
====================== */
export const deleteProduct = async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Sản phẩm không tồn tại!" });
  }
  res.json({ message: "Xóa sản phẩm thành công!" });
};

/* ======================
   6. SEARCH / FILTER
====================== */
export const getProducts = asyncHandler(async (req, res) => {
  const { keyword, category, minPrice, maxPrice, rating, sortBy } = req.query;
  let filter = {};

  if (keyword) {
    filter.name = { $regex: keyword, $options: "i" };
  }

  if (category) {
    filter.category = category;
  }

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  if (rating) {
    filter.rating = { $gte: Number(rating) };
  }

  let sortOption = { createdAt: -1 };
  if (sortBy === "priceLowHigh") sortOption.price = 1;
  if (sortBy === "priceHighLow") sortOption.price = -1;
  if (sortBy === "latest") sortOption.createdAt = -1;

  const products = await Product.find(filter).sort(sortOption);
  res.json(products);
});

/* ======================
   7. ADD REVIEW
====================== */
export const addReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ message: "Không tìm thấy sản phẩm!" });
  }

  const alreadyReviewed = product.reviews.find(
    (r) => r.user.toString() === req.user._id.toString()
  );

  if (alreadyReviewed) {
    return res.status(400).json({ message: "Bạn đã đánh giá sản phẩm này!" });
  }

  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  };

  product.reviews.push(review);
  product.numReviews = product.reviews.length;
  product.rating =
    product.reviews.reduce((acc, item) => acc + item.rating, 0) /
    product.numReviews;

  await product.save();
  res.status(201).json({ message: "Đánh giá thành công!" });
});

/* ======================
   8. GET REVIEWS
====================== */
export const getReviews = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).select("reviews");
  if (!product) {
    return res.status(404).json({ message: "Không tìm thấy sản phẩm!" });
  }
  res.json(product.reviews);
});
