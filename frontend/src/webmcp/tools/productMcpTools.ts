// frontend/src/webmcp/tools/productMcpTools.ts
// ============================================
// WEBMCP PRODUCT CAPABILITIES — Expose tìm kiếm và chi tiết sản phẩm
// ============================================

import { WebMCPToolDefinition } from "../types/WebMCPTypes";
import { fetchProducts } from "../../api/productSearchApi";
import { fetchProductDetails } from "../../api/productApi";

export const searchProductsMcpTool: WebMCPToolDefinition = {
  name: "search_products",
  description: "Tìm kiếm sản phẩm trên sàn thương mại điện tử qua từ khóa, danh mục hoặc khoảng giá",
  inputSchema: {
    type: "object",
    properties: {
      keyword: { type: "string", description: "Từ khóa tìm kiếm (tên sản phẩm, thương hiệu)" },
      category: { type: "string", description: "ID danh mục (không bắt buộc)" },
      minPrice: { type: "number", description: "Giá tối thiểu" },
      maxPrice: { type: "number", description: "Giá tối đa" },
    },
    required: ["keyword"],
  },
  execute: async (args) => {
    const products = await fetchProducts({
      keyword: args.keyword,
      category: args.category,
      minPrice: args.minPrice,
      maxPrice: args.maxPrice,
    });
    return {
      success: true,
      total: products.length,
      data: products.map((p) => ({
        id: p._id,
        name: p.name,
        price: p.price,
        image: p.image,
        categoryName: p.category,
        rating: p.rating,
        inStock: p.countInStock > 0,
      })),
    };
  },
};

export const getProductDetailMcpTool: WebMCPToolDefinition = {
  name: "get_product_detail",
  description: "Lấy thông tin chi tiết của một sản phẩm cụ thể theo ID",
  inputSchema: {
    type: "object",
    properties: {
      productId: { type: "string", description: "ID của sản phẩm" },
    },
    required: ["productId"],
  },
  execute: async (args) => {
    const product = await fetchProductDetails(args.productId);
    return {
      success: true,
      data: product,
    };
  },
};

export const productMcpTools = [searchProductsMcpTool, getProductDetailMcpTool];
