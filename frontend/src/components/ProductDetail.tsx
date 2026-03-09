import React, { useEffect, useState } from "react";
import { fetchProductDetails } from "../api/productApi";
import { fetchCategory } from "../api/CategoryApi";
import { IProduct, ISpecification } from "../types/product";
import { ICategory } from "../types/category";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { AddToCartButton } from "./AddToCartButton";
import { submitReview, getProductReviews } from "../api/productApi";
import { useAuth } from "../context/AuthContext";
import { IReview } from "../types/review";
import { AxiosError } from "axios";
import { Star, CheckCircle, ShieldCheck, Truck, ArrowLeft } from "lucide-react";

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
  const [reviews, setReviews] = useState<IReview[]>([]);
  const [showReviews, setShowReviews] = useState<boolean>(true); // Show by default or use tab
  const [hasReviewed, setHasReviewed] = useState<boolean>(false);
  const navigate = useNavigate();

  const { token, user } = useAuth();

  useEffect(() => {
    const getCategories = async () => {
      try {
        const data = await fetchCategory();
        setCategories(data);
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };

    const getProductDetail = async () => {
      if (passedProduct) {
        const updatedProduct = {
          ...passedProduct,
          image: passedProduct.image
            ? passedProduct.image.startsWith("http")
              ? passedProduct.image
              : `http://localhost:5000${passedProduct.image}`
            : "http://localhost:5000/uploads/no-image.png",
        };
        setProduct(updatedProduct);
        setLoading(false);
        // Still fetch fresh review data if using passed product
        if (passedProduct._id) {
             try {
                const reviewsData: IReview[] = await getProductReviews(passedProduct._id);
                setReviews(reviewsData);
                 const userHasReviewed = reviewsData.some(
                    (review: IReview) => review.user === user?.name
                  );
                  setHasReviewed(userHasReviewed);
             } catch(e) { console.log(e)}
        }
        return;
      }

      try {
        if (!id) {
          setError("Không tìm thấy ID sản phẩm.");
          return;
        }
        const data = await fetchProductDetails(id);
        setProduct(data);
        
        // Fetch reviews
        const reviewsData: IReview[] = await getProductReviews(id);
        setReviews(reviewsData);
        const userHasReviewed = reviewsData.some(
          (review: IReview) => review.user === user?.name
        );
        setHasReviewed(userHasReviewed);

      } catch (err) {
        setError("Không thể tải thông tin sản phẩm.");
      } finally {
        setLoading(false);
      }
    };

    getCategories();
    getProductDetail();
  }, [id, passedProduct, user?.name]);


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
        navigate("/login");
        return;
      }
      // Use product._id from state, not just hook id, to be safe
      const targetId = product?._id || id;
      if (!targetId) return;

      const response = await submitReview(targetId, token, rating, comment);
      if (response) {
        alert("Đánh giá của bạn đã được gửi thành công!");
        // Refresh reviews
        const reviewsData: IReview[] = await getProductReviews(targetId);
        setReviews(reviewsData);
        setHasReviewed(true);
      }
    } catch (err) {
      console.error("Lỗi khi gửi đánh giá:", err);
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

  const handleBuyNow = () => {
    if (!token) {
      alert("Vui lòng đăng nhập để mua hàng.");
      navigate("/login");
      return;
    }

    if (product) {
      const productToSend = {
        ...product,
        image: product.image?.startsWith("http://localhost:5000")
          ? product.image.replace("http://localhost:5000", "")
          : product.image,
      };

      navigate("/create", {
        state: { product: productToSend },
      });
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
             <h2 className="text-2xl font-bold text-gray-800">Đã có lỗi xảy ra</h2>
            <p className="text-red-500 mt-2">{error}</p>
            <button onClick={() => navigate(-1)} className="mt-4 text-indigo-600 hover:underline">Quay lại</button>
        </div>
      </div>
    );
    
  const categoryName = categories.find(
    (category) => category._id === product?.category
  )?.name;

  return (
    <div className="bg-gray-50 min-h-screen pb-12 font-sans">
        {/* Breadcrumb / Back */}
        <div className="container mx-auto px-4 py-4 max-w-7xl">
            <button 
                onClick={() => navigate(-1)} 
                className="flex items-center text-gray-500 hover:text-indigo-600 transition"
            >
                <ArrowLeft size={18} className="mr-1"/> Quay lại
            </button>
        </div>

      <div className="container mx-auto px-4 max-w-7xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex flex-col md:flex-row">
                {/* Product Image Section */}
                <div className="md:w-1/2 p-6 md:p-8 bg-gray-50 flex items-center justify-center">
                    <img
                        src={product?.image}
                        alt={product?.name}
                        className="w-full max-w-md object-contain rounded-xl shadow-md mix-blend-multiply hover:scale-105 transition duration-500 ease-in-out"
                    />
                </div>

                {/* Product Info Section */}
                <div className="md:w-1/2 p-6 md:p-10 flex flex-col">
                     {/* Category & Status */}
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-semibold tracking-wider text-indigo-500 uppercase">{categoryName || "Sản phẩm"}</span>
                        <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold ${product?.countInStock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {product?.countInStock ? <CheckCircle size={14}/> : null}
                            <span>{product?.countInStock ? "Còn hàng" : "Hết hàng"}</span>
                        </div>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
                        {product?.name}
                    </h1>

                    {/* Rating */}
                    <div className="flex items-center space-x-2 mb-6">
                        <div className="flex text-yellow-400">
                             {[...Array(5)].map((_, i) => (
                                <Star key={i} size={18} fill={(product?.rating || 0) >= i + 1 ? "currentColor" : "none"} stroke="currentColor" className={i < Math.round(product?.rating || 0) ? "text-yellow-400" : "text-gray-300"} />
                             ))}
                        </div>
                        <span className="text-sm text-gray-500 font-medium">({product?.numReviews || 0} đánh giá)</span>
                    </div>

                    {/* Price */}
                     <div className="flex items-end space-x-4 mb-6">
                        <span className="text-4xl font-bold text-indigo-600">
                            {product?.price.toLocaleString()}đ
                        </span>
                        {/* Example original price if we had it */}
                        {/* <span className="text-lg text-gray-400 line-through mb-1">25.000.000đ</span> */}
                    </div>

                    <p className="text-gray-600 text-base leading-relaxed mb-8">
                       {product?.description}
                    </p>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 mt-auto">
                        <div className="flex-1">
                             <AddToCartButton product={product!} className="w-full" />
                        </div>
                        <button
                            onClick={handleBuyNow}
                            className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition duration-300 font-bold shadow-lg shadow-indigo-200"
                        >
                            Mua ngay
                        </button>
                    </div>

                     {/* Policy Features */}
                     <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-gray-100">
                        <div className="flex items-center space-x-3 text-sm text-gray-600">
                            <Truck className="text-indigo-500" size={20}/>
                            <span>Giao hàng toàn quốc</span>
                        </div>
                         <div className="flex items-center space-x-3 text-sm text-gray-600">
                            <ShieldCheck className="text-indigo-500" size={20}/>
                            <span>Bảo hành chính hãng</span>
                        </div>
                     </div>
                </div>
            </div>
        </div>

        {/* Specifications Section */}
        {product?.specifications && product.specifications.length > 0 && (
             <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Thông số kỹ thuật</h2>
                <div className="grid md:grid-cols-2 gap-x-12 gap-y-4">
                     {product.specifications.map((spec, index) => (
                        <div key={index} className="flex justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition px-2 rounded-lg">
                             <span className="text-gray-500 font-medium">{spec.key}</span>
                             <span className="text-gray-900 font-semibold text-right">
                                 {spec.value} {spec.unit && <span className="text-gray-400 text-sm ml-1">{spec.unit}</span>}
                             </span>
                        </div>
                     ))}
                </div>
             </div>
        )}

        {/* Reviews Section */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
             <div className="flex justify-between items-center mb-8">
                <div>
                     <h2 className="text-2xl font-bold text-gray-900">Đánh giá & Nhận xét</h2>
                     <p className="text-gray-500 text-sm mt-1">Đánh giá từ những người đã mua sản phẩm này</p>
                </div>
                <div className="text-right">
                    <span className="text-3xl font-bold text-indigo-600">{product?.rating?.toFixed(1) || 0}</span>
                     <span className="text-gray-400 text-sm"> / 5</span>
                     <div className="flex text-yellow-400 text-sm">
                         {[...Array(5)].map((_, i) => (
                                <Star key={i} size={14} fill={(product?.rating || 0) >= i + 1 ? "currentColor" : "none"} stroke="currentColor" />
                         ))}
                     </div>
                </div>
             </div>
            
            <div className="grid md:grid-cols-3 gap-8">
                {/* Review List */}
                 <div className="md:col-span-2 space-y-6">
                    {reviews.length === 0 ? (
                        <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <p className="text-gray-500">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
                        </div>
                    ) : (
                        reviews.map((review, index) => (
                        <div key={index} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                         {review.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                         <p className="font-bold text-gray-900">{review.name}</p>
                                          <p className="text-xs text-gray-400">
                                            {new Date(review.createdAt).toLocaleDateString("vi-VN", {
                                                year: "numeric", month: "long", day: "numeric"
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex text-yellow-400 bg-yellow-50 px-2 py-1 rounded-lg">
                                    {[...Array(5)].map((_, i) => (
                                       <Star key={i} size={14} fill={review.rating >= i + 1 ? "currentColor" : "none"} stroke={review.rating >= i + 1 ? "none" : "currentColor"} className={review.rating >= i + 1 ? "" : "text-gray-300"}/>
                                    ))}
                                </div>
                            </div>
                            <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                        </div>
                        ))
                    )}
                 </div>

                 {/* Write Review */}
                 <div className="md:col-span-1">
                    <div className="bg-gray-50 p-6 rounded-2xl sticky top-24 border border-gray-100">
                         <h3 className="text-lg font-bold text-gray-900 mb-4">Viết đánh giá</h3>
                         
                         <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Đánh giá của bạn</label>
                            <div className="flex space-x-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setRating(star)}
                                        className={`p-1 transition ${star <= rating ? "text-yellow-400 transform scale-110" : "text-gray-300 hover:text-yellow-200"}`}
                                    >
                                         <Star size={24} fill={star <= rating ? "currentColor" : "none"} />
                                    </button>
                                ))}
                            </div>
                         </div>

                         <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Nhận xét</label>
                             <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Chia sẻ cảm nghĩ của bạn về sản phẩm..."
                                rows={4}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white"
                            />
                         </div>

                         <button
                            onClick={handleReviewSubmit}
                            disabled={hasReviewed}
                            className={`w-full py-3 rounded-xl font-bold shadow-lg transition transform active:scale-95 ${
                                hasReviewed
                                ? "bg-gray-200 text-gray-500 cursor-not-allowed shadow-none"
                                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200"
                            }`}
                        >
                            {hasReviewed ? "Đã đánh giá" : "Gửi đánh giá"}
                         </button>
                    </div>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
