import api from "../config/axios"; // Import axios đã config

// Lấy danh sách danh mục
export const fetchCategory = async () => {
  try {
    const response = await api.get("/categories");
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh mục:", error);
    throw error;
  }
};

// Lấy danh mục theo ID
export const fetchCategoryById = async (id: string) => {
  try {
    const token = localStorage.getItem("token"); // Lấy token từ localStorage hoặc dùng context
    const response = await api.get(`/categories/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy danh mục với ID ${id}:`, error);
    throw error;
  }
};

// Thêm danh mục mới
export const createCategory = async (categoryData: {
  name: string;
  description: string;
}) => {
  try {
    const token = localStorage.getItem("token"); // Lấy token từ localStorage hoặc dùng context
    const response = await api.post("/categories", categoryData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi khi thêm danh mục:", error);
    throw error;
  }
};

// Cập nhật danh mục
export const updateCategory = async (
  id: string,
  categoryData: { name: string; description: string }
) => {
  try {
    const token = localStorage.getItem("token"); // Lấy token từ localStorage hoặc dùng context
    const response = await api.put(`/categories/${id}`, categoryData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi cập nhật danh mục với ID ${id}:`, error);
    throw error;
  }
};

// Xóa danh mục
export const deleteCategory = async (id: string) => {
  try {
    const token = localStorage.getItem("token"); // Lấy token từ localStorage hoặc dùng context
    const response = await api.delete(`/categories/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi xóa danh mục với ID ${id}:`, error);
    throw error;
  }
};
