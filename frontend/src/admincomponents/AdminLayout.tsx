import React, { useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { io } from "socket.io-client";

import AdminHeader from "../admincomponents/Header";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    const socket = io("http://localhost:5000", {
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log("🟢 Connected to backend Socket.IO on Admin App!");
    });

    socket.on("new_order", (data) => {
      toast.info(
        <div>
          <p className="font-bold text-blue-600">{data.message || "📦 Đơn hàng mới!"}</p>
          <p className="text-sm">Mã đơn: <strong>{data.orderCode}</strong></p>
          <p className="text-sm text-green-600">Tổng tiền: {data.totalPrice?.toLocaleString("vi-VN")} VND</p>
        </div>,
        { position: "top-right", autoClose: 10000 }
      );
      window.dispatchEvent(new Event("admin_new_order_received"));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer />
      <AdminHeader /> {/* Sidebar cố định bên trái (w-64) */}
      
      {/* Wrapper cho nội dung chính, thêm margin-left bằng với width của sidebar */}
      <div className="ml-64 min-h-screen transition-all duration-300">
        <div className="container mx-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
