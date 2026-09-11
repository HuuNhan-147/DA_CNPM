// utils/aiAgent/intentRouter.js
// ============================================
// INTENT ROUTER — Bộ định tuyến ý định theo domain
// ============================================
// Phân tích câu chat của user để xác định domain (PRODUCT, CART, ORDER...)
// và chỉ gửi đúng prompt module + tools cần thiết lên Gemini.
// Giảm 60-70% số token mỗi lần gọi API.

// ============================================
// DOMAIN DEFINITIONS với từ khóa (keyword-based routing)
// ============================================
const DOMAIN_KEYWORDS = {
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
      // ✅ Thêm pattern "cập nhật + [trường cá nhân]" để tránh nhầm với PRODUCT
      "cập nhật số", "cập nhật địa chỉ", "cập nhật email",
      "số điện thoại của tôi", "thay đổi mật khẩu", "đổi thông tin"
    ],
    weight: 12, // ✅ Tăng weight cao hơn PRODUCT để ưu tiên khi có "cập nhật"
  },
  PRODUCT: {
    keywords: [
      "tìm", "tìm kiếm", "search", "sản phẩm", "product",
      "có bán không", "giá bao nhiêu", "laptop", "điện thoại",
      "iphone", "samsung", "máy tính", "tai nghe", "phụ kiện",
      "thương hiệu", "loại nào", "danh mục", "xem", "gợi ý",
      "recommend", "so sánh", "compare", "tốt nhất", "rẻ nhất",
      "trong tầm giá", "review", "đánh giá sản phẩm"
    ],
    weight: 8, // Thấp hơn để CART/ORDER được ưu tiên khi câu hỏi mix
  },
};

// ============================================
// TOOL SETS theo từng domain
// ============================================
const DOMAIN_TOOLS = {
  PRODUCT: ["search_products", "get_product_detail"],
  CART:    ["search_products", "add_to_cart", "add_from_last_viewed", "get_cart", "update_cart", "remove_from_cart", "get_cart_count"],
  ORDER:   ["get_cart", "create_order", "get_user_orders", "get_order_detail", "cancel_order"],
  PAYMENT: ["create_vnpay_payment", "get_order_detail"],
  PROFILE: ["get_user_profile", "update_user_profile"],
  GENERAL: ["search_products", "get_product_detail", "add_to_cart", "get_cart", "get_user_orders"],
};

// ============================================
// MAIN ROUTER FUNCTION
// ============================================
/**
 * Phân tích message của user để xác định domain cần xử lý.
 * Có thể trả về 1 hoặc nhiều domain (ví dụ: "Tìm iPhone rồi thêm vào giỏ" → CART vì CART bao gồm search).
 *
 * @param {string} message - Câu chat đã được normalize
 * @param {Array}  history - Lịch sử hội thoại gần nhất (để xét ngữ cảnh)
 * @returns {{ domain: string, confidence: number, toolSet: string[] }}
 */
export function detectIntent(message, history = []) {
  const normalizedMsg = message.toLowerCase().trim();

  // --- Tính điểm cho từng domain ---
  const scores = {};
  for (const [domain, config] of Object.entries(DOMAIN_KEYWORDS)) {
    scores[domain] = 0;
    for (const kw of config.keywords) {
      if (normalizedMsg.includes(kw)) {
        scores[domain] += config.weight;
      }
    }
  }

  // --- Xét context từ lịch sử hội thoại gần nhất (chỉ xét tin nhắn của USER để tránh nhiễu do AI trả lời gợi ý nhiều) ---
  const recentHistory = history.filter(msg => msg.role === "user").slice(-3);
  for (const msg of recentHistory) {
    const content = (msg.content || "").toLowerCase();
    for (const [domain, config] of Object.entries(DOMAIN_KEYWORDS)) {
      for (const kw of config.keywords) {
        // Context điểm ít hơn (weight/3) vì không phải tin nhắn hiện tại
        if (content.includes(kw)) scores[domain] += Math.floor(config.weight / 3);
      }
    }
  }

  // --- Tìm domain cao điểm nhất ---
  let bestDomain = "GENERAL";
  let bestScore = 0;

  for (const [domain, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestDomain = domain;
    }
  }

  let activeDomains = [];
  // Nếu bestScore >= 8, chọn các domain có điểm số tiệm cận (>= 40% điểm của bestScore)
  if (bestScore >= 8) {
    for (const [domain, score] of Object.entries(scores)) {
      if (score >= 8 && score >= bestScore * 0.4) {
        activeDomains.push(domain);
      }
    }
  }

  // --- Hỗ trợ Context Retention (Duy trì ngữ cảnh) ---
  // Nếu không nhận diện được domain nào rõ ràng từ tin nhắn hiện tại (bestScore < 8)
  // nhưng trong lịch sử chat gần nhất có đề cập tới domain cụ thể, ta giữ lại domain đó làm ngữ cảnh.
  if (activeDomains.length === 0) {
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
        console.log(`⏳ Context retained from history: ${foundDomain}`);
        break;
      }
    }
  }

  if (activeDomains.length === 0) {
    activeDomains = ["GENERAL"];
    bestDomain = "GENERAL";
  }

  // --- Gom nhóm các công cụ (Merge Tool Sets) ---
  const toolSetSet = new Set();
  activeDomains.forEach((domain) => {
    const tools = DOMAIN_TOOLS[domain] || DOMAIN_TOOLS["GENERAL"];
    tools.forEach((t) => toolSetSet.add(t));
  });
  const toolSet = Array.from(toolSetSet);

  // --- Tính confidence (0 → 1) ---
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = totalScore > 0 ? Math.min(bestScore / totalScore, 1).toFixed(2) : 0;

  console.log(`🎯 Intent detected: [${activeDomains.join(", ")}] (best: ${bestDomain}, confidence: ${confidence}, score: ${bestScore})`);
  console.log(`🔧 Tool set: [${toolSet.join(", ")}]`);

  return {
    domain: bestDomain,
    domains: activeDomains,
    confidence: parseFloat(confidence),
    score: bestScore,
    scores,
    toolSet,
  };
}

/**
 * Lấy tập tool declarations chỉ cho những tools cần thiết.
 * @param {string[]} toolNames - Danh sách tên tool cần lấy
 * @param {Function} getToolDeclarations - Hàm lấy tất cả declarations từ toolRegistry
 * @returns {Array} Mảng function declarations đã lọc
 */
export function filterToolDeclarations(toolNames, allDeclarations) {
  return allDeclarations.filter((decl) => toolNames.includes(decl.name));
}
