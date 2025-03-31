import express from "express";
import moment from "moment";
import crypto from "crypto";
import qs from "qs";
import dotenv from "dotenv";
import Order from "../models/OrderModel.js";

dotenv.config();

export const createPayment = async (req, res) => {
  try {
    process.env.TZ = "Asia/Ho_Chi_Minh";

    let date = new Date();
    let createDate = moment(date).format("YYYYMMDDHHmmss");
    let orderId = req.body.orderId; // Lấy orderId từ request

    let ipAddr =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket?.remoteAddress;

    let tmnCode = process.env.VNP_TMNCODE;
    let secretKey = process.env.VNP_HASH_SECRET;
    let vnpUrl = process.env.VNP_URL;
    let returnUrl = process.env.VNP_RETURN_URL;
    let bankCode = req.body.bankCode;

    let locale = req.body.language || "vn";
    let currCode = "VND";

    // Lấy totalPrice từ đơn hàng
    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ status: "error", message: "Đơn hàng không tồn tại!" });
    }

    let amount = order.totalPrice.toString(); // Thay thế amount từ req.body.amount

    let vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: tmnCode,
      vnp_Locale: locale,
      vnp_CurrCode: currCode,
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Thanh toan cho ma GD: ${orderId}`,
      vnp_OrderType: "other",
      vnp_Amount: amount * 100, // Nhân 100 theo yêu cầu của VNPay
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    if (bankCode) {
      vnp_Params["vnp_BankCode"] = bankCode;
    }

    const redirectUrl = new URL(vnpUrl);
    Object.entries(vnp_Params)
      .sort(([key1], [key2]) => key1.toString().localeCompare(key2.toString()))
      .forEach(([key, value]) => {
        if (!value) return;
        redirectUrl.searchParams.append(key, value.toString());
      });

    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac
      .update(Buffer.from(redirectUrl.search.slice(1).toString(), "utf-8"))
      .digest("hex");

    redirectUrl.searchParams.append("vnp_SecureHash", signed);

    res.json({ status: "success", paymentUrl: redirectUrl.toString() });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const vnpayReturn = async (req, res) => {
  try {
    const vnp_Params = req.query;

    // 1. Verify signature
    const secureHash = vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    const sortedParams = sortObject(vnp_Params);
    const secretKey = process.env.VNP_HASH_SECRET;
    const signData = qs.stringify(sortedParams, { encode: false });
    const signed = crypto
      .createHmac("sha512", secretKey)
      .update(Buffer.from(signData, "utf-8"))
      .digest("hex");

    if (secureHash.toLowerCase() !== signed.toLowerCase()) {
      return res.status(400).json({
        code: "INVALID_SIGNATURE",
        message: "Invalid checksum",
        data: vnp_Params,
      });
    }

    // 2. Process transaction
    const orderId = vnp_Params["vnp_TxnRef"]; // Lưu ý: Đây là orderId bạn gửi sang VNPay ban đầu
    const responseCode = vnp_Params["vnp_ResponseCode"];
    const transactionId = vnp_Params["vnp_TransactionNo"];
    const amount = vnp_Params["vnp_Amount"] / 100;

    // 3. Tìm đơn hàng bằng _id thay vì orderId nếu bạn dùng _id làm transaction reference
    const order = await Order.findById(orderId); // Thay đổi quan trọng ở đây

    if (!order) {
      console.error(`Order not found: ${orderId}`);
      return res.status(404).json({
        code: "ORDER_NOT_FOUND",
        message: "Order not found",
        orderId,
      });
    }

    // 4. Cập nhật với transaction và session để đảm bảo atomicity
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (responseCode === "00") {
        // Success case
        order.isPaid = true;
        order.paidAt = new Date();
        order.paymentStatus = "paid";
        order.vnpayTransactionId = transactionId;
        order.paymentResult = {
          status: "success",
          transactionId,
          amount,
          bankCode: vnp_Params["vnp_BankCode"],
          payDate: vnp_Params["vnp_PayDate"],
          responseCode,
        };
      } else {
        // Failed case
        order.paymentStatus = "failed";
        order.paymentResult = {
          status: "failed",
          transactionId,
          amount,
          errorCode: responseCode,
          message:
            vnp_Params["vnp_ResponseMessage"] || "Payment rejected by VNPay",
        };
      }

      // 5. Sử dụng save() với session thay vì findOneAndUpdate
      await order.save({ session });
      await session.commitTransaction();

      console.log(`Order ${order._id} updated successfully`, {
        paymentStatus: order.paymentStatus,
        isPaid: order.isPaid,
      });

      // 6. Response tương ứng
      if (responseCode === "00") {
        return res.json({
          code: "SUCCESS",
          message: "Payment completed",
          data: {
            orderId: order._id,
            amountPaid: amount,
            transactionId,
            paymentStatus: order.paymentStatus,
          },
        });
      } else {
        return res.status(400).json({
          code: "PAYMENT_FAILED",
          message: `Payment failed (Code: ${responseCode})`,
          data: {
            orderId: order._id,
            errorCode: responseCode,
          },
        });
      }
    } catch (updateError) {
      await session.abortTransaction();
      console.error("Transaction error:", updateError);
      throw updateError;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error("VNPAY_RETURN_ERROR:", error);
    return res.status(500).json({
      code: "SERVER_ERROR",
      message: "Payment processing failed",
      error: error.message,
    });
  }
};

// Sắp xếp object theo key
function sortObject(obj) {
  let sorted = {};
  let keys = Object.keys(obj).sort();
  keys.forEach((key) => {
    sorted[key] = obj[key];
  });
  return sorted;
}
