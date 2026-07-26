"use client";
import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="bg-surface-container-lowest min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-md w-full">
          {/* Icon */}
          <div className="relative mb-8 flex items-center justify-center">
            <div className="absolute w-40 h-40 rounded-full bg-rose-500/5 animate-ping" />
            <div className="relative w-28 h-28 rounded-full bg-rose-500/10 flex items-center justify-center">
              <span
                style={{ fontFamily: "Material Symbols Outlined" }}
                className="text-6xl text-rose-500"
              >
                error
              </span>
            </div>
          </div>

          <p className="text-7xl font-bold text-rose-500 mb-2 tracking-tight">
            500
          </p>
          <h1 className="text-2xl font-semibold text-slate-800 mb-3">
            Terjadi Kesalahan Server
          </h1>
          <p className="text-slate-500 mb-10 leading-relaxed">
            Maaf, terjadi kesalahan yang tidak terduga. Tim kami telah diberitahu. Silakan coba lagi dalam beberapa saat.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-xl font-semibold hover:opacity-90 transition-all duration-200 shadow-lg shadow-rose-500/20"
            >
              <span style={{ fontFamily: "Material Symbols Outlined" }} className="text-[18px]">refresh</span>
              Coba Lagi
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-all duration-200"
            >
              <span style={{ fontFamily: "Material Symbols Outlined" }} className="text-[18px]">home</span>
              Kembali ke Beranda
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
