import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-[var(--color-brand-bg)] text-[var(--color-brand-ink)] selection:bg-[#111] selection:text-[#F4F4F0]" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
