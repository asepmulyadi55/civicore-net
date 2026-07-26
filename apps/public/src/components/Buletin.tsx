"use client";
// @ts-nocheck
import React from 'react';
import Link from 'next/link';

const PLACEHOLDER_IMAGES = [
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80&auto=format',
    'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=600&q=80&auto=format',
    'https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=600&q=80&auto=format',
];

function SkeletonCard({ isDark }) {
    const skBg = isDark ? '#1C2D27' : '#f1f5f9';
    const cardBg = isDark ? '#142920' : '#ffffff';
    return (
        <div className="rounded-2xl overflow-hidden animate-pulse" style={{ background: cardBg, border: `1px solid ${isDark ? '#1C2D27' : 'rgba(198,197,212,0.10)'}` }}>
            <div className="w-full h-64" style={{ background: skBg }} />
            <div className="p-8 space-y-4">
                <div className="h-3 rounded w-1/4" style={{ background: skBg }} />
                <div className="h-5 rounded w-3/4" style={{ background: skBg }} />
                <div className="h-3 rounded w-full" style={{ background: skBg }} />
                <div className="h-3 rounded w-5/6" style={{ background: skBg }} />
                <div className="h-8 rounded w-1/3 mt-4" style={{ background: skBg }} />
            </div>
        </div>
    );
}

interface BuletinProps {
    buletin?: any[];
    loading?: boolean;
    isDark?: boolean;
    eyebrow?: string;
    heading?: string;
}

export default function Buletin({ buletin = [], loading, isDark = false, eyebrow = 'Informasi', heading = 'Buletin' }: BuletinProps) {
    const headingColor = isDark ? '#F0EDE8' : '#1C2D27';
    const bodyColor    = isDark ? '#9E9C97' : '#595959';
    const cardBg       = isDark ? '#142920' : '#ffffff';
    const cardBorder   = isDark ? '#1C2D27' : 'rgba(198,197,212,0.10)';
    const dividerColor = isDark ? '#1C2D27' : '#E8E6E1';
    const viewAllColor = isDark ? '#D4AF37' : '#1C2D27';
    const viewAllBorderColor = isDark ? 'rgba(212,175,55,0.4)' : 'rgba(28,45,39,0.3)';

    if (loading && buletin.length === 0) {
        return (
            <section id="bulletins" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20" style={{ scrollMarginTop: '80px' }}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <SkeletonCard isDark={isDark} /><SkeletonCard isDark={isDark} /><SkeletonCard isDark={isDark} />
                </div>
            </section>
        );
    }

    return (
        <section id="bulletins" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20" style={{ scrollMarginTop: '80px' }}>
            <div className="flex items-end justify-between mb-10 md:mb-16 gap-6">
                <div className="max-w-2xl">
                    <span
                        className="font-semibold tracking-widest uppercase text-xs mb-2 md:mb-4 block"
                        style={{ color: '#D4AF37', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                        {eyebrow}
                    </span>
                    <h2
                        className="text-2xl md:text-4xl font-medium tracking-tight"
                        style={{ color: headingColor, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                        {heading}
                    </h2>
                </div>
                <Link href="/bulletins"
                    className="text-sm font-medium flex items-center gap-2 hover:gap-3 transition-all tracking-wide pb-1 border-b self-start sm:self-auto mt-2 sm:mt-0 flex-shrink-0"
                    style={{ color: viewAllColor, borderColor: viewAllBorderColor, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                    View All <span className="material-symbols-outlined text-sm">arrow_right_alt</span>
                </Link>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <SkeletonCard isDark={isDark} /><SkeletonCard isDark={isDark} /><SkeletonCard isDark={isDark} />
                </div>
            ) : buletin.length === 0 ? (
                <div className="text-center py-16 rounded-2xl shadow-sm" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
                    <span className="material-symbols-outlined text-5xl mb-3 block" style={{ color: isDark ? '#1C2D27' : '#e2e8f0' }}>article</span>
                    <p className="font-semibold" style={{ color: bodyColor }}>No Bulletins Available</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {buletin.map((item, i) => {
                        const image = item.image_url || PLACEHOLDER_IMAGES[i % PLACEHOLDER_IMAGES.length];

                        return (
                            <article key={item.id || i}
                                className="rounded-2xl overflow-hidden group flex flex-col h-full lift-on-hover transition-all duration-500"
                                style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>

                                {/* Image */}
                                <div className="relative h-56 md:h-[22rem] overflow-hidden flex-shrink-0">
                                    <img src={image} alt={item.title}
                                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                                </div>

                                {/* Card body */}
                                <div className="p-6 md:p-10 flex flex-col flex-grow">
                                    <h3
                                        className="text-xl md:text-2xl font-medium mb-3"
                                        style={{ color: headingColor, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                                    >
                                        {item.title}
                                    </h3>
                                    {item.description && (
                                        <p
                                            className="text-sm leading-relaxed mb-6 md:mb-8 flex-grow font-light"
                                            style={{ color: bodyColor }}
                                        >
                                            &ldquo;{item.description}&rdquo;
                                        </p>
                                    )}
                                    <div className="flex items-center justify-between mt-auto border-t pt-5 md:pt-6" style={{ borderColor: dividerColor }}>
                                        {item.url ? (
                                            <a href={item.url} target="_blank" rel="noopener noreferrer"
                                                className="font-medium text-xs md:text-sm flex items-center gap-2 hover:gap-3 transition-all tracking-wide"
                                                style={{ color: '#D4AF37', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                                            >
                                                READ MORE <span className="material-symbols-outlined text-sm">arrow_right_alt</span>
                                            </a>
                                        ) : (
                                            <span
                                                className="font-medium text-xs md:text-sm tracking-wide"
                                                style={{ color: bodyColor, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                                            >
                                                Details TBA
                                            </span>
                                        )}
                                        {item.date && (
                                            <span className="text-xs font-light" style={{ color: bodyColor }}>
                                                {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
