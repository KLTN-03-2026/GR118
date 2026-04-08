import { motion, useScroll, useTransform } from "motion/react";
import { Link, useNavigate } from "react-router";
import {
  PlusCircle,
  ArrowRight,
  Sparkles,
  Shield,
  TrendingUp,
  Users,
  CheckCircle2,
  MapPin,
  Zap,
  Eye,
  Calendar,
  Clock,
  Heart,
} from "lucide-react";
import { useRef, useState } from "react";
import { IssueCard } from "../components/IssueCard";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "../data/issues";
import { useIssues } from "../context/IssuesContext";
import { useAuth } from "../context/AuthContext";
import { AuthModal } from "../components/AuthModal";
import { useActivities } from "../context/ActivitiesContext";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

const HERO_IMAGE = "https://images.unsplash.com/photo-1600440684297-d84c1789e058?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200";

const stats = [
  { label: "Vấn đề đã báo cáo", value: "12,847", icon: FileIcon, color: "#ef4444" },
  { label: "Đã giải quyết", value: "9,231", icon: CheckCircle2, color: "#10b981" },
  { label: "Người dùng tích cực", value: "45,000+", icon: Users, color: "#3b82f6" },
  { label: "Tỉnh thành", value: "63", icon: MapPin, color: "#f59e0b" },
];

function FileIcon(props: any) {
  return <TrendingUp {...props} />;
}

const features = [
  {
    icon: Sparkles,
    title: "AI Nhận dạng thông minh",
    desc: "Tự động phân tích ảnh và phân loại vấn đề với độ chính xác lên đến 96%",
    color: "#8b5cf6",
    bg: "#f5f3ff",
  },
  {
    icon: Zap,
    title: "Xử lý nhanh chóng",
    desc: "Kết nối trực tiếp với cơ quan chức năng, đảm bảo phản hồi trong 48 giờ",
    color: "#f59e0b",
    bg: "#fffbeb",
  },
  {
    icon: Eye,
    title: "Theo dõi minh bạch",
    desc: "Cập nhật trạng thái xử lý theo thời gian thực, minh bạch và công khai",
    color: "#10b981",
    bg: "#f0fdf4",
  },
  {
    icon: Shield,
    title: "Bảo mật thông tin",
    desc: "Thông tin người báo cáo được bảo vệ tuyệt đối theo quy định nhà nước",
    color: "#ef4444",
    bg: "#fff1f2",
  },
];



