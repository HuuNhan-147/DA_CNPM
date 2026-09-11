// modules/ai-agent/tools/AgentTool.js
// ============================================
// AGENT TOOL ABSTRACTION — Contract chuẩn cho tất cả Tool
// ============================================

export class AgentTool {
  /**
   * @param {Object} options
   * @param {string} options.name - Tên định danh của tool (ví dụ: "search_products")
   * @param {string} options.description - Mô tả chức năng cho LLM / WebMCP
   * @param {Object} options.inputSchema - JSON Schema mô tả tham số đầu vào
   * @param {Function} options.execute - Hàm thực thi nghiệp vụ (args, context)
   */
  constructor({ name, description, inputSchema, execute }) {
    if (!name || typeof name !== "string") {
      throw new Error("AgentTool: Tên tool là bắt buộc và phải là chuỗi");
    }
    if (!description || typeof description !== "string") {
      throw new Error(`AgentTool [${name}]: Thiếu mô tả description`);
    }

    this.name = name;
    this.description = description;
    this.inputSchema = inputSchema || { type: "object", properties: {} };
    this._execute = execute;
  }

  /**
   * Trả về định dạng Function Declaration chuẩn cho Gemini / LLM / WebMCP
   */
  getDeclaration() {
    return {
      name: this.name,
      description: this.description,
      parameters: this.inputSchema,
    };
  }

  /**
   * Thực thi tool với tham số và ngữ cảnh
   * @param {Object} args Tham số từ LLM
   * @param {Object} context Ngữ cảnh thực thi (userId, token, sessionId, ...)
   */
  async execute(args, context = {}) {
    if (typeof this._execute !== "function") {
      throw new Error(`AgentTool [${this.name}]: Chưa cài đặt hàm execute`);
    }
    return await this._execute(args, context);
  }
}
