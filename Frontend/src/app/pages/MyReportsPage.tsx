import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText,
  Edit3,
  Trash2,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Save,
  MapPin,
  Calendar,
} from "lucide-react";
import { Link, Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useIssues } from "../context/IssuesContext";
import { CATEGORY_LABELS, CATEGORY_COLORS, STATUS_LABELS, STATUS_COLORS, IssueCategory, Issue } from "../data/issues";
import { toast } from "sonner";
import { Loader2, Search, Home } from "lucide-react";
import { Skeleton, SkeletonText, SkeletonCircle } from "../components/ui/skeleton";
import { Card } from "../components/ui/card";
import { LocationPicker } from "../components/LocationPicker";
import { api } from "../../utils/api";

const STATUS_ICONS: Record<string, any> = {
  pending: Clock,
  received: Clock,
  processing: Loader2,
  need_info: AlertCircle,
  resolved: CheckCircle2,
  rejected: XCircle,
};

export function MyReportsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { issues, updateIssue, deleteIssue, isLoading } = useIssues();
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Redirect if not logged in
  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-screen pt-20 pb-16 bg-gray-50 flex items-center justify-center">
        <Loader2 size={48} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!user || user.role === "admin") {
    return <Navigate to="/" replace />;
  }

  // Filter issues by current user
  const myIssues = issues.filter((issue) => issue.reporterId === user.id);

  const handleDelete = (issueId: string) => {
    deleteIssue(issueId);
    toast.success("Đã xóa báo cáo thành công!");
    setDeleteConfirm(null);
  };

  const handleUpdate = async (updatedIssue: Issue) => {
    const success = await updateIssue(updatedIssue.id, updatedIssue);
    if (success) {
      toast.success("Đã cập nhật báo cáo thành công!");
      setEditingIssue(null);
    }
  };

  const EditModal = ({ issue }: { issue: Issue }) => {
    const [formData, setFormData] = useState({
      title: issue.title,
      description: issue.description,
      category: issue.category,
      location: issue.location,
      district: issue.district || "",
      ward: issue.ward || "",
      city: issue.city || "",
      lat: issue.lat || 16.047079,
      lng: issue.lng || 108.206230,
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleUpdate({
        ...issue,
        ...formData,
      });
    };

    const syncAdministrativeLevels = async (lat: number, lng: number, addressData: any) => {
      if (!addressData) return;
      
      const addr = addressData.address || addressData.properties || {};
      const rawCity = addr.city || addr.state || addr.province || addr.city_district || "";
      const possibleDistricts = [addr.district, addr.city_district, addr.county, addr.town, addr.suburb].filter(Boolean);
      const possibleWards = [addr.ward, addr.suburb, addr.village, addr.subdistrict, addr.quarter, addr.neighbourhood, addr.city_district].filter(Boolean);
      
      const road = addr.road || addr.street || addr.amenity || addr.building || "";
      const houseNumber = addr.house_number || addr.housenumber || "";
      const locationStr = [houseNumber, road].filter(Boolean).join(" ");
      
      let finalCity = "";
      let finalDistrict = "";
      let finalWard = "";

      const removeAccents = (str: string) => {
        return str.normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/đ/g, 'd').replace(/Đ/g, 'D');
      };

      const cleanName = (name: string) => {
        if (!name) return "";
        return removeAccents(name.toLowerCase())
          .replace(/thanh pho |tinh |quan |huyen |thi xa |phuong |xa |thi tran |tp |t\.p |q\. |p\. |district|ward|city|province/g, "")
          .trim();
      };

      if (rawCity) {
        const targetCity = cleanName(rawCity);
        try {
          const resP = await fetch("https://provinces.open-api.vn/api/p/");
          const provinces = await resP.json();
          const matchedCity = provinces.find((p: any) => {
            const pName = cleanName(p.name);
            return pName === targetCity || pName.includes(targetCity) || targetCity.includes(pName);
          });
          
          if (matchedCity) {
            finalCity = matchedCity.name;
            const resD = await fetch(`https://provinces.open-api.vn/api/p/${matchedCity.code}?depth=2`);
            const dataD = await resD.json();
            const currentDistricts = dataD.districts || [];
            
            let matchedDist: any = null;
            for (const rawDist of possibleDistricts) {
              const targetDist = cleanName(rawDist);
              if (!targetDist) continue;
              matchedDist = currentDistricts.find((d: any) => {
                const dName = cleanName(d.name);
                return dName === targetDist || dName.includes(targetDist) || targetDist.includes(dName);
              });
              if (matchedDist) break;
            }

            if (matchedDist) {
              finalDistrict = matchedDist.name;
              const resW = await fetch(`https://provinces.open-api.vn/api/d/${matchedDist.code}?depth=2`);
              const dataW = await resW.json();
              const currentWards = dataW.wards || [];
              
              for (const rawWard of possibleWards) {
                const targetWard = cleanName(rawWard);
                if (!targetWard) continue;
                if (cleanName(matchedDist.name) === targetWard && possibleWards.length > 1) continue;
                const matchedWard = currentWards.find((w: any) => {
                  const wName = cleanName(w.name);
                  return wName === targetWard || wName.includes(targetWard) || targetWard.includes(wName);
                });
                if (matchedWard) {
                  finalWard = matchedWard.name;
                  break;
                }
              }
            }
          }
        } catch (error) {
          console.error("Failed to sync administrative levels:", error);
        }
      }

      setFormData(f => ({
        ...f,
        lat,
        lng,
        city: finalCity || f.city,
        district: finalDistrict || f.district,
        ward: finalWard || f.ward,
        location: locationStr || f.location
      }));
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
          onClick={() => setEditingIssue(null)}
        />
        
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white rounded-[32px] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden relative z-10 border border-gray-100 flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decorative Top Bar */}
          <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

          <div className="p-6 sm:p-8 flex-1 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                  <Edit3 size={24} />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-xl tracking-tight">Chỉnh sửa báo cáo</h3>
                  <p className="text-gray-500 text-xs font-medium">Cập nhật thông tin chi tiết cho sự vụ của bạn</p>
                </div>
              </div>
              <button
                onClick={() => setEditingIssue(null)}
                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form id="edit-issue-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Side: Basic Info */}
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Tiêu đề sự vụ
                    </label>
                    <div className="relative">
                      <FileText size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none font-medium text-sm"
                        placeholder="Nhập tiêu đề ngắn gọn..."
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Phân loại danh mục
                    </label>
                    <div className="relative">
                      <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as IssueCategory })}
                        className="w-full pl-11 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none font-medium text-sm appearance-none cursor-pointer"
                        required
                      >
                        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <Calendar size={14} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Mô tả tình trạng
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={6}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none font-medium text-sm resize-none"
                      placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
                      required
                    />
                  </div>
                </div>

                {/* Right Side: Map & Address */}
                <div className="space-y-5">
                  <div className="rounded-[24px] overflow-hidden border border-gray-100 shadow-inner bg-gray-50">
                    <LocationPicker
                      lat={formData.lat}
                      lng={formData.lng}
                      city={formData.city}
                      district={formData.district}
                      ward={formData.ward}
                      height="240px"
                      onChange={(lat, lng, addressData) => {
                        if (addressData) {
                          syncAdministrativeLevels(lat, lng, addressData);
                        } else {
                          setFormData(f => ({ ...f, lat, lng }));
                        }
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                        Quận / Huyện
                      </label>
                      <input
                        type="text"
                        value={formData.district}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none font-medium text-xs"
                        placeholder="Quận/Huyện"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                        Phường / Xã
                      </label>
                      <input
                        type="text"
                        value={formData.ward}
                        onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none font-medium text-xs"
                        placeholder="Phường/Xã"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Địa chỉ cụ thể
                    </label>
                    <div className="relative">
                      <Home size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none font-medium text-sm"
                        placeholder="Số nhà, tên đường..."
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Footer Actions */}
          <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center gap-4">
            <button
              type="button"
              onClick={() => setEditingIssue(null)}
              className="px-6 py-3 text-gray-500 font-bold hover:text-gray-700 hover:bg-white rounded-xl transition-all text-sm"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              form="edit-issue-form"
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:shadow-xl hover:translate-y-[-1px] active:translate-y-[0px] transition-all flex items-center justify-center gap-2"
            >
              <Save size={18} />
              Cập nhật báo cáo
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  const DeleteConfirmModal = ({ issueId }: { issueId: string }) => {
    const issue = issues.find((i) => i.id === issueId);
    if (!issue) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={() => setDeleteConfirm(null)}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl p-6 max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} className="text-red-600" />
          </div>
          <h3 className="font-bold text-gray-900 text-xl text-center mb-2">Xác nhận xóa</h3>
          <p className="text-gray-600 text-center mb-6">
            Bạn có chắc chắn muốn xóa báo cáo <span className="font-semibold">"{issue.title}"</span>? 
            Hành động này không thể hoàn tác.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Hủy
            </button>
            <button
              onClick={() => handleDelete(issueId)}
              className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all"
            >
              Xóa
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen pt-20 pb-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white">
              <FileText size={24} />
            </div>
            <div>
              <h1 className="font-black text-gray-900 text-3xl">Báo cáo của tôi</h1>
              <p className="text-gray-500">Quản lý các báo cáo bạn đã gửi</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center text-white">
                <FileText size={20} />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">{myIssues.length}</p>
                <p className="text-sm text-gray-500">Tổng báo cáo</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-500 flex items-center justify-center text-white">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">
                  {myIssues.filter((i) => i.status === "pending").length}
                </p>
                <p className="text-sm text-gray-500">Chờ xử lý</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-400 flex items-center justify-center text-white">
                <Loader2 size={20} className="animate-spin" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">
                  {myIssues.filter((i) => i.status === "processing").length}
                </p>
                <p className="text-sm text-gray-500">Đang xử lý</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center text-white">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">
                  {myIssues.filter((i) => i.status === "resolved").length}
                </p>
                <p className="text-sm text-gray-500">Đã giải quyết</p>
              </div>
            </div>
          </div>
        </div>

        {/* Issues List */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex flex-col md:flex-row gap-5">
                  <Skeleton width="192px" height="192px" className="rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <Skeleton width="100px" height="12px" />
                        <Skeleton width="60%" height="24px" />
                      </div>
                      <Skeleton width="100px" height="32px" borderRadius="12px" />
                    </div>
                    <SkeletonText lines={2} />
                    <div className="flex gap-4">
                      <Skeleton width="120px" height="14px" />
                      <Skeleton width="120px" height="14px" />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Skeleton width="120px" height="36px" borderRadius="12px" />
                      <Skeleton width="120px" height="36px" borderRadius="12px" />
                      <Skeleton width="80px" height="36px" borderRadius="12px" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : myIssues.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
            <FileText size={64} className="mx-auto mb-4 text-gray-300" />
            <h3 className="font-bold text-gray-900 text-xl mb-2">Chưa có báo cáo nào</h3>
            <p className="text-gray-500 mb-6">Bạn chưa gửi báo cáo nào. Hãy báo cáo vấn đề để cải thiện cộng đồng!</p>
            <Link
              to="/report"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Gửi báo cáo ngay
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {myIssues.map((issue, index) => {
              const StatusIcon = STATUS_ICONS[issue.status];
              return (
                <motion.div
                  key={issue.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row gap-5">
                    {/* Image */}
                    <img
                      src={issue.imageUrl}
                      alt={issue.title}
                      className="w-full md:w-48 h-48 rounded-xl object-cover flex-shrink-0"
                    />

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-mono text-xs font-semibold text-gray-500">
                              #{issue.issueCode || issue.id.slice(-6).toUpperCase()}
                            </span>
                            <span
                              className="px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                              style={{ backgroundColor: CATEGORY_COLORS[issue.category] }}
                            >
                              {CATEGORY_LABELS[issue.category]}
                            </span>
                          </div>
                          <h3 className="font-bold text-gray-900 text-lg mb-2">{issue.title}</h3>
                          <p className="text-gray-600 text-sm line-clamp-2 mb-3">{issue.description}</p>
                        </div>

                        <span
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-sm"
                          style={{ backgroundColor: STATUS_COLORS[issue.status] }}
                        >
                          <StatusIcon size={12} className={issue.status === "processing" ? "animate-spin" : ""} />
                          {STATUS_LABELS[issue.status]}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={14} />
                          {issue.district}, {issue.city}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} />
                          {new Date(issue.reportedAt).toLocaleDateString("vi-VN")}
                        </div>
                      </div>

                      {/* Actions */}
                        <div className="flex gap-2">
                          <Link
                            to={`/issues/${issue.id}`}
                            className="px-5 py-2.5 bg-gray-50 text-gray-600 rounded-xl font-bold hover:bg-gray-100 transition-all flex items-center gap-2 text-xs"
                          >
                            <Eye size={16} />
                            Xem chi tiết
                          </Link>
                          <button
                            onClick={() => setEditingIssue(issue)}
                            className="px-5 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-all flex items-center gap-2 text-xs"
                          >
                            <Edit3 size={16} />
                            Chỉnh sửa
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(issue.id)}
                            className="px-5 py-2.5 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-all flex items-center gap-2 text-xs"
                          >
                            <Trash2 size={16} />
                            Xóa
                          </button>
                        </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {editingIssue && <EditModal issue={editingIssue} />}
        {deleteConfirm && <DeleteConfirmModal issueId={deleteConfirm} />}
      </AnimatePresence>
    </div>
  );
}