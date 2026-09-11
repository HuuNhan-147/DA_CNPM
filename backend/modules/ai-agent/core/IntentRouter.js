// modules/ai-agent/core/IntentRouter.js
// ============================================
// INTENT ROUTER — Bộ định tuyến ý định theo domain
// ============================================

export const DOMAIN_KEYWORDS = {
  CART: {
    keywords: [
      "giỏ hàng", "thêm vào giỏ", "add to cart", "remove from cart",
      "xóa khỏi giỏ", "cập nhật giỏ", "xem giỏ", "show cart",
      "thêm vào", "lấy con", "lấy cái", "thêm nó", "thêm cái này",
      "cập nhật số lượng", "cart", "bỏ vào giỏ", "cho vào giỏ"
    ],
    weight: 10,
  },
  ORDER: {
    keywords: [
      "đơn hàng", "tạo đơn", "đặt hàng", "đặt mua", "order",
      "giao hàng", "địa chỉ giao", "theo dõi đơn", "trạng thái đơn",
      "hủy đơn", "cancel order", "xem đơn", "lịch sử mua",
      "đơn của tôi", "shipping", "vận chuyển", "mã đơn", "ordercode",
      "mua ngay", "checkout", "đặt ngay"
    ],
    weight: 10,
  },
  PAYMENT: {
    keywords: [
      "thanh toán", "vnpay", "payment", "ngân hàng", "bank",
      "link thanh toán", "quét mã", "chuyển khoản", "atm",
      "momo", "ví điện tử", "trả tiền", "pay", "tạo link"
    ],
    weight: 10,
  },
  PROFILE: {
    keywords: [
      "tài khoản", "profile", "hồ sơ", "thông tin cá nhân",
      "cập nhật tên", "đổi số điện thoại", "đổi mật khẩu",
      "địa chỉ của tôi", "user info", "account", "thông tin của tôi",
      "cập nhật profile", "sửa thông tin",
      "cập nhật số", "cập nhật địa chỉ", "cập nhật email",
      "số điện thoại của tôi", "thay đổi mật khẩu", "đổi thông tin"
    ],
    weight: 12,
  },
  PRODUCT: {
    keywords: [
      "tìm", "tìm kiếm", "search", "sản phẩm", "product",
      "có bán không", "giá bao nhiêu", "laptop", "điện thoại",
      "iphone", "samsung", "xiaomi", "oppo", "macbook", "ipad", "dell", "asus",
      "máy tính", "tai nghe", "phụ kiện", "thương hiệu", "loại nào", "danh mục",
      "xem", "gợi ý", "recommend", "so sánh", "compare", "tốt nhất", "rẻ nhất",
      "trong tầm giá", "review", "đánh giá sản phẩm"
    ],
    weight: 8,
  },
};

export const DOMAIN_TOOLS = {
  PRODUCT: ["search_products", "get_product_detail"],
  CART:    ["search_products", "add_to_cart", "add_from_last_viewed", "get_cart", "update_cart", "remove_from_cart", "get_cart_count"],
  ORDER:   ["get_cart", "create_order", "get_user_orders", "get_order_detail", "cancel_order"],
  PAYMENT: ["create_vnpay_payment", "get_order_detail"],
  PROFILE: ["get_user_profile", "update_user_profile"],
  GENERAL: ["search_products", "get_product_detail", "add_to_cart", "get_cart", "get_user_orders"],
};

export class IntentRouter {
  static detectIntent(message, history = []) {
    const normalizedMsg = message.toLowerCase().trim();

    const scores = {};
    for (const [domain, config] of Object.entries(DOMAIN_KEYWORDS)) {
      scores[domain] = 0;
      for (const kw of config.keywords) {
        if (normalizedMsg.includes(kw)) {
          scores[domain] += config.weight;
        }
      }
    }

    const recentHistory = history.filter((msg) => msg.role === "user").slice(-3);
    for (const msg of recentHistory) {
      const content = (msg.content || "").toLowerCase();
      for (const [domain, config] of Object.entries(DOMAIN_KEYWORDS)) {
        for (const kw of config.keywords) {
          if (content.includes(kw)) scores[domain] += Math.floor(config.weight / 3);
        }
      }
    }

    let bestDomain = "GENERAL";
    let bestScore = 0;

    for (const [domain, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score;
        bestDomain = domain;
      }
    }

    let activeDomains = [];
    if (bestScore >= 8) {
      for (const [domain, score] of Object.entries(scores)) {
        if (score >= 8 && score >= bestScore * 0.4) {
          activeDomains.push(domain);
        }
      }
    }

    if (activeDomains.length === 0) {
      // Chỉ kế thừa domain từ lịch sử nếu câu chat hiện tại có đại từ tham chiếu hoặc từ ngữ nối tiếp ngữ cảnh (hỗ trợ Unicode tiếng Việt)
      const hasFollowUpCue = /(^|\s|[.,?!])(nó|cái này|sản phẩm này|con này|món này|em này|cái đó|thứ|số|ở trên|vừa nãy|nữa|thế|như thế nào|bao nhiêu|màu gì|còn hàng)(\s|[.,?!]|$)/i.test(normalizedMsg);

      if (hasFollowUpCue) {
        for (let i = history.length - 1; i >= 0; i--) {
          const histMsg = (history[i].content || "").toLowerCase();
          let foundDomain = null;
          let histBestScore = 0;

          for (const [domain, config] of Object.entries(DOMAIN_KEYWORDS)) {
            let histScore = 0;
            for (const kw of config.keywords) {
              if (histMsg.includes(kw)) histScore += config.weight;
            }
            if (histScore > histBestScore && histScore >= 8) {
              histBestScore = histScore;
              foundDomain = domain;
            }
          }

          if (foundDomain) {
            activeDomains = [foundDomain];
            bestDomain = foundDomain;
            bestScore = histBestScore;
            break;
          }
        }
      }
    }

    if (activeDomains.length === 0) {
      activeDomains = ["GENERAL"];
      bestDomain = "GENERAL";
    }

    const toolSetSet = new Set();
    activeDomains.forEach((domain) => {
      const tools = DOMAIN_TOOLS[domain] || DOMAIN_TOOLS["GENERAL"];
      tools.forEach((t) => toolSetSet.add(t));
    });
    const toolSet = Array.from(toolSetSet);

    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    const confidence = totalScore > 0 ? Math.min(bestScore / totalScore, 1).toFixed(2) : 0;

    return {
      domain: bestDomain,
      domains: activeDomains,
      confidence: parseFloat(confidence),
      score: bestScore,
      scores,
      toolSet,
    };
  }

  static filterToolDeclarations(toolNames, allDeclarations) {
    return allDeclarations.filter((decl) => toolNames.includes(decl.name));
  }
}

export const detectIntent = IntentRouter.detectIntent;
export const filterToolDeclarations = IntentRouter.filterToolDeclarations;
