import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell,
  MessageSquare,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  X,
  Trash2,
  Check,
  ExternalLink,
} from "lucide-react";
import { useNotifications } from "../context/NotificationContext";
import { Link } from "react-router";

const NOTIFICATION_ICONS = {
  comment: MessageSquare,
  verification: ShieldCheck,
  status_change: CheckCircle2,
  admin_review: ShieldCheck,
  admin_warning: AlertTriangle,
  new_issue: MapPin,
};

const NOTIFICATION_COLORS = {
  comment: "text-blue-600 bg-blue-50",
  verification: "text-green-600 bg-green-50",
  status_change: "text-purple-600 bg-purple-50",
  admin_review: "text-cyan-600 bg-cyan-50",
  admin_warning: "text-red-600 bg-red-50",
  new_issue: "text-orange-600 bg-orange-50",
};

export function NotificationBell({ isLight = false }: { isLight?: boolean }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAll } =
    useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Animate bell when new notification arrives
  useEffect(() => {
    if (unreadCount > 0) {
      setShowAnimation(true);
      const timer = setTimeout(() => setShowAnimation(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    if (notification.link) {
      setIsOpen(false);
    }
  };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Vừa xong";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-xl transition-all duration-200 ${
          isOpen
            ? "bg-blue-50 text-blue-600"
            : isLight
              ? "text-white hover:bg-white/10"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        } ${showAnimation ? "animate-bounce" : ""}`}
      >
        <Bell size={20} className={showAnimation ? "animate-pulse" : ""} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <Bell size={18} className="text-blue-600" />
                  Thông báo
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/50 rounded-lg transition-colors"
                >
                  <X size={16} className="text-gray-500" />
                </button>
              </div>
              {notifications.length > 0 && (
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="px-3 py-1.5 bg-blue-500 text-white text-xs font-semibold rounded-lg hover:bg-blue-600 transition-all flex items-center gap-1"
                    >
                      <Check size={12} />
                      Đánh dấu tất cả đã đọc
                    </button>
                  )}
                  <button
                    onClick={clearAll}
                    className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-200 transition-all flex items-center gap-1"
                  >
                    <Trash2 size={12} />
                    Xóa tất cả
                  </button>
                </div>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-[28rem] overflow-y-auto relative">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell size={48} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium mb-1">Chưa có thông báo</p>
                  <p className="text-sm text-gray-400">
                    Thông báo của bạn sẽ xuất hiện ở đây
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification, index) => {
                    const Icon = NOTIFICATION_ICONS[notification.type];
                    const colorClass = NOTIFICATION_COLORS[notification.type];

                    const content = (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`p-4 hover:bg-gray-50 transition-all cursor-pointer relative ${
                          !notification.isRead ? "bg-blue-50/30" : ""
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        {/* Unread indicator */}
                        {!notification.isRead && (
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full" />
                        )}

                        <div className="flex gap-3 ml-2">
                          {/* Icon */}
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                            <Icon size={18} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className={`text-sm font-bold ${!notification.isRead ? "text-gray-900" : "text-gray-700"}`}>
                                {notification.title}
                              </h4>
                              {notification.link && (
                                <ExternalLink size={12} className="text-gray-400 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400">
                                {getRelativeTime(notification.createdAt)}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                                className="p-1 hover:bg-red-100 rounded transition-colors group"
                              >
                                <Trash2 size={12} className="text-gray-400 group-hover:text-red-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );

                    if (notification.link) {
                      return (
                        <Link
                          key={notification.id}
                          to={notification.link}
                          className="block"
                        >
                          {content}
                        </Link>
                      );
                    }

                    return <div key={notification.id}>{content}</div>;
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}