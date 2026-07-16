"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import TopNavBar from '@/components/TopNavBar';
import Footer from '@/components/Footer';

export default function EventDetailPage() {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState('events');

    const [isDark, setIsDark] = useState(() => {
        try { return localStorage.getItem('homepageDark') === 'true'; } catch { return false; }
    });

    useEffect(() => {
        const html = document.documentElement;
        if (isDark) html.classList.add('dark');
        else html.classList.remove('dark');
    }, [isDark]);

    const toggleDark = () => {
        setIsDark(prev => {
            const next = !prev;
            try { localStorage.setItem('homepageDark', String(next)); } catch { }
            return next;
        });
    };

    useEffect(() => { window.scrollTo(0, 0); }, [id]);

    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState<any>(null);

    useEffect(() => {
        setLoading(true);
        fetch('/api/homepage/events')
            .then(res => res.json())
            .then(data => {
                const found = data.find((e: any) => e.id === id || e.url === `/events/${id}` || e.url === id);
                setEvent(found || null);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, [id]);

    if (loading) {
        return (
            <div className="bg-surface-container-lowest dark:bg-primary min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="bg-surface-container-lowest dark:bg-primary text-on-surface dark:text-on-primary font-body-md antialiased min-h-screen flex flex-col">
                <TopNavBar activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} toggleDark={toggleDark} />
                <main className="flex-grow pt-32 text-center">
                    <h1 className="text-display-lg text-primary dark:text-primary-fixed-dim mb-4">Acara Tidak Ditemukan</h1>
                    <Link href="/events" className="text-[#b45309] hover:underline">Kembali ke Acara</Link>
                </main>
                <Footer setActiveTab={setActiveTab} />
            </div>
        );
    }

    const eventDate = event.date ? new Date(event.date) : new Date();
    const formattedDate = eventDate.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const isPast = (event.status !== 'ongoing') && !!event.date && event.date < new Date().toISOString().slice(0, 10);

    return (
        <div className="bg-surface-container-lowest dark:bg-primary text-on-surface dark:text-on-primary font-body-md antialiased transition-colors duration-300 min-h-screen flex flex-col">
            <TopNavBar activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} toggleDark={toggleDark} />

            <main className="flex-grow pt-20">
                {/* Hero Image Section */}
                <section className="relative w-full h-[60vh] md:h-[70vh] max-h-[800px] overflow-hidden">
                    <div className="absolute inset-0 bg-primary/20 dark:bg-primary/60 z-10 mix-blend-multiply"></div>
                    <img
                        alt={event.title}
                        className="w-full h-full object-cover object-center absolute inset-0 z-0"
                        src={event.image_url ? (event.image_url) : '/placeholder-event.png'}
                    />
                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-surface-container-lowest dark:from-primary to-transparent h-48 z-10"></div>
                </section>

                {/* Event Details Container */}
                <section className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop -mt-32 relative z-20 pb-section-gap">
                    <div className="bg-surface-container-lowest/90 dark:bg-primary-container/90 rounded-2xl shadow-xl shadow-primary-container/5 overflow-visible flex flex-col lg:flex-row border border-border-subtle dark:border-primary-container/50 backdrop-blur-xl">

                        {/* Main Info Column */}
                        <div className="p-8 md:p-12 lg:w-2/3 flex flex-col justify-center">
                            <div className="flex items-center space-x-2 text-text-muted dark:text-on-primary/70 font-label-sm text-label-sm mb-8">
                                <Link className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors" href="/">Beranda</Link>
                                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                                <Link className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors" href="/events">Acara</Link>
                                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                                <span className="text-on-surface dark:text-on-primary truncate max-w-[200px] sm:max-w-xs">{event.title}</span>
                            </div>

                            <div className="mb-6 flex flex-wrap gap-3">
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary-fixed-dim/20 text-on-primary-fixed dark:text-primary-fixed-dim font-label-sm text-label-sm uppercase tracking-wider">
                                    {event.category} Event
                                </span>
                                {event.created_at && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-surface-variant/50 text-on-surface-variant dark:text-on-primary/60 font-label-sm text-label-sm uppercase tracking-wider">
                                        Diposting {new Date(event.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </span>
                                )}
                            </div>

                            <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-background dark:text-on-primary mb-4">
                                {event.title}
                            </h1>

                            <div className="font-body-lg text-body-lg text-on-surface-variant dark:text-on-primary/80 mb-8 leading-relaxed space-y-4 rte-content" dangerouslySetInnerHTML={{ __html: (event.description || '').replace(/&nbsp;/g, ' ') }}></div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                                <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-bright dark:bg-[#002117] border border-border-subtle/50 dark:border-primary-container/50">
                                    <div className="p-3 bg-surface-container dark:bg-primary-container rounded-lg text-primary dark:text-primary-fixed-dim">
                                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
                                    </div>
                                    <div>
                                        <h3 className="font-label-md text-label-md text-on-surface dark:text-on-primary/70 mb-1">Tanggal</h3>
                                        <p className="font-body-md text-body-md text-on-surface-variant dark:text-on-primary">{formattedDate}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-bright dark:bg-[#002117] border border-border-subtle/50 dark:border-primary-container/50">
                                    <div className="p-3 bg-surface-container dark:bg-primary-container rounded-lg text-primary dark:text-primary-fixed-dim">
                                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
                                    </div>
                                    <div>
                                        <h3 className="font-label-md text-label-md text-on-surface dark:text-on-primary/70 mb-1">Waktu</h3>
                                        <p className="font-body-md text-body-md text-on-surface-variant dark:text-on-primary">{event.date && event.date.includes('T') ? new Date(event.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-bright dark:bg-[#002117] border border-border-subtle/50 dark:border-primary-container/50 sm:col-span-2">
                                    <div className="p-3 bg-surface-container dark:bg-primary-container rounded-lg text-primary dark:text-primary-fixed-dim">
                                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                                    </div>
                                    <div>
                                        <h3 className="font-label-md text-label-md text-on-surface dark:text-on-primary/70 mb-1">Lokasi</h3>
                                        <p className="font-body-md text-body-md text-on-surface-variant dark:text-on-primary">{event.location || '—'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>


                        {event.action_type === 'youtube' && (
                            <div className="bg-surface-bright dark:bg-[#002117] p-8 md:p-12 lg:w-1/3 border-l border-border-subtle dark:border-primary-container flex flex-col justify-center relative overflow-hidden text-center">
                                <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10 pointer-events-none text-red-600 dark:text-red-500">
                                    <span className="material-symbols-outlined text-[120px]">smart_display</span>
                                </div>
                                <span className="material-symbols-outlined text-6xl text-red-600 dark:text-red-500 mb-4 block relative z-10">smart_display</span>
                                <h2 className="font-headline-sm text-headline-sm text-on-background dark:text-on-primary mb-4 relative z-10">Tonton Video</h2>
                                <p className="font-body-md text-body-md text-on-surface-variant dark:text-on-primary/70 mb-8 relative z-10">
                                    Saksikan siaran atau dokumentasi acara ini langsung di YouTube.
                                </p>
                                <a href={`https://www.youtube.com/watch?v=${event.action_value}`} target="_blank" rel="noopener noreferrer" className="w-full bg-red-600 dark:bg-red-700 text-white hover:bg-red-700 dark:hover:bg-red-600 transition-colors py-3 px-6 rounded-lg font-label-md text-label-md shadow-md hover:shadow-lg flex items-center justify-center gap-2 relative z-10">
                                    Buka di YouTube <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                                </a>
                            </div>
                        )}
                        {event.action_type === 'link' && (
                            <div className="bg-surface-bright dark:bg-[#002117] p-8 md:p-12 lg:w-1/3 border-l border-border-subtle dark:border-primary-container flex flex-col justify-center relative overflow-hidden text-center">
                                <span className="material-symbols-outlined text-6xl text-primary dark:text-primary-fixed-dim mb-4 block">open_in_new</span>
                                <h2 className="font-headline-sm text-headline-sm text-on-background dark:text-on-primary mb-4">Informasi Tambahan</h2>
                                <p className="font-body-md text-body-md text-on-surface-variant dark:text-on-primary/70 mb-8">
                                    Informasi lebih lanjut atau pendaftaran untuk acara ini tersedia di situs eksternal.
                                </p>
                                <a href={event.action_value} target="_blank" rel="noopener noreferrer" className="w-full bg-[#064e3b] dark:bg-primary-fixed-dim text-white dark:text-primary hover:bg-primary-container/90 dark:hover:bg-primary-fixed transition-colors py-3 px-6 rounded-lg font-label-md text-label-md shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                                    Buka Tautan <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                </a>
                            </div>
                        )}
                        {(!event.action_type || event.action_type === 'informational') && (
                            <div className="bg-surface-bright dark:bg-[#002117] p-8 md:p-12 lg:w-1/3 border-l border-border-subtle dark:border-primary-container flex flex-col justify-center items-center relative overflow-hidden text-center">
                                <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10 pointer-events-none text-primary dark:text-primary-fixed-dim">
                                    <span className="material-symbols-outlined text-[120px]">info</span>
                                </div>
                                <span className="material-symbols-outlined text-5xl text-primary dark:text-primary-fixed-dim mb-4 block relative z-10">info</span>
                                <h2 className="font-headline-sm text-headline-sm text-on-background dark:text-on-primary mb-4 relative z-10">Informasi Saja</h2>
                                <p className="font-body-md text-body-md text-on-surface-variant dark:text-on-primary/70 relative z-10">
                                    Acara ini bersifat informasional dan tidak memerlukan RSVP.
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <Footer setActiveTab={setActiveTab} />
        </div>
    );
}
