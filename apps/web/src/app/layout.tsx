import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import {
  Bricolage_Grotesque,
  Fraunces,
  Gloock,
  Hedvig_Letters_Serif,
  Newsreader,
  Young_Serif,
} from "next/font/google";
import { BRAND_NAME } from "@/lib/config";
import { FontPicker } from "./font-picker";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
});

// Hero-font candidates for the dev-only picker. preload:false — the files
// only download if a candidate is actually selected.
const gloock = Gloock({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-gloock",
  preload: false,
});
const youngSerif = Young_Serif({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-young",
  preload: false,
});
const newsreader = Newsreader({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-newsreader",
  preload: false,
});
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bricolage",
  preload: false,
});
const hedvig = Hedvig_Letters_Serif({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-hedvig",
  preload: false,
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
      className={`${GeistSans.variable} ${fraunces.variable} ${gloock.variable} ${youngSerif.variable} ${newsreader.variable} ${bricolage.variable} ${hedvig.variable}`}
    >
      <body>
        {children}
        {process.env.NODE_ENV === "development" && <FontPicker />}
      </body>
    </html>
  );
}
