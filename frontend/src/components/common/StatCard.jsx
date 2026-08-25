import React from "react";

export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  badge, 
  variant = "default",
  icon: Icon,
  className = "" 
}) {
  const variantStyles = {
    default: "bg-white border-slate-100 text-slate-900",
    purple: "bg-brand-50/50 border-brand-100 text-brand-900",
    green: "bg-heal-50/50 border-heal-100 text-heal-900",
    amber: "bg-amber-50/50 border-amber-100 text-amber-900",
  };

  const valueColors = {
    default: "text-slate-900",
    purple: "text-brand-600",
    green: "text-heal-600",
    amber: "text-amber-500",
  };

  return (
    <div className={`p-5 rounded-2xl bg-white border border-slate-100/80 shadow-sm transition-all hover:shadow-md hover:border-slate-200/80 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 tracking-wide">{title}</span>
        {Icon && (
          <div className="p-1.5 rounded-lg bg-slate-50 text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className={`text-xl sm:text-2xl font-extrabold tracking-tight ${valueColors[variant] || "text-slate-900"}`}>
          {value}
        </span>
        {badge && (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-slate-400 font-medium">{subtitle}</p>
      )}
    </div>
  );
}
