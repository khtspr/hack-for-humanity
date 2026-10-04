import type { Metadata, Viewport } from "next";
import SiteFooter from "@/components/SiteFooter";
import "./globals.css";

export const metadata: Metadata = {
  title: "HomeMatch | Find a home that fits your life",
  description: "Discover homes based on where your life happens.",
};

// Matches --bg so mobile browser chrome and native controls continue the dark theme.
export const viewport: Viewport = { themeColor: "#05070d", colorScheme: "dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
