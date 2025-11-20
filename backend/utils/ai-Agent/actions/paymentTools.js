import Order from "../../../models/OrderModel.js";
import moment from "moment";
import crypto from "crypto";

// Tạo link thanh toán VNPay cho một đơn hàng (hỗ trợ orderId hoặc orderCode)
export async function createVnPayPayment({ orderIdentifier, userId, token, bankCode, language = 'vn' }) {
  try {
    const response = await axios.post("http://localhost:5000/api/vnpay/create_payment", {
      amount,
      bankCode,
      language,
    });

    if (response.data?.data?.paymentUrl) {
      return {
        success: true,
        message: "Tạo link thanh toán VNPay thành công!",
        paymentUrl: response.data.data.paymentUrl,
        transactionId: response.data.data.transactionId,
      };
    } else {
      return { success: false, message: "Không tạo được link thanh toán VNPay." };
    }
  } catch (error) {
    console.error('❌ createVnPayPayment error:', error.message);
    throw error;
  }
}
