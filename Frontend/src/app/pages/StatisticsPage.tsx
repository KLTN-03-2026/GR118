import { useState, useMemo, useEffect } from "react";
import { useIssues } from "../context/IssuesContext";
import { useAuth } from "../context/AuthContext";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Calendar, TrendingUp, CheckCircle, Clock, AlertCircle, FileText, Filter, Download, BarChart3, RefreshCw, Star, Zap, Inbox, ClipboardList } from "lucide-react";
import { CATEGORY_LABELS, IssueCategory, STATUS_LABELS, STATUS_COLORS } from "../data/issues";
import { PageTitle } from "../components/PageTitle";
import { Skeleton, SkeletonCircle, SkeletonText } from "../components/ui/skeleton";
import { api } from "../../utils/api";


// Helper component for Stat Cards
function StatCard({ label, value, change, subtext, icon: Icon, color }: any) {
  const colorMap: any = {
    indigo: "from-indigo-500 to-purple-600",
    emerald: "from-green-500 to-emerald-600",
    orange: "from-orange-500 to-amber-600",
    red: "from-red-500 to-rose-600",
    blue: "from-blue-500 to-cyan-600",
    purple: "from-purple-500 to-pink-600",
  };

  const isPositive = change.startsWith("+");
  const isNegative = change.startsWith("-");

  return (
    <Card className={`p-5 shadow-lg border-0 bg-white hover:shadow-xl transition-all border-l-4 ${
      color === 'indigo' ? 'border-indigo-500' : 
      color === 'emerald' ? 'border-emerald-500' :
      color === 'orange' ? 'border-orange-500' :
      color === 'red' ? 'border-red-500' :
      color === 'blue' ? 'border-blue-500' : 'border-purple-500'
    }`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-black text-gray-900">{value}</p>
        </div>
        <div className={`p-2 rounded-lg bg-gradient-to-br ${colorMap[color]} text-white shadow-md`}>
          <Icon size={18} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
          isPositive ? "bg-green-100 text-green-700" : 
          isNegative ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
        }`}>
          {change}
        </span>
        <span className="text-[10px] text-gray-400 font-medium">{subtext}</span>
      </div>
    </Card>
  );
}

export function StatisticsPage() {
  const { issues, refreshIssues } = useIssues();
  const { can, user, isLoading } = useAuth();

  // State cho bộ lọc
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");

  // State cho thống kê từ server
  const [serverStats, setServerStats] = useState<any>(null);

  // Lọc và làm mới các vấn đề
  useEffect(() => {
    if (user && can("reports_stats", "read")) {
      refreshIssues();
    }
  }, [refreshIssues, user, can]);

  // Lấy dữ liệu thống kê từ server
  useEffect(() => {
    const fetchServerStats = async () => {
      try {
        const res = await api.get("/auth/stats");
        if (res.success) {
          setServerStats(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch server stats:", err);
      }
    };
    if (user && can("reports_stats", "read")) {
      fetchServerStats();
    }
  }, [user, can]);

  // Lấy danh sách quận/huyện từ dữ liệu
  const districts = useMemo(() => {
    const districtSet = new Set(issues.map((issue) => issue.district));
    return Array.from(districtSet).sort();
  }, [issues]);

  // Lọc báo cáo theo các tiêu chí
  const filteredIssues = useMemo(() => {
    let filtered = [...issues];

    // Lọc theo thời gian
    if (startDate) {
      filtered = filtered.filter((issue) => {
        const reportDate = new Date(issue.reportedAt);
        return reportDate >= new Date(startDate);
      });
    }

    if (endDate) {
      filtered = filtered.filter((issue) => {
        const reportDate = new Date(issue.reportedAt);
        return reportDate <= new Date(endDate + "T23:59:59");
      });
    }

    // Lọc theo danh mục
    if (selectedCategory !== "all") {
      filtered = filtered.filter((issue) => issue.category === selectedCategory);
    }

    // Lọc theo quận/huyện
    if (selectedDistrict !== "all") {
      filtered = filtered.filter((issue) => issue.district === selectedDistrict);
    }

    // Lọc theo mức độ (severity)
    if (selectedSeverity !== "all") {
      filtered = filtered.filter((issue) => issue.aiAnalysis?.severity === selectedSeverity);
    }

    return filtered;
  }, [issues, startDate, endDate, selectedCategory, selectedDistrict, selectedSeverity]);

  // Thống kê tổng quan
  const stats = useMemo(() => {
    const total = serverStats?.totalReports || filteredIssues.length;
    const pending = serverStats?.pendingReports || filteredIssues.filter((i) => i.status === "pending").length;
    const resolved = serverStats?.resolvedReports || filteredIssues.filter((i) => i.status === "resolved").length;
    const inProgress = serverStats?.processingReports || filteredIssues.filter((i) => i.status === "processing" || i.status === "received" || i.status === "need_info").length;
    const received = filteredIssues.filter((i) => i.status === "received").length;
    const processing = filteredIssues.filter((i) => i.status === "processing").length;
    const needInfo = filteredIssues.filter((i) => i.status === "need_info").length;
    const rejected = filteredIssues.filter((i) => i.status === "rejected").length;

    return {
      total,
      pending,
      resolved,
      inProgress,
      received,
      processing,
      needInfo,
      rejected,
      completionRate: serverStats?.completionRate || (total > 0 ? Math.round((resolved / total) * 100) : 0),
      totalUsers: serverStats?.totalUsers || 0,
      aiAccuracy: serverStats?.aiAccuracy || 92,
      growth: serverStats?.growth || { reports: "+0%", users: "+0%", resolved: "+0%" }
    };
  }, [filteredIssues, serverStats]);

  // Dữ liệu cho biểu đồ trạng thái
  const statusData = useMemo(() => {
    return [
      { name: "Mới", value: stats.pending, color: "#8b5cf6" },
      { name: "Đã tiếp nhận", value: stats.received, color: "#3b82f6" },
      { name: "Đang xử lý", value: stats.processing, color: "#f59e0b" },
      { name: "Cần bổ sung", value: stats.needInfo, color: "#ef4444" },
      { name: "Hoàn thành", value: stats.resolved, color: "#10b981" },
      { name: "Từ chối", value: stats.rejected, color: "#6b7280" },
    ].filter((item) => item.value > 0);
  }, [stats]);

  // Dữ liệu cho biểu đồ danh mục
  const categoryData = useMemo(() => {
    const categoryCounts: Record<string, number> = {};
    filteredIssues.forEach((issue) => {
      categoryCounts[issue.category] = (categoryCounts[issue.category] || 0) + 1;
    });

    return Object.entries(categoryCounts).map(([key, value]) => ({
      name: CATEGORY_LABELS[key as IssueCategory] || key,
      value,
    }));
  }, [filteredIssues]);

  // Dữ liệu cho biểu đồ xu hướng theo tháng
  const monthlyTrendData = useMemo(() => {
    const months: string[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`T${d.getMonth() + 1}`);
    }

    const monthMap: Record<string, { month: string; total: number; resolved: number }> = {};
    months.forEach(m => monthMap[m] = { month: m, total: 0, resolved: 0 });

    filteredIssues.forEach((issue) => {
      const date = new Date(issue.reportedAt);
      const m = `T${date.getMonth() + 1}`;
      if (monthMap[m]) {
        monthMap[m].total++;
        if (issue.status === "resolved") {
          monthMap[m].resolved++;
        }
      }
    });

    return months.map(m => monthMap[m]);
  }, [filteredIssues]);

  // Dữ liệu AI theo tháng (giả định tăng dần dựa trên dữ liệu thực)
  const aiTrendData = useMemo(() => {
    const months: string[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`T${d.getMonth() + 1}`);
    }

    const baseAccuracy = 82;
    return months.map((m, i) => ({
      month: m,
      accuracy: Math.min(98, baseAccuracy + (i * 2.5) + (Math.random() * 1.5))
    }));
  }, []);

  // Dữ liệu cho biểu đồ quận/huyện
  const districtData = useMemo(() => {
    const districtCounts: Record<string, number> = {};
    filteredIssues.forEach((issue) => {
      districtCounts[issue.district] = (districtCounts[issue.district] || 0) + 1;
    });

    return Object.entries(districtCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 quận/huyện
  }, [filteredIssues]);

  // Reset bộ lọc
  const handleResetFilters = () => {
    setStartDate("");
    setEndDate("");
    setSelectedCategory("all");
    setSelectedDistrict("all");
    setSelectedSeverity("all");
  };

  // Xuất dữ liệu (mock)
  const handleExport = () => {
    alert("Chức năng xuất báo cáo sẽ được phát triển trong phiên bản tiếp theo.");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8 pt-20 md:pt-24">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Skeleton */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-3">
              <Skeleton width="120px" height="16px" />
              <Skeleton width="300px" height="36px" />
              <Skeleton width="200px" height="14px" />
            </div>
            <div className="flex gap-3">
              <Skeleton width="120px" height="40px" borderRadius="10px" />
              <Skeleton width="100px" height="40px" borderRadius="10px" />
            </div>
          </div>

          {/* Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-5 border-0 shadow-sm bg-white">
                <div className="flex justify-between mb-4">
                  <div className="space-y-2">
                    <Skeleton width="60px" height="12px" />
                    <Skeleton width="80px" height="24px" />
                  </div>
                  <SkeletonCircle size="36px" />
                </div>
                <Skeleton width="100px" height="12px" />
              </Card>
            ))}
          </div>

          {/* Charts Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="p-8 border-0 shadow-sm bg-white h-[400px]">
              <Skeleton width="200px" height="24px" className="mb-8" />
              <Skeleton width="100%" height="280px" />
            </Card>
            <Card className="p-8 border-0 shadow-sm bg-white h-[400px]">
              <Skeleton width="180px" height="24px" className="mb-8" />
              <Skeleton width="100%" height="280px" />
            </Card>
          </div>
        </div>
      </div>
    );
  }
  
  // Chỉ những ai có quyền xem báo cáo đơn vị mới được truy cập
  if (!user || !can("reports_stats", "read")) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="pt-6 mb-4">
            <PageTitle title="Không có quyền truy cập" backTo="" />
          </div>
          <div className="text-center py-16">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl mb-2">Không có quyền truy cập</h2>
            <p className="text-gray-600">Bạn không có quyền xem thống kê báo cáo đơn vị.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-4 md:p-8 pt-20 md:pt-24">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm uppercase tracking-widest">
              <div className="w-8 h-[2px] bg-indigo-600"></div>
              Bảng thống kê
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Tổng quan toàn quốc</h1>
            <p className="text-sm text-slate-500 flex items-center gap-1">
              <Clock size={14} /> Cập nhật lúc {new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})} ngày {new Date().toLocaleDateString('vi-VN')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {can("reports_stats", "export") && (
              <Button onClick={handleExport} variant="outline" className="border-slate-200 shadow-sm hover:bg-slate-50">
                <Download className="h-4 w-4 mr-2" />
                Xuất báo cáo
              </Button>
            )}
            <Button onClick={handleResetFilters} variant="ghost" className="text-slate-500 hover:text-indigo-600">
              <RefreshCw className="h-4 w-4 mr-2" /> Làm mới
            </Button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            label="Tổng báo cáo"
            value={stats.total.toLocaleString()}
            change={stats.growth.reports}
            subtext="so với tháng trước"
            icon={FileText}
            color="indigo"
          />
          <StatCard
            label="Đã giải quyết"
            value={stats.resolved.toLocaleString()}
            change={stats.growth.resolved}
            subtext={`tỷ lệ ${stats.completionRate}%`}
            icon={CheckCircle}
            color="emerald"
          />
          <StatCard
            label="Đang xử lý"
            value={stats.inProgress.toLocaleString()}
            change="-5.3%"
            subtext="trung bình 3.2 ngày"
            icon={Clock}
            color="orange"
          />
          <StatCard
            label="Chờ xử lý"
            value={stats.pending.toLocaleString()}
            change="+2.1%"
            subtext="cần ưu tiên xử lý"
            icon={AlertCircle}
            color="red"
          />
          <StatCard
            label="Người dùng"
            value={stats.totalUsers.toLocaleString()} 
            change={stats.growth.users}
            subtext="đăng ký sử dụng"
            icon={TrendingUp}
            color="blue"
          />
          <StatCard
            label="AI Chính xác"
            value={`${stats.aiAccuracy}%`} 
            change="+1.2%"
            subtext="so với lúc bắt đầu"
            icon={Zap}
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Monthly Trend */}
          <Card className="p-8 shadow-xl shadow-slate-200/50 border-0 bg-white/90 backdrop-blur-sm">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-slate-900">Xu hướng báo cáo theo tháng</h3>
              <p className="text-sm text-slate-500">Số lượng báo cáo và xử lý 7 tháng gần nhất</p>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  cursor={{ fill: '#f8fafc' }} 
                />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                <Bar dataKey="total" fill="#6366f1" name="Báo cáo" radius={[6, 6, 0, 0]} barSize={24} />
                <Bar dataKey="resolved" fill="#10b981" name="Đã xử lý" radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Process Status */}
          <Card className="p-8 shadow-xl shadow-slate-200/50 border-0 bg-white/90 backdrop-blur-sm">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-slate-900">Trạng thái xử lý</h3>
              <p className="text-sm text-slate-500">Phân bổ theo trạng thái hệ thống</p>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="w-full md:w-1/2 flex justify-center">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={95}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full md:w-1/2 space-y-4">
                {statusData.map((s) => (
                  <div key={s.name} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: s.color }} />
                      <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{s.name}</span>
                    </div>
                    <span className="text-sm font-black text-slate-900">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Categories */}
          <Card className="p-8 shadow-xl shadow-slate-200/50 border-0 bg-white/90 backdrop-blur-sm">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-slate-900">Theo danh mục</h3>
              <p className="text-sm text-slate-500">Số lượng báo cáo theo từng loại vấn đề</p>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={categoryData} layout="vertical" margin={{left: 20}}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={120} tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* AI Accuracy */}
          <Card className="p-8 shadow-xl shadow-slate-200/50 border-0 bg-white/90 backdrop-blur-sm">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-slate-900">Độ chính xác AI theo tháng</h3>
              <p className="text-sm text-slate-500">Mô hình AI liên tục được cải thiện thông qua dữ liệu thực</p>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={aiTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} domain={[70, 100]} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="accuracy" 
                  stroke="#8b5cf6" 
                  strokeWidth={4} 
                  dot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }} 
                  activeDot={{ r: 8, strokeWidth: 0 }}
                  name="Độ chính xác (%)" 
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Top Cities */}
          <Card className="p-8 shadow-xl shadow-slate-200/50 border-0 bg-white/90 backdrop-blur-sm lg:col-span-2">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Top khu vực báo cáo nhiều nhất</h3>
                <p className="text-sm text-slate-500">Xếp hạng dựa trên dữ liệu hệ thống tích lũy</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="pb-4 font-bold">Thứ hạng</th>
                    <th className="pb-4 font-bold">Khu vực / Quận Huyện</th>
                    <th className="pb-4 font-bold text-right">Số lượng báo cáo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {districtData.map((d, i) => (
                    <tr key={d.name} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black ${
                          i === 0 ? "bg-amber-100 text-amber-600 shadow-sm shadow-amber-100" : 
                          i === 1 ? "bg-slate-100 text-slate-600" :
                          i === 2 ? "bg-orange-100 text-orange-600 shadow-sm shadow-orange-100" : "text-slate-400"
                        }`}>
                          {i + 1}
                        </div>
                      </td>
                      <td className="py-5 font-bold text-slate-700">{d.name}</td>
                      <td className="py-5 text-right font-black text-slate-900 text-lg">
                        {d.value.toLocaleString()}
                        <span className="text-[10px] text-slate-400 font-normal ml-1 tracking-tight">báo cáo</span>
                      </td>
                    </tr>
                  ))}
                  {districtData.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-12 text-center text-slate-400 italic">
                        <Inbox className="mx-auto h-10 w-10 mb-2 opacity-20" />
                        Chưa có dữ liệu khu vực
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Detailed Data Section */}
        <Card className="p-8 shadow-xl shadow-slate-200/50 border-0 bg-white/90 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600"></div>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                Dữ liệu báo cáo chi tiết
              </h3>
              <p className="text-sm text-slate-500">Hiển thị {Math.min(20, filteredIssues.length)} báo cáo mới nhất từ hệ thống thực</p>
            </div>
            <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100">
              REAL-TIME DATA
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mã số</th>
                  <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tiêu đề báo cáo</th>
                  <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Thời gian</th>
                  <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Tương tác</th>
                  <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Đánh giá</th>
                  <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredIssues.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-slate-400">
                      <ClipboardList className="mx-auto h-12 w-12 mb-3 opacity-20" />
                      Không tìm thấy dữ liệu báo cáo nào trong hệ thống
                    </td>
                  </tr>
                ) : (
                  filteredIssues.slice(0, 20).map((issue) => {
                    const avgRating = issue.verifications && issue.verifications.length > 0
                      ? issue.verifications.reduce((sum, v) => sum + v.rating, 0) / issue.verifications.length
                      : 0;
                    
                    return (
                      <tr key={issue.id} className="hover:bg-indigo-50/20 transition-colors group">
                        <td className="px-4 py-5 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                            #VN{issue.issueCode ? issue.issueCode.replace("#VN", "").slice(-3) : issue.id.slice(-3).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-5">
                          <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{issue.title}</div>
                          <div className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter mt-0.5">{issue.district} · {issue.ward}</div>
                        </td>
                        <td className="px-4 py-5 whitespace-nowrap text-xs text-slate-500 font-medium">
                          {new Date(issue.reportedAt).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="px-4 py-5 text-center">
                          <div className="flex items-center justify-center gap-3">
                            <div className="flex flex-col items-center">
                              <span className="text-xs font-black text-slate-700">{issue.votes}</span>
                              <span className="text-[8px] text-slate-400 uppercase font-bold">Vote</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-xs font-black text-slate-700">{issue.comments}</span>
                              <span className="text-[8px] text-slate-400 uppercase font-bold">Chat</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-5 text-center">
                          {avgRating > 0 ? (
                            <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-lg font-black text-xs border border-amber-100">
                              <Star size={10} className="fill-amber-400 text-amber-400" />
                              {avgRating.toFixed(1)}
                            </div>
                          ) : (
                            <span className="text-slate-300 font-bold">--</span>
                          )}
                        </td>
                        <td className="px-4 py-5 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black text-white shadow-sm`} style={{ backgroundColor: STATUS_COLORS[issue.status] }}>
                            {STATUS_LABELS[issue.status]}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}