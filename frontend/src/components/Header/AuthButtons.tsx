import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, LogOut, ShieldCheck } from "lucide-react";
import UserProfile from "./UserProfile";
import LoginPrompt from "./LoginPrompt";
import { User as UserType } from "../../types/User";

interface AuthButtonsProps {
  user: UserType | null;
  token: string | null;
  onAutoLogout: (message: string) => void;
}

const AuthButtons: React.FC<AuthButtonsProps> = ({
  user,
  token,
  onAutoLogout,
}) => {
  const [showProfile, setShowProfile] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const navigate = useNavigate();
  const [updatedUser, setUpdatedUser] = useState<UserType | null>(user);
  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất không?")) {
      onAutoLogout("Bạn đã đăng xuất thành công!");
    }
  };

  const handleToggleProfile = () => {
    setShowProfile(!showProfile);
  };
useEffect(() => {
  setUpdatedUser(user);
}, [user]);
  useEffect(() => {
    if (user) return;

    const interval = setInterval(() => {
      setShowLoginPrompt(true);
      setTimeout(() => setShowLoginPrompt(false), 3000);
    }, 10000);

    return () => clearInterval(interval);
  }, [user]);

  if (user) {
    return (
      <div className="flex items-center space-x-4 relative">
        <button
          onClick={handleToggleProfile}
          className="text-lg text-white hover:text-gray-200 font-medium transition flex items-center"
        >
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white mr-2">
            {updatedUser?.name?.charAt(0).toUpperCase()}
          </div>
          {updatedUser?.name}
        </button>

        {user.isAdmin && (
          <Link
            to="/admin"
            className="flex items-center text-lg text-yellow-400 hover:text-yellow-600 font-medium transition"
          >
            <ShieldCheck className="h-5 w-5 mr-2" />
            Admin
          </Link>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center text-lg text-red-400 hover:text-red-600 transition"
          title="Đăng xuất"
        >
          <LogOut className="h-5 w-5" />
        </button>

        <UserProfile
          token={token}
          showProfile={showProfile}
          onToggleProfile={handleToggleProfile}
          onAutoLogout={onAutoLogout}
          onUpdateUser={(newUser) => setUpdatedUser(newUser)} // ← truyền hàm cập nhật
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <Link
        to="/login"
        className="flex items-center text-lg text-white hover:text-gray-200 font-medium transition"
      >
        <User className="h-7 w-7 mr-2" />
        Đăng nhập
      </Link>
      <LoginPrompt
        show={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
      />
    </div>
  );
};

export default AuthButtons;
