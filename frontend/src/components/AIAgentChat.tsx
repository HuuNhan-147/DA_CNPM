import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { IProduct } from "../types/product";
import { io, Socket } from "socket.io-client"; // ✅ Tích hợp socket.io-client
import { webMcpManager } from "../webmcp"; // ✅ WebMCP runtime manager
import {
  FaPaperPlane,
  FaRobot,
  FaUser,
  FaTimes,
  FaShoppingCart,
  FaEye,
  FaRedo,
  FaStar,
  FaBox,
  FaArrowRight,
  FaMinus,
} from "react-icons/fa";

// ✅ Interface cho Action Buttons
interface ActionButton {
  label: string;
  action: "navigate" | "cart" | "orders" | "profile";
  url?: string;
  style?: "primary" | "secondary";
}

interface Message {
  sender: "user" | "agent";
  text: string;
  products?: IProduct[];
  actions?: ActionButton[];
  timestamp?: Date;
}

const AIAgentChat: React.FC = () => {
  const { user, getToken } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null); // ✅ Lưu trữ tham chiếu Socket

  // Initialize welcome message
  useEffect(() => {
    if (messages.length === 0 && !isMinimized) {
      setMessages([
        {
          sender: "agent",
          text: "Xin chào! Tôi là E-ComMate 🤖 — trợ lý mua sắm thông minh của bạn. Tôi có thể giúp bạn tìm kiếm sản phẩm, thêm vào giỏ hàng và tư vấn chi tiết!",
          timestamp: new Date(),
        },
      ]);
    }
  }, [isMinimized]);

  // ✅ KẾT NỐI SOCKET.IO VÀ ĐĂNG KÝ LẮNG NGHE CHUNK CHỮ STREAM
  useEffect(() => {
    const socket = io("http://localhost:5000", {
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🟢 Connected to Socket.IO from E-ComMate Chat!");
    });

    // Lắng nghe chunk chữ truyền về từ server thời gian thực
    socket.on("agent_response_chunk", (data: { text: string; sessionId: string }) => {
      if (data.sessionId) setSessionId(data.sessionId);

      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.sender === "agent") {
          // Nối thêm text chunk mới nhận được vào tin nhắn của agent
          const updatedLastMsg = {
            ...lastMsg,
            text: lastMsg.text + data.text,
          };
          return [...prev.slice(0, -1), updatedLastMsg];
        }
        return prev;
      });
    });

    // Lắng nghe khi cuộc hội thoại hoàn thành (kèm metadata sản phẩm và nút bấm)
    socket.on("agent_response_end", (data: any) => {
      console.log("📡 agent_response_end received:", data);
      if (data.sessionId) setSessionId(data.sessionId);

      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.sender === "agent") {
          const replyText = data.reply || lastMsg.text || "Tôi chưa hiểu rõ yêu cầu của bạn.";
          const { cleanText, actions } = parseActionsFromText(replyText);
          const transformedProducts = transformAgentProducts(data.payload?.products);

          const updatedLastMsg = {
            ...lastMsg,
            text: cleanText, // Làm sạch mã JSON của ACTIONS trong text hiển thị
            products: transformedProducts,
            actions: actions || undefined,
          };
          return [...prev.slice(0, -1), updatedLastMsg];
        }
        return prev;
      });

      setLoading(false);
    });

    // ✅ WEBMCP DUAL-PATH: Lắng nghe yêu cầu ủy quyền thực thi WebMCP tool từ Agent Server
    socket.on(
      "execute_webmcp_tool",
      async (data: { executionId: string; toolName: string; args: any }) => {
        const { executionId, toolName, args } = data;
        console.log(
          `🌐 [WebMCP] Server ủy quyền thực thi tool [${toolName}] (ID: ${executionId}):`,
          args
        );
        try {
          const result = await webMcpManager.executeTool(toolName, args);
          socket.emit(`webmcp_tool_result_${executionId}`, result);
          console.log(`✅ [WebMCP] Hoàn tất và gửi kết quả [${toolName}] về Server:`, result);
        } catch (err: any) {
          console.error(`❌ [WebMCP] Lỗi thực thi [${toolName}]:`, err);
          socket.emit(`webmcp_tool_result_${executionId}`, {
            success: false,
            error: err?.message || "Lỗi thực thi WebMCP tool trên trình duyệt",
          });
        }
      }
    );

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isMinimized) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isMinimized]);

  // ✅ HÀM TRANSFORM DATA từ agent format sang IProduct format
  const transformAgentProducts = (
    products: any[] | undefined | null
  ): IProduct[] => {
    if (!products || !Array.isArray(products)) {
      return [];
    }

    const filteredProducts = products.filter(
      (product) => product && (product.id || product._id) && product.name
    );

    const transformed = filteredProducts.map((product) => {
      const productId = product.id || product._id;

      return {
        _id: productId,
        name: product.name || "",
        price: Number(product.price) || 0,
        image: product.image || "/images/placeholder-product.jpg",
        category: product.category || product.brand || "uncategorized",
        rating: Number(product.rating) || 0,
        countInStock: Number(product.countInStock) || 0,
        description: product.description || "",
        numReviews: product.numReviews || 0,
        reviews: product.reviews || [],
        createdAt: product.createdAt || new Date().toISOString(),
        updatedAt: product.updatedAt || new Date().toISOString(),
        quantity: product.quantity || 0,
      };
    });

    return transformed;
  };

  // ✅ HÀM MỞ CHAT
  const handleOpenChat = () => {
    setIsMinimized(false);
  };

  // ✅ HÀM ĐÓNG CHAT (thu nhỏ)
  const handleMinimizeChat = () => {
    setIsMinimized(true);
  };

  // ✅ HÀM PARSE ACTIONS từ text
  const parseActionsFromText = (
    text: string
  ): { cleanText: string; actions: ActionButton[] | null } => {
    const actionsMatch = text.match(/\[ACTIONS\]([\s\S]*?)\[\/ACTIONS\]/);

    if (!actionsMatch) {
      return { cleanText: text, actions: null };
    }

    try {
      const actionsJson = actionsMatch[1].trim();
      const actionsData = JSON.parse(actionsJson);
      const cleanText = text
        .replace(/\[ACTIONS\][\s\S]*?\[\/ACTIONS\]/, "")
        .trim();

      return {
        cleanText,
        actions: actionsData.buttons || null,
      };
    } catch (error) {
      console.error("Failed to parse actions:", error);
      return { cleanText: text, actions: null };
    }
  };

  // ✅ HÀM XỬ LÝ CLICK ACTION BUTTON
  const handleActionClick = (button: ActionButton) => {
    console.log("Action clicked:", button);

    switch (button.action) {
      case "cart":
        navigate("/cart");
        handleMinimizeChat();
        break;
      case "orders":
        navigate("/orders");
        handleMinimizeChat();
        break;
      case "profile":
        navigate("/profile");
        handleMinimizeChat();
        break;
      case "navigate":
        if (button.url) {
          if (/^https?:\/\//i.test(button.url)) {
            window.open(button.url, "_blank", "noopener,noreferrer");
          } else {
            navigate(button.url);
            handleMinimizeChat();
          }
        }
        break;
      default:
        console.warn("Unknown action:", button.action);
    }
  };

  // ✅ COMPONENT ACTION BUTTONS
  const ActionButtons: React.FC<{ actions: ActionButton[] }> = ({
    actions,
  }) => {
    if (!actions || actions.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
        {actions.map((button, index) => {
          const isPrimary = button.style === "primary" || index === 0;

          return (
            <button
              key={index}
              onClick={() => handleActionClick(button)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
                transition-all duration-200 shadow-sm hover:shadow-md
                ${
                  isPrimary
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }
              `}
            >
              {button.action === "cart" && <FaShoppingCart />}
              {button.action === "orders" && <FaBox />}
              {button.action === "profile" && <FaUser />}
              {button.action === "navigate" && <FaArrowRight />}
              <span>{button.label}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const handleViewDetail = (product: IProduct) => {
    console.log("Xem chi tiết:", product);
    navigate(`/products/${product._id}`);
    handleMinimizeChat();
  };

  const handleNewChat = async () => {
    console.log("🆕 Starting new chat...");
    setMessages([
      {
        sender: "agent",
        text: "Xin chào! Tôi là E-ComMate 🤖 — trợ lý mua sắm thông minh của bạn. Hãy cho tôi biết bạn cần tìm sản phẩm gì nhé!",
        timestamp: new Date(),
      },
    ]);
    setSessionId(null);
    setInput("");
  };

  // Format agent text
  const formatAgentText = (text: string): React.ReactNode[] => {
    if (!text) return [];
    const lines = text.split("\n");
    const formattedLines: React.ReactNode[] = [];

    lines.forEach((line, lineIndex) => {
      const processedLine = processLineWithHTMLAndMarkdown(line, lineIndex);
      if (processedLine) {
        formattedLines.push(processedLine);
      }
    });

    return formattedLines;
  };

  const processLineWithHTMLAndMarkdown = (
    line: string,
    lineIndex: number
  ): React.ReactNode => {
    if (!line.trim()) {
      return <div key={`line-${lineIndex}`} className="h-3" />;
    }

    if (line.includes("<br>•") || line.includes("<br>-")) {
      const listItems = line.split(/<br>•|<br>-/).filter((item) => item.trim());
      return (
        <div key={`line-${lineIndex}`} className="space-y-1">
          {listItems.map((item, itemIndex) => (
            <div
              key={`item-${lineIndex}-${itemIndex}`}
              className="flex items-start gap-3"
            >
              <span className="text-blue-500 mt-1 flex-shrink-0">•</span>
              <span className="text-gray-700 text-sm flex-1">
                {processInlineFormatting(item.trim())}
              </span>
            </div>
          ))}
        </div>
      );
    }

    if (line.includes("<br>")) {
      const segments = line.split(/<br>/g);
      return (
        <div key={`line-${lineIndex}`} className="space-y-2">
          {segments.map((segment, segmentIndex) => (
            <div key={`segment-${lineIndex}-${segmentIndex}`}>
              {processInlineFormatting(segment)}
            </div>
          ))}
        </div>
      );
    }

    if (line.trim().startsWith("* ") && !line.includes("**")) {
      const content = line.trim().substring(2);
      return (
        <div key={`line-${lineIndex}`} className="flex items-start gap-3 my-1">
          <span className="text-blue-500 mt-1 flex-shrink-0">•</span>
          <span className="text-gray-700 text-sm flex-1">
            {processInlineFormatting(content)}
          </span>
        </div>
      );
    }

    return (
      <div key={`line-${lineIndex}`} className="my-1">
        {processInlineFormatting(line)}
      </div>
    );
  };

  const processInlineFormatting = (content: string): React.ReactNode => {
    if (!content) return null;
    const parts = content.split(/(<strong>.*?<\/strong>|\*\*.*?\*\*)/g);

    return parts.map((part, index) => {
      if (part.startsWith("<strong>") && part.endsWith("</strong>")) {
        const text = part.slice(8, -9);
        return (
          <strong key={index} className="font-semibold text-gray-900">
            {text}
          </strong>
        );
      } else if (part.startsWith("**") && part.endsWith("**")) {
        const text = part.slice(2, -2);
        return (
          <strong key={index} className="font-semibold text-gray-900">
            {text}
          </strong>
        );
      } else {
        return (
          <span key={index} className="text-gray-700">
            {part}
          </span>
        );
      }
    });
  };

  // ✅ COMPONENT PRODUCT CARD
  const ProductCard: React.FC<{
    product: IProduct;
    onViewDetail: (product: IProduct) => void;
  }> = ({ product, onViewDetail }) => {
    const isValidProduct = product && product._id && product.name;

    if (!isValidProduct) {
      console.warn("Invalid product data:", product);
      return null;
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-all duration-200 mb-3 last:mb-0">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://via.placeholder.com/80x80/EBF4FF/7F9CF5?text=📱";
                }}
              />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {product.category && product.category !== "uncategorized" && (
              <p className="text-xs font-medium text-blue-600 mb-1 capitalize">
                {product.category}
              </p>
            )}

            <h4 className="font-semibold text-gray-800 text-sm leading-tight mb-1 line-clamp-2">
              {product.name}
            </h4>

            {product.rating > 0 && (
              <div className="flex items-center gap-1 mb-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      className={`text-xs ${
                        i < Math.floor(product.rating)
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500">
                  ({product.rating})
                </span>
              </div>
            )}

            <div className="flex items-center justify-between mt-2">
              <p className="text-red-600 font-bold text-sm">
                {product.price.toLocaleString("vi-VN")}₫
              </p>

              <div className="flex gap-1">
                <button
                  onClick={() => onViewDetail(product)}
                  className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs font-medium transition-colors"
                  title="Xem chi tiết"
                >
                  <FaEye className="text-xs" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ✅ COMPONENT HIỂN THỊ MESSAGE
  const AgentMessageWithProducts: React.FC<{ message: Message }> = ({
    message,
  }) => {
    // Nếu tin nhắn đang rỗng (chờ stream chữ), hiển thị animation Đang soạn tin ngay tại đây
    if (!message.text && (!message.products || message.products.length === 0)) {
      return (
        <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm max-w-[320px]">
          <div className="flex items-center gap-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.15s" }}
              ></div>
              <div
                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.3s" }}
              ></div>
            </div>
            <span className="text-gray-500 text-xs italic">
              E-ComMate đang soạn tin...
            </span>
          </div>
        </div>
      );
    }

    const hasValidProducts =
      message.products &&
      message.products.length > 0 &&
      message.products.some(
        (product) => product && product._id && product.name
      );

    const validProducts =
      message.products?.filter(
        (product) => product && product._id && product.name
      ) || [];

    return (
      <div className="space-y-3">
        <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none shadow-sm overflow-hidden w-full max-w-[340px]">
          <div className="px-4 py-3">
            <div className="text-gray-800 leading-relaxed text-sm space-y-2">
              {formatAgentText(message.text)}
            </div>

            {hasValidProducts && validProducts.length > 0 && (
              <div className="mt-3 space-y-2">
                {validProducts.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    onViewDetail={handleViewDetail}
                  />
                ))}
              </div>
            )}

            {message.actions && <ActionButtons actions={message.actions} />}
          </div>

          {message.timestamp && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                {message.timestamp.toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ✅ HANDLE SEND MESSAGE VIA SOCKET.IO STREAM
  const handleSend = async () => {
    if (!input.trim() || loading || !socketRef.current) return;

    const userMsg: Message = {
      sender: "user",
      text: input,
      timestamp: new Date(),
    };

    // Đẩy tin nhắn của user vào danh sách, đồng thời tạo trước khung tin nhắn của agent để nhận stream chữ
    const agentMsg: Message = {
      sender: "agent",
      text: "",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg, agentMsg]);

    const text = input;
    setInput("");
    setLoading(true);

    try {
      const token = getToken ? getToken() : null;

      // Gửi sự kiện đi qua Socket.io kèm cờ hỗ trợ WebMCP
      socketRef.current.emit("client_send_message", {
        message: text,
        sessionId,
        userId: user?.id || null,
        token,
        hasWebMCP: true,
      });

      console.log("📤 client_send_message emitted via Socket.io");
    } catch (err) {
      console.error("❌ Chat Socket emit error:", err);
      setMessages((prev) => {
        // Thay thế khung trống bằng thông báo lỗi
        return [
          ...prev.slice(0, -1),
          {
            sender: "agent",
            text: "⚠️ Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau.",
            timestamp: new Date(),
          },
        ];
      });
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ✅ NẾU ĐANG THU NHỎ -> HIỂN THỊ NÚT MỞ CHAT
  if (isMinimized) {
    return (
      <button
        onClick={handleOpenChat}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:shadow-2xl transition-all duration-300 z-50 hover:scale-110 group"
        title="Mở trợ lý ảo E-ComMate"
      >
        <FaRobot className="text-2xl" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-ping"></span>
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></span>

        <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs py-1 px-2 rounded-lg whitespace-nowrap">
          Chat với E-ComMate 🤖
        </div>
      </button>
    );
  }

  // ✅ NẾU ĐANG MỞ -> HIỂN THỊ KHUNG CHAT ĐẦY ĐỦ
  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 z-50 animate-fade-in">
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
          <button
            onClick={handleNewChat}
            className="hover:bg-white/20 p-2 rounded-full transition"
            title="Cuộc trò chuyện mới"
          >
            <FaRedo className="text-sm" />
          </button>
          <button
            onClick={handleMinimizeChat}
            className="hover:bg-white/20 p-2 rounded-full transition"
            title="Thu nhỏ"
          >
            <FaMinus className="text-sm" />
          </button>
          <button
            onClick={handleMinimizeChat}
            className="hover:bg-white/20 p-2 rounded-full transition"
            title="Đóng"
          >
            <FaTimes />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-blue-50">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`flex items-start gap-3 ${
                msg.sender === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {msg.sender === "agent" && (
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaRobot className="text-white text-sm" />
                </div>
              )}
              {msg.sender === "user" && (
                <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaUser className="text-white text-sm" />
                </div>
              )}

              <div className="flex flex-col gap-2">
                {msg.sender === "user" ? (
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl rounded-br-none px-4 py-3 shadow-sm max-w-[280px]">
                    <div className="text-white leading-relaxed text-sm">
                      {msg.text}
                    </div>
                  </div>
                ) : (
                  <AgentMessageWithProducts message={msg} />
                )}
              </div>
            </div>
          </div>
        ))}

        <div ref={chatEndRef}></div>
      </div>

      <div className="border-t border-gray-200 bg-white p-4">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500 transition">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tin nhắn..."
              className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-500"
              disabled={loading}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-3 rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
          >
            <FaPaperPlane className={loading ? "animate-pulse" : ""} />
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-2">
          E-ComMate • Luôn sẵn sàng hỗ trợ bạn 🚀
        </p>
      </div>
    </div>
  );
};

export default AIAgentChat;
