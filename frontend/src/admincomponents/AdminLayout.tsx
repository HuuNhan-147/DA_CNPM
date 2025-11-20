import React from "react";
import { Outlet } from "react-router-dom";
import AdminHeader from "../admincomponents/Header";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <AdminHeader /> {/* Hiển thị header cho các trang admin */}
      <div className="container mx-auto p-4">
        {children} {/* Render các children */}
      </div>
    </>
  );
};

export default AdminLayout;
