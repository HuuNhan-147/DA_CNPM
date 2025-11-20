import React, { useState, useEffect, useRef } from "react";
import { fetchAIAgentResponse } from "../api/aiAgent";
import { useAuth } from "../context/AuthContext";
import { FaPaperPlane, FaRobot, FaUser, FaEllipsisH, FaTimes } from "react-icons/fa";

interface Message {
  sender: "user" | "agent";
  text: string;
}

const AIAgentChat: React.FC = () => {
  const { user, getToken } = useAuth();

  // Tin nhắn mặc định
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "agent",
      text: "Xin chào! Tôi là <strong>E-ComMate</strong> 🤖 — trợ lý mua sắm thông minh của bạn. Tôi có thể giúp bạn:<br>• Tìm kiếm sản phẩm<br>• Thêm vào giỏ hàng<br>• Theo dõi đơn hàng<br>• Tư vấn sản phẩm phù hợp",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // sessionId để giữ lịch sử chat — KHÔNG DÙNG DATABASE
  const [sessionId, setSessionId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Gửi tin nhắn
  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);

    const text = input;
    setInput("");
    setLoading(true);

    try {
      const token = getToken ? getToken() : null;

      const response = await fetchAIAgentResponse(
        user?.id || null,
        text,
        token,
        sessionId // gửi sessionId vào backend
      );

      // BE trả sessionId thì lưu lại
      if (response?.sessionId) {
        setSessionId(response.sessionId);
      }

      const replyText =
        response?.reply ||
        response?.message ||
        JSON.stringify(response) ||
        "Tôi chưa hiểu rõ yêu cầu của bạn.";

      const agentMsg: Message = { sender: "agent", text: replyText };
      setMessages((prev) => [...prev, agentMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "agent",
          text: "⚠️ Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Enter để gửi
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    "Tìm sản phẩm giảm giá",
    "Điện thoại nào tốt nhất?",
    "Cách theo dõi đơn hàng",
    "Tư vấn laptop văn phòng",
  ];

  // Mini icon
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-300 z-50 group"
      >
        <FaRobot className="text-2xl" />
        <span className="absolute -top-2 -right-2 w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 z-50 animate-fade-in">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <FaRobot className="text-xl" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></span>
          </div>
          <div>
            <h3 className="font-bold text-lg">E-ComMate</h3>
            <p className="text-blue-100 text-xs">Trợ lý ảo • Đang trực tuyến</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="hover:bg-white/20 p-2 rounded-full transition">
            <FaEllipsisH />
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="hover:bg-white/20 p-2 rounded-full transition"
          >
            <FaTimes />
          </button>
        </div>
      </div>

      {/* CHAT BODY */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-blue-50">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`flex items-start gap-3 max-w-[85%] ${
                msg.sender === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {msg.sender === "agent" && (
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <FaRobot className="text-white text-sm" />
                </div>
              )}
              {msg.sender === "user" && (
                <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full flex items-center justify-center">
                  <FaUser className="text-white text-sm" />
                </div>
              )}

              <div
                className={`rounded-2xl px-4 py-3 shadow-sm ${
                  msg.sender === "user"
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-br-none"
                    : "bg-white border border-gray-200 rounded-bl-none"
                }`}
                dangerouslySetInnerHTML={{ __html: msg.text }}
              />
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-3 max-w-[85%]">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <FaRobot className="text-white text-sm" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gợi ý */}
        {messages.length === 1 && !loading && (
          <>
            <p className="text-center text-sm text-gray-500 font-medium">
              Gợi ý câu hỏi:
            </p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setInput(q)}
                  className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs hover:bg-blue-50 transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </>
        )}

        <div ref={chatEndRef}></div>
      </div>

      {/* INPUT AREA */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500 transition">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tin nhắn..."
              className="w-full bg-transparent outline-none text-gray-800"
              disabled={loading}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-3 rounded-xl hover:shadow-lg transition disabled:opacity-50"
          >
            <FaPaperPlane />
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-2">
          E-ComMate • Luôn sẵn sàng hỗ trợ bạn
        </p>
      </div>
    </div>
  );
};

export default AIAgentChat;
