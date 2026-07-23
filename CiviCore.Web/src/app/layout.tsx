import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dwipapuri.amsite.click';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Dwipapuri Residence - Portal Komunitas & Perumahan",
  description: "Portal resmi Perumahan Dwipapuri Residence, Cipadung, Cibiru, Bandung. Berita warga, acara komunitas, fasilitas, dan informasi hunian.",
  icons: {
    icon: [
      { url: '/logo.png', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    siteName: "Dwipapuri Residence",
    title: "Dwipapuri Residence - Portal Komunitas & Perumahan",
    description: "Portal resmi Perumahan Dwipapuri Residence, Cipadung, Cibiru, Bandung.",
    url: SITE_URL,
    type: "website",
    locale: "id_ID",
    images: [
      {
        url: `${SITE_URL}/logo.png`,
        width: 1200,
        height: 630,
        alt: "Dwipapuri Residence",
      }
    ]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL,GRAD,opsz@100..700,0..1,-50..200,20..48&display=swap" rel="stylesheet" />
        <style>{`
          .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        `}</style>
        <script src="https://www.google.com/recaptcha/api.js?render=6LcYAU4tAAAAAIOUBvSBiUsCre0iHTwZRds2WpI5" async defer></script>
      </head>
      <body className="min-h-screen flex flex-col">
        {children}
        <AnalyticsScript />
      </body>
    </html>
  );
}

async function AnalyticsScript() {
  try {
    const apiUrl = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5075';
    const res = await fetch(`${apiUrl}/api/homepage/config`, { next: { revalidate: 0 } });
    if (!res.ok) return null;
    const data = await res.json();
    const gaId = data.ga_measurement_id || data.gaMeasurementId;
    
    if (!gaId) return null;

    return (
      <>
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');
            `,
          }}
        />
      </>
    );
  } catch (error) {
    return null;
  }
}
