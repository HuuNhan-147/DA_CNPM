import Order from "../models/OrderModel.js";

// ✅ Tạo đơn hàng
export const createOrder = async (req, res) => {
  try {
    const { orderItems, shippingAddress, paymentMethod } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: "Không có sản phẩm nào!" });
    }

    // ✅ Tính tổng tiền từ orderItems
    const itemsPrice = orderItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    // Cập nhật phí vận chuyển mặc định là 30,000 VND
    const shippingPrice = 30000; // Default shipping fee
    const taxPrice = itemsPrice * 0.1; // 10% thuế
    const totalPrice = itemsPrice + shippingPrice + taxPrice;

    const order = new Order({
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
    });

    const createdOrder = await order.save();

    res
      .status(201)
      .json({ message: "Đơn hàng đã được tạo!", order: createdOrder });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
};

// ✅ Lấy danh sách đơn hàng (Admin)
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate("user", "name email");
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "name email"
    );

    if (!order) {
      return res.status(404).json({ message: "Đơn hàng không tồn tại!" });
    }

    // Kiểm tra quyền truy cập: Admin hoặc chủ đơn hàng
    if (
      req.user._id.toString() !== order.user._id.toString() &&
      !req.user.isAdmin
    ) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xem đơn hàng này!" });
    }

    // Xác định trạng thái đơn hàng
    let status = "Chờ thanh toán";
    if (order.isPaid && order.isDelivered) {
      status = "Đã giao hàng";
    } else if (order.isPaid) {
      status = "Đã thanh toán";
    }

    // Chuẩn hóa dữ liệu trả về
    const orderData = {
      id: order._id,
      status,
      paymentMethod: order.paymentMethod,
      isPaid: order.isPaid,
      isDelivered: order.isDelivered,
      createdAt: order.createdAt,
      user: {
        name: order.user.name,
        email: order.user.email,
      },
      shippingAddress: order.shippingAddress,
      orderItems: order.orderItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      totalPrice: order.totalPrice,
    };

    res
      .status(200)
      .json({ message: "Lấy đơn hàng thành công!", order: orderData });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
};

// ✅ Cập nhật trạng thái thanh toán
export const updateOrderToPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Đơn hàng không tồn tại!" });
    }

    order.isPaid = true;
    order.paidAt = Date.now();

    const updatedOrder = await order.save();

    res
      .status(200)
      .json({ message: "Thanh toán thành công!", order: updatedOrder });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
};

// ✅ Cập nhật trạng thái giao hàng (Admin)
export const updateOrderToDelivered = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Đơn hàng không tồn tại!" });
    }

    order.isDelivered = true;
    order.deliveredAt = Date.now();

    const updatedOrder = await order.save();

    res
      .status(200)
      .json({ message: "Đơn hàng đã được giao!", order: updatedOrder });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    // Kiểm tra xem req.user có tồn tại không
    if (!req.user) {
      return res.status(401).json({ message: "Không có quyền truy cập!" });
    }

    // Lấy tất cả đơn hàng của người dùng từ database
    const orders = await Order.find({ user: req.user._id })
      .populate({
        path: "orderItems.product",
        select: "name price image", // Lấy thông tin sản phẩm bao gồm cả hình ảnh
        model: "Product", // Chỉ định model cần populate
      })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    // Nếu không có đơn hàng nào
    if (orders.length === 0) {
      return res.status(404).json({ message: "Không có đơn hàng nào!" });
    }

    // Xử lý dữ liệu đơn hàng
    const formattedOrders = orders.map((order) => {
      // Kiểm tra và cập nhật số lượng nếu sản phẩm trùng nhau
      const uniqueItems = [];
      const itemMap = new Map();

      order.orderItems.forEach((item) => {
        if (item.product && item.product._id) {
          if (itemMap.has(item.product._id.toString())) {
            // Nếu sản phẩm đã tồn tại, cập nhật số lượng
            const existingItem = itemMap.get(item.product._id.toString());
            existingItem.quantity += item.quantity;
          } else {
            // Nếu sản phẩm chưa tồn tại, thêm mới
            const newItem = {
              productId: item.product._id,
              productName: item.product.name,
              price: item.price,
              quantity: item.quantity,
              image: item.product.image,
            };
            itemMap.set(item.product._id.toString(), newItem);
            uniqueItems.push(newItem);
          }
        }
      });

      return {
        _id: order._id,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        status: order.status,
        orderItems: uniqueItems,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        shippingPrice: order.shippingPrice,
        taxPrice: order.taxPrice,
        totalPrice: order.totalPrice,
        isPaid: order.isPaid,
        paidAt: order.paidAt,
        isDelivered: order.isDelivered,
        deliveredAt: order.deliveredAt,
      };
    });

    res.status(200).json({
      message: "Lấy danh sách đơn hàng của người dùng thành công!",
      orders: formattedOrders,
    });
  } catch (error) {
    console.error("Lỗi chi tiết:", error);
    res.status(500).json({
      message: "Lỗi server!",
      error: error.message,
    });
  }
};
// ✅ Xóa đơn hàng (Admin hoặc chủ sở hữu đơn hàng)
export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Đơn hàng không tồn tại!" });
    }

    // Kiểm tra quyền xóa: Admin hoặc chủ sở hữu đơn hàng
    if (
      req.user._id.toString() !== order.user._id.toString() &&
      !req.user.isAdmin
    ) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xóa đơn hàng này!" });
    }

    await order.deleteOne(); // Xóa đơn hàng

    res.status(200).json({ message: "Đơn hàng đã được xóa thành công!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
};
