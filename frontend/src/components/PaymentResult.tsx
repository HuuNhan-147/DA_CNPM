import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { updateOrderPaymentStatus } from "../api/OrderApi";
import { useAuth } from "../context/AuthContext";

const PaymentResult: React.FC = () => {
  const location = useLocation();
  const { token } = useAuth();
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const paymentData = {
      vnp_Amount: queryParams.get("vnp_Amount"),
      vnp_BankCode: queryParams.get("vnp_BankCode"),
      vnp_BankTranNo: queryParams.get("vnp_BankTranNo"),
      vnp_CardType: queryParams.get("vnp_CardType"),
      vnp_OrderInfo: queryParams.get("vnp_OrderInfo"),
      vnp_PayDate: queryParams.get("vnp_PayDate"),
      vnp_ResponseCode: queryParams.get("vnp_ResponseCode"),
      vnp_TransactionStatus: queryParams.get("vnp_TransactionStatus"),
      vnp_TxnRef: queryParams.get("vnp_TxnRef"),
    };

    setPaymentInfo(paymentData);
  }, [location]);

  useEffect(() => {
    const updatePaymentStatus = async () => {
      if (!paymentInfo || !token) return;

      const isSuccess =
        paymentInfo.vnp_ResponseCode === "00" &&
        paymentInfo.vnp_TransactionStatus === "00";

      if (isSuccess && paymentInfo.vnp_TxnRef) {
        try {
          setIsUpdating(true);
          setUpdateError(null);
          await updateOrderPaymentStatus(token, paymentInfo.vnp_TxnRef);
        } catch (error) {
          console.error("Lỗi khi cập nhật trạng thái thanh toán:", error);
          setUpdateError("Có lỗi xảy ra khi cập nhật trạng thái đơn hàng");
        } finally {
          setIsUpdating(false);
        }
      }
    };

    updatePaymentStatus();
  }, [paymentInfo, token]);

  if (!paymentInfo) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const {
    vnp_Amount,
    vnp_BankCode,
    vnp_BankTranNo,
    vnp_CardType,
    vnp_OrderInfo,
    vnp_PayDate,
    vnp_ResponseCode,
    vnp_TransactionStatus,
    vnp_TxnRef,
  } = paymentInfo;

  const isSuccess = vnp_ResponseCode === "00" && vnp_TransactionStatus === "00";
  const amount = Number(vnp_Amount) / 100;
  const formattedAmount = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        {/* Header */}
        <div
          className={`p-6 ${
            isSuccess ? "bg-green-500" : "bg-red-500"
          } text-white`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {isSuccess ? (
                <CheckCircle2 className="h-8 w-8" />
              ) : (
                <XCircle className="h-8 w-8" />
              )}
              <h1 className="text-2xl font-bold">
                {isSuccess
                  ? "Thanh toán thành công"
                  : "Thanh toán không thành công"}
              </h1>
            </div>
            <Link
              to="/"
              className="flex items-center text-sm font-medium hover:underline"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Về trang chủ
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isUpdating && (
            <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 mr-3"></div>
              <span>Đang cập nhật trạng thái đơn hàng...</span>
            </div>
          )}

          {updateError && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center">
              <XCircle className="h-5 w-5 mr-2" />
              <span>{updateError}</span>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Thông tin đơn hàng
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600">{vnp_OrderInfo}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-md font-medium text-gray-700 mb-3">
                Chi tiết thanh toán
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mã đơn hàng:</span>
                  <span className="font-medium">{vnp_TxnRef}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Số tiền:</span>
                  <span className="font-medium">{formattedAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phương thức:</span>
                  <span className="font-medium">{vnp_CardType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngân hàng:</span>
                  <span className="font-medium">{vnp_BankCode}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-md font-medium text-gray-700 mb-3">
                Thông tin giao dịch
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mã giao dịch:</span>
                  <span className="font-medium">{vnp_BankTranNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngày thanh toán:</span>
                  <span className="font-medium">
                    {new Date(vnp_PayDate).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trạng thái:</span>
                  <span
                    className={`font-medium ${
                      isSuccess ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {isSuccess ? "Thành công" : "Thất bại"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`p-4 rounded-lg ${
              isSuccess ? "bg-green-50" : "bg-red-50"
            }`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {isSuccess ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div className="ml-3">
                <h3
                  className={`text-sm font-medium ${
                    isSuccess ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {isSuccess
                    ? "Giao dịch đã được xử lý thành công!"
                    : "Có lỗi xảy ra trong quá trình thanh toán"}
                </h3>
                <div
                  className={`mt-2 text-sm ${
                    isSuccess ? "text-green-700" : "text-red-700"
                  }`}
                >
                  <p>
                    {isSuccess
                      ? "Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đang được xử lý."
                      : "Vui lòng thử lại hoặc liên hệ với bộ phận hỗ trợ nếu cần giúp đỡ."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/orders"
              className="px-6 py-3 bg-blue-600 text-white text-center rounded-md hover:bg-blue-700 transition duration-200"
            >
              Xem đơn hàng của tôi
            </Link>
            <Link
              to="/products"
              className="px-6 py-3 bg-white border border-gray-300 text-gray-700 text-center rounded-md hover:bg-gray-50 transition duration-200"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentResult;
