"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import TopNavBar from '@/components/TopNavBar';
import Footer from '@/components/Footer';

export default function BulletinDetailPage() {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState('bulletins');
    const [bulletin, setBulletin] = useState<any>(null);
    const [recentBulletins, setRecentBulletins] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
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

    useEffect(() => {
        window.scrollTo(0, 0);
        setLoading(true);
        fetch(`/api/homepage/bulletin/${id}`)
            .then(res => res.json())
            .then(data => setBulletin(data))
            .catch(() => setBulletin(null))
            .finally(() => setLoading(false));

        fetch(`/api/homepage/bulletin`)
            .then(res => res.json())
            .then(data => setRecentBulletins(data))
            .catch(console.error);
    }, [id]);

    if (loading) {
        return (
            <div className="bg-surface-container-lowest dark:bg-primary text-on-surface dark:text-on-primary font-body-md antialiased min-h-screen flex flex-col justify-center items-center">
                <span className="material-symbols-outlined text-4xl text-primary animate-spin">autorenew</span>
            </div>
        );
    }

    if (!bulletin || bulletin.message) {
        return (
            <div className="bg-surface-container-lowest dark:bg-primary text-on-surface dark:text-on-primary font-body-md antialiased min-h-screen flex flex-col">
                <TopNavBar activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} toggleDark={toggleDark} />
                <main className="flex-grow pt-32 text-center">
                    <h1 className="text-display-lg text-primary dark:text-primary-fixed-dim mb-4">Bulletin Not Found</h1>
                    <Link href="/bulletins" className="text-[#b45309] hover:underline">Back to Bulletins</Link>
                </main>
                <Footer setActiveTab={setActiveTab} />
            </div>
        );
    }

    return (
        <div className="bg-surface-container-lowest dark:bg-primary text-on-surface dark:text-on-primary font-body-md antialiased min-h-screen flex flex-col transition-colors duration-300">
            <TopNavBar activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} toggleDark={toggleDark} />

            <main className="flex-grow px-margin-mobile md:px-margin-desktop pt-32 pb-section-gap max-w-container-max mx-auto w-full">
                {/* Back Button */}
                <div className="mb-8">
                    <div className="flex items-center space-x-2 text-text-muted dark:text-on-primary/70 font-label-sm text-label-sm">
                        <Link className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors" href="/bulletins">Bulletins</Link>
                        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                        <span className="text-on-surface dark:text-on-primary truncate max-w-[200px] sm:max-w-xs">{bulletin.title}</span>
                    </div>
                </div>

                {/* Article Header */}
                <header className="mb-12 max-w-3xl">
                    <div className="flex items-center space-x-4 mb-4">
                        <span className="bg-primary-container/10 dark:bg-primary-fixed-dim/10 text-primary-container dark:text-primary-fixed-dim px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider">
                            Bulletin
                        </span>
                        <div className="flex items-center text-text-muted dark:text-on-primary/50 text-label-sm font-label-sm">
                            <span className="material-symbols-outlined text-[16px] mr-1.5">calendar_month</span>
                            {bulletin.date ? new Date(bulletin.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-md md:text-display-md text-primary dark:text-primary-fixed-dim mb-6">
                        {bulletin.title}
                    </h1>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
                    {/* Main Text Column */}
                    <article className="lg:col-span-8 space-y-8 font-body-md text-body-md text-on-surface dark:text-on-primary/90 leading-relaxed">
                        {bulletin.image_url && (
                            <img
                                alt={bulletin.title || "Bulletin Cover"}
                                className="w-full h-auto max-h-[400px] rounded-xl shadow-sm object-cover mb-10"
                                src={bulletin.image_url.startsWith('http') ? bulletin.image_url : bulletin.image_url}
                            />
                        )}

                        {/* Description */}
                        <div dangerouslySetInnerHTML={{ __html: bulletin.description || '' }} />
                    </article>

                    {/* Sidebar */}
                    <aside className="lg:col-span-4 space-y-8 mt-12 lg:mt-0">
                        {/* Contact Card */}
                        <div className="bg-surface-glass dark:bg-primary-container backdrop-blur-md border border-border-subtle dark:border-primary-container/50 rounded-xl p-6 shadow-sm">
                            <h3 className="font-headline-sm text-headline-sm text-primary dark:text-primary-fixed-dim mb-6 border-b border-border-subtle dark:border-primary-container/50 pb-4">Management Office</h3>
                            <div className="space-y-4 font-body-md text-body-md dark:text-on-primary/90">
                                <div className="flex items-start">
                                    <span className="material-symbols-outlined text-primary-container dark:text-primary-fixed-dim mr-3 mt-1">phone</span>
                                    <div>
                                        <p className="font-label-md text-label-md text-on-surface-variant dark:text-on-primary/70">Contact Number</p>
                                        <p className="font-semibold">+1 (555) 019-8273</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <span className="material-symbols-outlined text-primary-container dark:text-primary-fixed-dim mr-3 mt-1">mail</span>
                                    <div>
                                        <p className="font-label-md text-label-md text-on-surface-variant dark:text-on-primary/70">Email</p>
                                        <a className="text-[#b45309] dark:text-[#d97706] hover:underline" href="mailto:info@dwipapuri.com">info@dwipapuri.com</a>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <span className="material-symbols-outlined text-primary-container dark:text-primary-fixed-dim mr-3 mt-1">location_on</span>
                                    <div>
                                        <p className="font-label-md text-label-md text-on-surface-variant dark:text-on-primary/70">Office Location</p>
                                        <p>Main Pavilion</p>
                                    </div>
                                </div>
                            </div>
                            <button className="w-full mt-8 bg-[#b45309] text-white font-label-md text-label-md py-3 px-4 rounded-lg hover:bg-[#8b4006] transition-colors flex justify-center items-center">
                                <span className="material-symbols-outlined mr-2 text-sm">chat</span>
                                Message Support
                            </button>
                        </div>

                        {/* Related Bulletins */}
                        <div className="bg-surface dark:bg-primary-container rounded-xl p-6 border border-border-subtle dark:border-primary-container/50">
                            <h3 className="font-headline-sm text-headline-sm text-primary dark:text-primary-fixed-dim mb-6">Recent Announcements</h3>
                            <div className="space-y-6">
                                {recentBulletins.filter(b => b.id !== id).slice(0, 3).map((related, idx) => (
                                    <React.Fragment key={related.id}>
                                        <Link href={related.url || `/bulletins/${related.id}`} className="block group">
                                            <p className="font-label-sm text-label-sm text-on-surface-variant dark:text-on-primary/60 mb-1">{related.date ? new Date(related.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</p>
                                            <h4 className="font-body-md text-body-md font-semibold dark:text-on-primary/90 group-hover:text-primary dark:group-hover:text-primary-fixed-dim transition-colors">
                                                {related.title}
                                            </h4>
                                        </Link>
                                        {idx < 2 && <div className="h-px w-full bg-border-subtle dark:bg-primary-container/50"></div>}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </aside>
                </div>
            </main>

            <Footer setActiveTab={setActiveTab} />
        </div>
    );
}
