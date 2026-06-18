// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80&auto=format';

function SkeletonDetail(props: any) /* fixme: param types */ {
    const sk   = isDark ? '#1C2D27' : '#f1f5f9';
    const card = isDark ? '#142920' : '#ffffff';
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse">
            <div className="h-4 w-32 rounded mb-6" style={{ background: sk }} />
            <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1">
                    <div className="w-full rounded-2xl overflow-hidden" style={{ background: sk, height: '420px' }} />
                    <div className="flex gap-2 mt-3">
                        {[0,1,2].map(i => (
                            <div key={i} className="w-20 h-16 rounded-xl" style={{ background: sk }} />
                        ))}
                    </div>
                </div>
                <div className="w-full lg:w-80 xl:w-96 space-y-4">
                    <div className="rounded-2xl p-6 space-y-4" style={{ background: card }}>
                        <div className="h-3 w-20 rounded" style={{ background: sk }} />
                        <div className="h-7 w-4/5 rounded" style={{ background: sk }} />
                        <div className="h-9 w-2/3 rounded" style={{ background: sk }} />
                        <div className="h-px w-full" style={{ background: sk }} />
                        <div className="h-12 rounded-xl" style={{ background: sk }} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PropertyDetailPage() {
    const { id }                        = useParams();
    const navigate                      = useNavigate();
    const [data, setData]               = useState<any>(null);
    const [loading, setLoading]         = useState(true);
    const [notFound, setNotFound]       = useState(false);
    const [activeImg, setActiveImg]     = useState(0);
    const [lightboxOpen, setLightbox]   = useState(false);
    const [isDark, setIsDark]           = useState(() => {
        try { return localStorage.getItem('homepageDark') === 'true'; } catch { return false; }
    });

    const toggleDark = () => {
        setIsDark(prev => {
            const next = !prev;
            try { localStorage.setItem('homepageDark', String(next)); } catch {}
            return next;
        });
    };

    useEffect(() => { window.scrollTo(0, 0); }, [id]);

    useEffect(() => {
        const apiBase = document.querySelector('meta[name="api-base"]')?.content ?? '';
        const apiKey  = document.querySelector('meta[name="api-key"]')?.content ?? '';
        setLoading(true);
        fetch(`${apiBase}/api/property/${id}`, { headers: { 'X-Api-Key': apiKey } })
            .then(r => {
                if (r.status === 404) { setNotFound(true); setLoading(false); return null; }
                return r.json();
            })
            .then(d => {
                if (d) { setData(d); setLoading(false); }
            })
            .catch(() => setLoading(false));
    }, [id]);

    // Keyboard navigation for gallery
    const handleKey = useCallback((e) => {
        if (!listing) return;
        const imgs = listing.images?.length ? listing.images : [PLACEHOLDER];
        if (e.key === 'ArrowRight') setActiveImg(i => (i + 1) % imgs.length);
        if (e.key === 'ArrowLeft')  setActiveImg(i => (i - 1 + imgs.length) % imgs.length);
        if (e.key === 'Escape')     setLightbox(false);
    }, [data]);

    useEffect(() => {
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [handleKey]);

    const C = isDark ? {
        primary:    '#F0EDE8',
        secondary:  '#D4AF37',
        surface:    '#0D1A17',
        surfaceVar: '#1C2D27',
        card:       '#142920',
        cardBorder: '#1C2D27',
        muted:      '#9E9C97',
        divider:    '#1C2D27',
    } : {
        primary:    '#1C2D27',
        secondary:  '#D4AF37',
        surface:    '#f8f9fa',
        surfaceVar: '#f1f5f9',
        card:       '#ffffff',
        cardBorder: 'rgba(198,197,212,0.15)',
        muted:      '#6b7280',
        divider:    '#e5e7eb',
    };

    const listing = data?.listing;

    const images = listing?.images?.length ? listing.images : [PLACEHOLDER];

    const typeBadgeStyle = listing?.type === 'sell'
        ? (isDark ? { bg: '#92711a', color: '#fde68a' } : { bg: '#fefce8', color: '#b45309' })
        : (isDark ? { bg: '#0e5c4a', color: '#6ee7b7' } : { bg: '#f0fdf4', color: '#15803d' });

    const isSoldOrRented = listing?.status === 'sold' || listing?.status === 'rented';
    const waLink = listing?.contact_phone
        ? `https://wa.me/${listing.contact_phone.replace(/\D/g, '')}`
        : null;

    const prevImg = () => setActiveImg(i => (i - 1 + images.length) % images.length);
    const nextImg = () => setActiveImg(i => (i + 1) % images.length);

    return (
        <div className="font-sans" style={{ backgroundColor: C.surface, color: C.primary, minHeight: '100vh', transition: 'background-color 0.3s, color 0.3s' }}>
            <Header isDark={isDark} toggleDark={toggleDark} />

            <main className="pt-20">
                {loading ? (
                    <SkeletonDetail isDark={isDark} />
                ) : notFound || !listing ? (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
                        <span className="material-symbols-outlined text-6xl mb-4 block" style={{ color: C.muted }}>home_work</span>
                        <p className="text-lg font-semibold mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Properti tidak ditemukan.</p>
                        <p className="text-sm mb-6" style={{ color: C.muted }}>Properti ini mungkin sudah tidak tersedia.</p>
                        <Link to="/property" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
                            style={{ background: '#D4AF37', color: '#1C2D27', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            <span className="material-symbols-outlined text-sm">arrow_back</span>
                            Kembali ke Daftar Properti
                        </Link>
                    </div>
                ) : (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">

                        {/* Back link */}
                        <Link to="/property"
                            className="inline-flex items-center gap-1.5 text-sm mb-6 transition-opacity hover:opacity-70"
                            style={{ color: '#D4AF37', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            <span className="material-symbols-outlined text-sm">arrow_back</span>
                            Kembali ke Daftar Properti
                        </Link>

                        <div className="flex flex-col lg:flex-row gap-8 xl:gap-12">

                            {/* â”€â”€ Left: Gallery + Details â”€â”€ */}
                            <div className="flex-1 min-w-0">

                                {/* Main image */}
                                <div className="relative rounded-2xl overflow-hidden bg-black" style={{ height: '400px', cursor: images.length > 1 ? 'pointer' : 'default' }}
                                    onClick={() => images.length > 1 && setLightbox(true)}>
                                    <img
                                        src={images[activeImg]}
                                        alt={listing.title}
                                        className="w-full h-full object-cover transition-opacity duration-300"
                                        style={{ filter: isSoldOrRented ? 'grayscale(50%)' : 'none' }}
                                    />

                                    {/* Sold/rented overlay */}
                                    {isSoldOrRented && (
                                        <div className="absolute inset-0 flex items-center justify-center"
                                            style={{ background: 'rgba(0,0,0,0.4)' }}>
                                            <span className="px-5 py-2 rounded-full text-base font-bold uppercase tracking-widest"
                                                style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
                                                {listing.status === 'sold' ? 'Terjual' : 'Tersewa'}
                                            </span>
                                        </div>
                                    )}

                                    {/* Type badge */}
                                    {!isSoldOrRented && (
                                        <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
                                            style={{ background: typeBadgeStyle.bg, color: typeBadgeStyle.color }}>
                                            {listing.type_label}
                                        </span>
                                    )}

                                    {/* Prev / Next arrows */}
                                    {images.length > 1 && (
                                        <>
                                            <button onClick={(e) => { e.stopPropagation(); prevImg(); }}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
                                                style={{ background: 'rgba(0,0,0,0.45)', color: '#fff' }}>
                                                <span className="material-symbols-outlined text-xl">chevron_left</span>
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); nextImg(); }}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
                                                style={{ background: 'rgba(0,0,0,0.45)', color: '#fff' }}>
                                                <span className="material-symbols-outlined text-xl">chevron_right</span>
                                            </button>

                                            {/* Counter */}
                                            <span className="absolute bottom-4 right-4 px-2.5 py-1 rounded-lg text-xs font-medium"
                                                style={{ background: 'rgba(0,0,0,0.5)', color: '#fff' }}>
                                                {activeImg + 1} / {images.length}
                                            </span>
                                        </>
                                    )}
                                </div>

                                {/* Thumbnails */}
                                {images.length > 1 && (
                                    <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                                        {images.map((img, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setActiveImg(i)}
                                                className="flex-shrink-0 w-20 h-16 rounded-xl overflow-hidden transition-all"
                                                style={{
                                                    outline: i === activeImg ? `2px solid #D4AF37` : `2px solid transparent`,
                                                    outlineOffset: '2px',
                                                    opacity: i === activeImg ? 1 : 0.6,
                                                }}
                                            >
                                                <img src={img} alt={`foto ${i + 1}`} className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Property Info Card */}
                                <div className="mt-6 rounded-2xl p-6" style={{ background: C.card, border: `1px solid ${C.cardBorder}` }}>
                                    <h1 className="text-2xl md:text-3xl font-bold leading-snug mb-1"
                                        style={{ color: C.primary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                        {listing.title}
                                    </h1>

                                    {listing.location_label && (
                                        <p className="flex items-center gap-1.5 text-sm mt-2" style={{ color: C.muted }}>
                                            <span className="material-symbols-outlined text-sm">location_on</span>
                                            {listing.location_label}
                                        </p>
                                    )}

                                    {listing.block_name && (
                                        <p className="flex items-center gap-1.5 text-xs mt-1" style={{ color: C.muted }}>
                                            <span className="material-symbols-outlined text-xs">home_work</span>
                                            Blok {listing.block_name}
                                        </p>
                                    )}

                                    {/* Specs */}
                                    {(listing.bedrooms != null || listing.bathrooms != null || listing.land_area || listing.building_area) && (
                                        <>
                                            <div className="h-px my-4" style={{ background: C.divider }} />
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                {listing.bedrooms != null && (
                                                    <div className="flex flex-col items-center gap-1 rounded-xl py-3" style={{ background: C.surfaceVar }}>
                                                        <span className="material-symbols-outlined text-2xl" style={{ color: '#D4AF37' }}>bed</span>
                                                        <span className="text-lg font-bold" style={{ color: C.primary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{listing.bedrooms}</span>
                                                        <span className="text-xs" style={{ color: C.muted }}>Kamar Tidur</span>
                                                    </div>
                                                )}
                                                {listing.bathrooms != null && (
                                                    <div className="flex flex-col items-center gap-1 rounded-xl py-3" style={{ background: C.surfaceVar }}>
                                                        <span className="material-symbols-outlined text-2xl" style={{ color: '#D4AF37' }}>bathroom</span>
                                                        <span className="text-lg font-bold" style={{ color: C.primary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{listing.bathrooms}</span>
                                                        <span className="text-xs" style={{ color: C.muted }}>Kamar Mandi</span>
                                                    </div>
                                                )}
                                                {listing.land_area && (
                                                    <div className="flex flex-col items-center gap-1 rounded-xl py-3" style={{ background: C.surfaceVar }}>
                                                        <span className="material-symbols-outlined text-2xl" style={{ color: '#D4AF37' }}>square_foot</span>
                                                        <span className="text-lg font-bold" style={{ color: C.primary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{Math.round(listing.land_area)}<span className="text-xs font-normal">mÂ²</span></span>
                                                        <span className="text-xs" style={{ color: C.muted }}>Luas Tanah</span>
                                                    </div>
                                                )}
                                                {listing.building_area && (
                                                    <div className="flex flex-col items-center gap-1 rounded-xl py-3" style={{ background: C.surfaceVar }}>
                                                        <span className="material-symbols-outlined text-2xl" style={{ color: '#D4AF37' }}>roofing</span>
                                                        <span className="text-lg font-bold" style={{ color: C.primary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{Math.round(listing.building_area)}<span className="text-xs font-normal">mÂ²</span></span>
                                                        <span className="text-xs" style={{ color: C.muted }}>Luas Bangunan</span>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {/* Description */}
                                    {listing.description && (
                                        <>
                                            <div className="h-px my-4" style={{ background: C.divider }} />
                                            <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: C.muted }}>Deskripsi</h2>
                                            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: C.primary }}>
                                                {listing.description}
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* â”€â”€ Right: Price + Contact (sticky) â”€â”€ */}
                            <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
                                <div className="rounded-2xl p-6 lg:sticky lg:top-24" style={{ background: C.card, border: `1px solid ${C.cardBorder}` }}>

                                    {/* Type badge */}
                                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-3"
                                        style={{ background: typeBadgeStyle.bg, color: typeBadgeStyle.color }}>
                                        {isSoldOrRented ? listing.status_label : listing.type_label}
                                    </span>

                                    {/* Price */}
                                    <p className="text-3xl font-bold mb-1" style={{ color: '#D4AF37', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                        {listing.formatted_price || '—'}
                                    </p>
                                    {listing.type === 'rent' && (
                                        <p className="text-xs mb-4" style={{ color: C.muted }}>per bulan</p>
                                    )}

                                    <div className="h-px my-4" style={{ background: C.divider }} />

                                    {/* Contact */}
                                    {!isSoldOrRented && (listing.contact_name || listing.contact_phone) && (
                                        <div className="space-y-3">
                                            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: C.muted }}>Hubungi Penjual</p>

                                            {listing.contact_name && (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                                        style={{ background: isDark ? '#1C2D27' : '#f1f5f9' }}>
                                                        <span className="material-symbols-outlined text-xl" style={{ color: C.muted }}>person</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold" style={{ color: C.primary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                                            {listing.contact_name}
                                                        </p>
                                                        {listing.contact_phone && (
                                                            <p className="text-xs" style={{ color: C.muted }}>{listing.contact_phone}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {waLink && (
                                                <a href={waLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition-all hover:opacity-80 active:scale-95"
                                                    style={{ background: '#25D366', color: '#fff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                                    Chat via WhatsApp
                                                </a>
                                            )}

                                            {!waLink && listing.contact_phone && (
                                                <a href={`tel:${listing.contact_phone}`}
                                                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition-all hover:opacity-80"
                                                    style={{ background: C.surfaceVar, color: C.primary, border: `1px solid ${C.cardBorder}`, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                                    <span className="material-symbols-outlined text-sm">call</span>
                                                    {listing.contact_phone}
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    {isSoldOrRented && (
                                        <div className="text-center py-4">
                                            <span className="material-symbols-outlined text-4xl mb-2 block" style={{ color: C.muted }}>
                                                {listing.status === 'sold' ? 'sell' : 'key_off'}
                                            </span>
                                            <p className="text-sm font-semibold" style={{ color: C.muted }}>
                                                {listing.status === 'sold' ? 'Properti ini sudah terjual.' : 'Properti ini sudah tersewa.'}
                                            </p>
                                        </div>
                                    )}

                                    <div className="h-px my-4" style={{ background: C.divider }} />

                                    <Link to="/property"
                                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                                        style={{ background: C.surfaceVar, color: C.muted, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                                        Lihat Properti Lainnya
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Lightbox */}
            {lightboxOpen && images.length > 1 && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.9)' }}
                    onClick={() => setLightbox(false)}
                >
                    <button
                        onClick={(e) => { e.stopPropagation(); prevImg(); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                        <span className="material-symbols-outlined text-2xl">chevron_left</span>
                    </button>
                    <img
                        src={images[activeImg]}
                        alt={listing?.title}
                        className="max-w-[90vw] max-h-[85vh] rounded-xl object-contain"
                        onClick={e => e.stopPropagation()}
                    />
                    <button
                        onClick={(e) => { e.stopPropagation(); nextImg(); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                        <span className="material-symbols-outlined text-2xl">chevron_right</span>
                    </button>
                    <button
                        onClick={() => setLightbox(false)}
                        className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                        <span className="material-symbols-outlined">close</span>
                    </button>
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {images.map((_, i) => (
                            <button key={i} onClick={(e) => { e.stopPropagation(); setActiveImg(i); }}
                                className="w-2 h-2 rounded-full transition-all"
                                style={{ background: i === activeImg ? '#D4AF37' : 'rgba(255,255,255,0.4)' }} />
                        ))}
                    </div>
                </div>
            )}

            <Footer footer={data?.footer} isDark={isDark} />
        </div>
    );
}
