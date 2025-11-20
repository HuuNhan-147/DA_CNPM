import api from "../config/axios";

export const fetchAIAgentResponse = async (
  userId: string | null,
  message: string,
  token?: string | null,
  sessionId?: string | null
) => {
  try {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await api.post(
      "/ai-agent",
      { userId, message, sessionId },
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error("Lỗi khi gọi AI Agent:", error);
    throw error;
  }
};
