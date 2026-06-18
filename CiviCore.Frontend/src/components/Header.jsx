import React, { useState, useEffect } from 'react';

export default function Header({ isDark = false, toggleDark }) {
  const C = isDark ? {
    primary: '#D4AF37',
    secondary: '#D4AF37',
    surface: '#0D1A17',
    surfaceVar: '#1C2D27',
    onSurface: '#F0EDE8',
    onSurfaceVar: '#9E9C97',
  } : {
    primary: '#1C2D27',
    secondary: '#D4AF37',
    surface: '#FAF9F6',
    surfaceVar: '#E8E6E1',
    onSurface: '#2C2C2C',
    onSurfaceVar: '#595959',
  };

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Derive text colors based on scroll position
  const linkColor = scrolled ? C.onSurfaceVar : 'rgba(255,255,255,0.85)';
  const linkHoverColor = scrolled ? C.primary : '#ffffff';
  const iconColor = scrolled ? C.onSurfaceVar : 'rgba(255,255,255,0.85)';
  const iconHoverColor = scrolled ? C.primary : '#ffffff';
  const logoColor = scrolled ? C.primary : '#D4AF37'; // Gold at top, theme primary on scroll
  const hamburgerColor = scrolled ? C.primary : 'rgba(255,255,255,0.85)';

  const getAssetUrl = () => {
    const meta = document.querySelector('meta[name="asset-url"]');
    return meta ? meta.content : '/';
  };
  const logoImg = `${getAssetUrl()}logo.png`;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navStyle = {
    background: scrolled ? `${C.surface}F2` : 'rgba(0, 0, 0, 0.45)',
    backdropFilter: scrolled ? 'blur(16px)' : 'blur(12px)',
    WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'blur(12px)',
    border: scrolled ? '1px solid transparent' : '1px solid rgba(255, 255, 255, 0.1)',
    borderBottom: scrolled ? `1px solid ${C.surfaceVar}80` : '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: scrolled ? '0 4px 20px rgba(0,0,0,0.05)' : '0 10px 40px rgba(0,0,0,0.2)',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const navLinks = [
    { label: 'Events', href: '#events' },
    { label: 'Gallery', href: '#gallery' },
    { label: 'Bulletins', href: '#bulletins' },
    { label: 'About', href: '#about' },
  ];

  return (
    <div className={`fixed z-50 transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] ${scrolled ? 'top-0 inset-x-0' : 'top-4 inset-x-4 md:inset-x-8 max-w-7xl mx-auto'
      }`}>
      <nav
        className={`w-full ${scrolled ? 'rounded-none' : 'rounded-2xl'}`}
        style={navStyle}
      >
        <div className="flex justify-between items-center px-6 md:px-8 py-4">

          {/* Logo */}
          <a
            href={getAssetUrl()}
            className="flex items-center"
          >
            <img src={logoImg} alt="Dwipapuri" className="h-10 md:h-12 w-auto object-contain" />
          </a>

          {/* Mobile: dark toggle + hamburger */}
          <div className="md:hidden flex items-center gap-2">
            {toggleDark && (
              <button
                onClick={toggleDark}
                className="p-2 rounded-lg transition-colors"
                style={{ color: iconColor }}
                aria-label="Toggle dark mode"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {isDark ? 'light_mode' : 'dark_mode'}
                </span>
              </button>
            )}
            <button
              className="p-2"
              style={{ color: hamburgerColor, transition: 'color 0.35s ease' }}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <span className="material-symbols-outlined">
                {menuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>

          {/* Desktop nav links + dark toggle */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="font-medium tracking-wide text-sm transition-colors"
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  color: linkColor,
                  borderBottom: '1px solid transparent',
                  paddingBottom: '4px',
                  transition: 'color 0.35s ease',
                }}
                onClick={(e) => {
                  if (link.href.startsWith('#')) {
                    e.preventDefault();
                    const id = link.href.slice(1);
                    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                onMouseEnter={e => { e.currentTarget.style.color = linkHoverColor; e.currentTarget.style.borderBottomColor = linkHoverColor; }}
                onMouseLeave={e => { e.currentTarget.style.color = linkColor; e.currentTarget.style.borderBottomColor = 'transparent'; }}
              >
                {link.label}
              </a>
            ))}
            {toggleDark && (
              <button
                onClick={toggleDark}
                className="p-2 rounded-lg transition-colors"
                style={{ color: iconColor }}
                aria-label="Toggle dark mode"
                onMouseEnter={e => e.currentTarget.style.color = iconHoverColor}
                onMouseLeave={e => e.currentTarget.style.color = iconColor}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {isDark ? 'light_mode' : 'dark_mode'}
                </span>
              </button>
            )}
          </div>

        </div>

        {/* Mobile menu panel */}
        {menuOpen && (
          <div
            className="md:hidden border-t px-6 py-5 space-y-4"
            style={{ borderColor: `${C.surfaceVar}80`, background: `${C.surface}F5` }}
          >
            {navLinks.map(link => (
              <a
                key={link.label}
                href={link.href}
                className="block font-medium text-sm transition-colors"
                style={{ color: C.onSurfaceVar, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                onClick={(e) => {
                  setMenuOpen(false);
                  if (link.href.startsWith('#')) {
                    e.preventDefault();
                    const id = link.href.slice(1);
                    setTimeout(() => {
                      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 50);
                  }
                }}
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </nav>
    </div>
  );
}
