import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TopNavBar from '../components/TopNavBar';
import Footer from '../components/Footer';

export default function ScheduleVisitPage() {
    const [isDark, setIsDark] = useState(() => {
        try { return localStorage.getItem('homepageDark') === 'true'; } catch { return false; }
    });
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

    const [selectedProperty, setSelectedProperty] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [isPropertyOpen, setIsPropertyOpen] = useState(false);
    const [isTimeOpen, setIsTimeOpen] = useState(false);

    const propertyOptions = [
        { value: 'emerald', label: 'The Emerald Villa' },
        { value: 'sapphire', label: 'The Sapphire Townhouse' },
        { value: 'ruby', label: 'The Ruby Loft' },
        { value: 'general', label: 'General Community Tour' },
    ];

    const timeOptions = [
        { value: 'morning', label: 'Morning (09:00 AM - 12:00 PM)' },
        { value: 'afternoon', label: 'Afternoon (12:00 PM - 04:00 PM)' },
        { value: 'evening', label: 'Evening (04:00 PM - 06:00 PM)' },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert("Your visit request has been submitted successfully! One of our agents will contact you shortly to confirm.");
    };

    return (
        <div className="bg-surface-container-lowest dark:bg-primary text-on-surface dark:text-on-primary font-body-md antialiased transition-colors duration-300 min-h-screen flex flex-col">
            <TopNavBar activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} toggleDark={toggleDark} />

            <main className="flex-grow pt-24 pb-section-gap max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop w-full">
                {/* Header & Breadcrumb */}
                <div className="mb-8 mt-4">
                    <div className="flex items-center space-x-2 text-text-muted dark:text-on-primary/70 font-label-sm text-label-sm mb-4">
                        <Link className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors" to="/">Home</Link>
                        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                        <span className="text-on-surface dark:text-on-primary">Schedule a Visit</span>
                    </div>
                    <div className="max-w-2xl">
                        <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-primary dark:text-primary-fixed-dim mb-4">Experience Dwipapuri</h1>
                        <p className="text-text-muted dark:text-on-primary/70 font-body-md text-body-md">
                            Seeing is believing. Schedule a personalized, guided tour of our exquisite properties, world-class amenities, and beautifully landscaped community.
                        </p>
                    </div>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-12">
                    {/* Left Column: Form (8 cols) */}
                    <div className="lg:col-span-8">
                        <div className="bg-surface dark:bg-primary-container rounded-2xl shadow-sm border border-border-subtle/50 dark:border-primary-container/50 p-6 md:p-8">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Full Name */}
                                    <div>
                                        <label className="block font-label-sm text-label-sm text-on-surface dark:text-on-primary/70 mb-2" htmlFor="name">Full Name</label>
                                        <input type="text" id="name" required placeholder="John Doe" className="w-full rounded-lg border-border-subtle dark:border-primary-container/50 focus:border-primary dark:focus:border-primary-fixed-dim bg-background dark:bg-primary text-on-surface dark:text-on-primary font-body-md py-3 px-4 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-primary-fixed-dim transition-colors" />
                                    </div>
                                    
                                    {/* Phone */}
                                    <div>
                                        <label className="block font-label-sm text-label-sm text-on-surface dark:text-on-primary/70 mb-2" htmlFor="phone">Phone Number</label>
                                        <input type="tel" id="phone" required placeholder="+1 (555) 000-0000" className="w-full rounded-lg border-border-subtle dark:border-primary-container/50 focus:border-primary dark:focus:border-primary-fixed-dim bg-background dark:bg-primary text-on-surface dark:text-on-primary font-body-md py-3 px-4 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-primary-fixed-dim transition-colors" />
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block font-label-sm text-label-sm text-on-surface dark:text-on-primary/70 mb-2" htmlFor="email">Email Address</label>
                                    <input type="email" id="email" required placeholder="john@example.com" className="w-full rounded-lg border-border-subtle dark:border-primary-container/50 focus:border-primary dark:focus:border-primary-fixed-dim bg-background dark:bg-primary text-on-surface dark:text-on-primary font-body-md py-3 px-4 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-primary-fixed-dim transition-colors" />
                                </div>

                                {/* Preferred Property */}
                                <div>
                                    <label className="block font-label-sm text-label-sm text-on-surface dark:text-on-primary/70 mb-2" htmlFor="property">Property of Interest</label>
                                    <div className="relative">
                                        <button 
                                            type="button" 
                                            onClick={() => { setIsPropertyOpen(!isPropertyOpen); setIsTimeOpen(false); }} 
                                            className="w-full flex items-center justify-between rounded-lg border border-border-subtle dark:border-primary-container/50 bg-background dark:bg-primary text-on-surface dark:text-on-primary font-body-md py-3 px-4 transition-colors text-left focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-primary-fixed-dim"
                                        >
                                            <span className={!selectedProperty ? "text-on-surface/50 dark:text-on-primary/50" : ""}>
                                                {selectedProperty ? propertyOptions.find(o => o.value === selectedProperty)?.label : "Select a property to view..."}
                                            </span>
                                            <span className="material-symbols-outlined text-text-muted pointer-events-none transition-transform duration-200" style={{ transform: isPropertyOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
                                        </button>
                                        
                                        {isPropertyOpen && (
                                            <ul className="absolute z-50 w-full mt-2 bg-surface dark:bg-primary-container border border-border-subtle dark:border-primary-container/50 rounded-lg shadow-xl max-h-60 overflow-y-auto overflow-x-hidden">
                                                {propertyOptions.map((option) => (
                                                    <li 
                                                        key={option.value} 
                                                        onClick={() => { setSelectedProperty(option.value); setIsPropertyOpen(false); }}
                                                        className="px-4 py-3 hover:bg-surface-container-low dark:hover:bg-primary/50 cursor-pointer font-body-md text-on-surface dark:text-on-primary border-b border-border-subtle/20 dark:border-primary-container/20 last:border-0 transition-colors truncate"
                                                    >
                                                        {option.label}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        {/* Hidden input for form submission validation if needed */}
                                        <input type="hidden" required value={selectedProperty} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                                    {/* Date */}
                                    <div>
                                        <label className="block font-label-sm text-label-sm text-on-surface dark:text-on-primary/70 mb-2" htmlFor="date">Preferred Date</label>
                                        <input 
                                            type="date" 
                                            id="date" 
                                            required 
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full rounded-lg border border-border-subtle dark:border-primary-container/50 focus:border-primary dark:focus:border-primary-fixed-dim bg-background dark:bg-primary text-on-surface dark:text-on-primary font-body-md py-3 px-4 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-primary-fixed-dim transition-colors" 
                                        />
                                    </div>
                                    
                                    {/* Time */}
                                    <div>
                                        <label className="block font-label-sm text-label-sm text-on-surface dark:text-on-primary/70 mb-2" htmlFor="time">Preferred Time</label>
                                        <div className="relative">
                                            <button 
                                                type="button" 
                                                onClick={() => { setIsTimeOpen(!isTimeOpen); setIsPropertyOpen(false); }} 
                                                className="w-full flex items-center justify-between rounded-lg border border-border-subtle dark:border-primary-container/50 bg-background dark:bg-primary text-on-surface dark:text-on-primary font-body-md py-3 px-4 transition-colors text-left focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-primary-fixed-dim"
                                            >
                                                <span className={!selectedTime ? "text-on-surface/50 dark:text-on-primary/50" : ""}>
                                                    {selectedTime ? timeOptions.find(o => o.value === selectedTime)?.label : "Select a time slot..."}
                                                </span>
                                                <span className="material-symbols-outlined text-text-muted pointer-events-none transition-transform duration-200" style={{ transform: isTimeOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
                                            </button>
                                            
                                            {isTimeOpen && (
                                                <ul className="absolute z-50 w-full mt-2 bg-surface dark:bg-primary-container border border-border-subtle dark:border-primary-container/50 rounded-lg shadow-xl max-h-60 overflow-y-auto overflow-x-hidden">
                                                    {timeOptions.map((option) => (
                                                        <li 
                                                            key={option.value} 
                                                            onClick={() => { setSelectedTime(option.value); setIsTimeOpen(false); }}
                                                            className="px-4 py-3 hover:bg-surface-container-low dark:hover:bg-primary/50 cursor-pointer font-body-md text-on-surface dark:text-on-primary border-b border-border-subtle/20 dark:border-primary-container/20 last:border-0 transition-colors truncate"
                                                        >
                                                            {option.label}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                            {/* Hidden input for form validation */}
                                            <input type="hidden" required value={selectedTime} />
                                        </div>
                                    </div>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block font-label-sm text-label-sm text-on-surface dark:text-on-primary/70 mb-2" htmlFor="notes">Additional Notes</label>
                                    <textarea id="notes" placeholder="Any specific requirements or questions you have before the tour..." rows={4} className="w-full rounded-lg border-border-subtle dark:border-primary-container/50 focus:border-primary dark:focus:border-primary-fixed-dim bg-background dark:bg-primary text-on-surface dark:text-on-primary font-body-md py-3 px-4 resize-none focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-primary-fixed-dim transition-colors"></textarea>
                                </div>
                                
                                {/* Submit */}
                                <div className="pt-4 border-t border-border-subtle dark:border-primary-container/50 flex justify-end">
                                    <button type="submit" className="bg-[#b45309] hover:bg-[#8b4006] dark:bg-[#d97706] dark:hover:bg-[#b45309] text-white font-label-md text-label-md py-4 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 w-full sm:w-auto justify-center">
                                        <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                                        Confirm Appointment
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Right Column: Sidebar (4 cols) */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="sticky top-28 bg-primary dark:bg-primary-container text-on-primary rounded-2xl shadow-sm p-6 md:p-8 overflow-hidden relative border border-transparent dark:border-border-subtle/20">
                            {/* Decorative background element */}
                            <div className="absolute -right-8 -top-8 text-white/5 dark:text-primary-fixed-dim/5 rotate-12 pointer-events-none">
                                <span className="material-symbols-outlined text-[200px]">home</span>
                            </div>
                            
                            <div className="flex items-center gap-3 mb-6 relative z-10">
                                <span className="material-symbols-outlined text-[32px] text-primary-fixed-dim dark:text-primary-fixed">diamond</span>
                                <h3 className="font-headline-md text-headline-sm">Why Visit Us?</h3>
                            </div>
                            
                            <ul className="space-y-6 relative z-10 mb-8">
                                <li className="flex gap-4">
                                    <div className="w-10 h-10 shrink-0 rounded-full bg-white/10 dark:bg-primary/50 flex items-center justify-center text-primary-fixed-dim dark:text-primary-fixed">
                                        <span className="material-symbols-outlined text-[20px]">person_check</span>
                                    </div>
                                    <div>
                                        <h4 className="font-label-lg text-label-lg mb-1">Guided Expert Tour</h4>
                                        <p className="font-body-sm text-body-sm text-on-primary/70">Our dedicated property specialists will walk you through every detail of the home and community.</p>
                                    </div>
                                </li>
                                <li className="flex gap-4">
                                    <div className="w-10 h-10 shrink-0 rounded-full bg-white/10 dark:bg-primary/50 flex items-center justify-center text-primary-fixed-dim dark:text-primary-fixed">
                                        <span className="material-symbols-outlined text-[20px]">pool</span>
                                    </div>
                                    <div>
                                        <h4 className="font-label-lg text-label-lg mb-1">Experience the Amenities</h4>
                                        <p className="font-body-sm text-body-sm text-on-primary/70">See our clubhouse, olympic pool, and meticulously maintained parks firsthand.</p>
                                    </div>
                                </li>
                                <li className="flex gap-4">
                                    <div className="w-10 h-10 shrink-0 rounded-full bg-white/10 dark:bg-primary/50 flex items-center justify-center text-primary-fixed-dim dark:text-primary-fixed">
                                        <span className="material-symbols-outlined text-[20px]">handshake</span>
                                    </div>
                                    <div>
                                        <h4 className="font-label-lg text-label-lg mb-1">Meet the Community</h4>
                                        <p className="font-body-sm text-body-sm text-on-primary/70">Get a true feel for the neighborhood and meet potential future neighbors during your visit.</p>
                                    </div>
                                </li>
                            </ul>
                            
                            <div className="pt-6 border-t border-white/10 dark:border-primary/20 relative z-10">
                                <h4 className="font-label-md text-label-md mb-4 uppercase tracking-wider text-primary-fixed-dim dark:text-primary-fixed">Speak to an Agent Now</h4>
                                <div className="flex items-center gap-4 bg-white/5 dark:bg-primary/20 p-4 rounded-xl">
                                    <div className="w-12 h-12 shrink-0 rounded-full overflow-hidden border border-white/20">
                                        <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAd10O6kzfY7B-aZVNu3M9Oo0Q-wAibYX561w0waoJEPSAxLZICTcqE7mpoYhcisKosGX2rY4SxW-0gMSssENOcwT9hzCkqPwhG3CLXpYEExSOKEN64-vzIf-FthydLsHtSgWrMz6oktpWoiUetI5EHDdDdq6mxuOcidXKgMpH-qpSpfK0N94NtznAXYmmD7SSS4oRZTQmVHqLLqU0CRtiIbSYaF7HM3j6xVlXIveZ3rCHSstpGNzRDI1Q67_adu6aA4Yq87Xj50uQ" alt="Agent" className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <p className="font-label-lg text-label-lg mb-0.5">Sarah Jenkins</p>
                                        <p className="font-body-sm text-body-sm text-on-primary/70 mb-1">Senior Property Consultant</p>
                                        <a href="tel:+15550000000" className="flex items-center gap-1 font-label-md text-label-md text-[#b45309] dark:text-[#d97706] group no-underline">
                                            <span className="material-symbols-outlined text-[16px] no-underline">call</span>
                                            <span className="group-hover:underline">+1 (555) 000-0000</span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
