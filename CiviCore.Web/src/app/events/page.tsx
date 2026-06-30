"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import TopNavBar from '@/components/TopNavBar';
import Footer from '@/components/Footer';

const CATEGORIES = ['wellness', 'meetings', 'education', 'cultural', 'sports', 'other'];
const PER_PAGE = 6;

export const API_URL = 'http://localhost:5075';

function getPaginationPages(current: number, total: number) {
    if (total <= 7) return new Array(total).fill(null).map((_, i) => i + 1);
    const pages: any[] = [1];
    if (current > 3) pages.push('ellipsis-start');
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        pages.push(i);
    }
    if (current < total - 2) pages.push('ellipsis-end');
    pages.push(total);
    return pages;
}

export default function EventsPage() {
    const [search, setSearch]     = useState('');
    const [category, setCategory] = useState('');
    const [status, setStatus] = useState('all');
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [page, setPage]         = useState(1);
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
            try { localStorage.setItem('homepageDark', String(next)); } catch {}
            return next;
        });
    };

    useEffect(() => { window.scrollTo(0, 0); }, []);

    const [eventsList, setEventsList] = useState<any[]>([]);
    useEffect(() => {
        fetch('/api/homepage/events')
            .then(res => res.json())
            .then(data => setEventsList(data))
            .catch(console.error);
    }, []);

    // Filter
    const today = new Date().toISOString().slice(0, 10);
    const filtered = eventsList.filter(e => {
        const matchSearch   = !search || (e.title ?? '').toLowerCase().includes(search.toLowerCase()) || (e.description ?? '').toLowerCase().includes(search.toLowerCase());
        const matchCategory = !category || (e.category ?? '').toLowerCase() === category;

        let matchStatus = true;
        if (status === 'upcoming') matchStatus = (e.status === 'ongoing') || !e.date || e.date >= today;
        if (status === 'past')     matchStatus = (e.status !== 'ongoing') && !!e.date && e.date < today;
        if (status === 'ongoing')  matchStatus = e.status === 'ongoing';

        return matchSearch && matchCategory && matchStatus;
    });

    const sortedFiltered = [...filtered].sort((a, b) => {
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

    const totalPages = Math.max(1, Math.ceil(sortedFiltered.length / PER_PAGE));
    const paginated  = sortedFiltered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const pages      = getPaginationPages(page, totalPages);

    useEffect(() => { setPage(1); }, [search, category, status]);

    const clearFilters = () => { setSearch(''); setCategory(''); setStatus('all'); };
    const hasFilters   = !!(search || category || (status !== 'all' && status !== ''));

    return (
        <div className="bg-surface-container-lowest dark:bg-primary text-on-surface dark:text-on-primary font-body-md antialiased transition-colors duration-300 min-h-screen flex flex-col">
            <TopNavBar activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} toggleDark={toggleDark} />

            <main className="flex-grow pt-20 pb-20">
                <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-12 md:py-20">

                    {/* Page heading */}
                    <div className="mb-10">
                        <div className="flex items-center space-x-2 text-text-muted dark:text-on-primary/70 font-label-sm text-label-sm mb-4">
                            <Link className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors" href="/">Home</Link>
                            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                            <span className="text-on-surface dark:text-on-primary">Events</span>
                        </div>
                        <h1 className="text-display-lg-mobile md:text-display-lg font-display-lg text-primary dark:text-primary-fixed-dim">
                            Community Events
                        </h1>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="relative flex-1 sm:max-w-sm">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted dark:text-on-primary/50">search</span>
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search events…"
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-border-subtle/50 dark:border-primary-container/50 bg-surface dark:bg-primary-container text-primary dark:text-on-primary focus:outline-none focus:border-primary dark:focus:border-primary-fixed-dim transition-all shadow-sm"
                            />
                        </div>
                        <div className="relative">
                            <button 
                                type="button" 
                                onClick={() => { setIsCategoryOpen(!isCategoryOpen); setIsStatusOpen(false); }} 
                                className="pl-4 pr-10 py-3 rounded-xl border border-border-subtle/50 dark:border-primary-container/50 bg-surface dark:bg-primary-container text-text-muted dark:text-on-primary/80 focus:outline-none w-full sm:w-48 shadow-sm text-left flex items-center justify-between"
                            >
                                <span className="truncate">{category ? CATEGORIES.find(c => c === category)?.charAt(0).toUpperCase() + (CATEGORIES.find(c => c === category)?.slice(1) || "") : "All Categories"}</span>
                                <span className="material-symbols-outlined absolute right-3 pointer-events-none transition-transform duration-200" style={{ transform: isCategoryOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
                            </button>
                            {isCategoryOpen && (
                                <ul className="absolute z-50 w-full mt-2 bg-surface dark:bg-primary-container border border-border-subtle/50 dark:border-primary-container/50 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                    <li onClick={() => { setCategory(''); setIsCategoryOpen(false); }} className="px-4 py-3 hover:bg-surface-container-low dark:hover:bg-primary/50 cursor-pointer font-body-md text-on-surface dark:text-on-primary border-b border-border-subtle/20 dark:border-primary-container/20 last:border-0 truncate">All Categories</li>
                                    {CATEGORIES.map(c => (
                                        <li key={c} onClick={() => { setCategory(c); setIsCategoryOpen(false); }} className="px-4 py-3 hover:bg-surface-container-low dark:hover:bg-primary/50 cursor-pointer font-body-md text-on-surface dark:text-on-primary border-b border-border-subtle/20 dark:border-primary-container/20 last:border-0 truncate">
                                            {c.charAt(0).toUpperCase() + c.slice(1)}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="relative">
                            <button 
                                type="button" 
                                onClick={() => { setIsStatusOpen(!isStatusOpen); setIsCategoryOpen(false); }} 
                                className="pl-4 pr-10 py-3 rounded-xl border border-border-subtle/50 dark:border-primary-container/50 bg-surface dark:bg-primary-container text-text-muted dark:text-on-primary/80 focus:outline-none w-full sm:w-48 shadow-sm text-left flex items-center justify-between"
                            >
                                <span className="truncate">{status === 'upcoming' ? 'Upcoming' : status === 'past' ? 'Past' : status === 'ongoing' ? 'Ongoing' : 'All Events'}</span>
                                <span className="material-symbols-outlined absolute right-3 pointer-events-none transition-transform duration-200" style={{ transform: isStatusOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
                            </button>
                            {isStatusOpen && (
                                <ul className="absolute z-50 w-full mt-2 bg-surface dark:bg-primary-container border border-border-subtle/50 dark:border-primary-container/50 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                    <li onClick={() => { setStatus('all'); setIsStatusOpen(false); }} className="px-4 py-3 hover:bg-surface-container-low dark:hover:bg-primary/50 cursor-pointer font-body-md text-on-surface dark:text-on-primary border-b border-border-subtle/20 dark:border-primary-container/20 last:border-0 truncate">All Events</li>
                                    <li onClick={() => { setStatus('upcoming'); setIsStatusOpen(false); }} className="px-4 py-3 hover:bg-surface-container-low dark:hover:bg-primary/50 cursor-pointer font-body-md text-on-surface dark:text-on-primary border-b border-border-subtle/20 dark:border-primary-container/20 last:border-0 truncate">Upcoming</li>
                                    <li onClick={() => { setStatus('ongoing'); setIsStatusOpen(false); }} className="px-4 py-3 hover:bg-surface-container-low dark:hover:bg-primary/50 cursor-pointer font-body-md text-on-surface dark:text-on-primary border-b border-border-subtle/20 dark:border-primary-container/20 last:border-0 truncate">Ongoing</li>
                                    <li onClick={() => { setStatus('past'); setIsStatusOpen(false); }} className="px-4 py-3 hover:bg-surface-container-low dark:hover:bg-primary/50 cursor-pointer font-body-md text-on-surface dark:text-on-primary border-b border-border-subtle/20 dark:border-primary-container/20 last:border-0 truncate">Past</li>
                                </ul>
                            )}
                        </div>

                        {hasFilters && (
                            <button onClick={clearFilters}
                                className="px-6 py-3 rounded-xl bg-surface-container dark:bg-primary-container/50 text-primary dark:text-on-primary hover:bg-surface-container-low transition-colors w-full sm:w-auto">
                                Clear
                            </button>
                        )}
                    </div>

                    <p className="text-body-md text-text-muted dark:text-on-primary/70 mb-8">
                        {filtered.length} event{filtered.length !== 1 ? 's' : ''} {hasFilters ? 'found' : 'total'}
                    </p>

                    {/* Grid */}
                    {paginated.length === 0 ? (
                        <div className="text-center py-20 rounded-2xl bg-surface dark:bg-primary-container border border-border-subtle/50 dark:border-primary-container/50">
                            <span className="material-symbols-outlined text-5xl mb-4 text-text-muted dark:text-on-primary/30">event_busy</span>
                            <p className="font-headline-sm text-primary dark:text-on-primary">No events found</p>
                            {hasFilters && (
                                <button onClick={clearFilters} className="mt-4 text-[#b45309] dark:text-[#d97706] hover:underline">
                                    Clear filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {paginated.map(ev => {
                                const evDate = ev.date ? new Date(ev.date) : new Date();
                                const isPast = (ev.status !== 'ongoing') && !!ev.date && ev.date < today;
                                const imgUrl = ev.image_url ? (ev.image_url.startsWith('http') ? ev.image_url : `${API_URL}${ev.image_url}`) : '/placeholder-event.png';
                                return (
                                    <Link href={ev.url || `/events/${ev.id}`} key={ev.id} className="group flex flex-col bg-surface dark:bg-primary-container rounded-2xl border border-border-subtle/50 dark:border-primary-container/50 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                                        <div className="relative h-56 w-full overflow-hidden bg-surface-container-low dark:bg-primary/30">
                                            <div className="absolute inset-0 bg-primary/10 dark:bg-primary/40 mix-blend-multiply z-10 group-hover:opacity-50 transition-opacity"></div>
                                            <img alt={ev.title} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${isPast ? 'grayscale opacity-80' : ''}`} src={imgUrl} />
                                            <div className="absolute top-4 left-4 flex gap-2">
                                                {ev.date && (
                                                    <div className="bg-surface-glass backdrop-blur-sm px-3 py-1 rounded text-primary font-bold text-sm">
                                                        {new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
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
                                        <div className="p-6 flex flex-col flex-grow">
                                            <div className="text-label-sm font-label-sm text-[#b45309] dark:text-[#d97706] uppercase tracking-wider mb-2">{ev.category}</div>
                                            <h3 className="text-headline-sm font-headline-sm text-primary dark:text-on-primary mb-2">{ev.title}</h3>
                                            <div className="text-body-md text-text-muted dark:text-on-primary/70 mb-6 flex-grow prose prose-sm dark:prose-invert max-w-none line-clamp-3" dangerouslySetInnerHTML={{ __html: ev.description || '' }} />
                                            
                                            <div className="mt-auto border-t border-border-subtle/50 dark:border-primary-container/50 pt-4 flex justify-between items-center">
                                                <span className="text-primary dark:text-primary-fixed-dim font-label-md inline-flex items-center group/link">
                                                    <span className="group-hover/link:underline">{isPast ? 'View Gallery' : 'View Details'}</span> 
                                                    <span className="material-symbols-outlined text-sm ml-1 group-hover/link:translate-x-1 transition-transform">arrow_right_alt</span>
                                                </span>
                                                <span className="text-label-sm text-text-muted dark:text-on-primary/50">
                                                    {ev.date ? new Date(ev.date).getFullYear() : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-12">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                                className="w-10 h-10 rounded-lg flex items-center justify-center border border-border-subtle/50 dark:border-primary-container/50 disabled:opacity-50 text-primary dark:text-on-primary hover:bg-surface-container dark:hover:bg-primary-container transition-colors"
                            >
                                <span className="material-symbols-outlined">chevron_left</span>
                            </button>
                            {pages.map((p, i) =>
                                typeof p === 'string' ? (
                                    <span key={i} className="w-10 h-10 flex items-center justify-center text-text-muted dark:text-on-primary/50">...</span>
                                ) : (
                                    <button
                                        key={i}
                                        onClick={() => setPage(p)}
                                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors font-label-md ${
                                            page === p 
                                            ? 'bg-primary dark:bg-primary-fixed-dim text-white dark:text-primary' 
                                            : 'border border-border-subtle/50 dark:border-primary-container/50 text-primary dark:text-on-primary hover:bg-surface-container dark:hover:bg-primary-container'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                )
                            )}
                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage(p => p + 1)}
                                className="w-10 h-10 rounded-lg flex items-center justify-center border border-border-subtle/50 dark:border-primary-container/50 disabled:opacity-50 text-primary dark:text-on-primary hover:bg-surface-container dark:hover:bg-primary-container transition-colors"
                            >
                                <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                        </div>
                    )}

                </section>
            </main>

            <Footer setActiveTab={setActiveTab} />
        </div>
    );
}
