import React from 'react';

export const SkeletonLoader: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Hero Skeleton */}
      <div className="glass-panel p-8 rounded-3xl h-64 flex flex-col justify-between bg-slate-900/60">
        <div className="flex justify-between items-start">
          <div className="space-y-3">
            <div className="h-8 w-48 bg-slate-800 rounded-lg"></div>
            <div className="h-4 w-32 bg-slate-800/60 rounded"></div>
          </div>
          <div className="h-16 w-16 bg-slate-800 rounded-full"></div>
        </div>
        <div className="flex justify-between items-end">
          <div className="h-14 w-36 bg-slate-800 rounded-xl"></div>
          <div className="h-6 w-40 bg-slate-800 rounded-lg"></div>
        </div>
      </div>

      {/* Grid of 6 Metric Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="glass-card p-4 rounded-2xl h-32 space-y-3 bg-slate-900/40">
            <div className="flex justify-between">
              <div className="h-4 w-16 bg-slate-800 rounded"></div>
              <div className="h-5 w-5 bg-slate-800 rounded"></div>
            </div>
            <div className="h-7 w-20 bg-slate-800 rounded-lg"></div>
            <div className="h-3 w-12 bg-slate-800/60 rounded"></div>
          </div>
        ))}
      </div>

      {/* Hourly Forecast Skeleton */}
      <div className="glass-panel p-6 rounded-3xl h-48 bg-slate-900/50 space-y-4">
        <div className="h-6 w-44 bg-slate-800 rounded-lg"></div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-28 w-24 bg-slate-800/40 rounded-2xl shrink-0"></div>
          ))}
        </div>
      </div>
    </div>
  );
};
