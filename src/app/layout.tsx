// LANDMARK: Root layout for the whole app (Next.js App Router)

import type { Metadata } from "next";
import "./globals.css";

/**
 * LANDMARK: Global <head/> metadata (favicon + titles)
 * - The favicon is served from /public/favicon.ico
 * - Title template keeps pages clean but consistent
 */
export const metadata: Metadata = {
  title: {
    default: "Sol Levinson — Inventory",
    template: "%s — Sol Levinson Inventory",
  },
  description: "Futuristic, glassy control‑panel for Sol Levinson inventory.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png", // optional; only loads if present in /public
  },
};

/**
 * LANDMARK: RootLayout
 * Keep this a server component (no "use client") so it's lightweight.
 * We purposely avoid rendering a nav here to prevent typedRoutes/link issues.
 * The background + micro‑grid come from globals.css.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* LANDMARK: Body chrome — dark backdrop, smoothing, and consistent font rendering */}
      <body className="min-h-screen bg-neutral-950 text-white antialiased">
        {/* LANDMARK: App container — stretch to full height, content rendered below */}
        <div id="app-root" className="min-h-screen">
          {children}
        </div>

        {/* LANDMARK: Modal portal (optional hook for any portals if you add them later) */}
        <div id="modal-root" className="z-[9999]" />
      </body>
    </html>
  );
}
