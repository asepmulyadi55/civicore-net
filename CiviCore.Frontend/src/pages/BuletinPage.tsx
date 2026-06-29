import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TopNavBar from '../components/TopNavBar';
import Footer from '../components/Footer';

export const MOCK_BULLETINS = [
    {
        id: '1',
        title: 'Monthly Security Update',
        date: 'October 12, 2026',
        category: 'Security',
        description: 'A brief overview of the new gate access protocols and updated patrol schedules for this month.',
    },
    {
        id: '2',
        title: 'Landscaping Schedule',
        date: 'September 28, 2026',
        category: 'Maintenance',
        description: 'Details on the upcoming seasonal planting and maintenance work across common areas.',
    },
    {
        id: '3',
        title: 'Community Board Nominations',
        date: 'September 15, 2026',
        category: 'HOA',
        description: 'Call for nominations for the upcoming HOA board elections. Submit your candidates by Oct 1st.',
    },
    {
        id: '4',
        title: 'Pool Maintenance Closure',
        date: 'September 05, 2026',
        category: 'Facilities',
        description: 'The main clubhouse pool will be closed for routine deep cleaning and tile repair.',
    },
    {
        id: '5',
        title: 'New Recycling Guidelines',
        date: 'August 20, 2026',
        category: 'Community',
        description: 'Updated guidelines on separating recyclables and the introduction of new compost bins.',
    },
    {
        id: '6',
        title: 'Visitor Parking Rules',
        date: 'August 10, 2026',
        category: 'Security',
        description: 'Reminder regarding overnight visitor parking passes and designated zones.',
    },
    {
        id: '7',
        title: 'Fitness Center Equipment Upgrades',
        date: 'July 25, 2026',
        category: 'Facilities',
        description: 'We are installing new treadmills and weight stations. The gym will be closed for 2 days.',
    },
    {
        id: '8',
        title: 'Neighborhood Watch Meeting',
        date: 'July 12, 2026',
        category: 'Security',
        description: 'Join the quarterly neighborhood watch meeting at the central pavilion.',
    },
    {
        id: '9',
        title: 'Annual HOA Dues Notice',
        date: 'June 30, 2026',
        category: 'HOA',
        description: 'Information regarding the upcoming annual HOA dues and payment options.',
    },
    {
        id: '10',
        title: 'Summer Festival Road Closures',
        date: 'June 15, 2026',
        category: 'Events',
        description: 'Temporary road closures for the upcoming summer festival parade route.',
    },
    {
        id: '11',
        title: 'Pet Registration Drive',
        date: 'June 01, 2026',
        category: 'Community',
        description: 'All resident pets must be registered with the management office by the end of the month.',
    },
    {
        id: '12',
        title: 'Smart Home Integration Guide',
        date: 'May 20, 2026',
        category: 'Maintenance',
        description: 'A comprehensive guide to integrating your unit\'s smart thermostat and lighting systems.',
    }
];

