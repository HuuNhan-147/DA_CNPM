import Cart from "../../../models/CartModel.js";
import Product from "../../../models/ProductModel.js";
import redisChat from "../../../services/redisChatService.js";

/**
 * ✅ CẢI THIỆN: Thêm validation và error handling tốt hơn
 */
export async function addToCart({ userId, productId, quantity = 1, token }) {
  try {
    // Validation
    if (!userId || !token) {
      throw new Error("Bạn cần đăng nhập để thêm vào giỏ hàng");
    }

    if (!productId) {
      throw new Error("Thiếu thông tin sản phẩm");
    }

    // Kiểm tra sản phẩm
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error("Sản phẩm không tồn tại");
    }

    if (product.countInStock < quantity) {
      throw new Error(`Sản phẩm chỉ còn ${product.countInStock} trong kho`);
    }

    // Xử lý giỏ hàng (model dùng field `cartItems`)
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({ user: userId, cartItems: [] });
    }

    const existingItemIndex = cart.cartItems.findIndex(
      (item) => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      cart.cartItems[existingItemIndex].quantity += quantity;
    } else {
      cart.cartItems.push({
        product: productId,
        quantity: quantity,
        price: product.price,
        name: product.name,
        image: product.image,
      });
    }

    // Tính tổng tạm thời (không lưu vào schema vì không có field total)
    const total = cart.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    await cart.save();
    await cart.populate("cartItems.product", "name image price");

    // Update session meta lastViewedProducts -> remove the added product so followups don't re-add same item
    try {
      if (userId) {
        // read meta and filter
        const meta = await redisChat.getSessionMeta(userId);
        if (meta && Array.isArray(meta.lastViewedProducts)) {
          const filtered = meta.lastViewedProducts.filter(p => p.id !== productId.toString());
          await redisChat.setSessionMeta(userId, null, { lastViewedProducts: filtered });
        }
      }
    } catch (e) {
      console.warn('Could not update lastViewedProducts after addToCart:', e.message);
    }

    // ✅ TRẢ VỀ STRUCTURED DATA
    return {
      success: true,
      message: `Đã thêm ${product.name} vào giỏ hàng`,
      cart: {
        itemCount: cart.cartItems.reduce((sum, item) => sum + item.quantity, 0),
        total,
        items: cart.cartItems.map(item => ({
          id: item.product?._id || item.product,
          name: item.product?.name || item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.product?.image || item.image
        }))
      }
    };
    
  } catch (error) {
    console.error("❌ Add to cart error:", error.message);
    throw error; // Để Gemini nhận được error message
  }
}

export async function getCart({ userId, token }) {
  try {
    if (!userId || !token) {
      throw new Error("Bạn cần đăng nhập để xem giỏ hàng");
    }

    const cart = await Cart.findOne({ user: userId })
      .populate("cartItems.product", "name image price");

    if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
      return {
        success: true,
        message: "Giỏ hàng trống",
        cart: { items: [], total: 0, itemCount: 0 }
      };
    }

    const total = cart.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return {
      success: true,
      cart: {
        itemCount: cart.cartItems.reduce((sum, item) => sum + item.quantity, 0),
        total,
        items: cart.cartItems.map(item => ({
          id: item.product?._id || item.product,
          name: item.product?.name || item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.product?.image || item.image
        }))
      }
    };
    
  } catch (error) {
    console.error("❌ Get cart error:", error.message);
    throw error;
  }
}

// ========================================
// EXAMPLE: Controller sử dụng Agent
// ========================================

export async function chatController(req, res) {
  try {
    const { message, context = [] } = req.body;
    const userId = req.user?._id;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!userId || !token) {
      return res.status(401).json({
        success: false,
        message: "Vui lòng đăng nhập"
      });
    }

    const result = await runAgent(message, context, userId, token);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi xử lý yêu cầu",
      error: error.message
    });
  }
}

/**
 * Remove product from user's cart
 */
