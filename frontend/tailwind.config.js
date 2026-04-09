module.exports = {
  content: [
    "./index.html", // Đảm bảo Tailwind kiểm tra file HTML của bạn
    "./src/**/*.{js,ts,jsx,tsx}", // Đảm bảo Tailwind kiểm tra tất cả các file JS, TS, JSX, và TSX trong thư mục src
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
