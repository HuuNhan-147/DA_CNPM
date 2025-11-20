import User from "../../../models/UserModel.js";

export async function getUserProfile({ userId, token }) {
  try {
    if (!userId || !token) {
      throw new Error("Bạn cần đăng nhập để xem thông tin người dùng");
    }

    const user = await User.findById(userId).select("-password -access_token -refresh_token");
    if (!user) return { success: false, message: "Không tìm thấy người dùng" };
    return { success: true, data: user };
  } catch (error) {
    console.error("❌ Lỗi lấy thông tin người dùng:", error.message);
    throw error;
  }
}

export async function updateUserProfile({ userId, updates, token }) {
  try {
    if (!userId || !token) {
      throw new Error("Bạn cần đăng nhập để cập nhật thông tin");
    }

    const user = await User.findById(userId);
    if (!user) return { success: false, message: "Người dùng không tồn tại" };

    user.name = updates?.name || user.name;
    user.phone = updates?.phone || user.phone;
    if (updates?.password) {
      // Hashing handled in controller; keep simple here or import bcrypt if needed
      const bcrypt = await import('bcryptjs');
      user.password = await bcrypt.hash(updates.password, 10);
    }

    await user.save();
    return { success: true, message: "Cập nhật thông tin thành công", data: user };
  } catch (error) {
    console.error("❌ Lỗi cập nhật người dùng:", error.message);
    throw error;
  }
}