export default function BuletinPage() {
    const [activeTab, setActiveTab] = useState('bulletins');
    const [isDark, setIsDark] = useState(() => {
        try { return localStorage.getItem('homepageDark') === 'true'; } catch { return false; }
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9;

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

    // Filter and Pagination
    const filteredBulletins = MOCK_BULLETINS.filter(b => 
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        b.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.max(1, Math.ceil(filteredBulletins.length / itemsPerPage));
    const paginatedBulletins = filteredBulletins.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    return (
        <div className="bg-surface-container-lowest dark:bg-primary text-on-surface dark:text-on-primary font-body-md antialiased min-h-screen flex flex-col transition-colors duration-300">
            <TopNavBar activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} toggleDark={toggleDark} />
            
            <main className="flex-grow pt-32 pb-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full">
                <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center space-x-2 text-text-muted dark:text-on-primary/70 font-label-sm text-label-sm mb-4">
                            <Link className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors" to="/">Home</Link>
                            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                            <span className="text-on-surface dark:text-on-primary">Bulletins</span>
                        </div>
                        <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-primary dark:text-primary-fixed-dim mb-4">Bulletins</h1>
                        <p className="font-body-lg text-body-lg text-on-surface-variant dark:text-on-primary/70 max-w-2xl">
                            Stay updated with the latest announcements, schedules, and community news.
                        </p>
                    </div>

                    <div className="w-full md:w-auto relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-on-primary/50 pointer-events-none">search</span>
                        <input 
                            type="text" 
                            placeholder="Search bulletins..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full md:w-80 pl-10 pr-4 py-3 rounded-lg border border-border-subtle dark:border-primary-container bg-surface dark:bg-primary-container text-on-surface dark:text-on-primary focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-fixed-dim transition-all"
                        />
                    </div>
                </div>

                {paginatedBulletins.length === 0 ? (
                    <div className="py-20 text-center bg-surface dark:bg-primary-container rounded-2xl border border-border-subtle/50 dark:border-primary-container/50">
                        <span className="material-symbols-outlined text-4xl text-on-surface-variant dark:text-on-primary/50 mb-2">article</span>
                        <h3 className="font-headline-sm text-headline-sm text-primary dark:text-on-primary mb-2">No Bulletins Found</h3>
                        <p className="text-on-surface-variant dark:text-on-primary/70">Try adjusting your search criteria.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedBulletins.map(bulletin => (
                            <div key={bulletin.id} className="bg-surface dark:bg-primary-container rounded-2xl p-6 shadow-sm border border-border-subtle/50 dark:border-primary-container/50 flex flex-col group hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="bg-primary-container/10 dark:bg-primary-fixed-dim/10 text-primary-container dark:text-primary-fixed-dim px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                                        {bulletin.category}
                                    </span>
                                    <div className="text-label-sm font-label-sm text-text-muted dark:text-on-primary/50">
                                        {bulletin.date}
                                    </div>
                                </div>
                                
                                <h3 className="text-headline-sm font-headline-sm text-primary dark:text-on-primary mb-3 group-hover:text-[#b45309] dark:group-hover:text-[#d97706] transition-colors">
                                    {bulletin.title}
                                </h3>
                                
                                <p className="text-body-md text-on-surface-variant dark:text-on-primary/80 mb-6 flex-grow">
                                    {bulletin.description}
                                </p>
                                
                                <div className="mt-auto border-t border-border-subtle/50 dark:border-primary-container/50 pt-4 flex justify-between items-center">
                                    <Link className="text-[#b45309] dark:text-[#d97706] font-label-md inline-flex items-center group/link" to={`/buletin/${bulletin.id}`}>
                                        <span className="group-hover/link:underline">Read Full Bulletin</span> 
                                        <span className="material-symbols-outlined text-sm ml-1 group-hover/link:translate-x-1 transition-transform">arrow_right_alt</span>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center mt-12 gap-2">
                        <button 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            className="p-2 rounded-lg border border-border-subtle dark:border-primary-container disabled:opacity-50 hover:bg-surface dark:hover:bg-primary-container transition-colors"
                        >
                            <span className="material-symbols-outlined text-on-surface dark:text-on-primary">chevron_left</span>
                        </button>
                        
                        {Array.from({ length: totalPages }).map((_, idx) => {
                            const page = idx + 1;
                            const isActive = page === currentPage;
                            return (
                                <button 
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-10 h-10 rounded-lg font-label-md flex items-center justify-center transition-colors ${isActive ? 'bg-primary dark:bg-primary-fixed-dim text-white dark:text-primary' : 'border border-border-subtle dark:border-primary-container hover:bg-surface dark:hover:bg-primary-container text-on-surface dark:text-on-primary'}`}
                                >
                                    {page}
                                </button>
                            );
                        })}

                        <button 
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            className="p-2 rounded-lg border border-border-subtle dark:border-primary-container disabled:opacity-50 hover:bg-surface dark:hover:bg-primary-container transition-colors"
                        >
                            <span className="material-symbols-outlined text-on-surface dark:text-on-primary">chevron_right</span>
                        </button>
                    </div>
                )}
            </main>

            <Footer setActiveTab={setActiveTab} />
        </div>
    );
}
