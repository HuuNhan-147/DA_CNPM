import api from "../config/axios";

// Hàm tiện ích để lấy token từ localStorage
const getToken = () => {
  return localStorage.getItem("token");
};

// Gọi tổng quan dashboard
export const getDashboardStats = async () => {
  try {
    const token = getToken();
    const response = await api.get("/dashboard/stats", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching dashboard stats", error);
    throw error;
  }
};

// Gọi doanh thu theo tháng
export const getMonthlyRevenue = async () => {
  try {
    const token = getToken();
    const response = await api.get("/dashboard/monthly-revenue", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching monthly revenue", error);
    throw error;
  }
};

// Gọi top sản phẩm bán chạy
export const getTopSellingProducts = async () => {
  try {
    const token = getToken();
    const response = await api.get("/dashboard/top-products", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching top selling products", error);
    throw error;
  }
};

// Gọi đơn hàng mới nhất
export const getLatestOrders = async () => {
  try {
    const token = getToken();
    const response = await api.get("/dashboard/latest-orders", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching latest orders", error);
    throw error;
  }
};

// Gọi người dùng mới nhất
export const getLatestUsers = async () => {
  try {
    const token = getToken();
    const response = await api.get("/dashboard/latest-users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching latest users", error);
    throw error;
  }
};

// Gọi thống kê trạng thái đơn hàng
export const getOrderStatusStats = async () => {
  try {
    const token = getToken();
    const response = await api.get("/dashboard/order-status", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching order status stats", error);
    throw error;
  }
};
