import api from "../config/axios"; // Import axios đã config
import { IProduct } from "../types/product"; // Import kiểu dữ liệu sản phẩm
import { AxiosError } from "axios";
export const fetchProducts = async () => {
  try {
    const response = await api.get("/products"); // Không cần baseURL nữa
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy sản phẩm:", error);
    throw error;
  }
};
export const fetchChatbotResponse = async (question: string) => {
  try {
    const response = await api.post("/chatbot", { question }); 
    return response.data.response;
  } catch (error) {
    console.error("Lỗi khi gọi API chatbot:", error);
    throw error;
  }
};

// Gọi API chatbot admin, cần truyền token để xác thực admin
export const fetchAdminChatbotResponse = async (
  question: string,
  token: string
) => {
  try {
    const response = await api.post(
      "/admin-chatbot", // Giả sử backend bạn có route /chatbot/admin
      { question },
      {
        headers: {
          Authorization: `Bearer ${token}`, // Token admin trong header
        },
      }
    );
    return response.data.response; // Phản hồi từ backend (HTML hoặc text)
  } catch (error) {
    console.error("Lỗi khi gọi API chatbot admin:", error);
    throw error;
  }
};

export const fetchProductDetails = async (productId: string) => {
  try {
    const response = await api.get(`/products/${productId}`); // Gọi API lấy chi tiết sản phẩm theo ID
    return response.data; // Trả về dữ liệu chi tiết sản phẩm
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết sản phẩm:", error);
    throw error; // Ném lỗi nếu có
  }
};
// Hàm gửi đánh giá sản phẩm
export const submitReview = async (
  productId: string,
  token: string,
  rating: number,
  comment: string
) => {
  try {
    // Gửi yêu cầu POST đến API để thêm đánh giá
    const response = await api.post(
      `/products/${productId}/reviews`, // Endpoint API
      {
        rating, // Gửi số sao
        comment, // Gửi nội dung đánh giá
      },
      {
        headers: {
          Authorization: `Bearer ${token}`, // Gửi token trong header Authorization
        },
      }
    );

    return response.data; // Trả về phản hồi từ API, có thể là thông báo thành công
  } catch (error) {
    console.error("Lỗi khi gửi đánh giá:", error);
    throw error; // Ném lỗi nếu có
  }
};
export const getProductReviews = async (productId: string) => {
  try {
    // Gửi yêu cầu GET đến API để lấy danh sách đánh giá của sản phẩm
    const response = await api.get(`/products/${productId}/reviews`);

    return response.data; // Trả về dữ liệu danh sách đánh giá từ API
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đánh giá:", error);
    throw error; // Ném lỗi nếu có
  }
};
export const deleteProduct = async (productId: string, token: string) => {
  try {
    // Gửi yêu cầu DELETE đến API để xóa sản phẩm theo ID
    const response = await api.delete(`/products/${productId}`, {
      headers: {
        Authorization: `Bearer ${token}`, // Gửi token trong header Authorization
      },
    });

    return response.data; // Trả về phản hồi từ API, có thể là thông báo thành công
  } catch (error) {
    console.error("Lỗi khi xóa sản phẩm:", error);
    throw error; // Ném lỗi nếu có
  }
};
export const addProduct = async (productData: FormData, token: string) => {
  try {
    const response = await api.post("/products", productData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    const err = error as AxiosError;
    throw new Error("Lỗi khi thêm sản phẩm: " + (err.response?.data || err.message));
  }
};
export const updateProduct = async (
  productId: string,
  productData: FormData, // Đảm bảo productData là FormData
  token: string
) => {
  try {
    const response = await api.put(`/products/${productId}`, productData, {
      headers: {
        "Content-Type": "multipart/form-data", // Đảm bảo đúng Content-Type cho FormData
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data; // Trả về phản hồi từ API
  } catch (error) {
    console.error("Lỗi khi sửa sản phẩm:", error);
    throw error; // Ném lỗi nếu có
  }
};
