// @ts-nocheck
import React, { useState } from 'react';

const C = {
  primary:  '#1C2D27',
  secondary: '#D4AF37',
  surface:  '#FAF9F6',
};

export default function Footer({ footer = {}, isDark = false }) {
  const brandName   = footer.brand_name    || '';
  const tagline     = footer.tagline       || '';
  const quickLinks  = (footer.links?.length ? footer.links : []);
  const contactEmail   = footer.contact_email  || '';
  const contactPhone   = footer.contact_phone  || '';
  const location       = footer.location       || '';
  const facebookUrl    = footer.facebook_url   || null;
  const instagramUrl   = footer.instagram_url  || null;
  const copyright      = footer.copyright      || '';
  const bottomNote     = footer.bottom_note    || null;

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    const mailtoLink = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.location.href = mailtoLink;
  };

  return (
    <footer id="contact" style={{ backgroundColor: C.primary, color: C.surface }}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-12 max-w-7xl mx-auto px-6 md:px-8 py-12 md:py-20">

        {/* Brand */}
        <div className="space-y-4 md:space-y-6 md:pr-8">
          <div
            className="text-xl md:text-2xl font-semibold tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {brandName}
          </div>
          <p className="text-sm leading-relaxed font-light" style={{ color: `${C.surface}99` }}>
            {tagline}
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4
            className="font-medium mb-4 md:mb-6 tracking-wide text-sm md:text-base"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Quick Links
          </h4>
          <ul className="space-y-3 md:space-y-4 text-xs md:text-sm font-light" style={{ color: `${C.surface}99` }}>
            {quickLinks.map((link, i) => (
              <li key={i}>
                <a
                  href={link.url || '#'}
                  className="transition-colors"
                  onMouseEnter={e => e.currentTarget.style.color = C.secondary}
                  onMouseLeave={e => e.currentTarget.style.color = `${C.surface}99`}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4
            className="font-medium mb-4 md:mb-6 tracking-wide text-sm md:text-base"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Contact
          </h4>
          <ul className="space-y-3 md:space-y-4 text-xs md:text-sm font-light" style={{ color: `${C.surface}99` }}>
            <li className="flex items-start gap-3">
              <span className="material-symbols-outlined text-base opacity-70 mt-0.5">location_on</span>
              {location}
            </li>
            <li className="flex items-center gap-3">
              <span className="material-symbols-outlined text-base opacity-70">call</span>
              {contactPhone}
            </li>
            <li className="flex items-center gap-3">
              <span className="material-symbols-outlined text-base opacity-70">mail</span>
              {contactEmail}
            </li>
          </ul>
        </div>

        {/* Submit Feedback */}
        <div>
          <h4
            className="font-medium mb-4 md:mb-6 tracking-wide text-sm md:text-base"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Submit Feedback
          </h4>
          <form onSubmit={handleFeedbackSubmit} className="space-y-4">
            <div className="border-b pb-1" style={{ borderColor: `${C.surface}33` }}>
              <input
                type="text"
                placeholder="Subject"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                required
                className="bg-transparent border-none px-0 py-1 text-xs md:text-sm w-full focus:ring-0 font-light placeholder:opacity-40"
                style={{ color: C.surface, fontFamily: "'Inter', sans-serif" }}
              />
            </div>
            <div className="border-b pb-1" style={{ borderColor: `${C.surface}33` }}>
              <textarea
                placeholder="Your message..."
                rows="2"
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
                className="bg-transparent border-none px-0 py-1 text-xs md:text-sm w-full focus:ring-0 font-light placeholder:opacity-40 resize-none"
                style={{ color: C.surface, fontFamily: "'Inter', sans-serif" }}
              ></textarea>
            </div>
            <div className="flex justify-end items-end pt-2">
              <button
                type="submit"
                className="transition-colors p-1 md:p-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider"
                style={{ color: C.secondary }}
                onMouseEnter={e => e.currentTarget.style.color = C.surface}
                onMouseLeave={e => e.currentTarget.style.color = C.secondary}
              >
                Send <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="border-t py-6 md:py-8 text-[10px] md:text-xs font-light flex flex-col sm:flex-row justify-between items-center px-6 md:px-8 max-w-7xl mx-auto gap-2"
        style={{ borderColor: `${C.surface}1A`, color: `${C.surface}66` }}
      >
        <span>{copyright}</span>
        {bottomNote && <span>{bottomNote}</span>}
      </div>
    </footer>
  );
}
