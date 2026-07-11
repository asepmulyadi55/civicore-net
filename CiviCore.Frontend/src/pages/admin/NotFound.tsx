// @ts-nocheck
import React from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../admin/AdminLayout';

export default function NotFound() {
  return (
    <AdminLayout title="Page Not Found">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        {/* Animated decoration */}
        <div className="relative mb-8 flex items-center justify-center">
          <div className="absolute w-36 h-36 rounded-full bg-primary/5 animate-ping" />
          <div className="relative w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-icons text-5xl text-primary">search_off</span>
          </div>
        </div>

        <p className="text-8xl font-extrabold text-primary/20 mb-0 tracking-tighter select-none">
          404
        </p>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white -mt-2 mb-3">
          Page Not Found
        </h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 leading-relaxed">
          The page you're looking for doesn't exist or you don't have permission to view it.
        </p>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 hover:scale-[1.02] transition-all duration-200"
          >
            <span className="material-icons text-sm">home</span>
            Go to Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200"
          >
            <span className="material-icons text-sm">arrow_back</span>
            Go Back
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
