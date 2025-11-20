import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchProducts } from "../api/productSearchApi";
import SearchFilter from "../components/SearchFilter";
import { IProduct } from "../types/product";

const SearchProduct: React.FC = () => {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleResetFilters = () => {
    navigate("/admin/products/search", { replace: true });
  };

  const handleDelete = (productId: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      // TODO: Gọi API xóa sản phẩm ở đây
      console.log("Xóa sản phẩm với ID:", productId);
    }
  };

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
      <h1 className="text-3xl font-bold mb-6">Quản lý sản phẩm</h1>
      <SearchFilter initialValues={getInitialValues()} />

      {loading ? (
        <div className="text-center py-8">Đang tải sản phẩm...</div>
      ) : error ? (
        <div className="text-red-500 text-center py-8">{error}</div>
      ) : products.length > 0 ? (
        <div className="overflow-x-auto mt-6">
          <table className="min-w-full divide-y divide-gray-200 border">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ảnh</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên sản phẩm</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số lượng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đánh giá</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <img
                      src={product.image ? `http://localhost:5000${product.image}` : "/images/no-image.png"}
                      alt={product.name}
                      className="w-16 h-16 object-contain rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap max-w-xs truncate">{product.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-blue-600 font-semibold">
                    {product.price.toLocaleString()} VND
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{product.countInStock}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill={i < product.rating ? "yellow" : "gray"}
                          className="w-5 h-5"
                        >
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => navigate(`/admin/product/${product._id}`)}
                      className="mr-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

export default SearchProduct;
