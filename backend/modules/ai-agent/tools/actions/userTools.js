// modules/ai-agent/tools/actions/userTools.js
import * as userService from "../../../../services/UserService.js";

/**
 * Lấy thông tin người dùng thông qua UserService
 */
export async function getUserProfile({ userId, token }) {
  try {
    if (!userId || !token) {
      throw new Error("Bạn cần đăng nhập để xem thông tin tài khoản");
    }

    const user = await userService.getUserProfile(userId);
    return { success: true, data: user };
  } catch (error) {
    console.error("❌ getUserProfile tool error:", error.message);
    throw error;
  }
}

/**
 * Cập nhật thông tin người dùng thông qua UserService
 */
export async function updateUserProfile({ userId, updates, token }) {
  try {
    if (!userId || !token) {
      throw new Error("Bạn cần đăng nhập để cập nhật thông tin");
    }

    const updatedUser = await userService.updateUserProfile(userId, updates || {});
    return {
      success: true,
      message: "Cập nhật thông tin thành công",
      data: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
      },
    };
  } catch (error) {
    console.error("❌ updateUserProfile tool error:", error.message);
    throw error;
  }
}
