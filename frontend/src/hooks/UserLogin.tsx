import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/UserApi";
import { useAuth } from "../context/AuthContext";

const UserLogin = () => {
  const [error, setError] = useState<string | null>(null); // Cập nhật để hỗ trợ string hoặc null
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (email, password) => {
    setError(null); // Reset lỗi trước khi thực hiện đăng nhập
    setLoading(true);

    try {
      // Gọi API loginUser và nhận dữ liệu trả về
      const data = await loginUser(email, password);

      // Kiểm tra nếu dữ liệu trả về hợp lệ
      if (data.accessToken && data.user) {
        // Lưu thông tin user và token vào Context
        login(data.user, data.accessToken);

        // Lưu token vào localStorage để sử dụng cho các request sau
        localStorage.setItem("token", data.accessToken);

        // Kiểm tra nếu là admin thì chuyển hướng sang trang Admin
        if (data.user.isAdmin) {
          navigate("/admin");
        } else {
          navigate("/"); // Nếu không phải admin, quay về trang chủ
        }
      } else {
        setError("Dữ liệu không hợp lệ");
      }
    } catch (err) {
      console.log("Error:", err); // In ra lỗi nếu có
      setError(err.message); // Xử lý lỗi nếu có
    } finally {
      setLoading(false); // Dừng trạng thái loading
    }
  };

  return { handleLogin, error, loading };
};

export default UserLogin;
