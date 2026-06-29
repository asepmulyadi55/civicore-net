import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TopNavBar from '../components/TopNavBar';
import Footer from '../components/Footer';

export const MOCK_PROPERTIES = [
    {
        id: '1',
        title: 'The Emerald Villa',
        price: '$2,450,000',
        type: 'sell',
        type_label: 'New Launch',
        bedrooms: 4,
        bathrooms: 3.5,
        area: 4200,
        image_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
        images: [
            'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
            'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80',
            'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80'
        ],
        description: 'Experience unparalleled luxury in this contemporary masterpiece. Featuring soaring ceilings, panoramic floor-to-ceiling windows, and premium finishes throughout.'
    },
    {
        id: '2',
        title: 'Modern Townhouse',
        price: '$850,000',
        type: 'sell',
        type_label: 'For Sale',
        bedrooms: 3,
        bathrooms: 2.5,
        area: 2100,
        image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
        images: [
            'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
            'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80',
            'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80'
        ],
        description: 'A beautiful modern townhouse with great community access.'
    },
    {
        id: '3',
        title: 'Garden Apartment',
        price: '$3,500/mo',
        type: 'rent',
        type_label: 'For Rent',
        bedrooms: 2,
        bathrooms: 2,
        area: 1200,
        image_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
        images: [
            'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
            'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80',
            'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80'
        ],
        description: 'Enjoy the view of the central garden from your balcony.'
    },
    {
        id: '4',
        title: 'Penthouse Suite',
        price: '$2,500,000',
        type: 'sell',
        type_label: 'For Sale',
        bedrooms: 4,
        bathrooms: 4,
        area: 4500,
        image_url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
        images: [
            'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
            'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
            'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80'
        ],
        description: 'Luxury penthouse living at its finest.'
    },
    {
        id: '5',
        title: 'Cozy Studio',
        price: '$1,200/mo',
        type: 'rent',
        type_label: 'For Rent',
        bedrooms: 1,
        bathrooms: 1,
        area: 600,
        image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
        images: [
            'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
            'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
            'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80'
        ],
        description: 'Perfect for young professionals.'
    },
    {
        id: '6',
        title: 'Family Home',
        price: '$950,000',
        type: 'sell',
        type_label: 'For Sale',
        bedrooms: 4,
        bathrooms: 3,
        area: 2800,
        image_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
        images: [
            'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
            'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80',
            'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80'
        ],
        description: 'Spacious family home with a large backyard.'
    }
];

export default function PropertyPage() {
    const [isDark, setIsDark] = useState(() => {
        try { return localStorage.getItem('homepageDark') === 'true'; } catch { return false; }
    });

    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('');

    useEffect(() => {
        window.scrollTo(0, 0);
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

    const filteredProperties = MOCK_PROPERTIES.filter(property => {
        const matchesFilter = filter === 'all' || property.type === filter;
        const matchesSearch = property.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              property.type_label.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="bg-surface-container-lowest dark:bg-primary text-on-surface dark:text-on-primary font-body-md antialiased transition-colors duration-300 min-h-screen flex flex-col">
            <TopNavBar activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} toggleDark={toggleDark} />

            <main className="flex-grow pt-24 pb-section-gap max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-desktop">
                {/* Header & Breadcrumb */}
                <div className="mb-12">
                    <div className="flex items-center space-x-2 text-text-muted font-label-sm text-label-sm mb-4">
                        <Link className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors" to="/">Home</Link>
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
                        {['all', 'sell', 'rent'].map(f => (
                            <button 
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-full font-label-md text-label-md transition-colors whitespace-nowrap ${
                                    filter === f 
                                    ? 'bg-primary text-on-primary dark:bg-primary-fixed-dim dark:text-primary' 
                                    : 'bg-surface dark:bg-primary-container text-on-surface dark:text-on-primary border border-border-subtle dark:border-primary-container/50 hover:bg-surface-variant dark:hover:bg-primary-container'
                                }`}
                            >
                                {f === 'all' ? 'All Properties' : f === 'sell' ? 'For Sale' : 'For Rent'}
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
                                    <img alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={property.image_url} />
                                    <div className={`absolute top-4 left-4 text-white px-3 py-1 rounded text-label-sm font-bold uppercase ${property.type === 'sell' ? 'bg-[#b45309]' : 'bg-[#15803d]'}`}>
                                        {property.type_label}
                                    </div>
                                </div>
                                <div className="p-6 flex flex-col flex-grow">
                                    <h3 className="text-headline-sm font-headline-sm text-primary dark:text-on-primary mb-2">{property.title}</h3>
                                    <p className="text-display-lg-mobile text-[#b45309] dark:text-[#d97706] mb-4">{property.price}</p>
                                    <div className="flex gap-4 text-text-muted dark:text-on-primary/70 mb-6 border-t border-border-subtle dark:border-primary-container/50 pt-4">
                                        <div className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">bed</span> {property.bedrooms} Beds</div>
                                        <div className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">shower</span> {property.bathrooms} Baths</div>
                                        <div className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">square_foot</span> {property.area} sqft</div>
                                    </div>
                                    <Link to={`/property/${property.id}`} className="mt-auto w-full block text-center py-3 border-2 border-primary dark:border-primary-fixed-dim text-primary dark:text-primary-fixed-dim rounded-lg hover:bg-primary hover:text-white dark:hover:bg-primary-fixed-dim dark:hover:text-primary transition-colors font-label-md">
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
