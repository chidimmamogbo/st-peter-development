import React from "react";
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from "lucide-react";

export type AlertType = "info" | "success" | "warning" | "error";

interface AlertBannerProps {
  type?: AlertType;
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  type = "info",
  title,
  message,
  onClose,
  className = "",
}) => {
  const styles = {
    info: {
      bg: "bg-sky-50 border-sky-200 text-sky-900",
      icon: <Info className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />,
      titleColor: "text-sky-900",
      textColor: "text-sky-800",
    },
    success: {
      bg: "bg-emerald-50 border-emerald-200 text-emerald-900",
      icon: <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />,
      titleColor: "text-emerald-900",
      textColor: "text-emerald-800",
    },
    warning: {
      bg: "bg-amber-50 border-amber-200 text-amber-900",
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />,
      titleColor: "text-amber-900",
      textColor: "text-amber-800",
    },
    error: {
      bg: "bg-rose-50 border-rose-200 text-rose-900",
      icon: <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />,
      titleColor: "text-rose-900",
      textColor: "text-rose-800",
    },
  }[type];

  return (
    <div
      className={`border rounded-xl p-4 flex gap-3.5 transition-all shadow-sm ${styles.bg} ${className}`}
      role="alert"
    >
      {styles.icon}
      <div className="flex-1 min-w-0">
        {title && <h4 className={`text-sm font-semibold mb-0.5 ${styles.titleColor}`}>{title}</h4>}
        <p className={`text-sm leading-relaxed ${styles.textColor}`}>{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 hover:bg-black/5 rounded-lg transition text-slate-500 hover:text-slate-700 -mr-1"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
