import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchProducts } from "../api/productSearchApi";
import ProductCard from "./ProductCard";
import SearchFilter from "./SearchFilter";
import { IProduct } from "../types/product";

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  // Fetch filtered products based on the query params
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

  // Fetch products when location.search changes
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

  // Handle reset filters action
  const handleResetFilters = () => {
    navigate("/products", { replace: true });
  };

  // Get initial values for the filter form
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Danh sách sản phẩm</h1>
      <SearchFilter initialValues={getInitialValues()} />
      {loading ? (
        <div className="text-center py-8">Đang tải sản phẩm...</div>
      ) : error ? (
        <div className="text-red-500 text-center py-8">{error}</div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl">Không tìm thấy sản phẩm phù hợp</p>
          <button
            onClick={handleResetFilters}
            className="mt-4 text-blue-600 hover:underline"
          >
            Xóa bộ lọc
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductList;
