import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Link } from "react-router";
import {
  Search,
  Calendar,
  MapPin,
  Users,
  Heart,
  Clock,
  Filter as FilterIcon,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";
import { useActivities } from "../context/ActivitiesContext";
import { PageTitle } from "../components/PageTitle";

export function ActivitiesPage() {
  const { activities } = useActivities();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "upcoming" | "ongoing" | "completed">("all");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let list = [...activities].filter((a) => a.status !== "hidden" && a.status !== "cancelled");

    if (search) {
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(search.toLowerCase()) ||
          a.description.toLowerCase().includes(search.toLowerCase()) ||
          a.location.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      list = list.filter((a) => a.status === statusFilter);
    }

    // Sort: upcoming first, then ongoing, then completed
    list.sort((a, b) => {
      const statusOrder = { upcoming: 0, ongoing: 1, completed: 2 };
      const orderDiff = statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
      if (orderDiff !== 0) return orderDiff;
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });

    return list;
  }, [activities, search, statusFilter]);

  const getStatusBadge = (status: string) => {
    const badges = {
      upcoming: { label: "Sắp diễn ra", className: "bg-blue-100 text-blue-700" },
      ongoing: { label: "Đang diễn ra", className: "bg-green-100 text-green-700" },
      completed: { label: "Đã kết thúc", className: "bg-gray-100 text-gray-600" },
    };
    return badges[status as keyof typeof badges] || badges.upcoming;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen pt-20 pb-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-8 mb-8"
        >
          <PageTitle
            title={
              <span className="flex items-center gap-3">
                <Heart className="text-red-500" size={32} />
                Hoạt động tình nguyện
              </span>
            }
            backTo=""
            subtitle={
              <div>
                <p>Tham gia các hoạt động ý nghĩa, đóng góp cho cộng đồng</p>
                <p className="text-sm text-gray-400 mt-1">
                  <span className="font-semibold text-red-600">{filtered.length}</span> hoạt động đang mở
                </p>
              </div>
            }
            action={
              <Link
                to="/activities/my-activities"
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium shadow-lg shadow-green-200 hover:scale-105 transition-transform duration-200"
              >
                <CheckCircle2 size={18} />
                Hoạt động của tôi
              </Link>
            }
          />
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6"
        >
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm hoạt động..."
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-300 transition-all text-sm"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium ${
                showFilters
                  ? "bg-green-50 border-green-300 text-green-600"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <FilterIcon size={16} />
              Lọc
              <ChevronDown size={14} className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </button>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="pt-4 mt-4 border-t border-gray-100"
            >
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                Trạng thái
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "all", label: "Tất cả" },
                  { key: "upcoming", label: "Sắp diễn ra" },
                  { key: "ongoing", label: "Đang diễn ra" },
                  { key: "completed", label: "Đã kết thúc" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setStatusFilter(key as any)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      statusFilter === key
                        ? "bg-green-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Activities Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((activity, i) => {
              const statusBadge = getStatusBadge(activity.status);
              const isFull = activity.currentParticipants >= activity.maxParticipants;
              const canRegister = activity.registrationOpen && !isFull && activity.status === "upcoming";

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group"
                >
                  <Link to={`/activities/${activity.id}`} className="block">
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={activity.imageUrl}
                        alt={activity.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                      {/* Status Badge */}
                      <div
                        className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge.className}`}
                      >
                        {statusBadge.label}
                      </div>

                      {/* Registration Status */}
                      {!canRegister && activity.status === "upcoming" && (
                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-red-500 text-white text-xs font-semibold">
                          {isFull ? "Đã đủ" : "Đóng ĐK"}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-green-600 transition-colors duration-200">
                        {activity.title}
                      </h3>
                      <p className="text-gray-500 text-sm line-clamp-2 mb-4">{activity.description}</p>

                      {/* Meta info */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-gray-400 text-xs">
                          <Calendar size={14} className="text-blue-400 flex-shrink-0" />
                          <span className="truncate">{formatDate(activity.startDate)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400 text-xs">
                          <MapPin size={14} className="text-red-400 flex-shrink-0" />
                          <span className="truncate">
                            {activity.location}, {activity.district}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400 text-xs">
                          <Users size={14} className="text-green-400 flex-shrink-0" />
                          <span>
                            {activity.currentParticipants}/{activity.maxParticipants} người
                          </span>
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden ml-2">
                            <div
                              className="h-full bg-green-500 rounded-full transition-all"
                              style={{
                                width: `${(activity.currentParticipants / activity.maxParticipants) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Tags */}
                      {activity.tags && activity.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {activity.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <Heart size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium">Không tìm thấy hoạt động nào</p>
            <p className="text-gray-400 text-sm mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
