import Cart from "../models/CartModel.js";
import CartItem from "../models/CartItemModel.js";
import Product from "../models/ProductModel.js";
import Order from "../models/OrderModel.js";
import OrderItem from "../models/OrderItemModel.js";
import Payment from "../models/PaymentModel.js";
import mongoose from "mongoose";

export const addToCart = async (userId, productId, quantity) => {
  const product = await Product.findById(productId);
  if (!product) throw new Error("Sản phẩm không tồn tại!");

  let cart = await Cart.findOne({ user: userId }).populate("cartItems");
  if (!cart) {
    cart = new Cart({ user: userId, cartItems: [] });
    await cart.save();
  }

  const itemIndex = cart.cartItems.findIndex((item) => item.product.toString() === productId);
  let newQuantity = quantity;
  if (itemIndex > -1) {
    newQuantity += cart.cartItems[itemIndex].quantity;
  }

  if (newQuantity > product.countInStock) {
    throw new Error(`Sản phẩm không đủ số lượng trong kho (Còn ${product.countInStock})`);
  }

  if (itemIndex > -1) {
    const cartItem = cart.cartItems[itemIndex];
    cartItem.quantity += quantity;
    await cartItem.save();
  } else {
    const newCartItem = new CartItem({
      cart: cart._id,
      product: productId,
      name: product.name,
      image: product.image,
      price: product.price,
      quantity,
    });
    const savedCartItem = await newCartItem.save();
    cart.cartItems.push(savedCartItem._id);
    await cart.save();
  }

  return await Cart.findById(cart._id).populate({
    path: "cartItems", populate: { path: "product" }
  });
};

export const getCart = async (userId) => {
  const cart = await Cart.findOne({ user: userId }).populate({
    path: "cartItems",
    populate: {
      path: "product",
      select: "name price image countInStock",
    },
  });

  if (!cart || cart.cartItems.length === 0) throw new Error("Giỏ hàng trống!");

  const validItems = cart.cartItems.filter((item) => item.product);
  if (validItems.length === 0) throw new Error("Giỏ hàng trống hoặc sản phẩm không còn tồn tại!");

  const itemsPrice = validItems.reduce((total, item) => total + item.product.price * item.quantity, 0);
  const shippingPrice = 30000;
  const taxPrice = itemsPrice * 0.1;
  const totalPrice = itemsPrice + shippingPrice + taxPrice;

  return {
    cart: {
      _id: cart._id,
      user: cart.user,
      cartItems: validItems.map((item) => ({
        product: {
          _id: item.product._id,
          name: item.product.name,
          price: item.product.price,
          image: item.product.image,
          countInStock: item.product.countInStock,
        },
        quantity: item.quantity,
      })),
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    },
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
  };
};

export const updateCartItem = async (userId, productId, quantity) => {
  const product = await Product.findById(productId);
  if (!product) throw new Error("Sản phẩm không tồn tại!");

  if (quantity > product.countInStock) {
    throw new Error(`Sản phẩm không đủ số lượng trong kho (Còn ${product.countInStock})`);
  }

  const cart = await Cart.findOne({ user: userId }).populate("cartItems");
  if (!cart) throw new Error("Giỏ hàng trống!");

  const itemIndex = cart.cartItems.findIndex((item) => item.product.toString() === productId);
  if (itemIndex === -1) throw new Error("Sản phẩm không có trong giỏ!");

  if (quantity <= 0) {
    const itemToRemove = cart.cartItems[itemIndex];
    cart.cartItems.splice(itemIndex, 1);
    await CartItem.findByIdAndDelete(itemToRemove._id);
  } else {
    cart.cartItems[itemIndex].quantity = quantity;
    await cart.cartItems[itemIndex].save();
  }

  await cart.save();
  return cart;
};

export const removeFromCart = async (userId, productId) => {
  const cart = await Cart.findOne({ user: userId }).populate("cartItems");
  if (!cart) throw new Error("Giỏ hàng không tồn tại!");

  const productObjectId = new mongoose.Types.ObjectId(productId);
  const itemIndex = cart.cartItems.findIndex((item) => item.product.equals(productObjectId));

  if (itemIndex === -1) throw new Error("Sản phẩm không có trong giỏ!");

  const itemToRemove = cart.cartItems[itemIndex];
  cart.cartItems.splice(itemIndex, 1);
  await CartItem.findByIdAndDelete(itemToRemove._id);

  if (cart.cartItems.length === 0) {
    await Cart.findByIdAndDelete(cart._id);
    return null;
  }

  await cart.save();
  return cart;
};

export const checkout = async (userId, checkoutData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { shippingAddress, paymentMethod } = checkoutData;

    if (!shippingAddress || !paymentMethod) throw new Error("Thiếu thông tin giao hàng hoặc phương thức thanh toán!");

    const cart = await Cart.findOne({ user: userId }).populate({
      path: "cartItems",
      populate: { path: "product", select: "name image price countInStock" },
    }).session(session);

    if (!cart || cart.cartItems.length === 0) throw new Error("Giỏ hàng trống!");

    for (const item of cart.cartItems) {
      if (item.product.countInStock < item.quantity) {
        throw new Error(`Sản phẩm ${item.product.name} không đủ số lượng trong kho!`);
      }
    }

    const itemsPrice = cart.cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
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
      paymentStatus: "pending",
    });
    const savedPayment = await payment.save({ session });

    const orderItemDocs = cart.cartItems.map(item => ({
      order: savedOrder._id,
      product: item.product._id,
      name: item.name || item.product.name,
      quantity: item.quantity,
      price: item.product.price,
      image: item.image || item.product.image,
    }));
    const insertedOrderItems = await OrderItem.insertMany(orderItemDocs, { session });
    
    savedOrder.payment = savedPayment._id;
    savedOrder.orderItems = insertedOrderItems.map(oi => oi._id);
    await savedOrder.save({ session });

    await session.commitTransaction();
    session.endSession();

    return await Order.findById(savedOrder._id).populate("orderItems").populate("payment");
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const getCartItemCount = async (userId) => {
  const cart = await Cart.findOne({ user: userId }).populate("cartItems");
  if (!cart || cart.cartItems.length === 0) return 0;
  return cart.cartItems.reduce((total, item) => total + item.quantity, 0);
};
