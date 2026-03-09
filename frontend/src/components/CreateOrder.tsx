import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IProduct } from "../types/product";
import { useAuth } from "../context/AuthContext";
import { createOrder } from "../api/OrderApi";
import { CheckCircle2 } from "lucide-react";

interface IShippingAddress {
  fullname: string;
  phone: string;
  address: string;
  city: string;
  country: string;
}

interface IOrderData {
  shippingAddress: IShippingAddress;
  paymentMethod: string;
}

const CreateOrderPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [orderData, setOrderData] = useState<IOrderData>({
    shippingAddress: {
      fullname: "",
      phone: "",
      address: "",
      city: "",
      country: "Vietnam",
    },
    paymentMethod: "VNPay",
  });

  const [products, setProducts] = useState<IProduct[]>([]);
  const [product, setProduct] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<boolean>(false);

 useEffect(() => {
  if (location.state?.products) {
    // ép kiểu products về IProduct[]
    const updatedProducts = (location.state.products as IProduct[]).map(
      (p: IProduct) => ({
        ...p,
        quantity: p.quantity || 1, // đảm bảo có quantity
      })
    );
    setProducts(updatedProducts);
  } else if (location.state?.product) {
    // ép kiểu product về IProduct
    const singleProduct: IProduct = {
      ...(location.state.product as IProduct),
      quantity: (location.state.product as IProduct).quantity || 1,
    };
    setProducts([singleProduct]); // luôn chuyển thành mảng
  } else {
    navigate("/products");
  }
}, [location, navigate]);
;
  const SHIPPING_FEE = 30000;
  const TAX_RATE = 0.1;

  const subtotal = products.reduce(
    (sum, prod) => sum + prod.price * prod.quantity,
    0
  );

  const tax = subtotal * TAX_RATE;
  const total = subtotal + SHIPPING_FEE + tax;
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setOrderData((prev) => ({
      ...prev,
      shippingAddress: {
        ...prev.shippingAddress,
        [name]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOrderSuccess(false);

    const token = getToken();
    if (!token) {
      setError("Vui lòng đăng nhập để tiếp tục");
      setLoading(false);
      return;
    }

    if (products.length === 0 && !product) {
      setError("Không có sản phẩm nào!");
      setLoading(false);
      return;
    }

    try {
      const orderPayload = {
        orderItems: products.length
          ? products.map((prod) => ({
              name: prod.name,
              quantity: prod.quantity,
              image: prod.image,
              price: prod.price,
              product: prod._id,
            }))
          : [
              {
                name: product?.name || "",
                quantity: 1,
                image: product?.image || "",
                price: product?.price || 0,
                product: product?._id || "",
              },
            ],
        shippingAddress: orderData.shippingAddress,
        paymentMethod: orderData.paymentMethod,
      };

      await createOrder(token, orderPayload);
      setOrderSuccess(true);
    } catch (err: any) {
      console.error("Error creating order:", err);
      setError(err.message || "Đã xảy ra lỗi khi tạo đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-3">
            Đặt hàng thành công!
          </h1>
          <p className="text-gray-600 mb-6">
            Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ liên hệ với bạn để xác nhận đơn
            hàng.
          </p>
          <div className="flex flex-col space-y-3">
            <button
              onClick={() => navigate("/orders")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Xem đơn hàng
            </button>
            <button
              onClick={() => navigate("/products")}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Tiếp tục mua sắm
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Thanh toán</h1>
          <p className="mt-2 text-sm text-gray-600">
            Vui lòng điền thông tin giao hàng của bạn
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <p>{error}</p>
          </div>
        )}

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
            {/* Shipping Information */}
            <div className="px-6 py-5">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Thông tin giao hàng
              </h3>

              <div className="grid grid-cols-1 gap-y-4 gap-x-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="fullname"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    id="fullname"
                    name="fullname"
                    value={orderData.shippingAddress.fullname}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    value={orderData.shippingAddress.phone}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={orderData.shippingAddress.address}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="city"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Thành phố
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={orderData.shippingAddress.city}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="country"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Quốc gia
                  </label>
                  <input
                    type="text"
                    id="country"
                    value={orderData.shippingAddress.country}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 cursor-not-allowed"
                    disabled
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="px-6 py-5">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Phương thức thanh toán
              </h3>
              <div className="mt-1">
                <select
                  value={orderData.paymentMethod}
                  onChange={(e) =>
                    setOrderData((prev) => ({
                      ...prev,
                      paymentMethod: e.target.value,
                    }))
                  }
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="VNPay">VNPay (Chuyển khoản)</option>
                  <option value="COD">COD (Thanh toán khi nhận hàng)</option>
                </select>
              </div>
            </div>

            {/* Order Summary */}
            <div className="px-6 py-5 bg-gray-50">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Đơn hàng của bạn
              </h3>

              <div className="space-y-4">
                {product ? (
                  <div className="flex items-start py-3">
                    <div className="flex-shrink-0">
                      <img
                          src={
    product.image?.startsWith("http://") || product.image?.startsWith("https://")
      ? product.image
      : `http://localhost:5000${product.image}`
  }
                        alt={product.name}
                        className="w-16 h-16 rounded-md object-cover"
                      />
                    </div>
                    <div className="ml-4 flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {product.name}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {product.price.toLocaleString("vi-VN")} VND × 1
                      </p>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {product.price.toLocaleString("vi-VN")} VND
                    </div>
                  </div>
                ) : (
                  products.map((prod) => (
                    <div
                      key={prod._id}
                      className="flex items-start py-3 border-b border-gray-200"
                    >
                      <div className="flex-shrink-0">
                        <img
                          src={`http://localhost:5000${prod.image}`}
                          alt={prod.name}
                          className="w-16 h-16 rounded-md object-cover"
                        />
                      </div>
                      <div className="ml-4 flex-1">
                        <h4 className="text-sm font-medium text-gray-900">
                          {prod.name}
                        </h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {prod.price.toLocaleString("vi-VN")} VND ×{" "}
                          {prod.quantity}
                        </p>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {(prod.price * prod.quantity).toLocaleString("vi-VN")}{" "}
                        VND
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            {/* Total */}
            <div className="mt-6 border-t border-gray-200 pt-4">
              {/* Tổng cộng */}
              <div className="flex justify-between text-base font-medium text-gray-900">
                <p>Tổng cộng</p>
                <p>{subtotal.toLocaleString("vi-VN")} VND</p>
              </div>

              {/* Phí vận chuyển */}
              <div className="flex justify-between text-base font-medium text-gray-900 mt-2">
                <p>Phí vận chuyển</p>
                <p>{SHIPPING_FEE.toLocaleString("vi-VN")} VND</p>
              </div>

              {/* Thuế */}
              <div className="flex justify-between text-base font-medium text-gray-900 mt-2">
                <p>Thuế 10%</p>
                <p>{tax.toLocaleString("vi-VN")} VND</p>
              </div>

              {/* Tổng tiền sau thuế và phí */}
              <div className="flex justify-between text-lg font-bold text-gray-900 mt-4">
                <p>Tổng tiền (Sau thuế và phí ship)</p>
                <p>{total.toLocaleString("vi-VN")} VND</p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="px-6 py-4 bg-gray-50 text-right">
              <button
                type="submit"
                disabled={loading}
                className={`w-full md:w-auto inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  loading ? "opacity-75 cursor-not-allowed" : ""
                }`}
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  </>
                ) : (
                  "Đặt hàng ngay"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateOrderPage;
