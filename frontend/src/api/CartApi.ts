import api from "../config/axios";

// Hàm thêm sản phẩm vào giỏ hàng
export const addToCart = async (productId: string, quantity: number) => {
  const response = await api.post("/cart/add", { productId, quantity });
  return response.data;
};

// Hàm lấy giỏ hàng người dùng
export const getCart = async () => {
  const response = await api.get("/cart");
  return response.data;
};

// Hàm xóa sản phẩm khỏi giỏ hàng
export const removeFromCart = async (productId: string) => {
  const response = await api.delete(`/cart/${productId}`);
  return response.data;
};

// Hàm cập nhật số lượng sản phẩm trong giỏ hàng
export const updateCartItem = async (productId: string, quantity: number) => {
  const response = await api.put(`/cart/update`, { productId, quantity });
  return response.data;
};

// Hàm lấy tổng số sản phẩm trong giỏ hàng
export const getCartItemCount = async () => {
  const response = await api.get("/cart/count");
  return response.data;
};
