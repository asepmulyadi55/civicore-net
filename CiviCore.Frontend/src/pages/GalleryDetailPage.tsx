import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import TopNavBar from '../components/TopNavBar';
import Footer from '../components/Footer';
import { MOCK_ALBUMS } from './GalleryPage';

export const ALBUM_IMAGES: Record<string, any[]> = {
    'community-life': [
        {
            title: 'Master Plan Aerials',
            description: 'Sweeping sunset views over the luxury complex and central parklands.',
            image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDqmJbXJfWPbdc2pd8BtFwTYl1KGyL-YtzdJWtn6C-PLLYeGND0o9idmDEkCLCNadXGgEk1D4fczrphhSJwrRdQFTxhjEbSgye3NmOeVIuhT_QKw2fGu1lpXSl9gMn2R9scg5z09MOxMCxYoOf7LkuNdi34YzT6Q_VfZ3fAk7YiLbqlQlkcyb2qZoN9Be7w8EFfFiF5sZZCo46zPenk5RHo29Pk2H9rHqSZhvXUM0t5VHWRyzss9ONZBqgL1jCs8vK7MrpVHPNY1Og',
            colSpan: 'col-span-1 md:col-span-12 lg:col-span-8'
        },
        {
            title: 'The Clubhouse',
            description: 'Elegant social spaces designed for exclusive resident gatherings.',
            image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD55aFz8NDn0tXi_fzmIam_RZaFwDhAczD1L4kTGDx3sbMlR0oF0fEJB5qFaP04Btkcj6aHz6QlpxgzjIYCilYWKVHAUZys336usIkE5SzFmXdvI3NvErNZ0g2TMOrUu1c-4tth-d3jBfcLR85PhiVZ-By3Hj2sgF0VsRp1fP7NyU97aIp0YyjjBQkx4-gGQIjtxX_CFAevCygShudFFGofPbQX20yTk7WXTZJxCtg4SvhN88iP29cXUKzOB9OXHuNDpxl0_s61314',
            colSpan: 'col-span-1 md:col-span-6 lg:col-span-4'
        },
        {
            title: 'Signature Residences',
            description: 'Architectural excellence blending seamlessly with manicured lawns.',
            image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgQjp1zRS5bEW5kyJnCdZ1pKGLloPZ3aw2373P7YoJQxR38ckj8iywKwVpF_nfQx4Au2Pz06PyEa2J6icsa32JDPt89qDrrHUAgT8vrKg7v8uPHFMdQxiA_FQYzphaZlRonLb8CCp2GShtlfCPZgN3XvnCw3SgU_6a3cWY87CrCwnMHBFbgalIS-_U1l1WYLifoKpzrqiVFNudotHA7dWlTuGTlKnH8kl3CxjZk5nKDLy_ErWLfM8D79Ub5FFHIGLRaZddPTLri7c',
            colSpan: 'col-span-1 md:col-span-6 lg:col-span-6'
        },
        {
            title: 'Botanical Walkways',
            description: 'Tranquil mornings in the community gardens, bathed in soft sunlight.',
            image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAcYSxDLk_010u5mOyR_cijkXwWyIyptM-8yp5_4RAe6ZRQtodAbNSdHc80FooCWs9ykxeHdHLmLfIjpcGeZ-OXAN1f6bMyV0rpLYvBVnRktdK_B8EOFmp6JryCf9e7giLDFQGO5heJirDMTp6yQh2Q6umMQkmduc12_7S2HsFcPWX8wuAdf1GCtzCWfmn9P7XiZbVNUINPPQ5Z2c70y9eKeijUWwn-bFTTd2AI-P9MXrgXBehO0bMFqxGV4tLwuzGrD7GdGWcXw-w',
            colSpan: 'col-span-1 md:col-span-12 lg:col-span-6'
        }
    ]
};

export default function GalleryDetailPage() {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState('gallery');
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

    const album = MOCK_ALBUMS.find(a => a.id === id);
    const images = ALBUM_IMAGES[id || ''] || ALBUM_IMAGES['community-life'];

    if (!album) {
        return (
            <div className="bg-surface-container-lowest dark:bg-primary text-on-surface dark:text-on-primary font-body-md antialiased min-h-screen flex flex-col">
                <TopNavBar activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} toggleDark={toggleDark} />
                <main className="flex-grow pt-32 text-center">
                    <h1 className="text-display-lg text-primary dark:text-primary-fixed-dim mb-4">Album Not Found</h1>
                    <Link to="/gallery" className="text-[#b45309] hover:underline">Back to Gallery</Link>
                </main>
                <Footer setActiveTab={setActiveTab} />
            </div>
        );
    }

    return (
        <div className="bg-surface-container-lowest dark:bg-primary text-on-surface dark:text-on-primary font-body-md antialiased transition-colors duration-300 min-h-screen flex flex-col">
            <TopNavBar activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} toggleDark={toggleDark} />
            
            <main className="flex-grow pt-32 pb-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full">
                {/* Header Section */}
                <div className="mb-12 text-left">
                    <div className="flex items-center space-x-2 text-text-muted dark:text-on-primary/70 font-label-sm text-label-sm mb-6">
                        <Link className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors" to="/gallery">Gallery</Link>
                        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                        <span className="text-on-surface dark:text-on-primary truncate max-w-[200px] sm:max-w-xs">{album.title}</span>
                    </div>
                    <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-primary dark:text-primary-fixed-dim mb-4">{album.title}</h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant dark:text-on-primary/70 max-w-2xl">
                        {album.description}
                    </p>
                </div>

                {/* Bento Grid Gallery */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter md:auto-rows-[400px]">
                    {images.map((img, idx) => (
                        <div key={idx} className={`group relative rounded-2xl overflow-hidden ${img.colSpan} h-[300px] md:h-full shadow-sm hover:shadow-lg border border-border-subtle/50 dark:border-primary-container/50 bg-surface-container-lowest dark:bg-primary-container`}>
                            <img alt={img.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src={img.image_url} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80"></div>
                            <div className="absolute bottom-0 left-0 w-full p-6 bg-surface-glass dark:bg-black/60 backdrop-blur-md border-t border-border-subtle/20 dark:border-white/10 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                <h3 className="font-headline-sm text-headline-sm text-on-surface dark:text-on-primary mb-1">{img.title}</h3>
                                <p className="font-body-md text-body-md text-on-surface-variant dark:text-on-primary/80">{img.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            <Footer setActiveTab={setActiveTab} />
        </div>
    );
}
