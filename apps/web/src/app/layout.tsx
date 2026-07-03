import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { Instrument_Serif } from "next/font/google";
import { BRAND_NAME } from "@/lib/config";
import "./globals.css";

// Free stand-in for Signifier (Klim): sharp editorial display serif.
// Single weight; the hero compensates with size.
const displaySerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display-serif",
});

export const metadata: Metadata = {
  title: BRAND_NAME,
  description: "Figma-style commenting for any coded prototype.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${displaySerif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
