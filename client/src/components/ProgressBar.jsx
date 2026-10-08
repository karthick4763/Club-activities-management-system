import React from 'react';

export const ProgressBar = ({ current = 0, target = 0, size = 'md', showLabel = true }) => {
  const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : (current > 0 ? 100 : 0);

  // Dynamic progress bar color
  let barColor = 'bg-[#7C3AED]';
  if (percent >= 100) {
    barColor = 'bg-[#16A34A]';
  } else if (percent >= 60) {
    barColor = 'bg-[#7C3AED]';
  } else if (percent >= 30) {
    barColor = 'bg-[#8B5CF6]';
  } else {
    barColor = 'bg-slate-400';
  }

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4'
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5 text-xs">
          <span className="font-semibold text-slate-700">
            {current} <span className="text-slate-400 font-normal">/ {target} new members</span>
          </span>
          <span className={`font-bold ${percent >= 100 ? 'text-emerald-600' : 'text-slate-700'}`}>
            {percent}%
          </span>
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 ${heights[size]}`}>
        <div
          className={`${barColor} ${heights[size]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </div>
  );
};
