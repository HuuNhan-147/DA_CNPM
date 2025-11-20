// utils/aiAgent/actions/productTools.js
import Product from "../../../models/ProductModel.js";
import redisChat from "../../../services/redisChatService.js";

// ✅ SỬA TÊN FUNCTION: searchProduct → searchProducts
export async function searchProducts({
  keyword,
  category,
  minPrice,
  maxPrice,
  limit = 10,
  userId = null,
}) {
  try {
    console.log(`🔍 Searching products:`, { keyword, category, limit });

    const query = {};

    // Build search query
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
        { brand: { $regex: keyword, $options: "i" } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const products = await Product.find(query)
      .limit(limit)
      .select("name price image category countInStock rating brand")
      .lean();

    console.log(`✅ Found ${products.length} products for "${keyword}"`);

    // Format response
    const productData = products.map((product) => ({
      id: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      brand: product.brand,
      inStock: product.countInStock > 0,
      rating: product.rating,
    }));

    // Persist last viewed products to session if userId is provided
    try {
      if (userId) {
        await _saveLastViewed(userId, productData);
      }
    } catch (e) {
      console.warn(
        "Could not persist last viewed in searchProducts:",
        e.message
      );
    }

    return {
      success: true,
      data: productData,
      total: products.length,
      message: `Tìm thấy ${products.length} sản phẩm cho "${keyword}"`,
    };
  } catch (error) {
    console.error("❌ Lỗi tìm kiếm sản phẩm:", error);
    return {
      success: false,
      error: "Không thể tìm kiếm sản phẩm",
      data: [],
      total: 0,
    };
  }
}

// ✅ THÊM DESCRIPTION
searchProducts.description =
  "Tìm kiếm sản phẩm theo từ khóa, danh mục, khoảng giá";

export async function getProductDetail({ productId }) {
  try {
    console.log(`📖 Getting product detail:`, { productId });

    const product = await Product.findById(productId)
      .select("name price image category countInStock rating brand description")
      .lean();

    if (!product) {
      return {
        success: false,
        error: "Không tìm thấy sản phẩm",
      };
    }

    return {
      success: true,
      data: product,
      message: `Thông tin sản phẩm: ${product.name}`,
    };
  } catch (error) {
    console.error("❌ Lỗi lấy chi tiết sản phẩm:", error);
    return {
      success: false,
      error: "Không thể lấy thông tin sản phẩm",
    };
  }
}

getProductDetail.description = "Lấy thông tin chi tiết sản phẩm theo ID";

// Save last viewed product(s) to session meta for follow-up actions (e.g., "thêm con thứ 2 vào giỏ")
export async function _saveLastViewed(userId, products) {
  try {
    if (!userId) return null;
    // store lightweight product info
    const slim = products.map((p) => ({
      id: p.id?.toString ? p.id.toString() : p.id,
      name: p.name,
      price: p.price,
    }));
    await redisChat.setSessionMeta(userId, null, { lastViewedProducts: slim });
    return slim;
  } catch (e) {
    console.warn("Could not save last viewed products to session:", e.message);
    return null;
  }
}
