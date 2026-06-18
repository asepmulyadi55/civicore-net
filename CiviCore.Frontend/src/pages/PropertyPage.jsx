import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PLACEHOLDER_IMAGES = [
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80&auto=format',
    'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=80&auto=format',
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80&auto=format',
];

function SkeletonCard({ isDark }) {
    const skBg   = isDark ? '#1C2D27' : '#f1f5f9';
    const cardBg = isDark ? '#142920' : '#ffffff';
    return (
        <div className="rounded-2xl overflow-hidden animate-pulse" style={{ background: cardBg, border: `1px solid ${isDark ? '#1C2D27' : 'rgba(198,197,212,0.10)'}` }}>
            <div className="w-full h-52" style={{ background: skBg }} />
            <div className="p-5 space-y-3">
                <div className="h-3 rounded w-1/4" style={{ background: skBg }} />
                <div className="h-5 rounded w-3/4" style={{ background: skBg }} />
                <div className="h-4 rounded w-1/2" style={{ background: skBg }} />
                <div className="h-3 rounded w-2/3" style={{ background: skBg }} />
                <div className="h-10 rounded w-full mt-2" style={{ background: skBg }} />
            </div>
        </div>
    );
}

export default function PropertyPage() {
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter]   = useState('all'); // 'all' | 'sell' | 'rent'
    const [search, setSearch]   = useState('');
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

    useEffect(() => {
        const apiBase = document.querySelector('meta[name="api-base"]')?.content ?? '';
        const apiKey  = document.querySelector('meta[name="api-key"]')?.content ?? '';
        fetch(`${apiBase}/api/property`, { headers: { 'X-Api-Key': apiKey } })
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const C = isDark ? {
        primary:    '#F0EDE8',
        secondary:  '#D4AF37',
        surface:    '#0D1A17',
        surfaceVar: '#1C2D27',
        card:       '#142920',
        cardBorder: '#1C2D27',
        muted:      '#9E9C97',
        input:      '#1C2D27',
        inputBorder:'#2A3D37',
    } : {
        primary:    '#1C2D27',
        secondary:  '#1C2D27',
        surface:    '#f8f9fa',
        surfaceVar: '#f1f5f9',
        card:       '#ffffff',
        cardBorder: 'rgba(198,197,212,0.10)',
        muted:      '#6b7280',
        input:      '#ffffff',
        inputBorder:'#e2e8f0',
    };

    const badgeSell = isDark
        ? { background: '#92711a', color: '#fde68a' }
        : { background: '#fefce8', color: '#b45309' };
    const badgeRent = isDark
        ? { background: '#0e5c4a', color: '#6ee7b7' }
        : { background: '#f0fdf4', color: '#15803d' };
    const badgeSold = isDark
        ? { background: '#374151', color: '#d1d5db' }
        : { background: '#f1f5f9', color: '#64748b' };

    const allListings = data?.listings ?? [];

    const filtered = allListings.filter(l => {
        if (filter === 'sell' && l.type !== 'sell') return false;
        if (filter === 'rent' && l.type !== 'rent') return false;
        if (search) {
            const s = search.toLowerCase();
            return (
                (l.title || '').toLowerCase().includes(s) ||
                (l.location_label || '').toLowerCase().includes(s) ||
                (l.description || '').toLowerCase().includes(s)
            );
        }
        return true;
    });

    const typeBadge = (listing) => {
        if (listing.status === 'sold')   return { label: 'Terjual',   style: badgeSold };
        if (listing.status === 'rented') return { label: 'Tersewa',   style: badgeSold };
        return listing.type === 'sell'
            ? { label: listing.type_label || 'Dijual',    style: badgeSell }
            : { label: listing.type_label || 'Disewakan', style: badgeRent };
    };

    const filterBtns = [
        { key: 'all',  label: 'Semua' },
        { key: 'sell', label: 'Dijual' },
        { key: 'rent', label: 'Disewakan' },
    ];

    return (
        <div className="font-sans" style={{ backgroundColor: C.surface, color: C.primary, minHeight: '100vh', transition: 'background-color 0.3s, color 0.3s' }}>
            <Header isDark={isDark} toggleDark={toggleDark} />
            <main className="pt-20">
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">

                    {/* Page heading */}
                    <div className="mb-10">
                        <Link to="/"
                            className="inline-flex items-center gap-1.5 text-sm mb-4 transition-opacity hover:opacity-70"
                            style={{ color: '#D4AF37', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                            <span className="material-symbols-outlined text-sm">arrow_back</span>
                            {' '}Back to Home
                        </Link>
                        <h1
                            className="text-3xl md:text-5xl font-medium tracking-tight"
                            style={{ color: C.primary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                            Properti
                        </h1>
                    </div>

                    {/* Filter bar */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-8">
                        {/* Search */}
                        <div className="relative flex-1 sm:max-w-sm">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base pointer-events-none" style={{ color: C.muted }}>search</span>
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Cari properti..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                                style={{ background: C.input, color: C.primary, border: `1px solid ${C.inputBorder}`, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                            />
                        </div>

                        {/* Type filter pills */}
                        <div className="flex gap-2">
                            {filterBtns.map(b => (
                                <button
                                    key={b.key}
                                    onClick={() => setFilter(b.key)}
                                    className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                                    style={filter === b.key
                                        ? { background: '#D4AF37', color: '#1C2D27', fontFamily: "'Plus Jakarta Sans', sans-serif" }
                                        : { background: C.surfaceVar, color: C.muted, fontFamily: "'Plus Jakarta Sans', sans-serif" }
                                    }
                                >
                                    {b.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grid */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} isDark={isDark} />)}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-20 text-center">
                            <span className="material-symbols-outlined text-5xl mb-3 block" style={{ color: C.muted }}>home_work</span>
                            <p className="text-sm font-medium" style={{ color: C.muted }}>
                                {search ? 'Tidak ada properti yang cocok.' : 'Belum ada iklan aktif saat ini.'}
                            </p>
                            {search && (
                                <button onClick={() => setSearch('')} className="mt-3 text-sm underline transition-opacity hover:opacity-70" style={{ color: '#D4AF37' }}>
                                    Hapus pencarian
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filtered.map((listing, i) => {
                                const image = listing.images?.[0] || PLACEHOLDER_IMAGES[i % PLACEHOLDER_IMAGES.length];
                                const badge = typeBadge(listing);
                                const isSoldOrRented = listing.status === 'sold' || listing.status === 'rented';
                                const waLink = listing.contact_phone
                                    ? `https://wa.me/${listing.contact_phone.replace(/\D/g, '')}`
                                    : null;

                                return (
                                    <article
                                        key={listing.id || i}
                                        className="rounded-2xl overflow-hidden flex flex-col transition-transform hover:-translate-y-1 hover:shadow-xl"
                                        style={{ background: C.card, border: `1px solid ${C.cardBorder}` }}
                                    >
                                        {/* Image gallery (first image large, dots for rest) */}
                                        <Link to={`/property/${listing.id}`} className="block relative w-full h-56 overflow-hidden flex-shrink-0">
                                            <img
                                                src={image}
                                                alt={listing.title}
                                                className="w-full h-full object-cover"
                                                style={{ filter: isSoldOrRented ? 'grayscale(60%)' : 'none' }}
                                            />
                                            <span
                                                className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
                                                style={badge.style}
                                            >
                                                {badge.label}
                                            </span>
                                            {listing.images?.length > 1 && (
                                                <span
                                                    className="absolute bottom-3 right-3 px-2 py-1 rounded-lg text-xs font-medium"
                                                    style={{ background: 'rgba(0,0,0,0.5)', color: '#fff' }}
                                                >
                                                    +{listing.images.length - 1} foto
                                                </span>
                                            )}
                                        </Link>

                                        {/* Body */}
                                        <div className="p-5 flex flex-col flex-1 gap-2">
                                            <Link to={`/property/${listing.id}`} className="font-semibold text-base leading-snug hover:underline" style={{ color: C.primary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                                {listing.title}
                                            </Link>

                                            <p className="text-xl font-bold" style={{ color: '#D4AF37', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                                {listing.formatted_price || '—'}
                                            </p>

                                            {listing.location_label && (
                                                <p className="text-xs flex items-center gap-1" style={{ color: C.muted }}>
                                                    <span className="material-symbols-outlined text-xs">location_on</span>
                                                    {listing.location_label}
                                                </p>
                                            )}

                                            {(listing.bedrooms != null || listing.bathrooms != null || listing.land_area || listing.building_area) && (
                                                <div className="flex items-center gap-3 text-xs" style={{ color: C.muted }}>
                                                    {listing.bedrooms != null && (
                                                        <span className="flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-xs">bed</span> {listing.bedrooms} KT
                                                        </span>
                                                    )}
                                                    {listing.bathrooms != null && (
                                                        <span className="flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-xs">bathroom</span> {listing.bathrooms} KM
                                                        </span>
                                                    )}
                                                    {listing.land_area && <span>LT {Math.round(listing.land_area)}m²</span>}
                                                    {listing.building_area && <span>LB {Math.round(listing.building_area)}m²</span>}
                                                </div>
                                            )}

                                            {listing.description && (
                                                <p className="text-xs line-clamp-2 mt-1" style={{ color: C.muted }}>
                                                    {listing.description}
                                                </p>
                                            )}

                                            <div className="flex-1" />

                                            <div className="flex gap-2 mt-3">
                                                <Link
                                                    to={`/property/${listing.id}`}
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                                                    style={{ background: isDark ? 'rgba(212,175,55,0.15)' : '#fefce8', color: '#D4AF37', border: `1px solid ${isDark ? 'rgba(212,175,55,0.3)' : '#fde68a'}`, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                                                >
                                                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                                                    Lihat Detail
                                                </Link>
                                                {!isSoldOrRented && listing.contact_phone && (
                                                    <a
                                                        href={waLink || `tel:${listing.contact_phone}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                                                        style={{ background: isDark ? 'rgba(212,175,55,0.15)' : '#f8f9fa', color: C.primary, border: `1px solid ${C.cardBorder}`, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                                                    >
                                                        <span className="material-symbols-outlined text-sm">call</span>
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>
            <Footer footer={data?.footer} isDark={isDark} />
        </div>
    );
}
