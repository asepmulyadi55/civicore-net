// @ts-nocheck
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import FeaturedEvent from '../components/FeaturedEvent';
import UpcomingEvents from '../components/UpcomingEvents';
import Buletin from '../components/Buletin';
import PropertyListings from '../components/PropertyListings';
import MemorableMoments from '../components/MemorableMoments';
import AboutSection from '../components/AboutSection';
import Footer from '../components/Footer';

export default function HomePage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isDark, setIsDark] = useState(() => {
        try { return localStorage.getItem('homepageDark') === 'true'; } catch { return false; }
    });

    const toggleDark = () => {
        setIsDark(prev => {
            const next = !prev;
            try { localStorage.setItem('homepageDark', String(next)); } catch {}
            return next;
        });
    };

    useEffect(() => {
        const basePath = import.meta.env.VITE_APP_BASE ?? '';
        const apiKey = document.querySelector('meta[name="api-key"]')?.content ?? '';
        fetch(`${basePath}/api/homepage`, {
            headers: { 'X-Api-Key': apiKey },
        })
            .then(res => res.json())
            .then(json => {
                setData(json);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const isSimpleMode = (data?.featured_event?.type ?? 'full') === 'simple';
    return (
        <div className="font-sans" style={{ backgroundColor: isDark ? '#0D1A17' : '#f8f9fa', color: isDark ? '#F0EDE8' : '#2C2C2C', minHeight: '100vh', transition: 'background-color 0.3s, color 0.3s' }}>
            <Header isDark={isDark} toggleDark={toggleDark} />
            <main className={isSimpleMode ? '' : 'pt-20'}>
                <FeaturedEvent featuredEvent={data?.featured_event} loading={loading} isDark={isDark} eyebrow={data?.section_labels?.featured_eyebrow} />
                <UpcomingEvents events={data?.upcoming_events ?? []} loading={loading} isDark={isDark} eyebrow={data?.section_labels?.events_eyebrow} heading={data?.section_labels?.events_heading} />
                <MemorableMoments moments={data?.memorable_moments} pastEvents={data?.past_events ?? []} loading={loading} isDark={isDark} />
                <Buletin buletin={data?.buletin ?? []} loading={loading} isDark={isDark} eyebrow={data?.section_labels?.buletin_eyebrow} heading={data?.section_labels?.buletin_heading} />
                <PropertyListings listings={data?.property_listings ?? []} loading={loading} isDark={isDark} />
                <AboutSection about={data?.about} loading={loading} isDark={isDark} />
            </main>

            <Footer footer={data?.footer} isDark={isDark} />
        </div>
    );
}
