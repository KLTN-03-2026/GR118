import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "motion/react";
import {
  MessageCircle,
  X,
  Send,
  Phone,
  User,
  Clock,
  Minimize2,
  PhoneCall,
  Mail,
  Headphones,
} from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "support";
  timestamp: Date;
}

const SUPPORT_INFO = {
  hotline: "1900-xxxx",
  email: "hotro@baocao.vn",
  workingHours: "8:00 - 22:00 (Thứ 2 - CN)",
};

const AUTO_RESPONSES = [
  {
    keywords: ["xin chào", "chào", "hello", "hi"],
    response:
      "Xin chào! Tôi là trợ lý ảo của hệ thống. Bạn cần hỗ trợ gì? Bạn có thể gọi hotline " +
      SUPPORT_INFO.hotline +
      " để được tư vấn trực tiếp.",
  },
  {
    keywords: ["báo cáo", "gửi báo cáo", "report"],
    response:
      "Để gửi báo cáo vấn đề, bạn vui lòng đăng nhập và truy cập trang 'Báo cáo' từ menu. Nếu cần hỗ trợ, vui lòng gọi " +
      SUPPORT_INFO.hotline,
  },
  {
    keywords: ["liên hệ", "hotline", "gọi", "số điện thoại"],
    response:
      "Bạn có thể liên hệ qua:\n📞 Hotline: " +
      SUPPORT_INFO.hotline +
      "\n📧 Email: " +
      SUPPORT_INFO.email +
      "\n🕐 Giờ làm việc: " +
      SUPPORT_INFO.workingHours,
  },
  {
    keywords: ["giờ làm việc", "mở cửa", "working hours"],
    response: "Chúng tôi làm việc " + SUPPORT_INFO.workingHours + ". Bạn có thể liên hệ bất cứ lúc nào!",
  },
];

export function SupportChatBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Xin chào! Tôi có thể giúp gì cho bạn?",
      sender: "support",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize position at bottom right
  useEffect(() => {
    setPosition({
      x: window.innerWidth - 100,
      y: window.innerHeight - 100,
    });
  }, []);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInputText("");

    // Auto response after delay
    setTimeout(() => {
      const response = getAutoResponse(inputText);
      const supportMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: "support",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, supportMessage]);
    }, 1000);
  };

  const getAutoResponse = (text: string): string => {
    const lowerText = text.toLowerCase();
    for (const response of AUTO_RESPONSES) {
      if (response.keywords.some((keyword) => lowerText.includes(keyword))) {
        return response.response;
      }
    }
    return `Cảm ơn bạn đã liên hệ! Để được hỗ trợ tốt nhất, vui lòng gọi hotline ${SUPPORT_INFO.hotline} hoặc gửi email đến ${SUPPORT_INFO.email}. Chúng tôi sẽ phản hồi sớm nhất!`;
  };

  const handleCall = () => {
    window.open(`tel:${SUPPORT_INFO.hotline}`, "_self");
  };

  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(true);
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setTimeout(() => setIsDragging(false), 100);
  };

  return (
    <>
      {/* Draggable Container */}
      <div
        ref={constraintsRef}
        className="fixed inset-0 pointer-events-none z-[999]"
        style={{ position: 'fixed', overflow: "hidden" }}
      />

      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0}
        dragConstraints={constraintsRef}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        initial={false}
        animate={{ x: 24, y: 24 }}
        className="fixed bottom-0 right-0 pointer-events-auto z-[999]"
        style={{ touchAction: "none" }}
      >
        {/* Chat Window */}
        <AnimatePresence>
          {isOpen && !isMinimized && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="absolute bottom-20 right-0 w-[320px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
              style={{ transformOrigin: "bottom right" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Headphones size={16} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">Hỗ trợ khách hàng</h3>
                      <div className="flex items-center gap-1 text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        <span className="opacity-90">Trực tuyến</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setIsMinimized(true)}
                      className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <Minimize2 size={16} />
                    </button>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={handleCall}
                    className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-2 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs font-semibold"
                  >
                    <PhoneCall size={14} />
                    Gọi ngay
                  </button>
                  <a
                    href={`mailto:${SUPPORT_INFO.email}`}
                    className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-2 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs font-semibold"
                  >
                    <Mail size={14} />
                    Email
                  </a>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-blue-50 px-3 py-2 border-b border-blue-100">
                <div className="flex items-center gap-1.5 text-xs text-blue-800">
                  <Clock size={12} />
                  <span className="font-medium">{SUPPORT_INFO.workingHours}</span>
                </div>
              </div>

              {/* Messages */}
              <div className="h-[300px] overflow-y-auto p-3 space-y-2 bg-gray-50 relative">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`flex gap-1.5 max-w-[85%] ${message.sender === "user" ? "flex-row-reverse" : ""}`}>
                      {/* Avatar */}
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.sender === "user"
                            ? "bg-gradient-to-br from-blue-500 to-indigo-600"
                            : "bg-gradient-to-br from-gray-400 to-gray-500"
                        }`}
                      >
                        {message.sender === "user" ? (
                          <User size={12} className="text-white" />
                        ) : (
                          <Headphones size={12} className="text-white" />
                        )}
                      </div>

                      {/* Message Bubble */}
                      <div>
                        <div
                          className={`px-3 py-2 rounded-2xl ${
                            message.sender === "user"
                              ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-tr-sm"
                              : "bg-white text-gray-800 border border-gray-200 rounded-tl-sm shadow-sm"
                          }`}
                        >
                          <p className="text-xs whitespace-pre-line leading-relaxed">{message.text}</p>
                        </div>
                        <p
                          className={`text-[10px] text-gray-500 mt-0.5 ${
                            message.sender === "user" ? "text-right" : "text-left"
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 bg-white border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 px-3 py-2 bg-gray-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                  <button
                    onClick={handleSend}
                    className="px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center justify-center"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Minimized State */}
        <AnimatePresence>
          {isOpen && isMinimized && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setIsMinimized(false)}
              className="absolute bottom-20 right-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-semibold"
            >
              <MessageCircle size={20} />
              <span>Hỗ trợ</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Floating Button */}
        <motion.button
          onClick={(e) => {
            if (!isDragging) {
              setIsOpen(!isOpen);
              setIsMinimized(false);
            }
          }}
          whileHover={{ scale: isOpen ? 1 : 1.1 }}
          whileTap={{ scale: 0.95 }}
          className={`relative transition-all ${
            isOpen
              ? "w-14 h-14 bg-gradient-to-br from-red-500 to-red-600"
              : "w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600"
          } text-white rounded-full shadow-2xl flex items-center justify-center cursor-pointer`}
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X size={24} />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageCircle size={28} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Notification Badge */}
          {!isOpen && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white"
            >
              !
            </motion.div>
          )}

          {/* Pulse Effect */}
          {!isOpen && (
            <motion.div
              className="absolute inset-0 rounded-full bg-blue-400"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.4, opacity: 0 }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </motion.button>
      </motion.div>
    </>
  );
}