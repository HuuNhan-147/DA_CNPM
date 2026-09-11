import moment from "moment";
import crypto from "crypto";
import Order from "../../../models/OrderModel.js";
import Payment from "../../../models/PaymentModel.js"; // Nhập thêm PaymentModel

/**
 * ✅ CẬP NHẬT: Tạo link VNPay từ bảng Payment (10 Model)
 */
export async function createVnPayPayment({ 
  orderIdentifier, 
  orderId,         
  bankCode, 
  language = "vn" 
}) {
  try {
    const searchValue = orderIdentifier || orderId;

    if (!searchValue) {
      return { success: false, message: "Thiếu mã đơn hàng!" };
    }

    // 1. Tìm Order để lấy tham chiếu Payment
    let order;
    if (/^[0-9a-fA-F]{24}$/.test(searchValue)) {
      order = await Order.findById(searchValue).populate("payment");
    } else {
      order = await Order.findOne({ orderCode: searchValue.toUpperCase() }).populate("payment");
    }

    if (!order) return { success: false, message: "Không tìm thấy đơn hàng!" };

    // 2. Lấy thông tin thanh toán từ bảng Payment
    const payment = order.payment;
    if (!payment) return { success: false, message: "Đơn hàng này không có thông tin thanh toán!" };

    if (payment.paymentStatus === "paid" || payment.isPaid)
      return { success: false, message: "Đơn hàng đã được thanh toán rồi!" };

    const tmnCode = process.env.VNP_TMNCODE;
    const secretKey = process.env.VNP_HASH_SECRET;
    const vnpUrl = process.env.VNP_URL;
    const returnUrl = process.env.VNP_RETURN_URL;

    const createDate = moment().format("YYYYMMDDHHmmss");
    const ipAddr = "127.0.0.1";
    const amount = payment.totalPrice; // Lấy tiền từ bảng Payment

    // Dùng ID của Order làm mã tham chiếu
    const txnRef = order._id.toString();

    let vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: tmnCode,
      vnp_Locale: language,
      vnp_CurrCode: "VND",
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: `Thanh toan cho don hang: ${order.orderCode}`,
      vnp_OrderType: "other",
      vnp_Amount: amount * 100, // VNPay tính theo đơn vị Xu (x100)
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    if (bankCode) vnp_Params["vnp_BankCode"] = bankCode;

    const redirectUrl = new URL(vnpUrl);
    Object.entries(vnp_Params)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([key, value]) => {
        redirectUrl.searchParams.append(key, value.toString());
      });

    const signData = redirectUrl.search.slice(1);
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    redirectUrl.searchParams.append("vnp_SecureHash", signed);

    return {
      success: true,
      paymentUrl: redirectUrl.toString(),
      orderCode: order.orderCode,
      amount,
      message: "Đã tạo link thanh toán VNPay thành công!"
    };

  } catch (err) {
    console.error("VNPay error:", err);
    return { success: false, message: "Lỗi khi tạo link thanh toán." };
  }
}
