import Order from "../../../models/OrderModel.js";
import mongoose from "mongoose";

import Cart from "../../../models/CartModel.js";

/**
 * Tạo đơn hàng dựa trên giỏ hàng hiện tại của user
 */
export async function createOrder({ userId, shippingAddress, paymentMethod, token }) {
  try {
    if (!userId || !token) {
      throw new Error("Bạn cần đăng nhập để tạo đơn hàng");
    }

    const cart = await Cart.findOne({ user: userId }).populate(
      "cartItems.product",
      "name price image"
    );

    if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
      throw new Error("Giỏ hàng trống");
    }

    const itemsPrice = cart.cartItems.reduce(
      (acc, item) => acc + (item.product?.price || item.price) * item.quantity,
      0
    );
    const shippingPrice = 30000;
    const taxPrice = itemsPrice * 0.1;
    const totalPrice = itemsPrice + shippingPrice + taxPrice;

    const order = new Order({
      user: userId,
      orderItems: cart.cartItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      isPaid: false,
      paymentStatus: "pending",
    });

    await order.save();

    return { success: true, message: "Đơn hàng đã được tạo", order };
  } catch (error) {
    console.error("❌ Create order error:", error.message);
    throw error;
  }
}

export async function getOrderDetail({ userId, orderId, token }) {
  try {
    if (!userId || !token) {
      throw new Error("Bạn cần đăng nhập để xem đơn hàng");
    }

    if (!orderId) throw new Error("Thiếu orderId");

    // Support both ObjectId lookup and orderCode lookup (e.g., DH512051-806)
    let order = null;

    if (mongoose.Types.ObjectId.isValid(orderId)) {
      order = await Order.findById(orderId)
        .populate("user", "name email")
        .populate({ path: "orderItems.product", select: "name image price" });
    }

    // If not found by _id, try find by orderCode
    if (!order) {
      order = await Order.findOne({ orderCode: orderId })
        .populate("user", "name email")
        .populate({ path: "orderItems.product", select: "name image price" });
    }

    if (!order) return { success: false, message: "Không tìm thấy đơn hàng" };

    if (!order.user || order.user._id.toString() !== userId.toString()) {
      return { success: false, message: "Bạn không có quyền xem đơn hàng này" };
    }

    return { success: true, order };
  } catch (error) {
    console.error("❌ Get order detail error:", error.message);
    throw error;
  }
}

/**
 * Lấy danh sách đơn hàng của user trực tiếp từ DB
 */
export async function getUserOrders({ userId }) {
  try {
    if (!userId) {
      return { success: false, message: "Thiếu userId" };
    }

    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 }).lean();

    const data = orders.map(o => ({
      id: o._id,
      orderCode: o.orderCode,
      totalPrice: o.totalPrice,
      itemsCount: o.orderItems.reduce((s, it) => s + it.quantity, 0),
      status: o.paymentStatus || (o.isDelivered ? 'delivered' : 'pending'),
      createdAt: o.createdAt
    }));

    return { success: true, data, total: data.length, message: `Tìm thấy ${data.length} đơn hàng` };
  } catch (error) {
    console.error("❌ Lỗi lấy trạng thái đơn hàng:", error.message);
    return { message: "Không thể truy xuất đơn hàng của bạn." };
  }
}
export async function cancelOrder({ userId, orderIdentifier, token }) {
  try {
    if (!userId || !token) throw new Error("Bạn cần đăng nhập để hủy đơn hàng");

    let order = null;

    // Hỗ trợ tìm theo _id hoặc orderCode
    if (mongoose.Types.ObjectId.isValid(orderIdentifier)) {
      order = await Order.findById(orderIdentifier);
    }
    if (!order) {
      order = await Order.findOne({ orderCode: orderIdentifier });
    }

    if (!order) return { success: false, message: "Không tìm thấy đơn hàng" };

    // Kiểm tra quyền
    if (order.user.toString() !== userId.toString()) {
      return { success: false, message: "Bạn không có quyền hủy đơn hàng này" };
    }

    // Kiểm tra trạng thái: chỉ cho phép hủy nếu chưa thanh toán
    if (order.isPaid) {
      return { success: false, message: "Đơn hàng đã thanh toán, không thể hủy!" };
    }

    await order.deleteOne();

    return { success: true, message: "Đơn hàng đã được hủy thành công" };
  } catch (error) {
    console.error("❌ cancelOrder error:", error.message);
    return { success: false, message: "Không thể hủy đơn hàng." };
  }
}