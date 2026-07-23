import HomePageClient from './HomePageClient';
import type { Metadata } from 'next';

export const revalidate = 60; // ISR every 60 seconds

const API_URL = process.env.API_INTERNAL_URL || process.env.API_URL || 'http://localhost:5075';

async function getData(endpoint: string) {
    try {
        const res = await fetch(`${API_URL}/api/homepage/${endpoint}`, { next: { revalidate: 60 } });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

async function getProperties() {
    try {
        const res = await fetch(`${API_URL}/api/property`, { next: { revalidate: 60 } });
        if (!res.ok) return { data: [] };
        return res.json();
    } catch {
        return { data: [] };
    }
}

export async function generateMetadata(): Promise<Metadata> {
    const data = await getData('metadata');
    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dwipapuri.amsite.click';
    
    const title = data?.page_title || "Dwipapuri Residence - Portal Komunitas & Perumahan";
    const description = data?.meta_description || "Portal resmi Perumahan Dwipapuri Residence, Cipadung, Cibiru, Bandung. Berita warga, acara komunitas, fasilitas, dan informasi hunian.";
    const keywords = data?.meta_keywords || "perumahan, dwipapuri, cibiru, bandung, cipadung, dwipapuri residence";
    const ogImage = data?.og_image 
        ? (data.og_image.startsWith('http') ? data.og_image : `${SITE_URL}${data.og_image}`)
        : `${SITE_URL}/logo.png`;
    const siteName = data?.org_name || "Dwipapuri Residence";
    const ogTitle = data?.og_title || title;
    const ogDescription = data?.og_description || description;
    
    return {
        metadataBase: new URL(SITE_URL),
        title,
        description,
        keywords,
        icons: {
            icon: [
                { url: '/logo.png', type: 'image/png' },
                { url: '/favicon.ico', sizes: 'any' }
            ],
            shortcut: '/logo.png',
            apple: '/logo.png',
        },
        openGraph: {
            siteName: siteName,
            title: ogTitle,
            description: ogDescription,
            url: SITE_URL,
            type: "website",
            locale: "id_ID",
            images: [{ url: ogImage }],
        }
    };
}

export default async function Page() {
    const hero = await getData('hero');
    const events = await getData('events');
    const eventSettings = await getData('event-settings');
    const gallerySettings = await getData('gallery-settings');
    const gallery = await getData('gallery');
    const bulletinSettings = await getData('bulletin-settings');
    const bulletin = await getData('bulletin');
    const propertySettings = await getData('property-settings');
    const footer = await getData('footer');
    const propertiesData = await getProperties();
    const seoData = await getData('metadata');
    
    // Properties pagination endpoint returns { data: [...], meta: {...} }
    const properties = propertiesData?.data?.slice(0, 3) || []; 

    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dwipapuri.amsite.click';
    const siteName = seoData?.org_name || 'Dwipapuri Residence';

    const webSiteJsonLd = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: siteName,
        alternateName: ['Dwipapuri', `${siteName} Bandung`],
        url: SITE_URL,
    });

    const residenceJsonLd = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Residence',
        name: siteName,
        url: SITE_URL,
        logo: `${SITE_URL}/logo.png`,
        image: `${SITE_URL}/logo.png`,
        address: {
            '@type': 'PostalAddress',
            streetAddress: 'Jl. Desa Cipadung',
            addressLocality: 'Cipadung, Cibiru',
            addressRegion: 'Kota Bandung, Jawa Barat',
            postalCode: '40615',
            addressCountry: 'ID'
        },
        description: seoData?.meta_description || 'Dwipapuri Residence adalah kawasan hunian dan portal komunitas warga di Cipadung, Cibiru, Bandung.'
    });

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: webSiteJsonLd }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: residenceJsonLd }}
            />
            <HomePageClient 
                hero={hero || {}} 
                events={events || []} 
                eventSettings={eventSettings || {}} 
                gallerySettings={gallerySettings || {}} 
                gallery={gallery || []} 
                bulletinSettings={bulletinSettings || {}}
                bulletins={bulletin || []} 
                propertySettings={propertySettings || {}}
                properties={properties} 
                footerData={footer || {}}
                apiUrl={API_URL}
            />
        </>
    );
}
