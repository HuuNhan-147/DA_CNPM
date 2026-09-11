import { detectIntent } from "../intentRouter.js";

// Bộ câu hỏi kiểm thử giả lập từ khách hàng
const testCases = [
  // 1. MODULE: SẢN PHẨM (PRODUCT)
  {
    name: "Tìm kiếm sản phẩm thường",
    query: "tôi muốn tìm mua điện thoại iphone 15 pro max",
    expectedDomains: ["PRODUCT"],
    history: []
  },
  {
    name: "Tìm kiếm sản phẩm theo giá/thương hiệu",
    query: "có bán laptop gaming asus giá rẻ không shop",
    expectedDomains: ["PRODUCT"],
    history: []
  },

  // 2. MODULE: GIỎ HÀNG (CART)
  {
    name: "Thêm sản phẩm vào giỏ",
    query: "thêm cái điện thoại này vào giỏ hàng giùm mình",
    expectedDomains: ["CART"],
    history: []
  },
  {
    name: "Xem giỏ hàng",
    query: "cho mình xem giỏ hàng hiện tại",
    expectedDomains: ["CART"],
    history: []
  },

  // 3. MODULE: ĐƠN HÀNG (ORDER)
  {
    name: "Đặt đơn hàng",
    query: "mình muốn đặt hàng ship về địa chỉ Hà Nội",
    expectedDomains: ["ORDER"],
    history: []
  },
  {
    name: "Xem lịch sử mua hàng",
    query: "xem danh sách đơn hàng đã đặt của tôi",
    expectedDomains: ["ORDER"],
    history: []
  },
  {
    name: "Hủy đơn hàng",
    query: "hủy đơn hàng mã ORD12345 giúp mình với",
    expectedDomains: ["ORDER"],
    history: []
  },

  // 4. MODULE: THANH TOÁN (PAYMENT)
  {
    name: "Thanh toán VNPay",
    query: "tạo link thanh toán vnpay cho mình",
    expectedDomains: ["PAYMENT"],
    history: []
  },

  // 5. MODULE: HỒ SƠ (PROFILE)
  {
    name: "Xem thông tin cá nhân",
    query: "xem hồ sơ thông tin tài khoản của mình",
    expectedDomains: ["PROFILE"],
    history: []
  },
  {
    name: "Cập nhật số điện thoại",
    query: "mình muốn cập nhật số điện thoại mới",
    expectedDomains: ["PROFILE"],
    history: []
  },

  // 6. PHỨC HỢP ĐA Ý ĐỊNH (MULTI-INTENT)
  {
    name: "Tìm sản phẩm rồi thêm vào giỏ",
    query: "tìm tai nghe bluetooth sony rồi thêm vào giỏ hàng",
    expectedDomains: ["PRODUCT", "CART"],
    history: []
  },
  {
    name: "Cập nhật địa chỉ và đặt đơn",
    query: "cập nhật địa chỉ nhận hàng của tôi và tiến hành đặt hàng luôn",
    expectedDomains: ["PROFILE", "ORDER"],
    history: []
  },

  // 7. DUY TRÌ NGỮ CẢNH (CONTEXT RETENTION)
  {
    name: "Câu hỏi kế tiếp dùng đại từ thay thế (PRODUCT)",
    query: "nó có màu gì thế?",
    expectedDomains: ["PRODUCT"],
    history: [
      { role: "user", content: "tìm điện thoại iphone 15 pro max" },
      { role: "assistant", content: "Mình tìm thấy iPhone 15 Pro Max 256GB..." }
    ]
  },
  {
    name: "Hỏi thanh toán sau khi đặt đơn (PAYMENT)",
    query: "cho xin link vnpay",
    expectedDomains: ["PAYMENT"],
    history: [
      { role: "user", content: "tạo đơn hàng giúp mình" },
      { role: "assistant", content: "Đã tạo đơn hàng thành công mã ORD999" }
    ]
  }
];

console.log("=============================================================");
console.log("🚀 BẮT ĐẦU CHẠY BỘ KIỂM THỬ Ý ĐỊNH KHÁCH HÀNG (AI-AGENT TESTS)");
console.log("=============================================================\n");

let passed = 0;
let failed = 0;

testCases.forEach((tc, index) => {
  const result = detectIntent(tc.query, tc.history);
  
  // Kiểm tra xem tất cả các domain mong muốn có nằm trong danh sách activeDomains (result.domains) hay không
  const isMatch = tc.expectedDomains.every(domain => result.domains.includes(domain));

  if (isMatch) {
    console.log(`✅ [TEST ${index + 1}] PASSED: ${tc.name}`);
    console.log(`   📝 Câu hỏi: "${tc.query}"`);
    console.log(`   🎯 Đóng gói ý định: [${result.domains.join(", ")}] (Mong muốn: [${tc.expectedDomains.join(", ")}])`);
    console.log(`   🔧 Tools được nạp: [${result.toolSet.join(", ")}]\n`);
    passed++;
  } else {
    console.log(`❌ [TEST ${index + 1}] FAILED: ${tc.name}`);
    console.log(`   📝 Câu hỏi: "${tc.query}"`);
    console.log(`   🎯 Thực tế nhận diện: [${result.domains.join(", ")}] (Mong muốn: [${tc.expectedDomains.join(", ")}])\n`);
    failed++;
  }
});

console.log("=============================================================");
console.log(`📊 TỔNG KẾT: THÀNH CÔNG: ${passed}/${testCases.length} | THẤT BẠI: ${failed}/${testCases.length}`);
console.log("=============================================================");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
