import moment from "moment";
import crypto from "crypto";
import qs from "qs";
import Order from "../models/OrderModel.js";
import Product from "../models/ProductModel.js";
import mongoose from "mongoose";

export const createPaymentUrl = async (orderId, ipAddr, bankCode, language) => {
  process.env.TZ = "Asia/Ho_Chi_Minh";
  let createDate = moment(new Date()).format("YYYYMMDDHHmmss");

  let tmnCode = process.env.VNP_TMNCODE;
  let secretKey = process.env.VNP_HASH_SECRET;
  let vnpUrl = process.env.VNP_URL;
  let returnUrl = process.env.VNP_RETURN_URL;
  
  const order = await Order.findById(orderId).populate("payment");
  if (!order) throw new Error("Đơn hàng không tồn tại!");
  if (!order.payment) throw new Error("Thông tin thanh toán không tồn tại!");

  let amount = order.payment.totalPrice.toString();
  let vnp_Params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Locale: language || "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: orderId,
    vnp_OrderInfo: `Thanh toan cho ma GD: ${orderId}`,
    vnp_OrderType: "other",
    vnp_Amount: amount * 100,
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
  };

  if (bankCode) vnp_Params["vnp_BankCode"] = bankCode;

  const redirectUrl = new URL(vnpUrl);
  Object.entries(vnp_Params)
    .sort(([key1], [key2]) => key1.toString().localeCompare(key2.toString()))
    .forEach(([key, value]) => {
      if (!value) return;
      redirectUrl.searchParams.append(key, value.toString());
    });

  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(redirectUrl.search.slice(1).toString(), "utf-8")).digest("hex");
  redirectUrl.searchParams.append("vnp_SecureHash", signed);

  return redirectUrl.toString();
};

export const processVnPayReturn = async (vnp_Params) => {
  const secureHash = vnp_Params["vnp_SecureHash"];
  if (!secureHash) throw new Error("Missing vnp_SecureHash");

  const vnp_Params_Copy = { ...vnp_Params };
  delete vnp_Params_Copy["vnp_SecureHash"];
  delete vnp_Params_Copy["vnp_SecureHashType"];

  const sortedParams = sortObject(vnp_Params_Copy);
  const secretKey = process.env.VNP_HASH_SECRET;
  const signData = qs.stringify(sortedParams, { encode: false });
  const signed = crypto.createHmac("sha512", secretKey).update(Buffer.from(signData, "utf-8")).digest("hex");

  if (secureHash.toLowerCase() !== (signed || "").toLowerCase()) throw new Error("Invalid signature");

  const orderId = vnp_Params["vnp_TxnRef"];
  const responseCode = vnp_Params["vnp_ResponseCode"];
  const transactionId = vnp_Params["vnp_TransactionNo"];
  const amount = vnp_Params["vnp_Amount"] / 100;

  const order = await Order.findById(orderId).populate("payment");
  if (!order) throw new Error("Order not found");

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (responseCode === "00") {
      if (order.payment) {
        order.payment.isPaid = true;
        order.payment.paidAt = new Date();
        order.payment.paymentStatus = "paid";
        order.payment.vnpayTransactionId = transactionId;
        await order.payment.save({ session });
      }

      if (!order.stockReduced) {
        for (const item of order.orderItems) {
          const product = await Product.findById(item.product).session(session);
          if (product) {
            product.countInStock -= item.quantity;
            await product.save({ session });
          }
        }
        order.stockReduced = true;
      }
    } else {
      if (order.payment) {
        order.payment.paymentStatus = "failed";
        await order.payment.save({ session });
      }
    }

    await order.save({ session });
    await session.commitTransaction();
    session.endSession();

    return { order, amount, responseCode, transactionId };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

function sortObject(obj) {
  let sorted = {};
  let keys = Object.keys(obj).sort();
  keys.forEach((key) => {
    sorted[key] = obj[key];
  });
  return sorted;
}
