import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function TopNavBar({ activeTab, setActiveTab, isDark, toggleDark }: any) {
    const navLinks = [
        { id: 'home', label: 'Home', href: '/' },
        { id: 'property', label: 'Properties', href: '/property' },
        { id: 'events', label: 'Events', href: '/#events' },
        { id: 'gallery', label: 'Gallery', href: '/#gallery' },
        { id: 'bulletins', label: 'Bulletins', href: '/#bulletins' },
        { id: 'contact', label: 'Contact', href: '#contact' },
    ];

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <header className="fixed top-0 w-full z-50 bg-surface-glass backdrop-blur-md dark:bg-primary/80 border-b border-border-subtle dark:border-primary-container shadow-sm transition-all duration-300">
            <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop h-20 max-w-container-max mx-auto">
                <a className="text-headline-sm font-headline-sm font-bold text-primary dark:text-primary-fixed-dim flex items-center gap-2 scale-95 active:scale-90 transition-transform" href="/" onClick={() => setActiveTab('home')}>
                    <img alt="Community Logo" className="h-8 w-8 object-contain rounded-full bg-surface-container dark:bg-primary-container" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAh5mErpvIJnoPbyiiUpIFLnHZAxIINopH427UxwS3p3vHEcEItFwg2Lf3ekKgWlXS9bYV03ETIDY0bPfMD4jl7I8J5ycPQj7KxfMSLSIdsemXyKt_OV4UkMnOsizBO_E1ZE_3VSCA2Rdzxr_XVfFHY_St3H3EXEdn-GY21dDXVwV2oTL1nnqLo0iF0RZKQz6DYgS4ECJvQdgERdhzhOqcsiZW97gcfojRbqJ-nT5GRdQgbPqhzJOMCIVgcj_rK7sq6nrt6T4LwpW8" />
                    <span>Dwipapuri <span className="hidden sm:inline">Residence</span></span>
                </a>
                <nav className="hidden md:flex items-center gap-gutter">
                    {navLinks.map((link) => {
                        const isActive = activeTab === link.id;
                        return (
                            <a 
                                key={link.id} 
                                href={link.href}
                                onClick={() => setActiveTab(link.id)}
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
                    <button onClick={toggleDark} aria-label="Toggle Dark Mode" className="text-on-surface-variant dark:text-on-primary/80 hover:text-primary dark:hover:text-primary-fixed-dim transition-colors scale-95 active:scale-90 p-1 sm:p-2">
                        <span className="material-symbols-outlined">{isDark ? 'light_mode' : 'dark_mode'}</span>
                    </button>
                    <button aria-label="Change Language" className="text-on-surface-variant dark:text-on-primary/80 hover:text-primary dark:hover:text-primary-fixed-dim transition-colors scale-95 active:scale-90 p-1 sm:p-2">
                        <span className="material-symbols-outlined">language</span>
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
                                onClick={() => { setActiveTab(link.id); setIsMobileMenuOpen(false); }}
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
