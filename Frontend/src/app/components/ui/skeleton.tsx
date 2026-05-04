import { motion } from "motion/react";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
}

export function Skeleton({ className = "", width, height, borderRadius = "0.5rem" }: SkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ 
        duration: 1.5, 
        repeat: Infinity, 
        ease: "easeInOut" 
      }}
      className={`bg-gray-200 ${className}`}
      style={{ 
        width, 
        height, 
        borderRadius 
      }}
    />
  );
}

export function SkeletonText({ lines = 1, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          height="1em" 
          width={i === lines - 1 && lines > 1 ? "70%" : "100%"} 
        />
      ))}
    </div>
  );
}

export function SkeletonCircle({ size = "2.5rem", className = "" }: { size?: string | number; className?: string }) {
  return (
    <Skeleton 
      width={size} 
      height={size} 
      borderRadius="9999px" 
      className={className} 
    />
  );
}
