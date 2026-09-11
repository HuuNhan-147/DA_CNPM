import Cart from "../../../models/CartModel.js";
import CartItem from "../../../models/CartItemModel.js";
import Product from "../../../models/ProductModel.js";
import redisChat from "../../../services/redisChatService.js";

/**
 * ✅ CẬP NHẬT LOGIC CHO KIẾN TRÚC 10 MODEL (Cart & CartItem tách rời)
 */
export async function addToCart({ userId, productId, quantity = 1, token }) {
  try {
    if (!userId || !token) {
      throw new Error("Bạn cần đăng nhập để thêm vào giỏ hàng");
    }

    if (!productId) {
      throw new Error("Thiếu thông tin sản phẩm");
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw new Error("Sản phẩm không tồn tại");
    }

    if (product.countInStock < quantity) {
      throw new Error(`Sản phẩm chỉ còn ${product.countInStock} trong kho`);
    }

    // 1. Tìm hoặc tạo Cart của người dùng
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, cartItems: [] });
      await cart.save();
    }

    // 2. Tìm xem sản phẩm đã có trong CartItem của Cart này chưa
    let cartItem = await CartItem.findOne({ cart: cart._id, product: productId });

    if (cartItem) {
      // Nếu đã có -> Cập nhật số lượng
      cartItem.quantity += Number(quantity);
      await cartItem.save();
    } else {
      // Nếu chưa có -> Tạo CartItem mới
      cartItem = new CartItem({
        cart: cart._id,
        product: productId,
        name: product.name,
        price: product.price,
        quantity: Number(quantity),
        image: product.image,
      });
      await cartItem.save();

      // Thêm ID của CartItem vào mảng cartItems của Cart
      cart.cartItems.push(cartItem._id);
      await cart.save();
    }

    // 3. Lấy lại toàn bộ giỏ hàng với populate để trả về dữ liệu chuẩn
    const updatedCart = await Cart.findOne({ user: userId }).populate({
      path: "cartItems",
      populate: { path: "product", select: "name image price countInStock" }
    });

    const total = updatedCart.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemCount = updatedCart.cartItems.reduce((sum, item) => sum + item.quantity, 0);

    // Update session meta (xử lý tham chiếu AI)
    try {
      if (userId) {
        const meta = await redisChat.getSessionMeta(userId);
        if (meta && Array.isArray(meta.lastViewedProducts)) {
          const filtered = meta.lastViewedProducts.filter(p => p.id !== productId.toString());
          await redisChat.setSessionMeta(userId, null, { lastViewedProducts: filtered });
        }
      }
    } catch (e) {
      console.warn('Could not update lastViewedProducts:', e.message);
    }

    return {
      success: true,
      message: `Đã thêm ${product.name} vào giỏ hàng`,
      cart: {
        itemCount,
        total,
        items: updatedCart.cartItems.map(item => ({
          id: item.product?._id || item.product,
          name: item.name || item.product?.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image || item.product?.image
        }))
      }
    };
    
  } catch (error) {
    console.error("❌ Add to cart error:", error.message);
    throw error;
  }
}

export async function getCart({ userId, token }) {
  try {
    if (!userId || !token) {
      throw new Error("Bạn cần đăng nhập để xem giỏ hàng");
    }

    const cart = await Cart.findOne({ user: userId }).populate({
      path: "cartItems",
      populate: { path: "product", select: "name image price countInStock" }
    });

    if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
      return {
        success: true,
        message: "Giỏ hàng trống",
        cart: { items: [], total: 0, itemCount: 0 }
      };
    }

    const total = cart.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemCount = cart.cartItems.reduce((sum, item) => sum + item.quantity, 0);

    return {
      success: true,
      cart: {
        itemCount,
        total,
        items: cart.cartItems.map(item => ({
          id: item.product?._id || item.product,
          name: item.name || item.product?.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image || item.product?.image
        }))
      }
    };
    
  } catch (error) {
    console.error("❌ Get cart error:", error.message);
    throw error;
  }
}

export async function removeFromCart({ userId, productId, token }) {
  try {
    if (!userId || !token) throw new Error("Vui lòng đăng nhập");

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return { success: true, message: "Giỏ hàng trống" };

    // Tìm và xóa CartItem
    const cartItem = await CartItem.findOneAndDelete({ cart: cart._id, product: productId });
    
    if (cartItem) {
      // Xóa ref trong Cart
      cart.cartItems = cart.cartItems.filter(id => id.toString() !== cartItem._id.toString());
      await cart.save();
    }

    return getCart({ userId, token });
  } catch (error) {
    console.error("❌ Remove from cart error:", error.message);
    throw error;
  }
}

export async function updateCart({ userId, productId, quantity, token }) {
  try {
    if (!userId || !token) throw new Error("Vui lòng đăng nhập");

    const cart = await Cart.findOne({ user: userId });
    if (!cart) throw new Error("Giỏ hàng trống");

    if (quantity <= 0) {
      return removeFromCart({ userId, productId, token });
    }

    const cartItem = await CartItem.findOneAndUpdate(
      { cart: cart._id, product: productId },
      { quantity: Number(quantity) },
      { new: true }
    );

    if (!cartItem) throw new Error("Sản phẩm không có trong giỏ hàng");

    return getCart({ userId, token });
  } catch (error) {
    console.error("❌ Update cart error:", error.message);
    throw error;
  }
}

export async function getCartCount({ userId, token }) {
  try {
    if (!userId || !token) return { success: true, count: 0 };
    const cart = await Cart.findOne({ user: userId });
    if (!cart || !cart.cartItems) return { success: true, count: 0 };

    const cartItems = await CartItem.find({ cart: cart._id });
    const count = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    return { success: true, count };
  } catch (error) {
    return { success: false, count: 0 };
  }
}

export async function addFromLastViewed({ userId, index = 1, quantity = 1, token }) {
  try {
    if (!userId || !token) throw new Error('Vui lòng đăng nhập');
    const meta = await redisChat.getSessionMeta(userId);
    const list = Array.isArray(meta.lastViewedProducts) ? meta.lastViewedProducts : [];
    const idx = Number(index);
    const item = list[idx - 1];
    
    if (!item || !item.id) {
      return { success: false, message: `Không tìm thấy sản phẩm thứ ${index}` };
    }

    return addToCart({ userId, productId: item.id, quantity, token });
  } catch (error) {
    throw error;
  }
}