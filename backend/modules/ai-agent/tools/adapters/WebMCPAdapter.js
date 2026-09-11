// modules/ai-agent/tools/adapters/WebMCPAdapter.js
// ============================================
// WEBMCP ADAPTER — Điều phối thực thi Tool về phía Trình duyệt (Client WebMCP)
// ============================================

import { localServiceAdapter } from "./LocalServiceAdapter.js";

export class WebMCPAdapter {
  constructor() {
    this.name = "webmcp_adapter";
    this.timeoutMs = 15000; // Thời gian chờ tối đa phản hồi từ trình duyệt (15s)
  }

  /**
   * Thực thi tool thông qua WebMCP trên trình duyệt khách hàng
   * @param {AgentTool} tool
   * @param {Object} args
   * @param {Object} context
   */
  async execute(tool, args, context) {
    const { socket, clientSupportsWebMCP } = context;

    // Nếu client không có socket hoặc không hỗ trợ WebMCP -> Tự động fallback
    if (!clientSupportsWebMCP || !socket) {
      console.log(`  🌐 [WebMCPAdapter] Client không hỗ trợ WebMCP, chuyển sang fallback LocalService...`);
      return await localServiceAdapter.execute(tool, args, context);
    }

    console.log(`  🌐 [WebMCPAdapter] Gửi yêu cầu thực thi [${tool.name}] về trình duyệt qua WebMCP...`);
    const startTime = Date.now();

    try {
      // Gửi yêu cầu ủy quyền thực thi tool tới trình duyệt qua Socket.IO
      const clientResult = await new Promise((resolve, reject) => {
        const executionId = `mcp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const eventName = `webmcp_tool_result_${executionId}`;
        const onResult = (response) => {
          clearTimeout(timer);
          resolve(response);
        };

        const timer = setTimeout(() => {
          if (typeof socket.off === "function") {
            try {
              socket.off(eventName, onResult);
            } catch (e) {
              if (typeof socket.removeAllListeners === "function") {
                socket.removeAllListeners(eventName);
              }
            }
          }
          reject(new Error(`WebMCP client execution timed out after ${this.timeoutMs}ms`));
        }, this.timeoutMs);

        // Lắng nghe kết quả trả về từ trình duyệt
        socket.once(eventName, onResult);

        // Phát sự kiện yêu cầu trình duyệt thực thi
        socket.emit("execute_webmcp_tool", {
          executionId,
          toolName: tool.name,
          args,
        });
      });

      const duration = Date.now() - startTime;
      console.log(`  ✅ [WebMCPAdapter] Trình duyệt phản hồi thành công [${tool.name}] (${duration}ms)`);

      return {
        success: clientResult.success !== false,
        source: "client_webmcp",
        ...clientResult,
      };
    } catch (error) {
      console.warn(`  ⚠️ [WebMCPAdapter] Thực thi WebMCP thất bại (${error.message}). Tự động kích hoạt Fallback!`);
      // Kích hoạt cơ chế Fallback sang Server an toàn
      return await localServiceAdapter.execute(tool, args, context);
    }
  }
}

export const webMCPAdapter = new WebMCPAdapter();
