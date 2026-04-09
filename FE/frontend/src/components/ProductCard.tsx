import React, { useEffect, useState } from "react";
import { IProduct } from "../types/product";
import { AddToCartButton } from "./AddToCartButton";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProductCardProps {
  product: IProduct;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [loading, setLoading] = useState(true);
  const [shippingPrice, setShippingPrice] = useState(0);
  const { getToken } = useAuth();
  const navigate = useNavigate();

  /* ================= IMAGE ================= */

  // 👉 CHUẨN: nếu là Cloudinary (http/https) thì dùng trực tiếp
  const imageUrl = product.image
    ? product.image.startsWith("http")
      ? product.image
      : `http://localhost:5000${product.image}`
    : "/images/no-image.png";

  console.log("🖼️ Image URL render:", imageUrl);

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement>
  ) => {
    const target = e.target as HTMLImageElement;
    target.src = "/images/no-image.png";
    target.alt = "Ảnh sản phẩm không khả dụng";
    setLoading(false);
  };

  const handleImageLoad = () => {
    setLoading(false);
  };

  /* ================= ACTIONS ================= */

  const handleBuyNow = () => {
    const token = getToken();

    if (!token) {
      navigate("/login");
      return;
    }

    navigate("/create", {
      state: {
        product,
        shippingPrice,
      },
    });
  };

  const handleImageClick = () => {
    // 👉 KHÔNG cần xử lý URL ảnh nữa
    navigate(`/products/${product._id}`, {
      state: { product },
    });
  };

  /* ================= SHIPPING ================= */

  useEffect(() => {
    const shipping = product.price * 0.05;
    setShippingPrice(shipping);
  }, [product]);

  /* ================= UI ================= */

  const renderStars = () =>
    [...Array(5)].map((_, i) => (
      <svg
        key={i}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={i < product.rating ? "yellow" : "gray"}
        className="w-5 h-5"
      >
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
      </svg>
    ));

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition duration-300 relative p-4">
      {/* IMAGE */}
      <div className="relative aspect-square mb-4">
        {loading && (
          <div className="absolute inset-0 flex justify-center items-center bg-gray-200">
            <span>Đang tải ảnh...</span>
          </div>
        )}
        <img
          className="w-full h-full object-cover rounded-lg cursor-pointer"
          src={imageUrl}
          alt={product.name}
          onError={handleImageError}
          onLoad={handleImageLoad}
          loading="lazy"
          onClick={handleImageClick}
        />
        {product.rating === 5 && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full">
            HOT
          </span>
        )}
      </div>

      {/* INFO */}
      <div className="p-2">
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
          {product.name}
        </h3>

        <p className="text-sm text-gray-600 mb-3 line-clamp-3">
          {product.description}
        </p>

        <div className="flex justify-between items-center">
          <span className="text-xl font-bold text-red-600">
            {product.price.toLocaleString()} VND
          </span>
          <span className="flex items-center">{renderStars()}</span>
        </div>

        <div className="mt-3 flex justify-between items-center">
          <span className="text-sm text-gray-500">
            Còn {product.countInStock} sản phẩm
          </span>
          <div className="flex space-x-2">
            <AddToCartButton
              product={product}
              className="text-sm py-1 px-3"
            />
            <button
              className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600 transition"
              onClick={handleBuyNow}
              disabled={product.countInStock <= 0}
            >
              Mua ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
