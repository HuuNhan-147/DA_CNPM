import React, { useState } from "react";
import { forgotPassword } from "../api/UserApi";
import { useNavigate } from "react-router-dom";
import bgImage from "../assets/backgroundLogin.jpg";

const ForgotPassword = () => {
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await forgotPassword(email);
      setMessage("Đã gửi email khôi phục mật khẩu. Vui lòng kiểm tra hộp thư.");
      setTimeout(() => navigate("/login"), 5000);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
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
            Quên mật khẩu
          </h2>
          <p className="text-xl text-gray-600">
            Nhập email để nhận liên kết đặt lại
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

        <form onSubmit={handleForgotPassword} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-xl font-medium text-gray-700 mb-2"
            >
              Email đăng nhập
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 border-2 border-gray-200 rounded-xl text-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="Nhập email của bạn"
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
              "Gửi yêu cầu"
            )}
          </button>

          <div className="text-center pt-6 border-t border-gray-200">
            <button
              onClick={() => navigate("/login")}
              className="text-xl font-semibold text-blue-600 hover:text-blue-500"
            >
              Quay lại trang đăng nhập
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
