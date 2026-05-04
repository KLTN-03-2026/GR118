import { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { Link } from "react-router";
import { Search, Filter, PlusCircle, SlidersHorizontal, ChevronDown } from "lucide-react";
import { IssueCard } from "../components/IssueCard";
import { CATEGORY_LABELS, STATUS_LABELS, IssueCategory, IssueStatus } from "../data/issues";
import { PageTitle } from "../components/PageTitle";
import { useIssues } from "../context/IssuesContext";

export function IssuesPage() {
  const { issues } = useIssues();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<IssueCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<IssueStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"date" | "votes" | "comments">("date");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let list = [...issues];
    if (search) {
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(search.toLowerCase()) ||
          i.description.toLowerCase().includes(search.toLowerCase()) ||
          i.location.toLowerCase().includes(search.toLowerCase()) ||
          (i.issueCode && i.issueCode.toLowerCase().includes(search.toLowerCase()))
      );
    }
    if (categoryFilter !== "all") list = list.filter((i) => i.category === categoryFilter);
    if (statusFilter !== "all") list = list.filter((i) => i.status === statusFilter);
    list.sort((a, b) => {
      if (sortBy === "votes") return b.votes - a.votes;
      if (sortBy === "comments") return b.comments - a.comments;
      return new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime();
    });
    return list;
  }, [issues, search, categoryFilter, statusFilter, sortBy]);

  const categories: Array<IssueCategory | "all"> = ["all", "road", "garbage", "lighting", "flood", "noise", "other"];
  const statuses: Array<IssueStatus | "all"> = ["all", "pending", "processing", "resolved", "rejected"];

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
            title="Danh sách vấn đề"
            backTo=""
            subtitle={
              <>
                <span className="font-semibold text-red-600">{filtered.length}</span> vấn đề được tìm thấy
              </>
            }
            action={
              <Link
                to="/report"
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium shadow-lg shadow-red-200 hover:scale-105 transition-transform duration-200"
              >
                <PlusCircle size={18} />
                Báo cáo mới
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
          {/* Search */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm vấn đề..."
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all text-sm"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium ${
                showFilters ? "bg-red-50 border-red-300 text-red-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <SlidersHorizontal size={16} />
              Bộ lọc
              <ChevronDown size={14} className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </button>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="pt-4 mt-4 border-t border-gray-100 space-y-4"
            >
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Danh mục</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        categoryFilter === cat
                          ? "bg-red-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {cat === "all" ? "Tất cả" : CATEGORY_LABELS[cat]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Trạng thái</label>
                <div className="flex flex-wrap gap-2">
                  {statuses.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        statusFilter === s
                          ? "bg-red-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {s === "all" ? "Tất cả" : STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Sắp xếp theo</label>
                <div className="flex gap-2">
                  {[
                    { key: "date", label: "Mới nhất" },
                    { key: "votes", label: "Nhiều bình chọn" },
                    { key: "comments", label: "Nhiều bình luận" },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setSortBy(key as any)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        sortBy === key
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Issues Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((issue, i) => (
              <IssueCard key={issue.id} issue={issue} index={i} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Filter size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium">Không tìm thấy vấn đề nào</p>
            <p className="text-gray-400 text-sm mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}