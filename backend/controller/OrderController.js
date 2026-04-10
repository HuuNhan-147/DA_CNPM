import * as orderService from "../services/OrderService.js";

export const createOrder = async (req, res) => {
  try {
    const populatedOrder = await orderService.createOrder(req.user._id, req.body);

    if (req.io) {
      req.io.emit("new_order", {
        message: "Có đơn hàng mới được đặt!",
        orderCode: populatedOrder.orderCode,
        totalPrice: populatedOrder.payment.totalPrice
      });
    }

    res.status(201).json({ message: "Đơn hàng đã được tạo!", order: populatedOrder });
  } catch (error) {
    res.status(error.message.includes("không tồn tại") ? 404 : 400).json({ 
      message: error.message || "Lỗi server!" 
    });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await orderService.getAllOrders();
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.params.id, req.user);

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

    res.status(200).json({ message: "Lấy đơn hàng thành công!", order: orderData });
  } catch (error) {
    const status = error.message === "forbidden" ? 403 : (error.message === "Đơn hàng không tồn tại!" ? 404 : 500);
    res.status(status).json({ message: error.message === "forbidden" ? "Bạn không có quyền xem đơn hàng này!" : error.message });
  }
};

export const updateOrderToPaid = async (req, res) => {
  try {
    const updatedOrder = await orderService.updateOrderToPaid(req.params.id);
    res.status(200).json({ message: "Thanh toán thành công!", order: updatedOrder });
  } catch (error) {
    res.status(error.message.includes("không tồn tại") ? 404 : 500).json({ message: error.message });
  }
};

export const updateOrderToDelivered = async (req, res) => {
  try {
    const updatedOrder = await orderService.updateOrderToDelivered(req.params.id);
    res.status(200).json({ message: "Đơn hàng đã được giao!", order: updatedOrder });
  } catch (error) {
    res.status(error.message.includes("không tồn tại") ? 404 : 500).json({ message: error.message });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Không có quyền truy cập!" });
    }

    const orders = await orderService.getUserOrders(req.user._id);

    const formattedOrders = orders.map((order) => {
      const uniqueItems = [];
      const itemMap = new Map();

      order.orderItems.forEach((item) => {
        if (!item) return;
        const productId = item.product && item.product._id ? item.product._id : item.product;
        if (productId) {
          const idString = productId.toString();
          if (itemMap.has(idString)) {
            const existingItem = itemMap.get(idString);
            existingItem.quantity += item.quantity;
          } else {
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
        orderCode: order.orderCode,
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
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    await orderService.deleteOrder(req.params.id, req.user);
    res.status(200).json({ message: "Đơn hàng đã được xóa thành công!" });
  } catch (error) {
    const status = error.message === "forbidden" ? 403 : (error.message === "Đơn hàng không tồn tại!" ? 404 : 500);
    res.status(status).json({ message: error.message === "forbidden" ? "Bạn không có quyền xóa đơn hàng này!" : error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const updatedOrder = await orderService.updateOrderStatus(req.params.id, req.body);
    res.status(200).json({
      message: "Cập nhật trạng thái đơn hàng thành công!",
      order: updatedOrder,
    });
  } catch (error) {
    res.status(error.message.includes("không tồn tại") ? 404 : 500).json({ message: error.message });
  }
};

export const searchOrders = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: "Vui lòng nhập thông tin tìm kiếm!" });
    }
    const orders = await orderService.searchOrders(query);
    res.status(200).json({ message: "Tìm kiếm đơn hàng thành công!", orders });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
};

export const searchOrdersByUserName = async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) {
      return res.status(400).json({ message: "Vui lòng nhập tên khách hàng!" });
    }
    const orders = await orderService.searchOrdersByUserName(name);
    res.status(200).json({ message: "Tìm kiếm đơn hàng theo tên khách hàng thành công!", orders });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
};