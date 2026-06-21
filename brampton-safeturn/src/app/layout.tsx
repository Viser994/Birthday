import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Nav from "@/components/layout/Nav";
import GoogleMapsProvider from "@/components/providers/GoogleMapsProvider";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Brampton SafeTurn — Community Road Safety Map",
  description:
    "A community-powered road safety intelligence map revealing dangerous driving zones in Brampton, Ontario.",
  openGraph: {
    title: "Brampton SafeTurn",
    description: "Community-powered road safety map for Brampton",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-slate-950 font-sans text-slate-100 antialiased">
        <GoogleMapsProvider>
          <Nav />
          <main className="relative flex flex-1 flex-col pb-16 sm:pb-0">
            {children}
          </main>
        </GoogleMapsProvider>
      </body>
    </html>
  );
}
