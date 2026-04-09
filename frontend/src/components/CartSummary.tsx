import React from "react";
import { Link } from "react-router-dom";

interface CartSummaryProps {
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  totalPrice: number;
  onBuyNow: () => void;
}

const CartSummary: React.FC<CartSummaryProps> = ({
  itemsPrice,
  shippingPrice,
  taxPrice,
  totalPrice,
  onBuyNow,
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Tóm tắt đơn hàng
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Tạm tính:</span>
          <span className="text-gray-900">{itemsPrice.toLocaleString()}₫</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Phí vận chuyển:</span>
          <span className="text-gray-900">
            {shippingPrice.toLocaleString()}₫
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Thuế (10%):</span>
          <span className="text-gray-900">{taxPrice.toLocaleString()}₫</span>
        </div>
        <div className="border-t border-gray-200 pt-3 mt-3">
          <div className="flex justify-between font-medium text-lg">
            <span>Tổng cộng:</span>
            <span className="text-blue-600">
              {totalPrice.toLocaleString()}₫
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={onBuyNow}
        className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
      >
        Tạo đơn hàng
      </button>
    </div>
  );
};

export default CartSummary;
