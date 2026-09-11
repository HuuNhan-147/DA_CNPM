// frontend/src/webmcp/WebMCPManager.ts
// ============================================
// WEBMCP MANAGER — Quản lý Runtime & Polyfill WebMCP trên Trình duyệt
// ============================================

import { WebMCPToolDefinition, ModelContext } from "./types/WebMCPTypes";

export class WebMCPManager implements ModelContext {
  private tools: Map<string, WebMCPToolDefinition> = new Map();
  private isNative: boolean = false;

  constructor() {
    this.initModelContext();
  }

  /**
   * Khởi tạo ModelContext trên document/window (Native hoặc Polyfill)
   */
  private initModelContext() {
    if (typeof document !== "undefined") {
      if (document.modelContext && typeof document.modelContext.registerTool === "function") {
        console.log("🌐 [WebMCP] Phát hiện Native document.modelContext được hỗ trợ bởi trình duyệt.");
        this.isNative = true;
      } else {
        console.log("🌐 [WebMCP] Trình duyệt chưa có Native modelContext -> Khởi chạy WebMCP Compliant Polyfill.");
        const polyfillContext: ModelContext = {
          registerTool: this.registerTool.bind(this),
          getTools: this.getTools.bind(this),
          executeTool: this.executeTool.bind(this),
        };

        try {
          (document as any).modelContext = polyfillContext;
          (window as any).modelContext = polyfillContext;
        } catch (e) {
          console.warn("⚠️ [WebMCP] Không thể gán modelContext vào document:", e);
        }
      }
    }
  }

  /**
   * Đăng ký một Capability Tool mới lên WebMCP
   */
  registerTool(tool: WebMCPToolDefinition): void {
    if (!tool.name || typeof tool.execute !== "function") {
      throw new Error(`WebMCP: Tool không hợp lệ`);
    }

    this.tools.set(tool.name, tool);
    console.log(`🛠️ [WebMCP] Đã đăng ký tool: [${tool.name}]`);

    // Nếu có native modelContext, đăng ký đồng thời vào native context
    if (this.isNative && document.modelContext && document.modelContext !== this) {
      try {
        document.modelContext.registerTool(tool);
      } catch (e) {
        console.warn(`⚠️ [WebMCP] Lỗi đăng ký native tool [${tool.name}]:`, e);
      }
    }
  }

  /**
   * Lấy danh sách tất cả các tools đã đăng ký
   */
  getTools(): WebMCPToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Lấy danh sách khai báo Schema cho Agent / LLM
   */
  getDeclarations(): Array<{ name: string; description: string; parameters: any }> {
    return this.getTools().map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.inputSchema,
    }));
  }

  /**
   * Thực thi một tool theo tên với tham số đầu vào
   */
  async executeTool(name: string, input: Record<string, any> = {}): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`WebMCP: Tool "${name}" không tồn tại hoặc chưa được đăng ký.`);
    }

    console.log(`🚀 [WebMCP] Thực thi tool [${name}] với args:`, input);
    try {
      const result = await tool.execute(input);
      console.log(`✅ [WebMCP] Tool [${name}] thực thi thành công:`, result);
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      console.error(`❌ [WebMCP] Tool [${name}] gặp lỗi:`, error.message);
      return {
        success: false,
        error: error.message || "Lỗi khi thực thi WebMCP tool trên trình duyệt",
      };
    }
  }

  isSupported(): boolean {
    return typeof window !== "undefined";
  }
}

export const webMcpManager = new WebMCPManager();
