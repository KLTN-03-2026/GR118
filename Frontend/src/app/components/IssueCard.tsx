import { motion } from "motion/react";
import { Link } from "react-router";
import { MapPin, ThumbsUp, MessageSquare, Clock, Sparkles, Star } from "lucide-react";
import { Issue, CATEGORY_LABELS, CATEGORY_COLORS, STATUS_LABELS, STATUS_COLORS } from "../data/issues";

interface IssueCardProps {
  issue: Issue;
  index?: number;
}

export function IssueCard({ issue, index = 0 }: IssueCardProps) {
  const categoryColor = CATEGORY_COLORS[issue.category];
  const statusColor = STATUS_COLORS[issue.status];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  // Calculate average rating
  const averageRating = issue.verifications && issue.verifications.length > 0
    ? issue.verifications.reduce((sum, v) => sum + v.rating, 0) / issue.verifications.length
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100 group"
    >
      <Link to={`/issues/${issue.id}`} className="block">
        {/* Image */}
        <div className="relative h-44 overflow-hidden">
          <img
            src={issue.imageUrl}
            alt={issue.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Category badge */}
          <div
            className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-white text-xs font-medium"
            style={{ backgroundColor: categoryColor }}
          >
            {CATEGORY_LABELS[issue.category]}
          </div>

          {/* AI badge */}
          {issue.aiConfidence && (
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-medium border border-white/30">
              <Sparkles size={11} />
              AI {issue.aiConfidence}%
            </div>
          )}

          {/* Status */}
          <div
            className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full text-white text-xs font-semibold"
            style={{ backgroundColor: statusColor }}
          >
            {STATUS_LABELS[issue.status]}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-red-600 transition-colors duration-200">
            {issue.title}
          </h3>
          <p className="text-gray-500 text-sm line-clamp-2 mb-3">{issue.description}</p>

          <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-3">
            <MapPin size={12} className="text-red-400 flex-shrink-0" />
            <span className="truncate">{issue.location}, {issue.district}</span>
          </div>

          {/* Rating Display */}
          {averageRating > 0 && (
            <div className="flex items-center gap-1.5 mb-3">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200">
                <Star size={14} className="text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-bold text-gray-900">
                  {averageRating.toFixed(1)}
                </span>
                <span className="text-xs text-gray-500">
                  ({issue.verifications?.length || 0})
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <ThumbsUp size={12} />
                {issue.votes}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare size={12} />
                {issue.comments}
              </span>
            </div>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock size={12} />
              {formatDate(issue.reportedAt)}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}