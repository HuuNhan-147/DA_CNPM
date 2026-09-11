// frontend/src/webmcp/tools/cartMcpTools.ts
// ============================================
// WEBMCP CART CAPABILITIES — Expose quản lý giỏ hàng trên trình duyệt
// ============================================

import { WebMCPToolDefinition } from "../types/WebMCPTypes";
import {
  addToCart,
  getCart,
  removeFromCart,
  updateCartItem,
  getCartItemCount,
} from "../../api/CartApi";

export const addToCartMcpTool: WebMCPToolDefinition = {
  name: "add_to_cart",
  description: "Thêm sản phẩm vào giỏ hàng của người dùng",
  inputSchema: {
    type: "object",
    properties: {
      productId: { type: "string", description: "ID của sản phẩm cần thêm" },
      quantity: { type: "number", description: "Số lượng (mặc định: 1)" },
    },
    required: ["productId"],
  },
  execute: async (args) => {
    const result = await addToCart(args.productId, Number(args.quantity) || 1);
    return {
      success: true,
      message: "Đã thêm sản phẩm vào giỏ hàng",
      cart: result,
    };
  },
};

export const getCartMcpTool: WebMCPToolDefinition = {
  name: "get_cart",
  description: "Xem danh sách các sản phẩm đang có trong giỏ hàng",
  inputSchema: {
    type: "object",
    properties: {},
  },
  execute: async () => {
    const result = await getCart();
    return {
      success: true,
      cart: result,
    };
  },
};

export const removeFromCartMcpTool: WebMCPToolDefinition = {
  name: "remove_from_cart",
  description: "Xóa sản phẩm khỏi giỏ hàng",
  inputSchema: {
    type: "object",
    properties: {
      productId: { type: "string", description: "ID sản phẩm cần xóa" },
    },
    required: ["productId"],
  },
  execute: async (args) => {
    const result = await removeFromCart(args.productId);
    return {
      success: true,
      message: "Đã xóa sản phẩm khỏi giỏ hàng",
      cart: result,
    };
  },
};

export const updateCartMcpTool: WebMCPToolDefinition = {
  name: "update_cart",
  description: "Cập nhật số lượng sản phẩm trong giỏ hàng",
  inputSchema: {
    type: "object",
    properties: {
      productId: { type: "string", description: "ID sản phẩm cần cập nhật" },
      quantity: { type: "number", description: "Số lượng mới (>= 1)" },
    },
    required: ["productId", "quantity"],
  },
  execute: async (args) => {
    const result = await updateCartItem(args.productId, Number(args.quantity) || 1);
    return {
      success: true,
      message: "Đã cập nhật số lượng thành công",
      cart: result,
    };
  },
};

export const getCartCountMcpTool: WebMCPToolDefinition = {
  name: "get_cart_count",
  description: "Lấy tổng số lượng sản phẩm có trong giỏ hàng",
  inputSchema: {
    type: "object",
    properties: {},
  },
  execute: async () => {
    const result = await getCartItemCount();
    return {
      success: true,
      count: result?.count || 0,
    };
  },
};

export const cartMcpTools = [
  addToCartMcpTool,
  getCartMcpTool,
  removeFromCartMcpTool,
  updateCartMcpTool,
  getCartCountMcpTool,
];
