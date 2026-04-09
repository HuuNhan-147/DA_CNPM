import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getCart } from "../api/CartApi";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import CartItem from "../components/CartItem";
import CartSummary from "../components/CartSummary";
import { useCart } from "../context/CartContext";

const CartPage = () => {
  const [cartData, setCartData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { removeFromCart, updateQuantity } = useCart();

  const fetchCart = async () => {
    const token = getToken();
    if (!token) {
      setError("Vui lòng đăng nhập để xem giỏ hàng!");
      setCartData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await getCart(token);
      setCartData(response);

      if (!response.cart.cartItems || response.cart.cartItems.length === 0) {
        setError("Giỏ hàng trống");
      }
    } catch (error) {
      console.error(error);
      setError("Không thể lấy thông tin giỏ hàng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRemoveItem = async (productId: string) => {
    try {
      // Gọi API để xóa sản phẩm khỏi giỏ hàng
      await removeFromCart(productId);

      // Cập nhật giỏ hàng trong state sau khi xóa sản phẩm
      if (cartData) {
        // Tạo mảng giỏ hàng mới sau khi xóa sản phẩm
        const updatedItems = cartData.cart.cartItems.filter(
          (item: any) => item.product._id !== productId
        );

        // Tính tổng tiền của các sản phẩm còn lại trong giỏ hàng
        const updatedItemsPrice = updatedItems.reduce(
          (acc: number, item: any) => acc + item.product.price * item.quantity,
          0
        );

        // Tính tiền ship: miễn phí nếu tổng tiền > 1 triệu
        const updatedShippingPrice = 30000;

        // Tính thuế 10%
        const updatedTaxPrice = updatedItemsPrice * 0.1;

        // Tính tổng tiền sau thuế và ship
        const updatedTotalPrice =
          updatedItemsPrice + updatedShippingPrice + updatedTaxPrice;

        // Cập nhật lại giỏ hàng trong state và tính lại tổng tiền
        setCartData({
          ...cartData,
          cart: {
            ...cartData.cart,
            cartItems: updatedItems,
          },
          itemsPrice: updatedItemsPrice,
          shippingPrice: updatedShippingPrice,
          taxPrice: updatedTaxPrice,
          totalPrice: updatedTotalPrice,
        });
      }
    } catch (error) {
      console.error("Lỗi khi xóa sản phẩm:", error);
      setError("Không thể xóa sản phẩm.");
    }
  };

  const handleUpdateQuantity = async (
    productId: string,
    newQuantity: number
  ) => {
    if (newQuantity < 1) return;
    try {
      await updateQuantity(productId, newQuantity);

      if (cartData) {
        // Cập nhật số lượng mới trong giỏ hàng
        const updatedItems = cartData.cart.cartItems.map((item: any) => {
          if (item.product._id === productId) {
            return {
              ...item,
              quantity: newQuantity,
            };
          }
          return item;
        });

        // Tính tổng tiền của các sản phẩm
        const updatedItemsPrice = updatedItems.reduce(
          (acc: number, item: any) => acc + item.product.price * item.quantity,
          0
        );

        // Tính tiền ship: miễn phí nếu tổng tiền > 1 triệu
        const updatedShippingPrice = 30000;

        // Tính thuế 10%
        const updatedTaxPrice = updatedItemsPrice * 0.1;

        // Tính tổng tiền sau thuế và ship
        const updatedTotalPrice =
          updatedItemsPrice + updatedShippingPrice + updatedTaxPrice;

        // Cập nhật lại dữ liệu trong state
        setCartData({
          ...cartData,
          cart: {
            ...cartData.cart,
            cartItems: updatedItems,
          },
          itemsPrice: updatedItemsPrice,
          shippingPrice: updatedShippingPrice,
          taxPrice: updatedTaxPrice,
          totalPrice: updatedTotalPrice,
        });
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật số lượng:", error);
      setError("Không thể cập nhật số lượng sản phẩm.");
    }
  };

  const handleBuyNow = () => {
    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }

    if (!cartData?.cart.cartItems || cartData.cart.cartItems.length === 0) {
      return;
    }

    const products = cartData.cart.cartItems.map((item: any) => ({
      _id: item.product._id,
      name: item.product.name,
      price: item.product.price,
      image: item.product.image,
      quantity: item.quantity,
      countInStock: item.product.countInStock,
    }));

    navigate("/create", {
      state: {
        products,
        summary: {
          itemsPrice: cartData?.itemsPrice,
          shippingPrice: cartData?.shippingPrice,
          taxPrice: cartData?.taxPrice,
          totalPrice: cartData?.totalPrice,
        },
      },
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !cartData || cartData.cart.cartItems.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-medium text-gray-900 mb-2">
          {error || "Giỏ hàng của bạn đang trống"}
        </h2>
        <p className="text-gray-600 mb-6">
          Hãy khám phá cửa hàng và thêm sản phẩm vào giỏ hàng!
        </p>
        <Link
          to="/products"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Giỏ hàng của bạn
        </h1>
        <div className="flex items-center text-gray-600">
          <Link to="/" className="hover:text-blue-600">
            Trang chủ
          </Link>
          <span className="mx-2">/</span>
          <span className="text-blue-600">Giỏ hàng</span>
        </div>
      </div>

      <div className="lg:flex gap-8">
        <div className="lg:w-2/3">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="hidden md:grid grid-cols-12 bg-gray-100 p-4 text-gray-600 font-medium">
              <div className="col-span-5">Sản phẩm</div>
              <div className="col-span-2 text-center">Đơn giá</div>
              <div className="col-span-3 text-center">Số lượng</div>
              <div className="col-span-2 text-center">Thành tiền</div>
            </div>

            {cartData.cart.cartItems.map((item: any) => (
              <CartItem
                key={item.product._id}
                item={item}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
              />
            ))}
          </div>
        </div>

        <div className="lg:w-1/3 mt-8 lg:mt-0">
          <CartSummary
            itemsPrice={cartData.itemsPrice}
            shippingPrice={cartData.shippingPrice}
            taxPrice={cartData.taxPrice}
            totalPrice={cartData.totalPrice}
            onBuyNow={handleBuyNow}
          />
        </div>
      </div>
    </div>
  );
};

export default CartPage;
