// modules/ai-agent/tools/actions/cartTools.js
import * as cartService from "../../../../services/CartService.js";
import redisChatService from "../../../../services/redisChatService.js";

/**
 * Thêm sản phẩm vào giỏ hàng qua CartService
 */
export async function addToCart({ userId, productId, quantity = 1, token }) {
  try {
    if (!userId || !token) {
      throw new Error("Bạn cần đăng nhập để thêm vào giỏ hàng");
    }
    if (!productId) {
      throw new Error("Thiếu thông tin sản phẩm");
    }

    const formattedCart = await cartService.addToCart(userId, productId, Number(quantity));

    return {
      success: true,
      message: `Đã thêm sản phẩm vào giỏ hàng thành công`,
      cart: {
        itemCount: formattedCart.cart.cartItems.reduce((sum, item) => sum + item.quantity, 0),
        total: formattedCart.totalPrice,
        items: formattedCart.cart.cartItems.map((item) => ({
          id: item.product?._id || item.product,
          name: item.product?.name || "Sản phẩm",
          price: item.product?.price || 0,
          quantity: item.quantity,
          image: item.product?.image,
        })),
      },
    };
  } catch (error) {
    console.error("❌ addToCart tool error:", error.message);
    throw error;
  }
}

/**
 * Thêm sản phẩm từ danh sách vừa xem theo index
 */
export async function addFromLastViewed({ userId, index = 1, quantity = 1, token, sessionId }) {
  try {
    if (!userId || !token) {
      throw new Error("Bạn cần đăng nhập để thêm vào giỏ hàng");
    }

    const meta = await redisChatService.getSessionMeta(userId, sessionId);
    const lastViewed = meta?.lastViewedProducts || [];

    if (!lastViewed || lastViewed.length === 0) {
      throw new Error("Chưa có danh sách sản phẩm vừa xem. Bạn vui lòng tìm kiếm sản phẩm trước nhé!");
    }

    const targetIndex = Math.max(1, Math.min(lastViewed.length, index)) - 1;
    const targetProduct = lastViewed[targetIndex];

    if (!targetProduct || !targetProduct.id) {
      throw new Error(`Không tìm thấy sản phẩm thứ ${index} trong danh sách vừa xem`);
    }

    return await addToCart({
      userId,
      productId: targetProduct.id,
      quantity,
      token,
    });
  } catch (error) {
    console.error("❌ addFromLastViewed tool error:", error.message);
    throw error;
  }
}

/**
 * Lấy thông tin giỏ hàng qua CartService
 */
export async function getCart({ userId, token }) {
  try {
    if (!userId || !token) {
      throw new Error("Bạn cần đăng nhập để xem giỏ hàng");
    }

    const cartData = await cartService.getCart(userId);
    if (!cartData || !cartData.cart || cartData.cart.cartItems.length === 0) {
      return {
        success: true,
        message: "Giỏ hàng của bạn đang trống",
        cart: { items: [], total: 0, itemCount: 0 },
      };
    }

    return {
      success: true,
      message: `Giỏ hàng có ${cartData.cart.cartItems.length} sản phẩm`,
      cart: {
        itemCount: cartData.cart.cartItems.reduce((sum, item) => sum + item.quantity, 0),
        itemsPrice: cartData.itemsPrice,
        shippingPrice: cartData.shippingPrice,
        taxPrice: cartData.taxPrice,
        total: cartData.totalPrice,
        items: cartData.cart.cartItems.map((item) => ({
          id: item.product?._id || item.product,
          name: item.product?.name,
          price: item.product?.price,
          quantity: item.quantity,
          image: item.product?.image,
        })),
      },
    };
  } catch (error) {
    if (error.message.includes("trống")) {
      return {
        success: true,
        message: "Giỏ hàng của bạn đang trống",
        cart: { items: [], total: 0, itemCount: 0 },
      };
    }
    console.error("❌ getCart tool error:", error.message);
    throw error;
  }
}

/**
 * Xóa sản phẩm khỏi giỏ hàng qua CartService
 */
export async function removeFromCart({ userId, productId, token }) {
  try {
    if (!userId || !token) throw new Error("Bạn cần đăng nhập");
    if (!productId) throw new Error("Thiếu productId");

    const result = await cartService.removeFromCart(userId, productId);
    return {
      success: true,
      message: "Đã xóa sản phẩm khỏi giỏ hàng",
      cart: result,
    };
  } catch (error) {
    console.error("❌ removeFromCart tool error:", error.message);
    throw error;
  }
}

/**
 * Cập nhật số lượng sản phẩm trong giỏ qua CartService
 */
export async function updateCart({ userId, productId, quantity, token }) {
  try {
    if (!userId || !token) throw new Error("Bạn cần đăng nhập");
    if (!productId || quantity === undefined) throw new Error("Thiếu thông tin cập nhật");

    const result = await cartService.updateCartItem(userId, productId, Number(quantity));
    return {
      success: true,
      message: "Đã cập nhật số lượng thành công",
      cart: result,
    };
  } catch (error) {
    console.error("❌ updateCart tool error:", error.message);
    throw error;
  }
}

/**
 * Lấy số lượng item trong giỏ qua CartService
 */
export async function getCartCount({ userId, token }) {
  try {
    if (!userId || !token) return { success: true, count: 0 };
    const count = await cartService.getCartItemCount(userId);
    return { success: true, count };
  } catch (error) {
    console.error("❌ getCartCount tool error:", error.message);
    return { success: true, count: 0 };
  }
}
