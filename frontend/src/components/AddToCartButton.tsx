import React, { useState } from "react";
import { IProduct } from "../types/product";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { ShoppingCart, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AddToCartButtonProps {
  product: IProduct;
  onAddToCart?: () => void;
  className?: string;
}

export const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  product,
  onAddToCart,
  className = "",
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { getToken } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const handleAddToCart = async () => {
    const token = getToken();
    if (!token) {
      toast.warning("Vui lòng đăng nhập để thêm vào giỏ hàng!", {
        position: "top-right",
        autoClose: 2000,
      });
      navigate("/login");
      return;
    }

    if (product.countInStock <= 0) return;

    setIsLoading(true);
    setIsSuccess(false);

    try {
      await addToCart(product._id, 1);

      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 2000);

      toast.success("Đã thêm vào giỏ hàng!", {
        position: "top-right",
        autoClose: 2000,
      });

      if (onAddToCart) onAddToCart();
    } catch (error) {
      console.error("Lỗi khi thêm vào giỏ hàng:", error);
      toast.error("Thêm vào giỏ hàng thất bại!", {
        position: "top-right",
        autoClose: 2000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={product.countInStock <= 0 || isLoading || isSuccess}
      className={`${className} ${
        product.countInStock <= 0
          ? "bg-gray-400 cursor-not-allowed"
          : isSuccess
          ? "bg-green-500"
          : "bg-blue-600 hover:bg-blue-700"
      } text-white px-4 py-2 rounded-md transition-all duration-300 flex items-center justify-center relative overflow-hidden`}
    >
      {isSuccess && (
        <div className="absolute inset-0 bg-green-500 animate-ping opacity-30"></div>
      )}

      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Đang thêm...
        </>
      ) : isSuccess ? (
        <>
          <Check className="h-5 w-5 mr-2 animate-bounce" />
          Đã thêm!
        </>
      ) : product.countInStock > 0 ? (
        <>
          <ShoppingCart className="h-5 w-5 mr-2" />
          Thêm vào giỏ
        </>
      ) : (
        "Hết hàng"
      )}
    </button>
  );
};
