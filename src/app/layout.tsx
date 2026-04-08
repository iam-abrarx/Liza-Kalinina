import type { Metadata } from "next";
import { Julius_Sans_One } from "next/font/google";
import "./globals.css";

const julius = Julius_Sans_One({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-julius",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Elizabeth Kalinina | Director of Photography",
  description:
    "Portfolio of Elizabeth Kalinina, Director of Photography & Director based Worldwide.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={julius.variable} suppressHydrationWarning>
      <body className="antialiased font-body bg-[var(--color-brand-bg)] text-[var(--color-brand-ink)] selection:bg-[#111] selection:text-[#F4F4F0]" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
