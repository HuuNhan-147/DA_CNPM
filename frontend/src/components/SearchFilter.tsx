import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { SlidersHorizontal, RefreshCcw } from "lucide-react";
import { fetchCategory } from "../api/CategoryApi";
import { ICategory } from "../types/category";
import { useAuth } from "../context/AuthContext";

// ✅ Khai báo kiểu cho props
interface SearchFilterProps {
  initialValues: {
    keyword?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    rating?: string;
    sortBy?: string;
  };
}

const SearchFilter: React.FC<SearchFilterProps> = ({ initialValues }) => {
  const [filters, setFilters] = useState({
    keyword: initialValues.keyword || "",
    category: initialValues.category || "",
    minPrice: initialValues.minPrice || "",
    maxPrice: initialValues.maxPrice || "",
    rating: initialValues.rating || "",
    sortBy: initialValues.sortBy || "latest",
  });

  const [categories, setCategories] = useState<ICategory[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchCategory();
        setCategories(data);
      } catch (error) {
        console.error("Lỗi khi lấy danh mục:", error);
      }
    };
    loadCategories();
  }, []);

  // ✅ typing cho event
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const queryParams = new URLSearchParams();

    if (filters.keyword) queryParams.append("keyword", filters.keyword);
    if (filters.category) queryParams.append("category", filters.category);
    if (filters.minPrice) queryParams.append("minPrice", filters.minPrice);
    if (filters.maxPrice) queryParams.append("maxPrice", filters.maxPrice);
    if (filters.rating) queryParams.append("rating", filters.rating);
    if (filters.sortBy) queryParams.append("sortBy", filters.sortBy);

    if (isAdmin) {
      navigate(`/admin/products/search?${queryParams.toString()}`);
    } else {
      navigate(`/products/search?${queryParams.toString()}`);
    }
  };

  const handleReset = () => {
    setFilters({
      keyword: "",
      category: "",
      minPrice: "",
      maxPrice: "",
      rating: "",
      sortBy: "latest",
    });
    navigate("/products/search");
  };
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-700">
        <SlidersHorizontal className="h-5 w-5 mr-2 text-blue-600" /> Bộ lọc tìm
        kiếm
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Tìm kiếm */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700">
              Tìm kiếm
            </label>
            <input
              type="text"
              name="keyword"
              value={filters.keyword}
              onChange={handleChange}
              placeholder="Nhập tên sản phẩm..."
              className="mt-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Danh mục */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700">
              Danh mục
            </label>
            <select
              name="category"
              value={filters.category}
              onChange={handleChange}
              className="mt-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả</option>
              {categories.length > 0 ? (
                categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))
              ) : (
                <option disabled>Đang tải...</option>
              )}
            </select>
          </div>

          {/* Giá từ */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700">Giá từ</label>
            <input
              type="number"
              name="minPrice"
              value={filters.minPrice}
              onChange={handleChange}
              placeholder="Tối thiểu"
              className="mt-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Giá đến */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700">Đến</label>
            <input
              type="number"
              name="maxPrice"
              value={filters.maxPrice}
              onChange={handleChange}
              placeholder="Tối đa"
              className="mt-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Đánh giá */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700">
              Đánh giá
            </label>
            <select
              name="rating"
              value={filters.rating}
              onChange={handleChange}
              className="mt-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả</option>
              <option value="4">⭐ 4+</option>
              <option value="3">⭐ 3+</option>
              <option value="2">⭐ 2+</option>
              <option value="1">⭐ 1+</option>
            </select>
          </div>

          {/* Sắp xếp */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700">Sắp xếp</label>
            <select
              name="sortBy"
              value={filters.sortBy}
              onChange={handleChange}
              className="mt-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="latest">Mới nhất</option>
              <option value="priceLowHigh">Giá: Thấp đến cao</option>
              <option value="priceHighLow">Giá: Cao đến thấp</option>
              <option value="bestSelling">Bán chạy nhất</option>
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-between items-center mt-6">
          <button
            type="button"
            onClick={handleReset}
            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCcw className="h-4 w-4 mr-2 inline" /> Đặt lại
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Áp dụng
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchFilter;
