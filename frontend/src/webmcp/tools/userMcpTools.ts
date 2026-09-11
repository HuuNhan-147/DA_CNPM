// frontend/src/webmcp/tools/userMcpTools.ts
// ============================================
// WEBMCP USER CAPABILITIES — Expose quản lý hồ sơ cá nhân trên trình duyệt
// ============================================

import { WebMCPToolDefinition } from "../types/WebMCPTypes";
import { getUserProfile, updateUserProfile } from "../../api/UserApi";

const getToken = () => localStorage.getItem("token") || "";

export const getUserProfileMcpTool: WebMCPToolDefinition = {
  name: "get_user_profile",
  description: "Lấy thông tin tài khoản cá nhân của người dùng hiện tại",
  inputSchema: {
    type: "object",
    properties: {},
  },
  execute: async () => {
    const token = getToken();
    if (!token) throw new Error("Bạn cần đăng nhập để xem thông tin cá nhân");

    const profile = await getUserProfile(token);
    return {
      success: true,
      profile,
    };
  },
};

export const updateUserProfileMcpTool: WebMCPToolDefinition = {
  name: "update_user_profile",
  description: "Cập nhật thông tin tài khoản cá nhân (tên, số điện thoại, email)",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Họ và tên mới" },
      phone: { type: "string", description: "Số điện thoại mới" },
      email: { type: "string", description: "Email mới" },
    },
  },
  execute: async (args) => {
    const token = getToken();
    if (!token) throw new Error("Bạn cần đăng nhập để cập nhật thông tin");

    const result = await updateUserProfile(
      {
        name: args.name,
        phone: args.phone,
        email: args.email,
      },
      token
    );

    return {
      success: true,
      message: "Cập nhật thông tin cá nhân thành công",
      user: result,
    };
  },
};

export const userMcpTools = [getUserProfileMcpTool, updateUserProfileMcpTool];
