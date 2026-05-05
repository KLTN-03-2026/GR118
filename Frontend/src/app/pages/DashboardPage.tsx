import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area,
} from "recharts";
import { TrendingUp, CheckCircle2, Clock, AlertCircle, Users, Sparkles, MapPin, ShieldAlert } from "lucide-react";
import { CATEGORY_LABELS, CATEGORY_COLORS, STATUS_LABELS, STATUS_COLORS } from "../data/issues";
import { useAuth } from "../context/AuthContext";
import { PageTitle } from "../components/PageTitle";
import { useIssues } from "../context/IssuesContext";

const aiAccuracyData = [
  { month: "T9", accuracy: 82 },
  { month: "T10", accuracy: 85 },
  { month: "T11", accuracy: 87 },
  { month: "T12", accuracy: 89 },
  { month: "T1", accuracy: 91 },
  { month: "T2", accuracy: 93 },
  { month: "T3", accuracy: 94 },
];

function StatCard({ card, index }: { card: any; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100"
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: card.bg }}
        >
          <card.icon size={20} style={{ color: card.color }} />
        </div>
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-full ${
            card.change.startsWith("+") ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
          }`}
        >
          {card.change}
        </span>
      </div>
      <div className="text-2xl font-black text-gray-900">{card.value}</div>
      <div className="text-sm font-medium text-gray-600 mt-0.5">{card.label}</div>
      <div className="text-xs text-gray-400 mt-1">{card.desc}</div>
    </motion.div>
  );
}

export function DashboardPage() {
  const { can } = useAuth();
  const { issues } = useIssues();
  const [serverStats, setServerStats] = useState<any>(null);

  const [stats, setStats] = useState([
    { label: "Tổng báo cáo", value: "...", change: "+0%", icon: TrendingUp, color: "#ef4444", bg: "#fff1f2", desc: "đang tải..." },
    { label: "Đã giải quyết", value: "...", change: "+0%", icon: CheckCircle2, color: "#10b981", bg: "#f0fdf4", desc: "đang tải..." },
    { label: "Đang xử lý", value: "...", change: "-0%", icon: Clock, color: "#3b82f6", bg: "#eff6ff", desc: "đang tải..." },
    { label: "Chờ xử lý", value: "...", change: "+0%", icon: AlertCircle, color: "#f59e0b", bg: "#fffbeb", desc: "đang tải..." },
    { label: "Người dùng", value: "...", change: "+0%", icon: Users, color: "#8b5cf6", bg: "#f5f3ff", desc: "đang tải..." },
    { label: "AI Chính xác", value: "...", change: "+0%", icon: Sparkles, color: "#ec4899", bg: "#fdf2f8", desc: "đang tải..." },
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { api } = await import("../../utils/api");
        const res = await api.get("/auth/stats");
        if (res.success && res.data) {
          const d = res.data;
          setServerStats(d);
          setStats([
            { label: "Tổng báo cáo", value: d.totalReports.toLocaleString(), change: d.growth?.reports || "+0%", icon: TrendingUp, color: "#ef4444", bg: "#fff1f2", desc: "so với tháng trước" },
            { label: "Đã giải quyết", value: d.resolvedReports.toLocaleString(), change: d.growth?.resolved || "+0%", icon: CheckCircle2, color: "#10b981", bg: "#f0fdf4", desc: `tỷ lệ ${d.completionRate}%` },
            { label: "Đang xử lý", value: d.processingReports.toLocaleString(), change: "-5.3%", icon: Clock, color: "#3b82f6", bg: "#eff6ff", desc: "trung bình 3.2 ngày" },
            { label: "Chờ xử lý", value: d.pendingReports.toLocaleString(), change: "+2.1%", icon: AlertCircle, color: "#f59e0b", bg: "#fffbeb", desc: "cần ưu tiên xử lý" },
            { label: "Người dùng", value: d.totalUsers.toLocaleString(), change: d.growth?.users || "+0%", icon: Users, color: "#8b5cf6", bg: "#f5f3ff", desc: "đăng ký sử dụng" },
            { label: "AI Chính xác", value: `${d.aiAccuracy}%`, change: "+1.2%", icon: Sparkles, color: "#ec4899", bg: "#fdf2f8", desc: "so với lúc bắt đầu" },
          ]);
        }
      } catch (err) {
        console.error("Dashboard stats fetch error:", err);
      }
    };
    fetchStats();
  }, []);

  const categoryData = Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
    name: label.split(" ")[0],
    count: issues.filter((i) => i.category === key).length,
    color: CATEGORY_COLORS[key as keyof typeof CATEGORY_COLORS],
  }));

  const statusData = Object.entries(STATUS_LABELS).map(([key, label]) => ({
    name: label,
    value: issues.filter((i) => i.status === key).length,
    color: STATUS_COLORS[key as keyof typeof STATUS_COLORS],
  }));

  if (!can("stats_overview", "read")) {
    return (
      <div className="min-h-screen pt-20 pb-16 bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <ShieldAlert size={64} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Truy cập bị từ chối</h2>
          <p className="text-gray-600 mb-6">Bạn không có quyền xem thống kê tổng quan.</p>
          <button onClick={() => window.location.href = "/"} className="px-6 py-2 bg-red-500 text-white rounded-lg">Về trang chủ</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pt-8 mb-8">
          <PageTitle title="Bảng thống kê" backTo="" subtitle="Tổng quan hệ thống · Cập nhật thời gian thực" />
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {stats.map((card, i) => (
            <StatCard key={card.label} card={card} index={i} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-1">Xu hướng báo cáo theo tháng</h3>
            <p className="text-gray-400 text-sm mb-5">Số lượng báo cáo và xử lý thực tế</p>
            <ResponsiveContainer width="100%" height={240}>
              {!serverStats ? (
                <div className="h-full flex items-center justify-center text-gray-400 italic">Đang tải xu hướng...</div>
              ) : (serverStats.monthlyTrend || []).length > 0 ? (
                <AreaChart data={serverStats.monthlyTrend}>
                  <defs>
                    <linearGradient id="gradRed" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                    <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #f3f4f6" }} />
                  <Legend />
                  <Area type="monotone" dataKey="baocao" name="Báo cáo" stroke="#ef4444" fill="url(#gradRed)" />
                  <Area type="monotone" dataKey="xuly" name="Đã xử lý" stroke="#10b981" fill="url(#gradGreen)" />
                </AreaChart>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 italic">Chưa có dữ liệu xu hướng</div>
              )}
            </ResponsiveContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-1">Trạng thái xử lý</h3>
            <p className="text-gray-400 text-sm mb-4">Phân bổ thực tế</p>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {statusData.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-gray-600">{d.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{d.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-1">Theo danh mục</h3>
            <p className="text-gray-400 text-sm mb-5">Dữ liệu phân loại thực tế</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={18} className="text-purple-600" />
              <h3 className="font-bold text-gray-900">Độ chính xác AI</h3>
            </div>
            <p className="text-gray-400 text-sm mb-5">Hiệu suất mô hình hiện tại: {serverStats?.aiAccuracy}%</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={aiAccuracyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis domain={[75, 100]} tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip />
                <Line type="monotone" dataKey="accuracy" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: "#8b5cf6", r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-5">
            <MapPin size={18} className="text-red-500" />
            <h3 className="font-bold text-gray-900">Top thành phố báo cáo nhiều nhất</h3>
          </div>
          <div className="space-y-4">
            {!serverStats ? (
              <div className="py-8 text-center text-gray-400 italic">Đang tải dữ liệu khu vực...</div>
            ) : (serverStats.cityStats || []).length > 0 ? (
              serverStats.cityStats.map((city: any, i: number) => {
                const max = serverStats.cityStats[0].count;
                const pct = (city.count / max) * 100;
                return (
                  <div key={city.city} className="flex items-center gap-4">
                    <div className="w-6 text-gray-400 text-sm font-bold">{i + 1}</div>
                    <div className="w-24 text-sm font-semibold text-gray-700 truncate">{city.city}</div>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full bg-gradient-to-r from-red-400 to-red-600" />
                    </div>
                    <div className="w-16 text-right text-sm font-semibold text-gray-900">{city.count.toLocaleString()}</div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-gray-400 italic">Chưa có dữ liệu theo thành phố</div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}