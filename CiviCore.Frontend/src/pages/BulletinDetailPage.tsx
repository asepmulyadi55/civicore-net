import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import TopNavBar from '../components/TopNavBar';
import Footer from '../components/Footer';
import { MOCK_BULLETINS } from './BuletinPage';

export default function BulletinDetailPage() {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState('bulletins');
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

    useEffect(() => { window.scrollTo(0, 0); }, [id]);

    const bulletin = MOCK_BULLETINS.find(b => b.id === id);

    if (!bulletin) {
        return (
            <div className="bg-surface-container-lowest dark:bg-primary text-on-surface dark:text-on-primary font-body-md antialiased min-h-screen flex flex-col">
                <TopNavBar activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} toggleDark={toggleDark} />
                <main className="flex-grow pt-32 text-center">
                    <h1 className="text-display-lg text-primary dark:text-primary-fixed-dim mb-4">Bulletin Not Found</h1>
                    <Link to="/buletin" className="text-[#b45309] hover:underline">Back to Bulletins</Link>
                </main>
                <Footer setActiveTab={setActiveTab} />
            </div>
        );
    }

    return (
        <div className="bg-surface-container-lowest dark:bg-primary text-on-surface dark:text-on-primary font-body-md antialiased min-h-screen flex flex-col transition-colors duration-300">
            <TopNavBar activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} toggleDark={toggleDark} />
            
            <main className="flex-grow px-margin-mobile md:px-margin-desktop pt-32 pb-section-gap max-w-container-max mx-auto w-full">
                {/* Back Button */}
                <div className="mb-8">
                    <Link to="/buletin" className="inline-flex items-center text-on-surface-variant dark:text-on-primary/70 hover:text-primary dark:hover:text-primary-fixed-dim transition-colors font-label-md text-label-md group">
                        <span className="material-symbols-outlined mr-2 group-hover:-translate-x-1 transition-transform">arrow_back</span>
                        Back to Bulletins
                    </Link>
                </div>

                {/* Article Header */}
                <header className="mb-12 max-w-3xl">
                    <div className="flex items-center space-x-4 mb-4">
                        <span className="bg-primary-container/10 dark:bg-primary-fixed-dim/10 text-primary-container dark:text-primary-fixed-dim px-3 py-1 rounded-full font-label-sm text-label-sm uppercase tracking-wider">
                            {bulletin.category}
                        </span>
                        <span className="text-on-surface-variant dark:text-on-primary/70 font-label-sm text-label-sm flex items-center">
                            <span className="material-symbols-outlined text-sm mr-1">calendar_today</span>
                            {bulletin.date}
                        </span>
                    </div>
                    <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-primary dark:text-primary-fixed-dim mb-6">
                        {bulletin.title}
                    </h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant dark:text-on-primary/80 leading-relaxed">
                        {bulletin.description}
                    </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
                    {/* Main Text Column */}
                    <article className="lg:col-span-8 space-y-8 font-body-md text-body-md text-on-surface dark:text-on-primary/90 leading-relaxed">
                        <img 
                            alt="Bulletin Cover" 
                            className="w-full h-auto max-h-[400px] rounded-xl shadow-sm object-cover mb-10" 
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBFQFlNpD4ACjGn8bP3mgEfVzZcP0SqRsKzNYQx_Zog8Wt5CBOKEiOlGiRb5qzYakDSQecNn-_aa2JWdx-iv1wmtpPU3FExVclc7lJ_KvTFRtGRu4OYjqtYdjP1WDFC1iWY9tceoA4s3Biw6MdRdxSfuSfRD3EUXScKPh9znm9PX42fqNr33bJ-a1PlNPZ21lLhDhHCzjrG57ma2gWNVnTXvIUhk7TTJiHf7Ngyzb1fmi-yJviWFYuMha5a-qF-kyNVtI9yrDufpRQ"
                        />
                        <p>Dear Residents,</p>
                        <p>As part of our ongoing commitment to maintaining Dwipapuri Residence as a premier, secure, and serene community, we are rolling out significant upgrades to our infrastructure this month. These enhancements are designed to seamlessly integrate with your daily life while providing robust support.</p>
                        
                        <h2 className="font-headline-sm text-headline-sm text-primary dark:text-primary-fixed-dim mt-10 mb-4">Key Upgrades & Information</h2>
                        <p>Starting next month, we will transition to state-of-the-art systems to ensure maximum efficiency. Please review the following points:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-4 text-on-surface-variant dark:text-on-primary/80">
                            <li><strong>Efficiency:</strong> Faster processing and response times.</li>
                            <li><strong>Security:</strong> All personal data is encrypted and securely managed.</li>
                            <li><strong>Convenience:</strong> Mobile access for all critical resident services.</li>
                        </ul>

                        <h2 className="font-headline-sm text-headline-sm text-primary dark:text-primary-fixed-dim mt-10 mb-4">Action Required</h2>
                        <div className="bg-surface-container-low dark:bg-primary-container/30 p-6 rounded-lg border border-border-subtle dark:border-primary-container my-8 shadow-sm">
                            <h3 className="font-label-md text-label-md font-bold mb-2 flex items-center text-primary dark:text-primary-fixed-dim">
                                <span className="material-symbols-outlined mr-2 text-primary dark:text-primary-fixed-dim">info</span>
                                Important Notice
                            </h3>
                            <p className="text-sm dark:text-on-primary/80">Please ensure your contact information is up to date in the resident portal before the end of the month.</p>
                        </div>
                        
                        <p>We appreciate your cooperation during this transition period. These upgrades are a crucial step in future-proofing our community and safeguarding the tranquility we all cherish at Dwipapuri Residence.</p>
                    </article>

                    {/* Sidebar */}
                    <aside className="lg:col-span-4 space-y-8 mt-12 lg:mt-0">
                        {/* Contact Card */}
                        <div className="bg-surface-glass dark:bg-primary-container backdrop-blur-md border border-border-subtle dark:border-primary-container/50 rounded-xl p-6 shadow-sm">
                            <h3 className="font-headline-sm text-headline-sm text-primary dark:text-primary-fixed-dim mb-6 border-b border-border-subtle dark:border-primary-container/50 pb-4">Management Office</h3>
                            <div className="space-y-4 font-body-md text-body-md dark:text-on-primary/90">
                                <div className="flex items-start">
                                    <span className="material-symbols-outlined text-primary-container dark:text-primary-fixed-dim mr-3 mt-1">phone</span>
                                    <div>
                                        <p className="font-label-md text-label-md text-on-surface-variant dark:text-on-primary/70">Contact Number</p>
                                        <p className="font-semibold">+1 (555) 019-8273</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <span className="material-symbols-outlined text-primary-container dark:text-primary-fixed-dim mr-3 mt-1">mail</span>
                                    <div>
                                        <p className="font-label-md text-label-md text-on-surface-variant dark:text-on-primary/70">Email</p>
                                        <a className="text-[#b45309] dark:text-[#d97706] hover:underline" href="mailto:info@dwipapuri.com">info@dwipapuri.com</a>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <span className="material-symbols-outlined text-primary-container dark:text-primary-fixed-dim mr-3 mt-1">location_on</span>
                                    <div>
                                        <p className="font-label-md text-label-md text-on-surface-variant dark:text-on-primary/70">Office Location</p>
                                        <p>Main Pavilion</p>
                                    </div>
                                </div>
                            </div>
                            <button className="w-full mt-8 bg-[#b45309] text-white font-label-md text-label-md py-3 px-4 rounded-lg hover:bg-[#8b4006] transition-colors flex justify-center items-center">
                                <span className="material-symbols-outlined mr-2 text-sm">chat</span>
                                Message Support
                            </button>
                        </div>

                        {/* Related Bulletins */}
                        <div className="bg-surface dark:bg-primary-container rounded-xl p-6 border border-border-subtle dark:border-primary-container/50">
                            <h3 className="font-headline-sm text-headline-sm text-primary dark:text-primary-fixed-dim mb-6">Recent Announcements</h3>
                            <div className="space-y-6">
                                {MOCK_BULLETINS.filter(b => b.id !== id).slice(0, 3).map((related, idx) => (
                                    <React.Fragment key={related.id}>
                                        <Link to={`/buletin/${related.id}`} className="block group">
                                            <p className="font-label-sm text-label-sm text-on-surface-variant dark:text-on-primary/60 mb-1">{related.date}</p>
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

            <Footer setActiveTab={setActiveTab} />
        </div>
    );
}
