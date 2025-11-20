import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api/UserApi";
import bgImage from "../assets/backgroundLogin.jpg";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await registerUser(
        formData.email,
        formData.password,
        formData.name,
        formData.phone
      );
      navigate("/login");
    } catch (error: any) {
      setError(error.message || "Đăng ký không thành công. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="bg-white bg-opacity-95 p-12 rounded-2xl shadow-xl w-full max-w-lg">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-extrabold text-gray-800 mb-2">
            Tạo tài khoản mới
          </h2>
          <p className="text-xl text-gray-600">Điền thông tin để bắt đầu</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-red-600 text-xl text-center font-medium">
              {error}
            </p>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-xl font-medium text-gray-700 mb-2"
            >
              Họ và tên
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full p-4 border-2 border-gray-200 rounded-xl text-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="Nhập họ và tên đầy đủ"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-xl font-medium text-gray-700 mb-2"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full p-4 border-2 border-gray-200 rounded-xl text-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="Nhập địa chỉ email"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-xl font-medium text-gray-700 mb-2"
            >
              Số điện thoại
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              value={formData.phone}
              onChange={handleChange}
              className="w-full p-4 border-2 border-gray-200 rounded-xl text-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="Nhập số điện thoại"
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
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full p-4 border-2 border-gray-200 rounded-xl text-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="Tạo mật khẩu mới"
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
              "Đăng ký ngay"
            )}
          </button>

          <div className="text-center pt-6 border-t border-gray-200">
            <p className="text-xl text-gray-600">
              Đã có tài khoản?{" "}
              <button
                onClick={() => navigate("/login")}
                className="font-semibold text-blue-600 hover:text-blue-500"
              >
                Đăng nhập tại đây
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
