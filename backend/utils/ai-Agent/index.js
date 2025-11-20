import { BASE_PROMPT } from "./promptTemplates.js";
import { tools } from "./toolRegistry.js";
import { runAgent } from "./agentCore.js";

export const aiAgent = {
  prompt: BASE_PROMPT,
  tools,
  run: runAgent,
};
