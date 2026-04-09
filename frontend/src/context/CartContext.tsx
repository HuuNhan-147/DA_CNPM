import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import {
  getCart,
  addToCart as apiAddToCart,
  removeFromCart as apiRemoveFromCart,
  updateCartItem as apiUpdateCartItem,
} from "../api/CartApi";
import { useAuth } from "./AuthContext";

// Kiểu dữ liệu cho mỗi item trong giỏ hàng
export interface CartItem {
  productId: string;
  quantity: number;
}

// Định nghĩa kiểu dữ liệu cho Context
interface CartContextType {
  cartItems: CartItem[];
  addToCart: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  fetchCart: () => Promise<void>;
  getCartItemCount: () => number;
}

// Tạo Context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Custom hook sử dụng context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

// Provider
export const CartProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]); // Giá trị mặc định là mảng trống
  const { getToken } = useAuth(); // Lấy token từ AuthContext

  // Fetch giỏ hàng
  const fetchCart = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const data = await getCart(token);
      if (data?.cartItems) {
        setCartItems(data.cartItems); // Cập nhật giỏ hàng từ API
      }
    } catch (error) {
      console.error("Lỗi khi lấy giỏ hàng:", error);
    }
  };

  // Thêm sản phẩm vào giỏ hàng
  const addToCart = async (productId: string, quantity: number) => {
    const token = getToken();
    if (!token) return;

    try {
      await apiAddToCart(productId, quantity, token);
      // Cập nhật giỏ hàng sau khi thêm sản phẩm
      setCartItems((prevCartItems) => {
        const existingItem = prevCartItems.find(
          (item) => item.productId === productId
        );
        if (existingItem) {
          return prevCartItems.map((item) =>
            item.productId === productId
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          return [...prevCartItems, { productId, quantity }];
        }
      });
    } catch (error) {
      console.error("Lỗi khi thêm vào giỏ hàng:", error);
    }
  };

  // Xóa sản phẩm khỏi giỏ hàng
  const removeFromCart = async (productId: string) => {
    const token = getToken();
    if (!token) return;

    try {
      await apiRemoveFromCart(productId, token);
      // Cập nhật giỏ hàng sau khi xóa sản phẩm
      setCartItems((prevCartItems) =>
        prevCartItems.filter((item) => item.productId !== productId)
      );
    } catch (error) {
      console.error("Lỗi khi xóa khỏi giỏ hàng:", error);
    }
  };

  // Cập nhật số lượng sản phẩm trong giỏ hàng
  const updateQuantity = async (productId: string, quantity: number) => {
    const token = getToken();
    if (!token) return;

    try {
      await apiUpdateCartItem(productId, quantity, token);
      // Cập nhật giỏ hàng sau khi sửa số lượng
      setCartItems((prevCartItems) =>
        prevCartItems.map((item) =>
          item.productId === productId ? { ...item, quantity } : item
        )
      );
    } catch (error) {
      console.error("Lỗi khi cập nhật số lượng:", error);
    }
  };

  // Hàm lấy số lượng sản phẩm trong giỏ
  const getCartItemCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  // Dùng useEffect để fetch giỏ hàng khi component mount
  useEffect(() => {
    fetchCart();
  }, []); // Chỉ fetch giỏ hàng khi provider được mount

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        fetchCart,
        getCartItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
