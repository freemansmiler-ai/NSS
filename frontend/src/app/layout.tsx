import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nssdirectstay.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "NSS DirectStay Ghana | Free Room Rentals & Direct Landlords for NSP",
    template: "%s | NSS DirectStay Ghana",
  },
  description:
    "Open-access mobile-first room rental platform connecting National Service Personnel (NSP) & budget renters across Ghana directly with verified landlords offering Single Rooms and Chamber & Hall properties. 0% house agent fees.",
  keywords: [
    "NSS DirectStay Ghana",
    "NSP accommodation Ghana",
    "Single room self contain Legon",
    "Chamber and hall Madina",
    "No agent fee room rental Accra",
    "GhanaPostGPS room rental",
    "National Service Ghana rooms",
    "Direct landlord contact Ghana",
  ],
  authors: [{ name: "NSS DirectStay Team" }],
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/icon.png",
    apple: [
      { url: "/apple-touch-icon.png", type: "image/png" },
    ],
  },
  openGraph: {
    title: "NSS DirectStay Ghana | 0% Agent Fee Room Rentals for NSP",
    description:
      "Connect directly with verified Ghana landlords offering Single Rooms & Chamber and Hall accommodation. Zero house agent fees for National Service Personnel.",
    url: siteUrl,
    siteName: "NSS DirectStay Ghana",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "NSS DirectStay Ghana - Room Rentals & Verified Landlords",
      },
    ],
    locale: "en_GH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NSS DirectStay Ghana | 0% Agent Fee Room Rentals for NSP",
    description:
      "Connect directly with verified Ghana landlords offering Single Rooms & Chamber and Hall accommodation. Zero house agent fees for National Service Personnel.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="icon" href="/icon.png" type="image/png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta property="og:image" content={`${siteUrl}/og-image.jpg`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:image" content={`${siteUrl}/og-image.jpg`} />
        <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased bg-slate-950 text-slate-100 min-h-screen flex flex-col selection:bg-emerald-500 selection:text-slate-950`}
      >
        {children}
      </body>
    </html>
  );
}


