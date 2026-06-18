import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PER_PAGE = 9;

const PLACEHOLDER_IMAGES = [
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80&auto=format',
    'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=600&q=80&auto=format',
    'https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=600&q=80&auto=format',
];

const SKELETON_KEYS = ['sk-a', 'sk-b', 'sk-c', 'sk-d', 'sk-e', 'sk-f'];

function getPaginationPages(current, total) {
    if (total <= 7) return new Array(total).fill(null).map((_, i) => i + 1);
    const pages = [1];
    if (current > 3) pages.push('ellipsis-start');
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        pages.push(i);
    }
    if (current < total - 2) pages.push('ellipsis-end');
    pages.push(total);
    return pages;
}

function SkeletonCard({ isDark }) {
    const skBg   = isDark ? '#1C2D27' : '#f1f5f9';
    const cardBg = isDark ? '#142920' : '#ffffff';
    return (
        <div className="rounded-2xl overflow-hidden animate-pulse" style={{ background: cardBg, border: `1px solid ${isDark ? '#1C2D27' : '#E8E6E1'}` }}>
            <div className="w-full h-48" style={{ background: skBg }} />
            <div className="p-6 space-y-3">
                <div className="h-3 rounded w-1/4" style={{ background: skBg }} />
                <div className="h-5 rounded w-3/4" style={{ background: skBg }} />
                <div className="h-3 rounded w-full" style={{ background: skBg }} />
                <div className="h-3 rounded w-5/6" style={{ background: skBg }} />
            </div>
        </div>
    );
}

