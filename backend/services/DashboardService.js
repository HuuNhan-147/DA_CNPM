import Product from "../models/ProductModel.js";
import User from "../models/UserModel.js";
import Order from "../models/OrderModel.js";
import Payment from "../models/PaymentModel.js";

export const getDashboardStats = async () => {
  const totalProducts = await Product.countDocuments();
  const totalUsers = await User.countDocuments();
  const totalOrders = await Order.countDocuments();

  const revenueData = await Payment.aggregate([
    { $match: { isPaid: true } },
    { $group: { _id: null, total: { $sum: "$totalPrice" } } },
  ]);
  const totalRevenue = revenueData[0]?.total || 0;

  return { totalProducts, totalUsers, totalOrders, totalRevenue };
};

export const getMonthlyRevenue = async () => {
  return await Payment.aggregate([
    { $match: { isPaid: true } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$paidAt" } },
        totalRevenue: { $sum: "$totalPrice" },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

export const getTopSellingProducts = async () => {
  return await Order.aggregate([
    { $unwind: "$orderItems" },
    {
      $lookup: {
        from: "orderitems",
        localField: "orderItems",
        foreignField: "_id",
        as: "itemDetails"
      }
    },
    { $unwind: "$itemDetails" },
    {
      $group: {
        _id: "$itemDetails.product",
        totalSold: { $sum: "$itemDetails.quantity" },
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
};

export const getLatestOrders = async () => {
  return await Order.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("user", "name email");
};

export const getLatestUsers = async () => {
  return await User.find().sort({ createdAt: -1 }).limit(5);
};

export const getOrderStatusStats = async () => {
  const stats = await Order.aggregate([
    {
      $lookup: {
        from: "payments",
        localField: "payment",
        foreignField: "_id",
        as: "paymentInfo"
      }
    },
    { $unwind: "$paymentInfo" },
    {
      $group: {
        _id: null,
        paid: { $sum: { $cond: ["$paymentInfo.isPaid", 1, 0] } },
        delivered: { $sum: { $cond: ["$isDelivered", 1, 0] } },
        unpaid: { $sum: { $cond: [{ $eq: ["$paymentInfo.isPaid", false] }, 1, 0] } },
        undelivered: { $sum: { $cond: [{ $eq: ["$isDelivered", false] }, 1, 0] } },
        total: { $sum: 1 },
      },
    },
  ]);
  return stats[0] || {};
};
