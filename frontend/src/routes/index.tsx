import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "../pages/HomePage";
import ProductList from "../components/FeaturedProducts";
import LoginPage from "../pages/LoginPage";
import AdminPage from "../pages/AdminPage";
import { AuthProvider } from "../context/AuthContext";
import Layout from "../components/Layout";
import CartPage from "../pages/CartPage";
import ListOrderPage from "../pages/ListOrderPage";
import PaymentResult from "../pages/PaymentPage";
import OrderPage from "../pages/OrderPage";
import Chatbot from "../components/chatbot";
import ProductDetail from "../components/ProductDetail";
import Register from "../pages/RegisterPage";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import AdminLayout from "../admincomponents/AdminLayout"; // Import AdminLayout
import AdminProductList from "../admincomponents/AdminProductList";
import AddProduct from "../admincomponents/AddProduct";
import UpdateProduct from "../admincomponents/GetDetail";
import GetDetail from "../admincomponents/GetDetail";
import ChangePassword from "../pages/ChangePassword";
import { CartProvider } from "../context/CartContext";
import CategoryManagement from "../admincomponents/CategoryManagement";
import AdminUserManagement from "../admincomponents/AdminUserManagement";
import AdminOrderManager from "../admincomponents/AdminOrderManager";
import OrderDetails from "../admincomponents/OrderDetails";
import SearchProduct from "../admincomponents/SearchProduct";
import AIAgentChat from "../components/AIAgentChat";

const AppRoutes = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Routes>
            {/* Routes cho trang người dùng */}
            <Route
              path="/*"
              element={
                <Layout>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/products/search" element={<ProductList />} />
                    <Route path="/products" element={<ProductList />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/orders" element={<ListOrderPage />} />
                    <Route path="/payment-result" element={<PaymentResult />} />
                    <Route path="/create" element={<OrderPage />} />
                    <Route path="/products/:id" element={<ProductDetail />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                      path="/forgot-password"
                      element={<ForgotPassword />}
                    />
                    <Route
                      path="/reset-password/:resetToken"
                      element={<ResetPassword />}
                    />
                    <Route
                      path="/change-password"
                      element={<ChangePassword />}
                    />
                  </Routes>
                  <AIAgentChat />
                </Layout>
              }
            />

            {/* Routes cho trang admin */}
            <Route
              path="/admin/*"
              element={
                <AdminLayout>
                  <Routes>
                    <Route path="/" element={<AdminPage />} />
                    <Route path="/products" element={<AdminProductList />} />
                    <Route path="/add-product" element={<AddProduct />} />
                    <Route path="/product/:id" element={<GetDetail />} />
                    <Route
                      path="/categories"
                      element={<CategoryManagement />}
                    />
                    <Route path="/users" element={<AdminUserManagement />} />
                    <Route path="/orders" element={<AdminOrderManager />} />
                    <Route path="/orders/:id" element={<OrderDetails />} />
                    <Route
                      path="/products/search"
                      element={<SearchProduct />}
                    />
                  </Routes>
                  <Chatbot />
                </AdminLayout>
              }
            />
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
};

export default AppRoutes;
