import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";

// ✅ Middleware kiểm tra đăng nhập
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return res.status(401).json({ message: "Người dùng không tồn tại!" });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ message: "Token không hợp lệ!" });
    }
  } else {
    return res.status(401).json({ message: "Bạn chưa đăng nhập!" });
  }
};

// ✅ Middleware kiểm tra quyền Admin
export const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    return res.status(403).json({ message: "Bạn không có quyền truy cập!" });
  }
};
