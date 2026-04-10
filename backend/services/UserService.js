import User from "../models/UserModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";
import Order from "../models/OrderModel.js";

export const createUser = async (userData) => {
  const { name, email, password, phone, isAdmin } = userData;

  if (await User.findOne({ email })) {
    throw new Error("Email đã tồn tại!");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    name,
    email,
    password: hashedPassword,
    phone,
    isAdmin: isAdmin || false,
  });

  await newUser.save();

  const accessToken = jwt.sign(
    { id: newUser._id, email: newUser.email, isAdmin: newUser.isAdmin },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "1h" }
  );
  
  const refreshToken = jwt.sign(
    { id: newUser._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  return { newUser, accessToken, refreshToken };
};

export const loginUser = async (loginData) => {
  const { email, password } = loginData;

  const user = await User.findOne({ email });
  if (!user) throw new Error("Tài khoản không tồn tại!");

  if (!(await bcrypt.compare(password, user.password))) {
    throw new Error("Mật khẩu không đúng!");
  }

  const accessToken = jwt.sign(
    { id: user._id, email: user.email, isAdmin: user.isAdmin },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "3h" }
  );
  
  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  return { user, accessToken, refreshToken };
};

export const getUserProfile = async (userId) => {
  const user = await User.findById(userId).select("-password -access_token -refresh_token -createdAt -updatedAt");
  if (!user) throw new Error("Người dùng không tồn tại!");
  return user;
};

export const updateUserProfile = async (userId, updateData) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("Người dùng không tồn tại!");

  user.name = updateData.name || user.name;
  user.phone = updateData.phone || user.phone;
  if (updateData.password) {
    user.password = await bcrypt.hash(updateData.password, 10);
  }

  return await user.save();
};

export const deleteUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("Người dùng không tồn tại!");
  await user.deleteOne();
  return true;
};

export const updateUserByAdmin = async (userId, updateData) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("Người dùng không tồn tại!");

  user.name = updateData.name || user.name;
  user.email = updateData.email || user.email;
  user.phone = updateData.phone || user.phone;
  user.isAdmin = updateData.isAdmin !== undefined ? updateData.isAdmin : user.isAdmin;

  return await user.save();
};

export const getAllUsers = async () => {
  return await User.find().select("-password -access_token -refresh_token");
};

export const getUserOrders = async (userId) => {
  const orders = await Order.find({ user: userId }).populate("orderItems.product");
  if (!orders.length) throw new Error("Không có đơn hàng nào!");
  return orders;
};

export const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("Không tìm thấy email!");

  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
  await user.save();

  const resetURL = `http://localhost:5173/reset-password/${resetToken}`;
  await sendEmail(user.email, "Đặt lại mật khẩu", `Nhấp vào đây để đặt lại mật khẩu: ${resetURL}`);

  return true;
};

export const resetPassword = async (token, password) => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) throw new Error("Token không hợp lệ hoặc đã hết hạn!");

  user.password = await bcrypt.hash(password, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return true;
};

export const updatePassword = async (userId, oldPassword, newPassword) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("Người dùng không tồn tại!");

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) throw new Error("Mật khẩu cũ không đúng!");

  if (await bcrypt.compare(newPassword, user.password)) {
    throw new Error("Mật khẩu mới không được trùng với mật khẩu cũ!");
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  return true;
};

export const getUserById = async (userId) => {
  const user = await User.findById(userId).select("-password -access_token -refresh_token -createdAt -updatedAt");
  if (!user) throw new Error("Người dùng không tồn tại!");
  return user;
};

export const searchUsers = async (query) => {
  return await User.find({
    $or: [
      { name: { $regex: query, $options: "i" } },
      { email: { $regex: query, $options: "i" } },
      { phone: { $regex: query, $options: "i" } },
    ],
  });
};
