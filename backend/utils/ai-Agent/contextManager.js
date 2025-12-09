import redisChatService from "../../services/redisChatService.js";
import {
  resolveReference,
  extractIndexFromText,
  extractPronounFromText,
} from "./processors/referenceResolver.js";

const userContexts = new Map();

export async function getContext(userId) {
  if (!userContexts.has(userId)) userContexts.set(userId, []);
  return userContexts.get(userId);
}

export async function updateContext(userId, newContext) {
  userContexts.set(userId, newContext);
}

/**
 * ✅ IMPROVED: Get comprehensive session summary
 */
export async function getSessionSummary(userId, sessionId, limit = 10) {
  if (!userId || !sessionId) return null;

  try {
    console.log(`📋 Building session summary for ${userId}:${sessionId}`);

    const meta = await redisChatService.getSessionMeta(userId, sessionId);
    let lastViewedProducts = [];

    // Unified product extraction (same as referenceResolver)
    if (Array.isArray(meta)) {
      lastViewedProducts = meta;
    } else if (meta && Array.isArray(meta.lastViewedProducts)) {
      lastViewedProducts = meta.lastViewedProducts;
    } else if (meta && Array.isArray(meta.last_viewed_products)) {
      lastViewedProducts = meta.last_viewed_products;
    } else if (meta && typeof meta === "object") {
      const arrProp = Object.keys(meta).find(
        (k) =>
          Array.isArray(meta[k]) &&
          meta[k].length > 0 &&
          meta[k][0].id !== undefined
      );
      if (arrProp) lastViewedProducts = meta[arrProp];
    }

    if (!lastViewedProducts || lastViewedProducts.length === 0) {
      console.log(`📋 No products in session`);
      return null;
    }

    // Build product list for context
    const productList = lastViewedProducts.slice(0, limit).map((p, idx) => {
      const name = p.name || p.title || "(sản phẩm)";
      const price = p.price ? ` - ${formatVnd(p.price)}` : "";
      return `${idx + 1}. ${name}${price}`;
    });

    const summary = `SẢN PHẨM ĐÃ XEM: ${productList.join("; ")} | Tổng: ${
      lastViewedProducts.length
    } sản phẩm`;

    console.log(`📋 Session summary: ${summary}`);
    return summary;
  } catch (e) {
    console.warn("contextManager.getSessionSummary error", e.message);
    return null;
  }
}

/**
 * ✅ UNIFIED: Process input text and resolve references
 */
export async function processInput(text, userId, sessionId) {
  if (!text || !userId || !sessionId) {
    return { text, resolved: null };
  }

  console.log(`🔍 Processing input: "${text}"`);

  let resolvedReference = null;
  let processedText = text;

  // Extract index from text (e.g., "thêm con thứ 2 vào giỏ")
  const index = extractIndexFromText(text);
  const pronoun = extractPronounFromText(text);

  if (index !== null || pronoun !== null) {
    console.log(`🔍 Found reference - index: ${index}, pronoun: ${pronoun}`);

    const resolution = await resolveReference({
      userId,
      sessionId,
      index,
      pronoun,
      text,
    });

    if (resolution && resolution.success) {
      resolvedReference = resolution;

      // Add context hint to help AI understand
      if (resolution.product) {
        const p = resolution.product;
        // CRITICAL: Include productId for AI to use directly
        processedText = `${text} [PRODUCT_REFERENCE: name="${p.name}", productId="${p.id}", price=${p.price}]`;
        console.log(`✅ Enhanced message with productId:`, processedText);
      }

      console.log(`🔍 Resolved reference to: ${resolution.product.name}`);
    } else {
      console.log(`🔍 Could not resolve reference`);
    }
  }

  return {
    text: processedText,
    resolved: resolvedReference,
    hasReference: index !== null || pronoun !== null,
  };
}

function formatVnd(n) {
  try {
    return new Intl.NumberFormat("vi-VN").format(n) + " VNĐ";
  } catch (e) {
    return n;
  }
}

// Export the unified functions
export { resolveReference, extractIndexFromText, extractPronounFromText };
