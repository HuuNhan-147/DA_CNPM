import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getOrders, cancelOrder, createPaymentLink } from "../api/OrderApi";
import { Link, useNavigate } from "react-router-dom";

interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  image?: string;
}

interface ShippingAddress {
  fullname: string;
  phone: string;
  address: string;
  city: string;
}

interface Order {
  _id: string;
  orderCode: string;
  createdAt: string;
  orderItems: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  shippingPrice: number;
  taxPrice: number;
  totalPrice: number;
  isPaid: boolean;
  isDelivered: boolean;
}

const ListOrder: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Phiên đăng nhập hết hạn");
          setLoading(false);
          return;
        }

        const response = await getOrders(token);
        setOrders(response.orders || []);
      } catch (error) {
        console.error("Lỗi khi lấy thông tin đơn hàng:", error);
        setError("Không có đơn hàng nào");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const handlePayment = async (orderId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Vui lòng đăng nhập để thanh toán");
        return;
      }

      const paymentLink = await createPaymentLink(token, orderId);
      window.location.href = paymentLink;
    } catch (error) {
      console.error("Lỗi khi tạo link thanh toán:", error);
      alert("Có lỗi xảy ra khi tạo link thanh toán");
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await cancelOrder(token, orderId);
      const response = await getOrders(token);
      setOrders(response.orders || []);
      alert("Hủy đơn hàng thành công");
    } catch (error) {
      console.error("Lỗi khi hủy đơn hàng:", error);
      alert("Có lỗi xảy ra khi hủy đơn hàng");
    }
  };

  const getStatusBadge = (isPaid: boolean, isDelivered: boolean) => {
    if (isDelivered) {
      return (
        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
          Đã giao hàng
        </span>
      );
    }
    if (isPaid) {
      return (
        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
          Người bán đang chuẩn bị hàng
        </span>
      );
    }
    return (
      <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">
        Chờ thanh toán
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 mb-4">{error}</p>
        {!user && (
          <Link
            to="/login"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Đăng nhập ngay
          </Link>
        )}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-600 mb-4">Bạn chưa có đơn hàng nào</p>
        <Link
          to="/products"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Mua sắm ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Danh sách đơn hàng
      </h1>

      <div className="space-y-6">
        {orders.map((order) => (
          <div
            key={order._id}
            className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
          >
            {/* Order Header */}
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Đơn hàng #{order.orderCode}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Ngày đặt: {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                </p>
              </div>
              <div>{getStatusBadge(order.isPaid, order.isDelivered)}</div>
            </div>

            {/* Order Content */}
            <div className="p-6">
              {/* Shipping Info */}
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-700 mb-2">
                  Thông tin giao hàng
                </h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-gray-800">
                    {order.shippingAddress.fullname}
                  </p>
                  <p className="text-gray-600">{order.shippingAddress.phone}</p>
                  <p className="text-gray-600">
                    {order.shippingAddress.address},{" "}
                    {order.shippingAddress.city}
                  </p>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-700 mb-2">
                  Phương thức thanh toán
                </h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-gray-800">
                    {order.paymentMethod === "VNPay"
                      ? "Chuyển khoản VNPay"
                      : "Thanh toán khi nhận hàng"}
                  </p>
                  <p
                    className={`text-sm mt-1 ${
                      order.isPaid ? "text-green-600" : "text-yellow-600"
                    }`}
                  >
                    {order.isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-700 mb-3">
                  Sản phẩm
                </h3>
                <div className="space-y-4">
                  {order.orderItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start border-b pb-4 last:border-0"
                    >
                      <div className="flex-shrink-0">
                        <img
                          src={
                            item.image
                              ? `http://localhost:5000${item.image}`
                              : "/placeholder-product.jpg"
                          }
                          alt={item.productName}
                          className="w-20 h-20 object-cover rounded-md border border-gray-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "/placeholder-product.jpg";
                          }}
                        />
                      </div>
                      <div className="ml-4 flex-1">
                        <h4 className="text-md font-medium text-gray-800">
                          {item.productName}
                        </h4>
                        <div className="flex justify-between mt-2 text-sm text-gray-600">
                          <span>Số lượng: {item.quantity}</span>
                          <span>
                            {(item.price * item.quantity).toLocaleString(
                              "vi-VN"
                            )}{" "}
                            VND
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-md font-medium text-gray-700 mb-3">
                  Tổng kết đơn hàng
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tạm tính:</span>
                    <span className="text-gray-800">
                      {(
                        order.totalPrice -
                        order.shippingPrice -
                        order.taxPrice
                      ).toLocaleString("vi-VN")}{" "}
                      VND
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phí vận chuyển:</span>
                    <span className="text-gray-800">
                      {order.shippingPrice.toLocaleString("vi-VN")} VND
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Thuế (VAT):</span>
                    <span className="text-gray-800">
                      {order.taxPrice.toLocaleString("vi-VN")} VND
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 mt-2 border-t border-gray-200">
                    <span className="font-medium text-gray-800">
                      Tổng cộng:
                    </span>
                    <span className="font-bold text-blue-600">
                      {order.totalPrice.toLocaleString("vi-VN")} VND
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-end space-x-3">
                {!order.isPaid && !order.isDelivered && (
                  <>
                    <button
                      onClick={() => handlePayment(order._id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Thanh toán ngay
                    </button>
                    <button
                      onClick={() => handleCancelOrder(order._id)}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      Hủy đơn hàng
                    </button>
                  </>
                )}
                {order.isPaid && !order.isDelivered && (
                  <span className="text-sm text-gray-500">
                    Đơn hàng đang được xử lý
                  </span>
                )}
                {order.isDelivered && (
                  <span className="text-sm text-green-600">
                    Đơn hàng đã hoàn thành
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListOrder;