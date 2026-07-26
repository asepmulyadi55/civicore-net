import React from 'react';

/**
 * Animated Shimmer Base wrapper for smooth pulse effects
 */
const ShimmerBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded ${className}`} />
);

/**
 * CardSkeleton: Used for News, Event, Bulletin, and Property cards
 */
export const CardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800/80 flex flex-col h-full">
    <ShimmerBlock className="w-full h-48 sm:h-52 shrink-0" />
    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
      <div className="space-y-2">
        <ShimmerBlock className="w-1/3 h-4 rounded-full" />
        <ShimmerBlock className="w-4/5 h-6 rounded-md" />
        <ShimmerBlock className="w-full h-4 rounded-md mt-2" />
        <ShimmerBlock className="w-2/3 h-4 rounded-md" />
      </div>
      <div className="pt-2 flex justify-between items-center border-t border-slate-100 dark:border-slate-800/60">
        <ShimmerBlock className="w-1/4 h-3 rounded-full" />
        <ShimmerBlock className="w-6 h-6 rounded-full" />
      </div>
    </div>
  </div>
);

/**
 * HeroSkeleton: Used for top hero sections
 */
export const HeroSkeleton: React.FC = () => (
  <div className="relative w-full h-[480px] sm:h-[560px] bg-slate-100 dark:bg-slate-900 rounded-3xl overflow-hidden flex items-center p-8 sm:p-12 mb-12">
    <ShimmerBlock className="absolute inset-0 w-full h-full opacity-60" />
    <div className="relative z-10 max-w-2xl space-y-6">
      <ShimmerBlock className="w-32 h-6 rounded-full" />
      <ShimmerBlock className="w-full h-12 sm:h-16 rounded-xl" />
      <ShimmerBlock className="w-3/4 h-5 rounded-md" />
      <ShimmerBlock className="w-1/2 h-5 rounded-md" />
      <div className="pt-4 flex gap-4">
        <ShimmerBlock className="w-40 h-12 rounded-xl" />
        <ShimmerBlock className="w-32 h-12 rounded-xl" />
      </div>
    </div>
  </div>
);

/**
 * DetailSkeleton: Used for detail pages (news/[id], property/[id], bulletins/[id])
 */
export const DetailSkeleton: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
    <div className="space-y-4">
      <ShimmerBlock className="w-28 h-6 rounded-full" />
      <ShimmerBlock className="w-full h-10 sm:h-12 rounded-xl" />
      <div className="flex gap-4 items-center">
        <ShimmerBlock className="w-10 h-10 rounded-full shrink-0" />
        <div className="space-y-2 flex-1">
          <ShimmerBlock className="w-36 h-4 rounded-md" />
          <ShimmerBlock className="w-24 h-3 rounded-md" />
        </div>
      </div>
    </div>
    
    <ShimmerBlock className="w-full h-72 sm:h-96 rounded-2xl" />

    <div className="space-y-4 pt-4">
      <ShimmerBlock className="w-full h-4 rounded-md" />
      <ShimmerBlock className="w-[95%] h-4 rounded-md" />
      <ShimmerBlock className="w-[98%] h-4 rounded-md" />
      <ShimmerBlock className="w-[85%] h-4 rounded-md" />
      <div className="py-2" />
      <ShimmerBlock className="w-full h-4 rounded-md" />
      <ShimmerBlock className="w-[92%] h-4 rounded-md" />
      <ShimmerBlock className="w-[88%] h-4 rounded-md" />
    </div>
  </div>
);

/**
 * GridSkeleton: Used for card listing grids
 */
export const GridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
    {Array.from({ length: count }).map((_, idx) => (
      <CardSkeleton key={idx} />
    ))}
  </div>
);
