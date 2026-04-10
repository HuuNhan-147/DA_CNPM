import Order from "../models/OrderModel.js";
import User from "../models/UserModel.js";
import Product from "../models/ProductModel.js";
import OrderItem from "../models/OrderItemModel.js";
import Payment from "../models/PaymentModel.js";
import mongoose from "mongoose";

export const createOrder = async (userId, orderData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderItems, shippingAddress, paymentMethod } = orderData;

    if (!orderItems || orderItems.length === 0) {
      throw new Error("Không có sản phẩm nào!");
    }

    for (const item of orderItems) {
      const product = await Product.findById(item.product).session(session);
      if (!product) throw new Error(`Sản phẩm ${item.name} không tồn tại`);
      if (product.countInStock < item.quantity) {
        throw new Error(`Sản phẩm ${item.name} không đủ số lượng trong kho (Còn ${product.countInStock})`);
      }
    }

    const itemsPrice = orderItems.reduce((total, item) => total + item.price * item.quantity, 0);
    const shippingPrice = 30000;
    const taxPrice = itemsPrice * 0.1;
    const totalPrice = itemsPrice + shippingPrice + taxPrice;

    const order = new Order({
      user: userId,
      shippingAddress,
      isDelivered: false
    });
    const savedOrder = await order.save({ session });

    const payment = new Payment({
      order: savedOrder._id,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      isPaid: false,
      paymentStatus: "pending"
    });
    const savedPayment = await payment.save({ session });

    const orderItemDocs = orderItems.map(item => ({
      order: savedOrder._id,
      product: item.product,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      image: item.image,
    }));
    const insertedItems = await OrderItem.insertMany(orderItemDocs, { session });
    
    savedOrder.payment = savedPayment._id;
    savedOrder.orderItems = insertedItems.map(i => i._id);
    const createdOrder = await savedOrder.save({ session });

    await session.commitTransaction();
    session.endSession();

    return await Order.findById(createdOrder._id).populate("orderItems").populate("payment");
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const getAllOrders = async () => {
  return await Order.find().populate("user", "name email").populate("payment");
};

export const getOrderById = async (id, user) => {
  let order;
  const populateObj = [
    { path: "user", select: "name email" },
    { path: "payment" },
    { path: "orderItems", populate: { path: "product", select: "name image price" } }
  ];

  if (/^[0-9a-fA-F]{24}$/.test(id)) {
    order = await Order.findById(id).populate(populateObj);
  } else {
    order = await Order.findOne({ orderCode: id }).populate(populateObj);
  }

  if (!order) throw new Error("Đơn hàng không tồn tại!");

  if (user._id.toString() !== order.user._id.toString() && !user.isAdmin) {
    throw new Error("forbidden");
  }

  return order;
};

export const updateOrderToPaid = async (id) => {
  const order = await Order.findById(id).populate("payment").populate("orderItems");
  if (!order || !order.payment) throw new Error("Đơn hàng hoặc thanh toán không tồn tại!");

  const payment = order.payment;
  payment.isPaid = true;
  payment.paidAt = Date.now();
  payment.paymentStatus = "paid";
  await payment.save();

  if (!order.stockReduced) {
    for (const item of order.orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        product.countInStock -= item.quantity;
        await product.save();
      }
    }
    order.stockReduced = true;
  }

  return await order.save();
};

export const updateOrderToDelivered = async (id) => {
  const order = await Order.findById(id);
  if (!order) throw new Error("Đơn hàng không tồn tại!");

  order.isDelivered = true;
  order.deliveredAt = Date.now();

  return await order.save();
};

export const getUserOrders = async (userId) => {
  const orders = await Order.find({ user: userId })
    .populate({
      path: "orderItems",
      populate: { path: "product", select: "name image price" }
    })
    .populate("user", "name email")
    .populate("payment")
    .sort({ createdAt: -1 });

  return orders;
};

export const deleteOrder = async (id, user) => {
  const order = await Order.findById(id).populate("orderItems");
  if (!order) throw new Error("Đơn hàng không tồn tại!");

  if (user._id.toString() !== order.user._id.toString() && !user.isAdmin) {
    throw new Error("forbidden");
  }

  if (order.stockReduced) {
    for (const item of order.orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        product.countInStock += item.quantity;
        await product.save();
      }
    }
  }

  await OrderItem.deleteMany({ order: order._id });
  await Payment.deleteMany({ order: order._id });
  await order.deleteOne();
  return true;
};

export const updateOrderStatus = async (id, statusData) => {
  const { isPaid, isDelivered } = statusData;
  const order = await Order.findById(id).populate("payment").populate("orderItems");

  if (!order) throw new Error("Đơn hàng không tồn tại!");

  if (isPaid !== undefined && order.payment) {
    const payment = order.payment;
    if (isPaid && !order.stockReduced) {
      for (const item of order.orderItems) {
        const product = await Product.findById(item.product);
        if (product) {
          product.countInStock -= item.quantity;
          await product.save();
        }
      }
      order.stockReduced = true;
    }
    payment.isPaid = isPaid;
    payment.paidAt = isPaid ? Date.now() : null;
    await payment.save();
  }

  if (isDelivered !== undefined) {
    order.isDelivered = isDelivered;
    order.deliveredAt = isDelivered ? Date.now() : null;
  }

  return await order.save();
};

export const searchOrders = async (query) => {
  return await Order.find({ orderCode: { $regex: query, $options: "i" } }).populate("user", "name email");
};

export const searchOrdersByUserName = async (name) => {
  const users = await User.find({ name: { $regex: name, $options: "i" } }).select("_id");
  if (users.length === 0) return [];
  const userIds = users.map((u) => u._id);
  return await Order.find({ user: { $in: userIds } }).populate("user", "name email");
};
