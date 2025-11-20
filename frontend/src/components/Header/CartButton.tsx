import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useCart } from "../../context/CartContext"; // Import context để sử dụng giỏ hàng

interface CartButtonProps {
  token: string; // Token cần truyền vào để xác thực
}

const CartButton: React.FC<CartButtonProps> = ({ token }) => {
  const { getCartItemCount } = useCart(); // Lấy hàm từ CartContext
  const [cartItemCount, setCartItemCount] = useState<number>(0); // State để lưu số lượng sản phẩm trong giỏ hàng

  // Gọi API lấy số lượng sản phẩm trong giỏ hàng khi component được render
  useEffect(() => {
    const count = getCartItemCount(); // Lấy số lượng sản phẩm từ CartContext mỗi khi token thay đổi
    setCartItemCount(count); // Cập nhật state cartItemCount
  }, [token, getCartItemCount]); // Mỗi lần token thay đổi, useEffect sẽ được gọi lại

  return (
    <div>
      <Link
        to="/cart"
        className="flex items-center text-lg text-white hover:text-gray-200 font-medium transition relative"
      >
        <ShoppingCart className="h-7 w-7 mr-2" />
        Giỏ hàng
        {cartItemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {cartItemCount > 9 ? "9+" : cartItemCount}
          </span>
        )}
      </Link>
    </div>
  );
};

export default CartButton;
