import React, { useState } from "react";
import { updatePassword } from "../api/UserApi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // 🔥 Thêm dòng này
import bgImage from "../assets/backgroundLogin.jpg";
import { jwtDecode } from "jwt-decode";
const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { getToken } = useAuth(); // 🔥 Lấy token từ context

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const token = getToken();
    if (!token) {
      setError("Bạn chưa đăng nhập!");
      setLoading(false);
      return;
    }

    try {
      await updatePassword(currentPassword, newPassword, token);
      setMessage("Mật khẩu đã được cập nhật thành công!");

      // 👉 Decode token để kiểm tra role
      const decoded: any = jwtDecode(token);
      const isAdmin = decoded?.isAdmin === true;

      // ⏳ Chờ rồi chuyển hướng
      setTimeout(() => {
        navigate(isAdmin ? "/admin" : "/");
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="bg-white bg-opacity-95 p-12 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-extrabold text-gray-800 mb-2">
            Đổi mật khẩu
          </h2>
          <p className="text-xl text-gray-600">
            Nhập mật khẩu hiện tại và mật khẩu mới
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-red-600 text-xl text-center font-medium">
              {error}
            </p>
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-green-600 text-xl text-center font-medium">
              {message}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-xl font-medium text-gray-700 mb-2"
            >
              Mật khẩu hiện tại
            </label>
            <input
              id="currentPassword"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full p-4 border-2 border-gray-200 rounded-xl text-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="Nhập mật khẩu hiện tại"
            />
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="block text-xl font-medium text-gray-700 mb-2"
            >
              Mật khẩu mới
            </label>
            <input
              id="newPassword"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-4 border-2 border-gray-200 rounded-xl text-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="Nhập mật khẩu mới"
            />
          </div>

          <button
            type="submit"
            className={`w-full py-4 px-6 rounded-xl text-2xl font-semibold text-white ${
              loading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
            } transition-colors duration-300 shadow-md`}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-6 w-6 text-white"
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
                Đang xử lý...
              </span>
            ) : (
              "Cập nhật mật khẩu"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
