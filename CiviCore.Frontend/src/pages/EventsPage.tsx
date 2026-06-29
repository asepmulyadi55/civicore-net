import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TopNavBar from '../components/TopNavBar';
import Footer from '../components/Footer';

const CATEGORIES = ['wellness', 'meetings', 'education', 'cultural', 'sports', 'other'];
const PER_PAGE = 6;

const MOCK_EVENTS = [
    {
        id: '1',
        title: 'Summer Garden Party',
        description: 'Join us for an evening of music, local food, and community connection in the central garden.',
        category: 'cultural',
        status: 'ongoing',
        date: '2026-08-15',
        image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAcznvVK2f2TkbuY6sy-PZMgOSdo_kRR-2Qfso47BVm7LWAZuEq9UWnQ29d6RFx00Qg50WfrZdaKXGMpYc7s-2TdKkcdEpU8uhurr_cnQDrP4xA1dePRfB-5tW8d9L7p_2pwiEqN4g8QYj9CwS8z3vqv3bK28IQp2aEanu2mz8DgbpGg7yp9QmlTEieQec3U6eiVUMiJLrB_zje7RCZu2bA8ChaOzagFlfLQUc8EbVbnQzRA8KiYgwFYKrIvR91ss3cEqAtrwWkqtQ',
        url: '#'
    },
    {
        id: '2',
        title: 'Community Workshop',
        description: 'Learn sustainable gardening practices from local experts in our monthly green living series.',
        category: 'education',
        status: 'upcoming',
        date: '2026-09-02',
        image_url: '/workshop_event.png',
        url: '#'
    },
    {
        id: '3',
        title: 'Acoustic Evening',
        description: 'Unwind with live acoustic music by the clubhouse pool. Bring your own picnic blankets!',
        category: 'cultural',
        status: 'upcoming',
        date: '2026-09-20',
        image_url: '/acoustic_event.png',
        url: '#'
    },
    {
        id: '4',
        title: 'Morning Yoga Session',
        description: 'Start your weekend with a refreshing yoga session at the botanical gardens.',
        category: 'wellness',
        status: 'upcoming',
        date: '2026-09-25',
        image_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80&auto=format',
        url: '#'
    },
    {
        id: '5',
        title: 'HOA Board Meeting',
        description: 'Monthly meeting to discuss community improvements and budget allocations.',
        category: 'meetings',
        status: 'upcoming',
        date: '2026-10-05',
        image_url: 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=600&q=80&auto=format',
        url: '#'
    },
    {
        id: '6',
        title: 'Tennis Tournament',
        description: 'Annual Dwipapuri doubles tennis tournament. Registration required.',
        category: 'sports',
        status: 'past',
        date: '2026-05-15',
        image_url: 'https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=600&q=80&auto=format',
        url: '#'
    },
    {
        id: '7',
        title: 'Cooking Masterclass',
        description: 'Learn how to prepare authentic local cuisine with guest chef Renata.',
        category: 'education',
        status: 'upcoming',
        date: '2026-10-12',
        image_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80&auto=format',
        url: '#'
    },
    {
        id: '8',
        title: 'Morning Cycling Tour',
        description: 'Join the community cycling club for a scenic 15km ride around the perimeter.',
        category: 'sports',
        status: 'upcoming',
        date: '2026-10-18',
        image_url: 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=600&q=80&auto=format',
        url: '#'
    },
    {
        id: '9',
        title: 'Annual Resident Meeting',
        description: 'End-of-year review and planning session. All residents encouraged to attend.',
        category: 'meetings',
        status: 'upcoming',
        date: '2026-11-20',
        image_url: 'https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=600&q=80&auto=format',
        url: '#'
    }
];

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
    const [status, setStatus]     = useState('');
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

    // Filter
    const today = new Date().toISOString().slice(0, 10);
    const filtered = MOCK_EVENTS.filter(e => {
        const matchSearch   = !search || (e.title ?? '').toLowerCase().includes(search.toLowerCase()) || (e.description ?? '').toLowerCase().includes(search.toLowerCase());
        const matchCategory = !category || (e.category ?? '').toLowerCase() === category;

        let matchStatus = true;
        if (status === 'upcoming') matchStatus = (e.status === 'ongoing') || !e.date || e.date >= today;
        if (status === 'past')     matchStatus = (e.status !== 'ongoing') && !!e.date && e.date < today;
        if (status === 'ongoing')  matchStatus = e.status === 'ongoing';

        return matchSearch && matchCategory && matchStatus;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const pages      = getPaginationPages(page, totalPages);

    useEffect(() => { setPage(1); }, [search, category, status]);

    const clearFilters = () => { setSearch(''); setCategory(''); setStatus(''); };
    const hasFilters   = !!(search || category || status);

    return (
        <div className="bg-surface-container-lowest dark:bg-primary text-on-surface dark:text-on-primary font-body-md antialiased transition-colors duration-300 min-h-screen flex flex-col">
            <TopNavBar activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} toggleDark={toggleDark} />

            <main className="flex-grow pt-20 pb-20">
                <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-12 md:py-20">

                    {/* Page heading */}
                    <div className="mb-10">
                        <Link to="/" className="inline-flex items-center gap-1.5 text-label-sm font-label-sm text-[#b45309] dark:text-[#d97706] uppercase tracking-wider mb-4 hover:underline">
                            <span className="material-symbols-outlined text-sm">arrow_back</span>
                            Back to Home
                        </Link>
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

                        <select
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            className="pl-4 pr-10 py-3 rounded-xl border border-border-subtle/50 dark:border-primary-container/50 bg-surface dark:bg-primary-container text-text-muted dark:text-on-primary/80 focus:outline-none w-full sm:w-auto shadow-sm appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%231C2D27%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] dark:bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23F0EDE8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.75rem_auto] bg-no-repeat bg-[position:right_1rem_center]"
                        >
                            <option value="">All Categories</option>
                            {CATEGORIES.map(c => (
                                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                            ))}
                        </select>

                        <select
                            value={status}
                            onChange={e => setStatus(e.target.value)}
                            className="pl-4 pr-10 py-3 rounded-xl border border-border-subtle/50 dark:border-primary-container/50 bg-surface dark:bg-primary-container text-text-muted dark:text-on-primary/80 focus:outline-none w-full sm:w-auto shadow-sm appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%231C2D27%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] dark:bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23F0EDE8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.75rem_auto] bg-no-repeat bg-[position:right_1rem_center]"
                        >
                            <option value="">All Status</option>
                            <option value="upcoming">Upcoming</option>
                            <option value="ongoing">Ongoing</option>
                            <option value="past">Past</option>
                        </select>

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
                            {paginated.map((event) => {
                                const isPast = (event.status !== 'ongoing') && !!event.date && event.date < today;

                                return (
                                    <div key={event.id} className="bg-surface dark:bg-primary-container rounded-2xl shadow-sm border border-border-subtle/50 dark:border-primary-container/50 overflow-hidden hover:shadow-md transition-shadow flex flex-col group">
                                        <div className="h-48 overflow-hidden relative">
                                            <img alt={event.title} className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isPast ? 'grayscale opacity-80' : ''}`} src={event.image_url} />
                                            <div className="absolute top-4 left-4 flex gap-2">
                                                {event.date && (
                                                    <div className="bg-surface-glass backdrop-blur-sm px-3 py-1 rounded text-primary font-bold text-sm">
                                                        {new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
                                                    </div>
                                                )}
                                                {isPast && (
                                                    <div className="bg-surface-glass backdrop-blur-sm px-3 py-1 rounded text-primary font-bold text-sm">Past</div>
                                                )}
                                                {event.status === 'ongoing' && (
                                                    <div className="bg-[#b45309] text-white px-3 py-1 rounded font-bold text-sm">Ongoing</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-6 flex flex-col flex-grow">
                                            <div className="text-label-sm font-label-sm text-[#b45309] dark:text-[#d97706] uppercase tracking-wider mb-2">{event.category}</div>
                                            <h3 className="text-headline-sm font-headline-sm text-primary dark:text-on-primary mb-2">{event.title}</h3>
                                            <p className="text-body-md text-text-muted dark:text-on-primary/70 mb-6 flex-grow">{event.description}</p>
                                            
                                            <div className="mt-auto border-t border-border-subtle/50 dark:border-primary-container/50 pt-4 flex justify-between items-center">
                                                <a className="text-primary dark:text-primary-fixed-dim font-label-md inline-flex items-center group/link" href={event.url}>
                                                    <span className="group-hover/link:underline">{isPast ? 'View Gallery' : 'RSVP'}</span> 
                                                    <span className="material-symbols-outlined text-sm ml-1 group-hover/link:translate-x-1 transition-transform">arrow_right_alt</span>
                                                </a>
                                                <span className="text-label-sm text-text-muted dark:text-on-primary/50">
                                                    {event.date ? new Date(event.date + 'T00:00:00').getFullYear() : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
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
