import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router";
import {
  User, LogOut, FileText, LayoutDashboard, Settings, ChevronDown, Heart, Calendar, ClipboardCheck, Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface UserMenuProps {
  onLoginClick: () => void;
  isLight?: boolean;
}

export function UserMenu({ onLoginClick, isLight = false }: UserMenuProps) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!user) {
    return (
      <button
        onClick={onLoginClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
          isLight
            ? "border-white/40 text-white hover:bg-white/10"
            : "border-red-200 text-red-600 hover:bg-red-50"
        }`}
      >
        <User size={16} />
        Đăng nhập
      </button>
    );
  }

  const menuItems = [
    { icon: User, label: "Hồ sơ cá nhân", to: "/profile" },
    ...(user.role !== "admin" && user.role !== "moderator" ? [
      { icon: FileText, label: "Báo cáo của tôi", to: "/my-reports" },
      { icon: Heart, label: "Hoạt động của tôi", to: "/activities/my-activities" }
    ] : []),
    ...(user.role === "moderator" ? [
      { icon: Calendar, label: "Quản lý hoạt động", to: "/moderator/activities" },
      { icon: ClipboardCheck, label: "Xử lý báo cáo", to: "/moderator/issues" }
    ] : []),
    ...(user.role === "admin" ? [
      { icon: LayoutDashboard, label: "Thống kê", to: "/dashboard" },
      { icon: Users, label: "Quản lý người dùng & phân quyền", to: "/admin/users" }
    ] : []),
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl transition-all duration-200 group ${
          isLight ? "hover:bg-white/10" : "hover:bg-gray-100"
        }`}
      >
        <div className={`w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-2 transition-all ${
          isLight 
            ? "bg-white/20 ring-white/40 group-hover:ring-white/60" 
            : "bg-red-100 ring-red-200 group-hover:ring-red-400"
        }`}>
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full flex items-center justify-center font-bold text-sm ${
              isLight ? "text-white" : "text-red-600"
            }`}>
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="hidden sm:block text-left">
          <div className={`text-sm font-semibold leading-tight ${
            isLight ? "text-white" : "text-gray-900"
          }`}>{user.name}</div>
          <div className={`text-xs leading-tight ${
            isLight ? "text-white/70" : "text-gray-400"
          }`}>{user.city || "Việt Nam"}</div>
        </div>
        <ChevronDown size={14} className={`transition-transform duration-200 ${
          open ? "rotate-180" : ""
        } ${isLight ? "text-white/70" : "text-gray-400"}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
          >
            {/* User info header */}
            <div className="p-4 bg-gradient-to-br from-red-50 to-orange-50 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-red-100 ring-2 ring-red-200">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-red-600 font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="overflow-hidden">
                  <div className="text-sm font-bold text-gray-900 truncate">{user.name}</div>
                  <div className="text-xs text-gray-500 truncate">{user.email}</div>
                </div>
              </div>
              <div className="flex gap-3 mt-3 text-xs text-gray-500">
                <span><span className="font-bold text-gray-900">{user.reportsCount}</span> báo cáo</span>
                <span><span className="font-bold text-gray-900">{user.resolvedCount}</span> đã giải quyết</span>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2">
              {menuItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-all duration-150 group"
                >
                  <item.icon size={16} className="text-gray-400 group-hover:text-red-500 transition-colors" />
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="p-2 border-t border-gray-100">
              <button
                onClick={() => { logout(); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-all duration-150"
              >
                <LogOut size={16} />
                Đăng xuất
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}