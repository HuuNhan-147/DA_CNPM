import React from "react";
import { FiDollarSign } from "react-icons/fi";
import { useNavigate } from "react-router-dom"; // <-- import useNavigate
import {
  updateOrderDeliveryStatus,
  updateOrderPaymentStatus,
  cancelOrder,
} from "../api/OrderApi";

const OrderActions = ({
  orderId,
  token,
  refresh,
}: {
  orderId: string;
  token: string;
  refresh: () => void;
}) => {
  const navigate = useNavigate(); // <-- Khởi tạo navigate

  const handleUpdateDelivery = async () => {
    try {
      await updateOrderDeliveryStatus(token, orderId, true);
      alert("Đã cập nhật trạng thái giao hàng!");
      refresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdatePayment = async () => {
    try {
      await updateOrderPaymentStatus(token, orderId);
      alert("Đã xác nhận thanh toán!");
      refresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCancelOrder = async () => {
    if (window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) {
      try {
        await cancelOrder(token, orderId);
        alert("Đơn hàng đã bị hủy!");
        navigate("/admin/orders"); // <-- chuyển hướng về trang quản lý đơn hàng
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-4">
        <FiDollarSign className="text-purple-500 mr-2" />
        <h2 className="text-lg font-semibold">Hành Động</h2>
      </div>
      <div className="space-y-3">
        <button
          onClick={handleUpdateDelivery}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition"
        >
          Cập nhật trạng thái
        </button>
        <button
          onClick={handleUpdatePayment}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition"
        >
          Xác nhận thanh toán
        </button>
        <button
          onClick={handleCancelOrder}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition"
        >
          Hủy đơn hàng
        </button>
      </div>
    </div>
  );
};

export default OrderActions;
