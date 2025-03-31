import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, required: true, default: false },
    phone: { type: String, required: true },
    resetPasswordToken: { type: String }, // Token reset mật khẩu
    resetPasswordExpires: { type: Date }, // Thời gian hết hạn
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
export default User; // ✅ Dùng `export default`
