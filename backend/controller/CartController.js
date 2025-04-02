import Cart from "../models/CartModel.js";
import Product from "../models/ProductModel.js";
import Order from "../models/OrderModel.js";
import mongoose from "mongoose";
// ✅ Thêm sản phẩm vào giỏ hàng
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user._id;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại!" });
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({ user: userId, cartItems: [] });
    }

    const itemIndex = cart.cartItems.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex > -1) {
      cart.cartItems[itemIndex].quantity += quantity;
    } else {
      cart.cartItems.push({
        product: productId,
        name: product.name,
        image: product.image,
        price: product.price,
        quantity,
      });
    }

    await cart.save();
    res.status(200).json({ message: "Đã thêm vào giỏ hàng!", cart });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
};

// ✅ Lấy giỏ hàng của người dùng
export const getCart = async (req, res) => {
  try {
    // Tìm giỏ hàng của người dùng
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "cartItems.product", // Populating thông tin sản phẩm trong cartItems
      "name price image"
    );

    // Kiểm tra xem giỏ hàng có trống không
    if (!cart || cart.cartItems.length === 0) {
      return res.status(404).json({ message: "Giỏ hàng trống!" });
    }

    // Tính tổng tiền của sản phẩm trong giỏ
    let itemsPrice = 0;
    cart.cartItems.forEach((item) => {
      if (item.product && item.product.price) {
        itemsPrice += item.product.price * item.quantity; // Tính tổng tiền cho mỗi sản phẩm
      }
    });

    const shippingPrice = 30000; // Phí vận chuyển cố định
    const taxPrice = itemsPrice * 0.1; // Thuế 10%
    const totalPrice = itemsPrice + shippingPrice + taxPrice; // Tổng tiền

    // Trả về giỏ hàng cùng với thông tin tổng tiền
    res.status(200).json({
      cart: {
        _id: cart._id,
        user: cart.user,
        cartItems: cart.cartItems.map((item) => ({
          product: {
            _id: item.product._id,
            name: item.product.name,
            price: item.product.price,
            image: item.product.image,
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
    });
  } catch (error) {
    // Xử lý lỗi nếu có
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: "Giỏ hàng trống!" });
    }

    const itemIndex = cart.cartItems.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Sản phẩm không có trong giỏ!" });
    }

    if (quantity <= 0) {
      cart.cartItems.splice(itemIndex, 1); // Xóa sản phẩm nếu quantity <= 0
    } else {
      cart.cartItems[itemIndex].quantity = quantity;
    }

    await cart.save();
    res.status(200).json({ message: "Đã cập nhật giỏ hàng!", cart });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    // Kiểm tra giỏ hàng của user
    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: "Giỏ hàng không tồn tại!" });
    }

    // Log dữ liệu để kiểm tra
    console.log("🛒 Giỏ hàng trước khi xóa:", cart.cartItems);

    // Chuyển đổi productId thành ObjectId
    const productObjectId = new mongoose.Types.ObjectId(productId);

    // Kiểm tra xem sản phẩm có trong giỏ không
    const itemIndex = cart.cartItems.findIndex((item) =>
      item.product.equals(productObjectId)
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Sản phẩm không có trong giỏ!" });
    }

    // Xóa sản phẩm khỏi giỏ hàng
    cart.cartItems.splice(itemIndex, 1);

    // Kiểm tra nếu giỏ hàng trống, xóa luôn giỏ hàng
    if (cart.cartItems.length === 0) {
      await Cart.findByIdAndDelete(cart._id);
      return res.status(200).json({ message: "Giỏ hàng hiện đã trống!" });
    }

    // Lưu thay đổi vào database
    await cart.save();

    console.log("✅ Giỏ hàng sau khi xóa:", cart.cartItems);

    res.status(200).json({ message: "Đã xóa sản phẩm khỏi giỏ hàng!", cart });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
};
// ✅ Thanh toán và tạo đơn hàng
export const checkout = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod } = req.body;
    const userId = req.user._id;

    if (!shippingAddress || !paymentMethod) {
      return res.status(400).json({
        message: "Thiếu thông tin giao hàng hoặc phương thức thanh toán!",
      });
    }

    const cart = await Cart.findOne({ user: userId }).populate(
      "cartItems.product",
      "name image price"
    );

    if (!cart || cart.cartItems.length === 0) {
      return res.status(400).json({ message: "Giỏ hàng trống!" });
    }

    const itemsPrice = cart.cartItems.reduce(
      (acc, item) => acc + item.product.price * item.quantity,
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

    res.status(201).json({ message: "Đơn hàng đã được tạo!", order });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
};
