// modules/ai-agent/tests/dualpath.test.js
// =============================================================
// KIỂM THỬ TỰ ĐỘNG DUAL-PATH WEBMCP & FALLBACK SERVICE (PHASE 6)
// =============================================================

import EventEmitter from "events";
import { toolResolver } from "../tools/ToolResolver.js";
import { WebMCPAdapter } from "../tools/adapters/WebMCPAdapter.js";
import { localServiceAdapter } from "../tools/adapters/LocalServiceAdapter.js";
import { ToolRegistry } from "../tools/ToolRegistry.js";
import { AgentTool } from "../tools/AgentTool.js";

class MockSocket extends EventEmitter {
  constructor() {
    super();
    this.emittedEvents = [];
  }

  emit(event, ...args) {
    this.emittedEvents.push({ event, args });
    return super.emit(event, ...args);
  }
}

async function runDualPathTests() {
  console.log("=============================================================");
  console.log("🧪 KIỂM THỬ TỰ ĐỘNG DUAL-PATH ROUTING VÀ WEBMCP FALLBACK");
  console.log("=============================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      process.exitCode = 1;
    }
  }

  // 1. Tạo Dummy Tool để kiểm thử cách ly
  const mockTool = new AgentTool({
    name: "test_mock_tool",
    description: "Mock tool phục vụ kiểm thử Dual-Path",
    inputSchema: { type: "object", properties: { query: { type: "string" } } },
    domains: ["PRODUCT"],
    execute: async (args, context) => {
      return { success: true, message: `Thực thi từ Server LocalService: ${args.query}` };
    },
  });

  // -------------------------------------------------------------
  // TEST 1: ToolResolver định tuyến đúng sang LocalService khi client không hỗ trợ WebMCP
  // -------------------------------------------------------------
  try {
    const resultNoWebMCP = await toolResolver.resolveAndExecute(
      mockTool,
      { query: "laptop dell" },
      { clientSupportsWebMCP: false }
    );
    assert(
      resultNoWebMCP.source === "server_service" && resultNoWebMCP.success === true,
      "ToolResolver định tuyến chuẩn sang LocalService khi clientSupportsWebMCP: false"
    );
  } catch (err) {
    assert(false, `Test 1 ném lỗi: ${err.message}`);
  }

  // -------------------------------------------------------------
  // TEST 2: WebMCPAdapter ủy quyền thành công cho Client Socket khi có WebMCP
  // -------------------------------------------------------------
  try {
    const mockSocket = new MockSocket();

    // Giả lập client WebMCP lắng nghe và trả kết quả
    mockSocket.on("execute_webmcp_tool", (payload) => {
      const { executionId, toolName, args } = payload;
      // Giả lập browser trả về kết quả
      mockSocket.emit(`webmcp_tool_result_${executionId}`, {
        success: true,
        data: { items: [`Sản phẩm WebMCP: ${args.query}`] },
      });
    });

    const webMcpAdapter = new WebMCPAdapter();
    const resultWebMCP = await webMcpAdapter.execute(
      mockTool,
      { query: "macbook m3" },
      { clientSupportsWebMCP: true, socket: mockSocket }
    );

    assert(
      resultWebMCP.source === "client_webmcp" && resultWebMCP.success === true,
      "WebMCPAdapter ủy quyền và nhận kết quả thành công từ Browser Client qua Socket.IO"
    );
    assert(
      mockSocket.emittedEvents.some((e) => e.event === "execute_webmcp_tool"),
      "Socket.IO đã phát đúng sự kiện 'execute_webmcp_tool'"
    );
  } catch (err) {
    assert(false, `Test 2 ném lỗi: ${err.message}`);
  }

  // -------------------------------------------------------------
  // TEST 3: Fallback Server an toàn khi Client WebMCP gặp lỗi (Error Handling)
  // -------------------------------------------------------------
  try {
    const errorSocket = new MockSocket();

    // Giả lập client WebMCP bị lỗi khi gọi API trên trình duyệt
    errorSocket.on("execute_webmcp_tool", (payload) => {
      const { executionId } = payload;
      errorSocket.emit(`webmcp_tool_result_${executionId}`, {
        success: false,
        error: "Network error on browser",
      });
    });

    const webMcpAdapter = new WebMCPAdapter();
    const fallbackResult = await webMcpAdapter.execute(
      mockTool,
      { query: "tai nghe sony" },
      { clientSupportsWebMCP: true, socket: errorSocket }
    );

    assert(
      fallbackResult.source === "client_webmcp" && fallbackResult.success === false,
      "WebMCPAdapter xử lý phản hồi lỗi từ client mà không gây sập tiến trình server"
    );
  } catch (err) {
    assert(false, `Test 3 ném lỗi: ${err.message}`);
  }

  // -------------------------------------------------------------
  // TEST 4: Tự động Fallback sang LocalService khi WebMCP bị Timeout (Timeout Fallback)
  // -------------------------------------------------------------
  try {
    const timeoutSocket = new MockSocket();
    // Giả lập client không phản hồi (treo kết nối / đóng tab)
    const fastTimeoutAdapter = new WebMCPAdapter();
    fastTimeoutAdapter.timeoutMs = 200; // Đặt timeout cực ngắn (200ms) để test

    const timeoutResult = await fastTimeoutAdapter.execute(
      mockTool,
      { query: "chuột logitech" },
      { clientSupportsWebMCP: true, socket: timeoutSocket }
    );

    assert(
      timeoutResult.source === "server_service" && timeoutResult.success === true,
      "WebMCPAdapter tự động kích hoạt Fallback sang LocalService khi Client bị Timeout"
    );
  } catch (err) {
    assert(false, `Test 4 ném lỗi: ${err.message}`);
  }

  // -------------------------------------------------------------
  // TEST 5: Fallback an toàn khi client báo có WebMCP nhưng thiếu kết nối Socket
  // -------------------------------------------------------------
  try {
    const webMcpAdapter = new WebMCPAdapter();
    const missingSocketResult = await webMcpAdapter.execute(
      mockTool,
      { query: "bàn phím cơ" },
      { clientSupportsWebMCP: true, socket: null }
    );

    assert(
      missingSocketResult.source === "server_service",
      "WebMCPAdapter tự động fallback sang LocalService khi thiếu đối tượng socket"
    );
  } catch (err) {
    assert(false, `Test 5 ném lỗi: ${err.message}`);
  }

  // -------------------------------------------------------------
  // TEST 6: ToolRegistry dispatch thành công qua ToolResolver
  // -------------------------------------------------------------
  try {
    const regResult = await ToolRegistry.executeTool(
      "search_products",
      { keyword: "iphone" },
      { clientSupportsWebMCP: false }
    );

    assert(
      regResult !== undefined && regResult.source === "server_service",
      "ToolRegistry tích hợp hoàn chỉnh với ToolResolver và thực thi search_products thành công"
    );
  } catch (err) {
    assert(false, `Test 6 ném lỗi: ${err.message}`);
  }

  // -------------------------------------------------------------
  // TEST 7: Kiểm tra REST API endpoint (POST /api/ai-agent)
  // -------------------------------------------------------------
  try {
    const response = await fetch("http://localhost:5000/api/ai-agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "ping test" }),
    });

    assert(
      response.status === 401 || response.status === 200,
      `REST API Endpoint /api/ai-agent trực tuyến và bảo mật (HTTP Status: ${response.status})`
    );
  } catch (err) {
    console.log(`ℹ️ [INFO] Server local offline hoặc không thể kết nối REST: ${err.message} (bỏ qua)`);
  }

  console.log("\n=============================================================");
  console.log(`📊 TỔNG KẾT: ${passed}/${total} KIỂM THỬ THÀNH CÔNG`);
  console.log("=============================================================");

  if (passed === total) {
    console.log("🎉 CƠ CHẾ DUAL-PATH VÀ WEBMCP FALLBACK ĐÃ ĐẠT CHUẨN 100%!\n");
  }
}

runDualPathTests();
