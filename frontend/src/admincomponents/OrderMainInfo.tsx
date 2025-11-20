import React from "react";
import { FiPackage, FiCreditCard, FiTruck } from "react-icons/fi";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "processing":
      return "bg-blue-100 text-blue-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    case "shipped":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const OrderMainInfo = ({ order }: { order: any }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Trạng thái đơn hàng */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center mb-3">
            <FiPackage className="text-blue-500 mr-2" />
            <h2 className="text-lg font-semibold">Trạng Thái Đơn Hàng</h2>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Ngày đặt:</span>
              <span>
                {format(new Date(order.createdAt), "HH:mm dd/MM/yyyy", {
                  locale: vi,
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Trạng thái:</span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  order.status
                )}`}
              >
                {order.status}
              </span>
            </div>
          </div>
        </div>

        {/* Thanh toán */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center mb-3">
            <FiCreditCard className="text-green-500 mr-2" />
            <h2 className="text-lg font-semibold">Thanh Toán</h2>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Phương thức:</span>
              <span>{order.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tình trạng:</span>
              <span
                className={
                  order.isPaid
                    ? "text-green-600 font-medium"
                    : "text-yellow-600 font-medium"
                }
              >
                {order.isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
              </span>
            </div>
          </div>
        </div>

        {/* Vận chuyển */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center mb-3">
            <FiTruck className="text-purple-500 mr-2" />
            <h2 className="text-lg font-semibold">Vận Chuyển</h2>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Tình trạng:</span>
              <span
                className={
                  order.isDelivered
                    ? "text-green-600 font-medium"
                    : "text-yellow-600 font-medium"
                }
              >
                {order.isDelivered ? "Đã giao hàng" : "Đang xử lý"}
              </span>
            </div>
            {order.deliveredAt && (
              <div className="flex justify-between">
                <span className="text-gray-600">Ngày giao:</span>
                <span>
                  {format(new Date(order.deliveredAt), "HH:mm dd/MM/yyyy", {
                    locale: vi,
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Danh sách sản phẩm */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Sản Phẩm</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sản phẩm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Đơn giá
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số lượng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thành tiền
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {order.orderItems.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        className="h-10 w-10 rounded"
                        src={
                          item.image?.startsWith("http")
                            ? item.image
                            : `http://localhost:5000${item.image}`
                        }
                        alt={item.name}
                      />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {item.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.product}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.price.toLocaleString()}đ
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {(item.price * item.quantity).toLocaleString()}đ
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      
      {/* Tổng kết */}
      <div className="bg-gray-50 p-4 rounded-lg">
        {(() => {
          const subTotal = order.orderItems.reduce(
            (sum: number, item: any) => sum + item.price * item.quantity,
            0
          );
          const tax = subTotal * 0.1;
          const shippingFee = 30000;
          const finalTotal = subTotal + tax + shippingFee;

          return (
            <>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Tạm tính:</span>
                <span>{subTotal.toLocaleString()}đ</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Thuế (10% VAT):</span>
                <span>{tax.toLocaleString()}đ</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Phí vận chuyển:</span>
                <span>{shippingFee.toLocaleString()}đ</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="font-semibold">Tổng cộng:</span>
                <span className="text-xl font-bold text-blue-600">
                  {finalTotal.toLocaleString()}đ
                </span>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
};

export default OrderMainInfo;
