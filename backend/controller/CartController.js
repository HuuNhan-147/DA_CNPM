import * as cartService from "../services/CartService.js";

export const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const cart = await cartService.addToCart(req.user._id, productId, quantity);
    res.status(200).json({ message: "Đã thêm vào giỏ hàng!", cart });
  } catch (error) {
    const status = error.message === "Sản phẩm không tồn tại!" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

export const getCart = async (req, res) => {
  try {
    const result = await cartService.getCart(req.user._id);
    res.status(200).json(result);
  } catch (error) {
    const status = error.message.includes("trống") ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const cart = await cartService.updateCartItem(req.user._id, productId, quantity);
    res.status(200).json({ message: "Đã cập nhật giỏ hàng!", cart });
  } catch (error) {
    const status = error.message.includes("không tồn tại") || error.message.includes("trống") ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const cart = await cartService.removeFromCart(req.user._id, productId);
    if (!cart) {
      return res.status(200).json({ message: "Giỏ hàng hiện đã trống!" });
    }
    res.status(200).json({ message: "Đã xóa sản phẩm khỏi giỏ hàng!", cart });
  } catch (error) {
    const status = error.message.includes("không tồn tại") ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const checkout = async (req, res) => {
  try {
    const populatedOrder = await cartService.checkout(req.user._id, req.body);

    if (req.io) {
      req.io.emit("new_order", {
        message: "Có đơn hàng mới được đặt từ giỏ hàng!",
        orderCode: populatedOrder.orderCode,
        totalPrice: populatedOrder.payment?.totalPrice
      });
    }

    res.status(201).json({ message: "Đơn hàng đã được tạo!", order: populatedOrder });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getCartItemCount = async (req, res) => {
  try {
    const count = await cartService.getCartItemCount(req.user._id);
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi lấy số lượng sản phẩm trong giỏ!", error: error.message });
  }
};
