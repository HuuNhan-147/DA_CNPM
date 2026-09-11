// frontend/src/webmcp/tools/paymentMcpTools.ts
// ============================================
// WEBMCP PAYMENT CAPABILITIES — Expose chức năng thanh toán trên trình duyệt
// ============================================

import { WebMCPToolDefinition } from "../types/WebMCPTypes";
import { createPaymentLink } from "../../api/OrderApi";

const getToken = () => localStorage.getItem("token") || "";

export const createVnPayPaymentMcpTool: WebMCPToolDefinition = {
  name: "create_vnpay_payment",
  description: "Tạo liên kết thanh toán VNPay cho đơn hàng",
  inputSchema: {
    type: "object",
    properties: {
      orderIdentifier: {
        type: "string",
        description: "Mã hoặc ID đơn hàng cần thanh toán VNPay",
      },
    },
    required: ["orderIdentifier"],
  },
  execute: async (args) => {
    const token = getToken();
    if (!token) throw new Error("Bạn cần đăng nhập để tạo liên kết thanh toán");

    const paymentUrl = await createPaymentLink(token, args.orderIdentifier);
    return {
      success: true,
      paymentUrl,
    };
  },
};

export const paymentMcpTools = [createVnPayPaymentMcpTool];
