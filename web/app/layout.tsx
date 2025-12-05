import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono, Jersey_25 } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { AuthGuard } from "@/components/auth-guard";
import "@ncdai/react-wheel-picker/style.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jersey = Jersey_25({
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RangeCaddie",
  description: "Track and analyze your golf range sessions",
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <QueryProvider>
            <AuthGuard>
            {/* Preload the New Session route for instant modal open */}
            {/* This Link remains in viewport but invisible to trigger Next prefetch */}
            <Link
              href="/new"
              prefetch
              aria-hidden
              className="fixed left-0 top-0 w-px h-px opacity-0 pointer-events-none"
            >
              prefetch /new
            </Link>
            <header className="py-4 text-center">
              <div
                className={`${jersey.className} text-3xl leading-none text-green-600`}
              >
                RangeCaddie
              </div>
            </header>
            {children}
            {modal}
            </AuthGuard>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
