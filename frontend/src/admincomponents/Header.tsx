import React, { useState } from "react";
import {
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
  ChevronRight,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { updateUserProfile } from "../api/UserApi";

const Sidebar = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfile, setShowProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
  });

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất không?")) {
      logout();
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

  const handleSaveProfile = async () => {
    try {
      if (!token) return;
      await updateUserProfile(profileData, token);
      alert("Cập nhật thông tin thành công!");
      setIsEditing(false);
    } catch (error) {
      console.error("Lỗi khi cập nhật thông tin người dùng:", error);
      alert("Cập nhật thông tin thất bại.");
    }
  };

  const navItems = [
    { path: "/admin", name: "Trang chủ", icon: <Home size={20} /> },
    { path: "/admin/products", name: "Sản phẩm", icon: <Package size={20} /> },
    { path: "/admin/categories", name: "Danh mục", icon: <List size={20} /> },
    { path: "/admin/users", name: "Người dùng", icon: <Users size={20} /> },
    { path: "/admin/orders", name: "Đơn hàng", icon: <ShoppingCart size={20} /> },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-[#111827] text-gray-300 flex flex-col shadow-2xl z-50 font-sans">
      {/* Branding */}
      <div className="h-16 flex items-center px-6 border-b border-gray-800 bg-[#0f1523]">
        <div className="flex items-center space-x-2 text-indigo-500">
           <div className="p-1.5 bg-indigo-500/10 rounded-lg">
             <ShieldCheck size={24} />
           </div>
           <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
             NodeX
           </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center px-3 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "hover:bg-gray-800 hover:text-white"
              }`}
            >
              <span className={`transition-colors ${isActive ? "text-white" : "text-gray-400 group-hover:text-indigo-400"}`}>
                {item.icon}
              </span>
              <span className="ml-3 font-medium text-sm">{item.name}</span>
              {isActive && <ChevronRight size={16} className="ml-auto opacity-70" />}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-800 bg-[#0f1523]">
        {user ? (
          <div className="relative">
            <button
              onClick={handleToggleProfile}
              className="w-full flex items-center p-2 rounded-lg hover:bg-gray-800 transition-colors group"
            >
              <div className="h-10 w-10 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-lg border border-indigo-600/30">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3 text-left overflow-hidden">
                <p className="text-sm font-semibold text-white truncate group-hover:text-indigo-400 transition-colors">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </button>

            {/* Profile Popover */}
            {showProfile && (
              <div className="absolute bottom-full left-0 mb-3 w-72 bg-white rounded-2xl shadow-2xl overflow-hidden z-50 border border-gray-100 ring-1 ring-black/5 animate-in slide-in-from-bottom-2 fade-in duration-200">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{user.name}</h3>
                    <p className="text-xs text-indigo-100 opacity-90">{user.email}</p>
                  </div>
                  <button onClick={() => setShowProfile(false)} className="text-white/70 hover:text-white transition">
                    <X size={18} />
                  </button>
                </div>

                <div className="p-4 bg-white text-gray-800">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tên hiển thị</label>
                        <input
                          type="text"
                          name="name"
                          value={profileData.name}
                          onChange={handleInputChange}
                          className="mt-1 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Số điện thoại</label>
                        <input
                          type="tel"
                          name="phone"
                          value={profileData.phone}
                          onChange={handleInputChange}
                          className="mt-1 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => setIsEditing(false)}
                          className="flex-1 px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          className="flex-1 px-3 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition shadow-sm"
                        >
                          Lưu
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <button
                        onClick={() => navigate("/change-password")}
                        className="w-full flex items-center px-3 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition"
                      >
                        <Key size={16} className="mr-3" />
                        Đổi mật khẩu
                      </button>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="w-full flex items-center px-3 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition"
                      >
                        <Edit size={16} className="mr-3" />
                        Cập nhật thông tin
                      </button>
                      <div className="h-px bg-gray-100 my-2"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <LogOut size={16} className="mr-3" />
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link
            to="/login"
            className="flex items-center justify-center w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition font-medium"
          >
            Đăng nhập
          </Link>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
