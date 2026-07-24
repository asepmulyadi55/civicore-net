"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import TopNavBar from '@/components/TopNavBar';
import Footer from '@/components/Footer';

export default function BulletinDetailPage() {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState('bulletins');
    const [bulletin, setBulletin] = useState<any>(null);
    const [recentBulletins, setRecentBulletins] = useState<any[]>([]);
    const [footerData, setFooterData] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const allPhotos = [
        ...(bulletin?.image_url ? [{ id: 'cover', image_url: bulletin.image_url }] : []),
        ...(bulletin?.photos || [])
    ];

    // Keyboard navigation for lightbox
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (selectedIndex === null || allPhotos.length === 0) return;
            if (e.key === 'Escape') setSelectedIndex(null);
            if (e.key === 'ArrowLeft') setSelectedIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : (allPhotos.length - 1)));
            if (e.key === 'ArrowRight') setSelectedIndex((prev) => (prev !== null && prev < allPhotos.length - 1 ? prev + 1 : 0));
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedIndex, allPhotos]);

    const [isDark, setIsDark] = useState(() => {
        try { return localStorage.getItem('homepageDark') === 'true'; } catch { return false; }
    });

    // Message Support modal state
    const [showMsgModal, setShowMsgModal] = useState(false);
    const [msgName, setMsgName] = useState('');
    const [msgPhone, setMsgPhone] = useState('');
    const [msgText, setMsgText] = useState('');
    const [msgStatus, setMsgStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [msgError, setMsgError] = useState('');

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

    useEffect(() => {
        window.scrollTo(0, 0);
        setLoading(true);
        fetch(`/api/homepage/bulletin/${id}`)
            .then(res => res.json())
            .then(data => setBulletin(data))
            .catch(() => setBulletin(null))
            .finally(() => setLoading(false));

        fetch(`/api/homepage/bulletin`)
            .then(res => res.json())
            .then(data => setRecentBulletins(data))
            .catch(console.error);

        fetch('/api/homepage/footer')
            .then(res => res.json())
            .then(data => setFooterData(data))
            .catch(console.error);
    }, [id]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsgStatus('loading');
        setMsgError('');
        try {
            const form = new FormData();
            form.append('name', msgName);
            form.append('phone', msgPhone);
            form.append('message', msgText);
            form.append('related_to', bulletin?.title || '');
            const token = await new Promise((resolve) => {
                (window as any).grecaptcha.ready(() => {
                    (window as any).grecaptcha.execute('6LcYAU4tAAAAAIOUBvSBiUsCre0iHTwZRds2WpI5', { action: 'submit' }).then(resolve);
                });
            });
            form.append('captchaToken', token as string);
            const res = await fetch('/api/homepage/submit/message', { method: 'POST', body: form });
            const data = await res.json();
            if (res.ok) {
                setMsgStatus('success');
            } else {
                setMsgStatus('error');
                setMsgError(data.message || 'Terjadi kesalahan.');
            }
        } catch {
            setMsgStatus('error');
            setMsgError('Tidak dapat terhubung ke server.');
        }
    };

    if (loading) {
        return (
            <div className="bg-surface-container-lowest dark:bg-primary text-on-surface dark:text-on-primary font-body-md antialiased min-h-screen flex flex-col justify-center items-center">
                <span className="material-symbols-outlined text-4xl text-primary animate-spin">autorenew</span>
            </div>
        );
    }

    if (!bulletin || bulletin.message) {
        return (
            <div className="bg-surface-container-lowest dark:bg-primary text-on-surface dark:text-on-primary font-body-md antialiased min-h-screen flex flex-col">
                <TopNavBar activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} toggleDark={toggleDark} />
                <main className="flex-grow pt-32 text-center">
                    <h1 className="text-display-lg text-primary dark:text-primary-fixed-dim mb-4">Buletin Tidak Ditemukan</h1>
                    <Link href="/bulletins" className="text-[#b45309] hover:underline">Kembali ke Buletin</Link>
                </main>
                <Footer setActiveTab={setActiveTab} />
            </div>
        );
    }

    return (
        <div className="bg-surface-container-lowest dark:bg-primary text-on-surface dark:text-on-primary font-body-md antialiased min-h-screen flex flex-col transition-colors duration-300">
            <TopNavBar activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} toggleDark={toggleDark} />

            <main className="flex-grow px-margin-mobile md:px-margin-desktop pt-32 pb-section-gap max-w-container-max mx-auto w-full">
                {/* Breadcrumb */}
                <div className="mb-8">
                    <div className="flex items-center space-x-2 text-text-muted dark:text-on-primary/70 font-label-sm text-label-sm">
                        <Link className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors" href="/bulletins">Buletin</Link>
                        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                        <span className="text-on-surface dark:text-on-primary truncate max-w-[200px] sm:max-w-xs">{bulletin.title}</span>
                    </div>
                </div>

                {/* Article Header */}
                <header className="mb-12 max-w-3xl">
                    <div className="flex items-center space-x-4 mb-4">
                        <span className="bg-primary-container/10 dark:bg-primary-fixed-dim/10 text-primary-container dark:text-primary-fixed-dim px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider">
                            Buletin
                        </span>
                        <div className="flex items-center text-text-muted dark:text-on-primary/50 text-label-sm font-label-sm">
                            <span className="material-symbols-outlined text-[16px] mr-1.5">calendar_month</span>
                            {bulletin.date ? new Date(bulletin.date).toLocaleDateString('id-ID', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}
                        </div>
                    </div>

                    <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-md md:text-display-md text-primary dark:text-primary-fixed-dim mb-6">
                        {bulletin.title}
                    </h1>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
                    {/* Main Text Column */}
                    <article className="lg:col-span-8 space-y-8 font-body-md text-body-md text-on-surface dark:text-on-primary/90 leading-relaxed">
                        {bulletin.image_url && (
                            <div
                                tabIndex={0}
                                role="button"
                                onClick={() => setSelectedIndex(0)}
                                onKeyDown={(e) => { if (["Enter", " "].includes(e.key)) { e.preventDefault(); setSelectedIndex(0); } }}
                                className="relative group cursor-pointer rounded-xl overflow-hidden shadow-sm mb-10 border border-border-subtle/50 dark:border-primary-container/50 bg-surface-container-lowest dark:bg-primary-container"
                                title="Klik untuk memperbesar / Click to zoom"
                            >
                                <img
                                    alt={bulletin.title || "Sampul Buletin"}
                                    className="w-full h-auto max-h-[500px] object-cover group-hover:scale-[1.01] transition-transform duration-300"
                                    src={bulletin.image_url}
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                                        <span className="material-symbols-outlined text-sm">zoom_in</span>
                                        <span>Perbesar Gambar</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="rte-content" dangerouslySetInnerHTML={{ __html: (bulletin.description || '').replace(/&nbsp;/g, ' ') }} />

                        {/* Gallery Photos Sub-list */}
                        {bulletin.photos && bulletin.photos.length > 0 && (
                            <div className="pt-6 border-t border-border-subtle dark:border-primary-container/50">
                                <h3 className="font-headline-sm text-headline-sm text-on-surface dark:text-on-primary mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary dark:text-primary-fixed-dim">collections</span>
                                    Galeri Foto ({bulletin.photos.length})
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    {bulletin.photos.slice(0, 6).map((img: any, idx: number) => {
                                        const isLastAndMore = idx === 5 && bulletin.photos.length > 6;
                                        const photoIndex = bulletin.image_url ? idx + 1 : idx;
                                        return (
                                            <div
                                                key={img.id || idx}
                                                tabIndex={0}
                                                role="button"
                                                onClick={() => setSelectedIndex(photoIndex)}
                                                onKeyDown={(e) => { if (["Enter", " "].includes(e.key)) { e.preventDefault(); setSelectedIndex(photoIndex); } }}
                                                className="cursor-pointer group relative rounded-xl overflow-hidden aspect-[4/3] shadow-sm hover:shadow-md border border-border-subtle/50 dark:border-primary-container/50 bg-surface-container-lowest dark:bg-primary-container"
                                            >
                                                <img alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" src={img.image_url} />
                                                {isLastAndMore ? (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 group-hover:bg-black/70 transition-colors backdrop-blur-[2px]">
                                                        <span className="text-white font-headline-md text-headline-md font-bold">+{bulletin.photos.length - 6} Lagi</span>
                                                    </div>
                                                ) : (
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </article>

                    {/* Sidebar */}
                    <aside className="lg:col-span-4 space-y-8 mt-12 lg:mt-0">
                        {/* Contact Card */}
                        <div className="bg-surface-glass dark:bg-primary-container backdrop-blur-md border border-border-subtle dark:border-primary-container/50 rounded-xl p-6 shadow-sm">
                            <h3 className="font-headline-sm text-headline-sm text-primary dark:text-primary-fixed-dim mb-6 border-b border-border-subtle dark:border-primary-container/50 pb-4">Info Kontak</h3>
                            <div className="space-y-4 font-body-md text-body-md dark:text-on-primary/90">
                                {(footerData.contact_phone) && (
                                    <div className="flex items-start">
                                        <span className="material-symbols-outlined text-primary-container dark:text-primary-fixed-dim mr-3 mt-1">phone</span>
                                        <div>
                                            <p className="font-label-md text-label-md text-on-surface-variant dark:text-on-primary/70">Nomor Kontak</p>
                                            <p className="font-semibold">{footerData.contact_phone}</p>
                                        </div>
                                    </div>
                                )}
                                {(footerData.contact_email) && (
                                    <div className="flex items-start">
                                        <span className="material-symbols-outlined text-primary-container dark:text-primary-fixed-dim mr-3 mt-1">mail</span>
                                        <div>
                                            <p className="font-label-md text-label-md text-on-surface-variant dark:text-on-primary/70">Email</p>
                                            <a className="text-[#b45309] dark:text-[#d97706] hover:underline" href={`mailto:${footerData.contact_email}`}>{footerData.contact_email}</a>
                                        </div>
                                    </div>
                                )}
                                {(footerData.location) && (
                                    <div className="flex items-start">
                                        <span className="material-symbols-outlined text-primary-container dark:text-primary-fixed-dim mr-3 mt-1">location_on</span>
                                        <div>
                                            <p className="font-label-md text-label-md text-on-surface-variant dark:text-on-primary/70">Lokasi</p>
                                            <p className="font-semibold">{footerData.location}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <button onClick={() => setShowMsgModal(true)} className="w-full mt-6 bg-[#b45309] hover:bg-[#8b4006] text-white font-label-md text-label-md py-3 px-4 rounded-lg shadow transition-colors flex items-center justify-center gap-2 cursor-pointer">
                                <span className="material-symbols-outlined text-sm">chat</span> Hubungi Penerbit
                            </button>
                        </div>

                        {/* Recent Bulletins */}
                        <div className="bg-surface-glass dark:bg-primary-container backdrop-blur-md border border-border-subtle dark:border-primary-container/50 rounded-xl p-6 shadow-sm">
                            <h3 className="font-headline-sm text-headline-sm text-primary dark:text-primary-fixed-dim mb-6 border-b border-border-subtle dark:border-primary-container/50 pb-4">Pengumuman Terbaru</h3>
                            <div className="space-y-4">
                                {recentBulletins.filter(b => b.id !== bulletin.id).slice(0, 4).map((b: any) => (
                                    <Link key={b.id} href={`/bulletins/${b.id}`} className="block group">
                                        <p className="font-label-sm text-label-sm text-text-muted dark:text-on-primary/50 mb-1">{b.date ? new Date(b.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</p>
                                        <p className="font-body-md text-body-md font-semibold text-on-surface dark:text-on-primary group-hover:text-primary dark:group-hover:text-primary-fixed-dim transition-colors line-clamp-2">{b.title}</p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </aside>
                </div>
            </main>

            {/* Message Support Modal */}
            {showMsgModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" tabIndex={0} role="button" onClick={() => setShowMsgModal(false)} onKeyDown={(e) => { if (["Enter", " "].includes(e.key)) { e.preventDefault(); setShowMsgModal(false); } }}>
                    <div className="bg-surface-container-lowest dark:bg-primary-container rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-border-subtle dark:border-primary-container/50 relative" tabIndex={0} role="button" onClick={e => e.stopPropagation()} onKeyDown={(e) => { if (["Enter", " "].includes(e.key)) { e.preventDefault(); e.stopPropagation(); } }}>
                        <button onClick={() => setShowMsgModal(false)} className="absolute top-4 right-4 text-text-muted hover:text-on-surface dark:hover:text-on-primary cursor-pointer">
                            <span className="material-symbols-outlined">close</span>
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-[#b45309]/10 text-[#b45309] rounded-xl">
                                <span className="material-symbols-outlined text-2xl">chat</span>
                            </div>
                            <div>
                                <h3 className="font-headline-sm text-headline-sm text-on-surface dark:text-on-primary">Hubungi Penerbit</h3>
                                <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-on-primary/70">Kirim pesan langsung terkait buletin ini</p>
                            </div>
                        </div>

                        {msgStatus === 'success' ? (
                            <div className="text-center py-6 space-y-4">
                                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                                    <span className="material-symbols-outlined text-3xl">check_circle</span>
                                </div>
                                <h4 className="font-headline-sm text-headline-sm text-on-surface dark:text-on-primary">Pesan Terkirim!</h4>
                                <p className="font-body-md text-body-md text-on-surface-variant dark:text-on-primary/70">Terima kasih. Pengurus akan segera membalas pesan Anda.</p>
                                <button onClick={() => { setShowMsgModal(false); setMsgStatus('idle'); }} className="mt-4 bg-[#b45309] text-white px-6 py-2.5 rounded-lg font-label-md">Tutup</button>
                            </div>
                        ) : (
                            <form onSubmit={handleSendMessage} className="space-y-4">
                                <div>
                                    <label className="block font-label-sm text-label-sm text-on-surface dark:text-on-primary/70 mb-1" htmlFor="msg-name">Nama Lengkap</label>
                                    <input required id="msg-name" type="text" value={msgName} onChange={e => setMsgName(e.target.value)} placeholder="Mis. John Doe" className="w-full rounded-lg border border-border-subtle dark:border-primary-container/50 bg-background dark:bg-primary text-on-surface dark:text-on-primary font-body-md py-3 px-4 focus:outline-none focus:ring-1 focus:ring-primary" />
                                </div>
                                <div>
                                    <label className="block font-label-sm text-label-sm text-on-surface dark:text-on-primary/70 mb-1" htmlFor="msg-phone">Nomor Telepon</label>
                                    <input id="msg-phone" type="tel" value={msgPhone} onChange={e => setMsgPhone(e.target.value)} placeholder="+62..." className="w-full rounded-lg border border-border-subtle dark:border-primary-container/50 bg-background dark:bg-primary text-on-surface dark:text-on-primary font-body-md py-3 px-4 focus:outline-none focus:ring-1 focus:ring-primary" />
                                </div>
                                <div>
                                    <label className="block font-label-sm text-label-sm text-on-surface dark:text-on-primary/70 mb-1" htmlFor="msg-text">Pesan</label>
                                    <textarea required id="msg-text" rows={4} value={msgText} onChange={e => setMsgText(e.target.value)} placeholder="Tuliskan pertanyaan atau pesan Anda..." className="w-full rounded-lg border border-border-subtle dark:border-primary-container/50 bg-background dark:bg-primary text-on-surface dark:text-on-primary font-body-md py-3 px-4 resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
                                </div>
                                {msgStatus === 'error' && (
                                    <p className="text-red-600 text-sm">{msgError}</p>
                                )}
                                <button type="submit" disabled={msgStatus === 'loading'} className="w-full bg-[#b45309] hover:bg-[#8b4006] text-white font-label-md py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                                    {msgStatus === 'loading' ? <span className="material-symbols-outlined animate-spin text-sm">autorenew</span> : <span className="material-symbols-outlined text-sm">send</span>}
                                    {msgStatus === 'loading' ? 'Mengirim...' : 'Kirim Pesan'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Lightbox */}
            {selectedIndex !== null && allPhotos.length > 0 && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm" tabIndex={0} role="button" onClick={() => setSelectedIndex(null)} onKeyDown={(e) => { if (["Enter", " "].includes(e.key)) { e.preventDefault(); setSelectedIndex(null); } }}>
                    <button
                        onClick={() => setSelectedIndex(null)}
                        className="absolute top-6 right-6 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full p-2 transition-colors z-[110] cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-3xl">close</span>
                    </button>
                    
                    <button
                        onClick={(e) => { e.stopPropagation(); setSelectedIndex(prev => prev !== null && prev > 0 ? prev - 1 : allPhotos.length - 1); }}
                        className="absolute left-6 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full p-3 transition-colors z-[110] cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-3xl">chevron_left</span>
                    </button>
                    
                    <div className="relative max-w-5xl max-h-[90vh] p-4 flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                        <img src={allPhotos[selectedIndex]?.image_url} alt="" className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl" />
                        <p className="text-white/80 text-sm mt-4 font-medium">
                            {selectedIndex + 1} / {allPhotos.length}
                        </p>
                    </div>

                    <button
                        onClick={(e) => { e.stopPropagation(); setSelectedIndex(prev => prev !== null && prev < allPhotos.length - 1 ? prev + 1 : 0); }}
                        className="absolute right-6 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full p-3 transition-colors z-[110] cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-3xl">chevron_right</span>
                    </button>
                </div>
            )}

            <Footer setActiveTab={setActiveTab} />
        </div>
    );
}
