import Product from "../models/ProductModel.js";
import asyncHandler from "express-async-handler";
import Category from "../models/CategoryModel.js";
const parseFormData = (data) => {
  if (typeof data === "string") {
    data = data.replace(/^"|"$/g, ""); // Xóa dấu `"`
    if (!isNaN(data)) return Number(data); // Chuyển sang số nếu có thể
  }
  return data;
};

// 🔹 1. Lấy tất cả sản phẩm
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate("category", "name");
    // "category" là khóa liên kết, "name" là trường cần lấy từ Category

    const updatedProducts = products.map((product) => ({
      ...product._doc,
      category: product.category ? product.category.name : "Không có danh mục", // Kiểm tra category trước khi truy cập name
      image: product.image
        ? `${req.protocol}://${req.get("host")}${product.image}`
        : "",
    }));

    res.status(200).json(updatedProducts);
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

    product.image = product.image
      ? `${req.protocol}://${req.get("host")}${product.image}`
      : "";

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
};

// 🔹 3. Thêm sản phẩm (Admin)
export const createProduct = asyncHandler(async (req, res) => {
  try {
    console.log("🟢 req.body:", req.body);
    console.log("🟢 req.file:", req.file);

    let { name, price, category, rating, countInStock, description } = req.body;

    // Chuyển đổi dữ liệu từ form-data
    name = parseFormData(name);
    price = parseFormData(price);
    category = parseFormData(category);
    rating = parseFormData(rating);
    countInStock = parseFormData(countInStock);
    description = parseFormData(description);

    if (
      !name ||
      isNaN(price) ||
      !category ||
      isNaN(rating) ||
      isNaN(countInStock) ||
      !description
    ) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập đầy đủ thông tin sản phẩm!" });
    }

    // ✅ Kiểm tra danh mục có tồn tại trong database không
    const existingCategory = await Category.findById(category);
    if (!existingCategory) {
      return res.status(400).json({
        message: "Danh mục không hợp lệ! Vui lòng chọn danh mục có sẵn.",
      });
    }

    // Lưu đường dẫn ảnh (nếu có)
    const imagePath = req.file
      ? `/uploads/${req.file.filename}`
      : "/uploads/default.jpg";

    // ✅ Tạo sản phẩm mới
    const product = new Product({
      name,
      price,
      image: imagePath,

      category: existingCategory._id, // Chỉ lưu ID của danh mục
      rating,
      countInStock,
      description,
    });

    const savedProduct = await product.save();

    res.status(201).json({
      message: "Sản phẩm đã được thêm thành công!",
      product: {
        ...savedProduct._doc,
        image: `${req.protocol}://${req.get("host")}${savedProduct.image}`,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
});

// 🔹 4. Cập nhật sản phẩm (Admin)
export const updateProduct = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại!" });
    }

    // Lấy dữ liệu từ req.body
    let { name, price, category, rating, countInStock, description } = req.body;

    // Chuyển đổi dữ liệu từ form-data nếu có
    if (name !== undefined) product.name = parseFormData(name);
    if (price !== undefined) product.price = parseFloat(parseFormData(price));
    if (rating !== undefined)
      product.rating = parseFloat(parseFormData(rating));
    if (countInStock !== undefined)
      product.countInStock = parseInt(parseFormData(countInStock));
    if (description !== undefined)
      product.description = parseFormData(description);

    // Kiểm tra danh mục nếu có
    if (category !== undefined) {
      category = parseFormData(category);
      const existingCategory = await Category.findById(category);
      if (!existingCategory) {
        return res.status(400).json({ message: "Danh mục không hợp lệ!" });
      }
      product.category = existingCategory._id;
    }

    // Nếu có ảnh mới, cập nhật ảnh
    if (req.file) {
      product.image = `/uploads/${req.file.filename}`;
    }

    const updatedProduct = await product.save();

    res.status(200).json({
      message: "Sản phẩm đã được cập nhật thành công!",
      product: {
        ...updatedProduct._doc,
        image: `${req.protocol}://${req.get("host")}${updatedProduct.image}`,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
});

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

    // 🔍 Tìm kiếm theo tên sản phẩm
    if (keyword && keyword.trim() !== "") {
      filter.name = { $regex: keyword, $options: "i" };
    }

    // 📂 Lọc theo danh mục
    if (category && category.trim() !== "") {
      filter.category = category;
    }

    // 💲 Lọc theo giá (chỉ thêm nếu có giá trị hợp lệ)
    if (
      (minPrice && minPrice.trim() !== "" && !isNaN(minPrice)) ||
      (maxPrice && maxPrice.trim() !== "" && !isNaN(maxPrice))
    ) {
      filter.price = {};
      if (minPrice && minPrice.trim() !== "" && !isNaN(minPrice)) {
        filter.price.$gte = Number(minPrice);
      }
      if (maxPrice && maxPrice.trim() !== "" && !isNaN(maxPrice)) {
        filter.price.$lte = Number(maxPrice);
      }
    }

    // ⭐ Lọc theo đánh giá
    if (rating && rating.trim() !== "" && !isNaN(rating)) {
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
        sortOption.sold = -1; // Bán chạy nhất
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