export async function removeFromCart({ userId, productId, token }) {
  try {
    if (!userId || !token) {
      throw new Error("Bạn cần đăng nhập để xóa sản phẩm khỏi giỏ hàng");
    }

    if (!productId) {
      throw new Error("Thiếu productId để xóa");
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
      return { success: true, message: "Giỏ hàng trống", cart: { items: [], total: 0, itemCount: 0 } };
    }

    const beforeCount = cart.cartItems.length;
    cart.cartItems = cart.cartItems.filter(item => item.product.toString() !== productId);

    if (cart.cartItems.length === beforeCount) {
      return { success: false, message: "Sản phẩm không có trong giỏ hàng" };
    }

    const total = cart.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    await cart.save();
    await cart.populate("cartItems.product", "name image price");

    return {
      success: true,
      message: "Đã xóa sản phẩm khỏi giỏ hàng",
      cart: {
        itemCount: cart.cartItems.reduce((sum, item) => sum + item.quantity, 0),
        total,
        items: cart.cartItems.map(item => ({
          id: item.product?._id || item.product,
          name: item.product?.name || item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.product?.image || item.image
        }))
      }
    };

  } catch (error) {
    console.error("❌ Remove from cart error:", error.message);
    throw error;
  }
}

export async function updateCart({ userId, productId, quantity, token }) {
  try {
    if (!userId || !token) {
      throw new Error("Bạn cần đăng nhập để cập nhật giỏ hàng");
    }

    if (!productId) {
      throw new Error("Thiếu productId");
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      throw new Error("Giỏ hàng trống");
    }

    const itemIndex = cart.cartItems.findIndex(
      (it) => it.product.toString() === productId
    );

    if (itemIndex === -1) {
      throw new Error("Sản phẩm không có trong giỏ hàng");
    }

    if (quantity <= 0) {
      cart.cartItems.splice(itemIndex, 1);
    } else {
      cart.cartItems[itemIndex].quantity = quantity;
    }

    await cart.save();
    await cart.populate("cartItems.product", "name image price");

    const total = cart.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return {
      success: true,
      message: "Đã cập nhật giỏ hàng",
      cart: {
        itemCount: cart.cartItems.reduce((sum, item) => sum + item.quantity, 0),
        total,
        items: cart.cartItems.map(item => ({
          id: item.product?._id || item.product,
          name: item.product?.name || item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.product?.image || item.image
        }))
      }
    };

  } catch (error) {
    console.error("❌ Update cart error:", error.message);
    throw error;
  }
}

export async function getCartCount({ userId, token }) {
  try {
    if (!userId || !token) {
      throw new Error("Bạn cần đăng nhập để xem số lượng giỏ hàng");
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart || !cart.cartItems) return { success: true, count: 0 };

    const count = cart.cartItems.reduce((sum, item) => sum + item.quantity, 0);
    return { success: true, count };
  } catch (error) {
    console.error("❌ Get cart count error:", error.message);
    throw error;
  }
}

/**
 * Add item from lastViewedProducts list saved in session meta by productTools
 * index: 1-based index into the lastViewedProducts list
 */
export async function addFromLastViewed({ userId, index = 1, quantity = 1, token }) {
  try {
    if (!userId || !token) throw new Error('Bạn cần đăng nhập để thêm vào giỏ');

    const meta = await redisChat.getSessionMeta(userId);
    const list = Array.isArray(meta.lastViewedProducts) ? meta.lastViewedProducts : [];
    const idx = Number(index);
    if (!Number.isFinite(idx) || idx <= 0) {
      throw new Error('Index không hợp lệ');
    }

    const item = list[idx - 1] || null;
    if (!item) {
      return { success: false, message: `Không tìm thấy mục thứ ${index} trong danh sách tham khảo` };
    }

    // item.id should be productId
    const productId = item.id;
    if (!productId) return { success: false, message: 'Mục tham khảo không chứa productId' };

    // Delegate to addToCart (this module's function)
    const res = await addToCart({ userId, productId, quantity, token });
    return { success: true, message: res.message, cart: res.cart };
  } catch (error) {
    console.error('❌ addFromLastViewed error:', error.message);
    throw error;
  }
}