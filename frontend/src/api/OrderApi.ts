import api from "../config/axios";

export const createOrder = async (token: string, orderData: any) => {
  try {
    const response = await api.post("/orders", orderData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Lỗi khi tạo đơn hàng!");
  }
};

// ✅ Lấy link thanh toán từ VNPay
export const createPaymentLink = async (token: string, orderId: string) => {
  try {
    console.log("Requesting payment link for orderId:", orderId); // Log orderId khi gọi API VNPay
    const vnPayResponse = await api.post(
      "/vnpay/create",
      { orderId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log("Payment link received from VNPay:", vnPayResponse.data); // Log dữ liệu trả về từ VNPay
    // Giả sử API trả về trực tiếp URL thanh toán
    const paymentLink = vnPayResponse.data;
    return paymentLink;
  } catch (error: any) {
    console.error("Error while fetching payment link from VNPay:", error); // Log lỗi nếu có
    throw new Error(
      error.response?.data?.message || "Lỗi khi lấy link thanh toán!"
    );
  }
};
export const getOrders = async (token: string) => {
  try {
    const response = await api.get("/orders/me", {
      headers: {
        Authorization: `Bearer ${token}`, // Gửi token trong header
      },
    });
    return response.data; // Trả về danh sách đơn hàng
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Lỗi khi lấy danh sách đơn hàng!"
    );
  }
};
export const cancelOrder = async (token: string, orderId: string) => {
  try {
    const response = await api.delete(`/orders/${orderId}`, {
      headers: {
        Authorization: `Bearer ${token}`, // Gửi token trong header
      },
    });
    return response.data; // Trả về phản hồi từ API khi đơn hàng bị hủy
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Lỗi khi hủy đơn hàng!");
  }
};

export const updateOrderPaymentStatus = async (
  token: string,
  orderId: string
) => {
  try {
    const response = await api.put(
      `/orders/${orderId}/pay`, // Giả sử API path là /orders/:id/pay
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`, // Gửi token trong header
        },
      }
    );
    return response.data; // Trả về phản hồi từ API khi cập nhật trạng thái thanh toán
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Lỗi khi cập nhật trạng thái thanh toán!"
    );
  }
};

export const updateOrderDeliveryStatus = async (
  token: string,
  orderId: string,
  isDelivered: boolean
) => {
  try {
    const response = await api.put(
      `/orders/${orderId}/deliver`, // API path giả định cho cập nhật trạng thái giao hàng
      { isDelivered },
      {
        headers: {
          Authorization: `Bearer ${token}`, // Gửi token trong header
        },
      }
    );
    return response.data; // Trả về phản hồi sau khi cập nhật trạng thái giao hàng
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Lỗi khi cập nhật trạng thái giao hàng!"
    );
  }
};
export const getOrderDetails = async (token: string, orderId: string) => {
  try {
    const response = await api.get(`/orders/${orderId}`, {
      headers: {
        Authorization: `Bearer ${token}`, // Gửi token trong header
      },
    });
    return response.data; // Trả về thông tin chi tiết của đơn hàng
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ||
        "Lỗi khi lấy thông tin chi tiết đơn hàng!"
    );
  }
};
export const getAllOrders = async (token: string) => {
  try {
    const response = await api.get("/orders", {
      headers: {
        Authorization: `Bearer ${token}`, // Gửi token trong header
      },
    });
    return response.data; // Trả về danh sách tất cả các đơn hàng cho admin
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Lỗi khi lấy danh sách tất cả đơn hàng!"
    );
  }
};
export const updateOrderStatus = async (
  token: string,
  orderId: string,
  status: { isPaid: boolean; isDelivered: boolean }
) => {
  try {
    const response = await api.put(
      `/orders/${orderId}/status`, // API path giả định cho cập nhật trạng thái đơn hàng
      status,
      {
        headers: {
          Authorization: `Bearer ${token}`, // Gửi token trong header
        },
      }
    );
    return response.data; // Trả về phản hồi sau khi cập nhật trạng thái đơn hàng
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Lỗi khi cập nhật trạng thái đơn hàng!"
    );
  }
};
export const searchOrders = async (token: string, orderCode: string) => {
  try {
    const response = await api.get("/orders/search", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        query: orderCode, // Chỉ gửi query là orderCode
      },
    });

    return response.data; // Trả về dữ liệu từ API
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Lỗi khi tìm kiếm đơn hàng!"
    );
  }
};
export const searchOrdersByUserName = async (token: string, name: string) => {
  try {
    const response = await api.get("/orders/search-user", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: { name },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ||
        "Lỗi khi tìm kiếm đơn hàng theo tên khách hàng!"
    );
  }
};
