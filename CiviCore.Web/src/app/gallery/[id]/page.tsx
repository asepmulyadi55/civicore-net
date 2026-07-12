"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import TopNavBar from '@/components/TopNavBar';
import Footer from '@/components/Footer';

export default function GalleryDetailPage() {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState('gallery');
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

    const [album, setAlbum] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    // Keyboard navigation for lightbox
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (selectedIndex === null || !album || !album.photos) return;
            if (e.key === 'Escape') setSelectedIndex(null);
            if (e.key === 'ArrowLeft') setSelectedIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : (album.photos.length - 1)));
            if (e.key === 'ArrowRight') setSelectedIndex((prev) => (prev !== null && prev < album.photos.length - 1 ? prev + 1 : 0));
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedIndex, album]);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (id) {
            setLoading(true);
            fetch(`/api/homepage/gallery/${id}`)
                .then(r => r.ok ? r.json() : null)
                .then(d => setAlbum(d))
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [id]);

    if (loading) {
        return (
            <div className="bg-surface-container-lowest dark:bg-primary text-on-surface dark:text-on-primary font-body-md antialiased min-h-screen flex flex-col">
                <TopNavBar activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} toggleDark={toggleDark} />
                <main className="flex-grow pt-32 text-center flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-4xl animate-spin">autorenew</span>
                </main>
                <Footer setActiveTab={setActiveTab} />
            </div>
        );
    }

    if (!album) {
        return (
            <div className="bg-surface-container-lowest dark:bg-primary text-on-surface dark:text-on-primary font-body-md antialiased min-h-screen flex flex-col">
                <TopNavBar activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} toggleDark={toggleDark} />
                <main className="flex-grow pt-32 text-center">
                    <h1 className="text-display-lg text-primary dark:text-primary-fixed-dim mb-4">Album Not Found</h1>
                    <Link href="/gallery" className="text-[#b45309] hover:underline">Back to Gallery</Link>
                </main>
                <Footer setActiveTab={setActiveTab} />
            </div>
        );
    }

    return (
        <div className="bg-surface-container-lowest dark:bg-primary text-on-surface dark:text-on-primary font-body-md antialiased transition-colors duration-300 min-h-screen flex flex-col">
            <TopNavBar activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} toggleDark={toggleDark} />

            <main className="flex-grow pt-32 pb-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full">
                {/* Header Section */}
                <div className="mb-12 text-left">
                    <div className="flex items-center space-x-2 text-text-muted dark:text-on-primary/70 font-label-sm text-label-sm mb-6">
                        <Link className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors" href="/">Home</Link>
                        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                        <Link className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors" href="/gallery">Gallery</Link>
                        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                        <span className="text-on-surface dark:text-on-primary truncate max-w-[200px] sm:max-w-xs">{album.title}</span>
                    </div>
                    <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-primary dark:text-primary-fixed-dim mb-4">{album.title}</h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant dark:text-on-primary/70 max-w-2xl">
                        {album.description}
                    </p>
                </div>

                {/* Bento Grid Gallery */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter md:auto-rows-[300px]">
                    {(album.photos || []).map((img: any, idx: number) => {
                        const url = img.image_url;
                        // Alternating spans for a dynamic masonry-like look if no colSpan is provided
                        const span = img.colSpan || (idx % 4 === 0 || idx % 4 === 3 ? 'col-span-1 md:col-span-12 lg:col-span-8' : 'col-span-1 md:col-span-6 lg:col-span-4');
                        return (
                            <div key={idx}  tabIndex={0} role="button" onKeyDown={(e) => { if(e.key === "Enter" || e.key === " ") { e.preventDefault(); e.currentTarget.click(); } }} onClick={() => setSelectedIndex(idx)} className={`cursor-pointer group relative rounded-2xl overflow-hidden ${span} h-[300px] md:h-full shadow-sm hover:shadow-lg border border-border-subtle/50 dark:border-primary-container/50 bg-surface-container-lowest dark:bg-primary-container`}>
                                <img alt={img.title || 'Gallery image'} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src={url} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80"></div>
                                <div className="absolute bottom-0 left-0 w-full p-6 bg-surface-glass dark:bg-black/60 backdrop-blur-md border-t border-border-subtle/20 dark:border-white/10 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                    <h3 className="font-headline-sm text-headline-sm text-on-surface dark:text-on-primary mb-1">{img.title}</h3>
                                    <p className="font-body-md text-body-md text-on-surface-variant dark:text-on-primary/80">{img.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>

            {/* Lightbox */}
            {selectedIndex !== null && album?.photos && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm"  tabIndex={0} role="button" onKeyDown={(e) => { if(e.key === "Enter" || e.key === " ") { e.preventDefault(); e.currentTarget.click(); } }} onClick={() => setSelectedIndex(null)}>
                    {/* Close button */}
                    <button 
                        onClick={() => setSelectedIndex(null)}
                        className="absolute top-6 right-6 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full p-2 transition-colors z-[110]"
                    >
                        <span className="material-symbols-outlined text-3xl">close</span>
                    </button>
                    
                    {/* Prev button */}
                    <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedIndex(prev => prev !== null && prev > 0 ? prev - 1 : album.photos.length - 1); }}
                        className="absolute left-6 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full p-3 transition-colors z-[110]"
                    >
                        <span className="material-symbols-outlined text-3xl">chevron_left</span>
                    </button>
                    
                    {/* Image */}
                    <div className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center justify-center"  tabIndex={0} role="button" onKeyDown={(e) => { if(e.key === "Enter" || e.key === " ") { e.preventDefault(); e.currentTarget.click(); } }} onClick={(e) => e.stopPropagation()}>
                        <img 
                            src={album.photos[selectedIndex].image_url} 
                            alt={album.photos[selectedIndex].title || 'Gallery image'}
                            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                        />
                        <div className="mt-4 text-center">
                            <h3 className="text-white text-xl font-headline-sm">{album.photos[selectedIndex].title}</h3>
                            {album.photos[selectedIndex].description && (
                                <p className="text-white/70 mt-2 max-w-2xl text-body-md mx-auto">{album.photos[selectedIndex].description}</p>
                            )}
                            <div className="text-white/50 text-sm mt-2">
                                {selectedIndex + 1} / {album.photos.length}
                            </div>
                        </div>
                    </div>
                    
                    {/* Next button */}
                    <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedIndex(prev => prev !== null && prev < album.photos.length - 1 ? prev + 1 : 0); }}
                        className="absolute right-6 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full p-3 transition-colors z-[110]"
                    >
                        <span className="material-symbols-outlined text-3xl">chevron_right</span>
                    </button>
                </div>
            )}

            <Footer setActiveTab={setActiveTab} />
        </div>
    );
}
