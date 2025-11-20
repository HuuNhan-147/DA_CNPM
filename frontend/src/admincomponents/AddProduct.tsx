import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { addProduct } from "../api/productApi";
import { fetchCategory } from "../api/CategoryApi";
const AddProduct: React.FC = () => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [category, setCategory] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [countInStock, setCountInStock] = useState<number>(10);
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>(
    []
  );
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);
  const { getToken } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await fetchCategory();
        setCategories(categoriesData);
      } catch (error) {
        console.error("Lỗi khi lấy danh mục sản phẩm:", error);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImage(e.target.files[0]);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) {
      alert("Bạn cần đăng nhập!");
      return;
    }
    const formData = new FormData();
    formData.append("name", name);
    formData.append("price", price.toString());
    formData.append("description", description);
    formData.append("category", category);
    formData.append("rating", rating.toString());
    formData.append("countInStock", countInStock.toString());
    if (image) formData.append("image", image);
    try {
      await addProduct(formData, token);
      alert("Sản phẩm đã được thêm thành công!");
      navigate("/admin/products");
    } catch (error) {
      alert("Không thể thêm sản phẩm. Vui lòng thử lại!");
    }
  };
  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          🎉 Thêm Sản Phẩm Mới
        </h1>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Tên sản phẩm */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Tên sản phẩm
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* Giá sản phẩm */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Giá sản phẩm
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* Mô tả */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Mô tả sản phẩm
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* Danh mục */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Danh mục
            </label>
            {loadingCategories ? (
              <div className="text-gray-500 italic">Đang tải danh mục...</div>
            ) : (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Đánh giá */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Đánh giá (1-5)
            </label>
            <input
              type="number"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              min="1"
              max="5"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* Số lượng còn lại */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Số lượng trong kho
            </label>
            <input
              type="number"
              value={countInStock}
              onChange={(e) => setCountInStock(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* Hình ảnh */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Ảnh sản phẩm
            </label>
            <div className="flex items-center gap-4">
              <label className="cursor-pointer flex items-center gap-2 bg-white border border-dashed border-gray-300 rounded-lg px-4 py-3 hover:bg-gray-50">
                <svg
                  className="w-6 h-6 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4-4m0 0l4 4m-4-4v12M20 16V4a2 2 0 00-2-2H6a2 2 0 00-2 2v12"
                  />
                </svg>
                <span className="text-sm">Chọn ảnh</span>
                <input
                  type="file"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              {image && (
                <span className="text-sm text-gray-700">{image.name}</span>
              )}
            </div>
          </div>

          {/* Nút submit */}
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-200"
            >
              Thêm sản phẩm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;
