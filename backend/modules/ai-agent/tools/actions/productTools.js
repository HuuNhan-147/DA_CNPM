// modules/ai-agent/tools/actions/productTools.js
import * as productService from "../../../../services/ProductService.js";
import { conversationMemory } from "../../memory/ConversationMemory.js";

/**
 * Tìm kiếm sản phẩm thông qua ProductService
 */
export async function searchProducts({
  keyword,
  category,
  minPrice,
  maxPrice,
  limit = 10,
  userId = null,
  sessionId = null,
}) {
  try {
    const products = await productService.getProducts({
      keyword,
      category,
      minPrice,
      maxPrice,
    });

    const limited = products.slice(0, limit);
    const productData = limited.map((product) => ({
      id: product._id.toString(),
      name: product.name,
      price: product.price,
      image: product.image,
      categoryName: product.category?.name || "Khác",
      inStock: product.countInStock > 0,
      rating: product.rating,
      countInStock: product.countInStock,
      description: product.description,
    }));

    // Lưu vào context memory để AI có thể tham chiếu "nó", "con thứ 2"
    if (userId && sessionId && productData.length > 0) {
      await conversationMemory.saveLastViewedProducts(userId, sessionId, productData);
    }

    return {
      success: true,
      data: productData,
      total: products.length,
      message: `Tìm thấy ${products.length} sản phẩm`,
    };
  } catch (error) {
    console.error("❌ searchProducts tool error:", error.message);
    return { success: false, data: [], total: 0, message: error.message };
  }
}

/**
 * Lấy chi tiết sản phẩm kèm thông số và đánh giá thông qua ProductService
 */
export async function getProductDetail({ productId }) {
  try {
    if (!productId) throw new Error("Thiếu ID sản phẩm");

    const product = await productService.getProductById(productId);
    if (!product) return { success: false, message: "Không tìm thấy sản phẩm" };

    return {
      success: true,
      data: product,
      message: `Đã tìm thấy thông tin chi tiết của ${product.name}`,
    };
  } catch (error) {
    console.error("❌ getProductDetail tool error:", error.message);
    return { success: false, error: error.message };
  }
}
