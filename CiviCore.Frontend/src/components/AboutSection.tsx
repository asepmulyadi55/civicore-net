// @ts-nocheck
import React from 'react';

const DEFAULT_CONTENT = ``;
const DEFAULT_STATS = [];

// Matches v2: top-left navy, top-right grey (offset), bottom-left grey, bottom-right violet (offset)
const STAT_CARD_STYLES = [
    { background: '#1C2D27', color: '#FAF9F6',  offset: false },  // dark green
    { background: '#E8E6E1', color: '#1C2D27',  offset: true  },  // warm grey
    { background: '#FFFFFF', color: '#1C2D27',  offset: false, border: '1px solid #E8E6E1' },  // white
    { background: '#D4AF37', color: '#FFFFFF',  offset: true  },  // gold
];

const STAT_ICONS = ['group', 'shield', 'park', 'event_note'];

export default function AboutSection({ about = {}, loading, isDark = false }) {
    const headingColor = isDark ? '#F0EDE8' : '#1C2D27';
    const bodyColor    = isDark ? '#9E9C97' : '#454652';
    const skBg         = isDark ? '#1C2D27' : '#f1f5f9';

    const rawContent = about?.content || '';
    const stats     = (about?.stats?.length > 0) ? about.stats : [];
    const badge     = about?.badge      || '';
    const heading   = about?.heading    || '';
    const btn1Label = about?.btn1_label || '';
    const btn1Url   = about?.btn1_url   || null;
    const btn2Label = about?.btn2_label || '';
    const btn2Url   = about?.btn2_url   || null;
    const paragraphs = rawContent.split(/\n\n+/).filter(Boolean);


    // Shared button base styles
    const btn1Style = { background: '#1C2D27', fontFamily: "'Plus Jakarta Sans', sans-serif" };
    const btn2Style = { border: '1px solid #1C2D27', color: '#1C2D27', background: 'transparent', fontFamily: "'Plus Jakarta Sans', sans-serif" };
    const btn1Class = 'px-6 md:px-8 py-3 md:py-3.5 rounded-lg font-medium text-sm md:text-base text-white transition-all hover:opacity-90 shadow-sm inline-block text-center';
    const btn2Class = 'px-6 md:px-8 py-3 md:py-3.5 rounded-lg font-medium text-sm md:text-base transition-colors inline-block text-center';
    const linkProps = { target: '_blank', rel: 'noopener noreferrer' };


    return (
        <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-32" style={{ scrollMarginTop: '80px' }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                {/* Left — text */}
                <div className="space-y-8">
                    <div>
                        <span
                            className="font-semibold tracking-widest uppercase text-xs mb-3 md:mb-4 block"
                            style={{ color: '#D4AF37', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                            {badge}
                        </span>
                        <h2
                            className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight leading-tight mb-6 lg:mb-8"
                            style={{ color: headingColor, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                            {heading}
                        </h2>

                        {loading ? (
                            <div className="space-y-3">
                                <div className="h-4 rounded animate-pulse" style={{ background: skBg }} />
                                <div className="h-4 rounded animate-pulse w-5/6" style={{ background: skBg }} />
                                <div className="h-4 rounded animate-pulse w-4/5" style={{ background: skBg }} />
                            </div>
                        ) : (
                            <div className="space-y-5 leading-relaxed font-light" style={{ color: bodyColor, fontSize: '1.0625rem' }}>
                                {paragraphs.map((para, i) => <p key={i}>{para}</p>)}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
                        {btn1Label && (
                            btn1Url ? (
                                <a href={btn1Url} className={btn1Class} style={btn1Style} {...linkProps}>
                                    {btn1Label}
                                </a>
                            ) : (
                                <button className={btn1Class} style={btn1Style}>
                                    {btn1Label}
                                </button>
                            )
                        )}
                        {btn2Label && (
                            btn2Url ? (
                                <a href={btn2Url} className={btn2Class} style={btn2Style} {...linkProps}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#1C2D27'; e.currentTarget.style.color = '#FAF9F6'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#1C2D27'; }}
                                >
                                    {btn2Label}
                                </a>
                            ) : (
                                <button className={btn2Class} style={btn2Style}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#1C2D27'; e.currentTarget.style.color = '#FAF9F6'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#1C2D27'; }}
                                >
                                    {btn2Label}
                                </button>
                            )
                        )}
                    </div>
                </div>

                {/* Right — 2Ã—2 stat grid */}
                <div className="grid grid-cols-2 gap-4">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className={`rounded-3xl bg-slate-100 animate-pulse h-48 ${i % 2 === 1 ? 'mt-8' : ''}`} />
                        ))
                    ) : (
                        stats.map((stat, i) => {
                            const style = STAT_CARD_STYLES[i % STAT_CARD_STYLES.length];
                            const icon  = STAT_ICONS[i % STAT_ICONS.length];
                            return (
                                <div key={i}
                                    className={`p-6 md:p-8 rounded-xl flex flex-col justify-between h-40 sm:h-48 md:h-56 transition-transform duration-700 hover:-translate-y-2 shadow-sm ${style.offset ? 'mt-6 sm:mt-8' : ''}`}
                                    style={{ background: style.background, border: style.border || 'none' }}>
                                    <span
                                        className="material-symbols-outlined"
                                        style={{
                                            fontSize: '40px',
                                            fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 40",
                                            color: style.color,
                                            opacity: 0.6,
                                            lineHeight: 1,
                                        }}
                                    >
                                        {icon}
                                    </span>
                                    <div>
                                        <div className="text-2xl md:text-3xl font-semibold mb-1"
                                            style={{ color: style.color, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                            {stat.value}
                                        </div>
                                        <div className="text-[10px] uppercase tracking-widest font-semibold opacity-70"
                                            style={{ color: style.color }}>
                                            {stat.label}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </section>
    );
}
