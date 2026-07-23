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
                        <span className="material-symbols-outlined">{isDark ? 'light_mode' : 'dark_mode'}</span>
                    </button>
                    <button
                        aria-label="Toggle Menu"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden text-on-surface-variant dark:text-on-primary/80 hover:text-primary dark:hover:text-primary-fixed-dim transition-colors scale-95 active:scale-90 p-1"
                    >
                        <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
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
