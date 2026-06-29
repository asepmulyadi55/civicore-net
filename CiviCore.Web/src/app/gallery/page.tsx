"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import TopNavBar from '@/components/TopNavBar';
import Footer from '@/components/Footer';

export const MOCK_ALBUMS = [
    {
        id: 'community-life',
        title: 'Community Life',
        image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDqmJbXJfWPbdc2pd8BtFwTYl1KGyL-YtzdJWtn6C-PLLYeGND0o9idmDEkCLCNadXGgEk1D4fczrphhSJwrRdQFTxhjEbSgye3NmOeVIuhT_QKw2fGu1lpXSl9gMn2R9scg5z09MOxMCxYoOf7LkuNdi34YzT6Q_VfZ3fAk7YiLbqlQlkcyb2qZoN9Be7w8EFfFiF5sZZCo46zPenk5RHo29Pk2H9rHqSZhvXUM0t5VHWRyzss9ONZBqgL1jCs8vK7MrpVHPNY1Og',
    },
    {
        id: 'clubhouse',
        title: 'Clubhouse & Facilities',
        image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD55aFz8NDn0tXi_fzmIam_RZaFwDhAczD1L4kTGDx3sbMlR0oF0fEJB5qFaP04Btkcj6aHz6QlpxgzjIYCilYWKVHAUZys336usIkE5SzFmXdvI3NvErNZ0g2TMOrUu1c-4tth-d3jBfcLR85PhiVZ-By3Hj2sgF0VsRp1fP7NyU97aIp0YyjjBQkx4-gGQIjtxX_CFAevCygShudFFGofPbQX20yTk7WXTZJxCtg4SvhN88iP29cXUKzOB9OXHuNDpxl0_s61314',
    },
    {
        id: 'past-events',
        title: 'Past Events',
        description: 'Memories from our vibrant community gatherings.',
        image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAcznvVK2f2TkbuY6sy-PZMgOSdo_kRR-2Qfso47BVm7LWAZuEq9UWnQ29d6RFx00Qg50WfrZdaKXGMpYc7s-2TdKkcdEpU8uhurr_cnQDrP4xA1dePRfB-5tW8d9L7p_2pwiEqN4g8QYj9CwS8z3vqv3bK28IQp2aEanu2mz8DgbpGg7yp9QmlTEieQec3U6eiVUMiJLrB_zje7RCZu2bA8ChaOzagFlfLQUc8EbVbnQzRA8KiYgwFYKrIvR91ss3cEqAtrwWkqtQ',
        count: 24
    }
];

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
            try { localStorage.setItem('homepageDark', String(next)); } catch {}
            return next;
        });
    };

    useEffect(() => { window.scrollTo(0, 0); }, []);

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
                    <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-primary dark:text-primary-fixed-dim mb-4">Gallery</h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant dark:text-on-primary/70 max-w-2xl">
                        Explore life at Dwipapuri through our curated photo albums.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {MOCK_ALBUMS.map(album => (
                        <Link href={`/gallery/${album.id}`} key={album.id} className="group relative rounded-2xl overflow-hidden h-[400px] shadow-sm hover:shadow-xl border border-border-subtle/50 dark:border-primary-container/50 transition-shadow">
                            <div className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url('${album.image_url}')` }}></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>
                            
                            <div className="absolute top-4 right-4 bg-surface-glass dark:bg-black/50 backdrop-blur-md px-3 py-1 rounded text-primary dark:text-primary-fixed-dim font-label-sm text-label-sm">
                                {album.count} Photos
                            </div>

                            <div className="absolute bottom-0 left-0 p-8 w-full translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                <h3 className="font-headline-sm text-headline-sm text-white mb-2">{album.title}</h3>
                                <p className="font-body-md text-body-md text-white/80 line-clamp-2">{album.description}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </main>

            <Footer setActiveTab={setActiveTab} />
        </div>
    );
}
