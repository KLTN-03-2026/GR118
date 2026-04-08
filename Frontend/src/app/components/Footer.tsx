import { Link } from "react-router";
import { Shield, Phone, Mail, MapPin, Facebook, Youtube, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#1a1a2e] text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                <Shield size={18} className="text-white" />
              </div>
              <span className="font-black text-xl">Báo Cáo<span className="text-red-400">VN</span></span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Hệ thống báo cáo vấn đề công cộng tích hợp AI, kết nối cộng đồng với chính quyền địa phương.
            </p>
            <div className="flex gap-3 mt-4">
              {[Facebook, Youtube, Twitter].map((Icon, i) => (
                <button key={i} className="w-9 h-9 rounded-lg bg-white/10 hover:bg-red-500 flex items-center justify-center transition-colors duration-200">
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white">Liên kết nhanh</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              {[
                { to: "/", label: "Trang chủ" },
                { to: "/report", label: "Báo cáo vấn đề" },
                { to: "/issues", label: "Danh sách vấn đề" },
                { to: "/dashboard", label: "Thống kê" },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-white transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white">Danh mục</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              {["Đường - Vỉa hè", "Rác thải - Môi trường", "Chiếu sáng", "Ngập lụt", "Tiếng ồn"].map((cat) => (
                <li key={cat} className="hover:text-white transition-colors duration-200 cursor-pointer">{cat}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white">Liên hệ</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-red-400" />
                1800-1234 (Miễn phí)
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} className="text-red-400" />
                baocao@chinhphu.vn
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                Bộ Thông tin và Truyền thông, Hà Nội
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© 2026 BáoCáoVN. Bộ Thông tin và Truyền thông Việt Nam.</p>
          <div className="flex gap-4">
            <span className="hover:text-gray-300 cursor-pointer transition-colors">Chính sách bảo mật</span>
            <span className="hover:text-gray-300 cursor-pointer transition-colors">Điều khoản sử dụng</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
