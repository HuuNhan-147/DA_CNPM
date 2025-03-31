import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderItems: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, required: true }, // Đúng
        image: { type: String, required: true },
        price: { type: Number, required: true },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
      },
    ],
    shippingAddress: {
      fullname: { type: String, required: true },
      phone: { type: String, required: true }, // Đúng
      address: { type: String, required: true },
      city: { type: String, required: true },
    },
    paymentMethod: { type: String, required: true },
    itemsPrice: { type: Number, required: true },
    shippingPrice: { type: Number, required: true },
    taxPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"], // Thêm trạng thái thanh toán
      default: "pending",
    },
    vnpayTransactionId: { type: String }, // Lưu mã giao dịch VNPay
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },
  },
  {
    timestamps: true, // Tự động tạo `createdAt` & `updatedAt`
  }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
