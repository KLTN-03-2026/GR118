import { Outlet, useLocation } from "react-router";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { Toaster } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { SupportChatBox } from "./components/SupportChatBox";

export function Root() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] relative">
      <Navbar />
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="flex-1"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <Footer />
      <Toaster position="top-right" richColors />
      <SupportChatBox />
    </div>
  );
}