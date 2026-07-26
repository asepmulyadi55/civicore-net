---
name: Ethereal Estate
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#404944'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#707974'
  outline-variant: '#bfc9c3'
  surface-tint: '#2b6954'
  primary: '#003527'
  on-primary: '#ffffff'
  primary-container: '#064e3b'
  on-primary-container: '#80bea6'
  inverse-primary: '#95d3ba'
  secondary: '#555f6f'
  on-secondary: '#ffffff'
  secondary-container: '#d6e0f3'
  on-secondary-container: '#596373'
  tertiary: '#502000'
  on-tertiary: '#ffffff'
  tertiary-container: '#733100'
  on-tertiary-container: '#ff985a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b0f0d6'
  primary-fixed-dim: '#95d3ba'
  on-primary-fixed: '#002117'
  on-primary-fixed-variant: '#0b513d'
  secondary-fixed: '#d9e3f6'
  secondary-fixed-dim: '#bdc7d9'
  on-secondary-fixed: '#121c2a'
  on-secondary-fixed-variant: '#3d4756'
  tertiary-fixed: '#ffdbca'
  tertiary-fixed-dim: '#ffb68e'
  on-tertiary-fixed: '#331200'
  on-tertiary-fixed-variant: '#763300'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
  surface-glass: rgba(255, 255, 255, 0.7)
  border-subtle: '#e5e7eb'
  text-muted: '#6b7280'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  section-gap: 80px
---

## Brand & Style
The design system embodies a premium, modern real estate identity that balances corporate stability with residential warmth. It is designed to evoke feelings of prestige, tranquility, and meticulous craftsmanship. 

The aesthetic blends **Minimalism** with **Glassmorphism**. High-end property showcases are prioritized through generous whitespace and a sophisticated layering system. The UI utilizes translucent materials for navigational elements to maintain a sense of depth and context, ensuring that the imagery—the core of the real estate experience—remains the focal point. The overall tone is harmonious, professional, and forward-thinking.

## Colors
The palette is rooted in a "Deep Forest" green, symbolizing growth and stability, paired with a "Charcoal" for authoritative structural elements. 

- **Primary (#064e3b):** Used for key branding, active states, and primary button backgrounds.
- **Secondary (#1f2937):** Reserved for deep text and grounding UI elements like footers or headers.
- **Tertiary (#b45309):** A sophisticated bronze used sparingly for high-value Call-to-Actions (CTAs), badges, and premium highlights.
- **Neutral (#f9fafb):** The primary background color to ensure a clean, airy feel that allows the photography to shine.

## Typography
The typographic scale emphasizes the contrast between the classic, editorial feel of **Playfair Display** and the highly legible, modern character of **Plus Jakarta Sans**. 

Headlines should use Playfair Display to convey a sense of heritage and luxury. Body copy utilizes Plus Jakarta Sans with generous line height to ensure readability and a contemporary feel. Labels and small UI cues are rendered in Plus Jakarta Sans with increased letter spacing and semi-bold weights to maintain hierarchy in dense information areas like property specs.

## Layout & Spacing
The layout follows a **Fixed Grid** model for desktop to maintain an editorial, magazine-like feel, while transitioning to a fluid model for mobile devices. 

- **Grid:** A 12-column grid is used for desktop (1280px max-width).
- **Rhythm:** Spacing is based on an 8px root unit. Section vertical spacing is intentionally large (80px+) to promote a feeling of openness and luxury.
- **Breakpoints:** 
  - Mobile: < 768px (4 columns, 16px margins)
  - Tablet: 768px - 1024px (8 columns, 24px margins)
  - Desktop: > 1024px (12 columns, 40px margins)

## Elevation & Depth
Depth is created through a combination of **Glassmorphism** and **Ambient Shadows**. 

1.  **Surfaces:** The primary surface is the Neutral background. Overlays (like navigation bars and property quick-view modals) use a backdrop-blur (12px to 20px) with a semi-transparent white tint (70% opacity).
2.  **Shadows:** Use very soft, diffused shadows with a slight primary color tint (`rgba(6, 78, 59, 0.04)`) to make cards appear as if they are floating gently rather than sitting heavily on the page.
3.  **Layers:** 
    - Level 0: Background.
    - Level 1: Cards and content blocks (Subtle shadow).
    - Level 2: Floating Action Buttons and Glass Nav (Medium shadow + Blur).
    - Level 3: Modals and Lightboxes (High shadow + Backdrop dim).

## Shapes
The design system uses a **Rounded** shape language to soften the corporate nature of the colors. 

Standard components (Buttons, Inputs) use a 0.5rem (8px) radius. Larger containers, such as property image cards or feature sections, should utilize the `rounded-xl` (1.5rem/24px) setting to create a friendly and premium appearance. Icons should follow a "soft-line" style with slightly rounded ends to match the UI's geometry.

## Components
- **Buttons:** 
  - *Primary:* Deep Green (#064e3b) with white text.
  - *CTA/Premium:* Bronze (#b45309) for "Schedule a Visit" or "Inquire Now".
  - *Ghost:* Transparent with a subtle border and 0.5rem radius.
- **Navigation Bar:** Fixed position with a 20px backdrop blur, a 1px bottom border (#e5e7eb), and centered links in Plus Jakarta Sans.
- **Property Cards:** Large-format images with 24px corner radius. Metadata (price, location) is placed on a white container that slightly overlaps the image for a 3D effect.
- **Input Fields:** Minimalist style with a 1px #e5e7eb border that transitions to Deep Green on focus. Labels are always "Label-sm" placed above the field.
- **Chips/Badges:** Small, rounded-full shapes with low-opacity primary green backgrounds and dark green text for property status (e.g., "New Launch", "Sold Out").
- **Specialty Component - Floor Plan Viewer:** A high-contrast, clean container using "Charcoal" for structural lines and "Bronze" to highlight specific room areas.