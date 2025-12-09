import express from "express";
import userRouter from "./UserRoutes.js";
import productRouter from "./ProductRoutes.js"; // Import thêm nếu cần
import orderRouter from "./OrderRoutes.js"; // Import thêm nếu cần
import cartRoutes from "./CartRoutes.js";
import categoryRoutes from "./CategoryRoutes.js";
import uploadRouter from "./UploadRoutes.js"; // ✅ Import API upload ảnh
import vnpayRoutes from "./vnpayRoutes.js";
import DashboardRoutes from "./DashboardRoutes.js"; // ✅ Import API dashboard
import aiAgentRoutes from "./aiAgentRoutes.js";
const routes = express.Router();

routes.use("/users", userRouter); // ✅ Định tuyến người dùng
routes.use("/products", productRouter); // ✅ Định tuyến sản phẩm
routes.use("/orders", orderRouter); // ✅ Định tuyến đơn hàng
routes.use("/cart", cartRoutes); // ✅ Thêm route giỏ hàng
routes.use("/categories", categoryRoutes); // ✅ Thêm route danh mục
routes.use("/upload", uploadRouter); // ✅ Thêm route upload ảnh
routes.use("/vnpay", vnpayRoutes); // API thanh toán VNPay
routes.use("/dashboard", DashboardRoutes); // ✅ Thêm route dashboard
routes.use("/ai-agent", aiAgentRoutes);
export default routes;
