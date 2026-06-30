"use client";
// @ts-nocheck
import React from 'react';

const PLACEHOLDER_IMAGES = [
    'https://images.unsplash.com/photo-1528605105345-5344ea20e269?w=400&q=80&auto=format',
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&q=80&auto=format',
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=80&auto=format',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80&auto=format',
];

interface PastHighlightsProps {
    pastEvents?: any[];
    loading?: boolean;
}

export default function PastHighlights({ pastEvents = [], loading }: PastHighlightsProps) {
    const hasEvents = !loading && pastEvents.length > 0;

    return (
        <section className="py-32" style={{ background: 'linear-gradient(to bottom, #ffffff, #f5f5f5)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-3xl font-bold mb-4" style={{ color: '#1A237E' }}>Past Events</h2>
                <p className="text-slate-500 max-w-2xl mx-auto mb-16">
                    Browse photos and memories from our past community events.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="aspect-square bg-slate-100 rounded-2xl animate-pulse" />
                        ))
                    ) : hasEvents ? (
                        pastEvents.slice(0, 4).map((event, i) => {
                            const imgSrc = event.image_url || PLACEHOLDER_IMAGES[i % PLACEHOLDER_IMAGES.length];
                            const dateLabel = event.date
                                ? new Date(event.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                                : null;

                            return (
                                <div key={event.id || i}
                                    className="relative aspect-square rounded-2xl overflow-hidden shadow-sm group">
                                    <img
                                        src={imgSrc}
                                        alt={event.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4">
                                        <p className="text-white font-bold text-sm text-center leading-tight">{event.title}</p>
                                        {dateLabel && (
                                            <p className="text-white/70 text-xs mt-1">{dateLabel}</p>
                                        )}
                                        {event.url && (
                                            <a href={event.url} target="_blank" rel="noopener noreferrer"
                                                className="mt-3 px-4 py-1.5 bg-white/20 hover:bg-white/30 border border-white/40 text-white text-xs font-semibold rounded-lg transition-colors">
                                                Learn More
                                            </a>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-2 md:col-span-4 py-16 flex flex-col items-center justify-center gap-3">
                            <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-slate-400 font-semibold">No Past Events</p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
