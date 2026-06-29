import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import TopNavBar from '../components/TopNavBar';
import Footer from '../components/Footer';
import { MOCK_PROPERTIES } from './PropertyPage';

export default function PropertyDetailPage() {
    const { id } = useParams();
    const [isDark, setIsDark] = useState(() => {
        try { return localStorage.getItem('homepageDark') === 'true'; } catch { return false; }
    });
    const [activeTab, setActiveTab] = useState('');

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

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

    const property = MOCK_PROPERTIES.find(p => p.id === id) || MOCK_PROPERTIES[0];

    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const openGallery = (index: number = 0) => {
        setCurrentImageIndex(index);
        setIsGalleryOpen(true);
    };
    
    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
    };
    
    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
    };
    return (
        <div className="bg-surface-container-lowest dark:bg-primary text-on-surface dark:text-on-primary font-body-md antialiased transition-colors duration-300 min-h-screen flex flex-col">
            <TopNavBar activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} toggleDark={toggleDark} />

            <main className="flex-grow pt-24 pb-section-gap max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop w-full">
                {/* Breadcrumb & Title */}
                <div className="mb-8 mt-4">
                    <div className="flex items-center space-x-2 text-text-muted dark:text-on-primary/70 font-label-sm text-label-sm mb-4">
                        <Link className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors" to="/property">Properties</Link>
                        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                        <span className="text-on-surface dark:text-on-primary">{property.title}</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed dark:bg-primary-fixed-dim dark:text-primary font-label-sm text-label-sm">
                                    <span className="material-symbols-outlined text-[14px] mr-1">fiber_new</span> {property.type_label}
                                </span>
                            </div>
                            <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-primary dark:text-primary-fixed-dim mb-2">{property.title}</h1>
                            <p className="flex items-center text-text-muted dark:text-on-primary/70 font-body-md text-body-md">
                                <span className="material-symbols-outlined mr-2">location_on</span>
                                Dwipapuri Estate
                            </p>
                        </div>
                        <div className="text-left md:text-right">
                            <p className="font-headline-md text-headline-md text-[#b45309] dark:text-[#d97706]">{property.price}</p>
                            {property.type === 'sell' && (
                                <p className="text-text-muted dark:text-on-primary/70 font-label-sm text-label-sm mt-1">Est. Mortgage: $11,500/mo</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile Gallery Carousel */}
                <div className="md:hidden flex overflow-x-auto snap-x snap-mandatory rounded-2xl h-[40vh] mb-8" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <style>{`
                        .md\\:hidden::-webkit-scrollbar { display: none; }
                    `}</style>
                    {property.images.map((img, i) => (
                        <div key={i} className="min-w-full h-full snap-center relative cursor-pointer" onClick={() => openGallery(i)}>
                            <img src={img} className="w-full h-full object-cover" alt={`${property.title} - ${i + 1}`} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 pointer-events-none"></div>
                            <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white font-label-sm text-xs pointer-events-none flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">photo_library</span>
                                {i + 1} / {property.images.length}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Hero Gallery (Bento Grid) - Desktop Only */}
                <div className="hidden md:grid md:grid-cols-4 gap-4 mb-16 h-[50vh] lg:h-[70vh]">
                    {/* Main Featured Image */}
                    <div className="md:col-span-3 md:row-span-2 relative rounded-2xl overflow-hidden group shadow-sm border border-border-subtle/50 dark:border-primary-container/50">
                        <img alt={property.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src={property.images[0]} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60"></div>
                    </div>
                    {/* Side Images */}
                    {property.images[1] && (
                        <div className="hidden md:block relative rounded-2xl overflow-hidden group shadow-sm border border-border-subtle/50 dark:border-primary-container/50">
                            <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src={property.images[1]} />
                        </div>
                    )}
                    {property.images[2] && (
                        <div onClick={() => openGallery(0)} className="hidden md:block relative rounded-2xl overflow-hidden group shadow-sm border border-border-subtle/50 dark:border-primary-container/50 block cursor-pointer">
                            <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src={property.images[2]} />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <span className="bg-black/60 dark:bg-black/80 backdrop-blur-md px-4 py-2 rounded-lg text-white font-label-md">Explore Gallery</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Two Column Layout: Details & Form */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Details (8 cols) */}
                    <div className="lg:col-span-8 space-y-12">
                        {/* Quick Specs Glass Card */}
                        <div className="bg-surface dark:bg-primary-container rounded-2xl p-6 flex flex-wrap justify-between items-center gap-6 shadow-sm border border-border-subtle/50 dark:border-primary-container/50 relative overflow-hidden">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-primary-container/10 dark:bg-primary-fixed-dim/10 flex items-center justify-center text-primary dark:text-primary-fixed-dim">
                                    <span className="material-symbols-outlined">bed</span>
                                </div>
                                <div>
                                    <p className="text-text-muted dark:text-on-primary/70 font-label-sm text-label-sm">Bedrooms</p>
                                    <p className="font-headline-sm text-headline-sm text-on-surface dark:text-on-primary">{property.bedrooms}</p>
                                </div>
                            </div>
                            <div className="w-px h-12 bg-border-subtle dark:bg-primary-container/50 hidden sm:block"></div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-primary-container/10 dark:bg-primary-fixed-dim/10 flex items-center justify-center text-primary dark:text-primary-fixed-dim">
                                    <span className="material-symbols-outlined">bathtub</span>
                                </div>
                                <div>
                                    <p className="text-text-muted dark:text-on-primary/70 font-label-sm text-label-sm">Bathrooms</p>
                                    <p className="font-headline-sm text-headline-sm text-on-surface dark:text-on-primary">{property.bathrooms}</p>
                                </div>
                            </div>
                            <div className="w-px h-12 bg-border-subtle dark:bg-primary-container/50 hidden sm:block"></div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-primary-container/10 dark:bg-primary-fixed-dim/10 flex items-center justify-center text-primary dark:text-primary-fixed-dim">
                                    <span className="material-symbols-outlined">square_foot</span>
                                </div>
                                <div>
                                    <p className="text-text-muted dark:text-on-primary/70 font-label-sm text-label-sm">Living Area</p>
                                    <p className="font-headline-sm text-headline-sm text-on-surface dark:text-on-primary">{property.area} <span className="text-body-md font-body-md text-text-muted dark:text-on-primary/50">sqft</span></p>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <section>
                            <h2 className="font-headline-md text-headline-md text-primary dark:text-primary-fixed-dim mb-6">About This Property</h2>
                            <div className="prose prose-lg max-w-none text-on-surface-variant dark:text-on-primary/80 font-body-lg text-body-lg leading-relaxed space-y-4">
                                <p>
                                    {property.description}
                                </p>
                                <p>
                                    Upon entry, you are greeted by a soaring double-height foyer that seamlessly transitions into an expansive open-concept living and dining area. Floor-to-ceiling glass panels retract fully, dissolving the boundary between the pristine interior and the lush, meticulously landscaped private garden.
                                </p>
                            </div>
                        </section>

                        <hr className="border-border-subtle dark:border-primary-container/50" />

                        {/* Amenities List */}
                        <section>
                            <h2 className="font-headline-md text-headline-md text-primary dark:text-primary-fixed-dim mb-6">Premium Amenities</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                {/* Amenity Items */}
                                <div className="flex items-center gap-3 p-4 rounded-xl hover:bg-surface-container-low dark:hover:bg-primary-container transition-colors duration-300 border border-transparent hover:border-border-subtle dark:hover:border-primary-container/50">
                                    <span className="material-symbols-outlined text-primary dark:text-primary-fixed-dim">pool</span>
                                    <span className="font-body-md text-body-md text-on-surface dark:text-on-primary">Infinity Lap Pool</span>
                                </div>
                                <div className="flex items-center gap-3 p-4 rounded-xl hover:bg-surface-container-low dark:hover:bg-primary-container transition-colors duration-300 border border-transparent hover:border-border-subtle dark:hover:border-primary-container/50">
                                    <span className="material-symbols-outlined text-primary dark:text-primary-fixed-dim">directions_car</span>
                                    <span className="font-body-md text-body-md text-on-surface dark:text-on-primary">Smart Garage</span>
                                </div>
                                <div className="flex items-center gap-3 p-4 rounded-xl hover:bg-surface-container-low dark:hover:bg-primary-container transition-colors duration-300 border border-transparent hover:border-border-subtle dark:hover:border-primary-container/50">
                                    <span className="material-symbols-outlined text-primary dark:text-primary-fixed-dim">local_florist</span>
                                    <span className="font-body-md text-body-md text-on-surface dark:text-on-primary">Landscaped Garden</span>
                                </div>
                                <div className="flex items-center gap-3 p-4 rounded-xl hover:bg-surface-container-low dark:hover:bg-primary-container transition-colors duration-300 border border-transparent hover:border-border-subtle dark:hover:border-primary-container/50">
                                    <span className="material-symbols-outlined text-primary dark:text-primary-fixed-dim">security</span>
                                    <span className="font-body-md text-body-md text-on-surface dark:text-on-primary">24/7 Estate Security</span>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Sticky Inquiry Form (4 cols) */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-28 bg-surface dark:bg-primary-container rounded-2xl shadow-sm border border-border-subtle/50 dark:border-primary-container/50 p-6 md:p-8">
                            <h3 className="font-headline-sm text-headline-sm text-primary dark:text-on-primary mb-2">Interested in this property?</h3>
                            <p className="text-text-muted dark:text-on-primary/70 font-body-md text-body-md mb-6">Schedule a private viewing or request more details.</p>
                            
                            <form className="space-y-4">
                                <div>
                                    <label className="block font-label-sm text-label-sm text-on-surface dark:text-on-primary/70 mb-1" htmlFor="name">Full Name</label>
                                    <input type="text" id="name" placeholder="John Doe" className="w-full rounded-lg border-border-subtle dark:border-primary-container/50 focus:border-primary dark:focus:border-primary-fixed-dim bg-background dark:bg-primary text-on-surface dark:text-on-primary font-body-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-primary-fixed-dim transition-colors" />
                                </div>
                                <div>
                                    <label className="block font-label-sm text-label-sm text-on-surface dark:text-on-primary/70 mb-1" htmlFor="email">Email Address</label>
                                    <input type="email" id="email" placeholder="john@example.com" className="w-full rounded-lg border-border-subtle dark:border-primary-container/50 focus:border-primary dark:focus:border-primary-fixed-dim bg-background dark:bg-primary text-on-surface dark:text-on-primary font-body-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-primary-fixed-dim transition-colors" />
                                </div>
                                <div>
                                    <label className="block font-label-sm text-label-sm text-on-surface dark:text-on-primary/70 mb-1" htmlFor="phone">Phone Number</label>
                                    <input type="tel" id="phone" placeholder="+1 (555) 000-0000" className="w-full rounded-lg border-border-subtle dark:border-primary-container/50 focus:border-primary dark:focus:border-primary-fixed-dim bg-background dark:bg-primary text-on-surface dark:text-on-primary font-body-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-primary-fixed-dim transition-colors" />
                                </div>
                                <div>
                                    <label className="block font-label-sm text-label-sm text-on-surface dark:text-on-primary/70 mb-1" htmlFor="message">Message</label>
                                    <textarea id="message" placeholder="I would like to schedule a viewing..." rows={3} className="w-full rounded-lg border-border-subtle dark:border-primary-container/50 focus:border-primary dark:focus:border-primary-fixed-dim bg-background dark:bg-primary text-on-surface dark:text-on-primary font-body-md py-2 px-3 resize-none focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-primary-fixed-dim transition-colors"></textarea>
                                </div>
                                
                                <Link to="/schedule-visit" className="w-full bg-[#b45309] hover:bg-[#8b4006] dark:bg-[#d97706] dark:hover:bg-[#b45309] text-white font-label-md text-label-md py-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 mt-4 flex justify-center items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                                    Schedule a Visit
                                </Link>
                                
                                <button type="button" className="w-full bg-transparent border border-border-subtle dark:border-primary-container/50 text-primary dark:text-primary-fixed-dim hover:bg-surface-container-low dark:hover:bg-primary-container font-label-md text-label-md py-3 rounded-lg transition-all duration-300 mt-2">
                                    Request Brochure
                                </button>
                            </form>

                            <div className="mt-6 pt-6 border-t border-border-subtle dark:border-primary-container/50 flex items-center gap-4">
                                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAd10O6kzfY7B-aZVNu3M9Oo0Q-wAibYX561w0waoJEPSAxLZICTcqE7mpoYhcisKosGX2rY4SxW-0gMSssENOcwT9hzCkqPwhG3CLXpYEExSOKEN64-vzIf-FthydLsHtSgWrMz6oktpWoiUetI5EHDdDdq6mxuOcidXKgMpH-qpSpfK0N94NtznAXYmmD7SSS4oRZTQmVHqLLqU0CRtiIbSYaF7HM3j6xVlXIveZ3rCHSstpGNzRDI1Q67_adu6aA4Yq87Xj50uQ" className="w-12 h-12 rounded-full object-cover" alt="Sarah Jenkins" />
                                <div>
                                    <p className="font-label-md text-label-md text-on-surface dark:text-on-primary">Sarah Jenkins</p>
                                    <p className="font-label-sm text-label-sm text-text-muted dark:text-on-primary/50">Senior Property Consultant</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {isGalleryOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm" onClick={() => setIsGalleryOpen(false)}>
                        <button onClick={(e) => { e.stopPropagation(); setIsGalleryOpen(false); }} className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full w-12 h-12 flex items-center justify-center z-50">
                            <span className="material-symbols-outlined text-[28px]">close</span>
                        </button>
                        
                        <div className="relative w-full max-w-6xl px-4 flex items-center justify-center h-full">
                            <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-4 md:left-8 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full w-14 h-14 flex items-center justify-center z-50">
                                <span className="material-symbols-outlined text-[32px]">chevron_left</span>
                            </button>
                            
                            <img src={property.images[currentImageIndex]} alt={property.title} className="max-h-[85vh] max-w-full object-contain shadow-2xl rounded-lg" onClick={(e) => e.stopPropagation()} />
                            
                            <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-4 md:right-8 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full w-14 h-14 flex items-center justify-center z-50">
                                <span className="material-symbols-outlined text-[32px]">chevron_right</span>
                            </button>
                        </div>
                        
                        <div className="absolute bottom-8 left-0 w-full flex justify-center gap-2 px-4 z-50" onClick={(e) => e.stopPropagation()}>
                            {property.images.map((_, idx) => (
                                <button 
                                    key={idx} 
                                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                                    className={`w-3 h-3 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white scale-110' : 'bg-white/30 hover:bg-white/50'}`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
