import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TopNavBar from '../components/TopNavBar';
import Footer from '../components/Footer';

export default function HomePage() {
    const [isDark, setIsDark] = useState(() => {
        try { return localStorage.getItem('homepageDark') === 'true'; } catch { return false; }
    });
    
    // Active Tab State
    const [activeTab, setActiveTab] = useState('home');

    // Scroll spy observer for active tab
    useEffect(() => {
        const sections = document.querySelectorAll('section[id]');
        
        const observerCallback = (entries: any) => {
            entries.forEach((entry: any) => {
                if (entry.isIntersecting) {
                    setActiveTab(entry.target.id);
                }
            });
        };
        
        const observer = new IntersectionObserver(observerCallback, {
            rootMargin: "-20% 0px -70% 0px"
        });
        
        sections.forEach(section => observer.observe(section));
        
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const html = document.documentElement;
        if (isDark) {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
    }, [isDark]);

    // Scroll reveal animation
    useEffect(() => {
        const revealElements = document.querySelectorAll('.reveal');
        
        const revealCallback = (entries: any, observer: any) => {
            entries.forEach((entry: any) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        };
        
        const revealObserver = new IntersectionObserver(revealCallback, {
            threshold: 0.15,
            rootMargin: "0px 0px -50px 0px"
        });
        
        revealElements.forEach(el => revealObserver.observe(el));
        
        return () => {
            revealObserver.disconnect();
        };
    }, []);

    const toggleDark = () => {
        setIsDark(prev => {
            const next = !prev;
            try { localStorage.setItem('homepageDark', String(next)); } catch {}
            return next;
        });
    };

    const navLinks = [
        { id: 'home', label: 'Home', href: '#' },
        { id: 'events', label: 'Events', href: '#events' },
        { id: 'gallery', label: 'Gallery', href: '#gallery' },
        { id: 'bulletins', label: 'Bulletins', href: '#bulletins' },
    ];

    return (
        <div className="bg-surface-container-lowest dark:bg-primary text-on-surface dark:text-on-primary font-body-md antialiased transition-colors duration-300">
            {/* TopNavBar */}
            <TopNavBar activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} toggleDark={toggleDark} />

            <main>
                {/* Hero Section */}
                <section id="home" className="relative h-[80vh] min-h-[600px] flex items-center justify-center mt-20">
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAOH9-wkerT9L_3UHiLus4rfP0iIYILydReiA4c1YgVrKb9FXHlKChiO-5ca6dGMsI3bScitsulEeeBAa_lw9C8Q4nWjpu7yc4Qli__5V6s4A4BwbiAEJPWdLQYGXs5B6jy7mP07iWtYt-kk58IVBMD6UT_fPKNJXu0OfdQuF3MTYxFgQqfc9wgKe2z6M7ZiVfCAsET3eySbL2bJ0xVqP-AYqjtp5UxnEsXHGP54KOr6j-kCwy4_WBKjXksawAKK4MnYkm8Zj2cvhU')" }}>
                        <div className="absolute inset-0 bg-gradient-to-b from-primary/60 via-primary/40 to-surface-container-lowest dark:to-primary"></div>
                    </div>
                    <div className="relative z-10 text-center px-margin-mobile md:px-margin-desktop max-w-4xl mx-auto flex flex-col items-center">
                        <h1 className="text-display-lg-mobile md:text-display-lg font-display-lg text-on-primary mb-6 animate-fade-in-up drop-shadow-lg">
                            Welcome to Dwipapuri Residence
                        </h1>
                        <p className="text-body-lg font-body-lg text-on-primary/90 mb-10 max-w-2xl font-light tracking-wide">
                            Modern Living in Harmony. Experience tranquility and luxury in every detail.
                        </p>
                        <a className="inline-flex items-center justify-center px-8 py-4 bg-[#b45309] text-white font-label-md text-label-md rounded-lg hover:bg-[#8b4006] transition-colors shadow-lg hover:shadow-xl scale-95 active:scale-90" href="#contact">
                            Schedule a Visit
                        </a>
                    </div>
                </section>

                {/* Events Section */}
                <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto" id="events">
                    <div className="flex justify-between items-end mb-12 border-b border-border-subtle dark:border-primary-container pb-4 reveal">
                        <div>
                            <span className="text-label-sm font-label-sm text-[#b45309] dark:text-[#d97706] uppercase tracking-wider block mb-2">Discover More</span>
                            <h2 className="text-headline-md font-headline-md text-primary dark:text-primary-fixed-dim">Events</h2>
                        </div>
                        <Link className="group flex items-center text-label-md font-label-md text-primary dark:text-primary-fixed-dim hover:text-primary-container dark:hover:text-primary-fixed transition-colors" to="/events">
                            View All 
                            <span className="material-symbols-outlined ml-2 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 reveal">
                        <div className="bg-surface dark:bg-primary-container rounded-2xl shadow-sm border border-border-subtle/50 dark:border-primary-container/50 overflow-hidden hover:shadow-md transition-shadow group">
                            <div className="h-48 overflow-hidden relative">
                                <img alt="Event Image" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAcznvVK2f2TkbuY6sy-PZMgOSdo_kRR-2Qfso47BVm7LWAZuEq9UWnQ29d6RFx00Qg50WfrZdaKXGMpYc7s-2TdKkcdEpU8uhurr_cnQDrP4xA1dePRfB-5tW8d9L7p_2pwiEqN4g8QYj9CwS8z3vqv3bK28IQp2aEanu2mz8DgbpGg7yp9QmlTEieQec3U6eiVUMiJLrB_zje7RCZu2bA8ChaOzagFlfLQUc8EbVbnQzRA8KiYgwFYKrIvR91ss3cEqAtrwWkqtQ" />
                                <div className="absolute top-4 left-4 bg-surface-glass backdrop-blur-sm px-3 py-1 rounded text-primary font-bold text-sm">
                                    Aug 15
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className="text-headline-sm font-headline-sm text-primary dark:text-on-primary mb-2">Summer Garden Party</h3>
                                <p className="text-body-md text-text-muted dark:text-on-primary/70 mb-6 flex-grow">Join us for an evening of music, local food, and community connection in the central garden.</p>
                                <div className="mt-auto border-t border-border-subtle/50 dark:border-primary-container/50 pt-4 flex justify-between items-center">
                                    <Link className="text-primary dark:text-primary-fixed-dim font-label-md inline-flex items-center group/link" to="/events/1">
                                        <span className="group-hover/link:underline">View Details</span> 
                                        <span className="material-symbols-outlined text-sm ml-1 group-hover/link:translate-x-1 transition-transform">arrow_right_alt</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                        <div className="bg-surface dark:bg-primary-container rounded-2xl shadow-sm border border-border-subtle/50 dark:border-primary-container/50 overflow-hidden hover:shadow-md transition-shadow group">
                            <div className="h-48 overflow-hidden relative">
                                <img alt="Community Workshop" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="/workshop_event.png" />
                                <div className="absolute top-4 left-4 bg-surface-glass backdrop-blur-sm px-3 py-1 rounded text-primary font-bold text-sm">
                                    Sep 02
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className="text-headline-sm font-headline-sm text-primary dark:text-on-primary mb-2">Community Workshop</h3>
                                <p className="text-body-md text-text-muted dark:text-on-primary/70 mb-6 flex-grow">Learn sustainable gardening practices from local experts in our monthly green living series.</p>
                                <div className="mt-auto border-t border-border-subtle/50 dark:border-primary-container/50 pt-4 flex justify-between items-center">
                                    <Link className="text-primary dark:text-primary-fixed-dim font-label-md inline-flex items-center group/link" to="/events/2">
                                        <span className="group-hover/link:underline">View Details</span> 
                                        <span className="material-symbols-outlined text-sm ml-1 group-hover/link:translate-x-1 transition-transform">arrow_right_alt</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                        <div className="bg-surface dark:bg-primary-container rounded-2xl shadow-sm border border-border-subtle/50 dark:border-primary-container/50 overflow-hidden hover:shadow-md transition-shadow group">
                            <div className="h-48 overflow-hidden relative">
                                <img alt="Acoustic Evening" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="/acoustic_event.png" />
                                <div className="absolute top-4 left-4 bg-surface-glass backdrop-blur-sm px-3 py-1 rounded text-primary font-bold text-sm">
                                    Sep 20
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className="text-headline-sm font-headline-sm text-primary dark:text-on-primary mb-2">Acoustic Evening</h3>
                                <p className="text-body-md text-text-muted dark:text-on-primary/70 mb-6 flex-grow">Unwind with live acoustic music by the clubhouse pool. Bring your own picnic blankets!</p>
                                <div className="mt-auto border-t border-border-subtle/50 dark:border-primary-container/50 pt-4 flex justify-between items-center">
                                    <Link className="text-primary dark:text-primary-fixed-dim font-label-md inline-flex items-center group/link" to="/events/3">
                                        <span className="group-hover/link:underline">View Details</span> 
                                        <span className="material-symbols-outlined text-sm ml-1 group-hover/link:translate-x-1 transition-transform">arrow_right_alt</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Gallery Section */}
                <section className="py-section-gap bg-surface-container-low dark:bg-primary-container/20 px-margin-mobile md:px-margin-desktop" id="gallery">
                    <div className="max-w-container-max mx-auto">
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 reveal">
                            <div>
                                <span className="text-label-sm font-label-sm text-[#b45309] dark:text-[#d97706] uppercase tracking-wider block mb-2">Visual Tour</span>
                                <h2 className="text-headline-md font-headline-md text-primary dark:text-primary-fixed-dim">Gallery</h2>
                            </div>
                            <a className="inline-flex items-center gap-2 font-label-md text-label-md text-primary dark:text-primary-fixed-dim hover:text-primary-container dark:hover:text-primary-fixed transition-colors mt-4 md:mt-0 group" href="#">
                                View All
                                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </a>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-auto md:h-[600px]">
                            <div className="rounded-2xl overflow-hidden relative group reveal shadow-sm border border-border-subtle/50 dark:border-primary-container/50 h-[400px] md:h-full">
                                <div className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD55aFz8NDn0tXi_fzmIam_RZaFwDhAczD1L4kTGDx3sbMlR0oF0fEJB5qFaP04Btkcj6aHz6QlpxgzjIYCilYWKVHAUZys336usIkE5SzFmXdvI3NvErNZ0g2TMOrUu1c-4tth-d3jBfcLR85PhiVZ-By3Hj2sgF0VsRp1fP7NyU97aIp0YyjjBQkx4-gGQIjtxX_CFAevCygShudFFGofPbQX20yTk7WXTZJxCtg4SvhN88iP29cXUKzOB9OXHuNDpxl0_s61314')" }}></div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="absolute bottom-0 left-0 p-8 w-full translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                    <h3 className="font-headline-sm text-headline-sm text-white">Clubhouse</h3>
                                </div>
                            </div>
                            <div className="grid grid-rows-2 gap-6 h-[600px] md:h-full">
                                <div className="rounded-2xl overflow-hidden relative group reveal shadow-sm border border-border-subtle/50 dark:border-primary-container/50" style={{ transitionDelay: '0.1s' }}>
                                    <div className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDqmJbXJfWPbdc2pd8BtFwTYl1KGyL-YtzdJWtn6C-PLLYeGND0o9idmDEkCLCNadXGgEk1D4fczrphhSJwrRdQFTxhjEbSgye3NmOeVIuhT_QKw2fGu1lpXSl9gMn2R9scg5z09MOxMCxYoOf7LkuNdi34YzT6Q_VfZ3fAk7YiLbqlQlkcyb2qZoN9Be7w8EFfFiF5sZZCo46zPenk5RHo29Pk2H9rHqSZhvXUM0t5VHWRyzss9ONZBqgL1jCs8vK7MrpVHPNY1Og')" }}></div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="absolute bottom-0 left-0 p-6 w-full translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                        <h3 className="font-headline-sm text-headline-sm text-white">Aerial View</h3>
                                    </div>
                                </div>
                                <div className="rounded-2xl overflow-hidden relative group reveal shadow-sm border border-border-subtle/50 dark:border-primary-container/50" style={{ transitionDelay: '0.2s' }}>
                                    <div className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAcYSxDLk_010u5mOyR_cijkXwWyIyptM-8yp5_4RAe6ZRQtodAbNSdHc80FooCWs9ykxeHdHLmLfIjpcGeZ-OXAN1f6bMyV0rpLYvBVnRktdK_B8EOFmp6JryCf9e7giLDFQGO5heJirDMTp6yQh2Q6umMQkmduc12_7S2HsFcPWX8wuAdf1GCtzCWfmn9P7XiZbVNUINPPQ5Z2c70y9eKeijUWwn-bFTTd2AI-P9MXrgXBehO0bMFqxGV4tLwuzGrD7GdGWcXw-w')" }}></div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="absolute bottom-0 left-0 p-6 w-full translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                        <h3 className="font-headline-sm text-headline-sm text-white">Pool Area</h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Bulletins Section */}
                <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto" id="bulletins">
                    <div className="flex justify-between items-end mb-12 border-b border-border-subtle dark:border-primary-container pb-4 reveal">
                        <div>
                            <span className="text-label-sm font-label-sm text-[#b45309] dark:text-[#d97706] uppercase tracking-wider block mb-2">Informasi</span>
                            <h2 className="text-headline-md font-headline-md text-primary dark:text-primary-fixed-dim">Buletin</h2>
                        </div>
                        <a className="group flex items-center text-label-md font-label-md text-primary dark:text-primary-fixed-dim hover:text-primary-container dark:hover:text-primary-fixed transition-colors" href="#">
                            View All 
                            <span className="material-symbols-outlined ml-2 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </a>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 reveal">
                        <div className="bg-surface dark:bg-primary-container rounded-2xl p-6 shadow-sm border border-border-subtle/50 dark:border-primary-container/50">
                            <div className="text-label-sm text-text-muted dark:text-on-primary/50 mb-2">October 12, 2026</div>
                            <h3 className="text-headline-sm font-headline-sm text-primary dark:text-on-primary mb-3">Monthly Security Update</h3>
                            <p className="text-body-md text-on-surface-variant dark:text-on-primary/80 mb-4">A brief overview of the new gate access protocols and updated patrol schedules for this month.</p>
                            <a className="text-[#b45309] dark:text-[#d97706] font-label-md hover:underline" href="#">Read Full Bulletin</a>
                        </div>
                        <div className="bg-surface dark:bg-primary-container rounded-2xl p-6 shadow-sm border border-border-subtle/50 dark:border-primary-container/50">
                            <div className="text-label-sm text-text-muted dark:text-on-primary/50 mb-2">September 28, 2026</div>
                            <h3 className="text-headline-sm font-headline-sm text-primary dark:text-on-primary mb-3">Landscaping Schedule</h3>
                            <p className="text-body-md text-on-surface-variant dark:text-on-primary/80 mb-4">Details on the upcoming seasonal planting and maintenance work across common areas.</p>
                            <a className="text-[#b45309] dark:text-[#d97706] font-label-md hover:underline" href="#">Read Full Bulletin</a>
                        </div>
                        <div className="bg-surface dark:bg-primary-container rounded-2xl p-6 shadow-sm border border-border-subtle/50 dark:border-primary-container/50">
                            <div className="text-label-sm text-text-muted dark:text-on-primary/50 mb-2">September 15, 2026</div>
                            <h3 className="text-headline-sm font-headline-sm text-primary dark:text-on-primary mb-3">Community Board Nominations</h3>
                            <p className="text-body-md text-on-surface-variant dark:text-on-primary/80 mb-4">Call for nominations for the upcoming HOA board elections. Submit your candidates by Oct 1st.</p>
                            <a className="text-[#b45309] dark:text-[#d97706] font-label-md hover:underline" href="#">Read Full Bulletin</a>
                        </div>
                    </div>
                </section>

                {/* Available Properties Section */}
                <section className="py-section-gap bg-surface-container-low dark:bg-primary-container/20 px-margin-mobile md:px-margin-desktop" id="properties">
                    <div className="max-w-container-max mx-auto">
                        <div className="flex justify-between items-end mb-12 border-b border-border-subtle dark:border-primary-container pb-4 reveal">
                            <div>
                                <span className="text-label-sm font-label-sm text-[#b45309] dark:text-[#d97706] uppercase tracking-wider block mb-2">Find Your Home</span>
                                <h2 className="text-headline-md font-headline-md text-primary dark:text-primary-fixed-dim">Available Properties</h2>
                            </div>
                            <a className="group flex items-center text-label-md font-label-md text-primary dark:text-primary-fixed-dim hover:text-primary-container dark:hover:text-primary-fixed transition-colors" href="#">
                                View All
                                <span className="material-symbols-outlined ml-2 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </a>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 reveal">
                            {/* Property 1 */}
                            <div className="bg-surface dark:bg-primary-container rounded-2xl shadow-sm border border-border-subtle/50 dark:border-primary-container/50 overflow-hidden flex flex-col group">
                                <div className="h-56 overflow-hidden relative">
                                    <img alt="Luxury Villa" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBgQjp1zRS5bEW5kyJnCdZ1pKGLloPZ3aw2373P7YoJQxR38ckj8iywKwVpF_nfQx4Au2Pz06PyEa2J6icsa32JDPt89qDrrHUAgT8vrKg7v8uPHFMdQxiA_FQYzphaZlRonLb8CCp2GShtlfCPZgN3XvnCw3SgU_6a3cWY87CrCwnMHBFbgalIS-_U1l1WYLifoKpzrqiVFNudotHA7dWlTuGTlKnH8kl3CxjZk5nKDLy_ErWLfM8D79Ub5FFHIGLRaZddPTLri7c" />
                                    <div className="absolute top-4 left-4 bg-[#b45309] text-white px-3 py-1 rounded text-label-sm font-bold uppercase">
                                        For Sale
                                    </div>
                                </div>
                                <div className="p-6 flex flex-col flex-grow">
                                    <h3 className="text-headline-sm font-headline-sm text-primary dark:text-on-primary mb-2">The Emerald Villa</h3>
                                    <p className="text-display-lg-mobile text-[#b45309] dark:text-[#d97706] mb-4">$1,250,000</p>
                                    <div className="flex gap-4 text-text-muted dark:text-on-primary/70 mb-6 border-t border-border-subtle dark:border-primary-container/50 pt-4">
                                        <div className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">bed</span> 4 Beds</div>
                                        <div className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">shower</span> 3.5 Baths</div>
                                        <div className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">square_foot</span> 3,200 sqft</div>
                                    </div>
                                    <button className="mt-auto w-full py-3 border-2 border-primary dark:border-primary-fixed-dim text-primary dark:text-primary-fixed-dim rounded-lg hover:bg-primary hover:text-white dark:hover:bg-primary-fixed-dim dark:hover:text-primary transition-colors font-label-md">View Details</button>
                                </div>
                            </div>
                            {/* Property 2 */}
                            <div className="bg-surface dark:bg-primary-container rounded-2xl shadow-sm border border-border-subtle/50 dark:border-primary-container/50 overflow-hidden flex flex-col group">
                                <div className="h-56 overflow-hidden relative">
                                    <img alt="Modern Townhouse" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCrbFAnIsIz8UdqhMnjmlduWj1jsfnfBFymuK9YHBflcc5AaopwrNda-IQgc2FRFLtzuJIZzuhZ_oVDd_o0fN7NpZdJmNyfnR--asSVO_97yCwnTN0pMNyeydM3nPlmr1XzY3VS7mQdIMz4csWVZVmpbSCwArAB8ACcDwjz766z8z6qyo1m4-P7_TvkZWNoLT8ka4RKIg7p6U3i9EgsojfZKraLrv5bWkMMtl7K-KEFGnI0-UETCnGr-ua9_yd9jEb5ExMACEpb_cE" />
                                    <div className="absolute top-4 left-4 bg-[#b45309] text-white px-3 py-1 rounded text-label-sm font-bold uppercase">
                                        For Sale
                                    </div>
                                </div>
                                <div className="p-6 flex flex-col flex-grow">
                                    <h3 className="text-headline-sm font-headline-sm text-primary dark:text-on-primary mb-2">Modern Townhouse</h3>
                                    <p className="text-display-lg-mobile text-[#b45309] dark:text-[#d97706] mb-4">$850,000</p>
                                    <div className="flex gap-4 text-text-muted dark:text-on-primary/70 mb-6 border-t border-border-subtle dark:border-primary-container/50 pt-4">
                                        <div className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">bed</span> 3 Beds</div>
                                        <div className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">shower</span> 2.5 Baths</div>
                                        <div className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">square_foot</span> 2,100 sqft</div>
                                    </div>
                                    <button className="mt-auto w-full py-3 border-2 border-primary dark:border-primary-fixed-dim text-primary dark:text-primary-fixed-dim rounded-lg hover:bg-primary hover:text-white dark:hover:bg-primary-fixed-dim dark:hover:text-primary transition-colors font-label-md">View Details</button>
                                </div>
                            </div>
                            {/* Property 3 */}
                            <div className="bg-surface dark:bg-primary-container rounded-2xl shadow-sm border border-border-subtle/50 dark:border-primary-container/50 overflow-hidden flex flex-col group">
                                <div className="h-56 overflow-hidden relative">
                                    <img alt="Garden Apartment" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDB4RNuKDKy-TEmLeQZVcU27TbdNm9QEIiFT9FoPv2g75HNcUupN-xKMy5_vJfswxXj8yPMH7UxSWBGrmRR4t19RdY0SD66hfqYm_u1xrSx-RZ93Cn6IRKrM55xMs63V0NxqBWevUoSCZP2V4wmSOfzQe_oLpyO6k1kgqjxvScgozchHCd0WfKXRwimA0TUuXlMCf82XOM2CNRBZSFDQxsExDtX20cx5-jGw_SEocYzqLz51us9SfFwVdbjgkN8G3ISg2_2kKVQqvY" />
                                    <div className="absolute top-4 left-4 bg-primary dark:bg-primary-fixed-dim text-white dark:text-primary px-3 py-1 rounded text-label-sm font-bold uppercase">
                                        For Rent
                                    </div>
                                </div>
                                <div className="p-6 flex flex-col flex-grow">
                                    <h3 className="text-headline-sm font-headline-sm text-primary dark:text-on-primary mb-2">Garden Apartment</h3>
                                    <p className="text-display-lg-mobile text-[#b45309] dark:text-[#d97706] mb-4">$4,200 <span className="text-body-md text-text-muted dark:text-on-primary/70">/mo</span></p>
                                    <div className="flex gap-4 text-text-muted dark:text-on-primary/70 mb-6 border-t border-border-subtle dark:border-primary-container/50 pt-4">
                                        <div className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">bed</span> 2 Beds</div>
                                        <div className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">shower</span> 2 Baths</div>
                                        <div className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">square_foot</span> 1,400 sqft</div>
                                    </div>
                                    <button className="mt-auto w-full py-3 border-2 border-primary dark:border-primary-fixed-dim text-primary dark:text-primary-fixed-dim rounded-lg hover:bg-primary hover:text-white dark:hover:bg-primary-fixed-dim dark:hover:text-primary transition-colors font-label-md">View Details</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <Footer setActiveTab={setActiveTab} />
        </div>
    );
}
