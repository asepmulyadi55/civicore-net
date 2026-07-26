"use client";
import React, { useState } from 'react';
import Link from 'next/link';

interface TopNavBarProps {
    activeTab?: string;
    setActiveTab?: (tab: string) => void;
    isDark?: boolean;
    toggleDark?: () => void;
}

export default function TopNavBar({ activeTab, setActiveTab, isDark, toggleDark }: TopNavBarProps) {
    const [navLinks, setNavLinks] = useState([
        { id: 'home', label: 'Home', href: '/' },
        { id: 'properties', label: 'Properties', href: '/#properties' },
        { id: 'news', label: 'News', href: '/#news' },
        { id: 'gallery', label: 'Gallery', href: '/#gallery' },
        { id: 'bulletins', label: 'Bulletins', href: '/#bulletins' },
        { id: 'contact', label: 'Contact', href: '#contact' },
    ]);

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    React.useEffect(() => {
        fetch('/api/navigation/public')
            .then(res => res.json())
            .then(res => {
                if (res.data && res.data.length > 0) {
                    const links = res.data
                        .filter((l: any) => l.showInNavigation)
                        .map((l: any) => {
                            let linkId = l.id;
                            if (l.url === '/') linkId = 'home';
                            else if (l.url && l.url.includes('#')) linkId = l.url.split('#').pop();

                            return {
                                id: linkId,
                                label: l.title,
                                href: l.url
                            };
                        });
                    if (links.length > 0) {
                        setNavLinks(links);
                    }
                }
            })
            .catch(console.error);
    }, []);

    return (
        <header className="fixed top-0 w-full z-50 bg-surface-glass backdrop-blur-md dark:bg-primary/80 border-b border-border-subtle dark:border-primary-container shadow-sm transition-all duration-300">
            <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop h-20 max-w-container-max mx-auto">
                <Link className="text-headline-sm font-headline-sm font-bold text-primary dark:text-primary-fixed-dim flex items-center gap-2 scale-95 active:scale-90 transition-transform" href="/" onClick={() => setActiveTab?.('home')}>
                    <img alt="Community Logo" className="h-8 w-8 object-contain rounded-full bg-surface-container dark:bg-primary-container" src="/logo.png" />
                    <span>Dwipapuri <span className="hidden sm:inline">Residence</span></span>
                </Link>
                <nav className="hidden md:flex items-center gap-gutter">
                    {navLinks.map((link) => {
                        const isActive = activeTab === link.id;
                        return (
                            <a
                                key={link.id}
                                href={link.href}
                                 tabIndex={0} role="button" onKeyDown={(e) => { if(e.key === "Enter" || e.key === " ") { e.preventDefault(); e.currentTarget.click(); } }} onClick={() => setActiveTab?.(link.id)}
                                className={`text-label-md font-label-md transition-all duration-300 rounded px-2 pb-1 ${isActive
                                    ? 'text-primary dark:text-primary-fixed-dim font-bold border-b-2 border-primary dark:border-primary-fixed-dim hover:bg-surface-container-low/50 dark:hover:bg-primary-container/50'
                                    : 'text-on-surface-variant dark:text-on-primary/80 hover:text-primary dark:hover:text-primary-fixed-dim hover:bg-surface-container-low/50 dark:hover:bg-primary-container/50'}`}
                            >
                                {link.label}
                            </a>
                        );
                    })}
                </nav>
                <div className="flex items-center gap-2 sm:gap-4">
                    <button onClick={toggleDark} aria-label="Ganti Mode Gelap" className="text-on-surface-variant dark:text-on-primary/80 hover:text-primary dark:hover:text-primary-fixed-dim transition-colors scale-95 active:scale-90 p-1 sm:p-2">
                        {isDark ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                        )}
                    </button>
                    <button
                        aria-label="Toggle Menu"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden text-on-surface-variant dark:text-on-primary/80 hover:text-primary dark:hover:text-primary-fixed-dim transition-colors scale-95 active:scale-90 p-1"
                    >
                        {isMobileMenuOpen ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-surface dark:bg-primary-container border-t border-border-subtle dark:border-primary-container/50 shadow-lg absolute w-full left-0 top-20 flex flex-col max-h-[calc(100vh-80px)] overflow-y-auto">
                    {navLinks.map((link) => {
                        const isActive = activeTab === link.id;
                        return (
                            <a
                                key={link.id}
                                href={link.href}
                                 tabIndex={0} role="button" onKeyDown={(e) => { if(e.key === "Enter" || e.key === " ") { e.preventDefault(); e.currentTarget.click(); } }} onClick={() => { setActiveTab?.(link.id); setIsMobileMenuOpen(false); }}
                                className={`px-margin-mobile py-4 border-b border-border-subtle/50 dark:border-primary-container/50 font-label-md text-label-md ${isActive
                                    ? 'text-primary dark:text-primary-fixed-dim bg-surface-container-low/50 dark:bg-primary/20'
                                    : 'text-on-surface dark:text-on-primary/80 hover:bg-surface-container-low/50 dark:hover:bg-primary/20'}`}
                            >
                                {link.label}
                            </a>
                        );
                    })}
                </div>
            )}
        </header>
    );
}
