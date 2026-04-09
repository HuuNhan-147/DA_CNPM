import React from "react";
import { FiUser, FiHome } from "react-icons/fi";

const OrderCustomerInfo = ({ order }: { order: any }) => {
  const { user, shippingAddress } = order;
  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <FiUser className="text-blue-500 mr-2" />
          <h2 className="text-lg font-semibold">Khách Hàng</h2>
        </div>
        <div className="space-y-3">
          <div><p className="text-sm text-gray-500">Tên khách hàng</p><p className="font-medium">{user?.name}</p></div>
          <div><p className="text-sm text-gray-500">Email</p><p className="font-medium">{user?.email}</p></div>
          <div><p className="text-sm text-gray-500">Số điện thoại</p><p className="font-medium">{shippingAddress?.phone}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <FiHome className="text-green-500 mr-2" />
          <h2 className="text-lg font-semibold">Địa Chỉ Giao Hàng</h2>
        </div>
        <div className="space-y-3">
          <div><p className="text-sm text-gray-500">Họ tên</p><p className="font-medium">{shippingAddress?.fullname}</p></div>
          <div><p className="text-sm text-gray-500">Địa chỉ</p><p className="font-medium">{shippingAddress?.address}</p></div>
          <div><p className="text-sm text-gray-500">Thành phố</p><p className="font-medium">{shippingAddress?.city}</p></div>
          <div><p className="text-sm text-gray-500">Ghi chú</p><p className="font-medium italic">{shippingAddress?.note || "Không có ghi chú"}</p></div>
        </div>
      </div>
    </>
  );
};

export default OrderCustomerInfo;
