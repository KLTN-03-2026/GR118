import { motion } from "motion/react";
import { MapPin, Eye, ThumbsUp, Clock, Navigation } from "lucide-react";
import { useNavigate } from "react-router";
import { useIssues } from "../context/IssuesContext";
import { Issue } from "../data/issues";

interface SimilarIssuesProps {
  currentIssueId: string;
  currentLocation: { lat: number; lng: number };
  maxResults?: number;
}

// Haversine formula to calculate distance between two coordinates
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Vừa xong";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
  return date.toLocaleDateString("vi-VN");
}

const STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",
  rejected: "bg-gray-100 text-gray-700",
};

const STATUS_LABELS = {
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  resolved: "Đã xử lý",
  rejected: "Đã từ chối",
};

export function SimilarIssues({
  currentIssueId,
  currentLocation,
  maxResults = 4,
}: SimilarIssuesProps) {
  const { issues } = useIssues();
  const navigate = useNavigate();

  // Calculate distances and filter out current issue
  const issuesWithDistance = issues
    .filter((issue) => issue.id !== currentIssueId)
    .map((issue) => ({
      ...issue,
      distance: calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        issue.lat,
        issue.lng
      ),
    }))
    .sort((a, b) => {
      // Sort by popularity (votes + comments) and distance
      const scoreA = a.votes * 2 + a.comments * 1.5 - a.distance * 0.5;
      const scoreB = b.votes * 2 + b.comments * 1.5 - b.distance * 0.5;
      return scoreB - scoreA;
    })
    .slice(0, maxResults);

  if (issuesWithDistance.length === 0) {
    return (
      <div className="text-center py-6">
        <MapPin size={32} className="mx-auto text-gray-300 mb-2" />
        <p className="text-sm text-gray-500">Chưa có vấn đề tương tự</p>
      </div>
    );
  }

  const handleIssueClick = (issueId: string) => {
    // Scroll to top and navigate
    window.scrollTo({ top: 0, behavior: "smooth" });
    navigate(`/issues/${issueId}`);
  };

  return (
    <div className="space-y-3">
      {issuesWithDistance.map((issue, index) => (
        <motion.div
          key={issue.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => handleIssueClick(issue.id)}
          className="group cursor-pointer bg-gray-50 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 rounded-xl p-3 border border-gray-100 hover:border-purple-200 transition-all duration-300 hover:shadow-md"
        >
          <div className="flex gap-3">
            {/* Image */}
            <div className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-200">
              {issue.imageUrl ? (
                <img
                  src={issue.imageUrl}
                  alt={issue.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <MapPin size={24} />
                </div>
              )}
              {/* Distance Badge */}
              <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm text-white text-xs font-bold rounded flex items-center gap-0.5">
                <Navigation size={8} />
                {formatDistance(issue.distance)}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-900 text-sm line-clamp-2 mb-1 group-hover:text-purple-600 transition-colors">
                {issue.title}
              </h4>

              <div className="flex items-center gap-1.5 mb-1.5">
                <span
                  className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                    STATUS_COLORS[issue.status]
                  }`}
                >
                  {STATUS_LABELS[issue.status]}
                </span>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <ThumbsUp size={10} />
                  <span>{issue.votes}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={10} />
                  <span>{getTimeAgo(issue.reportedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}

      {/* View All Button */}
      <button
        onClick={() => navigate("/issues")}
        className="w-full mt-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2 text-sm"
      >
        <MapPin size={14} />
        Xem tất cả vấn đề
      </button>
    </div>
  );
}