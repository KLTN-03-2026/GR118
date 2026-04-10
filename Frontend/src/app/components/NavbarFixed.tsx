import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin, LayoutDashboard, FileText, PlusCircle, Menu, X, Shield, Settings, Heart, ClipboardCheck, Users, BarChart3,
  User, LogOut, Calendar, Key, ShieldCheck,
} from "lucide-react";
import { AuthModal } from "./AuthModal";
import { UserMenu } from "./UserMenu";
import { useAuth } from "../context/AuthContext";
import { NotificationBell } from "./NotificationBell";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "./ui/drawer";

const navLinks = [
  { to: "/", label: "Trang chủ", icon: MapPin },
  { to: "/issues", label: "Vấn đề", icon: FileText },
  { to: "/activities", label: "Tình nguyện", icon: Heart },
];

export function Navbar() {
  const location = useLocation();
  const { user, logout, can } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setAdminMenuOpen(false);
  }, [location.pathname]);

  const openLogin = () => { setAuthTab("login"); setAuthOpen(true); };
  const openRegister = () => { setAuthTab("register"); setAuthOpen(true); };

  // Check for any staff-level permission to show admin/moderator menus
  const hasStaffAccess = can("issues_mgnt", "read") || 
                        can("issues_process", "read") || 
                        can("activities_mgnt", "read") ||
                        can("stats_overview", "read");

  // Kiểm tra xem có đang ở trang chủ và chưa scroll không
  const isHomePageTop = location.pathname === "/" && !scrolled;

  return (
    <>
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-lg shadow-black/5"
            : "bg-transparent"
        }`}
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                <Shield size={18} className="text-white" />
              </div>
              <div className="hidden sm:block">
                <span className={`font-black text-lg transition-colors duration-300 ${
                  isHomePageTop ? "text-white" : "text-[#1a1a2e]"
                }`}>Báo Cáo</span>
                <span className="font-black text-red-600 text-lg">VN</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {!hasStaffAccess && navLinks.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? isHomePageTop ? "text-white" : "text-red-600"
                        : isHomePageTop 
                          ? "text-white/90 hover:text-white hover:bg-white/10" 
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    {isActive && !isHomePageTop && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute inset-0 bg-red-50 rounded-xl border border-red-100"
                        transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
                      />
                    )}
                    {isActive && isHomePageTop && (
                      <div className="absolute inset-0 bg-white/10 rounded-xl border border-white/20" />
                    )}
                    <link.icon size={16} className="relative z-10" />
                    <span className="relative z-10">{link.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <NotificationBell isLight={isHomePageTop} />

              {can("issues_vande", "create") && (
                <Link
                  to="/report"
                  className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-red-200 hover:shadow-red-300 hover:scale-105 transition-all duration-200"
                >
                  <PlusCircle size={16} />
                  {hasStaffAccess ? "Báo cáo vấn đề" : "Báo cáo ngay"}
                </Link>
              )}

              {/* Auth */}
              {!hasStaffAccess && (
                <div className="hidden lg:block">
                  <UserMenu onLoginClick={openLogin} isLight={isHomePageTop} />
                </div>
              )}

              {/* Hamburger cho Admin/Moderator (Desktop & Mobile) */}
              {hasStaffAccess && (
                <button
                  onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                  className={`p-2 rounded-xl transition-all duration-200 ${
                    isHomePageTop 
                      ? "text-white hover:bg-white/10" 
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  title="Menu quản lý"
                >
                  {adminMenuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
              )}

              {/* Hamburger cho mobile (chỉ user thường) */}
              {!hasStaffAccess && (
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className={`lg:hidden p-2 rounded-xl transition-all duration-200 ${
                    isHomePageTop 
                      ? "text-white hover:bg-white/10" 
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {menuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Admin/Moderator Menu Drawer */}
      <Drawer open={adminMenuOpen} onOpenChange={setAdminMenuOpen} direction="right">
        <DrawerContent className="bg-white">
          <DrawerHeader className="border-b border-gray-100">
            <DrawerTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Shield size={16} className="text-white" />
              </div>
              <div>
                <span className="font-black text-[#1a1a2e]">Menu Quản Lý</span>
              </div>
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              Menu quản lý dành cho admin và cán bộ
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="overflow-y-auto p-4 pb-6 flex flex-col gap-2">
            {/* User Info */}
            {user && (
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 mb-3">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-indigo-100 ring-2 ring-indigo-200 flex-shrink-0">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-indigo-600 font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="overflow-hidden flex-1">
                    <div className="text-sm font-bold text-gray-900 truncate">{user.name}</div>
                    <div className="text-xs text-gray-500 truncate">{user.email}</div>
                    <div className="text-xs font-semibold text-indigo-600 mt-1 uppercase">
                      {user.roleName || user.role}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <div className="mb-4">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
                Điều hướng chung
              </div>
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-red-50 text-red-600 border border-red-100"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <link.icon size={18} />
                    {link.label}
                  </Link>
                );
              })}
            </div>
            
            {/* Admin/Moderator Section - Dynamically filtered */}
            <div className="mb-4">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
                Chức năng quản trị
              </div>
              
              {can("stats_overview", "read") && (
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    location.pathname === "/dashboard"
                      ? "bg-blue-50 text-blue-600 border border-blue-100"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <LayoutDashboard size={18} />
                  Thống kê tổng quan
                </Link>
              )}

              {can("issues_mgnt", "read") && (
                <Link
                  to="/admin"
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    location.pathname === "/admin"
                      ? "bg-orange-50 text-orange-600 border border-orange-100"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Settings size={18} />
                  Quản lý báo cáo
                </Link>
              )}

              {can("issues_process", "read") && (
                <Link
                  to="/moderator/issues"
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    location.pathname === "/moderator/issues"
                      ? "bg-indigo-50 text-indigo-600 border border-indigo-100"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <ClipboardCheck size={18} />
                  Xử lý báo cáo
                </Link>
              )}

              {can("users_mgnt", "read") && (
                <Link
                  to="/admin/users"
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    location.pathname === "/admin/users"
                      ? "bg-violet-50 text-violet-600 border border-violet-100"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Users size={18} />
                  Quản lý người dùng
                </Link>
              )}

              {can("reports_stats", "read") && (
                <Link
                  to="/statistics"
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    location.pathname === "/statistics"
                      ? "bg-purple-50 text-purple-600 border border-purple-100"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <BarChart3 size={18} />
                  Thống kê báo cáo
                </Link>
              )}

              {can("activities_mgnt", "read") && (
                <Link
                  to="/moderator/activities"
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    location.pathname === "/moderator/activities"
                      ? "bg-green-50 text-green-600 border border-green-100"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Calendar size={18} />
                  Quản lý hoạt động
                </Link>
              )}

              {can("perms_mgnt", "read") && (
                <Link
                  to="/admin/permissions"
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    location.pathname.startsWith("/admin/permissions")
                      ? "bg-amber-50 text-amber-600 border border-amber-100"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Key size={18} />
                  Quản lý quyền
                </Link>
              )}

              {can("roles_mgnt", "read") && (
                <Link
                  to="/admin/roles"
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    location.pathname.startsWith("/admin/roles")
                      ? "bg-rose-50 text-rose-600 border border-rose-100"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <ShieldCheck size={18} />
                  Quản lý vai trò
                </Link>
              )}
            </div>

            {/* User Section */}
            <div className="border-t border-gray-100 pt-4">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
                Tài khoản
              </div>
              <Link
                to="/profile"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 mb-2"
              >
                <User size={18} />
                Hồ sơ cá nhân
              </Link>
              <Link
                to="/my-reports"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 mb-2"
              >
                <FileText size={18} />
                Báo cáo của tôi
              </Link>
              <Link
                to="/activities/my-activities"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 mb-2"
              >
                <Heart size={18} />
                Hoạt động của tôi
              </Link>
              <button
                onClick={() => { logout(); setAdminMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50"
              >
                <LogOut size={18} />
                Đăng xuất
              </button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Mobile Drawer (for regular users) */}
      <Drawer open={menuOpen} onOpenChange={setMenuOpen} direction="right">
        <DrawerContent className="bg-white">
          <DrawerHeader className="border-b border-gray-100">
            <DrawerTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                <Shield size={16} className="text-white" />
              </div>
              <div>
                <span className="font-black text-[#1a1a2e]">Báo Cáo</span>
                <span className="font-black text-red-600">VN</span>
              </div>
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              Menu điều hướng chính
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="overflow-y-auto p-4 pb-6 flex flex-col gap-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-red-50 text-red-600 border border-red-100"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <link.icon size={18} />
                  {link.label}
                </Link>
              );
            })}
            
            {can("issues_vande", "create") && (
              <Link
                to="/report"
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-red-200 mt-2"
              >
                <PlusCircle size={16} />
                Báo cáo vấn đề ngay
              </Link>
            )}
            
            {!user ? (
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => { openLogin(); setMenuOpen(false); }}
                  className="flex-1 py-2.5 border-2 border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => { openRegister(); setMenuOpen(false); }}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors"
                >
                  Đăng ký
                </button>
              </div>
            ) : (
              <div className="pt-2 border-t border-gray-100 mt-2">
                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 mb-3">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-red-100 ring-2 ring-red-200 flex-shrink-0">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-red-600 font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="overflow-hidden flex-1">
                      <div className="text-sm font-bold text-gray-900 truncate">{user.name}</div>
                      <div className="text-xs text-gray-500 truncate">{user.email}</div>
                    </div>
                  </div>
                  <div className="flex gap-3 text-xs text-gray-500">
                    <span><span className="font-bold text-gray-900">{user.reportsCount || 0}</span> báo cáo</span>
                    <span><span className="font-bold text-gray-900">{user.resolvedCount || 0}</span> đã giải quyết</span>
                  </div>
                </div>
                
                <Link
                  to="/profile"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 mb-2"
                >
                  <User size={18} />
                  Hồ sơ cá nhân
                </Link>
                <Link
                  to="/my-reports"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 mb-2"
                >
                  <FileText size={18} />
                  Báo cáo của tôi
                </Link>
                <Link
                  to="/activities/my-activities"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 mb-2"
                >
                  <Heart size={18} />
                  Hoạt động của tôi
                </Link>
                {can("activities_mgnt", "read") && (
                  <Link
                    to="/moderator/activities"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 mb-2"
                  >
                    <Calendar size={18} />
                    Quản lý hoạt động
                  </Link>
                )}
                <button
                  onClick={() => { logout(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50"
                >
                  <LogOut size={18} />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Auth Modal */}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} defaultTab={authTab} />
    </>
  );
}
