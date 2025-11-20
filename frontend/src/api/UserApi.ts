import api from "../config/axios";

// Đăng nhập
export const loginUser = async (email: string, password: string) => {
  try {
    const response = await api.post("/users/login", { email, password });
    return response.data; // Trả về token hoặc thông tin user
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Đăng nhập thất bại!");
  }
};

// Đăng ký
export const registerUser = async (
  email: string,
  password: string,
  name: string,
  phone: string
) => {
  try {
    const response = await api.post("/users/register", {
      email,
      password,
      name,
      phone,
    });
    return response.data; // Trả về thông tin user sau khi tạo tài khoản
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Tạo tài khoản thất bại!");
  }
};

// Quên mật khẩu
export const forgotPassword = async (email: string) => {
  try {
    const response = await api.post("/users/forgot-password", { email });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Lỗi khi gửi yêu cầu quên mật khẩu!"
    );
  }
};

// Reset mật khẩu
export const resetPassword = async (resetToken: string, newPassword: string) => {
  try {
    const response = await api.post(`/users/reset-password/${resetToken}`, {
      password: newPassword,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Lỗi khi thay đổi mật khẩu!"
    );
  }
};

// Cập nhật mật khẩu
export const updatePassword = async (
  oldPassword: string,
  newPassword: string,
  token: string
) => {
  try {
    const response = await api.put(
      "/users/update-password",
      { oldPassword, newPassword },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Cập nhật mật khẩu thất bại!"
    );
  }
};

// Cập nhật profile user
export const updateUserProfile = async (
  updatedData: {
    name?: string;
    email?: string;
    phone?: string;
  },
  token: string
) => {
  try {
    const response = await api.put("/users/profile", updatedData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Cập nhật thông tin thất bại!"
    );
  }
};

// Lấy tất cả user (Admin)
export const getAllUsers = async (token: string) => {
  try {
    const response = await api.get("/users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Lấy danh sách người dùng thất bại!"
    );
  }
};

// Cập nhật user (Admin)
export const updateUserByAdmin = async (
  userId: string,
  updatedData: {
    name?: string;
    email?: string;
    phone?: string;
    isAdmin?: boolean;
  },
  token: string
) => {
  try {
    const response = await api.put(`/users/${userId}`, updatedData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Cập nhật người dùng thất bại!"
    );
  }
};

// Xóa user (Admin)
export const deleteUser = async (userId: string, token: string) => {
  try {
    const response = await api.delete(`/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Xóa người dùng thất bại!"
    );
  }
};

// Lấy user theo ID (Admin)
export const getUserById = async (userId: string, token: string) => {
  try {
    const response = await api.get(`/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Lấy thông tin người dùng thất bại!"
    );
  }
};

// Tìm kiếm user
export const searchUsers = async (query: string, token: string) => {
  try {
    const response = await api.get(`/users/search?query=${query}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Lỗi khi tìm kiếm người dùng!"
    );
  }
};

// Lấy profile user hiện tại
export const getUserProfile = async (token: string) => {
  try {
    const response = await api.get("/users/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Không thể lấy thông tin người dùng!"
    );
  }
};
