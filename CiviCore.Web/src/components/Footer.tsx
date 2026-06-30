"use client";
import React from 'react';
import Link from 'next/link';

interface FooterProps {
    setActiveTab?: (tab: string) => void;
    footerData?: any;
}

export default function Footer({ setActiveTab, footerData }: FooterProps) {
    const data = footerData || {};
    
    // Quick Links logic
    const defaultLinks = [
        { label: 'Home', url: '/' },
        { label: 'Events', url: '/#events' },
        { label: 'Gallery', url: '/#gallery' },
        { label: 'Bulletins', url: '/#bulletins' },
    ];
    
    const validLinks = data.links?.filter((l: any) => l.label) || [];
    const displayLinks = validLinks.length > 0 ? validLinks : defaultLinks;

    return (
        <footer className="w-full py-section-gap bg-primary dark:bg-[#002117] border-t border-primary-container text-on-primary dark:text-on-primary" id="contact">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter px-margin-desktop max-w-container-max mx-auto mb-12">
                <div>
                    <h4 className="font-headline-sm text-headline-sm mb-6">{data.brand_name || 'Quick Links'}</h4>
                    {data.tagline && <p className="text-body-md text-on-primary/80 mb-4">{data.tagline}</p>}
                    <ul className="space-y-4 font-body-md text-body-md">
                        {displayLinks.map((link: any, i: number) => (
                            <li key={i}>
                                <a className="text-on-primary/80 hover:text-on-primary transition-colors hover:translate-x-1 inline-block opacity-90 hover:opacity-100" href={link.url} onClick={() => setActiveTab?.(link.url.replace('/#', ''))}>
                                    {link.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h4 className="font-headline-sm text-headline-sm mb-6">Contact</h4>
                    <ul className="space-y-6 font-body-md text-body-md text-on-primary/80">
                        {data.location ? (
                            <li className="flex items-start gap-4">
                                <span className="material-symbols-outlined shrink-0 mt-1">location_on</span>
                                <div className="prose prose-sm prose-invert max-w-none text-on-primary/80 [&>p]:m-0" dangerouslySetInnerHTML={{ __html: data.location }} />
                            </li>
                        ) : (
                            <li className="flex items-start gap-4">
                                <span className="material-symbols-outlined shrink-0">location_on</span>
                                <span>Jl. Desa Cipadung, Cipadung, Kec.<br />Cibiru, Kota Bandung, Jawa Barat<br />40615</span>
                            </li>
                        )}
                        <li className="flex items-center gap-4">
                            <span className="material-symbols-outlined shrink-0">phone</span>
                            <span>{data.contact_phone || '+62 (0) 123 456 789'}</span>
                        </li>
                        <li className="flex items-center gap-4">
                            <span className="material-symbols-outlined shrink-0">mail</span>
                            <span>{data.contact_email || 'cs.dwipapuri@gmail.com'}</span>
                        </li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-headline-sm text-headline-sm mb-6">Need Help?</h4>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <p className="font-body-md text-body-md text-on-primary/80 mb-6">
                            Have an issue, complaint, or feedback for the community? Let us know.
                        </p>
                        <Link href="/report" className="group flex items-center justify-between w-full bg-[#b45309] hover:bg-[#8b4006] dark:bg-[#d97706] dark:hover:bg-[#b45309] text-white font-label-md text-label-md py-3 px-4 rounded-lg transition-colors">
                            File a Resident Report
                            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </Link>
                    </div>
                </div>
            </div>
            <div className="px-margin-desktop max-w-container-max mx-auto border-t border-on-primary/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex flex-col items-center md:items-start">
                    <p className="font-label-sm text-label-sm text-on-primary/70">
                        {data.copyright || '© 2026 Dwipapuri Residential. All rights reserved.'}
                    </p>
                    {data.bottom_note && (
                        <p className="font-label-sm text-label-sm text-on-primary/50 mt-1">
                            {data.bottom_note}
                        </p>
                    )}
                </div>
                <div className="flex gap-6 font-label-sm text-label-sm">
                    {data.facebook_url && <a className="text-on-primary/70 hover:text-on-primary transition-colors" href={data.facebook_url} target="_blank" rel="noreferrer">Facebook</a>}
                    {data.instagram_url && <a className="text-on-primary/70 hover:text-on-primary transition-colors" href={data.instagram_url} target="_blank" rel="noreferrer">Instagram</a>}
                    <a className="text-on-primary/70 hover:text-on-primary transition-colors" href="#">Privacy Policy</a>
                    <a className="text-on-primary/70 hover:text-on-primary transition-colors" href="#">Terms of Service</a>
                </div>
            </div>
        </footer>
    );
}
