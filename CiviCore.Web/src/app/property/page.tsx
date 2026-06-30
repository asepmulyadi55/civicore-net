"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import TopNavBar from '@/components/TopNavBar';
import Footer from '@/components/Footer';

export default function PropertyPage() {
    const [isDark, setIsDark] = useState(() => {
        try { return localStorage.getItem('homepageDark') === 'true'; } catch { return false; }
    });

    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('');
    const [properties, setProperties] = useState<any[]>([]);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetch('/api/property')
            .then(res => res.json())
            .then(res => {
                if(res.data) setProperties(res.data);
            })
            .catch(console.error);
    }, []);

    useEffect(() => {
        const html = document.documentElement;
        if (isDark) {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
    }, [isDark]);

    const toggleDark = () => {
        setIsDark(prev => {
            const next = !prev;
            try { localStorage.setItem('homepageDark', String(next)); } catch {}
            return next;
        });
    };

    const filteredProperties = properties.filter(property => {
        const matchesFilter = filter === 'all' || property.status === filter;
        const matchesSearch = property.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (property.location || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="bg-surface-container-lowest dark:bg-primary text-on-surface dark:text-on-primary font-body-md antialiased transition-colors duration-300 min-h-screen flex flex-col">
            <TopNavBar activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} toggleDark={toggleDark} />

            <main className="flex-grow pt-24 pb-section-gap max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-desktop">
                {/* Header & Breadcrumb */}
                <div className="mb-12">
                    <div className="flex items-center space-x-2 text-text-muted font-label-sm text-label-sm mb-4">
                        <Link className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors" href="/">Home</Link>
                        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                        <span className="text-on-surface dark:text-on-primary">Properties</span>
                    </div>
                    <h1 className="font-display-md-mobile text-display-md-mobile md:font-display-md md:text-display-md text-primary dark:text-primary-fixed-dim">
                        Available Properties
                    </h1>
                </div>

                {/* Filter and Search */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                        {['all', 'available', 'rented', 'sold'].map(f => (
                            <button 
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-full font-label-md text-label-md transition-colors whitespace-nowrap ${
                                    filter === f 
                                    ? 'bg-primary text-on-primary dark:bg-primary-fixed-dim dark:text-primary' 
                                    : 'bg-surface dark:bg-primary-container text-on-surface dark:text-on-primary border border-border-subtle dark:border-primary-container/50 hover:bg-surface-variant dark:hover:bg-primary-container'
                                }`}
                            >
                                {f === 'all' ? 'All Properties' : f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full md:w-64">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">search</span>
                        <input 
                            type="text" 
                            placeholder="Search properties..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg bg-surface dark:bg-primary-container border border-border-subtle dark:border-primary-container/50 text-on-surface dark:text-on-primary placeholder:text-text-muted focus:outline-none focus:border-primary dark:focus:border-primary-fixed-dim"
                        />
                    </div>
                </div>

                {/* Grid */}
                {filteredProperties.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProperties.map(property => (
                            <div key={property.id} className="bg-surface dark:bg-primary-container rounded-2xl shadow-sm border border-border-subtle/50 dark:border-primary-container/50 overflow-hidden flex flex-col group">
                                <div className="h-56 overflow-hidden relative">
                                    <img alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={property.thumbnail_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgQjp1zRS5bEW5kyJnCdZ1pKGLloPZ3aw2373P7YoJQxR38ckj8iywKwVpF_nfQx4Au2Pz06PyEa2J6icsa32JDPt89qDrrHUAgT8vrKg7v8uPHFMdQxiA_FQYzphaZlRonLb8CCp2GShtlfCPZgN3XvnCw3SgU_6a3cWY87CrCwnMHBFbgalIS-_U1l1WYLifoKpzrqiVFNudotHA7dWlTuGTlKnH8kl3CxjZk5nKDLy_ErWLfM8D79Ub5FFHIGLRaZddPTLri7c'} />
                                    <div className={`absolute top-4 left-4 text-white px-3 py-1 rounded text-label-sm font-bold uppercase ${property.status === 'available' ? 'bg-[#b45309]' : 'bg-[#15803d]'}`}>
                                        {property.status || property.type}
                                    </div>
                                </div>
                                <div className="p-6 flex flex-col flex-grow">
                                    <h3 className="text-headline-sm font-headline-sm text-primary dark:text-on-primary mb-2 line-clamp-1">{property.title}</h3>
                                    <p className="text-display-lg-mobile text-[#b45309] dark:text-[#d97706] mb-4">${property.price?.toLocaleString()}</p>
                                    <div className="flex flex-wrap gap-4 text-text-muted dark:text-on-primary/70 mb-6 border-t border-border-subtle dark:border-primary-container/50 pt-4">
                                        {property.bedrooms !== undefined && <div className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">bed</span> {property.bedrooms} Beds</div>}
                                        {property.bathrooms !== undefined && <div className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">shower</span> {property.bathrooms} Baths</div>}
                                        {property.landArea !== undefined && <div className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">square_foot</span> {property.landArea} sqft</div>}
                                        {property.location && <div className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">location_on</span> {property.location}</div>}
                                        {property.type && <div className="flex items-center gap-1 capitalize"><span className="material-symbols-outlined text-sm">home</span> {property.type}</div>}
                                    </div>
                                    <Link href={`/property/${property.id}`} className="mt-auto w-full block text-center py-3 border-2 border-primary dark:border-primary-fixed-dim text-primary dark:text-primary-fixed-dim rounded-lg hover:bg-primary hover:text-white dark:hover:bg-primary-fixed-dim dark:hover:text-primary transition-colors font-label-md">
                                        View Details
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <span className="material-symbols-outlined text-6xl text-text-muted mb-4">search_off</span>
                        <h3 className="text-headline-md font-headline-md text-primary dark:text-on-primary mb-2">No properties found</h3>
                        <p className="text-body-md text-text-muted dark:text-on-primary/70">Try adjusting your filters or search query.</p>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
