"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import TopNavBar from '@/components/TopNavBar';
import Footer from '@/components/Footer';

export default function ResidentReportPage() {
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

    const [category, setCategory] = useState('');
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);

    const categoryOptions = [
        { value: 'security', label: 'Security Concern' },
        { value: 'maintenance', label: 'Maintenance / Repair' },
        { value: 'cleaning', label: 'Cleaning / Waste' },
        { value: 'general', label: 'General Feedback' }
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, this would submit the report to the backend.
        alert("Report submitted successfully! Thank you for helping keep our community safe.");
    };

    return (
        <div className="bg-surface-container-lowest dark:bg-primary text-on-surface dark:text-on-primary font-body-md antialiased transition-colors duration-300 min-h-screen flex flex-col">
            <TopNavBar activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} toggleDark={toggleDark} />

            <main className="flex-grow pt-24 pb-section-gap max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop w-full">
                {/* Header & Breadcrumb */}
                <div className="mb-8 mt-4">
                    <div className="flex items-center space-x-2 text-text-muted dark:text-on-primary/70 font-label-sm text-label-sm mb-4">
                        <Link className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors" href="/">Home</Link>
                        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                        <span className="text-on-surface dark:text-on-primary">Resident Report</span>
                    </div>
                    <div className="max-w-2xl">
                        <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-primary dark:text-primary-fixed-dim mb-4">File a Report</h1>
                        <p className="text-text-muted dark:text-on-primary/70 font-body-md text-body-md">
                            Help us keep Dwipapuri Residence safe, clean, and functioning perfectly. Use this form to report maintenance issues, security concerns, or general feedback.
                        </p>
                    </div>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-12">
                    {/* Left Column: Form (8 cols) */}
                    <div className="lg:col-span-8">
                        <div className="bg-surface dark:bg-primary-container rounded-2xl shadow-sm border border-border-subtle/50 dark:border-primary-container/50 p-6 md:p-8">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Category */}
                                <div>
                                    <label className="block font-label-sm text-label-sm text-on-surface dark:text-on-primary/70 mb-2" htmlFor="category">Category</label>
                                    <div className="relative">
                                        <button 
                                            type="button" 
                                            onClick={() => setIsCategoryOpen(!isCategoryOpen)} 
                                            className="w-full flex items-center justify-between rounded-lg border border-border-subtle dark:border-primary-container/50 bg-background dark:bg-primary text-on-surface dark:text-on-primary font-body-md py-3 px-4 transition-colors text-left focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-primary-fixed-dim"
                                        >
                                            <span className={!category ? "text-on-surface/50 dark:text-on-primary/50" : ""}>
                                                {category ? categoryOptions.find(o => o.value === category)?.label : "Select a category..."}
                                            </span>
                                            <span className="material-symbols-outlined text-text-muted pointer-events-none transition-transform duration-200" style={{ transform: isCategoryOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
                                        </button>
                                        
                                        {isCategoryOpen && (
                                            <ul className="absolute z-50 w-full mt-2 bg-surface dark:bg-primary-container border border-border-subtle dark:border-primary-container/50 rounded-lg shadow-xl max-h-60 overflow-y-auto overflow-x-hidden">
                                                {categoryOptions.map((option) => (
                                                    <li 
                                                        key={option.value} 
                                                        onClick={() => { setCategory(option.value); setIsCategoryOpen(false); }}
                                                        className="px-4 py-3 hover:bg-surface-container-low dark:hover:bg-primary/50 cursor-pointer font-body-md text-on-surface dark:text-on-primary border-b border-border-subtle/20 dark:border-primary-container/20 last:border-0 transition-colors truncate"
                                                    >
                                                        {option.label}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        {/* Hidden input for form validation */}
                                        <input type="hidden" required value={category} />
                                    </div>
                                </div>

                                {/* Location */}
                                <div>
                                    <label className="block font-label-sm text-label-sm text-on-surface dark:text-on-primary/70 mb-2" htmlFor="location">Location / House Number</label>
                                    <input type="text" id="location" required placeholder="e.g. Block A, Street Light in front of No. 12" className="w-full rounded-lg border-border-subtle dark:border-primary-container/50 focus:border-primary dark:focus:border-primary-fixed-dim bg-background dark:bg-primary text-on-surface dark:text-on-primary font-body-md py-3 px-4 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-primary-fixed-dim transition-colors" />
                                </div>

                                {/* Subject */}
                                <div>
                                    <label className="block font-label-sm text-label-sm text-on-surface dark:text-on-primary/70 mb-2" htmlFor="subject">Subject</label>
                                    <input type="text" id="subject" required placeholder="Brief title of the issue" className="w-full rounded-lg border-border-subtle dark:border-primary-container/50 focus:border-primary dark:focus:border-primary-fixed-dim bg-background dark:bg-primary text-on-surface dark:text-on-primary font-body-md py-3 px-4 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-primary-fixed-dim transition-colors" />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block font-label-sm text-label-sm text-on-surface dark:text-on-primary/70 mb-2" htmlFor="description">Detailed Description</label>
                                    <textarea id="description" required placeholder="Please provide as much detail as possible..." rows={5} className="w-full rounded-lg border-border-subtle dark:border-primary-container/50 focus:border-primary dark:focus:border-primary-fixed-dim bg-background dark:bg-primary text-on-surface dark:text-on-primary font-body-md py-3 px-4 resize-none focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-primary-fixed-dim transition-colors"></textarea>
                                </div>

                                {/* Photo Upload */}
                                <div>
                                    <label className="block font-label-sm text-label-sm text-on-surface dark:text-on-primary/70 mb-2">Photo Evidence (Optional)</label>
                                    <div className="w-full border-2 border-dashed border-border-subtle dark:border-primary-container/50 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-surface-container-low dark:hover:bg-primary-container/20 transition-colors cursor-pointer group">
                                        <div className="w-12 h-12 rounded-full bg-primary-container/10 dark:bg-primary-fixed-dim/10 flex items-center justify-center text-primary dark:text-primary-fixed-dim mb-4 group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
                                        </div>
                                        <p className="font-label-md text-label-md text-on-surface dark:text-on-primary mb-1">Click to upload or drag and drop</p>
                                        <p className="font-body-sm text-sm text-text-muted dark:text-on-primary/50">SVG, PNG, JPG or GIF (max. 5MB)</p>
                                    </div>
                                </div>
                                
                                {/* Submit */}
                                <div className="pt-4 border-t border-border-subtle dark:border-primary-container/50 flex justify-end">
                                    <button type="submit" className="bg-primary hover:bg-primary-fixed-variant dark:bg-primary-fixed-dim dark:hover:bg-primary-fixed text-on-primary dark:text-primary font-label-md text-label-md py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px]">send</span>
                                        Submit Report
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Right Column: Emergency Contacts (4 cols) */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="sticky top-28 bg-[#93000a] text-white rounded-2xl shadow-sm p-6 md:p-8 overflow-hidden relative">
                            {/* Decorative background circle */}
                            <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                            
                            <div className="flex items-center gap-3 mb-6 relative z-10">
                                <span className="material-symbols-outlined text-[32px]">warning</span>
                                <h3 className="font-headline-md text-headline-sm">Emergency<br/>Contacts</h3>
                            </div>
                            <p className="text-white/80 font-body-md text-body-md mb-8 relative z-10">
                                For immediate assistance or life-threatening emergencies, please bypass the form and contact these numbers directly.
                            </p>
                            
                            <ul className="space-y-4 relative z-10">
                                <li className="flex items-center justify-between p-4 bg-black/20 rounded-xl hover:bg-black/30 transition-colors cursor-pointer border border-transparent hover:border-white/10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[20px]">local_police</span>
                                        </div>
                                        <div>
                                            <p className="font-label-sm text-label-sm text-white/70">Security Post</p>
                                            <p className="font-label-md text-label-md">+62 123 4567 890</p>
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined">call</span>
                                </li>
                                <li className="flex items-center justify-between p-4 bg-black/20 rounded-xl hover:bg-black/30 transition-colors cursor-pointer border border-transparent hover:border-white/10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[20px]">local_hospital</span>
                                        </div>
                                        <div>
                                            <p className="font-label-sm text-label-sm text-white/70">Local Clinic</p>
                                            <p className="font-label-md text-label-md">+62 111 2222 333</p>
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined">call</span>
                                </li>
                                <li className="flex items-center justify-between p-4 bg-black/20 rounded-xl hover:bg-black/30 transition-colors cursor-pointer border border-transparent hover:border-white/10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[20px]">local_fire_department</span>
                                        </div>
                                        <div>
                                            <p className="font-label-sm text-label-sm text-white/70">Fire Department</p>
                                            <p className="font-label-md text-label-md">113</p>
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined">call</span>
                                </li>
                                <li className="flex items-center justify-between p-4 bg-black/20 rounded-xl hover:bg-black/30 transition-colors cursor-pointer border border-transparent hover:border-white/10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[20px]">support_agent</span>
                                        </div>
                                        <div>
                                            <p className="font-label-sm text-label-sm text-white/70">Management Office</p>
                                            <p className="font-label-md text-label-md">+62 987 6543 210</p>
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined">call</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
