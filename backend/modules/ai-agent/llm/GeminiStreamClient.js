// modules/ai-agent/llm/GeminiStreamClient.js
import axios from "axios";
import https from "https";
import { StringDecoder } from "string_decoder";

const httpsAgent = new https.Agent({ keepAlive: true });

export class GeminiStreamClient {
  constructor(apiKey = process.env.GEMINI_API_KEY, model = process.env.GEMINI_MODEL || "gemini-flash-lite-latest") {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = "https://generativelanguage.googleapis.com/v1beta";
  }

  /**
   * Gọi API Gemini dạng HTTP Stream và giải mã JSON stream an toàn
   * @param {Array} contents Lịch sử hội thoại
   * @param {Array} functionDeclarations Khai báo tool
   * @param {String} systemInstruction System prompt
   * @param {Function} onChunk Callback nhận từng chunk text thời gian thực
   */
  async streamGenerateContent(contents, functionDeclarations = [], systemInstruction = "", onChunk = null) {
    const maxRetries = 4;
    const baseDelay = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const payload = {
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents,
          tools: functionDeclarations.length > 0 ? [{ functionDeclarations }] : undefined,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
          },
        };

        const response = await axios.post(
          `${this.baseUrl}/models/${this.model}:streamGenerateContent?alt=sse&key=${this.apiKey}`,
          payload,
          {
            headers: { "Content-Type": "application/json" },
            responseType: "stream",
            timeout: 60000,
            httpsAgent: httpsAgent,
          }
        );

        let fullText = "";
        const originalParts = [];
        const decoder = new StringDecoder("utf8");

        return await new Promise((resolve, reject) => {
          let buffer = "";

          const processJsonObj = (jsonObj) => {
            const candidate = jsonObj.candidates?.[0];
            const content = candidate?.content;
            const text = content?.parts?.filter((p) => p.text).map((p) => p.text).join("");

            if (text) {
              fullText += text;
              if (onChunk) onChunk(text);
            }

            const parts = content?.parts?.filter((p) => p.functionCall || p.text) || [];
            originalParts.push(...parts);
          };

          response.data.on("data", (chunk) => {
            buffer += decoder.write(chunk);
            let lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (let line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;

              // Hỗ trợ cả chuẩn SSE (data: {...}) và JSON lines thông thường
              let jsonStr = trimmed;
              if (trimmed.startsWith("data:")) {
                jsonStr = trimmed.replace(/^data:\s*/, "").trim();
              }
              if (!jsonStr || jsonStr === "[" || jsonStr === "]") continue;
              if (jsonStr.startsWith(",")) jsonStr = jsonStr.substring(1).trim();
              if (jsonStr.endsWith(",")) jsonStr = jsonStr.substring(0, jsonStr.length - 1).trim();

              try {
                const jsonObj = JSON.parse(jsonStr);
                processJsonObj(jsonObj);
              } catch (e) {
                // Buffer tiếp nếu chưa trọn vẹn
              }
            }
          });

          response.data.on("end", () => {
            buffer += decoder.end();
            if (buffer.trim()) {
              let trimmed = buffer.trim();
              if (trimmed.startsWith("data:")) trimmed = trimmed.replace(/^data:\s*/, "").trim();
              if (trimmed.startsWith(",")) trimmed = trimmed.substring(1).trim();
              if (trimmed.endsWith(",")) trimmed = trimmed.substring(0, trimmed.length - 1).trim();
              if (trimmed && trimmed !== "[" && trimmed !== "]") {
                try {
                  const jsonObj = JSON.parse(trimmed);
                  processJsonObj(jsonObj);
                } catch (e) {}
              }
            }

            const functionCalls = originalParts
              .filter((p) => p.functionCall)
              .map((p) => p.functionCall);

            resolve({
              text: fullText,
              functionCalls: functionCalls.length > 0 ? functionCalls : null,
              functionCallsOriginalParts: originalParts.filter((p) => p.functionCall),
            });
          });

          response.data.on("error", (err) => {
            reject(err);
          });
        });
      } catch (err) {
        const isRateLimit = err.response?.status === 429;
        const isServerOverload = err.response?.status === 503;

        if ((isRateLimit || isServerOverload) && attempt < maxRetries) {
          const delay = (isRateLimit ? 2500 : baseDelay) * Math.pow(2, attempt - 1);
          console.warn(`⚠️ Gemini API rate limited (429) / 503. Retrying in ${delay}ms (attempt ${attempt}/${maxRetries})...`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }

        console.error(`❌ Gemini API error (attempt ${attempt}):`, err.response?.data || err.message);
        throw err;
      }
    }
  }
}
