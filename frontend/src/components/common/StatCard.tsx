import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  changePct?: number;
  icon: LucideIcon;
  variant?: 'emerald' | 'amber' | 'blue' | 'purple' | 'slate';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  changePct,
  icon: Icon,
  variant = 'emerald',
}) => {
  const colorMap = {
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-100',
    amber: 'bg-amber-50 text-amber-800 border-amber-100',
    blue: 'bg-blue-50 text-blue-800 border-blue-100',
    purple: 'bg-purple-50 text-purple-800 border-purple-100',
    slate: 'bg-slate-100 text-slate-800 border-slate-200',
  };

  const iconBgMap = {
    emerald: 'bg-emerald-600 text-white',
    amber: 'bg-amber-500 text-white',
    blue: 'bg-blue-600 text-white',
    purple: 'bg-purple-600 text-white',
    slate: 'bg-slate-700 text-white',
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div className={`p-2.5 rounded-lg ${iconBgMap[variant]} shadow-sm`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-900 tracking-tight">
          {value}
        </span>
        {changePct !== undefined && (
          <span
            className={`inline-flex items-center text-xs font-semibold px-1.5 py-0.5 rounded ${
              changePct >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
            }`}
          >
            {changePct >= 0 ? (
              <TrendingUp className="w-3 h-3 mr-0.5" />
            ) : (
              <TrendingDown className="w-3 h-3 mr-0.5" />
            )}
            {changePct > 0 ? `+${changePct}%` : `${changePct}%`}
          </span>
        )}
      </div>
      {subtext && (
        <p className="mt-1.5 text-xs text-slate-500 font-medium">
          {subtext}
        </p>
      )}
    </div>
  );
};
