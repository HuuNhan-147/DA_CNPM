// frontend/src/webmcp/tools/orderMcpTools.ts
// ============================================
// WEBMCP ORDER CAPABILITIES — Expose quản lý đơn hàng trên trình duyệt
// ============================================

import { WebMCPToolDefinition } from "../types/WebMCPTypes";
import {
  createOrder,
  getOrderDetails,
  getOrders,
  cancelOrder,
} from "../../api/OrderApi";

import api from "../../config/axios";

const getToken = () => localStorage.getItem("token") || "";

export const createOrderMcpTool: WebMCPToolDefinition = {
  name: "create_order",
  description: "Tạo đơn hàng mới từ giỏ hàng hiện tại",
  inputSchema: {
    type: "object",
    properties: {
      shippingAddress: {
        type: "object",
        properties: {
          fullname: { type: "string" },
          phone: { type: "string" },
          address: { type: "string" },
          city: { type: "string" },
        },
        required: ["fullname", "phone", "address", "city"],
      },
      paymentMethod: { type: "string", enum: ["COD", "VNPay", "MoMo"] },
    },
    required: ["shippingAddress"],
  },
  execute: async (args) => {
    const token = getToken();
    if (!token) throw new Error("Bạn cần đăng nhập để đặt hàng");

    // Gọi endpoint thanh toán giỏ hàng chuẩn
    const response = await api.post("/cart/checkout", {
      shippingAddress: args.shippingAddress,
      paymentMethod: args.paymentMethod || "COD",
    });

    const data = response.data;
    return {
      success: true,
      message: data.message || "Đặt hàng thành công",
      order: data.order || data,
    };
  },
};

export const getOrderDetailMcpTool: WebMCPToolDefinition = {
  name: "get_order_detail",
  description: "Xem thông tin chi tiết của một đơn hàng",
  inputSchema: {
    type: "object",
    properties: {
      orderId: { type: "string", description: "ID đơn hàng hoặc mã đơn hàng" },
    },
    required: ["orderId"],
  },
  execute: async (args) => {
    const token = getToken();
    if (!token) throw new Error("Bạn cần đăng nhập");

    const result = await getOrderDetails(token, args.orderId);
    return {
      success: true,
      order: result.order || result,
    };
  },
};

export const getUserOrdersMcpTool: WebMCPToolDefinition = {
  name: "get_user_orders",
  description: "Lấy danh sách các đơn hàng đã đặt của người dùng",
  inputSchema: {
    type: "object",
    properties: {},
  },
  execute: async () => {
    const token = getToken();
    if (!token) throw new Error("Bạn cần đăng nhập");

    const result = await getOrders(token);
    return {
      success: true,
      orders: result.orders || result || [],
    };
  },
};

export const cancelOrderMcpTool: WebMCPToolDefinition = {
  name: "cancel_order",
  description: "Hủy một đơn hàng chưa thanh toán",
  inputSchema: {
    type: "object",
    properties: {
      orderIdentifier: { type: "string", description: "ID hoặc mã đơn hàng cần hủy" },
    },
    required: ["orderIdentifier"],
  },
  execute: async (args) => {
    const token = getToken();
    if (!token) throw new Error("Bạn cần đăng nhập");

    const result = await cancelOrder(token, args.orderIdentifier);
    return {
      success: true,
      message: "Đã hủy đơn hàng thành công",
      result,
    };
  },
};

export const orderMcpTools = [
  createOrderMcpTool,
  getOrderDetailMcpTool,
  getUserOrdersMcpTool,
  cancelOrderMcpTool,
];
