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

// Kiểu dữ liệu cho mỗi item trong giỏ hàng (chứa chi tiết sản phẩm)
export interface CartItem {
  product: {
    _id: string;
    name: string;
    price: number;
    image: string;
    countInStock: number;
  };
  quantity: number;
}

// Định nghĩa kiểu dữ liệu cho Context
interface CartContextType {
  cartItems: CartItem[];
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  totalPrice: number;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  fetchCart: () => Promise<void>;
  getCartItemCount: () => number;
  clearCartState: () => void;
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
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [itemsPrice, setItemsPrice] = useState<number>(0);
  const [shippingPrice, setShippingPrice] = useState<number>(0);
  const [taxPrice, setTaxPrice] = useState<number>(0);
  const [totalPrice, setTotalPrice] = useState<number>(0);

  const { token } = useAuth(); // Theo dõi token thay đổi trực tiếp

  const updateLocalCartState = (data: any) => {
    if (data?.cart) {
      setCartItems(data.cart.cartItems || []);
      setItemsPrice(data.itemsPrice || 0);
      setShippingPrice(data.shippingPrice || 0);
      setTaxPrice(data.taxPrice || 0);
      setTotalPrice(data.totalPrice || 0);
    } else {
      clearCartState();
    }
  };

  const clearCartState = () => {
    setCartItems([]);
    setItemsPrice(0);
    setShippingPrice(0);
    setTaxPrice(0);
    setTotalPrice(0);
  };

  // Fetch giỏ hàng
  const fetchCart = async () => {
    if (!token) {
      clearCartState();
      return;
    }

    try {
      const data = await getCart();
      updateLocalCartState(data);
    } catch (error) {
      console.error("Lỗi khi lấy giỏ hàng:", error);
      clearCartState();
    }
  };

  // Thêm sản phẩm vào giỏ hàng
  const addToCart = async (productId: string, quantity: number) => {
    if (!token) return;

    try {
      const data = await apiAddToCart(productId, quantity);
      updateLocalCartState(data);
    } catch (error) {
      console.error("Lỗi khi thêm vào giỏ hàng:", error);
    }
  };

  // Xóa sản phẩm khỏi giỏ hàng
  const removeFromCart = async (productId: string) => {
    if (!token) return;

    try {
      const data = await apiRemoveFromCart(productId);
      updateLocalCartState(data);
    } catch (error) {
      console.error("Lỗi khi xóa khỏi giỏ hàng:", error);
    }
  };

  // Cập nhật số lượng sản phẩm trong giỏ hàng
  const updateQuantity = async (productId: string, quantity: number) => {
    if (!token) return;

    try {
      const data = await apiUpdateCartItem(productId, quantity);
      updateLocalCartState(data);
    } catch (error) {
      console.error("Lỗi khi cập nhật số lượng:", error);
    }
  };

  // Hàm lấy số lượng sản phẩm trong giỏ
  const getCartItemCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  // Tự động tải lại giỏ hàng khi token thay đổi (Đăng nhập / Đăng xuất)
  useEffect(() => {
    fetchCart();
  }, [token]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        itemsPrice,
        shippingPrice,
        taxPrice,
        totalPrice,
        addToCart,
        removeFromCart,
        updateQuantity,
        fetchCart,
        getCartItemCount,
        clearCartState,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
