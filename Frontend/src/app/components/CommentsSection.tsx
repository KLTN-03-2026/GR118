import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, Send, User, Clock, X, ThumbsUp, Image as ImageIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
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

// Mock comments data
const MOCK_COMMENTS: Record<string, Comment[]> = {
  "1": [
    {
      id: "c1",
      userName: "Trần Văn B",
      content: "Tôi cũng đi qua đây hàng ngày và gặp vấn đề này. Rất nguy hiểm khi trời mưa!",
      timestamp: "2026-02-28T10:30:00",
      likes: 12,
    },
    {
      id: "c2",
      userName: "Nguyễn Thị C",
      content: "Cảm ơn bạn đã báo cáo. Hi vọng sớm được xử lý.",
      timestamp: "2026-03-01T08:15:00",
      likes: 5,
    },
    {
      id: "c3",
      userName: "Lê Minh D",
      content: "Đã gần 1 tuần rồi vẫn chưa thấy ai đến sửa chữa.",
      timestamp: "2026-03-02T14:20:00",
      likes: 8,
    },
    {
      id: "c4",
      userName: "Phạm Thu H",
      content: "Tôi vừa đi qua và chụp thêm ảnh. Tình trạng đang tệ hơn!",
      timestamp: "2026-03-02T16:45:00",
      likes: 15,
      imageUrl: "https://images.unsplash.com/photo-1615200473481-d0f2b3c2b999?w=800&q=80",
    },
    {
      id: "c5",
      userName: "Hoàng Văn K",
      content: "Cảm ơn mọi người đã quan tâm. Hy vọng chính quyền sẽ sớm khắc phục.",
      timestamp: "2026-03-03T09:20:00",
      likes: 3,
    },
  ],
  "2": [
    {
      id: "c6",
      userName: "Phạm Văn E",
      content: "Công viên này cần được dọn dẹp thường xuyên hơn.",
      timestamp: "2026-03-01T16:00:00",
      likes: 7,
    },
    {
      id: "c7",
      userName: "Nguyễn Minh T",
      content: "Mình đã gọi điện cho phường nhưng chưa thấy phản hồi.",
      timestamp: "2026-03-02T10:30:00",
      likes: 4,
    },
    {
      id: "c8",
      userName: "Lê Thị M",
      content: "Rác thải ở đây thật sự quá nhiều. Đây là hình ảnh hôm nay:",
      timestamp: "2026-03-03T07:15:00",
      likes: 11,
      imageUrl: "https://images.unsplash.com/photo-1604187351574-c75ca79f5807?w=800&q=80",
    },
  ],
  "3": [
    {
      id: "c9",
      userName: "Đỗ Văn A",
      content: "Đèn đường này đã hỏng từ tuần trước rồi, rất mất an toàn!",
      timestamp: "2026-03-01T19:00:00",
      likes: 18,
    },
    {
      id: "c10",
      userName: "Mai Thị B",
      content: "Tôi cũng phát hiện vấn đề này. Tối đi qua rất sợ.",
      timestamp: "2026-03-02T08:00:00",
      likes: 9,
    },
    {
      id: "c11",
      userName: "Trần Công C",
      content: "Đã báo điện lực nhưng họ nói không phải do họ quản lý.",
      timestamp: "2026-03-02T15:30:00",
      likes: 6,
      imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    },
  ],
  "4": [
    {
      id: "c12",
      userName: "Nguyễn Văn D",
      content: "Sao lại xây dựng không phép như vậy được? Ảnh hưởng đến mọi người quá!",
      timestamp: "2026-03-01T11:00:00",
      likes: 22,
    },
    {
      id: "c13",
      userName: "Lê Thị E",
      content: "Tôi đã gửi đơn khiếu nại nhưng chưa thấy ai xử lý.",
      timestamp: "2026-03-02T14:00:00",
      likes: 13,
    },
  ],
};

export function CommentsSection({ issueId, isOpen, onClose }: CommentsSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS[issueId] || []);
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

    // Simulate API call
    setTimeout(() => {
      const comment: Comment = {
        id: `c${Date.now()}`,
        userName: user.name,
        content: newComment,
        timestamp: new Date().toISOString(),
        likes: 0,
        imageUrl: selectedImage || undefined,
      };

      setComments([...comments, comment]);
      setNewComment("");
      setImagePreview(null);
      setSelectedImage(null);
      setIsSubmitting(false);
      toast.success("Đã thêm bình luận!");
    }, 500);
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
                        {formatTime(comment.timestamp)}
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