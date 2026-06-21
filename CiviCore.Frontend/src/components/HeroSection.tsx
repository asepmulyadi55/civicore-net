// @ts-nocheck
import React from 'react';

const DEFAULTS = {
    title: '',
    subtitle: '',
    cta_text: '',
    bg_image: '',
};

export default function HeroSection({ hero = {}, loading }) {
    const title    = hero?.title    || DEFAULTS.title;
    const subtitle = hero?.subtitle || DEFAULTS.subtitle;
    const ctaText  = hero?.cta_text || DEFAULTS.cta_text;
    const bgImage  = hero?.bg_image || DEFAULTS.bg_image;

    const heroStyle = bgImage ? {
        backgroundImage: `linear-gradient(to bottom, rgba(15,18,33,0.65), rgba(15,18,33,0.45)), url('${bgImage}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
    } : { backgroundColor: '#1C2D27' };

    return (
        <section
            className="flex items-center justify-center text-center px-4 min-h-[700px] pb-32 pt-20"
            style={heroStyle}
        >
            <div className="max-w-3xl">
                {loading ? (
                    <div className="h-16 w-96 mx-auto bg-white/10 animate-pulse rounded-2xl mb-6" />
                ) : (
                    <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 drop-shadow-md leading-tight">
                        {title}
                    </h1>
                )}

                {loading ? (
                    <div className="h-8 w-80 mx-auto bg-white/10 animate-pulse rounded-xl mb-10" />
                ) : (
                    <p className="text-lg md:text-xl text-white/90 mb-10 leading-relaxed drop-shadow-sm">
                        {subtitle}
                    </p>
                )}
            </div>
        </section>
    );
}
