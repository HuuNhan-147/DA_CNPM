import Product from "../models/ProductModel.js";
import Category from "../models/CategoryModel.js";
import Review from "../models/ReviewModel.js";
import Specification from "../models/SpecificationModel.js";

export const getAllProducts = async () => {
  const products = await Product.find()
    .populate("category", "name")
    .populate("specifications")
    .populate("reviews");

  return products.map((product) => ({
    ...product._doc,
    category: product.category ? product.category.name : "Không có danh mục",
    image: product.image || "",
  }));
};

export const getProductById = async (id) => {
  const product = await Product.findById(id)
    .populate("category", "name")
    .populate("specifications")
    .populate("reviews");

  if (!product) {
    throw new Error("Sản phẩm không tồn tại!");
  }

  return {
    ...product._doc,
    image: product.image || "",
  };
};

export const createProduct = async (data, file) => {
  const { name, price, category, rating = 0, countInStock, description, specifications } = data;

  if (!name || !price || !category || !countInStock) {
    throw new Error("Thiếu thông tin sản phẩm!");
  }

  const existingCategory = await Category.findById(category);
  if (!existingCategory) {
    throw new Error("Danh mục không hợp lệ!");
  }

  if (!file || !file.path) {
    throw new Error("Upload ảnh thất bại!");
  }

  let parsedSpecifications = [];
  if (specifications) {
    try {
      parsedSpecifications = typeof specifications === "string" ? JSON.parse(specifications) : specifications;
    } catch {
      parsedSpecifications = [];
    }
  }

  const product = new Product({
    name: name.trim(),
    price: Number(price),
    image: file.path,
    category: existingCategory._id,
    rating: Number(rating),
    countInStock: Number(countInStock),
    description: description?.trim() || "",
  });

  if (parsedSpecifications.length > 0) {
    const specsToInsert = parsedSpecifications.map(s => ({
      ...s,
      product: product._id
    }));
    const insertedDocs = await Specification.insertMany(specsToInsert);
    product.specifications = insertedDocs.map(d => d._id);
  }

  return await product.save();
};

export const updateProduct = async (id, data, file) => {
  const product = await Product.findById(id);
  if (!product) {
    throw new Error("Sản phẩm không tồn tại!");
  }

  let { name, price, category, rating, countInStock, description, specifications } = data;

  if (name !== undefined) product.name = name;
  if (price !== undefined) product.price = parseFloat(price);
  if (rating !== undefined) product.rating = parseFloat(rating);
  if (countInStock !== undefined) product.countInStock = parseInt(countInStock);
  if (description !== undefined) product.description = description;

  if (specifications !== undefined) {
    if (typeof specifications === "string") {
      specifications = JSON.parse(specifications);
    }
    await Specification.deleteMany({ product: product._id });
    if (specifications && specifications.length > 0) {
      const specsToInsert = specifications.map(s => ({
        ...s,
        product: product._id
      }));
      const insertedDocs = await Specification.insertMany(specsToInsert);
      product.specifications = insertedDocs.map(d => d._id);
    } else {
      product.specifications = [];
    }
  }

  if (category !== undefined) {
    const existingCategory = await Category.findById(category);
    if (!existingCategory) {
      throw new Error("Danh mục không hợp lệ!");
    }
    product.category = existingCategory._id;
  }

  if (file) {
    product.image = file.path;
  }

  return await product.save();
};

export const deleteProduct = async (id) => {
  const product = await Product.findByIdAndDelete(id);
  if (!product) {
    throw new Error("Sản phẩm không tồn tại!");
  }
  await Specification.deleteMany({ product: id });
  await Review.deleteMany({ product: id });
  return product;
};

export const getProducts = async (query) => {
  const { keyword, category, minPrice, maxPrice, rating, sortBy } = query;
  let filter = {};

  if (keyword) filter.name = { $regex: keyword, $options: "i" };
  if (category) filter.category = category;

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  if (rating) filter.rating = { $gte: Number(rating) };

  let sortOption = { createdAt: -1 };
  if (sortBy === "priceLowHigh") sortOption.price = 1;
  if (sortBy === "priceHighLow") sortOption.price = -1;
  if (sortBy === "latest") sortOption.createdAt = -1;

  return await Product.find(filter)
    .sort(sortOption)
    .populate("category", "name")
    .populate("specifications")
    .populate("reviews");
};

export const addReview = async (productId, user, reviewData) => {
  const { rating, comment } = reviewData;
  const product = await Product.findById(productId).populate("reviews");

  if (!product) {
    throw new Error("Không tìm thấy sản phẩm!");
  }

  const alreadyReviewed = product.reviews.find(
    (r) => r.user.toString() === user._id.toString()
  );

  if (alreadyReviewed) {
    throw new Error("Bạn đã đánh giá sản phẩm này!");
  }

  const review = new Review({
    product: product._id,
    user: user._id,
    name: user.name,
    rating: Number(rating),
    comment,
  });

  const savedReview = await review.save();

  product.reviews.push(savedReview._id);
  product.numReviews = product.reviews.length;
  
  const allReviews = await Review.find({ product: product._id });
  product.rating = allReviews.reduce((acc, item) => acc + item.rating, 0) / product.numReviews;

  await product.save();
  return { message: "Đánh giá thành công!" };
};

export const getReviews = async (productId) => {
  const product = await Product.findById(productId).populate("reviews");
  if (!product) {
    throw new Error("Không tìm thấy sản phẩm!");
  }
  return product.reviews;
};
