import type { Metadata } from "next";
import { BRAND_NAME } from "@/lib/config";
import "./globals.css";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
