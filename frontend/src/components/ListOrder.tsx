import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getOrders, cancelOrder, createPaymentLink } from "../api/OrderApi";
import { Link, useNavigate } from "react-router-dom";
import { Package, Truck, CheckCircle, Clock, AlertCircle, ShoppingBag, CreditCard, XCircle } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<string>("all");

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
        <span className="flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full border border-green-200">
          <CheckCircle size={14} /> Đã giao hàng
        </span>
      );
    }
    if (isPaid) {
      return (
        <span className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full border border-blue-200">
          <Truck size={14} /> Đang vận chuyển
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 text-xs font-semibold px-3 py-1 rounded-full border border-yellow-200">
        <Clock size={14} /> Chờ thanh toán
      </span>
    );
  };

  const filteredOrders = orders.filter((order) => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return !order.isPaid && !order.isDelivered;
    if (activeTab === "shipping") return order.isPaid && !order.isDelivered;
    if (activeTab === "completed") return order.isDelivered;
    return true;
  });

  const tabs = [
    { id: "all", label: "Tất cả" },
    { id: "pending", label: "Chờ thanh toán" },
    { id: "shipping", label: "Vận chuyển" },
    { id: "completed", label: "Hoàn thành" },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
        <p className="text-gray-600 text-lg mb-6">{error}</p>
        {!user && (
          <Link
            to="/login"
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
          >
            Đăng nhập ngay
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 font-sans">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="text-indigo-600" /> Đơn hàng của tôi
            </h1>
            <Link to="/products" className="text-indigo-600 hover:underline font-medium">Tiếp tục mua sắm</Link>
        </div>

        {/* Status Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1 mb-8 overflow-x-auto">
          <div className="flex space-x-1 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-indigo-50 text-indigo-700 shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm">
                <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-6">Chưa có đơn hàng nào trong mục này</p>
                <Link
                    to="/products"
                    className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 font-medium"
                >
                    Mua sắm ngay
                </Link>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300"
              >
                {/* Order Header */}
                <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex flex-wrap gap-4 justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="bg-indigo-100 p-2 rounded-lg">
                        <Package className="text-indigo-600 w-5 h-5"/>
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-900">
                        #{order.orderCode}
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                        Ngày đặt: {new Date(order.createdAt).toLocaleDateString("vi-VN", {hour: '2-digit', minute:'2-digit'})}
                        </p>
                    </div>
                  </div>
                  <div>{getStatusBadge(order.isPaid, order.isDelivered)}</div>
                </div>

                {/* Order Content */}
                <div className="p-6">
                  {/* Items */}
                  <div className="space-y-4 mb-6">
                    {order.orderItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 py-2"
                      >
                        <div className="flex-shrink-0 w-16 h-16 border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                          <img
                            src={item.image || "/placeholder-product.jpg"}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                "/placeholder-product.jpg";
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {item.productName}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            x{item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                            <span className="block text-sm font-semibold text-gray-900">
                                {(item.price * item.quantity).toLocaleString("vi-VN")}đ
                            </span>
                            {/* <span className="block text-xs text-gray-400 line-through">200.000đ</span> */}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-dashed border-gray-200 my-4"></div>

                  {/* Summary & Actions */}
                  <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                     <div className="text-sm text-gray-600 space-y-1 w-full md:w-auto">
                        <p><span className="font-medium text-gray-700">Người nhận:</span> {order.shippingAddress.fullname}</p>
                        <p><span className="font-medium text-gray-700">Thanh toán:</span> {order.paymentMethod === "VNPay" ? "VNPay" : "COD"}</p>
                     </div>

                     <div className="w-full md:w-auto flex flex-col items-end gap-4">
                        <div className="flex items-center gap-2">
                             <span className="text-gray-600">Tổng tiền:</span>
                             <span className="text-xl font-bold text-indigo-600">{(order.totalPrice || 0).toLocaleString("vi-VN")}đ</span>
                        </div>

                        <div className="flex gap-3 w-full md:w-auto">
                            {!order.isPaid && !order.isDelivered && (
                            <>
                                <button
                                onClick={() => handleCancelOrder(order._id)}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition text-sm font-medium"
                                >
                                <XCircle size={16}/> Hủy đơn
                                </button>
                                <button
                                onClick={() => handlePayment(order._id)}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-md shadow-indigo-200 text-sm font-medium"
                                >
                                <CreditCard size={16}/> Thanh toán
                                </button>
                            </>
                            )}
                            {order.isPaid && !order.isDelivered && (
                                <button disabled className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed">
                                    Đang xử lý
                                </button>
                            )}
                            {order.isDelivered && (
                                 <button disabled className="px-4 py-2 bg-green-50 text-green-600 border border-green-200 rounded-lg text-sm font-medium cursor-default">
                                    Hoàn thành
                                </button>
                            )}
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ListOrder;