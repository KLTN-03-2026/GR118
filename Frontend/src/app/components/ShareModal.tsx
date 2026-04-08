import { motion, AnimatePresence } from "motion/react";
import { X, Facebook, Twitter, Send, Link2, Mail, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
}

export function ShareModal({ isOpen, onClose, title, url }: ShareModalProps) {
  const shareUrl = encodeURIComponent(url);
  const shareTitle = encodeURIComponent(title);

  const shareOptions = [
    {
      name: "Facebook",
      icon: Facebook,
      color: "bg-blue-600 hover:bg-blue-700",
      url: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
    },
    {
      name: "Twitter",
      icon: Twitter,
      color: "bg-sky-500 hover:bg-sky-600",
      url: `https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrl}`,
    },
    {
      name: "Telegram",
      icon: Send,
      color: "bg-blue-500 hover:bg-blue-600",
      url: `https://t.me/share/url?url=${shareUrl}&text=${shareTitle}`,
    },
    {
      name: "Email",
      icon: Mail,
      color: "bg-gray-600 hover:bg-gray-700",
      url: `mailto:?subject=${shareTitle}&body=${shareUrl}`,
    },
    {
      name: "Zalo",
      icon: MessageCircle,
      color: "bg-blue-400 hover:bg-blue-500",
      url: `https://zalo.me/share?url=${shareUrl}`,
    },
  ];

  const handleShare = (shareUrl: string) => {
    window.open(shareUrl, "_blank", "width=600,height=400");
    toast.success("Đang mở cửa sổ chia sẻ...");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    toast.success("Đã sao chép liên kết!");
    onClose();
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
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl shadow-2xl z-50 w-full max-w-md mx-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg">Chia sẻ vấn đề</h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Share Options */}
            <div className="p-6">
              <p className="text-gray-600 text-sm mb-4">
                Chia sẻ vấn đề này để nhiều người biết và cùng giải quyết
              </p>

              <div className="grid grid-cols-5 gap-3 mb-6">
                {shareOptions.map((option, index) => (
                  <motion.button
                    key={option.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleShare(option.url)}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div
                      className={`w-14 h-14 rounded-2xl ${option.color} flex items-center justify-center text-white transition-all group-hover:scale-110 group-hover:shadow-lg`}
                    >
                      <option.icon size={24} />
                    </div>
                    <span className="text-xs text-gray-600 font-medium">
                      {option.name}
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* Copy Link */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-500 mb-2">Hoặc sao chép liên kết</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={url}
                    readOnly
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all flex items-center gap-2"
                  >
                    <Link2 size={16} />
                    Sao chép
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
