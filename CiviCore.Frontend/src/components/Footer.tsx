import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer({ setActiveTab }: any) {
    return (
        <footer className="w-full py-section-gap bg-primary dark:bg-[#002117] border-t border-primary-container text-on-primary dark:text-on-primary" id="contact">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter px-margin-desktop max-w-container-max mx-auto mb-12">
                <div>
                    <h4 className="font-headline-sm text-headline-sm mb-6">Quick Links</h4>
                    <ul className="space-y-4 font-body-md text-body-md">
                        <li><a className="text-on-primary/80 hover:text-on-primary transition-colors hover:translate-x-1 inline-block opacity-90 hover:opacity-100" href="/" onClick={() => setActiveTab?.('home')}>Home</a></li>
                        <li><a className="text-on-primary/80 hover:text-on-primary transition-colors hover:translate-x-1 inline-block opacity-90 hover:opacity-100" href="/#events" onClick={() => setActiveTab?.('events')}>Events</a></li>
                        <li><a className="text-on-primary/80 hover:text-on-primary transition-colors hover:translate-x-1 inline-block opacity-90 hover:opacity-100" href="/#gallery" onClick={() => setActiveTab?.('gallery')}>Gallery</a></li>
                        <li><a className="text-on-primary/80 hover:text-on-primary transition-colors hover:translate-x-1 inline-block opacity-90 hover:opacity-100" href="/#bulletins" onClick={() => setActiveTab?.('bulletins')}>Bulletins</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-headline-sm text-headline-sm mb-6">Contact</h4>
                    <ul className="space-y-6 font-body-md text-body-md text-on-primary/80">
                        <li className="flex items-start gap-4">
                            <span className="material-symbols-outlined shrink-0">location_on</span>
                            <span>Jl. Desa Cipadung, Cipadung, Kec.<br />Cibiru, Kota Bandung, Jawa Barat<br />40615</span>
                        </li>
                        <li className="flex items-center gap-4">
                            <span className="material-symbols-outlined shrink-0">phone</span>
                            <span>+62 (0) 123 456 789</span>
                        </li>
                        <li className="flex items-center gap-4">
                            <span className="material-symbols-outlined shrink-0">mail</span>
                            <span>cs.dwipapuri@gmail.com</span>
                        </li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-headline-sm text-headline-sm mb-6">Submit Feedback</h4>
                    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                        <div>
                            <input className="w-full bg-transparent border-0 border-b border-on-primary/30 text-on-primary placeholder:text-on-primary/50 focus:ring-0 focus:border-on-primary transition-colors px-0 py-2 font-body-md" placeholder="Subject" type="text" />
                        </div>
                        <div>
                            <textarea className="w-full bg-transparent border-0 border-b border-on-primary/30 text-on-primary placeholder:text-on-primary/50 focus:ring-0 focus:border-on-primary transition-colors px-0 py-2 font-body-md resize-none" placeholder="Your message..." rows={3}></textarea>
                        </div>
                        <div className="flex justify-end">
                            <button className="group flex items-center gap-2 text-label-md font-label-md text-[#b45309] dark:text-[#d97706] hover:text-[#d97706] dark:hover:text-[#f59e0b] transition-colors uppercase tracking-wider" type="submit">
                                Send
                                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <div className="px-margin-desktop max-w-container-max mx-auto border-t border-on-primary/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="font-label-sm text-label-sm text-on-primary/70">
                    © 2026 Dwipapuri Residential. All rights reserved.
                </p>
                <div className="flex gap-6 font-label-sm text-label-sm">
                    <a className="text-on-primary/70 hover:text-on-primary transition-colors" href="#">Privacy Policy</a>
                    <a className="text-on-primary/70 hover:text-on-primary transition-colors" href="#">Terms of Service</a>
                </div>
            </div>
        </footer>
    );
}
