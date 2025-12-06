import React from "react";
import { Minus, Plus, Trash2 } from "lucide-react";

interface CartItemProps {
  item: {
    product: {
      _id: string;
      name: string;
      price: number;
      image: string;
      countInStock: number;
    };
    quantity: number;
  };
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
}

const CartItem: React.FC<CartItemProps> = ({
  item,
  onUpdateQuantity,
  onRemoveItem,
}) => {
  console.log("Stock:", item.product.countInStock, "Quantity:", item.quantity);
  console.log("Product data in CartItem:", item.product); // <-- Dán ở đây
  return (
    <div className="grid grid-cols-12 p-4 border-b border-gray-200 items-center">
      <div className="col-span-12 md:col-span-5 flex items-center">
        <img
          src={`https://da-cnpm-backend.onrender.com${item.product.image}`}
          alt={item.product.name}
          className="w-20 h-20 object-contain rounded mr-4"
        />
        <div>
          <h3 className="font-medium text-gray-900">{item.product.name}</h3>
          <button
            onClick={() => onRemoveItem(item.product._id)} // Gọi hàm xóa sản phẩm
            className="text-red-600"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="col-span-4 md:col-span-2 mt-4 md:mt-0 text-gray-900 md:text-center">
        {item.product.price.toLocaleString()}₫
      </div>

      <div className="col-span-4 md:col-span-3 mt-4 md:mt-0">
        <div className="flex items-center justify-center">
          <button
            onClick={() =>
              onUpdateQuantity(item.product._id, item.quantity - 1)
            }
            disabled={item.quantity <= 1}
            className={`p-2 rounded-l border ${
              item.quantity <= 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Minus className="h-4 w-4" />
          </button>

          <span className="px-4 py-2 border-t border-b bg-white text-center w-12">
            {item.quantity}
          </span>

          <button
            onClick={() =>
              onUpdateQuantity(item.product._id, item.quantity + 1)
            }
            disabled={item.quantity >= item.product.countInStock}
            className={`p-2 rounded-r border ${
              item.quantity >= item.product.countInStock
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {item.quantity >= item.product.countInStock && (
          <p className="text-xs text-red-600 mt-1 text-center">
            Đã đạt số lượng tối đa
          </p>
        )}
      </div>

      <div className="col-span-4 md:col-span-2 mt-4 md:mt-0 text-gray-900 font-medium md:text-center">
        {(item.product.price * item.quantity).toLocaleString()}₫
      </div>
    </div>
  );
};

export default CartItem;
