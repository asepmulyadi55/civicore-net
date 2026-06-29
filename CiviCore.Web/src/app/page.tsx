import HomePageClient from './HomePageClient';

export const revalidate = 60; // ISR every 60 seconds

const API_URL = 'http://localhost:5075';

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
        const res = await fetch(`${API_URL}/api/property?status=Available`, { next: { revalidate: 60 } });
        if (!res.ok) return { data: [] };
        return res.json();
    } catch {
        return { data: [] };
    }
}

export default async function Page() {
    const hero = await getData('hero');
    const events = await getData('events');
    const gallerySettings = await getData('gallery-settings');
    const gallery = await getData('gallery');
    const bulletin = await getData('bulletin');
    const footer = await getData('footer');
    const propertiesData = await getProperties();
    
    // Properties pagination endpoint returns { data: [...], meta: {...} }
    const properties = propertiesData?.data?.slice(0, 3) || []; 

    return (
        <HomePageClient 
            hero={hero || {}} 
            events={events || []} 
            gallerySettings={gallerySettings || {}} 
            gallery={gallery || []} 
            bulletins={bulletin || []} 
            properties={properties} 
            footerData={footer || {}}
            apiUrl={API_URL}
        />
    );
}
