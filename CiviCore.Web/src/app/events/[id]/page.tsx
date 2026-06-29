"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import TopNavBar from '@/components/TopNavBar';
import Footer from '@/components/Footer';
import { MOCK_EVENTS } from '../page';

export default function EventDetailPage() {
    const { id } = useParams();
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

    const [guests, setGuests] = useState('1 (Just me)');
    const [isGuestsOpen, setIsGuestsOpen] = useState(false);

    useEffect(() => { window.scrollTo(0, 0); }, [id]);

    const event = MOCK_EVENTS.find(e => e.id === id);

    if (!event) {
        return (
            <div className="bg-surface-container-lowest dark:bg-primary text-on-surface dark:text-on-primary font-body-md antialiased min-h-screen flex flex-col">
                <TopNavBar activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} toggleDark={toggleDark} />
                <main className="flex-grow pt-32 text-center">
                    <h1 className="text-display-lg text-primary dark:text-primary-fixed-dim mb-4">Event Not Found</h1>
                    <Link href="/events" className="text-[#b45309] hover:underline">Back to Events</Link>
                </main>
                <Footer setActiveTab={setActiveTab} />
            </div>
        );
    }

    const eventDate = event.date ? new Date(event.date + 'T00:00:00') : new Date();
    const formattedDate = eventDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const isPast = (event.status !== 'ongoing') && !!event.date && event.date < new Date().toISOString().slice(0, 10);

    return (
        <div className="bg-surface-container-lowest dark:bg-primary text-on-surface dark:text-on-primary font-body-md antialiased transition-colors duration-300 min-h-screen flex flex-col">
            <TopNavBar activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} toggleDark={toggleDark} />

            <main className="flex-grow pt-20">
                {/* Hero Image Section */}
                <section className="relative w-full h-[60vh] md:h-[70vh] max-h-[800px] overflow-hidden">
                    <div className="absolute inset-0 bg-primary/20 dark:bg-primary/60 z-10 mix-blend-multiply"></div>
                    <img 
                        alt={event.title} 
                        className={`w-full h-full object-cover object-center absolute inset-0 z-0 ${isPast ? 'grayscale opacity-80' : ''}`} 
                        src={event.image_url} 
                    />
                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-surface-container-lowest dark:from-primary to-transparent h-48 z-10"></div>
                </section>

                {/* Event Details Container */}
                <section className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop -mt-32 relative z-20 pb-section-gap">
                    <div className="bg-surface-container-lowest/90 dark:bg-primary-container/90 rounded-2xl shadow-xl shadow-primary-container/5 overflow-visible flex flex-col lg:flex-row border border-border-subtle dark:border-primary-container/50 backdrop-blur-xl">
                        
                        {/* Main Info Column */}
                        <div className="p-8 md:p-12 lg:w-2/3 flex flex-col justify-center">
                            <div className="flex items-center space-x-2 text-text-muted dark:text-on-primary/70 font-label-sm text-label-sm mb-8">
                                <Link className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors" href="/events">Events</Link>
                                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                                <span className="text-on-surface dark:text-on-primary truncate max-w-[200px] sm:max-w-xs">{event.title}</span>
                            </div>

                            <div className="mb-6 flex flex-wrap gap-3">
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary-fixed-dim/20 text-on-primary-fixed dark:text-primary-fixed-dim font-label-sm text-label-sm uppercase tracking-wider">
                                    {event.category} Event
                                </span>
                                {event.status === 'ongoing' ? (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#b45309]/20 text-[#b45309] dark:text-[#f59e0b] font-label-sm text-label-sm uppercase tracking-wider">
                                        Ongoing
                                    </span>
                                ) : isPast ? (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-surface-variant/50 text-on-surface-variant dark:text-on-primary/60 font-label-sm text-label-sm uppercase tracking-wider">
                                        Past Event
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-tertiary-fixed-dim/20 text-on-tertiary-fixed dark:text-tertiary-fixed-dim font-label-sm text-label-sm uppercase tracking-wider">
                                        RSVP Required
                                    </span>
                                )}
                            </div>

                            <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-background dark:text-on-primary mb-4">
                                {event.title}
                            </h1>
                            
                            <p className="font-body-lg text-body-lg text-on-surface-variant dark:text-on-primary/80 mb-8 leading-relaxed">
                                {event.description}
                                {event.id === '1' && " Enjoy an evening of live acoustic music, curated local refreshments, and wonderful company beneath the ancient oaks."}
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                                <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-bright dark:bg-[#002117] border border-border-subtle/50 dark:border-primary-container/50">
                                    <div className="p-3 bg-surface-container dark:bg-primary-container rounded-lg text-primary dark:text-primary-fixed-dim">
                                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
                                    </div>
                                    <div>
                                        <h3 className="font-label-md text-label-md text-on-surface dark:text-on-primary/70 mb-1">Date</h3>
                                        <p className="font-body-md text-body-md text-on-surface-variant dark:text-on-primary">{formattedDate}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-bright dark:bg-[#002117] border border-border-subtle/50 dark:border-primary-container/50">
                                    <div className="p-3 bg-surface-container dark:bg-primary-container rounded-lg text-primary dark:text-primary-fixed-dim">
                                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
                                    </div>
                                    <div>
                                        <h3 className="font-label-md text-label-md text-on-surface dark:text-on-primary/70 mb-1">Time</h3>
                                        <p className="font-body-md text-body-md text-on-surface-variant dark:text-on-primary">4:00 PM - 8:00 PM</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-bright dark:bg-[#002117] border border-border-subtle/50 dark:border-primary-container/50 sm:col-span-2">
                                    <div className="p-3 bg-surface-container dark:bg-primary-container rounded-lg text-primary dark:text-primary-fixed-dim">
                                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                                    </div>
                                    <div>
                                        <h3 className="font-label-md text-label-md text-on-surface dark:text-on-primary/70 mb-1">Location</h3>
                                        <p className="font-body-md text-body-md text-on-surface-variant dark:text-on-primary">Dwipapuri Residence</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Registration / Sidebar Column */}
                        <div className="bg-surface-bright dark:bg-[#002117] p-8 md:p-12 lg:w-1/3 border-l border-border-subtle dark:border-primary-container flex flex-col justify-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10 pointer-events-none text-primary dark:text-primary-fixed-dim">
                                <span className="material-symbols-outlined text-[120px]">local_florist</span>
                            </div>
                            
                            <h2 className="font-headline-sm text-headline-sm text-on-background dark:text-on-primary mb-6 relative z-10">
                                {isPast ? 'Event Concluded' : 'Reserve Your Spot'}
                            </h2>
                            <p className="font-body-md text-body-md text-on-surface-variant dark:text-on-primary/70 mb-6 relative z-10">
                                {isPast 
                                    ? "This event has already passed. Check back soon for photos in our gallery!"
                                    : "Space is limited for this exclusive resident event. Please RSVP to secure your attendance."}
                            </p>
                            
                            {!isPast && (
                                <form className="space-y-4 relative z-10" onSubmit={e => e.preventDefault()}>
                                    <div>
                                        <label className="block font-label-sm text-label-sm text-on-surface dark:text-on-primary/80 mb-1" htmlFor="name">Full Name</label>
                                        <input className="w-full rounded-lg border-border-subtle dark:border-primary-container bg-surface-container-lowest dark:bg-primary text-on-surface dark:text-on-primary placeholder:text-on-surface-variant/50 focus:border-primary dark:focus:border-primary-fixed-dim focus:ring-primary dark:focus:ring-primary-fixed-dim shadow-sm py-2 px-3 outline-none" id="name" placeholder="e.g. Jane Doe" type="text" />
                                    </div>
                                    <div>
                                        <label className="block font-label-sm text-label-sm text-on-surface dark:text-on-primary/80 mb-1" htmlFor="unit">Unit Number</label>
                                        <input className="w-full rounded-lg border-border-subtle dark:border-primary-container bg-surface-container-lowest dark:bg-primary text-on-surface dark:text-on-primary placeholder:text-on-surface-variant/50 focus:border-primary dark:focus:border-primary-fixed-dim focus:ring-primary dark:focus:ring-primary-fixed-dim shadow-sm py-2 px-3 outline-none" id="unit" placeholder="e.g. 4B" type="text" />
                                    </div>
                                    <div>
                                        <label className="block font-label-sm text-label-sm text-on-surface dark:text-on-primary/80 mb-1" htmlFor="guests">Number of Guests</label>
                                        <div className="relative">
                                            <button 
                                                type="button" 
                                                onClick={() => setIsGuestsOpen(!isGuestsOpen)} 
                                                className="w-full flex items-center justify-between rounded-lg border-border-subtle dark:border-primary-container bg-surface-container-lowest dark:bg-primary text-on-surface dark:text-on-primary focus:border-primary dark:focus:border-primary-fixed-dim focus:ring-primary dark:focus:ring-primary-fixed-dim shadow-sm py-2 px-3 outline-none text-left"
                                            >
                                                <span>{guests}</span>
                                                <span className="material-symbols-outlined text-[20px] text-text-muted pointer-events-none transition-transform duration-200" style={{ transform: isGuestsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
                                            </button>
                                            
                                            {isGuestsOpen && (
                                                <ul className="absolute z-50 w-full bottom-full mb-1 bg-surface dark:bg-primary-container border border-border-subtle/50 dark:border-primary-container/50 rounded-lg shadow-xl max-h-60 overflow-y-auto overflow-x-hidden">
                                                    {['1 (Just me)', '2', '3', '4'].map((option) => (
                                                        <li 
                                                            key={option} 
                                                            onClick={() => { setGuests(option); setIsGuestsOpen(false); }}
                                                            className="px-4 py-3 hover:bg-surface-container-low dark:hover:bg-primary/50 cursor-pointer font-body-md text-on-surface dark:text-on-primary border-b border-border-subtle/20 dark:border-primary-container/20 last:border-0 transition-colors truncate"
                                                        >
                                                            {option}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                    <button className="w-full bg-[#064e3b] dark:bg-primary-fixed-dim text-white dark:text-primary hover:bg-primary-container/90 dark:hover:bg-primary-fixed transition-colors py-3 px-6 rounded-lg font-label-md text-label-md shadow-md hover:shadow-lg mt-4" type="submit">
                                        Submit RSVP
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </section>
            </main>

            <Footer setActiveTab={setActiveTab} />
        </div>
    );
}
