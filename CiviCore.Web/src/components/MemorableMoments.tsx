"use client";
// @ts-nocheck
import React from 'react';

const PLACEHOLDER_IMAGES = [
    'https://images.unsplash.com/photo-1528605105345-5344ea20e269?w=800&q=80&auto=format',
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80&auto=format',
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=80&auto=format',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80&auto=format',
];

export default function MemorableMoments({ moments = {}, pastEvents = [], loading, isDark = false }) {
    const headingColor = isDark ? '#F0EDE8' : '#1C2D27';
    const bodyColor    = isDark ? '#9E9C97' : '#595959';
    const sectionBg    = isDark ? '#0A1510' : '#F4F3EF';
    const skBg         = isDark ? '#1C2D27' : '#e2e8f0';
    const cardBg       = isDark ? '#142920' : '#ffffff';
    const cardBorder   = isDark ? '#1C2D27' : 'rgba(198,197,212,0.10)';

    const title      = moments?.title       || '';
    const eyebrow    = moments?.eyebrow     || '';
    const subtitle   = moments?.subtitle    || '';
    const archiveUrl = moments?.archive_url || null;
    const images     = moments?.images      || [];

    // Build 4 display images: prefer curated moments images, fall back to past events
    const displayImages = Array.from({ length: 4 }, (_, i) => {
        if (images[i]?.url) return { url: images[i].url, alt: images[i].caption || 'Memorable Moment' };
        if (pastEvents[i]?.image_url) return { url: pastEvents[i].image_url, alt: pastEvents[i].title || 'Memorable Moment' };
        return null;
    });

    const hasAnyUploadedImage = images.some(img => img?.url);
    const hasAnyPastEventImage = pastEvents.some(event => event?.image_url);
    const hasData = hasAnyUploadedImage || hasAnyPastEventImage;

    if (loading) {
        return (
            <section className="py-32" style={{ background: sectionBg }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 gap-6">
                        <div className="space-y-3">
                            <div className="h-9 w-64 rounded-xl animate-pulse" style={{ background: skBg }} />
                            <div className="h-4 w-80 rounded-lg animate-pulse" style={{ background: skBg }} />
                        </div>
                        <div className="h-12 w-48 rounded-xl animate-pulse" style={{ background: skBg }} />
                    </div>
                    <div
                        className="memorable-bento grid grid-cols-1 md:grid-cols-4 gap-4"
                        style={{ gridAutoRows: '250px' }}
                    >
                        <div className="memorable-bento__large rounded-2xl animate-pulse" style={{ background: skBg }} />
                        <div className="memorable-bento__wide rounded-2xl animate-pulse" style={{ background: skBg }} />
                        <div className="rounded-2xl animate-pulse" style={{ background: skBg }} />
                        <div className="rounded-2xl animate-pulse" style={{ background: skBg }} />
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section id="gallery" className="py-16 md:py-32" style={{ background: sectionBg, scrollMarginTop: '80px' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="text-center max-w-2xl mx-auto mb-12 md:mb-20">
                    <span
                        className="font-semibold tracking-widest uppercase text-xs mb-3 md:mb-4 block"
                        style={{ color: '#D4AF37', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                        {eyebrow}
                    </span>
                    <h2
                        className="text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight mb-3 md:mb-4"
                        style={{ color: headingColor, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                        {title}
                    </h2>
                    <p className="font-light text-sm md:text-base leading-relaxed" style={{ color: bodyColor }}>{subtitle}</p>
                </div>

                {archiveUrl && (
                    <div className="flex justify-center mb-12">
                        <a
                            href={archiveUrl}
                            className="group inline-flex items-center gap-2 font-medium text-sm px-8 py-3 rounded-lg transition-all hover:opacity-90"
                            style={{ background: '#1C2D27', color: '#FAF9F6', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                            View Full Archive
                            <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
                        </a>
                    </div>
                )}

                {/* Bento Grid */}
                {!hasData ? (
                    <div className="text-center py-16 rounded-2xl shadow-sm" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
                        <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: isDark ? '#1C2D27' : '#e2e8f0' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="font-semibold" style={{ color: bodyColor }}>No Memorable Moments</p>
                    </div>
                ) : (
                    <div
                        className="memorable-bento grid grid-cols-1 md:grid-cols-4 gap-4"
                        style={{ gridAutoRows: '250px' }}
                    >
                        {/* Large image — col-span-2 row-span-2 on md+ */}
                        <div className={`memorable-bento__large rounded-2xl overflow-hidden group ${!displayImages[0] ? 'bg-black/5 dark:bg-white/5' : ''}`}>
                            {displayImages[0] && (
                                <img
                                    src={displayImages[0].url}
                                    alt={displayImages[0].alt}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                            )}
                        </div>

                        {/* Top-right — col-span-2 on md+ */}
                        <div className={`memorable-bento__wide rounded-2xl overflow-hidden group ${!displayImages[1] ? 'bg-black/5 dark:bg-white/5' : ''}`}>
                            {displayImages[1] && (
                                <img
                                    src={displayImages[1].url}
                                    alt={displayImages[1].alt}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                            )}
                        </div>

                        {/* Bottom-right small #1 */}
                        <div className={`rounded-2xl overflow-hidden group ${!displayImages[2] ? 'bg-black/5 dark:bg-white/5' : ''}`}>
                            {displayImages[2] && (
                                <img
                                    src={displayImages[2].url}
                                    alt={displayImages[2].alt}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                            )}
                        </div>

                        {/* Bottom-right small #2 */}
                        <div className={`rounded-2xl overflow-hidden group ${!displayImages[3] ? 'bg-black/5 dark:bg-white/5' : ''}`}>
                            {displayImages[3] && (
                                <img
                                    src={displayImages[3].url}
                                    alt={displayImages[3].alt}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
