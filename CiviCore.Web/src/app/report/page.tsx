"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import TopNavBar from '@/components/TopNavBar';
import Footer from '@/components/Footer';

export default function ResidentReportPage() {
    const [isDark, setIsDark] = useState(() => {
        try { return localStorage.getItem('homepageDark') === 'true'; } catch { return false; }
    });
    const [activeTab, setActiveTab] = useState('');
    const [category, setCategory] = useState('');
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [submitMsg, setSubmitMsg] = useState('');
    const [emergencyContacts, setEmergencyContacts] = useState<any[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { window.scrollTo(0, 0); }, []);

    useEffect(() => {
        const html = document.documentElement;
        if (isDark) html.classList.add('dark');
        else html.classList.remove('dark');
    }, [isDark]);

    useEffect(() => {
        fetch('/api/homepage/emergency-contacts')
            .then(res => res.json())
            .then(data => setEmergencyContacts(Array.isArray(data) ? data : []))
            .catch(console.error);
    }, []);

    const toggleDark = () => {
        setIsDark(prev => {
            const next = !prev;
            try { localStorage.setItem('homepageDark', String(next)); } catch {}
            return next;
        });
    };

    const categoryOptions = [
        { value: 'security', label: 'Keamanan' },
        { value: 'maintenance', label: 'Pemeliharaan / Perbaikan' },
        { value: 'cleaning', label: 'Kebersihan / Sampah' },
        { value: 'general', label: 'Masukan Umum' },
    ];

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitStatus('loading');
        const formEl = e.currentTarget;
        const fd = new FormData(formEl);
        fd.set('category', category);
        if (selectedPhoto) fd.set('photo', selectedPhoto);
        try {
            const res = await fetch('/api/homepage/submit/report', { method: 'POST', body: fd });
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
                        <span className="text-on-surface dark:text-on-primary">Laporan Warga</span>
                    </div>
                    <div className="max-w-2xl">
                        <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-primary dark:text-primary-fixed-dim mb-4">Buat Laporan</h1>
                        <p className="text-text-muted dark:text-on-primary/70 font-body-md text-body-md">
                            Bantu kami menjaga Dwipapuri Residence tetap aman, bersih, dan berfungsi dengan baik. Gunakan formulir ini untuk melaporkan masalah pemeliharaan, kekhawatiran keamanan, atau masukan umum.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-12">
                    {/* Left Column: Form */}
                    <div className="lg:col-span-8">
                        <div className="bg-surface dark:bg-primary-container rounded-2xl shadow-sm border border-border-subtle/50 dark:border-primary-container/50 p-6 md:p-8">
                            {submitStatus === 'success' ? (
                                <div className="text-center py-12">
                                    <span className="material-symbols-outlined text-6xl text-green-600 mb-4 block">check_circle</span>
                                    <h2 className="font-headline-md text-primary dark:text-primary-fixed-dim mb-2">Laporan Dikirim!</h2>
                                    <p className="text-body-md text-text-muted dark:text-on-primary/70 mb-6">{submitMsg}</p>
                                    <button onClick={() => setSubmitStatus('idle')} className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-container transition-colors font-label-md">Buat Laporan Baru</button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Category */}
                                    <div>
                                        <label className="block font-label-sm text-label-sm text-on-surface dark:text-on-primary/70 mb-2">Kategori</label>
                                        <div className="relative">
                                            <button type="button" onClick={() => setIsCategoryOpen(!isCategoryOpen)} className="w-full flex items-center justify-between rounded-lg border border-border-subtle dark:border-primary-container/50 bg-background dark:bg-primary text-on-surface dark:text-on-primary font-body-md py-3 px-4 transition-colors text-left focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-primary-fixed-dim">
                                                <span className={!category ? "text-on-surface/50 dark:text-on-primary/50" : ""}>
                                                    {category ? categoryOptions.find(o => o.value === category)?.label : "Pilih kategori laporan..."}
                                                </span>
                                                <span className="material-symbols-outlined text-text-muted pointer-events-none transition-transform duration-200" style={{ transform: isCategoryOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
                                            </button>
                                            {isCategoryOpen && (
                                                <ul className="absolute z-50 w-full mt-2 bg-surface dark:bg-primary-container border border-border-subtle dark:border-primary-container/50 rounded-lg shadow-xl max-h-60 overflow-y-auto overflow-x-hidden">
                                                    {categoryOptions.map((option) => (
                                                        <li key={option.value} onClick={() => { setCategory(option.value); setIsCategoryOpen(false); }} className="px-4 py-3 hover:bg-surface-container-low dark:hover:bg-primary/50 cursor-pointer font-body-md text-on-surface dark:text-on-primary border-b border-border-subtle/20 dark:border-primary-container/20 last:border-0 transition-colors truncate">
                                                            {option.label}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                            <input type="hidden" required value={category} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block font-label-sm text-label-sm text-on-surface dark:text-on-primary/70 mb-2" htmlFor="reporter_name">Nama Pelapor</label>
                                            <input type="text" id="reporter_name" name="reporter_name" placeholder="Nama Anda (opsional)" className="w-full rounded-lg border border-border-subtle dark:border-primary-container/50 bg-background dark:bg-primary text-on-surface dark:text-on-primary font-body-md py-3 px-4 focus:outline-none focus:ring-1 focus:ring-primary transition-colors" />
                                        </div>
                                        <div>
                                            <label className="block font-label-sm text-label-sm text-on-surface dark:text-on-primary/70 mb-2" htmlFor="reporter_phone">Nomor Telepon</label>
                                            <input type="tel" id="reporter_phone" name="reporter_phone" placeholder="+62... (opsional)" className="w-full rounded-lg border border-border-subtle dark:border-primary-container/50 bg-background dark:bg-primary text-on-surface dark:text-on-primary font-body-md py-3 px-4 focus:outline-none focus:ring-1 focus:ring-primary transition-colors" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block font-label-sm text-label-sm text-on-surface dark:text-on-primary/70 mb-2" htmlFor="location">Lokasi / Nomor Rumah</label>
                                        <input type="text" id="location" name="location" required placeholder="Contoh: Blok A, Lampu Jalan di depan No. 12" className="w-full rounded-lg border border-border-subtle dark:border-primary-container/50 bg-background dark:bg-primary text-on-surface dark:text-on-primary font-body-md py-3 px-4 focus:outline-none focus:ring-1 focus:ring-primary transition-colors" />
                                    </div>

                                    <div>
                                        <label className="block font-label-sm text-label-sm text-on-surface dark:text-on-primary/70 mb-2" htmlFor="subject">Subjek</label>
                                        <input type="text" id="subject" name="subject" required placeholder="Judul singkat masalah" className="w-full rounded-lg border border-border-subtle dark:border-primary-container/50 bg-background dark:bg-primary text-on-surface dark:text-on-primary font-body-md py-3 px-4 focus:outline-none focus:ring-1 focus:ring-primary transition-colors" />
                                    </div>

                                    <div>
                                        <label className="block font-label-sm text-label-sm text-on-surface dark:text-on-primary/70 mb-2" htmlFor="description">Deskripsi Lengkap</label>
                                        <textarea id="description" name="description" required placeholder="Jelaskan masalah secara detail..." rows={5} className="w-full rounded-lg border border-border-subtle dark:border-primary-container/50 bg-background dark:bg-primary text-on-surface dark:text-on-primary font-body-md py-3 px-4 resize-none focus:outline-none focus:ring-1 focus:ring-primary transition-colors"></textarea>
                                    </div>

                                    {/* Photo Upload */}
                                    <div>
                                        <label className="block font-label-sm text-label-sm text-on-surface dark:text-on-primary/70 mb-2">Foto Bukti (Opsional)</label>
                                        <div
                                            className="w-full border-2 border-dashed border-border-subtle dark:border-primary-container/50 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-surface-container-low dark:hover:bg-primary-container/20 transition-colors cursor-pointer group"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => setSelectedPhoto(e.target.files?.[0] || null)} />
                                            <div className="w-12 h-12 rounded-full bg-primary-container/10 dark:bg-primary-fixed-dim/10 flex items-center justify-center text-primary dark:text-primary-fixed-dim mb-4 group-hover:scale-110 transition-transform">
                                                <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
                                            </div>
                                            {selectedPhoto ? (
                                                <p className="font-label-md text-label-md text-primary dark:text-primary-fixed-dim">{selectedPhoto.name}</p>
                                            ) : (
                                                <>
                                                    <p className="font-label-md text-label-md text-on-surface dark:text-on-primary mb-1">Klik untuk unggah atau seret file ke sini</p>
                                                    <p className="font-body-sm text-sm text-text-muted dark:text-on-primary/50">PNG, JPG, atau GIF (maks. 5MB)</p>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {submitStatus === 'error' && (
                                        <p className="text-red-600 text-sm bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-lg">{submitMsg}</p>
                                    )}

                                    <div className="pt-4 border-t border-border-subtle dark:border-primary-container/50 flex justify-end">
                                        <button type="submit" disabled={submitStatus === 'loading'} className="bg-primary hover:bg-primary-fixed-variant dark:bg-primary-fixed-dim dark:hover:bg-primary-fixed text-on-primary dark:text-primary font-label-md text-label-md py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 disabled:opacity-60">
                                            {submitStatus === 'loading' ? <span className="material-symbols-outlined animate-spin text-[18px]">autorenew</span> : <span className="material-symbols-outlined text-[18px]">send</span>}
                                            {submitStatus === 'loading' ? 'Mengirim...' : 'Kirim Laporan'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Emergency Contacts */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="sticky top-28 bg-[#93000a] text-white rounded-2xl shadow-sm p-6 md:p-8 overflow-hidden relative">
                            <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                            <div className="flex items-center gap-3 mb-6 relative z-10">
                                <span className="material-symbols-outlined text-[32px]">warning</span>
                                <h3 className="font-headline-md text-headline-sm">Kontak<br/>Darurat</h3>
                            </div>
                            <p className="text-white/80 font-body-md text-body-md mb-8 relative z-10">
                                Untuk bantuan segera atau darurat yang mengancam jiwa, hubungi nomor berikut secara langsung.
                            </p>
                            <ul className="space-y-4 relative z-10">
                                {emergencyContacts.map((contact: any, idx: number) => (
                                    <li key={idx} className="flex items-center justify-between p-4 bg-black/20 rounded-xl hover:bg-black/30 transition-colors cursor-pointer border border-transparent hover:border-white/10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-[20px]">{contact.icon || 'phone'}</span>
                                            </div>
                                            <div>
                                                <p className="font-label-sm text-label-sm text-white/70">{contact.label}</p>
                                                <a href={`tel:${contact.phone}`} className="font-label-md text-label-md text-white hover:underline">{contact.phone}</a>
                                            </div>
                                        </div>
                                        <span className="material-symbols-outlined">call</span>
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
