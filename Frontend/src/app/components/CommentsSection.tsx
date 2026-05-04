import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, Send, User, Clock, X, ThumbsUp, Image as ImageIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useIssues } from "../context/IssuesContext";
import { toast } from "sonner";

interface Comment {
  id: string;
  userName: string;
  userAvatar?: string;
  content: string;
  timestamp: string;
  likes: number;
  imageUrl?: string;
}

interface CommentsSectionProps {
  issueId: string;
  isOpen: boolean;
  onClose: () => void;
}

// Comments interface handled in data/issues.ts

export function CommentsSection({ issueId, isOpen, onClose }: CommentsSectionProps) {
  const { user } = useAuth();
  const { issues, addComment } = useIssues();
  
  const issue = issues.find(i => i.id === issueId);
  const comments = issue?.commentsList || [];
  
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ảnh không được vượt quá 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setSelectedImage(null);
  };

  const handleLike = (commentId: string) => {
    const newLiked = new Set(likedComments);
    if (newLiked.has(commentId)) {
      newLiked.delete(commentId);
      setComments(comments.map(c => 
        c.id === commentId ? { ...c, likes: c.likes - 1 } : c
      ));
    } else {
      newLiked.add(commentId);
      setComments(comments.map(c => 
        c.id === commentId ? { ...c, likes: c.likes + 1 } : c
      ));
      toast.success("Đã thích bình luận!");
    }
    setLikedComments(newLiked);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!user) {
      toast.error("Vui lòng đăng nhập để bình luận");
      return;
    }

    setIsSubmitting(true);

    const commentData = {
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      content: newComment,
      imageUrl: selectedImage || undefined,
    };

    const success = await addComment(issueId, commentData);

    if (success) {
      setNewComment("");
      setImagePreview(null);
      setSelectedImage(null);
      toast.success("Đã thêm bình luận!");
    } else {
      toast.error("Không thể thêm bình luận. Vui lòng thử lại.");
    }
    setIsSubmitting(false);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 max-h-[80vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <MessageSquare size={20} className="text-blue-600" />
                <h3 className="font-bold text-gray-900">
                  Bình luận ({comments.length})
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 relative">{comments.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <MessageSquare size={48} className="mx-auto mb-3 opacity-30" />
                  <p>Chưa có bình luận nào</p>
                  <p className="text-sm mt-1">Hãy là người đầu tiên bình luận!</p>
                </div>
              ) : (
                comments.map((comment, index) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      <User size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-2xl rounded-tl-none p-4">
                        <p className="font-semibold text-gray-900 text-sm mb-1">
                          {comment.userName}
                        </p>
                        <p className="text-gray-700">{comment.content}</p>
                        {comment.imageUrl && (
                          <div className="mt-2">
                            <img
                              src={comment.imageUrl}
                              alt="Comment"
                              className="max-w-full h-auto rounded-lg"
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1 ml-4 text-xs text-gray-400">
                        <Clock size={12} />
                        {formatTime(comment.createdAt)}
                      </div>
                      <div className="flex items-center gap-2 mt-1 ml-4">
                        <button
                          onClick={() => handleLike(comment.id)}
                          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <ThumbsUp
                            size={16}
                            className={
                              likedComments.has(comment.id)
                                ? "text-blue-500"
                                : "text-gray-500"
                            }
                          />
                        </button>
                        <span className="text-gray-500">{comment.likes}</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Comment Form */}
            <div className="p-5 border-t border-gray-100 bg-gray-50">
              {user ? (
                <form onSubmit={handleSubmit} className="space-y-3">
                  {/* Image Preview */}
                  {imagePreview && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="relative inline-block"
                    >
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-w-xs h-auto rounded-lg border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                      >
                        <X size={14} />
                      </button>
                    </motion.div>
                  )}

                  {/* Input Row */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Viết bình luận..."
                      className="flex-1 px-4 py-3 rounded-full border border-gray-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                    
                    {/* Image Upload Button */}
                    <label
                      htmlFor="comment-image"
                      className="px-4 py-3 bg-gray-200 text-gray-700 rounded-full font-medium hover:bg-gray-300 cursor-pointer transition-all flex items-center gap-2"
                    >
                      <ImageIcon size={18} />
                    </label>
                    <input
                      type="file"
                      id="comment-image"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />

                    {/* Send Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting || !newComment.trim()}
                      className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                      <Send size={16} />
                      Gửi
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">Vui lòng đăng nhập để bình luận</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}