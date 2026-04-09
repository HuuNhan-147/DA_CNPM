import React, { useState } from "react";
import useLogin from "../hooks/UserLogin";
import bgImage from "../assets/backgroundLogin.jpg";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const { handleLogin, error, loading } = useLogin();

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="bg-white bg-opacity-95 p-12 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-extrabold text-gray-800 mb-2">
            Chào mừng trở lại
          </h2>
          <p className="text-xl text-gray-600">Đăng nhập để tiếp tục</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-red-600 text-xl text-center font-medium">
              {error}
            </p>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin(email, password);
          }}
          className="space-y-6"
        >
          <div>
            <label
              htmlFor="email"
              className="block text-xl font-medium text-gray-700 mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="text"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 border-2 border-gray-200 rounded-xl text-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xl font-medium text-gray-700 mb-2"
            >
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 border-2 border-gray-200 rounded-xl text-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-6 w-6 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="remember-me"
                className="ml-3 block text-xl text-gray-700"
              >
                Ghi nhớ tôi
              </label>
            </div>

            <div className="text-xl">
              <a
                href="/forgot-password"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Quên mật khẩu?
              </a>
            </div>
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
              "Đăng nhập"
            )}
          </button>

          <div className="text-center pt-6 border-t border-gray-200">
            <p className="text-xl text-gray-600">
              Chưa có tài khoản?{" "}
              <a
                href="/register"
                className="font-semibold text-blue-600 hover:text-blue-500"
              >
                Tạo tài khoản mới
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
