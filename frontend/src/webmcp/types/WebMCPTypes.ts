// frontend/src/webmcp/types/WebMCPTypes.ts
// ============================================
// WEBMCP TYPE DEFINITIONS — Chuẩn W3C/Chrome Model Context Protocol
// ============================================

export interface WebMCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
  execute: (args: Record<string, any>) => Promise<any>;
}

export interface ModelContext {
  registerTool: (tool: WebMCPToolDefinition) => void;
  unregisterTool?: (toolName: string) => void;
  getTools: () => WebMCPToolDefinition[];
  executeTool: (name: string, input: Record<string, any>) => Promise<any>;
}

// Mở rộng Window/Document interface để hỗ trợ WebMCP Native
declare global {
  interface Document {
    modelContext?: ModelContext;
  }
  interface Window {
    modelContext?: ModelContext;
  }
}
