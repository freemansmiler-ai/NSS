import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "NSS DirectStay Ghana | Free Room Rentals & Direct Landlords for NSP",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body
        className={`${inter.variable} font-sans antialiased bg-slate-950 text-slate-100 min-h-screen flex flex-col selection:bg-emerald-500 selection:text-slate-950`}
      >
        {children}
      </body>
    </html>
  );
}
