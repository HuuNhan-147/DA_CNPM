import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Edit, X } from "lucide-react";
import { getUserProfile, updateUserProfile } from "../../api/UserApi";
import { User as UserType } from "../../types/User";

interface UserProfileProps {
  token: string | null;
  showProfile: boolean;
  onToggleProfile: () => void;
  onAutoLogout: (message: string) => void;
  onUpdateUser: (newUser: UserType) => void; // thêm vào đây
}

const UserProfile: React.FC<UserProfileProps> = ({
  token,
  showProfile,
  onToggleProfile,
  onAutoLogout,
  onUpdateUser,
}) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({ name: "", phone: "" });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        onAutoLogout("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
        return;
      }

      try {
        const userData = await getUserProfile(token);
        setUser(userData);
        setProfileData({
          name: userData.name || "",
          phone: userData.phone || "",
        });
      } catch (error) {
        console.error("Lỗi khi lấy thông tin người dùng:", error);
        onAutoLogout(
          "Không thể lấy thông tin người dùng. Vui lòng đăng nhập lại."
        );
      }
    };

    if (showProfile) {
      fetchUser();
    }
  }, [showProfile, token, onAutoLogout]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      if (!token) {
        onAutoLogout("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
        return;
      }

      await updateUserProfile(profileData, token);
      alert("Cập nhật thông tin thành công!");
      setIsEditing(false);
      // Làm mới lại dữ liệu sau khi cập nhật
      const updatedUser = await getUserProfile(token);
      setUser(updatedUser);
      onUpdateUser(updatedUser);
    } catch (error) {
      console.error("Lỗi khi cập nhật thông tin người dùng:", error);
      alert("Cập nhật thông tin thất bại. Vui lòng thử lại sau.");
    }
  };

  if (!showProfile || !user) return null;

  return (
    <div className="absolute right-0 top-12 bg-white rounded-lg shadow-xl overflow-hidden w-72 z-50 border border-gray-200">
      <div className="p-4 bg-gray-800 text-white flex justify-between items-center">
        <h3 className="font-semibold text-lg">Thông tin tài khoản</h3>
        <button
          onClick={onToggleProfile}
          className="text-gray-300 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-4">
        {isEditing ? (
          // === FORM EDIT ===
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsEditing(false)}
                className="text-sm text-gray-700 px-4 py-2 rounded-md hover:bg-gray-100"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveProfile}
                className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        ) : (
          // === THÔNG TIN NGƯỜI DÙNG ===
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

            <div className="border-t border-gray-200 pt-3 mt-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Điện thoại:</span>
                <span className="text-sm font-medium">
                  {user.phone || "Chưa cập nhật"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Vai trò:</span>
                <span className="text-sm font-medium">
                  {user.isAdmin ? "Quản trị viên" : "Người dùng"}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-3 mt-3">
              <button
                onClick={() => navigate("/change-password")}
                className="w-full flex items-center justify-center px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Đổi mật khẩu
              </button>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center px-3 py-1 text-sm bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100"
              >
                <Edit className="h-4 w-4 mr-1" />
                Cập nhật
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