export default function BuletinPage() {
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch]   = useState('');
    const [page, setPage]       = useState(1);
    const [isDark, setIsDark]   = useState(() => {
        try { return localStorage.getItem('homepageDark') === 'true'; } catch { return false; }
    });

    const toggleDark = () => {
        setIsDark(prev => {
            const next = !prev;
            try { localStorage.setItem('homepageDark', String(next)); } catch {}
            return next;
        });
    };

    useEffect(() => { window.scrollTo(0, 0); }, []);

    const C = isDark ? {
        primary:    '#F0EDE8',
        secondary:  '#D4AF37',
        surface:    '#0D1A17',
        surfaceVar: '#1C2D27',
        border:     '#1C2D27',
        muted:      '#9E9C97',
        cardBg:     '#142920',
    } : {
        primary:    '#1C2D27',
        secondary:  '#D4AF37',
        surface:    '#FAF9F6',
        surfaceVar: '#E8E6E1',
        border:     '#E8E6E1',
        muted:      '#595959',
        cardBg:     '#ffffff',
    };

    useEffect(() => {
        const basePath = import.meta.env.VITE_APP_BASE ?? '';
        const apiKey   = document.querySelector('meta[name="api-key"]')?.content ?? '';
        fetch(`${basePath}/api/buletin`, {
            headers: { 'X-Api-Key': apiKey },
        })
            .then(res => res.json())
            .then(json => { setData(json); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const allBuletin = data?.buletin ?? [];
    const today = new Date().toISOString().slice(0, 10);

    const filtered = allBuletin.filter(b =>
        !search ||
        (b.title       ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (b.description ?? '').toLowerCase().includes(search.toLowerCase())
    );

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const pages      = getPaginationPages(page, totalPages);

    useEffect(() => { setPage(1); }, [search]);

    const hasFilters = !!search;

    return (
        <div className="font-sans" style={{ backgroundColor: C.surface, color: C.primary, minHeight: '100vh', transition: 'background-color 0.3s, color 0.3s' }}>
            <Header isDark={isDark} toggleDark={toggleDark} />

            <main className="pt-20 pb-20">
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">

                    {/* Page heading */}
                    <div className="mb-10">
                        <Link to="/"
                            className="inline-flex items-center gap-1.5 text-sm mb-4 transition-opacity hover:opacity-70"
                            style={{ color: C.secondary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                            <span className="material-symbols-outlined text-sm">arrow_back</span>
                            {' '}Back to Home
                        </Link>
                        <h1
                            className="text-3xl md:text-5xl font-medium tracking-tight"
                            style={{ color: C.primary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                            All Bulletins
                        </h1>
                    </div>

                    {/* Search filter */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                        <div className="relative flex-1 sm:max-w-sm">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base pointer-events-none"
                                style={{ color: C.muted }}>search</span>
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search bulletins…"
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all"
                                style={{ borderColor: C.border, background: C.cardBg, color: C.primary, fontFamily: "'Inter', sans-serif" }}
                            />
                        </div>
                        {hasFilters && (
                            <button onClick={() => setSearch('')}
                                className="px-4 py-2.5 rounded-xl border text-sm transition-all w-full sm:w-auto"
                                style={{ borderColor: C.border, background: C.cardBg, color: C.muted }}>
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Result count */}
                    {!loading && (
                        <p className="text-sm mb-6" style={{ color: C.muted }}>
                            {filtered.length} bulletin{filtered.length !== 1 ? 's' : ''}
                            {hasFilters ? ' found' : ' total'}
                        </p>
                    )}

                    {/* Grid */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {SKELETON_KEYS.map(k => <SkeletonCard key={k} isDark={isDark} />)}
                        </div>
                    ) : null}
                    {!loading && paginated.length === 0 ? (
                        <div className="text-center py-20 rounded-2xl" style={{ background: C.cardBg, border: `1px solid ${C.border}` }}>
                            <span className="material-symbols-outlined text-5xl mb-3 block" style={{ color: C.border }}>article</span>
                            <p className="font-semibold text-sm" style={{ color: C.muted }}>No bulletins found</p>
                            {hasFilters && (
                                <button onClick={() => setSearch('')}
                                    className="mt-3 text-sm underline transition-opacity hover:opacity-70"
                                    style={{ color: C.secondary }}>
                                    Clear search
                                </button>
                            )}
                        </div>
                    ) : null}
                    {!loading && paginated.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {paginated.map((item, i) => {
                                const image  = item.image_url || PLACEHOLDER_IMAGES[i % PLACEHOLDER_IMAGES.length];
                                const isPast = !!item.date && item.date < today;

                                return (
                                    <article
                                        key={item.id || i}
                                        className="rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg group"
                                        style={{ background: C.cardBg, border: `1px solid ${C.border}` }}
                                    >
                                        {/* Image */}
                                        <div className="relative h-48 overflow-hidden flex-shrink-0">
                                            <img
                                                src={image}
                                                alt={item.title}
                                                loading="lazy"
                                                className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105${isPast ? ' grayscale opacity-75' : ''}`}
                                            />
                                            {isPast && (
                                                <div className="absolute top-3 left-3">
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest"
                                                        style={{ background: 'rgba(28,45,39,0.82)', color: '#fff', backdropFilter: 'blur(12px)' }}>
                                                        Past
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Body */}
                                        <div className="p-6 flex flex-col flex-grow">
                                            <h3 className="text-base font-semibold mb-2 leading-snug"
                                                style={{ color: C.primary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                                {item.title}
                                            </h3>
                                            {item.description && (
                                                <p className="text-sm leading-relaxed mb-4 flex-grow font-light line-clamp-3"
                                                    style={{ color: C.muted }}>
                                                    {item.description}
                                                </p>
                                            )}

                                            {/* Footer row */}
                                            <div className="flex items-center justify-between mt-auto pt-4"
                                                style={{ borderTop: `1px solid ${C.border}` }}>
                                                {item.url ? (
                                                    <a
                                                        href={item.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="font-semibold text-xs flex items-center gap-1 tracking-wide transition-opacity hover:opacity-70"
                                                        style={{ color: C.secondary }}
                                                    >
                                                        READ MORE
                                                        <span className="material-symbols-outlined text-sm">arrow_right_alt</span>
                                                    </a>
                                                ) : (
                                                    <span className="text-xs font-light" style={{ color: C.muted }}>Details TBA</span>
                                                )}
                                                {item.date && (
                                                    <span className="text-xs font-light" style={{ color: C.muted }}>
                                                        {new Date(item.date + 'T00:00:00').toLocaleDateString('en-US', {
                                                            month: 'short', day: 'numeric', year: 'numeric',
                                                        })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    ) : null}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-1.5 mt-12 flex-wrap">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                                className="p-2 rounded-lg border disabled:opacity-30 transition-all"
                                style={{ borderColor: C.border, background: C.cardBg }}
                                aria-label="Previous page"
                            >
                                <span className="material-symbols-outlined text-base" style={{ color: C.muted }}>chevron_left</span>
                            </button>

                            {pages.map((p) =>
                                typeof p === 'string' ? (
                                    <span key={p} className="px-1 text-sm" style={{ color: C.muted }}>…</span>
                                ) : (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className="w-9 h-9 rounded-lg text-sm font-medium transition-all"
                                        style={{
                                            background: page === p ? C.primary : C.cardBg,
                                            color:      page === p ? C.surface : C.muted,
                                            border:     `1px solid ${page === p ? C.primary : C.border}`,
                                        }}
                                    >
                                        {p}
                                    </button>
                                )
                            )}

                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage(p => p + 1)}
                                className="p-2 rounded-lg border disabled:opacity-30 transition-all"
                                style={{ borderColor: C.border, background: C.cardBg }}
                                aria-label="Next page"
                            >
                                <span className="material-symbols-outlined text-base" style={{ color: C.muted }}>chevron_right</span>
                            </button>
                        </div>
                    )}

                </section>
            </main>

            <Footer footer={data?.footer} isDark={isDark} />
        </div>
    );
}
