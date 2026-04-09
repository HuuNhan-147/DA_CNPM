import React from "react";

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Về chúng tôi</h3>
            <p className="text-gray-400">
              MyStore - Địa chỉ mua sắm tin cậy với hàng ngàn sản phẩm chất
              lượng cao.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Liên hệ</h3>
            <p className="text-gray-400">Email: support@mystore.com</p>
            <p className="text-gray-400">Điện thoại: 0123.456.789</p>
            <p className="text-gray-400">Địa chỉ: 123 Đường ABC, Hà Nội</p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Liên kết hữu ích</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="/privacy"
                  className="text-gray-400 hover:text-white transition"
                >
                  Chính sách bảo mật
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  className="text-gray-400 hover:text-white transition"
                >
                  Điều khoản sử dụng
                </a>
              </li>
              <li>
                <a
                  href="/about"
                  className="text-gray-400 hover:text-white transition"
                >
                  Giới thiệu
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>© 2023 MyStore. Tất cả các quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
