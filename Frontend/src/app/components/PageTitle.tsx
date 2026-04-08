import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";

interface PageTitleProps {
  title: React.ReactNode;
  backTo?: string;
  subtitle?: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function PageTitle({ title, backTo, subtitle, className = "", action }: PageTitleProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo !== undefined) {
      if (backTo) {
        navigate(backTo);
      } else {
        navigate(-1);
      }
    }
  };

  return (
    <div className={className}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            {backTo !== undefined && (
              <button
                onClick={handleBack}
                className="text-gray-600 hover:text-gray-900 transition-colors flex-shrink-0 -ml-1"
                aria-label="Quay lại"
              >
                <ArrowLeft size={28} strokeWidth={2.5} />
              </button>
            )}
            <h1 className="text-3xl font-black text-gray-900">{title}</h1>
          </div>
          {subtitle && <div className="text-gray-500 mt-1 ml-11">{subtitle}</div>}
        </div>
        {action && <div className="self-start sm:self-auto">{action}</div>}
      </div>
    </div>
  );
}
