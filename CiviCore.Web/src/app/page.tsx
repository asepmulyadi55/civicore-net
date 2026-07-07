import HomePageClient from './HomePageClient';
import type { Metadata } from 'next';

export const revalidate = 60; // ISR every 60 seconds

const API_URL = process.env.API_INTERNAL_URL || 'http://localhost:5075';

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
    
    const title = data?.page_title || "Dwipapuri - Community Events & Residential Living";
    const description = data?.meta_description || "Dwipapuri residential portal for community events, bulletins, and properties.";
    const keywords = data?.meta_keywords || "perumahan, dwipapuri, community";
    const FRONTEND_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const ogImage = data?.og_image ? (data.og_image.startsWith('http') ? data.og_image : `${FRONTEND_URL}${data.og_image}`) : null;
    const ogTitle = data?.og_title || title;
    const ogDescription = data?.og_description || description;
    
    return {
        title,
        description,
        keywords,
        openGraph: {
            title: ogTitle,
            description: ogDescription,
            ...(ogImage ? { images: [{ url: ogImage }] } : {}),
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
    
    // Properties pagination endpoint returns { data: [...], meta: {...} }
    const properties = propertiesData?.data?.slice(0, 3) || []; 

    return (
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
    );
}
