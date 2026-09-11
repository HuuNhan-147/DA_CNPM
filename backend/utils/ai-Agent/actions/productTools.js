import Product from "../../../models/ProductModel.js";
import redisChat from "../../../services/redisChatService.js";

/**
 * ✅ CẬP NHẬT: Tìm kiếm sản phẩm đồng bộ với kiến trúc mới
 */
export async function searchProducts({
  keyword,
  category,
  minPrice,
  maxPrice,
  limit = 10,
  userId = null,
  sessionId = null
}) {
  try {
    const query = {};

    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ];
    }

    if (category) query.category = category;

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const products = await Product.find(query)
      .limit(limit)
      .populate("category", "name") // Lấy tên danh mục
      .lean();

    const base = process.env.SERVER_BASE_URL || "";
    const productData = products.map((product) => ({
      id: product._id.toString(),
      name: product.name,
      price: product.price,
      image: product.image,
      categoryName: product.category?.name || "Khác",
      inStock: product.countInStock > 0,
      rating: product.rating,
    }));

    // Lưu vết để AI có thể tham chiếu "nó", "sản phẩm này"
    if (userId && sessionId && productData.length > 0) {
      await _saveLastViewed(userId, sessionId, productData);
    }

    return {
      success: true,
      data: productData,
      total: products.length,
      message: `Tìm thấy ${products.length} sản phẩm`,
    };
  } catch (error) {
    console.error("❌ searchProducts error:", error.message);
    return { success: false, data: [], total: 0 };
  }
}

/**
 * ✅ CẬP NHẬT: Lấy chi tiết sản phẩm kèm Thông số kỹ thuật & Đánh giá
 */
export async function getProductDetail({ productId }) {
  try {
    if (!productId) throw new Error("Thiếu ID sảnplication phẩm");

    const product = await Product.findById(productId)
      .populate("category", "name")
      .populate("specifications") // Lấy chi tiết thông số (RAM, CPU, Pin...)
      .populate({
        path: "reviews",
        populate: { path: "user", select: "name" }, // Lấy tên người đánh giá
        options: { limit: 5, sort: { createdAt: -1 } } // Chỉ lấy 5 đánh giá mới nhất
      })
      .lean();

    if (!product) return { success: false, message: "Không tìm thấy sản phẩm" };

    return {
      success: true,
      data: product,
      message: `Đã tìm thấy thông tin chi tiết của ${product.name}`,
    };
  } catch (error) {
    console.error("❌ getProductDetail error:", error.message);
    throw error;
  }
}

export async function _saveLastViewed(userId, sessionId, products) {
  try {
    const slim = products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
    }));
    await redisChat.setSessionMeta(userId, sessionId, { 
      lastViewedProducts: slim,
      lastUpdated: new Date().toISOString()
    });
  } catch (e) {
    console.error("❌ _saveLastViewed error:", e.message);
  }
}