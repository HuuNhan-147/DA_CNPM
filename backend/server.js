import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import routes from "./routes/index.js";
import { connectRedis, disconnectRedis } from "./config/redis.js";
import cors from "cors";
dotenv.config();

const app = express();
const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json()); // ✅ Middleware JSON
app.use(express.urlencoded({ extended: true })); // Xử lý dữ liệu form
app.use("/uploads", express.static("uploads")); // Cho phép truy cập ảnh đã upload
app.use("/api", routes); // ✅ Gọi routes
app.get("/", (req, res) => {
  res.send("Chào mừng bạn đến với API của tôi!");
});
// Cấu hình CORS
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");

    // Initialize Redis (if configured)
    connectRedis()
      .then(() => console.log('Redis initialized'))
      .catch((err) => console.warn('Redis not initialized:', err.message));

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log(error.message);
  });
// Middleware xử lý lỗi 404 và các lỗi khác
app.use((req, res, next) => {
  const error = new Error("Không tìm thấy trang");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    message: error.message,
    error: process.env.NODE_ENV === "development" ? error : {},
  });
});
