import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import routes from "./routes/index.js";
import { connectRedis, disconnectRedis } from "./config/redis.js";
import cors from "cors";
import { runAgent } from "./modules/ai-agent/index.js"; // ✅ Import runAgent từ module AI Agent riêng biệt

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// ✅ Khởi tạo HTTP Server & Socket.io
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [process.env.FRONTEND_URL || "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("🟢 Một người dùng đã kết nối Socket.IO:", socket.id);

  // ✅ LẮNG NGHE SỰ KIỆN CHAT TỪ AI AGENT CLIENT HỖ TRỢ STREAMING
  socket.on("client_send_message", async (data) => {
    const { message, sessionId, userId, token, hasWebMCP } = data;
    console.log(`📡 Socket client_send_message received from ${socket.id}:`, {
      message: message?.substring(0, 50) + "...",
      sessionId: sessionId || "none",
      hasWebMCP: !!hasWebMCP,
    });

    try {
      const result = await runAgent(
        message,
        [], // context
        userId || null,
        token || null,
        sessionId || null,
        // Callback onChunk: phát chunk chữ thời gian thực về đúng client
        (chunkText, activeSessionId) => {
          socket.emit("agent_response_chunk", {
            text: chunkText,
            sessionId: activeSessionId,
          });
        },
        {
          clientSupportsWebMCP: !!hasWebMCP,
          socket,
        }
      );

      // Khi hoàn tất, phát toàn bộ dữ liệu metadata và payload sản phẩm
      socket.emit("agent_response_end", {
        success: result.success,
        reply: result.reply,
        sessionId: result.sessionId,
        payload: result.payload,
        requiresAuth: result.requiresAuth,
        hasPayload: result.hasPayload,
        productCount: result.productCount,
        _debug: result._debug
      });

      console.log(`📡 Socket response end sent successfully to ${socket.id}`);
    } catch (error) {
      console.error(`❌ Socket AI Agent error for ${socket.id}:`, error);
      socket.emit("agent_response_end", {
        success: false,
        reply: "Ối, trợ lý ảo đang gặp sự cố nhỏ. Bạn thử lại nhé! 🙏",
        sessionId: sessionId || null,
        payload: null
      });
    }
  });

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
      process.env.FRONTEND_URL || "http://localhost:5173",
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
