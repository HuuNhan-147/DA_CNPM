// api/aiAgent.ts
import api from "../config/axios";

export interface AIAgentResponse {
  success: boolean;
  reply: string;
  sessionId: string | null;
  requiresAuth?: boolean;
  payload?: {
    products?: Array<{
      _id: string;
      name: string;
      price: number;
      image: string;
      category?: string;
      rating: number;
      countInStock: number;
      description?: string;
      numReviews?: number;
      reviews?: any[];
      createdAt?: string;
      updatedAt?: string;
      quantity?: number;
    }>;
  } | null;
  resolvedReference?: any;
  iterations?: number;
  hasPayload?: boolean; // ✅ Thêm
  productCount?: number; // ✅ Thêm
}

export const fetchAIAgentResponse = async (
  userId: string | null,
  message: string,
  token?: string | null,
  sessionId?: string | null
): Promise<AIAgentResponse> => {
  try {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    console.log("📤 Sending to backend:", {
      message,
      sessionId,
      userId,
      hasToken: !!token
    });

    const response = await api.post(
      "/ai-agent",
      { 
        message, 
        sessionId 
      },
      { headers }
    );

    // ✅ DEBUG CHI TIẾT HƠN
    console.log("🤖 FULL AI Agent Response:", {
      success: response.data.success,
      reply: response.data.reply?.substring(0, 100) + "...",
      hasPayload: !!response.data.payload,
      productCount: response.data.productCount || response.data.payload?.products?.length || 0,
      payloadKeys: response.data.payload ? Object.keys(response.data.payload) : null,
      products: response.data.payload?.products || [],
      firstProduct: response.data.payload?.products?.[0] || null,
      sessionId: response.data.sessionId
    });

    return response.data as AIAgentResponse;
  } catch (error: any) {
    console.error("❌ Lỗi khi gọi AI Agent:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};