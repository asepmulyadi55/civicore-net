"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import TopNavBar from '@/components/TopNavBar';
import Footer from '@/components/Footer';

export default function HomePageClient({ hero, events, eventSettings, gallerySettings, gallery, bulletinSettings, bulletins, propertySettings, properties, footerData, apiUrl }: any) {
    const [isDark, setIsDark] = useState(() => {
        try { return localStorage.getItem('homepageDark') === 'true'; } catch { return false; }
    });
    
    const [activeTab, setActiveTab] = useState('home');

    useEffect(() => {
        const sections = document.querySelectorAll('section[id]');
        const observerCallback = (entries: any) => {
            entries.forEach((entry: any) => {
                if (entry.isIntersecting) setActiveTab(entry.target.id);
            });
        };
        const observer = new IntersectionObserver(observerCallback, { rootMargin: "-20% 0px -70% 0px" });
        sections.forEach(section => observer.observe(section));
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const html = document.documentElement;
        if (isDark) html.classList.add('dark');
        else html.classList.remove('dark');
    }, [isDark]);

    useEffect(() => {
        const revealElements = document.querySelectorAll('.reveal');
        const revealCallback = (entries: any) => {
            entries.forEach((entry: any) => {
                if (entry.isIntersecting) entry.target.classList.add('active');
            });
        };
        const revealObserver = new IntersectionObserver(revealCallback, { threshold: 0.15, rootMargin: "0px 0px -50px 0px" });
        revealElements.forEach(el => revealObserver.observe(el));
        return () => revealObserver.disconnect();
    }, []);

    const toggleDark = () => {
        setIsDark(prev => {
            const next = !prev;
            try { localStorage.setItem('homepageDark', String(next)); } catch {}
            return next;
        });
    };

    const getImageUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return url;
    };

    const sortedEvents = (events || []).slice().sort((a: any, b: any) => {
        const today = new Date().toISOString().slice(0, 10);
        const getStatusWeight = (e: any) => {
            if (e.status === 'ongoing') return 0;
            return (!!e.date && e.date < today) ? 2 : 1;
        };

        const weightA = getStatusWeight(a);
        const weightB = getStatusWeight(b);

        if (weightA !== weightB) return weightA - weightB;

        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;

        if (weightA === 2) {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        } else {
            return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
    });

    return (
        <div className="bg-surface-container-lowest dark:bg-primary text-on-surface dark:text-on-primary font-body-md antialiased transition-colors duration-300">
            <TopNavBar activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} toggleDark={toggleDark} />

            <main>
                {/* Hero Section */}
                <section id="home" className="relative h-[80vh] min-h-[600px] flex items-center justify-center mt-20">
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${getImageUrl(hero.background_image_url) || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAOH9-wkerT9L_3UHiLus4rfP0iIYILydReiA4c1YgVrKb9FXHlKChiO-5ca6dGMsI3bScitsulEeeBAa_lw9C8Q4nWjpu7yc4Qli__5V6s4A4BwbiAEJPWdLQYGXs5B6jy7mP07iWtYt-kk58IVBMD6UT_fPKNJXu0OfdQuF3MTYxFgQqfc9wgKe2z6M7ZiVfCAsET3eySbL2bJ0xVqP-AYqjtp5UxnEsXHGP54KOr6j-kCwy4_WBKjXksawAKK4MnYkm8Zj2cvhU'}')` }}>
                        <div className="absolute inset-0 bg-gradient-to-b from-primary/60 via-primary/40 to-surface-container-lowest dark:to-primary"></div>
                    </div>
                    <div className="relative z-10 text-center px-margin-mobile md:px-margin-desktop max-w-4xl mx-auto flex flex-col items-center">
                        <h1 className="text-display-lg-mobile md:text-display-lg font-display-lg text-on-primary mb-6 animate-fade-in-up drop-shadow-lg">
                            {hero.title || 'Welcome to Dwipapuri Residence'}
                        </h1>
                        <p className="text-body-lg font-body-lg text-on-primary/90 mb-10 max-w-2xl font-light tracking-wide">
                            {hero.subtitle || 'Modern Living in Harmony. Experience tranquility and luxury in every detail.'}
                        </p>
                        <Link href={hero.cta_url || '/schedule-visit'} className="bg-[#b45309] hover:bg-[#8b4006] dark:bg-[#d97706] dark:hover:bg-[#b45309] text-white px-8 py-4 rounded-lg font-label-md text-label-md transition-colors shadow-lg shadow-[#b45309]/20 flex items-center justify-center">
                            {hero.cta_label || 'Schedule a Visit'}
                        </Link>
                    </div>
                </section>

                {/* Events Section */}
                <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto" id="events">
                    <div className="flex justify-between items-end mb-12 border-b border-border-subtle dark:border-primary-container pb-4 reveal">
                        <div>
                            <span className="text-label-sm font-label-sm text-[#b45309] dark:text-[#d97706] uppercase tracking-wider block mb-2">{eventSettings?.eyebrow || 'Discover More'}</span>
                            <h2 className="text-headline-md font-headline-md text-primary dark:text-primary-fixed-dim">{eventSettings?.title || 'Events'}</h2>
                            {eventSettings?.subtitle && <p className="mt-2 text-body-md text-text-muted dark:text-on-primary/70">{eventSettings.subtitle}</p>}
                        </div>
                        {events && events.length > 0 && (
                            <Link className="group flex items-center text-label-md font-label-md text-primary dark:text-primary-fixed-dim hover:text-primary-container dark:hover:text-primary-fixed transition-colors" href="/events">
                                View All 
                                <span className="material-symbols-outlined ml-2 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </Link>
                        )}
                    </div>
                    {sortedEvents.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 reveal">
                            {sortedEvents.slice(0, 3).map((ev: any) => {
                                const today = new Date().toISOString().slice(0, 10);
                                const isPast = (ev.status !== 'ongoing') && !!ev.date && ev.date < today;
                                return (
                                    <div key={ev.id} className="bg-surface dark:bg-primary-container rounded-2xl shadow-sm border border-border-subtle/50 dark:border-primary-container/50 overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
                                        {ev.image_url && (
                                            <div className="h-48 overflow-hidden relative bg-surface-container-low dark:bg-primary/30">
                                                <div className="absolute inset-0 bg-primary/10 dark:bg-primary/40 mix-blend-multiply z-10 group-hover:opacity-50 transition-opacity"></div>
                                                <img alt={ev.title} className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isPast ? 'grayscale opacity-80' : ''}`} src={getImageUrl(ev.image_url)} />
                                                <div className="absolute top-4 left-4 flex gap-2 z-20">
                                                    {ev.date && (
                                                        <div className="bg-surface-glass backdrop-blur-sm px-3 py-1 rounded text-primary font-bold text-sm">
                                                            {new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        </div>
                                                    )}
                                                    {isPast && (
                                                        <div className="bg-surface-glass backdrop-blur-sm px-3 py-1 rounded text-primary font-bold text-sm">Past</div>
                                                    )}
                                                    {ev.status === 'ongoing' && (
                                                        <div className="bg-[#b45309] text-white px-3 py-1 rounded font-bold text-sm">Ongoing</div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    <div className="p-6 flex flex-col flex-grow">
                                        <h3 className="text-headline-sm font-headline-sm text-primary dark:text-on-primary mb-2">{ev.title}</h3>
                                        <div className="text-body-md text-text-muted dark:text-on-primary/70 mb-6 flex-grow prose prose-sm dark:prose-invert max-w-none line-clamp-3" dangerouslySetInnerHTML={{ __html: ev.description || '' }} />
                                        <div className="mt-auto border-t border-border-subtle/50 dark:border-primary-container/50 pt-4 flex justify-between items-center">
                                            <Link className="text-primary dark:text-primary-fixed-dim font-label-md inline-flex items-center group/link" href={ev.url || `/events/${ev.id}`}>
                                                <span className="group-hover/link:underline">View Details</span> 
                                                <span className="material-symbols-outlined text-sm ml-1 group-hover/link:translate-x-1 transition-transform">arrow_right_alt</span>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-text-muted dark:text-on-primary/70 bg-surface dark:bg-primary-container rounded-2xl border border-border-subtle/50 dark:border-primary-container/50">
                            No events currently available.
                        </div>
                    )}
                </section>

                {/* Gallery Section */}
                <section className="py-section-gap bg-surface-container-low dark:bg-primary-container/20 px-margin-mobile md:px-margin-desktop" id="gallery">
                    <div className="max-w-container-max mx-auto">
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 reveal">
                            <div>
                                <span className="text-label-sm font-label-sm text-[#b45309] dark:text-[#d97706] uppercase tracking-wider block mb-2">{gallerySettings?.eyebrow || 'Visual Tour'}</span>
                                <h2 className="text-headline-md font-headline-md text-primary dark:text-primary-fixed-dim">{gallerySettings?.title || 'Gallery'}</h2>
                                {gallerySettings?.subtitle && <p className="mt-2 text-text-muted dark:text-on-primary/70">{gallerySettings?.subtitle}</p>}
                            </div>
                            {gallery && gallery.length > 0 && (
                                <Link className="inline-flex items-center gap-2 font-label-md text-label-md text-primary dark:text-primary-fixed-dim hover:text-primary-container dark:hover:text-primary-fixed transition-colors mt-4 md:mt-0 group" href="/gallery">
                                    View All
                                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                </Link>
                            )}
                        </div>
                        
                        {gallery && gallery.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-auto md:h-[600px]">
                                <Link href={`/gallery/${gallery[0].id}`} className="block rounded-2xl overflow-hidden relative group reveal shadow-sm border border-border-subtle/50 dark:border-primary-container/50 h-[300px] md:h-full">
                                    <div className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url('${getImageUrl(gallery[0]?.image_url) || "https://lh3.googleusercontent.com/aida-public/AB6AXuD55aFz8NDn0tXi_fzmIam_RZaFwDhAczD1L4kTGDx3sbMlR0oF0fEJB5qFaP04Btkcj6aHz6QlpxgzjIYCilYWKVHAUZys336usIkE5SzFmXdvI3NvErNZ0g2TMOrUu1c-4tth-d3jBfcLR85PhiVZ-By3Hj2sgF0VsRp1fP7NyU97aIp0YyjjBQkx4-gGQIjtxX_CFAevCygShudFFGofPbQX20yTk7WXTZJxCtg4SvhN88iP29cXUKzOB9OXHuNDpxl0_s61314"}')` }}></div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="absolute bottom-0 left-0 p-8 w-full translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                        <h3 className="font-headline-sm text-headline-sm text-white mb-2">{gallery[0]?.title || 'Clubhouse'}</h3>
                                        <p className="font-body-md text-body-md text-white/80 line-clamp-2">{gallery[0]?.description || 'Explore the amenities of our clubhouse.'}</p>
                                    </div>
                                </Link>
                                <div className="flex flex-col md:grid md:grid-rows-2 gap-6 h-auto md:h-full">
                                    {gallery.length > 1 && (
                                        <Link href={`/gallery/${gallery[1].id}`} className="block rounded-2xl overflow-hidden relative group reveal shadow-sm border border-border-subtle/50 dark:border-primary-container/50 h-[300px] md:h-full" style={{ transitionDelay: '0.1s' }}>
                                            <div className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url('${getImageUrl(gallery[1]?.image_url) || "https://lh3.googleusercontent.com/aida-public/AB6AXuDqmJbXJfWPbdc2pd8BtFwTYl1KGyL-YtzdJWtn6C-PLLYeGND0o9idmDEkCLCNadXGgEk1D4fczrphhSJwrRdQFTxhjEbSgye3NmOeVIuhT_QKw2fGu1lpXSl9gMn2R9scg5z09MOxMCxYoOf7LkuNdi34YzT6Q_VfZ3fAk7YiLbqlQlkcyb2qZoN9Be7w8EFfFiF5sZZCo46zPenk5RHo29Pk2H9rHqSZhvXUM0t5VHWRyzss9ONZBqgL1jCs8vK7MrpVHPNY1Og"}')` }}></div>
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                            <div className="absolute bottom-0 left-0 p-6 w-full translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                                <h3 className="font-headline-sm text-headline-sm text-white mb-2">{gallery[1]?.title || 'Community Life'}</h3>
                                                <p className="font-body-md text-body-md text-white/80 line-clamp-2">{gallery[1]?.description || 'A vibrant and welcoming neighborhood.'}</p>
                                            </div>
                                        </Link>
                                    )}
                                    {gallery.length > 2 && (
                                        <Link href={`/gallery/${gallery[2].id}`} className="block rounded-2xl overflow-hidden relative group reveal shadow-sm border border-border-subtle/50 dark:border-primary-container/50 h-[300px] md:h-full" style={{ transitionDelay: '0.2s' }}>
                                            <div className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url('${getImageUrl(gallery[2]?.image_url) || "https://lh3.googleusercontent.com/aida-public/AB6AXuAcYSxDLk_010u5mOyR_cijkXwWyIyptM-8yp5_4RAe6ZRQtodAbNSdHc80FooCWs9ykxeHdHLmLfIjpcGeZ-OXAN1f6bMyV0rpLYvBVnRktdK_B8EOFmp6JryCf9e7giLDFQGO5heJirDMTp6yQh2Q6umMQkmduc12_7S2HsFcPWX8wuAdf1GCtzCWfmn9P7XiZbVNUINPPQ5Z2c70y9eKeijUWwn-bFTTd2AI-P9MXrgXBehO0bMFqxGV4tLwuzGrD7GdGWcXw-w"}')` }}></div>
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                            <div className="absolute bottom-0 left-0 p-6 w-full translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                                <h3 className="font-headline-sm text-headline-sm text-white mb-2">{gallery[2]?.title || 'Pool Area'}</h3>
                                                <p className="font-body-md text-body-md text-white/80 line-clamp-2">{gallery[2]?.description || 'Relax and enjoy the sunshine.'}</p>
                                            </div>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-text-muted dark:text-on-primary/70 bg-surface dark:bg-primary-container rounded-2xl border border-border-subtle/50 dark:border-primary-container/50 mt-8">
                                No gallery items currently available.
                            </div>
                        )}
                    </div>
                </section>

                {/* Bulletins Section */}
                <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto" id="bulletins">
                    <div className="flex justify-between items-end mb-12 border-b border-border-subtle dark:border-primary-container pb-4 reveal">
                        <div>
                            <span className="text-label-sm font-label-sm text-[#b45309] dark:text-[#d97706] uppercase tracking-wider block mb-2">{bulletinSettings?.eyebrow || 'Informasi'}</span>
                            <h2 className="text-headline-md font-headline-md text-primary dark:text-primary-fixed-dim">{bulletinSettings?.title || 'Buletin'}</h2>
                            {bulletinSettings?.subtitle && <p className="mt-2 text-text-muted dark:text-on-primary/70">{bulletinSettings?.subtitle}</p>}
                        </div>
                        {bulletins && bulletins.length > 0 && (
                            <Link className="group flex items-center text-label-md font-label-md text-primary dark:text-primary-fixed-dim hover:text-primary-container dark:hover:text-primary-fixed transition-colors" href="/bulletins">
                                View All 
                                <span className="material-symbols-outlined ml-2 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </Link>
                        )}
                    </div>
                    {bulletins && bulletins.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 reveal">
                            {bulletins.slice(0, 3).map((b: any) => (
                                <div key={b.id} className="bg-surface dark:bg-primary-container rounded-2xl p-6 shadow-sm border border-border-subtle/50 dark:border-primary-container/50">
                                    <div className="text-label-sm text-text-muted dark:text-on-primary/50 mb-2">{b.date ? new Date(b.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}</div>
                                    <h3 className="text-headline-sm font-headline-sm text-primary dark:text-on-primary mb-3">{b.title}</h3>
                                    <div className="text-body-md text-on-surface-variant dark:text-on-primary/80 mb-4 prose prose-sm dark:prose-invert max-w-none line-clamp-3 [&>p]:!mb-0" dangerouslySetInnerHTML={{ __html: b.description || '' }} />
                                    <Link className="text-[#b45309] dark:text-[#d97706] font-label-md hover:underline mt-auto inline-block" href={b.url || `/bulletins/${b.id}`}>Read Full Bulletin</Link>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-text-muted dark:text-on-primary/70 bg-surface dark:bg-primary-container rounded-2xl border border-border-subtle/50 dark:border-primary-container/50">
                            No bulletins currently available.
                        </div>
                    )}
                </section>

                {/* Available Properties Section */}
                <section className="py-section-gap bg-surface-container-low dark:bg-primary-container/20 px-margin-mobile md:px-margin-desktop" id="properties">
                    <div className="max-w-container-max mx-auto">
                        <div className="flex justify-between items-end mb-12 border-b border-border-subtle dark:border-primary-container pb-4 reveal">
                            <div>
                                <span className="text-label-sm font-label-sm text-[#b45309] dark:text-[#d97706] uppercase tracking-wider block mb-2">{propertySettings?.eyebrow || 'Find Your Home'}</span>
                                <h2 className="text-headline-md font-headline-md text-primary dark:text-primary-fixed-dim">{propertySettings?.title || 'Available Properties'}</h2>
                                {propertySettings?.subtitle && <p className="mt-2 text-text-muted dark:text-on-primary/70">{propertySettings.subtitle}</p>}
                            </div>
                            {properties && properties.length > 0 && (
                                <Link className="group flex items-center text-label-md font-label-md text-primary dark:text-primary-fixed-dim hover:text-primary-container dark:hover:text-primary-fixed transition-colors" href="/property">
                                    View All
                                    <span className="material-symbols-outlined ml-2 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                </Link>
                            )}
                        </div>
                        {properties && properties.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 reveal">
                                {properties.map((p: any) => (
                                    <div key={p.id} className="bg-surface dark:bg-primary-container rounded-2xl shadow-sm border border-border-subtle/50 dark:border-primary-container/50 overflow-hidden flex flex-col group">
                                        <div className="h-56 overflow-hidden relative">
                                            <img alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={(p.images && p.images.length > 0) ? getImageUrl(p.images[0]) : (p.thumbnail_url ? getImageUrl(p.thumbnail_url) : 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgQjp1zRS5bEW5kyJnCdZ1pKGLloPZ3aw2373P7YoJQxR38ckj8iywKwVpF_nfQx4Au2Pz06PyEa2J6icsa32JDPt89qDrrHUAgT8vrKg7v8uPHFMdQxiA_FQYzphaZlRonLb8CCp2GShtlfCPZgN3XvnCw3SgU_6a3cWY87CrCwnMHBFbgalIS-_U1l1WYLifoKpzrqiVFNudotHA7dWlTuGTlKnH8kl3CxjZk5nKDLy_ErWLfM8D79Ub5FFHIGLRaZddPTLri7c')} />
                                            <div className={`absolute top-4 left-4 ${p.listing_type === 'For Sale' || p.status === 'available' ? 'bg-[#b45309] text-white' : 'bg-primary dark:bg-primary-fixed-dim text-white dark:text-primary'} px-3 py-1 rounded text-label-sm font-bold uppercase`}>
                                                {p.listing_type || p.status || p.type}
                                            </div>
                                        </div>
                                        <div className="p-6 flex flex-col flex-grow">
                                            <h3 className="text-headline-sm font-headline-sm text-primary dark:text-on-primary mb-2 line-clamp-1">{p.title}</h3>
                                            <p className="text-display-lg-mobile text-[#b45309] dark:text-[#d97706] mb-4">Rp {p.price?.toLocaleString('id-ID')} {p.listing_type === 'For Rent' || p.status === 'rented' ? <span className="text-body-md text-text-muted dark:text-on-primary/70">/year</span> : null}</p>
                                            <div className="grid grid-cols-3 gap-2 text-text-muted dark:text-on-primary/70 mb-6 border-t border-border-subtle dark:border-primary-container/50 pt-4">
                                                {p.bedrooms !== undefined && <div className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">bed</span> {p.bedrooms} Beds</div>}
                                                {p.bathrooms !== undefined && <div className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">shower</span> {p.bathrooms} Baths</div>}
                                                {(p.landArea !== undefined || p.area_sqft !== undefined) && <div className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">square_foot</span> {p.landArea || p.area_sqft} m²</div>}
                                            </div>
                                            <Link href={`/property/${p.id}`} className="mt-auto block text-center w-full py-3 border-2 border-primary dark:border-primary-fixed-dim text-primary dark:text-primary-fixed-dim rounded-lg hover:bg-primary hover:text-white dark:hover:bg-primary-fixed-dim dark:hover:text-primary transition-colors font-label-md">View Details</Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-text-muted dark:text-on-primary/70 bg-surface dark:bg-primary-container rounded-2xl border border-border-subtle/50 dark:border-primary-container/50">
                                No properties currently available.
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <Footer footerData={footerData} />
        </div>
    );
}
