"use client";
// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';

interface FeaturedEventProps {
    featuredEvent?: any;
    loading?: boolean;
    isDark?: boolean;
    eyebrow?: string;
}

export default function FeaturedEvent({ featuredEvent = {}, loading, isDark = false, eyebrow = 'Featured Event' }: FeaturedEventProps) {
    const dropdownBg = isDark ? '#1A2E28' : '#ffffff';
    const dropdownBorder = isDark ? '#1C2D27' : '#f1f5f9';
    const dropdownText = isDark ? '#F0EDE8' : '#374151';
    const dropdownHoverBg = isDark ? '#1C2D27' : '#f8fafc';

    const title = featuredEvent?.title || 'Dwipapuri Summer Carnival 2026';
    const date = featuredEvent?.date || null;
    const youtubeId = featuredEvent?.youtube_id || null;
    const type = featuredEvent?.type || 'full';
    const imageUrl = featuredEvent?.image_url || null;
    const mobileImageUrl = featuredEvent?.mobile_image_url || null;
    const description = featuredEvent?.description || '';

    const formattedDate = date
        ? new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
        : 'Saturday, August 25th • 4:00 PM';

    const isSimple = type === 'simple';

    const youtubeUrl = youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : null;
    const bgImage = isSimple
        ? (imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1920&q=80&auto=format')
        : (youtubeId
            ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
            : 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1920&q=80&auto=format');
    const shareUrl = youtubeUrl || window.location.href;

    // â”€â”€ Dropdown state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const [playing, setPlaying] = useState(false);
    const [calOpen, setCalOpen] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [copiedPlatform, setCopiedPlatform] = useState(null);
    const calRef = useRef<HTMLDivElement>(null);
    const shareRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClick(e) {
            if (calRef.current && !calRef.current.contains(e.target)) setCalOpen(false);
            if (shareRef.current && !shareRef.current.contains(e.target)) setShareOpen(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // â”€â”€ Watch Now â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    function handleWatchNow() {
        if (youtubeUrl) window.open(youtubeUrl, '_blank', 'noopener,noreferrer');
    }

    // â”€â”€ Add to Calendar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    function buildGoogleCalUrl() {
        const start = date ? date.replace(/-/g, '') : '';
        const end = start; // single-day
        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: title,
            ...(start && { dates: `${start}/${end}` }),
            details: `${description}\n\n${shareUrl}`,
        });
        return `https://calendar.google.com/calendar/render?${params}`;
    }

    function downloadIcs() {
        const dtStart = date ? date.replace(/-/g, '') : '';
        const ics = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//CiviCore//EN',
            'BEGIN:VEVENT',
            `SUMMARY:${title}`,
            ...(dtStart ? [`DTSTART;VALUE=DATE:${dtStart}`, `DTEND;VALUE=DATE:${dtStart}`] : []),
            `DESCRIPTION:${description.replace(/\n/g, '\\n')} ${shareUrl}`,
            'END:VEVENT',
            'END:VCALENDAR',
        ].join('\r\n');
        const blob = new Blob([ics], { type: 'text/calendar' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${title.replace(/\s+/g, '_')}.ics`;
        a.click();
        URL.revokeObjectURL(a.href);
        setCalOpen(false);
    }

    // â”€â”€ Share â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const shareOptions = [
        {
            label: 'WhatsApp',
            icon: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M11.5 2.003C6.197 2.003 1.892 6.307 1.892 11.61a9.503 9.503 0 001.285 4.786L2 22l5.757-1.155a9.535 9.535 0 004.743 1.258c5.303 0 9.608-4.304 9.608-9.607 0-5.302-4.305-9.493-9.608-9.493',
            color: '#25D366',
            url: `https://wa.me/?text=${encodeURIComponent(title + '\n' + shareUrl)}`,
        },
        {
            label: 'Facebook',
            icon: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
            color: '#1877F2',
            url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
        },
        {
            label: 'X (Twitter)',
            icon: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.631L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z',
            color: '#000000',
            url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`,
        },
        {
            label: 'Telegram',
            icon: 'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z',
            color: '#26A5E4',
            url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`,
        },
        {
            label: 'Instagram',
            icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z',
            color: '#E1306C',
            copyOnly: true,
        },
        {
            label: 'TikTok',
            icon: 'M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z',
            color: '#000000',
            copyOnly: true,
        },
    ];

    function handleCopyLink(platform) {
        navigator.clipboard.writeText(shareUrl).then(() => {
            if (platform) {
                setCopiedPlatform(platform);
                setTimeout(() => setCopiedPlatform(null), 2000);
            } else {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        });
    }

    return (
        <section
            id="featured"
            className={isSimple
                ? 'w-full pb-20'
                : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20'
            }
            style={{ scrollMarginTop: '80px' }}
        >
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@200;300;400&display=swap');
                    @keyframes hero-shimmer {
                        0% { background-position: -200% center; }
                        100% { background-position: 200% center; }
                    }
                    @keyframes hero-float-up {
                        0% { opacity: 0; transform: translateY(40px) scale(0.95); filter: blur(10px); }
                        100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
                    }
                    .modern-hero-title {
                        background: linear-gradient(
                            110deg,
                            rgba(255, 255, 255, 0.45) 20%,
                            rgba(212, 175, 55, 0.65) 40%,
                            rgba(212, 175, 55, 0.65) 60%,
                            rgba(255, 255, 255, 0.45) 80%
                        );
                        background-size: 200% auto;
                        color: transparent;
                        -webkit-background-clip: text;
                        background-clip: text;
                        animation: hero-shimmer 7s linear infinite, hero-float-up 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                        filter: drop-shadow(0 15px 35px rgba(0,0,0,0.3)) drop-shadow(0 4px 10px rgba(0,0,0,0.15));
                        font-family: 'Montserrat', sans-serif;
                    }
                `}
            </style>
            <div className={`relative overflow-hidden group h-[700px] sm:h-[580px] md:h-[700px]${isSimple ? '' : ' rounded-3xl'}`}>
                {/* Background — YouTube embed (full type) or image */}
                {!isSimple && youtubeId ? (
                    <>
                        {/* Poster: shown when not playing */}
                        <img
                            src={bgImage}
                            alt={title}
                            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${playing ? 'opacity-0 pointer-events-none' : 'opacity-100'
                                }`}
                        />

                        {/* iframe: mounted only after first play to avoid autoplay */}
                        {playing && (
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                <iframe
                                    className="absolute"
                                    style={{
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        width: 'max(100%, 177.78vh)',
                                        height: 'max(56.25vw, 100%)',
                                        border: 'none',
                                    }}
                                    src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&controls=0&rel=0&modestbranding=1&playsinline=1`}
                                    title={title}
                                    allow="autoplay; encrypted-media"
                                />
                            </div>
                        )}

                        {/* Play / Pause button */}
                        <button
                            onClick={() => setPlaying(p => !p)}
                            className="absolute top-4 left-4 z-10 flex items-center gap-2 px-4 py-2 rounded-full text-white text-xs font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
                        >
                            {playing ? (
                                <>
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                                    </svg>
                                    Pause
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                    Play Video
                                </>
                            )}
                        </button>
                    </>
                ) : (
                    <picture>
                        {mobileImageUrl && <source media="(max-width: 767px)" srcSet={mobileImageUrl} />}
                        <img
                            src={bgImage}
                            alt={title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                    </picture>
                )}

                {/* Dark gradient overlay */}
                <div className="absolute inset-0"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.70) 0%, rgba(0,0,0,0.30) 50%, transparent 100%)' }} />

                {/* Text container */}
                <div
                    className={
                        isSimple
                            ? 'absolute inset-0 flex flex-col items-center justify-center p-5 text-center'
                            : 'absolute inset-x-3 bottom-3 md:inset-auto md:bottom-12 md:left-12 md:max-w-xl p-5 sm:p-7 md:p-12 rounded-xl shadow-glass'
                    }
                    style={isSimple ? {} : {
                        background: 'rgba(255,255,255,0.10)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255,255,255,0.20)',
                    }}
                >
                    {loading ? (
                        <div className="space-y-4 w-full max-w-xl">
                            <div className="h-12 bg-white/20 rounded-2xl animate-pulse" />
                            <div className="h-4 bg-white/20 rounded-xl animate-pulse w-2/3 mx-auto md:mx-0" />
                            <div className="flex gap-3 pt-2">
                                <div className="h-12 flex-1 bg-white/20 rounded-xl animate-pulse" />
                                <div className="h-12 flex-1 bg-white/20 rounded-xl animate-pulse" />
                                <div className="h-12 w-12 bg-white/20 rounded-xl animate-pulse" />
                            </div>
                        </div>
                    ) : (
                        <>
                            {!isSimple && (
                                <span
                                    className="font-semibold uppercase tracking-widest text-xs mb-3 md:mb-4 block drop-shadow-md"
                                    style={{ color: '#D4AF37', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                                >
                                    {eyebrow}
                                </span>
                            )}
                            <h1
                                className={
                                    isSimple
                                        ? "modern-hero-title text-4xl sm:text-6xl md:text-7xl lg:text-[6.5rem] font-extralight tracking-[0.25em] leading-none mb-4 md:mb-6 uppercase"
                                        : "text-xl sm:text-2xl md:text-4xl md:text-5xl font-semibold text-white tracking-tight leading-tight mb-4 md:mb-6 drop-shadow-md"
                                }
                                style={{
                                    fontFamily: isSimple ? undefined : "'Plus Jakarta Sans', sans-serif",
                                }}
                            >
                                {title}
                            </h1>

                            {/* Date row — full type only */}
                            {!isSimple && (
                                <div className="flex flex-wrap items-center gap-4 mb-4 md:mb-8" style={{ color: 'rgba(255,255,255,0.75)' }}>
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span className="font-medium text-sm">{formattedDate}</span>
                                    </div>
                                </div>
                            )}

                            {/* Buttons */}
                            {/* Buttons */}
                            <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:gap-3">
                                {/* Watch Now — full type only */}
                                {!isSimple && (
                                    <button
                                        onClick={handleWatchNow}
                                        disabled={!youtubeUrl}
                                        className="col-span-2 flex items-center justify-center gap-3 px-6 md:px-8 py-3 md:py-3.5 rounded-lg font-medium text-sm md:text-base disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:opacity-90 shadow-lg"
                                        style={{
                                            background: '#D4AF37',
                                            color: '#fff',
                                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                                        }}
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                        Watch Now
                                    </button>
                                )}

                                {/* Add to Calendar — full type only */}
                                {!isSimple && (
                                    <div className="relative" ref={calRef}>
                                        <button
                                            onClick={() => { setCalOpen(o => !o); setShareOpen(false); }}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 md:px-7 md:py-3.5 rounded-xl font-bold text-sm transition-all"
                                            style={{
                                                background: 'rgba(255,255,255,0.12)',
                                                backdropFilter: 'blur(8px)',
                                                color: '#fff',
                                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                                        >
                                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span className="hidden sm:inline">Add to Calendar</span>
                                            <span className="sm:hidden">Calendar</span>
                                        </button>
                                        {calOpen && (
                                            <div className="absolute bottom-full mb-2 left-0 w-52 rounded-2xl shadow-xl overflow-hidden z-50" style={{ background: dropdownBg, border: `1px solid ${dropdownBorder}` }}>
                                                <a href={buildGoogleCalUrl()} target="_blank" rel="noopener noreferrer"
                                                     tabIndex={0} role="button" onKeyDown={(e) => { if(e.key === "Enter" || e.key === " ") { e.preventDefault(); e.currentTarget.click(); } }} onClick={() => setCalOpen(false)}
                                                    className="flex items-center gap-3 px-4 py-3 text-sm transition-colors"
                                                    style={{ color: dropdownText }}
                                                    onMouseEnter={e => e.currentTarget.style.background = dropdownHoverBg}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                    <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="" />
                                                    Google Calendar
                                                </a>
                                                <button onClick={downloadIcs}
                                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors"
                                                    style={{ color: dropdownText, borderTop: `1px solid ${dropdownBorder}` }}
                                                    onMouseEnter={e => e.currentTarget.style.background = dropdownHoverBg}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                    <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    Apple / Outlook (.ics)
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Share */}
                                {!isSimple && <div className="relative" ref={shareRef}>
                                    <button
                                        onClick={() => { setShareOpen(o => !o); setCalOpen(false); }}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 md:p-3.5 rounded-xl font-bold text-sm transition-all"
                                        style={{
                                            background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', color: '#fff',
                                            fontFamily: "'Plus Jakarta Sans', sans-serif"
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                                        title="Share"
                                    >
                                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                        </svg>
                                        <span className="md:hidden">Share</span>
                                    </button>
                                    {shareOpen && (
                                        <div className="absolute bottom-full mb-2 right-0 w-56 rounded-2xl shadow-xl overflow-hidden z-50" style={{ background: dropdownBg, border: `1px solid ${dropdownBorder}` }}>
                                            <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: isDark ? '#6B8A7A' : '#94a3b8' }}>Share via</p>
                                            {shareOptions.map(opt => opt.copyOnly ? (
                                                <button key={opt.label} onClick={() => handleCopyLink(opt.label)}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                                                    style={{ color: dropdownText }}
                                                    onMouseEnter={e => e.currentTarget.style.background = dropdownHoverBg}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style={{ color: opt.color }}>
                                                        <path d={opt.icon} />
                                                    </svg>
                                                    <span className="flex-1 text-left">{opt.label}</span>
                                                    <span className="text-[10px] font-medium" style={{ color: isDark ? '#6B8A7A' : '#cbd5e1' }}>
                                                        {copiedPlatform === opt.label ? 'âœ“ Copied!' : 'Copy link'}
                                                    </span>
                                                </button>
                                            ) : (
                                                <a key={opt.label} href={opt.url} target="_blank" rel="noopener noreferrer"
                                                     tabIndex={0} role="button" onKeyDown={(e) => { if(e.key === "Enter" || e.key === " ") { e.preventDefault(); e.currentTarget.click(); } }} onClick={() => setShareOpen(false)}
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                                                    style={{ color: dropdownText }}
                                                    onMouseEnter={e => e.currentTarget.style.background = dropdownHoverBg}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style={{ color: opt.color }}>
                                                        <path d={opt.icon} />
                                                    </svg>
                                                    {opt.label}
                                                </a>
                                            ))}
                                            <button onClick={handleCopyLink}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                                                style={{ color: dropdownText, borderTop: `1px solid ${dropdownBorder}` }}
                                                onMouseEnter={e => e.currentTarget.style.background = dropdownHoverBg}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                                {copied ? 'Copied!' : 'Copy Link'}
                                            </button>
                                        </div>
                                    )}
                                </div>}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}
