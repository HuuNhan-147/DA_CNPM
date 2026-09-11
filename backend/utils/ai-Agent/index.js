// utils/ai-Agent/index.js (Backward Compatibility Layer)
export * from "../../modules/ai-agent/index.js";
import {
  PromptEngine,
  buildSystemInstruction,
  tools,
  detectIntent,
  runAgent,
} from "../../modules/ai-agent/index.js";

export const aiAgent = {
  prompt: buildSystemInstruction("GENERAL"),
  buildPrompt: buildSystemInstruction,
  tools,
  detectIntent,
  run: runAgent,
};

export default aiAgent;
