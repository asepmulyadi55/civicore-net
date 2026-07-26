import React from 'react';
import { DetailSkeleton } from '@/components/Skeletons';

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between">
      {/* Top Header Placeholder */}
      <header className="w-full h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 animate-pulse flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-amber-600 animate-ping" />
          </div>
          <div className="w-32 h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>
        <div className="hidden md:flex gap-4">
          <div className="w-16 h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="w-16 h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="w-16 h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>
      </header>

      {/* Main Content Skeleton */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <DetailSkeleton />
      </main>

      {/* Footer Placeholder */}
      <footer className="w-full h-20 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 flex items-center justify-between">
        <div className="w-48 h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
      </footer>
    </div>
  );
}
