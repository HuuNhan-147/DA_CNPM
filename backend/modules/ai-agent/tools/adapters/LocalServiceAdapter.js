// modules/ai-agent/tools/adapters/LocalServiceAdapter.js
// ============================================
// LOCAL SERVICE ADAPTER — Thực thi Tool trực tiếp tại Server qua Service Layer
// ============================================

export class LocalServiceAdapter {
  constructor() {
    this.name = "local_service_adapter";
  }

  /**
   * Thực thi tool trên Server thông qua action logic (ProductService, CartService, OrderService,...)
   * @param {AgentTool} tool
   * @param {Object} args
   * @param {Object} context
   */
  async execute(tool, args, context) {
    console.log(`  🏢 [LocalServiceAdapter] Thực thi tool [${tool.name}] tại server...`);
    const startTime = Date.now();

    try {
      const result = await tool.execute(args, context);
      const duration = Date.now() - startTime;
      console.log(`  ✅ [LocalServiceAdapter] [${tool.name}] hoàn thành (${duration}ms)`);
      return {
        success: true,
        source: "server_service",
        ...result,
      };
    } catch (error) {
      console.error(`  ❌ [LocalServiceAdapter] [${tool.name}] lỗi:`, error.message);
      return {
        success: false,
        source: "server_service",
        error: error.message,
      };
    }
  }
}

export const localServiceAdapter = new LocalServiceAdapter();
