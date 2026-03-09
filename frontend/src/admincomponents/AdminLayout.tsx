import React from "react";

import AdminHeader from "../admincomponents/Header";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gray-50">
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
