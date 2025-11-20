import React from "react";
import { Link } from "react-router-dom";

interface MainNavProps {
  onViewProducts: () => void;
}

const MainNav: React.FC<MainNavProps> = ({ onViewProducts }) => {
  return (
    <nav className="hidden md:flex space-x-8 relative">
      <ul className="flex space-x-8">
        <li>
          <Link
            to="/"
            className="text-lg text-white hover:text-gray-200 font-medium transition"
          >
            Trang chủ
          </Link>
        </li>
        <li>
          <button
            onClick={onViewProducts}
            className="text-lg text-white hover:text-gray-200 font-medium transition"
          >
            Sản phẩm
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default MainNav;
