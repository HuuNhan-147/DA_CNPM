import * as vnpayService from "../services/VnPayService.js";

export const createPayment = async (req, res) => {
  try {
    let ipAddr =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket?.remoteAddress;

    const paymentUrl = await vnpayService.createPaymentUrl(
      req.body.orderId,
      ipAddr,
      req.body.bankCode,
      req.body.language
    );

    res.send(paymentUrl);
  } catch (error) {
    const status = error.message.includes("không tồn tại") ? 404 : 500;
    res.status(status).json({ status: "error", message: error.message });
  }
};

export const vnpayReturn = async (req, res) => {
  try {
    const result = await vnpayService.processVnPayReturn(req.query);
    const { order, amount, responseCode, transactionId } = result;

    if (responseCode === "00") {
      return res.json({
        code: "SUCCESS",
        message: "Payment completed",
        data: {
          orderId: order._id,
          amountPaid: amount,
          transactionId,
          paymentStatus: "paid",
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
  } catch (error) {
    console.error("VNPAY_RETURN_ERROR:", error);
    const status = error.message === "Order not found" ? 404 : (error.message.includes("Invalid") ? 400 : 500);
    return res.status(status).json({
      code: "ERROR",
      message: error.message,
    });
  }
};
