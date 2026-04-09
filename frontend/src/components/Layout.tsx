import React from "react";
import { useLocation } from "react-router-dom";
import Header from "../components/Header";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { pathname } = location;

  // Ẩn Header nếu đường dẫn bắt đầu với "/admin" hoặc là các trang cụ thể
  const hideHeader =
    pathname.startsWith("/admin") ||
    [
      "/register",
      "/login",
      "/forgot-password",
      "/reset-password",
      "/change-password",
    ].includes(pathname);

  return (
    <>
      {!hideHeader && <Header />}
      {children}
    </>
  );
};

export default Layout;
