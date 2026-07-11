"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import TopNavBar from '@/components/TopNavBar';
import Footer from '@/components/Footer';

export default function PropertyDetailPage() {
    const { id } = useParams();
    const [isDark, setIsDark] = useState(() => {
        try { return localStorage.getItem('homepageDark') === 'true'; } catch { return false; }
    });
    const [activeTab, setActiveTab] = useState('properties');

    const [property, setProperty] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (id) {
            fetch(`/api/property/${id}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.id) setProperty(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [id]);

    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const [formName, setFormName] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formPhone, setFormPhone] = useState('');
    const [formMessage, setFormMessage] = useState('');
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [submitMsg, setSubmitMsg] = useState('');

    const openGallery = (index: number = 0) => {
        setCurrentImageIndex(index);
        setIsGalleryOpen(true);
    };

    const handleInquiry = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitStatus('loading');
        const fd = new FormData();
        fd.append('name', formName);
        fd.append('email', formEmail);
        fd.append('phone', formPhone);
        fd.append('message', formMessage);
        fd.append('related_to', `Properti: ${property?.title}`);
        
        try {
            const token = await new Promise((resolve) => {
                (window as any).grecaptcha.ready(() => {
                    (window as any).grecaptcha.execute('6LcYAU4tAAAAAIOUBvSBiUsCre0iHTwZRds2WpI5', { action: 'submit' }).then(resolve);
                });
            });
            fd.append('captchaToken', token as string);

            const res = await fetch('/api/homepage/submit/message', { method: 'POST', body: fd });
            const data = await res.json();
            if (res.ok) { setSubmitStatus('success'); setSubmitMsg(data.message); }
            else { setSubmitStatus('error'); setSubmitMsg(data.message || 'Terjadi kesalahan.'); }
        } catch { setSubmitStatus('error'); setSubmitMsg('Tidak dapat terhubung ke server.'); }
    };

    const propertyImages = property?.images || [
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
        'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80',
        'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80'
    ];

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % propertyImages.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + propertyImages.length) % propertyImages.length);
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest dark:bg-primary text-primary"><span className="material-symbols-outlined animate-spin text-4xl">autorenew</span></div>;
    }
    if (!property) {
        return (
            <div className="bg-surface-container-lowest dark:bg-primary text-on-surface dark:text-on-primary font-body-md antialiased transition-colors duration-300 min-h-screen flex flex-col">
                <TopNavBar activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} toggleDark={() => setIsDark(!isDark)} />
                <main className="flex-grow flex items-center justify-center">
                    <h1 className="text-xl">Property not found</h1>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="bg-surface-container-lowest dark:bg-primary text-on-surface dark:text-on-primary font-body-md antialiased transition-colors duration-300 min-h-screen flex flex-col">
            <TopNavBar activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} toggleDark={() => setIsDark(!isDark)} />

            <main className="flex-grow pt-24 pb-section-gap max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop w-full">
                {/* Breadcrumb & Title */}
                <div className="mb-8 mt-4">
                    <div className="flex items-center space-x-2 text-text-muted dark:text-on-primary/70 font-label-sm text-label-sm mb-4">
                        <Link className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors" href="/property">Properties</Link>
                        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                        <span className="text-on-surface dark:text-on-primary">{property.title}</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed dark:bg-primary-fixed-dim dark:text-primary font-label-sm text-label-sm capitalize">
                                    <span className="material-symbols-outlined text-[14px] mr-1">fiber_new</span> {property.status || property.type}
                                </span>
                            </div>
                            <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-primary dark:text-primary-fixed-dim mb-2">{property.title}</h1>
                            <p className="flex items-center text-text-muted dark:text-on-primary/70 font-body-md text-body-md">
                                <span className="material-symbols-outlined mr-2">location_on</span>
                                {property.location || 'Dwipapuri Estate'}
                            </p>
                        </div>
                        <div className="text-left md:text-right">
                            <p className="font-headline-md text-headline-md text-[#b45309] dark:text-[#d97706]">Rp {property.price?.toLocaleString('id-ID')}</p>
                            {property.type === 'rent' || property.status === 'rented' ? (
                                <p className="text-text-muted dark:text-on-primary/70 font-label-sm text-label-sm mt-1">/year</p>
                            ) : null}
                        </div>
                    </div>
                </div>

                {/* Mobile Gallery Carousel */}
                <div className="md:hidden flex overflow-x-auto snap-x snap-mandatory rounded-2xl h-[40vh] mb-8" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <style>{`
                        .md\\:hidden::-webkit-scrollbar { display: none; }
                    `}</style>
                    {propertyImages.map((img: string, i: number) => {
                        const url = img?.startsWith('http') ? img : img;
                        return (
                            <div key={i} className="min-w-full h-full snap-center relative cursor-pointer" onClick={() => openGallery(i)}>
                                <img src={url} className="w-full h-full object-cover" alt={`${property.title} - ${i + 1}`} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 pointer-events-none"></div>
                                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white font-label-sm text-xs pointer-events-none flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">photo_library</span>
                                    {i + 1} / {propertyImages.length}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Hero Gallery (Bento Grid) - Desktop Only */}
                <div className="hidden md:grid md:grid-cols-4 gap-4 mb-16 h-[50vh] lg:h-[70vh]">
                    {/* Main Featured Image */}
                    <div className="md:col-span-3 md:row-span-2 relative rounded-2xl overflow-hidden group shadow-sm border border-border-subtle/50 dark:border-primary-container/50">
                        <img alt={property.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src={propertyImages[0]?.startsWith('http') ? propertyImages[0] : propertyImages[0]} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60"></div>
                    </div>
                    {/* Side Images */}
                    {propertyImages[1] && (
                        <div className="hidden md:block relative rounded-2xl overflow-hidden group shadow-sm border border-border-subtle/50 dark:border-primary-container/50">
                            <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src={propertyImages[1]?.startsWith('http') ? propertyImages[1] : propertyImages[1]} />
                        </div>
                    )}
                    {propertyImages[2] && (
                        <div onClick={() => openGallery(0)} className="hidden md:block relative rounded-2xl overflow-hidden group shadow-sm border border-border-subtle/50 dark:border-primary-container/50 cursor-pointer">
                            <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src={propertyImages[2]?.startsWith('http') ? propertyImages[2] : propertyImages[2]} />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <span className="bg-black/60 dark:bg-black/80 backdrop-blur-md px-4 py-2 rounded-lg text-white font-label-md">Explore Gallery</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Two Column Layout: Details & Form */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Details (8 cols) */}
                    <div className="lg:col-span-8 space-y-12">
                        {/* Quick Specs Glass Card */}
                        <div className="bg-surface dark:bg-primary-container rounded-2xl p-6 flex flex-wrap justify-between items-center gap-6 shadow-sm border border-border-subtle/50 dark:border-primary-container/50 relative overflow-hidden">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-primary-container/10 dark:bg-primary-fixed-dim/10 flex items-center justify-center text-primary dark:text-primary-fixed-dim">
                                    <span className="material-symbols-outlined">bed</span>
                                </div>
                                <div>
                                    <p className="text-text-muted dark:text-on-primary/70 font-label-sm text-label-sm">Bedrooms</p>
                                    <p className="font-headline-sm text-headline-sm text-on-surface dark:text-on-primary">{property.bedrooms}</p>
                                </div>
                            </div>
                            <div className="w-px h-12 bg-border-subtle dark:bg-primary-container/50 hidden sm:block"></div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-primary-container/10 dark:bg-primary-fixed-dim/10 flex items-center justify-center text-primary dark:text-primary-fixed-dim">
                                    <span className="material-symbols-outlined">bathtub</span>
                                </div>
                                <div>
                                    <p className="text-text-muted dark:text-on-primary/70 font-label-sm text-label-sm">Bathrooms</p>
                                    <p className="font-headline-sm text-headline-sm text-on-surface dark:text-on-primary">{property.bathrooms}</p>
                                </div>
                            </div>
                            <div className="w-px h-12 bg-border-subtle dark:bg-primary-container/50 hidden sm:block"></div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-primary-container/10 dark:bg-primary-fixed-dim/10 flex items-center justify-center text-primary dark:text-primary-fixed-dim">
                                    <span className="material-symbols-outlined">square_foot</span>
                                </div>
                                <div>
                                    <p className="text-text-muted dark:text-on-primary/70 font-label-sm text-label-sm">Living Area</p>
                                    <p className="font-headline-sm text-headline-sm text-on-surface dark:text-on-primary">{property.landArea || property.buildingArea || 0} <span className="text-body-md font-body-md text-text-muted dark:text-on-primary/50">m²</span></p>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <section>
                            <h2 className="font-headline-md text-headline-md text-primary dark:text-primary-fixed-dim mb-6">About This Property</h2>
                            <div className="prose prose-lg max-w-none text-on-surface-variant dark:text-on-primary/80 font-body-lg text-body-lg leading-relaxed space-y-4">
                                {property.description ? (
                                    <div className="rte-content" dangerouslySetInnerHTML={{ __html: (property.description || '').replace(/&nbsp;/g, ' ') }} />
                                ) : (
                                    <p>No description provided.</p>
                                )}
                            </div>
                        </section>

                        <hr className="border-border-subtle dark:border-primary-container/50" />

                        {/* Amenities List */}
                        <section>
                            <h2 className="font-headline-md text-headline-md text-primary dark:text-primary-fixed-dim mb-6">Premium Amenities</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                {property.amenities ? property.amenities.split(',').map((amenity: string, idx: number) => {
                                    const text = amenity.trim();
                                    if (!text) return null;
                                    let icon = "check_circle";
                                    if (text.toLowerCase().includes("pool")) icon = "pool";
                                    else if (text.toLowerCase().includes("garage") || text.toLowerCase().includes("parking")) icon = "directions_car";
                                    else if (text.toLowerCase().includes("garden") || text.toLowerCase().includes("yard")) icon = "local_florist";
                                    else if (text.toLowerCase().includes("security") || text.toLowerCase().includes("cctv")) icon = "security";

                                    return (
                                        <div key={idx} className="flex items-center gap-3 p-4 rounded-xl hover:bg-surface-container-low dark:hover:bg-primary-container transition-colors duration-300 border border-transparent hover:border-border-subtle dark:hover:border-primary-container/50">
                                            <span className="material-symbols-outlined text-primary dark:text-primary-fixed-dim">{icon}</span>
                                            <span className="font-body-md text-body-md text-on-surface dark:text-on-primary">{text}</span>
                                        </div>
                                    );
                                }) : (
                                    <p className="text-text-muted dark:text-on-primary/70">No additional amenities listed.</p>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Sticky Inquiry Form (4 cols) */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-28 bg-surface dark:bg-primary-container rounded-2xl shadow-sm border border-border-subtle/50 dark:border-primary-container/50 p-6 md:p-8">
                            <h3 className="font-headline-sm text-headline-sm text-primary dark:text-on-primary mb-2">Tertarik dengan properti ini?</h3>
                            <p className="text-text-muted dark:text-on-primary/70 font-body-md text-body-md mb-6">Jadwalkan kunjungan atau minta informasi lebih lanjut.</p>

                            {submitStatus === 'success' ? (
                                <div className="text-center py-8">
                                    <span className="material-symbols-outlined text-5xl text-green-600 mb-4 block">check_circle</span>
                                    <p className="font-headline-sm text-primary dark:text-primary-fixed-dim">Pesan Terkirim!</p>
                                    <p className="text-body-md text-text-muted dark:text-on-primary/70 mt-2">{submitMsg}</p>
                                </div>
                            ) : (
                                <form className="space-y-4" onSubmit={handleInquiry}>
                                    <div>
                                        <label className="block font-label-sm text-label-sm text-on-surface dark:text-on-primary/70 mb-1" htmlFor="name">Nama Lengkap</label>
                                        <input required type="text" id="name" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Nama Anda" className="w-full rounded-lg border-border-subtle dark:border-primary-container/50 focus:border-primary dark:focus:border-primary-fixed-dim bg-background dark:bg-primary text-on-surface dark:text-on-primary font-body-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-primary-fixed-dim transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block font-label-sm text-label-sm text-on-surface dark:text-on-primary/70 mb-1" htmlFor="email">Alamat Email</label>
                                        <input required type="email" id="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="email@contoh.com" className="w-full rounded-lg border-border-subtle dark:border-primary-container/50 focus:border-primary dark:focus:border-primary-fixed-dim bg-background dark:bg-primary text-on-surface dark:text-on-primary font-body-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-primary-fixed-dim transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block font-label-sm text-label-sm text-on-surface dark:text-on-primary/70 mb-1" htmlFor="phone">Nomor Telepon</label>
                                        <input type="tel" id="phone" value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="081234567890" className="w-full rounded-lg border-border-subtle dark:border-primary-container/50 focus:border-primary dark:focus:border-primary-fixed-dim bg-background dark:bg-primary text-on-surface dark:text-on-primary font-body-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-primary-fixed-dim transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block font-label-sm text-label-sm text-on-surface dark:text-on-primary/70 mb-1" htmlFor="message">Pesan</label>
                                        <textarea required id="message" value={formMessage} onChange={e => setFormMessage(e.target.value)} placeholder="Saya ingin menjadwalkan kunjungan..." rows={3} className="w-full rounded-lg border-border-subtle dark:border-primary-container/50 focus:border-primary dark:focus:border-primary-fixed-dim bg-background dark:bg-primary text-on-surface dark:text-on-primary font-body-md py-2 px-3 resize-none focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-primary-fixed-dim transition-colors"></textarea>
                                    </div>

                                    {submitStatus === 'error' && <p className="text-red-600 text-sm">{submitMsg}</p>}

                                    <button disabled={submitStatus === 'loading'} type="submit" className="w-full bg-[#b45309] hover:bg-[#8b4006] dark:bg-[#d97706] dark:hover:bg-[#b45309] text-white font-label-md text-label-md py-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 mt-4 flex justify-center items-center gap-2 disabled:opacity-60">
                                        {submitStatus === 'loading' ? <span className="material-symbols-outlined animate-spin text-[18px]">autorenew</span> : <span className="material-symbols-outlined text-[18px]">calendar_month</span>}
                                        {submitStatus === 'loading' ? 'Mengirim...' : 'Jadwalkan Kunjungan'}
                                    </button>

                                    <button type="button" className="w-full bg-transparent border border-border-subtle dark:border-primary-container/50 text-primary dark:text-primary-fixed-dim hover:bg-surface-container-low dark:hover:bg-primary-container font-label-md text-label-md py-3 rounded-lg transition-all duration-300 mt-2">
                                        Minta Brosur
                                    </button>
                                </form>
                            )}

                            <div className="mt-6 pt-6 border-t border-border-subtle dark:border-primary-container/50 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-primary-container/20 dark:bg-primary-fixed-dim/20 flex items-center justify-center text-primary dark:text-primary-fixed-dim shrink-0">
                                    <span className="material-symbols-outlined text-2xl">person</span>
                                </div>
                                <div>
                                    <p className="font-label-md text-label-md text-on-surface dark:text-on-primary">{property.contactName || 'Contact Agent'}</p>
                                    <p className="font-label-sm text-label-sm text-text-muted dark:text-on-primary/50">{property.contactPhone || 'Property Consultant'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {isGalleryOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm" onClick={() => setIsGalleryOpen(false)}>
                        <button onClick={(e) => { e.stopPropagation(); setIsGalleryOpen(false); }} className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full w-12 h-12 flex items-center justify-center z-50">
                            <span className="material-symbols-outlined text-[28px]">close</span>
                        </button>

                        <div className="relative w-full max-w-6xl px-4 flex items-center justify-center h-full">
                            <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-4 md:left-8 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full w-14 h-14 flex items-center justify-center z-50">
                                <span className="material-symbols-outlined text-[32px]">chevron_left</span>
                            </button>

                            <img src={propertyImages[currentImageIndex]?.startsWith('http') ? propertyImages[currentImageIndex] : propertyImages[currentImageIndex]} alt={property.title} className="max-w-full max-h-[85vh] object-contain" />

                            <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors absolute right-4 md:right-12">
                                <span className="material-symbols-outlined text-[32px]">chevron_right</span>
                            </button>
                        </div>

                        <div className="absolute bottom-8 left-0 w-full flex justify-center gap-3 px-4">
                            {propertyImages.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                                    className={`w-3 h-3 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white scale-110' : 'bg-white/30 hover:bg-white/50'}`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
