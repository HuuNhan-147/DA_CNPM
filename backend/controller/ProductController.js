import Product from "../models/ProductModel.js";
import asyncHandler from "express-async-handler";
// 🔹 1. Lấy tất cả sản phẩm
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
};

// 🔹 2. Lấy sản phẩm theo ID
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại!" });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
};

// 🔹 3. Thêm sản phẩm (Admin)
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      image,
      type,
      category,
      rating,
      countInStock,
      description,
    } = req.body;

    const product = new Product({
      name,
      price,
      image,
      type,
      category,
      rating,
      countInStock,
      description,
    });

    const savedProduct = await product.save();
    res.status(201).json({
      message: "Sản phẩm đã được thêm thành công!",
      product: savedProduct,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
};

// 🔹 4. Cập nhật sản phẩm (Admin)
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại!" });
    }

    Object.assign(product, req.body);
    const updatedProduct = await product.save();
    res.status(201).json({
      message: "Sản phẩm đã được cập nhật thành công!",
      product: updatedProduct,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
};

// 🔹 5. Xóa sản phẩm (Admin)
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại!" });
    }
    res.status(200).json({ message: "Xóa sản phẩm thành công!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
};

// ✅ Tìm kiếm, lọc & sắp xếp sản phẩm
export const getProducts = asyncHandler(async (req, res) => {
  try {
    const { keyword, category, minPrice, maxPrice, rating, sortBy } = req.query;

    let filter = {}; // Điều kiện tìm kiếm

    // 🔍 Tìm kiếm theo tên sản phẩm (không phân biệt hoa thường)
    if (keyword) {
      filter.name = { $regex: keyword, $options: "i" };
    }

    // 📂 Lọc theo danh mục
    if (category) {
      filter.category = category;
    }

    // 💲 Lọc theo giá
    if (!isNaN(minPrice) || !isNaN(maxPrice)) {
      filter.price = {};
      if (!isNaN(minPrice)) filter.price.$gte = Number(minPrice); // Giá ≥ minPrice
      if (!isNaN(maxPrice)) filter.price.$lte = Number(maxPrice); // Giá ≤ maxPrice
    }

    // ⭐ Lọc theo đánh giá (rating)
    if (!isNaN(rating)) {
      filter.rating = { $gte: Number(rating) };
    }

    // 🔀 Xử lý sắp xếp
    let sortOption = {};
    switch (sortBy) {
      case "priceLowHigh":
        sortOption.price = 1; // Giá tăng dần
        break;
      case "priceHighLow":
        sortOption.price = -1; // Giá giảm dần
        break;
      case "latest":
        sortOption.createdAt = -1; // Sản phẩm mới nhất
        break;
      case "bestSelling":
        sortOption.sold = -1; // Bán chạy nhất (giả sử có trường `sold`)
        break;
      default:
        sortOption.createdAt = -1; // Mặc định: mới nhất
    }

    // 🔥 Truy vấn MongoDB
    const products = await Product.find(filter).sort(sortOption);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});
// ⭐ Thêm đánh giá cho sản phẩm
export const addReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const productId = req.params.id;

  const product = await Product.findById(productId);

  if (product) {
    // Kiểm tra xem user đã đánh giá chưa
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({ message: "Bạn đã đánh giá sản phẩm này!" });
    }

    // Tạo đánh giá mới
    const review = {
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      comment,
    };

    product.reviews.push(review); // Thêm vào danh sách đánh giá
    product.numReviews = product.reviews.length; // Cập nhật số lượng đánh giá

    // Tính điểm trung bình
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.numReviews;

    await product.save();
    res.status(201).json({ message: "Đánh giá thành công!" });
  } else {
    res.status(404).json({ message: "Không tìm thấy sản phẩm!" });
  }
});
// 📄 Lấy danh sách đánh giá của sản phẩm
export const getReviews = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).select("reviews");

  if (product) {
    res.json(product.reviews);
  } else {
    res.status(404).json({ message: "Không tìm thấy sản phẩm!" });
  }
});

// ✅ Tìm kiếm sản phẩm bằng giọng nói
export const searchProducts = async (req, res) => {
  try {
    const { query } = req.body; // Nhận văn bản tìm kiếm

    if (!query) {
      return res.status(400).json({ message: "Thiếu từ khóa tìm kiếm!" });
    }

    const products = await Product.find({
      name: { $regex: query, $options: "i" },
    });

    res.json(products);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi tìm kiếm sản phẩm!", error: error.message });
  }
};
