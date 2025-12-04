import moment from "moment";
import crypto from "crypto";
import Order from "../../../models/OrderModel.js";

export async function createVnPayPayment({ 
  orderIdentifier, 
  orderId,         
  bankCode, 
  language = "vn" 
}) {
  try {
    const searchValue = orderIdentifier || orderId;

    if (!searchValue) {
      return { success: false, message: "Thiếu orderId hoặc orderCode!" };
    }

    // Tìm order theo _id hoặc orderCode
    let order;
    if (/^[0-9a-fA-F]{24}$/.test(searchValue)) {
      order = await Order.findById(searchValue);
    } else {
      order = await Order.findOne({ orderCode: searchValue.toUpperCase() });
    }

    if (!order)
      return { success: false, message: "Không tìm thấy đơn hàng!" };

    if (order.paymentStatus === "paid")
      return { success: false, message: "Đơn hàng đã thanh toán!" };

    const tmnCode = process.env.VNP_TMNCODE;
    const secretKey = process.env.VNP_HASH_SECRET;
    const vnpUrl = process.env.VNP_URL;
    const returnUrl = process.env.VNP_RETURN_URL;

    const createDate = moment().format("YYYYMMDDHHmmss");
    const ipAddr = "127.0.0.1";
    const amount = order.totalPrice;

    // Dùng _id làm vnp_TxnRef giống controller
    const txnRef = order._id.toString();

    let vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: tmnCode,
      vnp_Locale: language,
      vnp_CurrCode: "VND",
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: `Thanh toan cho ma GD: ${txnRef}`,
      vnp_OrderType: "other",
      vnp_Amount: amount * 100,
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    if (bankCode) vnp_Params["vnp_BankCode"] = bankCode;

    // ================================
    // 🔥 GIỐNG 100% LOGIC CONTROLLER
    // ================================
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
      transactionId: txnRef,
      orderCode: order.orderCode,
      amount,
      message: "Tạo link thanh toán thành công!"
    };

  } catch (err) {
    console.error("VNPay error:", err);
    return { success: false, message: err.message };
  }
}
