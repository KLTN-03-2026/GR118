import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "motion/react";
import {
  MessageCircle,
  X,
  Send,
  User,
  Clock,
  Minimize2,
  PhoneCall,
  Mail,
  Headphones,
  Bot,
  Sparkles,
} from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "support";
  timestamp: Date;
}

interface HistoryEntry {
  role: "user" | "model";
  content: string;
}

// Backend AI chat endpoint
const CHAT_URL = "http://localhost:8081/api/v1/ai/chat";

const SUPPORT_INFO = {
  hotline: "1900-xxxx",
  email: "hotro@baocao.vn",
  workingHours: "8:00 - 22:00 (Thứ 2 - CN)",
};

const SUGGESTIONS = [
  "Có bao nhiêu báo cáo đang chờ xử lý?",
  "Hoạt động tình nguyện nào sắp diễn ra?",
  "Cách gửi báo cáo vấn đề đô thị?",
];

export function SupportChatBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Xin chào! 👋 Tôi là trợ lý AI của hệ thống Báo cáo Đô thị.\nTôi có thể giúp bạn:\n• Kiểm tra số lượng báo cáo đang diễn ra\n• Xem lịch hoạt động tình nguyện\n• Hướng dẫn sử dụng hệ thống\n\nBạn cần hỗ trợ gì? 😊",
      sender: "support",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, isMinimized]);

  const sendToAI = async (userText: string): Promise<string> => {
    setIsTyping(true);
    try {
      const res = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, history: history.slice(-8) }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const reply = data.reply || "Xin lỗi, tôi không thể phản hồi lúc này.";
      setHistory((prev) => [
        ...prev,
        { role: "user", content: userText },
        { role: "model", content: reply },
      ]);
      return reply;
    } catch (err) {
      console.error("[ChatBox] AI Error:", err);
      return `⚠️ Trợ lý AI tạm thời không khả dụng. Vui lòng thử lại sau hoặc gọi hotline ${SUPPORT_INFO.hotline}! 🙏`;
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || isTyping) return;
    const userText = inputText.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      text: userText,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    const reply = await sendToAI(userText);
    setMessages((prev) => [
      ...prev,
      { id: (Date.now() + 1).toString(), text: reply, sender: "support", timestamp: new Date() },
    ]);
  };

  const handleSuggestion = (text: string) => {
    setInputText(text);
    inputRef.current?.focus();
  };

  const handleCall = () => {
    window.open(`tel:${SUPPORT_INFO.hotline}`, "_self");
  };

  const handleDrag = (_event: MouseEvent | TouchEvent | PointerEvent, _info: PanInfo) => {
    setIsDragging(true);
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, _info: PanInfo) => {
    setTimeout(() => setIsDragging(false), 100);
  };

  return (
    <>
      {/* Drag constraint overlay */}
      <div
        ref={constraintsRef}
        className="fixed inset-0 pointer-events-none z-[999]"
        style={{ position: "fixed", overflow: "hidden" }}
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
              className="absolute bottom-20 right-0 w-[340px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
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
                      <h3 className="font-bold text-sm">Hỗ trợ AI</h3>
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

              {/* Info bar */}
              <div className="bg-blue-50 px-3 py-2 border-b border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-blue-800">
                  <Clock size={12} />
                  <span className="font-medium">{SUPPORT_INFO.workingHours}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded-full">
                  <Sparkles size={10} />
                  <span>Gemini AI</span>
                </div>
              </div>

              {/* Messages */}
              <div className="h-[300px] overflow-y-auto p-3 space-y-2 bg-gray-50">
                {/* Suggestion chips — show only at start */}
                {messages.length <= 1 && (
                  <div className="flex flex-wrap gap-1 pb-1">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSuggestion(s)}
                        className="text-[10px] px-2 py-1 rounded-full border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors text-left"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`flex gap-1.5 max-w-[85%] ${message.sender === "user" ? "flex-row-reverse" : ""}`}>
                      {/* Avatar */}
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          message.sender === "user"
                            ? "bg-gradient-to-br from-blue-500 to-indigo-600"
                            : "bg-gradient-to-br from-indigo-500 to-violet-600"
                        }`}
                      >
                        {message.sender === "user" ? (
                          <User size={12} className="text-white" />
                        ) : (
                          <Bot size={12} className="text-white" />
                        )}
                      </div>

                      {/* Bubble */}
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
                          className={`text-[10px] text-gray-400 mt-0.5 ${
                            message.sender === "user" ? "text-right" : "text-left"
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                <AnimatePresence>
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="flex justify-start"
                    >
                      <div className="flex gap-1.5 items-end">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                          <Bot size={12} className="text-white" />
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm shadow-sm px-3 py-2.5 flex gap-1 items-center">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                              animate={{ y: [0, -4, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 bg-white border-t border-gray-100">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    placeholder={isTyping ? "AI đang trả lời..." : "Hỏi AI về báo cáo, tình nguyện..."}
                    disabled={isTyping}
                    className="flex-1 px-3 py-2 bg-gray-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs disabled:opacity-60 transition-all"
                  />
                  <button
                    onClick={handleSend}
                    disabled={isTyping || !inputText.trim()}
                    className="px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={15} />
                  </button>
                </div>
                <p className="text-[9px] text-gray-400 mt-1.5 text-center">
                  Powered by Gemini AI · Dữ liệu cập nhật theo thời gian thực
                </p>
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
              <span>Trợ lý AI</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Floating Button */}
        <motion.button
          onClick={() => {
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
          } text-white rounded-full shadow-2xl flex items-center justify-center`}
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

          {/* Badge */}
          {!isOpen && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white"
            >
              <Sparkles size={10} className="text-white" />
            </motion.div>
          )}

          {/* Pulse */}
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