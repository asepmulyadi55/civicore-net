import React, { useState } from 'react';
import { Link } from 'react-router-dom';

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
            </div>
        </div>
    );
}

export default function PropertyListings({ listings = [], loading, isDark = false, eyebrow = 'Properties', heading = 'For Sale & Rent' }) {
    const headingColor       = isDark ? '#F0EDE8' : '#1C2D27';
    const bodyColor          = isDark ? '#9E9C97' : '#595959';
    const cardBg             = isDark ? '#142920' : '#ffffff';
    const cardBorder         = isDark ? '#1C2D27' : 'rgba(198,197,212,0.10)';
    const viewAllColor       = isDark ? '#D4AF37' : '#1C2D27';
    const viewAllBorderColor = isDark ? 'rgba(212,175,55,0.4)' : 'rgba(28,45,39,0.3)';
    const mutedColor         = isDark ? '#9E9C97' : '#6b7280';
    const badgeSell          = isDark ? { background: '#92711a', color: '#fde68a' } : { background: '#fefce8', color: '#b45309' };
    const badgeRent          = isDark ? { background: '#0e5c4a', color: '#6ee7b7' } : { background: '#f0fdf4', color: '#15803d' };
    const badgeSold          = isDark ? { background: '#374151', color: '#d1d5db' } : { background: '#f1f5f9', color: '#64748b' };

    if (loading && listings.length === 0) {
        return (
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <SkeletonCard isDark={isDark} /><SkeletonCard isDark={isDark} /><SkeletonCard isDark={isDark} />
                </div>
            </section>
        );
    }

    if (!listings || listings.length === 0) return null;

    const displayed = listings.slice(0, 3);

    const typeBadge = (listing) => {
        if (listing.status === 'sold')   return { label: 'Terjual',    style: badgeSold };
        if (listing.status === 'rented') return { label: 'Tersewa',    style: badgeSold };
        return listing.type === 'sell'
            ? { label: listing.type_label || 'Dijual',     style: badgeSell }
            : { label: listing.type_label || 'Disewakan',  style: badgeRent };
    };

    return (
        <section id="property" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20" style={{ scrollMarginTop: '80px' }}>
            <div className="flex items-end justify-between mb-10 md:mb-14 gap-6">
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
                {listings.length > 3 && (
                    <Link
                        to="/property"
                        className="hidden md:flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border transition-all flex-shrink-0 hover:scale-105"
                        style={{ color: viewAllColor, borderColor: viewAllBorderColor, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                        View All
                        <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </Link>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayed.map((listing, i) => {
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
                            style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
                        >
                            {/* Image */}
                            <Link to={`/property/${listing.id}`} className="block relative w-full h-52 overflow-hidden flex-shrink-0">
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
                                    <span className="absolute bottom-3 right-3 px-2 py-1 rounded-lg text-xs font-medium" style={{ background: 'rgba(0,0,0,0.5)', color: '#fff' }}>
                                        +{listing.images.length - 1} foto
                                    </span>
                                )}
                            </Link>

                            {/* Body */}
                            <div className="p-5 flex flex-col flex-1 gap-2">
                                <Link to={`/property/${listing.id}`} className="font-semibold text-base leading-snug hover:underline" style={{ color: headingColor, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                    {listing.title}
                                </Link>

                                {/* Price */}
                                <p className="text-lg font-bold" style={{ color: '#D4AF37', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                    {listing.formatted_price || '—'}
                                </p>

                                {/* Location */}
                                {listing.location_label && (
                                    <p className="text-xs flex items-center gap-1" style={{ color: mutedColor }}>
                                        <span className="material-symbols-outlined text-xs">location_on</span>
                                        {listing.location_label}
                                    </p>
                                )}

                                {/* Specs */}
                                {(listing.bedrooms != null || listing.bathrooms != null || listing.land_area || listing.building_area) && (
                                    <div className="flex items-center gap-3 text-xs" style={{ color: mutedColor }}>
                                        {listing.bedrooms != null && (
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-xs">bed</span> {listing.bedrooms}
                                            </span>
                                        )}
                                        {listing.bathrooms != null && (
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-xs">bathroom</span> {listing.bathrooms}
                                            </span>
                                        )}
                                        {listing.land_area && (
                                            <span>LT {Math.round(listing.land_area)}m²</span>
                                        )}
                                        {listing.building_area && (
                                            <span>LB {Math.round(listing.building_area)}m²</span>
                                        )}
                                    </div>
                                )}

                                {/* Spacer */}
                                <div className="flex-1" />

                                <div className="flex gap-2 mt-2">
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
                                            style={{ background: isDark ? 'rgba(212,175,55,0.15)' : 'rgba(28,45,39,0.06)', color: viewAllColor, border: `1px solid ${viewAllBorderColor}` }}
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

            {/* Mobile view-all link */}
            {listings.length > 3 && (
                <div className="mt-10 flex justify-center md:hidden">
                    <Link
                        to="/property"
                        className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border transition-all"
                        style={{ color: viewAllColor, borderColor: viewAllBorderColor, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                        View All
                        <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </Link>
                </div>
            )}
        </section>
    );
}
