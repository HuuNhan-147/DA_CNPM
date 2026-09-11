// modules/ai-agent/tools/actions/paymentTools.js
import * as vnpayService from "../../../../services/VnPayService.js";
import * as orderService from "../../../../services/OrderService.js";

/**
 * Tạo URL thanh toán VNPay thông qua VnPayService
 */
export async function createVnPayPayment({
  orderIdentifier,
  orderId,
  bankCode,
  language = "vn",
  userId = null,
}) {
  try {
    const searchValue = orderIdentifier || orderId;
    if (!searchValue) {
      return { success: false, message: "Thiếu mã đơn hàng!" };
    }

    // Tra cứu đơn hàng thông qua OrderService
    let order = null;
    try {
      order = await orderService.getOrderById(searchValue, { _id: userId, isAdmin: true });
    } catch (e) {
      return { success: false, message: "Không tìm thấy đơn hàng!" };
    }

    if (!order) return { success: false, message: "Không tìm thấy đơn hàng!" };

    const payment = order.payment;
    if (!payment) return { success: false, message: "Đơn hàng này không có thông tin thanh toán!" };

    if (payment.paymentStatus === "paid" || payment.isPaid) {
      return { success: false, message: "Đơn hàng đã được thanh toán rồi!" };
    }

    const ipAddr = "127.0.0.1";
    const paymentUrl = await vnpayService.createPaymentUrl(
      order._id.toString(),
      ipAddr,
      bankCode,
      language
    );

    return {
      success: true,
      message: "Tạo link thanh toán thành công",
      paymentUrl,
      orderCode: order.orderCode,
      totalPrice: payment.totalPrice,
    };
  } catch (error) {
    console.error("❌ createVnPayPayment tool error:", error.message);
    return { success: false, message: error.message || "Lỗi khi tạo link thanh toán" };
  }
}
