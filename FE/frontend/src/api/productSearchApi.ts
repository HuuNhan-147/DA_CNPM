import { IProduct, IProductSearchParams } from "../types/product";
import api from "../config/axios";
import { Search } from "lucide-react";

export const fetchProducts = async (params: IProductSearchParams = {}) => {
  try {
    const apiParams = {
      keyword: params.keyword,
      category: params.category,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      rating: params.rating,
      sortBy: params.sortBy,
    };

    // Lọc bỏ các tham số rỗng/undefined
    const cleanedParams = Object.fromEntries(
      Object.entries(apiParams).filter(
        ([_, value]) => value !== "" && value !== undefined && value !== null
      )
    );

    const response = await api.get<IProduct[]>("/products/search", {
      params: cleanedParams,
      paramsSerializer: {
        indexes: null, // Ngăn axios thêm [] vào array params
      },
    });

    console.log("✅ Received products:", response.data.length);
    return response.data;
  } catch (error: any) {
    console.error("❌ Failed to fetch products:", {
      message: error.message,
      response: error.response?.data,
    });
    throw new Error(
      error.response?.data?.message || "Lỗi khi tải danh sách sản phẩm"
    );
  }
};
