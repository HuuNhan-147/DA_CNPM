import React, { useEffect, useState } from "react";
import {
  fetchProductDetails,
  updateProduct,
  submitReview,
  getProductReviews,
} from "../api/productApi";
import { fetchCategory } from "../api/CategoryApi";
import { IProduct } from "../types/product";
import { ICategory } from "../types/category";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
interface Review {
  user: string;
  rating: number;
  comment: string;
}
const GetDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<IProduct | null>(null);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");

  const [reviews, setReviews] = useState<any[]>([]);
  const [showReviews, setShowReviews] = useState<boolean>(false);
  const [hasReviewed, setHasReviewed] = useState<boolean>(false);

  const { token, user } = useAuth();

  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [price, setPrice] = useState<number>(0);
  const [category, setCategory] = useState<string>("");
  const [countInStock, setCountInStock] = useState<number>(0);
  const [image, setImage] = useState<File | null>(null);

  const [isEditing, setIsEditing] = useState<boolean>(false); // State để theo dõi xem bảng chỉnh sửa có hiển thị hay không

  useEffect(() => {
    const getCategories = async () => {
      try {
        const data = await fetchCategory();
        setCategories(data);
      } catch {
        setError("Không thể tải danh mục.");
      }
    };

    const getProductDetail = async () => {
      try {
        if (!id) return setError("Không tìm thấy ID sản phẩm.");
        const data = await fetchProductDetails(id);
        setProduct(data);
        setName(data.name);
        setDescription(data.description);
        setPrice(data.price);
        setCategory(data.category);
        setCountInStock(data.countInStock);
      } catch {
        setError("Không thể tải thông tin sản phẩm.");
      } finally {
        setLoading(false);
      }
    };

    getCategories();
    getProductDetail();
  }, [id]);

  const handleGetReviews = async () => {
    if (!showReviews) {
      try {
        const reviewsData: Review[] = await getProductReviews(id!);
        setReviews(reviewsData);
        const userHasReviewed = reviewsData.some(
          (r: Review) => r.user === user?.name
        );
        setHasReviewed(userHasReviewed);
      } catch {
        alert("Lỗi khi lấy đánh giá.");
      }
    }
    setShowReviews((prev) => !prev);
  };
  const handleUpdateProduct = async () => {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("price", String(price));
    formData.append("category", category);
    formData.append("countInStock", String(countInStock));
    if (image) formData.append("image", image);

    try {
      const updated = await updateProduct(id!, formData, token!);
      alert("Cập nhật sản phẩm thành công!");
      setProduct(updated.product); // ✅ Lấy đúng product
      setIsEditing(false);
    } catch (err) {
      alert("Lỗi khi cập nhật sản phẩm.");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Đang tải thông tin sản phẩm...</p>
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );

  const categoryName = categories.find(
    (c) => c._id === product?.category
  )?.name;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/2">
          <img
            src={product?.image}
            alt={product?.name}
            className="w-full rounded-lg shadow-lg object-cover"
          />
        </div>

        <div className="md:w-1/2">
          <div className="space-y-4 mb-6">
            {!isEditing ? (
              <>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  {product?.name}
                </h1>
                <p className="text-gray-700">
                  <span className="font-semibold">Mô tả:</span>{" "}
                  {product?.description}
                </p>
                {product ? (
                  <p className="text-2xl font-bold text-red-600">
                    {product.price.toLocaleString()} VND
                  </p>
                ) : (
                  <p>Đang tải giá...</p>
                )}

                <p className="text-gray-700">
                  <span className="font-semibold">Tình trạng:</span>{" "}
                  <span
                    className={
                      product?.countInStock ? "text-green-600" : "text-red-600"
                    }
                  >
                    {product?.countInStock ? "Còn hàng" : "Hết hàng"}
                  </span>
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Danh mục:</span>{" "}
                  {categoryName || "Không có danh mục"}
                </p>

                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Chỉnh sửa
                </button>
              </>
            ) : (
              <>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tên sản phẩm"
                  className="w-full px-4 py-2 border rounded-md"
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả sản phẩm"
                  rows={4}
                  className="w-full px-4 py-2 border rounded-md"
                />
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  placeholder="Giá sản phẩm"
                  className="w-full px-4 py-2 border rounded-md"
                />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md"
                >
                  <option value="">Chọn danh mục</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={countInStock}
                  onChange={(e) => setCountInStock(Number(e.target.value))}
                  placeholder="Số lượng trong kho"
                  className="w-full px-4 py-2 border rounded-md"
                />
                <input
                  type="file"
                  onChange={(e) => setImage(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border rounded-md"
                />
                <div className="flex space-x-4">
                  <button
                    onClick={handleUpdateProduct}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg"
                  >
                    Cập nhật
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg"
                  >
                    Hủy
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-12 border-t pt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Đánh giá sản phẩm</h2>
          <button
            onClick={handleGetReviews}
            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
          >
            {showReviews ? "Ẩn đánh giá" : "Xem đánh giá"}
          </button>
        </div>

        {showReviews && (
          <div className="space-y-6 mb-8">
            {reviews.length === 0 ? (
              <p>Chưa có đánh giá nào.</p>
            ) : (
              reviews.map((review, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded">
                  <p className="font-semibold">{review.name}</p>
                  <div className="text-yellow-400">
                    {"★".repeat(review.rating)}
                    <span className="text-gray-300">
                      {"★".repeat(5 - review.rating)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                  <p>{review.comment}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GetDetail;
