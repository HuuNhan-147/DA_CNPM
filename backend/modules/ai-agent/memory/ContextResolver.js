// modules/ai-agent/memory/ContextResolver.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import redisChatService from "../../../services/redisChatService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dictPath = path.resolve(__dirname, "../../../config/slangDictionary.json");
let slangDict = {};
try {
  const raw = fs.readFileSync(dictPath, "utf8");
  slangDict = JSON.parse(raw);
} catch (e) {
  console.warn("ContextResolver: could not load slang dictionary", e.message);
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeSlang(text) {
  if (!text || typeof text !== "string") return text;
  let t = text.toLowerCase();

  const validKeys = Object.keys(slangDict).filter(
    (k) => !k.startsWith("___") && typeof slangDict[k] === "string"
  );
  const sortedKeys = validKeys.sort((a, b) => b.length - a.length);

  for (const k of sortedKeys) {
    const v = slangDict[k];
    const re = new RegExp(`\\b${escapeRegExp(k)}\\b`, "gi");
    t = t.replace(re, v);
  }

  return t.replace(/\s+/g, " ").trim();
}

export function extractIndexFromText(text) {
  if (!text) return null;
  const match = text.match(/(?:thứ|cái thứ|con thứ|món thứ|số)\s*(\d+)/i);
  if (match) {
    const n = parseInt(match[1], 10);
    return isNaN(n) ? null : n;
  }
  return null;
}

export function extractPronounFromText(text) {
  if (!text) return null;
  const patterns = [
    /(^|\s|[.,?!])(nó|nói|cái này|sản phẩm này|con này|món này|em này|cái đó|em đó)(\s|[.,?!]|$)/i,
    /(^|\s|[.,?!])(vừa nãy|vừa xem|trước đó|ở trên)(\s|[.,?!]|$)/i,
  ];
  for (const p of patterns) {
    const match = text.match(p);
    if (match) return match[2];
  }
  return null;
}

export async function resolveReference({ userId, sessionId, index, pronoun, text }) {
  if (!userId || !sessionId) return null;

  try {
    const meta = await redisChatService.getSessionMeta(userId, sessionId);
    let lastViewedProducts = [];

    if (Array.isArray(meta)) {
      lastViewedProducts = meta;
    } else if (meta && Array.isArray(meta.lastViewedProducts)) {
      lastViewedProducts = meta.lastViewedProducts;
    } else if (meta && Array.isArray(meta.last_viewed_products)) {
      lastViewedProducts = meta.last_viewed_products;
    }

    if (!lastViewedProducts || lastViewedProducts.length === 0) return null;

    let resolvedProduct = null;
    let resolvedIndex = null;

    if (index !== undefined && Number.isInteger(index)) {
      const idx = Math.max(1, Math.min(lastViewedProducts.length, index)) - 1;
      resolvedProduct = lastViewedProducts[idx];
      resolvedIndex = idx + 1;
    } else if (pronoun || text) {
      // Mặc định chọn sản phẩm gần nhất (cuối danh sách)
      resolvedProduct = lastViewedProducts[lastViewedProducts.length - 1];
      resolvedIndex = lastViewedProducts.length;
    }

    if (!resolvedProduct) return null;

    return {
      success: true,
      product: {
        id: resolvedProduct.id || resolvedProduct._id,
        name: resolvedProduct.name,
        price: resolvedProduct.price,
      },
      index: resolvedIndex,
    };
  } catch (err) {
    console.warn("ContextResolver: resolveReference error:", err.message);
    return null;
  }
}

export async function processInput(text, userId, sessionId) {
  if (!text || !userId || !sessionId) {
    return { text, resolved: null };
  }

  let processedText = text;
  let resolvedReference = null;

  const index = extractIndexFromText(text);
  const pronoun = extractPronounFromText(text);

  if (index !== null || pronoun !== null) {
    const resolution = await resolveReference({ userId, sessionId, index, pronoun, text });
    if (resolution && resolution.success && resolution.product) {
      resolvedReference = resolution;
      const p = resolution.product;
      processedText = `${text} [PRODUCT_REFERENCE: name="${p.name}", productId="${p.id}", price=${p.price}]`;
    }
  }

  return {
    text: processedText,
    resolved: resolvedReference,
  };
}
