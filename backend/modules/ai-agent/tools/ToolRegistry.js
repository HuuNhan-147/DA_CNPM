// modules/ai-agent/tools/ToolRegistry.js
// ============================================
// TOOL REGISTRY — Quản lý Danh mục AgentTool & Tích hợp ToolResolver
// ============================================

import { AgentTool } from "./AgentTool.js";
import { toolResolver } from "./ToolResolver.js";
import { searchProducts, getProductDetail } from "./actions/productTools.js";
import {
  addToCart,
  addFromLastViewed,
  getCart,
  removeFromCart,
  updateCart,
  getCartCount,
} from "./actions/cartTools.js";
import {
  createOrder,
  getOrderDetail,
  getUserOrders,
  cancelOrder,
} from "./actions/orderTools.js";
import { getUserProfile, updateUserProfile } from "./actions/userTools.js";
import { createVnPayPayment } from "./actions/paymentTools.js";

// Khởi tạo các AgentTool instances
export const toolInstances = [
  new AgentTool({
    name: "search_products",
    description: "🔍 BẮT BUỘC gọi tool này KHI NÀO: (1) User muốn TÌM/SEARCH sản phẩm, (2) User hỏi về sản phẩm cụ thể, (3) TRƯỚC KHI thêm sản phẩm vào giỏ. Ví dụ trigger: 'tìm iPhone', 'có iPhone không', 'xem điện thoại', 'thêm iPhone vào giỏ'.",
    inputSchema: {
      type: "object",
      properties: {
        keyword: { type: "string", description: "Từ khóa tìm kiếm (tên sản phẩm, thương hiệu...)" },
        category: { type: "string", description: "Danh mục sản phẩm (không bắt buộc)" },
        minPrice: { type: "number", description: "Giá tối thiểu (không bắt buộc)" },
        maxPrice: { type: "number", description: "Giá tối đa (không bắt buộc)" },
      },
      required: ["keyword"],
    },
    execute: (args, context) => searchProducts({ ...args, ...context }),
  }),

  new AgentTool({
    name: "get_product_detail",
    description: "Lấy thông tin chi tiết của một sản phẩm cụ thể theo ID",
    inputSchema: {
      type: "object",
      properties: {
        productId: { type: "string", description: "ID của sản phẩm" },
      },
      required: ["productId"],
    },
    execute: (args) => getProductDetail(args),
  }),

  new AgentTool({
    name: "add_to_cart",
    description: "Thêm sản phẩm vào giỏ hàng. QUAN TRỌNG: Phải có productId (lấy từ search_products). Không được hỏi user về productId.",
    inputSchema: {
      type: "object",
      properties: {
        productId: { type: "string", description: "ID của sản phẩm cần thêm" },
        quantity: { type: "number", description: "Số lượng sản phẩm (mặc định: 1)" },
      },
      required: ["productId"],
    },
    execute: (args, context) => addToCart({ ...args, ...context }),
  }),

  new AgentTool({
    name: "add_from_last_viewed",
    description: "Thêm sản phẩm vào giỏ dựa trên danh sách sản phẩm vừa xem (ví dụ: 'lấy con thứ 2'). Sử dụng chỉ số 1-based.",
    inputSchema: {
      type: "object",
      properties: {
        index: { type: "number", description: "1-based index trong danh sách lastViewedProducts" },
        quantity: { type: "number", description: "Số lượng (mặc định: 1)" },
      },
      required: ["index"],
    },
    execute: (args, context) => addFromLastViewed({ ...args, ...context }),
  }),

  new AgentTool({
    name: "get_cart",
    description: "Xem các sản phẩm hiện có trong giỏ hàng của người dùng",
    inputSchema: {
      type: "object",
      properties: {},
    },
    execute: (args, context) => getCart({ ...args, ...context }),
  }),

  new AgentTool({
    name: "remove_from_cart",
    description: "Xóa một sản phẩm khỏi giỏ hàng",
    inputSchema: {
      type: "object",
      properties: {
        productId: { type: "string", description: "ID của sản phẩm cần xóa" },
      },
      required: ["productId"],
    },
    execute: (args, context) => removeFromCart({ ...args, ...context }),
  }),

  new AgentTool({
    name: "update_cart",
    description: "Cập nhật số lượng của một sản phẩm trong giỏ hàng",
    inputSchema: {
      type: "object",
      properties: {
        productId: { type: "string", description: "ID của sản phẩm cần cập nhật" },
        quantity: { type: "number", description: "Số lượng mới (phải >= 1)" },
      },
      required: ["productId", "quantity"],
    },
    execute: (args, context) => updateCart({ ...args, ...context }),
  }),

  new AgentTool({
    name: "get_cart_count",
    description: "Lấy tổng số lượng sản phẩm trong giỏ hàng",
    inputSchema: {
      type: "object",
      properties: {},
    },
    execute: (args, context) => getCartCount({ ...args, ...context }),
  }),

  new AgentTool({
    name: "create_order",
    description: "Tạo đơn hàng mới từ các sản phẩm trong giỏ hàng hiện tại",
    inputSchema: {
      type: "object",
      properties: {
        shippingAddress: {
          type: "object",
          description: "Thông tin địa chỉ giao hàng",
          properties: {
            fullname: { type: "string", description: "Tên người nhận" },
            phone: { type: "string", description: "Số điện thoại" },
            address: { type: "string", description: "Địa chỉ cụ thể" },
            city: { type: "string", description: "Tỉnh/Thành phố" },
          },
          required: ["fullname", "phone", "address", "city"],
        },
        paymentMethod: {
          type: "string",
          enum: ["COD", "VNPay", "MoMo"],
          description: "Phương thức thanh toán (mặc định: COD)",
        },
      },
      required: ["shippingAddress"],
    },
    execute: (args, context) => createOrder({ ...args, ...context }),
  }),

  new AgentTool({
    name: "get_order_detail",
    description: "Lấy thông tin chi tiết của một đơn hàng cụ thể theo mã đơn hoặc ID",
    inputSchema: {
      type: "object",
      properties: {
        orderId: {
          type: "string",
          description: "ID đơn hàng (MongoDB ObjectId) hoặc Mã đơn hàng (orderCode, vd: DH123456-789)",
        },
      },
      required: ["orderId"],
    },
    execute: (args, context) => getOrderDetail({ ...args, ...context }),
  }),

  new AgentTool({
    name: "get_user_orders",
    description: "Lấy danh sách các đơn hàng đã đặt của người dùng",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", description: "Lọc theo trạng thái (pending, delivered, cancelled...)" },
      },
    },
    execute: (args, context) => getUserOrders({ ...args, ...context }),
  }),

  new AgentTool({
    name: "cancel_order",
    description: "Hủy đơn hàng của người dùng (chỉ khi đơn chưa thanh toán)",
    inputSchema: {
      type: "object",
      properties: {
        orderIdentifier: {
          type: "string",
          description: "Mã đơn hàng (DH...) hoặc MongoDB _id của đơn hàng cần hủy",
        },
      },
      required: ["orderIdentifier"],
    },
    execute: (args, context) => cancelOrder({ ...args, ...context }),
  }),

  new AgentTool({
    name: "create_vnpay_payment",
    description: "Tạo URL thanh toán VNPay cho đơn hàng cụ thể",
    inputSchema: {
      type: "object",
      properties: {
        orderIdentifier: {
          type: "string",
          description: "Mã đơn hàng (DH...) hoặc ID đơn hàng cần thanh toán",
        },
        bankCode: { type: "string", description: "Mã ngân hàng (NCB, VCB... Không bắt buộc)" },
        language: { type: "string", description: "Ngôn ngữ giao diện thanh toán (mặc định: vn)" },
      },
      required: ["orderIdentifier"],
    },
    execute: (args, context) => createVnPayPayment({ ...args, ...context }),
  }),

  new AgentTool({
    name: "get_user_profile",
    description: "Lấy thông tin hồ sơ của người dùng hiện tại",
    inputSchema: {
      type: "object",
      properties: {},
    },
    execute: (args, context) => getUserProfile({ ...args, ...context }),
  }),

  new AgentTool({
    name: "update_user_profile",
    description: "Cập nhật thông tin hồ sơ người dùng (tên, số điện thoại)",
    inputSchema: {
      type: "object",
      properties: {
        updates: {
          type: "object",
          properties: {
            name: { type: "string", description: "Họ và tên mới" },
            phone: { type: "string", description: "Số điện thoại mới" },
          },
        },
      },
      required: ["updates"],
    },
    execute: (args, context) => updateUserProfile({ ...args, ...context }),
  }),
];

// Map lookup nhanh theo name
const toolMap = new Map();
toolInstances.forEach((tool) => toolMap.set(tool.name, tool));

// Object mapping tương thích ngược
export const tools = {};
toolInstances.forEach((tool) => {
  tools[tool.name] = (args, context) => tool.execute(args, context);
});

export function getToolDeclarations() {
  return toolInstances.map((tool) => tool.getDeclaration());
}

export class ToolRegistry {
  static getTools() {
    return tools;
  }

  static getTool(name) {
    return toolMap.get(name) || null;
  }

  static getDeclarations() {
    return getToolDeclarations();
  }

  /**
   * Thực thi tool qua ToolResolver (hỗ trợ Dual-Path: WebMCP / Local Service)
   */
  static async executeTool(name, params = {}, context = {}) {
    const tool = toolMap.get(name);
    if (!tool) {
      throw new Error(`Tool "${name}" không tồn tại trong ToolRegistry.`);
    }
    return await toolResolver.resolveAndExecute(tool, params, context);
  }
}
