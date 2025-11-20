import React, { useEffect, useState } from "react";
import {
  getDashboardStats,
  getMonthlyRevenue,
  getTopSellingProducts,
  getLatestOrders,
  getLatestUsers,
  getOrderStatusStats,
} from "../api/DashboardApi";

interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [latestOrders, setLatestOrders] = useState<any[]>([]);
  const [latestUsers, setLatestUsers] = useState<any[]>([]);
  const [orderStatusStats, setOrderStatusStats] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, revenue, topProds, orders, users, orderStats] =
          await Promise.all([
            getDashboardStats(),
            getMonthlyRevenue(),
            getTopSellingProducts(),
            getLatestOrders(),
            getLatestUsers(),
            getOrderStatusStats(),
          ]);

        setStats(statsData);
        setMonthlyRevenue(revenue);
        setTopProducts(topProds);
        setLatestOrders(orders);
        setLatestUsers(users);
        setOrderStatusStats(orderStats);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu dashboard:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString("vi-VN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              label="Người dùng"
              value={stats.totalUsers}
              icon="👥"
              color="bg-blue-100"
              textColor="text-blue-600"
            />
            <StatCard
              label="Đơn hàng"
              value={stats.totalOrders}
              icon="📦"
              color="bg-green-100"
              textColor="text-green-600"
            />
            <StatCard
              label="Doanh thu"
              value={`₫${stats.totalRevenue.toLocaleString("vi-VN")}`}
              icon="💰"
              color="bg-purple-100"
              textColor="text-purple-600"
            />
            <StatCard
              label="Sản phẩm"
              value={stats.totalProducts}
              icon="🛍️"
              color="bg-yellow-100"
              textColor="text-yellow-600"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Monthly Revenue */}
          <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <span className="bg-blue-100 p-2 rounded-full mr-3">📈</span>
              Doanh thu theo tháng
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tháng
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doanh thu
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {monthlyRevenue.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item._id}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        ₫{item.totalRevenue.toLocaleString("vi-VN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <span className="bg-green-100 p-2 rounded-full mr-3">📊</span>
              Trạng thái đơn hàng
            </h2>
            <div className="space-y-3">
              {orderStatusStats &&
                Object.entries(orderStatusStats as Record<string, number>).map(
                  ([status, count]) => (
                    <div
                      key={status}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm font-medium text-gray-600">
                        {status === "paid" && "Đã thanh toán"}
                        {status === "delivered" && "Đã giao"}
                        {status === "unpaid" && "Chưa thanh toán"}
                        {status === "undelivered" && "Chưa giao"}
                        {status === "total" && "Tổng cộng"}
                      </span>
                      <span className="text-sm font-semibold">
                        {count} {status !== "total" && "đơn"}
                      </span>
                    </div>
                  )
                )}
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <span className="bg-red-100 p-2 rounded-full mr-3">🔥</span>
            Top sản phẩm bán chạy
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topProducts.map((product) => (
              <div
                key={product._id}
                className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <img
                  src={`http://localhost:5000${product.image}`}
                  alt={product.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div>
                  <p className="font-semibold text-gray-800">{product.name}</p>
                  <p className="text-sm text-gray-500">
                    Đã bán: {product.totalSold}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Latest Orders */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <span className="bg-purple-100 p-2 rounded-full mr-3">🕒</span>
              Đơn hàng mới nhất
            </h2>
            <div className="space-y-4">
              {latestOrders.map((order) => (
                <div key={order._id} className="border-b pb-3 last:border-b-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">
                        {order.user?.name || "Khách"}
                      </p>
                      <p className="text-sm text-gray-500">
                        ₫{order.totalPrice.toLocaleString("vi-VN")}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        order.isDelivered
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {order.isDelivered ? "Đã giao" : "Đang xử lý"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Latest Users */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <span className="bg-indigo-100 p-2 rounded-full mr-3">👥</span>
              Người dùng mới
            </h2>
            <div className="space-y-4">
              {latestUsers.map((user) => (
                <div key={user._id} className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                      {user.name.charAt(0)}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: number | string;
  icon: string;
  color: string;
  textColor: string;
}

const StatCard = ({ label, value, icon, color, textColor }: StatCardProps) => (
  <div
    className={`${color} rounded-xl shadow-sm p-5 transition-all hover:shadow-md`}
  >
    <div className="flex items-center">
      <div className={`p-3 rounded-lg ${textColor} mr-4`}>
        <span className="text-2xl">{icon}</span>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
      </div>
    </div>
  </div>
);

export default Dashboard;
