import React, { useEffect, useState } from "react";
import { fetchProductDetails } from "../api/productApi";
import { fetchCategory } from "../api/CategoryApi";
import { IProduct } from "../types/product";
import { ICategory } from "../types/category";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { AddToCartButton } from "./AddToCartButton";
import { submitReview, getProductReviews } from "../api/productApi";
import { useAuth } from "../context/AuthContext";
import { IReview } from "../types/review";
import { AxiosError } from "axios";
const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const passedProduct = location.state?.product as IProduct | undefined;
  const [product, setProduct] = useState<IProduct | null>(null);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [reviews, setReviews] = useState<IReview[]>([]); // ✅ thay any[] thành IReview[]
  const [showReviews, setShowReviews] = useState<boolean>(false);
  const [hasReviewed, setHasReviewed] = useState<boolean>(false);
  const navigate = useNavigate();

  const { token, user } = useAuth();

  useEffect(() => {
    const getCategories = async () => {
      try {
        const data = await fetchCategory();
        setCategories(data);
      } catch (err) {
        setError("Không thể tải danh mục.");
      }
    };

    const getProductDetail = async () => {
      if (passedProduct) {
        const updatedProduct = {
          ...passedProduct,
          image: passedProduct.image
            ? passedProduct.image.startsWith("http") // nếu đã có http thì giữ nguyên
              ? passedProduct.image
              : `http://localhost:5000${passedProduct.image}` // nếu thiếu thì thêm host
            : "http://localhost:5000/uploads/no-image.png", // trường hợp không có ảnh
        };

        console.log("✅ Sản phẩm được truyền từ ProductCard:", updatedProduct);
        setProduct(updatedProduct);
        setLoading(false);
        return;
      }

      try {
        if (!id) {
          setError("Không tìm thấy ID sản phẩm.");
          return;
        }
        const data = await fetchProductDetails(id);
        setProduct(data);
      } catch (err) {
        setError("Không thể tải thông tin sản phẩm.");
      } finally {
        setLoading(false);
      }
    };

    getCategories();
    getProductDetail();
  }, [id, passedProduct]);

  const handleGetReviews = async () => {
    try {
      const reviewsData: IReview[] = await getProductReviews(id!);
      setReviews(reviewsData);
      setShowReviews(true);

      const userHasReviewed = reviewsData.some(
        (review: IReview) => review.user === user?.name
      );
      setHasReviewed(userHasReviewed);
    } catch (err) {
      console.error("Lỗi khi lấy danh sách đánh giá:", err);
      alert("Đã có lỗi xảy ra khi lấy danh sách đánh giá.");
    }
  };

  const handleReviewSubmit = async () => {
    if (rating < 1 || rating > 5) {
      alert("Vui lòng chọn số sao hợp lệ (từ 1 đến 5).");
      return;
    }
    if (!comment.trim()) {
      alert("Vui lòng nhập nội dung đánh giá.");
      return;
    }

    if (hasReviewed) {
      alert("Bạn đã đánh giá sản phẩm này rồi.");
      return;
    }

    try {
      if (!token) {
        alert("Bạn cần phải đăng nhập để gửi đánh giá.");
        return;
      }
      const response = await submitReview(id!, token, rating, comment);
      if (response) {
        alert("Đánh giá của bạn đã được gửi thành công!");
        await handleGetReviews();
      }
    } catch (err) {
      console.error("Lỗi khi gửi đánh giá:", err);

      // ✅ kiểm tra lỗi có phải từ Axios không
      if ((err as AxiosError).isAxiosError) {
        const axiosError = err as AxiosError;

        if (axiosError.response?.status === 400) {
          alert("Bạn đã đánh giá sản phẩm này rồi.");
          return;
        }
      }

      alert("Đã có lỗi xảy ra khi gửi đánh giá.");
    }

    setRating(0);
    setComment("");
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg">Đang tải thông tin sản phẩm...</p>
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500 text-lg">{error}</p>
      </div>
    );

  const categoryName = categories.find(
    (category) => category._id === product?.category
  )?.name;
  const handleBuyNow = () => {
    if (!token) {
      alert("Vui lòng đăng nhập để mua hàng.");
      navigate("/login");
      return;
    }

    if (product) {
      // ✅ Tạo bản sao sản phẩm với image chỉ giữ relative path
      const productToSend = {
        ...product,
        image: product.image?.startsWith("http://localhost:5000")
          ? product.image.replace("http://localhost:5000", "")
          : product.image,
      };

      console.log("Thông tin sản phẩm được truyền:", productToSend);

      // ✅ Chuyển hướng với state
      navigate("/create", {
        state: { product: productToSend },
      });
    } else {
      console.warn("Không có sản phẩm để mua.");
    }
  };

  const handleImageLoad = () => {
    setLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Product Image */}
        <div className="md:w-1/2">
          <img
            src={product?.image}
            alt={product?.name}
            onLoad={handleImageLoad}
            className="w-full rounded-lg shadow-lg object-cover"
          />
        </div>

        {/* Product Info */}
        <div className="md:w-1/2">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {product?.name}
          </h1>

          <div className="space-y-4 mb-6">
            <p className="text-gray-700">
              <span className="font-semibold">Mô tả:</span>{" "}
              {product?.description}
            </p>

            <p className="text-2xl font-bold text-red-600">
              {product?.price.toLocaleString()} VND
            </p>

            <div className="flex items-center space-x-2">
              <span className="font-semibold">Đánh giá:</span>
              <div className="flex items-center">
                <span className="text-yellow-400">
                  {"★".repeat(Math.round(product?.rating || 0))}
                </span>
                <span className="text-gray-400">
                  {"★".repeat(5 - Math.round(product?.rating || 0))}
                </span>
                <span className="ml-2 text-gray-600">
                  ({product?.numReviews} đánh giá)
                </span>
              </div>
            </div>

            <p
              className={
                product?.countInStock ? "text-green-600" : "text-red-600"
              }
            >
              <span className="font-semibold">Tình trạng:</span>{" "}
              {product?.countInStock ? "Còn hàng" : "Hết hàng"}
            </p>

            <p className="text-gray-700">
              <span className="font-semibold">Danh mục:</span>{" "}
              {categoryName || "Không có danh mục"}
            </p>
          </div>

          <div className="flex flex-wrap gap-4 mb-8">
            <AddToCartButton product={product!} />

            <button
              onClick={handleBuyNow}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-300 font-medium"
            >
              Mua ngay
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12 border-t pt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Đánh giá sản phẩm
          </h2>
          <button
            onClick={handleGetReviews}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition duration-300"
          >
            {showReviews ? "Ẩn đánh giá" : "Xem đánh giá"}
          </button>
        </div>

        {showReviews && (
          <div className="space-y-6 mb-8">
            {reviews.length === 0 ? (
              <p className="text-gray-600">Chưa có đánh giá nào.</p>
            ) : (
              reviews.map((review, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {review.name}
                      </p>
                      <div className="flex items-center mt-1">
                        <span className="text-yellow-400">
                          {"★".repeat(review.rating)}
                        </span>
                        <span className="text-gray-400">
                          {"★".repeat(5 - review.rating)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <p className="mt-2 text-gray-700">{review.comment}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Review Form */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Viết đánh giá của bạn</h3>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Số sao (1-5)
            </label>
            <input
              type="number"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              min="1"
              max="5"
              className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Nội dung đánh giá
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Nhập đánh giá của bạn về sản phẩm..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleReviewSubmit}
            disabled={hasReviewed}
            className={`px-6 py-2 rounded-md text-white font-medium ${
              hasReviewed
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            } transition duration-300`}
          >
            {hasReviewed ? "Bạn đã đánh giá" : "Gửi đánh giá"}
          </button>

          {hasReviewed && (
            <p className="mt-2 text-sm text-gray-600">
              Bạn đã đánh giá sản phẩm này trước đó.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
