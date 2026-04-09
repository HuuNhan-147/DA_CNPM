import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { getOrderDetails } from "../api/OrderApi";
import OrderMainInfo from "./OrderMainInfo";
import OrderCustomerInfo from "./OrderCustomerInfo";
import OrderActions from "./OrderActions";

const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = localStorage.getItem("token") || "";

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getOrderDetails(token, id || "");
      setOrder(res.order);
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi tải đơn hàng");
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    if (id) fetchOrder();
  }, [id, fetchOrder]);

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!order) return <div>Không tìm thấy đơn hàng</div>;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Chi Tiết Đơn Hàng</h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Mã đơn hàng:</span>
          <span className="font-medium">{order.orderCode}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <OrderMainInfo order={order} />
        <div className="space-y-6">
          <OrderCustomerInfo order={order} />
          <OrderActions orderId={id || ""} token={token} refresh={fetchOrder} />
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
