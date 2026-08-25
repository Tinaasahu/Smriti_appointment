import React from "react";

export default function Badge({ children, variant = "default", size = "md", className = "" }) {
  const variantMap = {
    default: "bg-slate-100 text-slate-700 border-slate-200",
    purple: "bg-brand-50 text-brand-700 border-brand-200",
    green: "bg-heal-50 text-heal-700 border-heal-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    in_progress: "bg-blue-50 text-blue-700 border-blue-200",
    completed: "bg-heal-50 text-heal-700 border-heal-200",
    waiting: "bg-brand-50 text-brand-700 border-brand-200",
    upcoming: "bg-slate-50 text-slate-500 border-slate-200",
  };

  const sizeMap = {
    sm: "text-[10px] px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
    lg: "text-sm px-3 py-1.5 font-bold",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full border ${variantMap[variant] || variantMap.default} ${sizeMap[size]} ${className}`}
    >
      {children}
    </span>
  );
}
