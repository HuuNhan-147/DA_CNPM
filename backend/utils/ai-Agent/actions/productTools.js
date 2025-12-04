import Product from "../../../models/ProductModel.js";
import redisChat from "../../../services/redisChatService.js";

export async function searchProducts({
  keyword,
  category,
  minPrice,
  maxPrice,
  limit = 10,
  userId = null,
  sessionId = null  // ✅ THÊM sessionId parameter
}) {
  try {
    console.log(`🔍 Searching products:`, { keyword, category, limit, userId, sessionId });

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
    const base = process.env.SERVER_BASE_URL || "";
    const productData = products.map((product) => ({
      id: product._id.toString(),  // ✅ ĐẢM BẢO là string
      name: product.name,
      price: product.price,
      image: product.image ? (product.image.startsWith('http') ? product.image : `${base}${product.image}`) : null,
      category: product.category,
      brand: product.brand,
      inStock: product.countInStock > 0,
      rating: product.rating,
    }));

    // ✅ FIX: Persist last viewed products với sessionId cụ thể
    try {
      if (userId && sessionId) {
        console.log(`💾 Saving ${productData.length} products to session: ${sessionId}`);
        await _saveLastViewed(userId, sessionId, productData);
      } else {
        console.warn(`⚠️ Cannot save last viewed - missing userId or sessionId`);
      }
    } catch (e) {
      console.warn("Could not persist last viewed in searchProducts:", e.message);
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
searchProducts.description = "Tìm kiếm sản phẩm theo từ khóa, danh mục, khoảng giá";

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

// ✅ FIX: Save last viewed products với sessionId cụ thể
export async function _saveLastViewed(userId, sessionId, products) {
  try {
    if (!userId || !sessionId) {
      console.warn(`⚠️ Missing userId or sessionId for saving last viewed`);
      return null;
    }
    
    // store lightweight product info
    const slim = products.map((p) => ({
      id: p.id?.toString ? p.id.toString() : p.id,
      name: p.name,
      price: p.price,
    }));
    
    console.log(`💾 Saving to Redis: userId=${userId}, sessionId=${sessionId}, products=${slim.length}`);
    
    // ✅ FIX: Truyền sessionId cụ thể
    await redisChat.setSessionMeta(userId, sessionId, { 
      lastViewedProducts: slim,
      lastUpdated: new Date().toISOString()
    });
    
    console.log(`✅ Successfully saved ${slim.length} products to session meta`);
    return slim;
  } catch (e) {
    console.error("❌ Error saving last viewed products to session:", e.message);
    return null;
  }
}