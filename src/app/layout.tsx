import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Liza Kalinina | Director of Photography",
  description:
    "Portfolio of Liza Kalinina, Director of Photography & Director based Worldwide.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="antialiased font-body bg-[var(--color-brand-bg)] text-[var(--color-brand-ink)] selection:bg-[#111] selection:text-[#F4F4F0]" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
