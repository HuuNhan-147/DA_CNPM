import querystring from "qs";
import crypto from "crypto";
import moment from "moment";
import { VNPAY_CONFIG } from "../config/vnpayConfig.js";
import Order from "../models/OrderModel.js";
import { v4 as uuidv4 } from "uuid";

// ✅ Tạo thanh toán VNPay
export const createPayment = async (req, res) => {
  try {
    // 1. Validate input
    let amount = req.body.amount;
    let bankCode = req.body.bankCode;
    let locale = req.body.language;
    let currCode = "VND"; // Thêm đơn vị tiền tệ VND

    if (!locale || locale === "") {
      locale = "vn"; // Thiết lập giá trị mặc định
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        code: "01",
        message: "Invalid amount",
      });
    }

    // 2. Get VNPay config
    const vnpConfig = {
      tmnCode: VNPAY_CONFIG.vnp_TmnCode,
      secretKey: VNPAY_CONFIG.vnp_HashSecret,
      url: VNPAY_CONFIG.vnp_Url,
      returnUrl: VNPAY_CONFIG.vnp_ReturnUrl,
    };

    // 3. Get client IP
    let ipAddr =
      req.headers["x-forwarded-for"] ||
      req.socket?.remoteAddress ||
      req.connection?.remoteAddress ||
      "127.0.0.1";

    ipAddr = ipAddr.includes("::1")
      ? "127.0.0.1"
      : ipAddr.replace("::ffff:", "");

    // 4. Generate transaction data
    const transactionId = uuidv4().replace(/-/g, "").substring(0, 12);
    const createDate = moment().format("YYYYMMDDHHmmss");

    // 5. Prepare payment params
    const vnpParams = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: vnpConfig.tmnCode,
      vnp_Amount: Math.floor(amount * 100), // VNPay requires amount in VND subunits
      vnp_CurrCode: currCode, // Thêm đơn vị tiền tệ
      vnp_TxnRef: transactionId,
      vnp_OrderInfo: `Payment for order #${transactionId}`,
      vnp_OrderType: "other",
      vnp_ReturnUrl: vnpConfig.returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
      vnp_Locale: locale,
      ...(bankCode && { vnp_BankCode: bankCode }),
    };

    // 6. Generate secure hash
    const sortedParams = Object.keys(vnpParams)
      .sort()
      .reduce((acc, key) => ({ ...acc, [key]: vnpParams[key] }), {});

    const signData = querystring.stringify(sortedParams, { encode: false });
    const secureHash = crypto
      .createHmac("sha512", vnpConfig.secretKey)
      .update(signData)
      .digest("hex");

    // 7. Build payment URL
    const paymentUrl = `${vnpConfig.url}?${querystring.stringify(
      { ...sortedParams, vnp_SecureHash: secureHash },
      { encode: true }
    )}`;

    // 8. Return response
    return res.json({
      code: "00",
      message: "Success",
      data: {
        paymentUrl,
        transactionId,
        amount: Number(amount),
        vnpParams: { ...vnpParams, vnp_SecureHash: secureHash },
      },
    });
  } catch (error) {
    console.error("[VNPAY ERROR]", error);
    return res.status(500).json({
      code: "99",
      message: "System error",
    });
  }
};

// ✅ Xử lý kết quả thanh toán từ VNPay
export const vnpayReturn = async (req, res) => {
  try {
    const vnp_Params = req.query;
    const secureHash = vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    // Sắp xếp lại tham số và tạo chữ ký kiểm tra
    const sortedParams = Object.keys(vnp_Params)
      .sort()
      .map((key) => `${key}=${vnp_Params[key]}`)
      .join("&");

    const hmac = crypto.createHmac("sha512", VNPAY_CONFIG.vnp_HashSecret);
    const signed = hmac.update(sortedParams).digest("hex");

    if (secureHash !== signed) {
      return res.status(400).json({ message: "Sai chữ ký bảo mật!" });
    }

    // Kiểm tra đơn hàng trong database
    const orderId = vnp_Params["vnp_TxnRef"];
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Đơn hàng không tồn tại!" });
    }

    // Kiểm tra nếu đơn hàng đã thanh toán trước đó
    if (order.isPaid) {
      return res.status(200).json({
        message: "Đơn hàng đã được thanh toán trước đó.",
        order,
      });
    }

    if (vnp_Params["vnp_ResponseCode"] === "00") {
      order.isPaid = true;
      order.paidAt = new Date();
      await order.save();
      return res.status(200).json({
        message: "Thanh toán thành công!",
        order,
      });
    } else {
      return res.status(400).json({
        message: "Thanh toán thất bại!",
        responseCode: vnp_Params["vnp_ResponseCode"],
      });
    }
  } catch (error) {
    console.error("[VNPAY RETURN ERROR]", error);
    return res.status(500).json({
      message: "Lỗi xử lý thanh toán!",
      error: error.message,
    });
  }
};
