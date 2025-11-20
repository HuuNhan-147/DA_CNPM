import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getCart } from "../api/CartApi";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import MainNav from "../components/Header/MainNav";
import ContactInfo from "../components/Header/ContactInfo";
import CartButton from "../components/Header/CartButton";
import OrdersButton from "../components/Header/OrdersButton";
import AuthButtons from "../components/Header/AuthButtons";

const Header = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [cartItemCount, setCartItemCount] = useState(0);
  const [tokenExpired, setTokenExpired] = useState(false);

  // Hàm kiểm tra token hết hạn
  const checkTokenExpiration = (token: string) => {
    try {
      const decodedToken: any = jwtDecode(token);
      const currentTime = Date.now() / 1000;

      if (decodedToken.exp < currentTime) {
        handleAutoLogout("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Lỗi khi giải mã token:", error);
      return true;
    }
  };

  // Hàm xử lý đăng xuất tự động
  const handleAutoLogout = (message: string) => {
    logout();
    setTokenExpired(true);
    alert(message);
    navigate("/login");
  };

  // Interceptor axios để xử lý token hết hạn
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          handleAutoLogout(
            "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
          );
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [logout, navigate]);

  // Kiểm tra token định kỳ
  useEffect(() => {
    if (!user) return;

    const checkToken = () => {
      const token = localStorage.getItem("token");
      if (!token) {
        handleAutoLogout(
          "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại."
        );
        return;
      }

      checkTokenExpiration(token);
    };

    checkToken();
    const interval = setInterval(checkToken, 60000);
    return () => clearInterval(interval);
  }, [user, logout, navigate]);

  const fetchCartItemCount = async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        handleAutoLogout(
          "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại."
        );
        return;
      }

      if (checkTokenExpiration(token)) return;

      const cartData = await getCart(token);
      const count = cartData.cart.cartItems.reduce(
        (total: number, item: { quantity: number }) => total + item.quantity,
        0
      );

      setCartItemCount(count);
    } catch (error) {
      console.error("Lỗi khi lấy giỏ hàng:", error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        handleAutoLogout("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }
    }
  };

  useEffect(() => {
    if (user) {
      fetchCartItemCount();
    } else {
      setCartItemCount(0);
    }
  }, [user]);

  const handleViewProducts = () => {
    navigate("/products");
  };

  return (
    <header className="bg-gradient-to-r from-gray-800 to-gray-900 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="text-3xl font-bold text-white">
          <Link to="/">E-ComMate-Store</Link>
        </div>

        <MainNav onViewProducts={handleViewProducts} />

        <ContactInfo />

        <div className="flex items-center space-x-6">
          <OrdersButton />
          {token && <CartButton token={token} />}
          <AuthButtons
            user={user}
            token={token}
            onAutoLogout={handleAutoLogout}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
