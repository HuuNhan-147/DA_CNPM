import Order from "../../../models/OrderModel.js";
import OrderItem from "../../../models/OrderItemModel.js";
import Payment from "../../../models/PaymentModel.js";
import Cart from "../../../models/CartModel.js";
import CartItem from "../../../models/CartItemModel.js";
import Product from "../../../models/ProductModel.js";
import mongoose from "mongoose";

/**
 * ✅ CẬP NHẬT: Tạo Đơn hàng & Thanh toán đồng bộ (10 Model)
 */
export async function createOrder(args) {
  try {
    const { userId, token, paymentMethod = "COD" } = args;
    if (!userId || !token) throw new Error("Vui lòng đăng nhập");

    // Logic xử lý linh hoạt cho shippingAddress từ AI
    let shippingAddress = args.shippingAddress || {};
    
    // Nếu AI gửi phẳng các trường (hallucination), hãy thử map lại
    if (!shippingAddress.fullname && args.receiverName) shippingAddress.fullname = args.receiverName;
    if (!shippingAddress.phone && (args.phone || args.phoneNumber)) shippingAddress.phone = args.phone || args.phoneNumber;
    if (!shippingAddress.address && args.address) shippingAddress.address = args.address;
    if (!shippingAddress.city && args.city) shippingAddress.city = args.city;

    // Nếu vẫn thiếu City nhưng có Address, cố gắng tách City (thường là phần cuối sau dấu phẩy)
    if (!shippingAddress.city && shippingAddress.address) {
      const parts = shippingAddress.address.split(',');
      if (parts.length > 1) {
        shippingAddress.city = parts[parts.length - 1].trim();
        shippingAddress.address = parts.slice(0, parts.length - 1).join(',').trim();
      } else {
        shippingAddress.city = "Chưa xác định"; // Fallback để vượt qua validation
      }
    }

    // Cuối cùng, nếu vẫn thiếu fullname hoặc phone, lấy từ profile (giả định) hoặc báo lỗi
    if (!shippingAddress.fullname || !shippingAddress.phone || !shippingAddress.address) {
      throw new Error(`Thiếu thông tin giao hàng: ${!shippingAddress.fullname ? 'Họ tên, ' : ''}${!shippingAddress.phone ? 'Số điện thoại, ' : ''}${!shippingAddress.address ? 'Địa chỉ' : ''}`);
    }

    // 1. Lấy dữ liệu giỏ hàng
    const cart = await Cart.findOne({ user: userId });
    if (!cart || cart.cartItems.length === 0) throw new Error("Giỏ hàng trống");

    const cartItems = await CartItem.find({ cart: cart._id }).populate("product");
    if (cartItems.length === 0) throw new Error("Sản phẩm không hợp lệ");

    const itemsPrice = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shippingPrice = 30000;
    const taxPrice = itemsPrice * 0.1;
    const totalPrice = itemsPrice + shippingPrice + taxPrice;

    // 2. Tạo Order
    const order = new Order({
      user: userId,
      shippingAddress,
      orderItems: []
    });
    await order.save();

    // 3. Tạo OrderItems
    const orderItemIds = [];
    for (const item of cartItems) {
      const orderItem = new OrderItem({
        order: order._id,
        product: item.product._id,
        name: item.name || item.product.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image || item.product.image
      });
      await orderItem.save();
      orderItemIds.push(orderItem._id);
    }

    // 4. Tạo Payment (Lưu trữ toàn bộ thông tin giá tiền ở đây)
    const payment = new Payment({
      order: order._id,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      paymentStatus: "pending"
    });
    await payment.save();

    // 5. Cập nhật tham chiếu chéo cho Order
    order.orderItems = orderItemIds;
    order.payment = payment._id;
    await order.save();

    // 6. Dọn dẹp giỏ hàng
    await CartItem.deleteMany({ cart: cart._id });
    await Cart.findByIdAndDelete(cart._id);

    return { 
      success: true, 
      message: "Đặt hàng thành công", 
      orderId: order._id, 
      orderCode: order.orderCode,
      totalPrice 
    };
  } catch (error) {
    console.error("❌ createOrder error:", error.message);
    throw error;
  }
}

export async function getOrderDetail({ userId, orderId, token }) {
  try {
    if (!userId || !token) throw new Error("Vui lòng đăng nhập");

    let order = null;
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      order = await Order.findById(orderId);
    } else {
      order = await Order.findOne({ orderCode: orderId });
    }

    if (!order) return { success: false, message: "Không tìm thấy đơn hàng" };
    if (order.user.toString() !== userId.toString()) throw new Error("Không có quyền");

    // Populate lồng nhau: Order -> OrderItems & Order -> Payment
    await order.populate([
      { path: "user", select: "name email" },
      { path: "orderItems", populate: { path: "product", select: "name image price" } },
      { path: "payment" }
    ]);

    return { success: true, order };
  } catch (error) {
    console.error("❌ getOrderDetail error:", error.message);
    throw error;
  }
}

export async function getUserOrders({ userId }) {
  try {
    if (!userId) return { success: false, message: "Thiếu userId" };

    const orders = await Order.find({ user: userId })
      .populate("orderItems")
      .populate("payment") // Lấy tiền từ bảng Payment
      .sort({ createdAt: -1 })
      .lean();

    const data = orders.map(o => ({
      id: o._id,
      orderCode: o.orderCode,
      totalPrice: o.payment?.totalPrice || 0, // Dùng payment.totalPrice
      itemsCount: o.orderItems?.reduce((s, it) => s + it.quantity, 0) || 0,
      status: o.payment?.paymentStatus || (o.isDelivered ? 'delivered' : 'pending'),
      createdAt: o.createdAt
    }));

    return { success: true, data, total: data.length, message: `Bạn có ${data.length} đơn hàng` };
  } catch (error) {
    console.error("❌ getUserOrders error:", error.message);
    return { success: false, message: "Không thể lấy đơn hàng" };
  }
}

export async function cancelOrder({ userId, orderIdentifier, token }) {
  try {
    if (!userId || !token) throw new Error("Vui lòng đăng nhập");

    let order;
    if (mongoose.Types.ObjectId.isValid(orderIdentifier)) {
      order = await Order.findById(orderIdentifier).populate("payment");
    } else {
      order = await Order.findOne({ orderCode: orderIdentifier }).populate("payment");
    }

    if (!order) return { success: false, message: "Không thấy đơn hàng" };
    if (order.user.toString() !== userId.toString()) throw new Error("Không có quyền");

    if (order.payment?.isPaid) return { success: false, message: "Đã thanh toán, không thể hủy" };

    // Hoàn lại kho nếu tồn kho đã bị trừ
    if (order.stockReduced) {
      const orderItems = await OrderItem.find({ order: order._id });
      for (const item of orderItems) {
        const product = await Product.findById(item.product);
        if (product) {
          product.countInStock += item.quantity;
          await product.save();
        }
      }
    }

    await OrderItem.deleteMany({ order: order._id });
    if (order.payment) await Payment.findByIdAndDelete(order.payment._id);
    await order.deleteOne();

    return { success: true, message: "Đã hủy đơn hàng" };
  } catch (error) {
    console.error("❌ cancelOrder error:", error.message);
    return { success: false, message: "Lỗi khi hủy đơn hàng" };
  }
}