import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  getAllOrders,
  updateOrderPaymentStatus,
  updateOrderDeliveryStatus,
  cancelOrder,
  searchOrders,
  searchOrdersByUserName,
} from "../api/OrderApi";

interface Order {
  _id: string;
  orderCode: string;
  user: { name: string; email: string };
  totalPrice: number;
  isPaid: boolean;
  isDelivered: boolean;
  createdAt: string;
}

const AdminOrderManager: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [searchType, setSearchType] = useState<"orderCode" | "userName">(
    "orderCode"
  );

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const token = getToken();
        if (!token) return;
        const data = await getAllOrders(token);

        setOrders(data);
      } catch (err) {
        console.error("Lỗi khi load đơn hàng:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [getToken]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = getToken();
        if (!token) return;

        if (searchQuery.trim()) {
          if (searchType === "orderCode") {
            const results = await searchOrders(token, searchQuery);
            setOrders(results.orders);
          } else {
            const results = await searchOrdersByUserName(token, searchQuery);
            setOrders(results.orders);
          }
        } else {
          const data = await getAllOrders(token);
          setOrders(data);
        }
      } catch (err) {
        console.error("Lỗi khi tìm kiếm đơn hàng:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchQuery, searchType, getToken]);

  const handleViewDetails = (orderId: string) => {
    navigate(`/admin/orders/${orderId}`);
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa đơn hàng này?")) return;
    try {
      const token = getToken();
      if (!token) return;
      await cancelOrder(token, orderId);
      setOrders((prev) => prev.filter((order) => order._id !== orderId));
    } catch (err) {
      console.error("Lỗi khi xóa đơn hàng:", err);
    }
  };

  const handleUpdatePaid = async (orderId: string) => {
    try {
      const token = getToken();
      if (!token) return;
      await updateOrderPaymentStatus(token, orderId);
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, isPaid: true } : o))
      );
    } catch (err) {
      console.error("Lỗi khi cập nhật thanh toán:", err);
    }
  };

  const handleUpdateDelivered = async (orderId: string) => {
    try {
      const token = getToken();
      if (!token) return;
      await updateOrderDeliveryStatus(token, orderId, true);
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, isDelivered: true } : o))
      );
    } catch (err) {
      console.error("Lỗi khi cập nhật giao hàng:", err);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Quản lý đơn hàng</h1>

      <div className="mb-4">
        <div className="flex gap-2 mb-2">
          <button
            className={`px-4 py-2 rounded border ${
              searchType === "orderCode" ? "bg-blue-500 text-white" : "bg-white"
            }`}
            onClick={() => setSearchType("orderCode")}
          >
            Theo mã đơn hàng
          </button>
          <button
            className={`px-4 py-2 rounded border ${
              searchType === "userName" ? "bg-blue-500 text-white" : "bg-white"
            }`}
            onClick={() => setSearchType("userName")}
          >
            Theo tên khách hàng
          </button>
        </div>

        <input
          type="text"
          placeholder={`Tìm theo ${
            searchType === "orderCode" ? "mã đơn hàng" : "tên khách hàng"
          }...`}
          className="border px-3 py-2 rounded w-full"
          value={searchQuery}
          onChange={handleSearch}
        />
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <table className="w-full table-auto border border-gray-200 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Người đặt</th>
              <th className="p-2 border">Tổng tiền</th>
              <th className="p-2 border">Thanh toán</th>
              <th className="p-2 border">Giao hàng</th>
              <th className="p-2 border">Ngày tạo</th>
              <th className="p-2 border">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <td className="p-2 border">{order.orderCode}</td>
                <td className="p-2">{order.user?.name || "Không xác định"}</td>
                <td className="p-2 border">
                  {order.totalPrice.toLocaleString()}đ
                </td>
                <td className="p-2 border">
                  {order.isPaid ? (
                    "✅"
                  ) : (
                    <button
                      className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
                      onClick={() => handleUpdatePaid(order._id)}
                    >
                      Đánh dấu đã thanh toán
                    </button>
                  )}
                </td>
                <td className="p-2 border">
                  {order.isDelivered ? (
                    "✅"
                  ) : (
                    <button
                      className="bg-green-500 text-white px-2 py-1 rounded text-xs"
                      onClick={() => handleUpdateDelivered(order._id)}
                    >
                      Đánh dấu đã giao
                    </button>
                  )}
                </td>
                <td className="p-2 border">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
                <td className="p-2 border">
                  <button
                    className="bg-gray-700 text-white px-2 py-1 rounded text-xs mr-1"
                    onClick={() => handleViewDetails(order._id)}
                  >
                    Xem chi tiết
                  </button>
                  <button
                    className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                    onClick={() => handleCancelOrder(order._id)}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminOrderManager;
