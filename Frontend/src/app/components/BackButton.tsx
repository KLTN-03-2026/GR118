import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";

interface BackButtonProps {
  label?: string;
  to?: string;
  className?: string;
}

export function BackButton({ label = "Quay lại", to, className = "" }: BackButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      whileHover={{ scale: 1.02, x: -4 }}
      whileTap={{ scale: 0.98 }}
      className={`inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm ${className}`}
    >
      <ArrowLeft size={18} />
      <span className="font-medium">{label}</span>
    </motion.button>
  );
}
