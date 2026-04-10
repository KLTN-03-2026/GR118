import { useState, useMemo } from "react";
import { useIssues } from "../context/IssuesContext";
import { useAuth } from "../context/AuthContext";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Calendar, TrendingUp, CheckCircle, Clock, AlertCircle, FileText, Filter, Download, BarChart3 } from "lucide-react";
import { CATEGORY_LABELS, IssueCategory } from "../data/issues";
import { PageTitle } from "../components/PageTitle";

export function StatisticsPage() {
  const { issues } = useIssues();
  const { can } = useAuth();
  
  // Chỉ những ai có quyền xem báo cáo đơn vị mới được truy cập
  if (!can("reports_stats", "read")) {
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

  // State cho bộ lọc
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");

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
    const total = filteredIssues.length;
    const pending = filteredIssues.filter((i) => i.status === "pending").length;
    const received = filteredIssues.filter((i) => i.status === "received").length;
    const processing = filteredIssues.filter((i) => i.status === "processing").length;
    const needInfo = filteredIssues.filter((i) => i.status === "need_info").length;
    const resolved = filteredIssues.filter((i) => i.status === "resolved").length;
    const rejected = filteredIssues.filter((i) => i.status === "rejected").length;
    const inProgress = processing + needInfo;

    return {
      total,
      pending,
      received,
      processing,
      needInfo,
      resolved,
      rejected,
      inProgress,
      completionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
    };
  }, [filteredIssues]);

  // Dữ liệu cho biểu đồ trạng thái
  const statusData = [
    { name: "Mới", value: stats.pending, color: "#8b5cf6" },
    { name: "Đã tiếp nhận", value: stats.received, color: "#3b82f6" },
    { name: "Đang xử lý", value: stats.processing, color: "#f59e0b" },
    { name: "Cần bổ sung", value: stats.needInfo, color: "#ef4444" },
    { name: "Hoàn thành", value: stats.resolved, color: "#10b981" },
    { name: "Từ chối", value: stats.rejected, color: "#6b7280" },
  ].filter((item) => item.value > 0);

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

  // Dữ liệu cho biểu đồ xu hướng theo thời gian
  const trendData = useMemo(() => {
    const dateMap: Record<string, { date: string; total: number; resolved: number }> = {};

    filteredIssues.forEach((issue) => {
      const date = new Date(issue.reportedAt).toISOString().split("T")[0];
      if (!dateMap[date]) {
        dateMap[date] = { date, total: 0, resolved: 0 };
      }
      dateMap[date].total++;
      if (issue.status === "resolved") {
        dateMap[date].resolved++;
      }
    });

    return Object.values(dateMap)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Lấy 30 ngày gần nhất
  }, [filteredIssues]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 md:p-8 pt-20 md:pt-24">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <PageTitle
              title={
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-2xl md:text-3xl">Thống kê báo cáo đơn vị</span>
                </div>
              }
              backTo=""
              subtitle="Tổng hợp và phân tích dữ liệu báo cáo"
            />
          </div>
          {can("reports_stats", "export") && (
            <Button onClick={handleExport} className="bg-green-600 hover:bg-green-700">
              <Download className="h-4 w-4 mr-2" />
              Xuất báo cáo
            </Button>
          )}
        </div>

        {/* Bộ lọc */}
        <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg">Bộ lọc</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-700">Từ ngày</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-700">Đến ngày</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-700">Danh mục</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả danh mục</SelectItem>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-700">Quận/Huyện</label>
              <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả quận/huyện</SelectItem>
                  {districts.map((district) => (
                    <SelectItem key={district} value={district}>
                      {district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-700">Mức độ</label>
              <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả mức độ</SelectItem>
                  <SelectItem value="low">Thấp</SelectItem>
                  <SelectItem value="medium">Trung bình</SelectItem>
                  <SelectItem value="high">Cao</SelectItem>
                  <SelectItem value="critical">Nghiêm trọng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={handleResetFilters}>
              Đặt lại bộ lọc
            </Button>
          </div>
        </Card>

        {/* Thống kê tổng quan */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 shadow-lg border-0 bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:shadow-xl transition-all">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm text-indigo-100">Tổng số báo cáo</p>
                <p className="text-3xl">{stats.total}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur">
                <FileText className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-indigo-100">
              <Calendar className="h-4 w-4" />
              <span>Trong kỳ đã chọn</span>
            </div>
          </Card>

          <Card className="p-6 shadow-lg border-0 bg-gradient-to-br from-green-500 to-emerald-600 text-white hover:shadow-xl transition-all">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm text-green-100">Đã hoàn thành</p>
                <p className="text-3xl">{stats.resolved}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-green-100">
              <TrendingUp className="h-4 w-4" />
              <span>Tỷ lệ: {stats.completionRate}%</span>
            </div>
          </Card>

          <Card className="p-6 shadow-lg border-0 bg-gradient-to-br from-orange-500 to-amber-600 text-white hover:shadow-xl transition-all">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm text-orange-100">Đang xử lý</p>
                <p className="text-3xl">{stats.inProgress}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur">
                <Clock className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex flex-col text-sm text-orange-100">
              <span>• {stats.processing} đang xử lý</span>
              <span>• {stats.needInfo} cần bổ sung</span>
            </div>
          </Card>

          <Card className="p-6 shadow-lg border-0 bg-gradient-to-br from-blue-500 to-cyan-600 text-white hover:shadow-xl transition-all">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm text-blue-100">Mới & Đã tiếp nhận</p>
                <p className="text-3xl">{stats.pending + stats.received}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur">
                <AlertCircle className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex flex-col text-sm text-blue-100">
              <span>• {stats.pending} báo cáo mới</span>
              <span>• {stats.received} đã tiếp nhận</span>
            </div>
          </Card>
        </div>

        {/* Biểu đồ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Biểu đồ tròn - Phân bố trạng thái */}
          <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur">
            <h3 className="text-lg mb-4">Phân bố theo trạng thái</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Biểu đồ cột - Phân bố danh mục */}
          <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur">
            <h3 className="text-lg mb-4">Phân bố theo danh mục</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Biểu đồ đường - Xu hướng theo thời gian */}
          <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur lg:col-span-2">
            <h3 className="text-lg mb-4">Xu hướng báo cáo theo thời gian (30 ngày gần nhất)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#8b5cf6" name="Tổng số" strokeWidth={2} />
                <Line type="monotone" dataKey="resolved" stroke="#10b981" name="Đã hoàn thành" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Biểu đồ cột - Top quận/huyện */}
          <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur lg:col-span-2">
            <h3 className="text-lg mb-4">Top 10 quận/huyện có nhiều báo cáo nhất</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={districtData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Bảng chi tiết trạng thái */}
        <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur">
          <h3 className="text-lg mb-4">Chi tiết theo trạng thái</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Trạng thái</th>
                  <th className="text-right py-3 px-4">Số lượng</th>
                  <th className="text-right py-3 px-4">Tỷ lệ</th>
                  <th className="text-center py-3 px-4">Tiến độ</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      Báo cáo mới
                    </span>
                  </td>
                  <td className="text-right py-3 px-4">{stats.pending}</td>
                  <td className="text-right py-3 px-4">
                    {stats.total > 0 ? ((stats.pending / stats.total) * 100).toFixed(1) : 0}%
                  </td>
                  <td className="py-3 px-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      Đã tiếp nhận
                    </span>
                  </td>
                  <td className="text-right py-3 px-4">{stats.received}</td>
                  <td className="text-right py-3 px-4">
                    {stats.total > 0 ? ((stats.received / stats.total) * 100).toFixed(1) : 0}%
                  </td>
                  <td className="py-3 px-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${stats.total > 0 ? (stats.received / stats.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      Đang xử lý
                    </span>
                  </td>
                  <td className="text-right py-3 px-4">{stats.processing}</td>
                  <td className="text-right py-3 px-4">
                    {stats.total > 0 ? ((stats.processing / stats.total) * 100).toFixed(1) : 0}%
                  </td>
                  <td className="py-3 px-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full"
                        style={{ width: `${stats.total > 0 ? (stats.processing / stats.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      Cần bổ sung
                    </span>
                  </td>
                  <td className="text-right py-3 px-4">{stats.needInfo}</td>
                  <td className="text-right py-3 px-4">
                    {stats.total > 0 ? ((stats.needInfo / stats.total) * 100).toFixed(1) : 0}%
                  </td>
                  <td className="py-3 px-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${stats.total > 0 ? (stats.needInfo / stats.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      Hoàn thành
                    </span>
                  </td>
                  <td className="text-right py-3 px-4">{stats.resolved}</td>
                  <td className="text-right py-3 px-4">
                    {stats.total > 0 ? ((stats.resolved / stats.total) * 100).toFixed(1) : 0}%
                  </td>
                  <td className="py-3 px-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                      Từ chối
                    </span>
                  </td>
                  <td className="text-right py-3 px-4">{stats.rejected}</td>
                  <td className="text-right py-3 px-4">
                    {stats.total > 0 ? ((stats.rejected / stats.total) * 100).toFixed(1) : 0}%
                  </td>
                  <td className="py-3 px-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gray-500 h-2 rounded-full"
                        style={{ width: `${stats.total > 0 ? (stats.rejected / stats.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}