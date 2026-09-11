// modules/ai-agent/tests/module.test.js
import {
  AgentOrchestrator,
  orchestrator,
  runAgent,
  IntentRouter,
  PromptEngine,
  GeminiStreamClient,
  conversationMemory,
  ToolRegistry,
  tools,
  getToolDeclarations,
  normalizeSlang,
  processInput,
} from "../index.js";

console.log("=============================================================");
console.log("🧪 KIỂM TRA MODULE AI-AGENT BOUNDARY (PHASE 2 TESTS)");
console.log("=============================================================");

// 1. Kiểm tra export đầy đủ
let passed = 0;
let total = 0;

function assert(condition, name) {
  total++;
  if (condition) {
    passed++;
    console.log(`✅ [PASS] ${name}`);
  } else {
    console.error(`❌ [FAIL] ${name}`);
  }
}

assert(typeof runAgent === "function", "runAgent được export dưới dạng function");
assert(orchestrator instanceof AgentOrchestrator, "orchestrator là instance của AgentOrchestrator");
assert(typeof IntentRouter.detectIntent === "function", "IntentRouter.detectIntent hoạt động");
assert(typeof PromptEngine.buildSystemInstruction === "function", "PromptEngine.buildSystemInstruction hoạt động");
assert(typeof ToolRegistry.executeTool === "function", "ToolRegistry.executeTool hoạt động");
assert(Array.isArray(getToolDeclarations()), "getToolDeclarations trả về array");
assert(getToolDeclarations().length === 15, `getToolDeclarations có đủ 15 tools (thực tế: ${getToolDeclarations().length})`);

// 2. Kiểm tra danh sách tools
const expectedTools = [
  "search_products",
  "get_product_detail",
  "add_to_cart",
  "add_from_last_viewed",
  "get_cart",
  "remove_from_cart",
  "update_cart",
  "get_cart_count",
  "create_order",
  "get_order_detail",
  "get_user_profile",
  "update_user_profile",
  "create_vnpay_payment",
  "get_user_orders",
  "cancel_order",
];

for (const toolName of expectedTools) {
  assert(typeof tools[toolName] === "function", `Tool "${toolName}" đã được đăng ký trong ToolRegistry`);
}

// 3. Kiểm tra Normalizer & Resolver
const normalized = normalizeSlang("tìm đt ip giá rẻ");
assert(typeof normalized === "string", "normalizeSlang trả về chuỗi đã xử lý");

// 4. Kiểm tra PromptEngine
const prompt = PromptEngine.buildSystemInstruction("PRODUCT");
assert(prompt.includes("TƯ VẤN & TÌM KIẾM SẢN PHẨM"), "PromptEngine sinh đúng prompt cho domain PRODUCT");

console.log("=============================================================");
console.log(`📊 KẾT QUẢ: ${passed}/${total} KIỂM TRA THÀNH CÔNG`);
console.log("=============================================================");

if (passed === total) {
  console.log("🎉 Toàn bộ boundary của AI Agent Module đã được kiểm chứng thành công!");
  process.exit(0);
} else {
  process.exit(1);
}
