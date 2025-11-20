import React from "react";
import { Link } from "react-router-dom";

const OrdersButton: React.FC = () => {
  return (
    <Link
      to="/orders"
      className="flex items-center text-lg text-white hover:text-gray-200 font-medium transition"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-7 w-7 mr-2"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
      Đơn hàng
    </Link>
  );
};

export default OrdersButton;
