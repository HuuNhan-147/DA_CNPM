import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import routes from "./routes/index.js";
import { connectRedis, disconnectRedis } from "./config/redis.js";
import cors from "cors";
dotenv.config();

const app = express();
const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;

// ✅ Khởi tạo HTTP Server & Socket.io
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("🟢 Một người dùng đã kết nối Socket.IO:", socket.id);
  socket.on("disconnect", () => {
    console.log("🔴 Người dùng đã thoát:", socket.id);
  });
});

// ✅ Middleware gán io chạy xuyên suốt app
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(
  cors({
    origin: [
      "http://localhost:5173",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json()); // ✅ Middleware JSON
app.use(express.urlencoded({ extended: true })); // Xử lý dữ liệu form
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

    httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Socket.IO is ready!`);
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
