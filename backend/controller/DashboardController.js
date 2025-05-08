// controllers/adminDashboardController.js

import Product from "../models/ProductModel.js";
import User from "../models/UserModel.js";
import Order from "../models/OrderModel.js";

// 1. Tổng quan: số lượng sản phẩm, người dùng, đơn hàng, tổng doanh thu
export const getDashboardStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();

    const revenueData = await Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);
    const totalRevenue = revenueData[0]?.total || 0;

    res.json({ totalProducts, totalUsers, totalOrders, totalRevenue });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 2. Doanh thu theo tháng (12 tháng gần nhất)
export const getMonthlyRevenue = async (req, res) => {
  try {
    const data = await Order.aggregate([
      { $match: { isPaid: true } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$paidAt" } },
          totalRevenue: { $sum: "$totalPrice" },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 3. Top sản phẩm bán chạy (tính theo quantity)
export const getTopSellingProducts = async (req, res) => {
  try {
    const data = await Order.aggregate([
      { $unwind: "$orderItems" },
      {
        $group: {
          _id: "$orderItems.product",
          totalSold: { $sum: "$orderItems.quantity" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $project: {
          _id: 0,
          productId: "$product._id",
          name: "$product.name",
          image: "$product.image",
          totalSold: 1,
        },
      },
    ]);

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 4. Đơn hàng mới nhất
export const getLatestOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name email");

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 5. Người dùng mới nhất
export const getLatestUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).limit(5);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 6. Thống kê trạng thái đơn hàng
export const getOrderStatusStats = async (req, res) => {
  try {
    const statusStats = await Order.aggregate([
      {
        $group: {
          _id: null,
          paid: { $sum: { $cond: ["$isPaid", 1, 0] } }, // Đếm số đơn đã thanh toán
          delivered: { $sum: { $cond: ["$isDelivered", 1, 0] } }, // Đếm số đơn đã giao

          unpaid: { $sum: { $cond: [{ $eq: ["$isPaid", false] }, 1, 0] } }, // Đếm số đơn chưa thanh toán
          undelivered: {
            $sum: { $cond: [{ $eq: ["$isDelivered", false] }, 1, 0] },
          }, // Đếm số đơn chưa giao
          total: { $sum: 1 }, // Đếm tổng số đơn
        },
      },
    ]);

    res.json(statusStats[0] || {}); // Trả về dữ liệu
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
