import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchProducts } from "../api/productSearchApi";
import { IProduct } from "../types/product";
import { useAuth } from "../context/AuthContext";

import AdminProductSearchFilter from "./AdminProductSearchFilter";
import AdminProductTable from "./AdminProductTable";

const AdminProductList: React.FC = () => {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const token = getToken();
  const location = useLocation();
  const navigate = useNavigate();

  const fetchFilteredProducts = async (params: { [key: string]: string }) => {
    try {
      setLoading(true);
      setError(null);
      const data: IProduct[] = await fetchProducts(params);
      setProducts(data);
    } catch (err) {
      setError("Không thể tải sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);

    const params = {
      keyword: searchParams.get("keyword") || "",
      category: searchParams.get("category") || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      rating: searchParams.get("rating") || "",
      sortBy: searchParams.get("sortBy") || "latest",
    };

    fetchFilteredProducts(params);
  }, [location.search]);

  const getInitialValues = () => {
    const searchParams = new URLSearchParams(location.search);
    return {
      keyword: searchParams.get("keyword") || "",
      category: searchParams.get("category") || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      rating: searchParams.get("rating") || "",
      sortBy: searchParams.get("sortBy") || "latest",
    };
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prevProducts) =>
      prevProducts.filter((product) => product._id !== productId)
    );
  };

  const handleAddProduct = () => {
    navigate("/admin/add-product");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Quản lý sản phẩm</h1>
          <p className="text-gray-500 mt-1">
            Danh sách toàn bộ sản phẩm trong hệ thống
          </p>
        </div>
        <button
          onClick={handleAddProduct}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
        >
          {/* SVG + Text */}
          {/* ... */}
          Thêm sản phẩm
        </button>
      </div>

      {/* Search Filter Section */}
      <AdminProductSearchFilter initialValues={getInitialValues()} />

      {/* Content Section */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <AdminProductTable
          products={products}
          loading={loading}
          error={error}
          token={token}
          onDeleteProduct={handleDeleteProduct}
        />
      </div>
    </div>
  );
};

export default AdminProductList;
