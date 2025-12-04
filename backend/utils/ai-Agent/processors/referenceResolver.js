import redisChatService from "../../../services/redisChatService.js";

/**
 * ✅ IMPROVED: Unified reference resolver for both pronouns and indices
 */
export async function resolveReference({ userId, sessionId, index, pronoun, text }) {
  if (!userId || !sessionId) return null;
  
  try {
    console.log(`🔍 Resolving reference:`, { index, pronoun, text });
    
    const meta = await redisChatService.getSessionMeta(userId, sessionId);
    let lastViewedProducts = [];
    
    // Unified way to extract lastViewedProducts from meta
    if (Array.isArray(meta)) {
      lastViewedProducts = meta;
    } else if (meta && Array.isArray(meta.lastViewedProducts)) {
      lastViewedProducts = meta.lastViewedProducts;
    } else if (meta && Array.isArray(meta.last_viewed_products)) {
      lastViewedProducts = meta.last_viewed_products;
    } else if (meta && typeof meta === 'object') {
      // Find any array property that contains products
      const arrProp = Object.keys(meta).find((k) => 
        Array.isArray(meta[k]) && 
        meta[k].length > 0 && 
        meta[k][0].id !== undefined
      );
      if (arrProp) lastViewedProducts = meta[arrProp];
    }

    console.log(`🔍 Found ${lastViewedProducts.length} last viewed products`);
    
    if (!lastViewedProducts || lastViewedProducts.length === 0) {
      console.log(`🔍 No products available for reference resolution`);
      return null;
    }

    // Log available products for debugging
    lastViewedProducts.forEach((p, idx) => {
      console.log(`🔍 [${idx + 1}] ${p.name} - ${p.price} VNĐ`);
    });

    let resolvedProduct = null;
    let resolvedIndex = null;

    // 1. Resolve by explicit index (1-based)
    if (index !== undefined && Number.isInteger(index)) {
      const idx = Math.max(1, Math.min(lastViewedProducts.length, index)) - 1;
      resolvedProduct = lastViewedProducts[idx];
      resolvedIndex = idx + 1;
      console.log(`🔍 Resolved by index ${index} → product ${resolvedIndex}: ${resolvedProduct.name}`);
    }
    // 2. Resolve by pronoun from text
    else if (pronoun || text) {
      const referenceText = pronoun || text;
      resolvedProduct = resolveByPronoun(referenceText, lastViewedProducts);
      resolvedIndex = lastViewedProducts.indexOf(resolvedProduct) + 1;
      console.log(`🔍 Resolved by pronoun "${referenceText}" → product ${resolvedIndex}: ${resolvedProduct.name}`);
    }
    // 3. Default to most recent product
    else {
      resolvedProduct = lastViewedProducts[lastViewedProducts.length - 1];
      resolvedIndex = lastViewedProducts.length;
      console.log(`🔍 Default to most recent product: ${resolvedProduct.name}`);
    }

    if (resolvedProduct) {
      return {
        success: true,
        product: {
          id: resolvedProduct.id,
          name: resolvedProduct.name,
          price: resolvedProduct.price,
          index: resolvedIndex
        },
        availableProducts: lastViewedProducts.length,
        message: `Resolved to: ${resolvedProduct.name} (position ${resolvedIndex})`
      };
    }

    return {
      success: false,
      error: "Could not resolve reference",
      availableProducts: lastViewedProducts.length
    };

  } catch (e) {
    console.warn("referenceResolver.resolveReference error", e.message);
    return {
      success: false,
      error: e.message
    };
  }
}

/**
 * ✅ Resolve pronoun to specific product
 */
function resolveByPronoun(pronoun, products) {
  const pronounMap = {
    // Vietnamese pronouns
    'nó': 'last',
    'cái này': 'last', 
    'sản phẩm này': 'last',
    'cái kia': 'second_last',
    'sản phẩm kia': 'second_last',
    'cái đầu tiên': 'first',
    'cái thứ nhất': 'first',
    'cái thứ hai': 'second',
    'cái thứ ba': 'third',
    'cái cuối cùng': 'last',
    
    // English pronouns
    'it': 'last',
    'this': 'last',
    'that': 'second_last',
    'the first': 'first',
    'the second': 'second', 
    'the third': 'third',
    'the last': 'last'
  };

  const normalizedPronoun = pronoun.toLowerCase().trim();
  const resolutionType = pronounMap[normalizedPronoun] || 'last';

  switch (resolutionType) {
    case 'first':
      return products[0];
    case 'second':
      return products[1] || products[0];
    case 'third':
      return products[2] || products[0];
    case 'second_last':
      return products.length > 1 ? products[products.length - 2] : products[0];
    case 'last':
    default:
      return products[products.length - 1];
  }
}

/**
 * ✅ Extract index from text (e.g., "thứ 2", "con thứ 3")
 */
export function extractIndexFromText(text) {
  if (!text) return null;
  
  const indexPatterns = [
    /thứ\s+(\d+)/i,           // "thứ 2", "thứ 3"
    /con\s+thứ\s+(\d+)/i,     // "con thứ 2"  
    /số\s+(\d+)/i,            // "số 1", "số 2"
    /cái\s+thứ\s+(\d+)/i,     // "cái thứ 1"
    /product\s+(\d+)/i,       // "product 1"
    /item\s+(\d+)/i           // "item 2"
  ];

  for (const pattern of indexPatterns) {
    const match = text.match(pattern);
    if (match) {
      const index = parseInt(match[1]);
      if (index > 0) return index;
    }
  }

  return null;
}

/**
 * ✅ Extract pronoun from text
 */
export function extractPronounFromText(text) {
  if (!text) return null;
  
  const pronouns = [
    'nó', 'cái này', 'sản phẩm này', 'cái kia', 'sản phẩm kia',
    'cái đầu tiên', 'cái thứ nhất', 'cái thứ hai', 'cái thứ ba', 'cái cuối cùng',
    'it', 'this', 'that', 'the first', 'the second', 'the third', 'the last'
  ];

  const normalizedText = text.toLowerCase();
  return pronouns.find(pronoun => normalizedText.includes(pronoun)) || null;
}