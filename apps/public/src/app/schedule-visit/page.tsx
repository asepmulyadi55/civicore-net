"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import TopNavBar from '@/components/TopNavBar';
import Footer from '@/components/Footer';

export default function ScheduleVisitPage() {
    const [isDark, setIsDark] = useState(() => {
        try { return localStorage.getItem('homepageDark') === 'true'; } catch { return false; }
    });
    const [activeTab, setActiveTab] = useState('');

    useEffect(() => { window.scrollTo(0, 0); }, []);

    useEffect(() => {
        const html = document.documentElement;
        if (isDark) html.classList.add('dark');
        else html.classList.remove('dark');
    }, [isDark]);

    const toggleDark = () => {
        setIsDark(prev => {
            const next = !prev;
            try { localStorage.setItem('homepageDark', String(next)); } catch { }
            return next;
        });
    };

    const [selectedProperty, setSelectedProperty] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [isPropertyOpen, setIsPropertyOpen] = useState(false);
    const [isTimeOpen, setIsTimeOpen] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [submitMsg, setSubmitMsg] = useState('');
    const [visitItems, setVisitItems] = useState<{ icon: string; title: string; description: string }[]>([]);

    useEffect(() => {
        fetch('/api/homepage/visit-settings')
            .then(r => r.json())
            .then(d => { if (Array.isArray(d)) setVisitItems(d); })
            .catch(() => {});
    }, []);

    const propertyOptions = [
        { value: 'emerald', label: 'The Emerald Villa' },
        { value: 'sapphire', label: 'The Sapphire Townhouse' },
        { value: 'ruby', label: 'The Ruby Loft' },
        { value: 'general', label: 'Tur Komunitas Umum' },
    ];

    const timeOptions = [
        { value: 'morning', label: 'Pagi (09:00 - 12:00)' },
        { value: 'afternoon', label: 'Siang (12:00 - 16:00)' },
        { value: 'evening', label: 'Sore (16:00 - 18:00)' },
    ];

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitStatus('loading');
        const formEl = e.currentTarget;
        const fd = new FormData(formEl);
        fd.set('property', selectedProperty);
        fd.set('time', selectedTime);
        try {
            const token = await new Promise((resolve) => {
                (window as any).grecaptcha.ready(() => {
                    (window as any).grecaptcha.execute('6LcYAU4tAAAAAIOUBvSBiUsCre0iHTwZRds2WpI5', { action: 'submit' }).then(resolve);
                });
            });
            fd.set('captchaToken', token as string);

            const res = await fetch('/api/homepage/submit/visit', { method: 'POST', body: fd });
            const data = await res.json();
            if (res.ok) {
                setSubmitStatus('success');
                setSubmitMsg(data.message);
            } else {
                setSubmitStatus('error');
                setSubmitMsg(data.message || 'Terjadi kesalahan. Silakan coba lagi.');
            }
        } catch {
            setSubmitStatus('error');
            setSubmitMsg('Tidak dapat terhubung ke server.');
        }
    };

    return (
        <div className="bg-surface-container-lowest dark:bg-primary text-on-surface dark:text-on-primary font-body-md antialiased transition-colors duration-300 min-h-screen flex flex-col">
            <TopNavBar activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} toggleDark={toggleDark} />

            <main className="flex-grow pt-24 pb-section-gap max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop w-full">
                {/* Header & Breadcrumb */}
                <div className="mb-8 mt-4">
                    <div className="flex items-center space-x-2 text-text-muted dark:text-on-primary/70 font-label-sm text-label-sm mb-4">
                        <Link className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors" href="/">Beranda</Link>
                        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                        <span className="text-on-surface dark:text-on-primary">Jadwalkan Kunjungan</span>
                    </div>
                    <div className="max-w-2xl">
                        <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-primary dark:text-primary-fixed-dim mb-4">Jadwalkan Kunjungan</h1>
                        <p className="text-text-muted dark:text-on-primary/70 font-body-md text-body-md">
                            Melihat langsung adalah pengalaman terbaik. Jadwalkan tur personal eksklusif bersama kami untuk melihat properti, fasilitas Dwipapuri, dan berbincang dengan pengurus Dwipapuri.
                        </p>
                    </div>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-12">
                    {/* Left Column: Form */}
                    <div className="lg:col-span-8">
                        <div className="bg-surface dark:bg-primary-container rounded-2xl shadow-sm border border-border-subtle/50 dark:border-primary-container/50 p-6 md:p-8">
                            {submitStatus === 'success' ? (
                                <div className="text-center py-12">
                                    <span className="material-symbols-outlined text-6xl text-green-600 mb-4 block">check_circle</span>
                                    <h2 className="font-headline-md text-primary dark:text-primary-fixed-dim mb-2">Permintaan Diterima!</h2>
                                    <p className="text-body-md text-text-muted dark:text-on-primary/70 mb-6">{submitMsg}</p>
                                    <button onClick={() => setSubmitStatus('idle')} className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-container transition-colors font-label-md">Buat Permintaan Baru</button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block font-label-sm text-label-sm text-on-surface dark:text-on-primary/70 mb-2" htmlFor="name">Nama Lengkap</label>
                                            <input type="text" id="name" name="name" required placeholder="John Doe" className="w-full rounded-lg border border-border-subtle dark:border-primary-container/50 focus:border-primary dark:focus:border-primary-fixed-dim bg-background dark:bg-primary text-on-surface dark:text-on-primary font-body-md py-3 px-4 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-primary-fixed-dim transition-colors" />
                                        </div>
                                        <div>
                                            <label className="block font-label-sm text-label-sm text-on-surface dark:text-on-primary/70 mb-2" htmlFor="phone">Nomor Telepon</label>
                                            <input type="tel" id="phone" name="phone" required placeholder="+62 812 3456 7890" className="w-full rounded-lg border border-border-subtle dark:border-primary-container/50 focus:border-primary dark:focus:border-primary-fixed-dim bg-background dark:bg-primary text-on-surface dark:text-on-primary font-body-md py-3 px-4 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-primary-fixed-dim transition-colors" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block font-label-sm text-label-sm text-on-surface dark:text-on-primary/70 mb-2" htmlFor="email">Alamat Email</label>
                                        <input type="email" id="email" name="email" required placeholder="contoh@email.com" className="w-full rounded-lg border border-border-subtle dark:border-primary-container/50 focus:border-primary dark:focus:border-primary-fixed-dim bg-background dark:bg-primary text-on-surface dark:text-on-primary font-body-md py-3 px-4 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-primary-fixed-dim transition-colors" />
                                    </div>

                                    {/* Preferred Property */}
                                    <div>
                                        <label className="block font-label-sm text-label-sm text-on-surface dark:text-on-primary/70 mb-2">Properti yang Diminati</label>
                                        <div className="relative">
                                            <button type="button" onClick={() => { setIsPropertyOpen(!isPropertyOpen); setIsTimeOpen(false); }} className="w-full flex items-center justify-between rounded-lg border border-border-subtle dark:border-primary-container/50 bg-background dark:bg-primary text-on-surface dark:text-on-primary font-body-md py-3 px-4 transition-colors text-left focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-primary-fixed-dim">
                                                <span className={!selectedProperty ? "text-on-surface/50 dark:text-on-primary/50" : ""}>
                                                    {selectedProperty ? propertyOptions.find(o => o.value === selectedProperty)?.label : "Pilih properti yang ingin dikunjungi..."}
                                                </span>
                                                <span className="material-symbols-outlined text-text-muted pointer-events-none transition-transform duration-200" style={{ transform: isPropertyOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
                                            </button>
                                            {isPropertyOpen && (
                                                <ul className="absolute z-50 w-full mt-2 bg-surface dark:bg-primary-container border border-border-subtle dark:border-primary-container/50 rounded-lg shadow-xl max-h-60 overflow-y-auto overflow-x-hidden">
                                                    {propertyOptions.map((option) => (
                                                        <li key={option.value} tabIndex={0} role="button" onKeyDown={(e) => { if (["Enter", " "].includes(e.key)) { e.preventDefault(); e.currentTarget.click(); } }} onClick={() => { setSelectedProperty(option.value); setIsPropertyOpen(false); }} className="px-4 py-3 hover:bg-surface-container-low dark:hover:bg-primary/50 cursor-pointer font-body-md text-on-surface dark:text-on-primary border-b border-border-subtle/20 dark:border-primary-container/20 last:border-0 transition-colors truncate">
                                                            {option.label}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                            <input type="hidden" required value={selectedProperty} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                                        <div>
                                            <label className="block font-label-sm text-label-sm text-on-surface dark:text-on-primary/70 mb-2" htmlFor="date">Tanggal yang Diinginkan</label>
                                            <input type="date" id="date" name="date" required min={new Date().toISOString().split('T')[0]} onClick={(e) => { try { (e.target as HTMLInputElement).showPicker(); } catch (err) { } }} className="w-full rounded-lg border border-border-subtle dark:border-primary-container/50 focus:border-primary dark:focus:border-primary-fixed-dim bg-background dark:bg-primary text-on-surface dark:text-on-primary font-body-md py-3 px-4 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-primary-fixed-dim transition-colors cursor-pointer" />
                                        </div>
                                        <div>
                                            <label className="block font-label-sm text-label-sm text-on-surface dark:text-on-primary/70 mb-2">Waktu yang Diinginkan</label>
                                            <div className="relative">
                                                <button type="button" onClick={() => { setIsTimeOpen(!isTimeOpen); setIsPropertyOpen(false); }} className="w-full flex items-center justify-between rounded-lg border border-border-subtle dark:border-primary-container/50 bg-background dark:bg-primary text-on-surface dark:text-on-primary font-body-md py-3 px-4 transition-colors text-left focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-primary-fixed-dim">
                                                    <span className={!selectedTime ? "text-on-surface/50 dark:text-on-primary/50" : ""}>
                                                        {selectedTime ? timeOptions.find(o => o.value === selectedTime)?.label : "Pilih slot waktu..."}
                                                    </span>
                                                    <span className="material-symbols-outlined text-text-muted pointer-events-none transition-transform duration-200" style={{ transform: isTimeOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
                                                </button>
                                                {isTimeOpen && (
                                                    <ul className="absolute z-50 w-full mt-2 bg-surface dark:bg-primary-container border border-border-subtle dark:border-primary-container/50 rounded-lg shadow-xl max-h-60 overflow-y-auto overflow-x-hidden">
                                                        {timeOptions.map((option) => (
                                                            <li key={option.value} tabIndex={0} role="button" onKeyDown={(e) => { if (["Enter", " "].includes(e.key)) { e.preventDefault(); e.currentTarget.click(); } }} onClick={() => { setSelectedTime(option.value); setIsTimeOpen(false); }} className="px-4 py-3 hover:bg-surface-container-low dark:hover:bg-primary/50 cursor-pointer font-body-md text-on-surface dark:text-on-primary border-b border-border-subtle/20 dark:border-primary-container/20 last:border-0 transition-colors truncate">
                                                                {option.label}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                                <input type="hidden" required value={selectedTime} />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block font-label-sm text-label-sm text-on-surface dark:text-on-primary/70 mb-2" htmlFor="notes">Catatan Tambahan</label>
                                        <textarea id="notes" name="notes" placeholder="Pertanyaan atau permintaan khusus sebelum tur..." rows={4} className="w-full rounded-lg border border-border-subtle dark:border-primary-container/50 focus:border-primary dark:focus:border-primary-fixed-dim bg-background dark:bg-primary text-on-surface dark:text-on-primary font-body-md py-3 px-4 resize-none focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-primary-fixed-dim transition-colors"></textarea>
                                    </div>

                                    {submitStatus === 'error' && (
                                        <p className="text-red-600 text-sm bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-lg">{submitMsg}</p>
                                    )}

                                    <div className="pt-4 border-t border-border-subtle dark:border-primary-container/50 flex justify-end">
                                        <button type="submit" disabled={submitStatus === 'loading'} className="bg-[#b45309] hover:bg-[#8b4006] dark:bg-[#d97706] dark:hover:bg-[#b45309] text-white font-label-md text-label-md py-4 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 w-full sm:w-auto justify-center disabled:opacity-60">
                                            {submitStatus === 'loading' ? <span className="material-symbols-outlined animate-spin text-[18px]">autorenew</span> : <span className="material-symbols-outlined text-[18px]">calendar_month</span>}
                                            {submitStatus === 'loading' ? 'Mengirim...' : 'Konfirmasi Jadwal'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Sidebar */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="sticky top-28 bg-primary dark:bg-primary-container text-on-primary rounded-2xl shadow-sm p-6 md:p-8 overflow-hidden relative border border-transparent dark:border-border-subtle/20">
                            <div className="absolute -right-8 -top-8 text-white/5 dark:text-primary-fixed-dim/5 rotate-12 pointer-events-none">
                                <span className="material-symbols-outlined text-[200px]">home</span>
                            </div>
                            <div className="flex items-center gap-3 mb-6 relative z-10">
                                <span className="material-symbols-outlined text-[32px] text-primary-fixed-dim dark:text-primary-fixed">diamond</span>
                                <h3 className="font-headline-md text-headline-sm">Mengapa Harus Berkunjung?</h3>
                            </div>
                            <ul className="space-y-6 relative z-10 mb-8">
                                {visitItems.map((item, i) => (
                                    <li key={i} className="flex gap-4">
                                        <div className="w-10 h-10 shrink-0 rounded-full bg-white/10 dark:bg-primary/50 flex items-center justify-center text-primary-fixed-dim dark:text-primary-fixed">
                                            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-label-lg text-label-lg mb-1">{item.title}</h4>
                                            <p className="font-body-sm text-body-sm text-on-primary/70">{item.description}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
