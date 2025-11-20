import React, { useState } from "react";
import {
  User,
  LogOut,
  ShieldCheck,
  Edit,
  X,
  Home,
  Package,
  List,
  Users,
  ShoppingCart,
  Key,
  ChevronDown,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { updateUserProfile } from "../api/UserApi";

const Sidebar = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
  });
  const [tokenExpired, setTokenExpired] = useState(false);

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất không?")) {
      logout();
      alert("Bạn đã đăng xuất thành công!");
      navigate("/login");
    }
  };

  const handleToggleProfile = () => {
    setShowProfile(!showProfile);
    setIsEditing(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAutoLogout = (message: string) => {
    logout();
    setTokenExpired(true);
    alert(message);
    navigate("/login");
  };

  const handleSaveProfile = async () => {
    try {
      if (!token) {
        handleAutoLogout(
          "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại."
        );
        return;
      }

      const updatedUser = await updateUserProfile(profileData, token);
      alert("Cập nhật thông tin thành công!");
      setIsEditing(false);
    } catch (error) {
      console.error("Lỗi khi cập nhật thông tin người dùng:", error);
      alert("Cập nhật thông tin thất bại. Vui lòng thử lại sau.");
    }
  };

  const handleChangePassword = () => {
    navigate("/change-password");
    setShowProfile(false);
  };

  // Danh sách các mục điều hướng với icon tương ứng
  const navItems = [
    { path: "/admin", name: "Trang chủ", icon: <Home size={18} /> },
    {
      path: "/admin/products",
      name: "Quản lý sản phẩm",
      icon: <Package size={18} />,
    },
    {
      path: "/admin/categories",
      name: "Quản lý danh mục",
      icon: <List size={18} />,
    },
    {
      path: "/admin/users",
      name: "Quản lý người dùng",
      icon: <Users size={18} />,
    },
    {
      path: "/admin/orders",
      name: "Quản lý đơn hàng",
      icon: <ShoppingCart size={18} />,
    },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-gray-800 to-gray-900 shadow-sm z-50 flex flex-col">
      {/* Logo */}
      <div className="text-2xl font-bold text-white p-4 border-b border-gray-700">
        <Link to="/admin">NodeX-Store</Link>
      </div>

      {/* Menu chính với icon */}
      <nav className="flex-1 overflow-y-auto">
        <ul className="space-y-1 p-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className="flex items-center text-white hover:bg-gray-700 rounded-md p-3 transition"
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Tài khoản người dùng */}
      <div className="p-4 border-t border-gray-700">
        {user ? (
          <div className="relative">
            {/* Avatar & Tên */}
            <button
              onClick={handleToggleProfile}
              className="w-full flex items-center space-x-3 text-white hover:bg-gray-700 rounded-md p-3 transition"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <span className="truncate">{user.name}</span>
              {user.isAdmin && (
                <ShieldCheck className="h-4 w-4 text-yellow-400 ml-auto" />
              )}
            </button>

            {/* Thông tin cá nhân */}
            {showProfile && (
              <div className="absolute bottom-full left-0 mb-2 w-full bg-white rounded-lg shadow-xl overflow-hidden z-50 border border-gray-200">
                <div className="p-4 bg-gray-800 text-white flex justify-between items-center">
                  <h3 className="font-semibold text-lg">Thông tin tài khoản</h3>
                  <button
                    onClick={handleToggleProfile}
                    className="text-gray-300 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tên
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={profileData.name}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={user.email}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Điện thoại
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={profileData.phone}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="flex justify-end space-x-2 pt-2">
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                        >
                          Lưu thay đổi
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-semibold">{user.name}</h4>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <button
                          onClick={handleChangePassword}
                          className="w-full flex items-center justify-center px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition"
                        >
                          <Key className="h-4 w-4 mr-2" />
                          Đổi mật khẩu
                        </button>

                        <div className="flex justify-between pt-2">
                          <button
                            onClick={handleLogout}
                            className="flex items-center px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md transition"
                          >
                            <LogOut className="h-4 w-4 mr-1" />
                            Đăng xuất
                          </button>
                          <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center px-3 py-1 text-sm bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Cập nhật
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link
            to="/login"
            className="flex items-center text-white hover:bg-gray-700 rounded-md p-3 transition"
          >
            <User className="h-5 w-5 mr-3" />
            Đăng nhập
          </Link>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
