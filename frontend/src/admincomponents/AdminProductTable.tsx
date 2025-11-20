import React from "react";
import { useNavigate } from "react-router-dom";
import { IProduct } from "../types/product";
import { deleteProduct } from "../api/productApi";

interface AdminProductTableProps {
  products: IProduct[];
  loading: boolean;
  error: string | null;
  token: string | null;
  onDeleteProduct: (productId: string) => void;
}

const AdminProductTable: React.FC<AdminProductTableProps> = ({
  products,
  loading,
  error,
  token,
  onDeleteProduct,
}) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-blue-500"></div>
        <span className="mt-4 text-gray-600 text-lg font-medium">
          Đang tải danh sách sản phẩm...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-6 rounded-lg mx-6 my-8">
        <div className="flex items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-16 w-16 mx-auto text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-700">
          Không tìm thấy sản phẩm
        </h3>
        <p className="mt-1 text-gray-500">
          Không có sản phẩm nào phù hợp với bộ lọc hiện tại
        </p>
      </div>
    );
  }

  const handleDelete = (productId: string) => {
    if (!token) {
      navigate("/login");
      return;
    }
    if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      deleteProduct(productId, token)
        .then(() => {
          onDeleteProduct(productId);
          alert("Xóa sản phẩm thành công!");
        })
        .catch(() => alert("Xóa sản phẩm thất bại!"));
    }
  };

  return (
    <>
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-semibold text-gray-700">
          Tổng cộng <span className="text-blue-600">{products.length}</span> sản phẩm
        </h3>
        <div className="text-sm text-gray-500">
          Sắp xếp theo: <span className="font-medium text-gray-700">Mới nhất</span>
        </div>
      </div>
      <table className="min-w-full divide-y divide-gray-200">
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
              <td className="px-6 py-4 whitespace-nowrap text-blue-600 font-semibold">{product.price.toLocaleString()} VND</td>
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
    </>
  );
};

export default AdminProductTable;
