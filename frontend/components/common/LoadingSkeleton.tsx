import React from "react";

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 5,
}) => {
  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-pulse">
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-slate-200 rounded flex-1"></div>
        ))}
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-6 py-4 flex gap-4 items-center">
            {Array.from({ length: columns }).map((_, c) => (
              <div
                key={c}
                className="h-4 bg-slate-200 rounded flex-1"
                style={{ width: `${Math.max(40, (c + 1) * 20)}%` }}
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm animate-pulse space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="h-5 w-2/3 bg-slate-200 rounded"></div>
            <div className="h-6 w-12 bg-slate-200 rounded-full"></div>
          </div>
          <div className="h-4 w-1/2 bg-slate-100 rounded"></div>
          <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
            <div className="h-4 w-20 bg-slate-200 rounded"></div>
            <div className="h-8 w-24 bg-slate-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const StatGridSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="h-3 w-20 bg-slate-200 rounded mb-2"></div>
          <div className="h-8 w-16 bg-slate-300 rounded mb-1"></div>
          <div className="h-3 w-28 bg-slate-100 rounded"></div>
        </div>
      ))}
    </div>
  );
};

export const StatCardSkeleton = StatGridSkeleton;

export const DetailSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm animate-pulse space-y-6">
      <div className="h-8 w-1/3 bg-slate-300 rounded"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-16 bg-slate-100 rounded-lg"></div>
        <div className="h-16 bg-slate-100 rounded-lg"></div>
        <div className="h-16 bg-slate-100 rounded-lg"></div>
      </div>
      <div className="h-48 bg-slate-100 rounded-lg"></div>
    </div>
  );
};
