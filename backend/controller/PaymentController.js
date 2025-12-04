// utils/aiAgent/actions/paymentTools.js
import moment from "moment";
import crypto from "crypto";
import querystring from "qs";
import Order from "../../../models/OrderModel.js";

/**
 * ✅ FIXED: Tạo URL thanh toán VNPay đúng chuẩn (giống controller)
 */
export async function createVnPayPayment({ 
  orderIdentifier, // ✅ Có thể là orderId HOẶC orderCode
  orderId,         // ✅ Backward compatibility
  bankCode, 
  language = "vn" 
}) {
  try {
    // ✅ FIX: Xử lý cả orderId và orderIdentifier
    const searchValue = orderIdentifier || orderId;
    
    if (!searchValue) {
      return { 
        success: false, 
        message: "Vui lòng cung cấp mã đơn hàng hoặc ID đơn hàng!" 
      };
    }

    console.log(`🔍 Searching order by: ${searchValue}`);

    // ✅ FIX: Tìm đơn hàng theo orderCode HOẶC _id
    let order;
    
    // Nếu là MongoDB ObjectId (24 ký tự hex)
    if (/^[0-9a-fA-F]{24}$/.test(searchValue)) {
      order = await Order.findById(searchValue);
      console.log(`📦 Found order by _id: ${order ? 'Yes' : 'No'}`);
    } 
    // Nếu là orderCode (DH123456-789)
    else {
      order = await Order.findOne({ orderCode: searchValue.toUpperCase() });
      console.log(`📦 Found order by orderCode: ${order ? 'Yes' : 'No'}`);
    }

    // Kiểm tra đơn hàng tồn tại
    if (!order) {
      return { 
        success: false, 
        message: `Không tìm thấy đơn hàng với mã "${searchValue}". Vui lòng kiểm tra lại!` 
      };
    }

    // Kiểm tra trạng thái đơn hàng
    if (order.paymentStatus === "paid") {
      return {
        success: false,
        message: `Đơn hàng ${order.orderCode} đã được thanh toán rồi!`
      };
    }

    if (order.status === "cancelled") {
      return {
        success: false,
        message: `Đơn hàng ${order.orderCode} đã bị hủy. Không thể thanh toán!`
      };
    }

    // Config VNPay
    const tmnCode = process.env.VNP_TMNCODE;
    const secretKey = process.env.VNP_HASH_SECRET;
    const vnpUrl = process.env.VNP_URL;
    const returnUrl = process.env.VNP_RETURN_URL;

    // Validate config
    if (!tmnCode || !secretKey || !vnpUrl || !returnUrl) {
      console.error("❌ Missing VNPay config:", { tmnCode, secretKey, vnpUrl, returnUrl });
      return {
        success: false,
        message: "Cấu hình VNPay chưa đầy đủ. Vui lòng liên hệ admin!"
      };
    }

    // Thời gian và IP
    const createDate = moment().format("YYYYMMDDHHmmss");
    const ipAddr = "127.0.0.1";

    // Lấy amount từ đơn hàng
    const amount = order.totalPrice;

    if (!amount || amount <= 0) {
      return {
        success: false,
        message: "Số tiền đơn hàng không hợp lệ!"
      };
    }

    // ✅ QUAN TRỌNG: Sử dụng order._id làm vnp_TxnRef
    const txnRef = order._id.toString();

    // Build params
    const vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: tmnCode,
      vnp_Locale: language,
      vnp_CurrCode: "VND",
      vnp_TxnRef: txnRef, // ✅ Sử dụng _id thay vì orderCode
      vnp_OrderInfo: `Thanh toan don hang ${order.orderCode}`,
      vnp_OrderType: "other",
      vnp_Amount: Math.floor(amount * 100), // VNPay yêu cầu amount * 100
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    if (bankCode) vnp_Params["vnp_BankCode"] = bankCode;

    // ✅ FIX: Sắp xếp params giống controller
    const sortedParams = Object.keys(vnp_Params)
      .sort()
      .reduce((acc, key) => ({ ...acc, [key]: vnp_Params[key] }), {});

    // ✅ FIX: Tạo signData với encode: false (giống controller)
    const signData = querystring.stringify(sortedParams, { encode: false });

    // ✅ Tạo HMAC-SHA512 signature
    const hmac = crypto.createHmac("sha512", secretKey);
    const secureHash = hmac.update(signData).digest("hex");

    // ✅ FIX: Tạo URL với encode: true và gộp secureHash vào (giống controller)
    const paymentUrl = `${vnpUrl}?${querystring.stringify(
      { ...sortedParams, vnp_SecureHash: secureHash },
      { encode: true }
    )}`;

    console.log(`✅ VNPay payment URL created for order ${order.orderCode}`);
    console.log(`💰 Amount: ${amount.toLocaleString("vi-VN")}đ`);
    console.log(`🔗 Payment URL:`, paymentUrl);

    // Trả về URL
    return {
      success: true,
      paymentUrl: paymentUrl,
      transactionId: txnRef,
      orderCode: order.orderCode,
      amount: amount,
      message: `Link thanh toán VNPay cho đơn hàng ${order.orderCode} đã được tạo thành công!`
    };
  } catch (error) {
    console.error("❌ createVnPayPayment error:", error);
    return { 
      success: false, 
      message: error.message || "Lỗi khi tạo link VNPay. Vui lòng thử lại!" 
    };
  }
}