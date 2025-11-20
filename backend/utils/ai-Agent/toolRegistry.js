// utils/aiAgent/toolRegistry.js
// ============================================

import { searchProducts, getProductDetail } from "./actions/productTools.js";
import { addToCart, getCart, removeFromCart, updateCart, getCartCount, addFromLastViewed } from "./actions/cartTools.js";
import { getUserOrders, createOrder, getOrderDetail , cancelOrder} from "./actions/orderTools.js";
import { getUserProfile, updateUserProfile } from "./actions/userTools.js";
import { createVnPayPayment } from "./actions/paymentTools.js";

/**
 * ✅ TOOL REGISTRY với descriptions rõ ràng
 */
export const tools = {
  search_products: searchProducts,
  get_product_detail: getProductDetail,
  add_to_cart: addToCart,
  add_from_last_viewed: addFromLastViewed,
  get_cart: getCart,
  remove_from_cart: removeFromCart,
  update_cart: updateCart,
  get_cart_count: getCartCount,
  create_order: createOrder,
  get_order_detail: getOrderDetail,
  get_user_profile: getUserProfile,
  update_user_profile: updateUserProfile,
  create_vnpay_payment: createVnPayPayment,
  get_user_orders: getUserOrders,
  cancel_order: cancelOrder,
};

/**
 * ✅ GET TOOL DECLARATIONS cho Gemini
 */
export function getToolDeclarations() {
  return [
    {
      name: "search_products",
      description: "Tìm kiếm sản phẩm theo từ khóa. LUÔN GỌI FUNCTION NÀY TRƯỚC khi thêm sản phẩm vào giỏ để lấy productId. Ví dụ: user nói 'thêm iPhone vào giỏ' thì gọi search_products(keyword='iPhone') trước.",
      parameters: {
        type: "object",
        properties: {
          keyword: {
            type: "string",
            description: "Từ khóa tìm kiếm (tên sản phẩm, thương hiệu...)"
          },
          category: {
            type: "string",
            description: "Danh mục sản phẩm (không bắt buộc)"
          },
          minPrice: {
            type: "number",
            description: "Giá tối thiểu (không bắt buộc)"
          },
          maxPrice: {
            type: "number",
            description: "Giá tối đa (không bắt buộc)"
          }
        },
        required: ["keyword"]
      }
    },
    {
      name: "get_product_detail",
      description: "Lấy thông tin chi tiết của một sản phẩm cụ thể theo ID",
      parameters: {
        type: "object",
        properties: {
          productId: {
            type: "string",
            description: "ID của sản phẩm"
          }
        },
        required: ["productId"]
      }
    },
    {
      name: "add_to_cart",
      description: "Thêm sản phẩm vào giỏ hàng. QUAN TRỌNG: Phải có productId (lấy từ search_products). Không được hỏi user về productId.",
      parameters: {
        type: "object",
        properties: {
          productId: {
            type: "string",
            description: "ID của sản phẩm cần thêm (từ kết quả search_products)"
          },
          quantity: {
            type: "number",
            description: "Số lượng sản phẩm (mặc định: 1)"
          }
        },
        required: ["productId"]
      }
    },
    {
      name: "add_from_last_viewed",
      description: "Thêm sản phẩm vào giỏ dựa trên danh sách sản phẩm vừa xem (ví dụ: 'lấy con thứ 2'). Sử dụng chỉ số 1-based.",
      parameters: {
        type: "object",
        properties: {
          index: { type: "number", description: "1-based index trong danh sách lastViewedProducts" },
          quantity: { type: "number", description: "Số lượng (mặc định 1)" }
        },
        required: ["index"]
      }
    },
    {
      name: "get_cart",
      description: "Xem giỏ hàng hiện tại của người dùng",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    },
    {
      name: "update_cart",
      description: "Cập nhật số lượng sản phẩm trong giỏ hàng (productId, quantity)",
      parameters: {
        type: "object",
        properties: {
          productId: { type: "string", description: "ID sản phẩm" },
          quantity: { type: "number", description: "Số lượng mới" }
        },
        required: ["productId", "quantity"]
      }
    },
    {
      name: "get_cart_count",
      description: "Lấy tổng số lượng sản phẩm trong giỏ hàng",
      parameters: { type: "object", properties: {}, required: [] }
    },
    {
      name: "remove_from_cart",
      description: "Xóa sản phẩm khỏi giỏ hàng",
      parameters: {
        type: "object",
        properties: {
          productId: {
            type: "string",
            description: "ID của sản phẩm cần xóa"
          }
        },
        required: ["productId"]
      }
    },
    {
      name: "create_order",
      description: "Tạo đơn hàng từ giỏ hàng hiện tại (shippingAddress, paymentMethod)",
      parameters: {
        type: "object",
        properties: {
          shippingAddress: { type: "object", description: "Địa chỉ giao hàng" },
          paymentMethod: { type: "string", description: "Phương thức thanh toán" }
        },
        required: ["shippingAddress", "paymentMethod"]
      }
    },
    {
      name: "get_order_detail",
      description: "Lấy thông tin chi tiết đơn hàng theo orderId",
      parameters: {
        type: "object",
        properties: { orderId: { type: "string", description: "ID đơn hàng" } },
        required: ["orderId"]
      }
    },
    {
  name: "cancel_order",
  description: "Hủy hoặc xóa đơn hàng của người dùng dựa trên orderId hoặc orderCode.",
  parameters: {
    type: "object",
    properties: {
      orderIdentifier: {
        type: "string",
        description: "ID hoặc mã đơn hàng (orderCode)"
      }
    },
    required: ["orderIdentifier"]
  }
},
    {
      name: "create_vnpay_payment",
      description: "Tạo link thanh toán VNPay cho một đơn hàng (orderId hoặc orderCode).",
      parameters: {
        type: "object",
        properties: {
          orderIdentifier: { type: "string", description: "_id hoặc orderCode của đơn hàng" },
          bankCode: { type: "string", description: "Mã ngân hàng (không bắt buộc)" },
          language: { type: "string", description: "ngôn ngữ (vn/en)" }
        },
        required: ["orderIdentifier"]
      }
    },
    {
      name: "get_user_profile",
      description: "Lấy profile người dùng",
      parameters: { type: "object", properties: {}, required: [] }
    },
    {
      name: "update_user_profile",
      description: "Cập nhật profile người dùng (truyền object updates)",
      parameters: {
        type: "object",
        properties: {
          updates: { type: "object", description: "Các trường cần cập nhật (name, phone, password...)" }
        },
        required: ["updates"]
      }
    },
    {
      name: "get_user_orders",
      description: "Xem danh sách đơn hàng của người dùng",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            description: "Lọc theo trạng thái (pending, processing, shipped, delivered, cancelled)"
          }
        },
        required: []
      }
    }
  ];
}