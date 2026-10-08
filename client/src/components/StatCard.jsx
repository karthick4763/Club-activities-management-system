import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'navy', badge, onClick, clickable = false }) => {
  const isClickable = Boolean(onClick || clickable);
  const colorMap = {
    navy: {
      bg: 'bg-purple-50 text-[#7C3AED] border-purple-200',
      iconBg: 'bg-[#7C3AED] text-white shadow-purple-100',
      border: 'hover:border-[#7C3AED]/40'
    },
    indigo: {
      bg: 'bg-purple-50 text-[#7C3AED] border-purple-200',
      iconBg: 'bg-[#7C3AED] text-white shadow-purple-100',
      border: 'hover:border-[#7C3AED]/40'
    },
    accent: {
      bg: 'bg-purple-50 text-[#7C3AED] border-purple-200',
      iconBg: 'bg-[#7C3AED] text-white shadow-purple-100',
      border: 'hover:border-[#7C3AED]/40'
    },
    emerald: {
      bg: 'bg-emerald-50 text-[#16A34A] border-emerald-200',
      iconBg: 'bg-[#16A34A] text-white shadow-emerald-100',
      border: 'hover:border-emerald-300'
    },
    amber: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      iconBg: 'bg-amber-500 text-white shadow-amber-100',
      border: 'hover:border-amber-300'
    },
    rose: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      iconBg: 'bg-rose-600 text-white shadow-rose-100',
      border: 'hover:border-rose-300'
    },
    sky: {
      bg: 'bg-sky-50 text-[#0284C7] border-sky-200',
      iconBg: 'bg-[#0284C7] text-white shadow-sky-100',
      border: 'hover:border-sky-300'
    },
    purple: {
      bg: 'bg-purple-50 text-[#7C3AED] border-purple-200',
      iconBg: 'bg-[#7C3AED] text-white shadow-purple-100',
      border: 'hover:border-purple-300'
    }
  };

  const scheme = colorMap[color] || colorMap.navy;

  return (
    <div 
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`group bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm transition-all duration-200 ${scheme.border} flex flex-col justify-between ${
        isClickable 
          ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5 hover:border-[#7C3AED]/50 active:translate-y-0 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30' 
          : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
            {isClickable && (
              <span className="text-[11px] text-slate-400 group-hover:text-[#7C3AED] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all">↗</span>
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
            {badge && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${scheme.bg}`}>
                {badge}
              </span>
            )}
          </div>
        </div>
        {Icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm ${scheme.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {subtitle && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          {subtitle}
        </div>
      )}
    </div>
  );
};
