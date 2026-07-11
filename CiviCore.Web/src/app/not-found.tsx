"use client";
import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="bg-surface-container-lowest dark:bg-primary text-on-surface dark:text-on-primary min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-md w-full">
        {/* Animated icon */}
        <div className="relative mb-8 flex items-center justify-center">
          <div className="absolute w-40 h-40 rounded-full bg-primary/5 dark:bg-primary-fixed-dim/5 animate-ping" />
          <div className="relative w-28 h-28 rounded-full bg-primary/10 dark:bg-primary-fixed-dim/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-6xl text-primary dark:text-primary-fixed-dim">
              search_off
            </span>
          </div>
        </div>

        <p className="text-7xl font-bold text-primary dark:text-primary-fixed-dim mb-2 tracking-tight">
          404
        </p>
        <h1 className="text-2xl font-semibold text-on-surface dark:text-on-primary mb-3">
          Halaman Tidak Ditemukan
        </h1>
        <p className="text-text-muted dark:text-on-primary/60 mb-10 leading-relaxed">
          Halaman yang Anda cari mungkin telah dipindahkan, dihapus, atau tidak pernah ada.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:opacity-90 transition-all duration-200 shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
            Kembali ke Beranda
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-border-subtle dark:border-primary-container/50 rounded-xl font-semibold text-on-surface dark:text-on-primary hover:bg-surface-container-low dark:hover:bg-primary-container/20 transition-all duration-200"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Kembali
          </button>
        </div>
      </div>
    </div>
  );
}