export function HomePage() {
  const { issues } = useIssues();
  
  const categories = Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
    key,
    label,
    color: CATEGORY_COLORS[key as keyof typeof CATEGORY_COLORS],
    count: issues.filter((i) => i.category === key).length,
  }));

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ 
    target: heroRef, 
    offset: ["start start", "end start"],
    layoutEffect: false
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const navigate = useNavigate();
  const { user } = useAuth();
  const { activities } = useActivities();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const handleReportClick = () => {
    if (!user) {
      setAuthModalOpen(true);
    } else {
      navigate("/report");
    }
  };

  // Lấy 3 hoạt động gần nhất
  const recentActivities = activities
    .filter((a) => a.status !== "cancelled")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  return (
    <div className="overflow-x-hidden relative">
      {/* Hero Section */}
      <section ref={heroRef} style={{ position: 'relative' }} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* BG Image parallax */}
        <motion.div
          style={{ y: heroY }}
          className="absolute inset-0 z-0"
        >
          <img src={HERO_IMAGE} alt="Vietnam city" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e]/90 via-[#1a1a2e]/70 to-red-900/50" />
        </motion.div>

        {/* Animated blobs */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute w-96 h-96 rounded-full bg-red-500/20 blur-3xl"
            animate={{ x: [0, 80, 0], y: [0, -60, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            style={{ top: "20%", left: "5%" }}
          />
          <motion.div
            className="absolute w-64 h-64 rounded-full bg-blue-500/20 blur-3xl"
            animate={{ x: [0, -60, 0], y: [0, 80, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            style={{ bottom: "20%", right: "10%" }}
          />
        </div>

        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative z-10 text-center px-4 max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm mb-6"
          >
            <Sparkles size={14} className="text-yellow-400" />
            Tích hợp trí tuệ nhân tạo thế hệ mới
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6 leading-tight"
          >
            Hệ thống Báo cáo
            <br />
            <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              Vấn đề Công cộng
            </span>
            <br />
            Việt Nam
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="text-gray-300 text-lg sm:text-xl mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            Kết nối cộng đồng với chính quyền. Báo cáo vấn đề công cộng dễ dàng, 
            AI tự động nhận dạng và phân loại, theo dõi tiến độ xử lý minh bạch.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/report"
              className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl font-semibold shadow-2xl shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105 transition-all duration-300"
            >
              <PlusCircle size={20} />
              Báo cáo vấn đề ngay
            </Link>
            <Link
              to="/issues"
              className="flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-2xl font-semibold hover:bg-white/20 transition-all duration-300"
            >
              Xem vấn đề gần đây
              <ArrowRight size={18} />
            </Link>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-6 h-10 rounded-full border-2 border-white/40 flex items-start justify-center pt-2"
            >
              <div className="w-1.5 h-3 rounded-full bg-white/60" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Bar */}
      <section className="py-8 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex items-center gap-4"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: stat.color + "15" }}
                >
                  <stat.icon size={22} style={{ color: stat.color }} />
                </div>
                <div>
                  <div className="text-2xl font-black text-gray-900">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-red-600 font-semibold text-sm uppercase tracking-widest">Tính năng nổi bật</span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mt-2">
              Công nghệ hiện đại cho cộng đồng
            </h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              Ứng dụng trí tuệ nhân tạo tiên tiến giúp việc báo cáo và xử lý vấn đề nhanh hơn bao giờ hết
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-shadow duration-300 border border-gray-100"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: feature.bg }}
                >
                  <feature.icon size={22} style={{ color: feature.color }} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Demo Section */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="flex-1"
            >
              <span className="text-purple-600 font-semibold text-sm uppercase tracking-widest">AI Thông minh</span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mt-2 mb-4">
                Nhận dạng vấn đề <br />
                <span className="text-purple-600">chỉ bằng 1 ảnh chụp</span>
              </h2>
              <p className="text-gray-500 leading-relaxed mb-6">
                Hệ thống AI của chúng tôi sử dụng mô hình học sâu tiên tiến để phân tích hình ảnh, 
                tự động nhận dạng loại vấn đề, vị trí và mức độ nghiêm trọng chỉ trong vài giây.
              </p>
              <ul className="space-y-3">
                {[
                  "Phân loại 6+ loại vấn đề công cộng",
                  "Độ chính xác trung bình 91%",
                  "Xử lý ảnh trong dưới 3 giây",
                  "Liên tục học hỏi và cải thiện",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-gray-600">
                    <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/report"
                className="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-medium hover:scale-105 transition-transform duration-200 shadow-lg shadow-purple-200"
              >
                <Sparkles size={16} />
                Thử ngay AI nhận dạng
                <ArrowRight size={16} />
              </Link>
            </motion.div>

            {/* AI Visual */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="flex-1 w-full max-w-md"
            >
              <div className="relative">
                <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                  <img
                    src="https://images.unsplash.com/photo-1758486158509-3134ec0b9ab0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600"
                    alt="AI analysis"
                    className="w-full h-64 object-cover"
                  />
                </div>

                {/* AI overlay cards */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                  className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3 border border-purple-100"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Sparkles size={18} className="text-purple-600" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">AI phân tích</div>
                    <div className="font-bold text-gray-900 text-sm">Ổ gà - Hư hỏng</div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.7 }}
                  className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-4 border border-green-100"
                >
                  <div className="text-xs text-gray-500 mb-1">Độ chính xác</div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: "94%" }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.9, duration: 0.8 }}
                        className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full"
                      />
                    </div>
                    <span className="font-bold text-green-600 text-sm">94%</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl font-black text-gray-900">Danh mục vấn đề</h2>
            <p className="text-gray-500 mt-2">Chọn danh mục để báo cáo nhanh hơn</p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.key}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                className="bg-white rounded-2xl p-5 text-center shadow-sm hover:shadow-lg transition-shadow duration-300 cursor-pointer border-2 border-transparent hover:border-gray-200"
              >
                <div
                  className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                  style={{ backgroundColor: cat.color + "20" }}
                >
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                </div>
                <div className="text-sm font-semibold text-gray-700">{cat.label}</div>
                <div className="text-xs text-gray-400 mt-1">{cat.count} vấn đề</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Issues */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-black text-gray-900">Vấn đề gần đây</h2>
              <p className="text-gray-500 mt-1">Được báo cáo bởi cộng đồng</p>
            </motion.div>
            <Link
              to="/issues"
              className="flex items-center gap-1.5 text-red-600 font-medium text-sm hover:gap-2.5 transition-all duration-200"
            >
              Xem tất cả <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {issues.slice(0, 3).map((issue, i) => (
              <IssueCard key={issue.id} issue={issue} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Recent Activities - Tình nguyện gần đây */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-black text-gray-900">Tình nguyện gần đây</h2>
              <p className="text-gray-500 mt-1">Cùng chung tay xây dựng cộng đồng</p>
            </motion.div>
            <Link
              to="/activities"
              className="flex items-center gap-1.5 text-green-600 font-medium text-sm hover:gap-2.5 transition-all duration-200"
            >
              Xem tất cả <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentActivities.map((activity, i) => {
              const daysUntil = Math.ceil(
                (new Date(activity.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );
              const spotsLeft = activity.maxParticipants - activity.currentParticipants;
              
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <Link to={`/activities/${activity.id}`}>
                    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0 h-full">
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={activity.imageUrl}
                          alt={activity.title}
                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute top-4 left-4">
                          <Badge
                            className={`${
                              activity.status === "upcoming"
                                ? "bg-blue-500"
                                : activity.status === "ongoing"
                                ? "bg-green-500"
                                : "bg-gray-500"
                            } text-white`}
                          >
                            {activity.status === "upcoming"
                              ? "Sắp diễn ra"
                              : activity.status === "ongoing"
                              ? "Đang diễn ra"
                              : "Đã kết thúc"}
                          </Badge>
                        </div>
                      </div>

                      <div className="p-6">
                        <h3 className="font-bold text-lg mb-2 text-gray-900 line-clamp-2">
                          {activity.title}
                        </h3>
                        <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                          {activity.description}
                        </p>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar size={16} className="text-green-600" />
                            <span>
                              {new Date(activity.date).toLocaleDateString("vi-VN", {
                                weekday: "short",
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock size={16} className="text-green-600" />
                            <span>{activity.time}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin size={16} className="text-green-600" />
                            <span className="line-clamp-1">{activity.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Users size={16} className="text-green-600" />
                            <span>
                              {activity.currentParticipants}/{activity.maxParticipants} người
                            </span>
                          </div>
                        </div>

                        {activity.status === "upcoming" && spotsLeft > 0 && (
                          <div className="flex items-center justify-between pt-4 border-t">
                            <div className="flex items-center gap-2">
                              <Heart size={16} className="text-red-500 fill-red-500" />
                              <span className="text-sm text-gray-600">
                                {spotsLeft} chỗ trống
                              </span>
                            </div>
                            {daysUntil > 0 && (
                              <Badge variant="outline" className="text-xs">
                                Còn {daysUntil} ngày
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {recentActivities.length === 0 && (
            <div className="text-center py-12">
              <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Chưa có hoạt động tình nguyện nào</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] to-red-900" />
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-red-500/20 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-blue-500/20 blur-3xl" />
        </motion.div>

        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-black text-white mb-4">
              Cùng xây dựng cộng đồng văn minh hơn!
            </h2>
            <p className="text-gray-300 text-lg mb-8">
              Mỗi báo cáo của bạn là một đóng góp cho thành phố tốt đẹp hơn. 
              Hãy hành động ngay hôm nay!
            </p>
            <Link
              to="/report"
              className="inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl font-bold text-lg shadow-2xl shadow-red-500/30 hover:scale-105 transition-all duration-300"
            >
              <PlusCircle size={22} />
              Báo cáo vấn đề ngay
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}