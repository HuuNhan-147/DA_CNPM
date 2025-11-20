import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Cố định cổng
    strictPort: true, // Không tự động đổi cổng nếu bị chiếm
    host: "0.0.0.0", // Cho phép truy cập từ các máy khác trong mạng nội bộ
  },
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
});
