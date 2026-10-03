import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HomeMatch | Find a home that fits your life",
  description: "Discover homes based on where your life happens.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}