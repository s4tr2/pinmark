import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { Young_Serif } from "next/font/google";
import { BRAND_NAME } from "@/lib/config";
import "./globals.css";

// The display voice: warm, chunky, letterpress-confident
const youngSerif = Young_Serif({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
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
    <html
      lang="en"
      className={`${GeistSans.variable} ${youngSerif.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
