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
    const shippingPrice = itemsPrice > 500 ? 0 : 50; // Miễn phí ship nếu > 500$
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
