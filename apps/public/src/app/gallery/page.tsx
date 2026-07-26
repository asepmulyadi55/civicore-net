"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import TopNavBar from '@/components/TopNavBar';
import Footer from '@/components/Footer';

export default function GalleryPage() {
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

    const [albums, setAlbums] = useState<any[]>([]);
    const [settings, setSettings] = useState<any>({});

    useEffect(() => {
        window.scrollTo(0, 0);
        fetch('/api/homepage/gallery')
            .then(r => r.json())
            .then(d => setAlbums(d))
            .catch(console.error);

        fetch('/api/homepage/gallery-settings')
            .then(r => r.json())
            .then(d => setSettings(d))
            .catch(console.error);
    }, []);

    return (
        <div className="bg-surface-container-lowest dark:bg-primary text-on-surface dark:text-on-primary font-body-md antialiased min-h-screen flex flex-col transition-colors duration-300">
            <TopNavBar activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} toggleDark={toggleDark} />

            <main className="flex-grow pt-32 pb-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full">
                <div className="mb-12">
                    <div className="flex items-center space-x-2 text-text-muted dark:text-on-primary/70 font-label-sm text-label-sm mb-4">
                        <Link className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors" href="/">Home</Link>
                        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                        <span className="text-on-surface dark:text-on-primary">Gallery</span>
                    </div>
                    <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-primary dark:text-primary-fixed-dim mb-4">{settings.title || 'Gallery'}</h1>
                    {settings.subtitle && <p className="font-body-lg text-body-lg text-on-surface-variant dark:text-on-primary/70 max-w-2xl">{settings.subtitle}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {albums.map(album => {
                        const count = album.photos?.length || 0;
                        const url = album.image_url;
                        return (
                            <Link href={`/gallery/${album.title?.toLowerCase().replace(/\s+/g, '-')}`} key={album.id} className="group relative rounded-2xl overflow-hidden h-[400px] shadow-sm hover:shadow-xl border border-border-subtle/50 dark:border-primary-container/50 transition-shadow">
                                <div className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url('${url}')` }}></div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>

                                <div className="absolute top-4 right-4 bg-surface-glass dark:bg-black/50 backdrop-blur-md px-3 py-1 rounded text-primary dark:text-primary-fixed-dim font-label-sm text-label-sm">
                                    {count} {count === 1 ? 'Photo' : 'Photos'}
                                </div>

                                <div className="absolute bottom-0 left-0 p-8 w-full translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                    <h3 className="font-headline-sm text-headline-sm text-white mb-2">{album.title}</h3>
                                    <p className="font-body-md text-body-md text-white/80 line-clamp-2">{album.description}</p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </main>

            <Footer setActiveTab={setActiveTab} />
        </div>
    );
}
