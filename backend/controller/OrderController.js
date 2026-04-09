import Order from "../models/OrderModel.js";
import User from "../models/UserModel.js";
import Product from "../models/ProductModel.js";
import OrderItem from "../models/OrderItemModel.js";
import Payment from "../models/PaymentModel.js";
import mongoose from "mongoose";

export const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderItems, shippingAddress, paymentMethod } = req.body;

    if (!orderItems || orderItems.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Không có sản phẩm nào!" });
    }

    // Kiểm tra số lượng tồn kho
    for (const item of orderItems) {
      const product = await Product.findById(item.product).session(session);
      if (!product) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: `Sản phẩm ${item.name} không tồn tại` });
      }
      if (product.countInStock < item.quantity) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: `Sản phẩm ${item.name} không đủ số lượng trong kho (Còn ${product.countInStock})` });
      }
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

    const populatedOrder = await Order.findById(createdOrder._id)
      .populate("orderItems")
      .populate("payment");

    if (req.io) {
      req.io.emit("new_order", {
        message: "Có đơn hàng mới được đặt!",
        orderCode: populatedOrder.orderCode,
        totalPrice: populatedOrder.payment.totalPrice
      });
    }

    res
      .status(201)
      .json({ message: "Đơn hàng đã được tạo!", order: populatedOrder });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
};

// ✅ Lấy danh sách đơn hàng (Admin)
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
       .populate("user", "name email")
       .populate("payment");
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params; // có thể là _id hoặc orderCode
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

    if (!order) {
      return res.status(404).json({ message: "Đơn hàng không tồn tại!" });
    }

    if (
      req.user._id.toString() !== order.user._id.toString() &&
      !req.user.isAdmin
    ) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xem đơn hàng này!" });
    }

    let status = "Chờ thanh toán";
    if (order.payment?.isPaid && order.isDelivered) {
      status = "Đã giao hàng";
    } else if (order.payment?.isPaid) {
      status = "Đã thanh toán";
    }

    const orderData = {
      id: order._id,
      orderCode: order.orderCode,
      status,
      paymentMethod: order.payment?.paymentMethod,
      isPaid: order.payment?.isPaid,
      isDelivered: order.isDelivered,
      createdAt: order.createdAt,
      user: {
        name: order.user.name,
        email: order.user.email,
      },
      shippingAddress: order.shippingAddress,
      orderItems: order.orderItems.map((item) => ({
        name: item.product?.name || item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.product?.image || item.image || "",
      })),
      totalPrice: order.payment?.totalPrice,
      itemsPrice: order.payment?.itemsPrice,
      shippingPrice: order.payment?.shippingPrice,
      taxPrice: order.payment?.taxPrice,
    };

    res
      .status(200)
      .json({ message: "Lấy đơn hàng thành công!", order: orderData });
  } catch (error) {
    console.error("❌ Lỗi khi lấy đơn hàng:", error);
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
};
// ✅ Cập nhật trạng thái thanh toán
export const updateOrderToPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
       .populate("payment")
       .populate("orderItems");

    if (!order || !order.payment) {
      return res.status(404).json({ message: "Đơn hàng hoặc thanh toán không tồn tại!" });
    }

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
        path: "orderItems",
        populate: { path: "product", select: "name image price" }
      })
      .populate("user", "name email")
      .populate("payment")
      .sort({ createdAt: -1 });

    // Nếu không có đơn hàng nào
    if (orders.length === 0) {
      return res.status(200).json({ orders: [] });
    }

    // Xử lý dữ liệu đơn hàng
    const formattedOrders = orders.map((order) => {
      // Kiểm tra và cập nhật số lượng nếu sản phẩm trùng nhau
      const uniqueItems = [];
      const itemMap = new Map();

      order.orderItems.forEach((item) => {
        if (!item) return;

        // Fallback linh hoạt: Dù là ObjectId ref hay Embedded Object cũng lấy được id
        const productId = item.product && item.product._id ? item.product._id : item.product;
        
        if (productId) {
          const idString = productId.toString();
          if (itemMap.has(idString)) {
            // Nếu sản phẩm đã tồn tại, cập nhật số lượng
            const existingItem = itemMap.get(idString);
            existingItem.quantity += item.quantity;
          } else {
            // Nếu sản phẩm chưa tồn tại, thêm mới (Hỗ trợ nhặt thông tin product từ 2 cấp)
            const newItem = {
              productId: productId,
              productName: (item.product && item.product.name) ? item.product.name : item.name,
              price: item.price,
              quantity: item.quantity,
              image: (item.product && item.product.image) ? item.product.image : item.image,
            };
            itemMap.set(idString, newItem);
            uniqueItems.push(newItem);
          }
        }
      });

      return {
        _id: order._id,
        orderCode: order.orderCode, // ✅ THÊM ORDERCODE VÀO ĐÂY
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        status: order.status,
        orderItems: uniqueItems,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.payment?.paymentMethod,
        shippingPrice: order.payment?.shippingPrice,
        taxPrice: order.payment?.taxPrice,
        totalPrice: order.payment?.totalPrice,
        isPaid: order.payment?.isPaid,
        paidAt: order.payment?.paidAt,
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
    const order = await Order.findById(req.params.id).populate("orderItems");

    if (!order) {
      return res.status(404).json({ message: "Đơn hàng không tồn tại!" });
    }

    if (
      req.user._id.toString() !== order.user._id.toString() &&
      !req.user.isAdmin
    ) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xóa đơn hàng này!" });
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

    res.status(200).json({ message: "Đơn hàng đã được xóa thành công!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
};
export const updateOrderStatus = async (req, res) => {
  const { isPaid, isDelivered } = req.body; // Lấy trạng thái thanh toán và giao hàng từ body

  try {
    const order = await Order.findById(req.params.id).populate("payment").populate("orderItems");

    if (!order) {
      return res.status(404).json({ message: "Đơn hàng không tồn tại!" });
    }

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

    const updatedOrder = await order.save(); // Lưu cập nhật

    res.status(200).json({
      message: "Cập nhật trạng thái đơn hàng thành công!",
      order: updatedOrder,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
};
// ✅ Tìm kiếm đơn hàng (Admin)
export const searchOrders = async (req, res) => {
  try {
    const { query } = req.query; // lấy từ khóa tìm kiếm

    if (!query) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập thông tin tìm kiếm!" });
    }

    // Tìm đơn hàng theo mã đơn hàng (orderCode)
    const orders = await Order.find({
      orderCode: { $regex: query, $options: "i" },
    }).populate("user", "name email");

    res.status(200).json({
      message: "Tìm kiếm đơn hàng thành công!",
      orders,
    });
  } catch (error) {
    console.error("Lỗi khi tìm kiếm:", error);
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
};
export const searchOrdersByUserName = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({ message: "Vui lòng nhập tên khách hàng!" });
    }

    // Tìm các user có tên chứa từ khóa
    const users = await User.find({
      name: { $regex: name, $options: "i" },
    }).select("_id");

    if (users.length === 0) {
      return res.status(200).json({ orders: [] }); // Không có user => không có đơn
    }

    const userIds = users.map((u) => u._id);

    // Tìm đơn hàng theo danh sách userId
    const orders = await Order.find({
      user: { $in: userIds },
    }).populate("user", "name email");

    res.status(200).json({
      message: "Tìm kiếm đơn hàng theo tên khách hàng thành công!",
      orders,
    });
  } catch (error) {
    console.error("Lỗi khi tìm kiếm theo tên:", error);
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
};
