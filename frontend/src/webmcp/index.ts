// frontend/src/webmcp/index.ts
// ============================================
// WEBMCP CLIENT RUNTIME — Entry point đăng ký capabilities trên trình duyệt
// ============================================

import { webMcpManager } from "./WebMCPManager";
import { productMcpTools } from "./tools/productMcpTools";
import { cartMcpTools } from "./tools/cartMcpTools";
import { orderMcpTools } from "./tools/orderMcpTools";
import { paymentMcpTools } from "./tools/paymentMcpTools";
import { userMcpTools } from "./tools/userMcpTools";

let isInitialized = false;

export function initWebMCP() {
  if (isInitialized) return webMcpManager;

  console.log("🚀 [WebMCP] Bắt đầu khởi tạo và đăng ký E-Commerce Capabilities...");

  // Đăng ký Product Tools
  productMcpTools.forEach((tool) => webMcpManager.registerTool(tool));

  // Đăng ký Cart Tools
  cartMcpTools.forEach((tool) => webMcpManager.registerTool(tool));

  // Đăng ký Order Tools
  orderMcpTools.forEach((tool) => webMcpManager.registerTool(tool));

  // Đăng ký Payment Tools
  paymentMcpTools.forEach((tool) => webMcpManager.registerTool(tool));

  // Đăng ký User Tools
  userMcpTools.forEach((tool) => webMcpManager.registerTool(tool));

  isInitialized = true;
  console.log(`✅ [WebMCP] Đã đăng ký thành công ${webMcpManager.getTools().length} tools trên trình duyệt!`);

  return webMcpManager;
}

// Tự động khởi tạo khi module được import trên client
if (typeof window !== "undefined") {
  initWebMCP();
}

export { webMcpManager };
export * from "./types/WebMCPTypes";
