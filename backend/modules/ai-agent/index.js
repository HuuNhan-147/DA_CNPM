// modules/ai-agent/index.js
// ============================================
// AI AGENT MODULE — Public Boundary Interface
// ============================================

export {
  AgentOrchestrator,
  orchestrator,
  runAgent,
} from "./core/AgentOrchestrator.js";

export { IntentRouter, detectIntent, filterToolDeclarations } from "./core/IntentRouter.js";
export { PromptEngine, buildSystemInstruction } from "./core/PromptEngine.js";
export { GeminiStreamClient } from "./llm/GeminiStreamClient.js";
export { ConversationMemory, conversationMemory } from "./memory/ConversationMemory.js";
export { ToolRegistry, tools, getToolDeclarations } from "./tools/ToolRegistry.js";
export { normalizeSlang, processInput, resolveReference } from "./memory/ContextResolver.js";
