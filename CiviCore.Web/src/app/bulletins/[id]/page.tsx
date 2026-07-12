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
                            <img
                                alt={bulletin.title || "Sampul Buletin"}
                                className="w-full h-auto max-h-[400px] rounded-xl shadow-sm object-cover mb-10"
                                src={bulletin.image_url}
                            />
                        )}
                        <div className="rte-content" dangerouslySetInnerHTML={{ __html: (bulletin.description || '').replace(/&nbsp;/g, ' ') }} />
                    </article>

                    {/* Sidebar */}
                    <aside className="lg:col-span-4 space-y-8 mt-12 lg:mt-0">
                        {/* Contact Card */}
                        <div className="bg-surface-glass dark:bg-primary-container backdrop-blur-md border border-border-subtle dark:border-primary-container/50 rounded-xl p-6 shadow-sm">
                            <h3 className="font-headline-sm text-headline-sm text-primary dark:text-primary-fixed-dim mb-6 border-b border-border-subtle dark:border-primary-container/50 pb-4">Kantor Manajemen</h3>
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
                                            <p className="font-label-md text-label-md text-on-surface-variant dark:text-on-primary/70">Lokasi Kantor</p>
                                            <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0" dangerouslySetInnerHTML={{ __html: footerData.location }} />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => { setShowMsgModal(true); setMsgStatus('idle'); }}
                                className="w-full mt-8 bg-[#b45309] text-white font-label-md text-label-md py-3 px-4 rounded-lg hover:bg-[#8b4006] transition-colors flex justify-center items-center"
                            >
                                <span className="material-symbols-outlined mr-2 text-sm">chat</span>
                                Hubungi Dukungan
                            </button>
                        </div>

                        {/* Related Bulletins */}
                        <div className="bg-surface dark:bg-primary-container rounded-xl p-6 border border-border-subtle dark:border-primary-container/50">
                            <h3 className="font-headline-sm text-headline-sm text-primary dark:text-primary-fixed-dim mb-6">Pengumuman Terbaru</h3>
                            <div className="space-y-6">
                                {recentBulletins.filter(b => b.id !== id).slice(0, 3).map((related, idx) => (
                                    <React.Fragment key={related.id}>
                                        <Link href={related.url || `/bulletins/${related.id}`} className="block group">
                                            <p className="font-label-sm text-label-sm text-on-surface-variant dark:text-on-primary/60 mb-1">{related.date ? new Date(related.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</p>
                                            <h4 className="font-body-md text-body-md font-semibold dark:text-on-primary/90 group-hover:text-primary dark:group-hover:text-primary-fixed-dim transition-colors">
                                                {related.title}
                                            </h4>
                                        </Link>
                                        {idx < 2 && <div className="h-px w-full bg-border-subtle dark:bg-primary-container/50"></div>}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </aside>
                </div>
            </main>

            {/* Message Support Modal */}
            {showMsgModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"  tabIndex={0} role="button" onKeyDown={(e) => { if(e.key === "Enter" || e.key === " ") { e.preventDefault(); e.currentTarget.click(); } }} onClick={() => setShowMsgModal(false)}>
                    <div className="bg-surface dark:bg-primary-container rounded-2xl shadow-2xl p-8 w-full max-w-md relative"  tabIndex={0} role="button" onKeyDown={(e) => { if(e.key === "Enter" || e.key === " ") { e.preventDefault(); e.currentTarget.click(); } }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowMsgModal(false)} className="absolute top-4 right-4 text-text-muted hover:text-primary transition-colors">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                        <h2 className="font-headline-sm text-headline-sm text-primary dark:text-primary-fixed-dim mb-2">Hubungi Manajemen</h2>
                        <p className="text-body-md text-text-muted dark:text-on-primary/70 mb-6">Terkait: <span className="font-semibold text-on-surface dark:text-on-primary">{bulletin.title}</span></p>

                        {msgStatus === 'success' ? (
                            <div className="text-center py-8">
                                <span className="material-symbols-outlined text-5xl text-green-600 mb-4 block">check_circle</span>
                                <p className="font-headline-sm text-primary dark:text-primary-fixed-dim">Pesan Terkirim!</p>
                                <p className="text-body-md text-text-muted mt-2">Tim kami akan segera merespons.</p>
                                <button onClick={() => setShowMsgModal(false)} className="mt-6 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-container transition-colors font-label-md">Tutup</button>
                            </div>
                        ) : (
                            <form onSubmit={handleSendMessage} className="space-y-4">
                                <div>
                                    <label className="block font-label-sm text-label-sm text-on-surface dark:text-on-primary/70 mb-1" htmlFor="msg-name">Nama Lengkap</label>
                                    <input required id="msg-name" type="text" value={msgName} onChange={e => setMsgName(e.target.value)} placeholder="Nama Anda" className="w-full rounded-lg border border-border-subtle dark:border-primary-container/50 bg-background dark:bg-primary text-on-surface dark:text-on-primary font-body-md py-3 px-4 focus:outline-none focus:ring-1 focus:ring-primary" />
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

            <Footer setActiveTab={setActiveTab} />
        </div>
    );
}
