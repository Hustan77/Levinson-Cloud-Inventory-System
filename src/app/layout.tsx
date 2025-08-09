import "./globals.css";
import React from "react";

export const metadata = {
  title: "Sol Levinson — Inventory",
  description: "Cloud inventory system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen text-white bg-[#0b0e12] selection:bg-emerald-500/30 selection:text-white relative">
        {/* BG */}
        <div aria-hidden className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.08),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(6,182,212,0.08),transparent_40%),radial-gradient(circle_at_50%_80%,rgba(244,63,94,0.08),transparent_45%)]" />
        <div aria-hidden className="pointer-events-none fixed inset-0 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_70%)]" />

        <header className="sticky top-0 z-30 border-b border-white/10 bg-black/40 backdrop-blur supports-[backdrop-filter]:bg-black/30">
          <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
            <a href="/" className="text-white font-semibold">
              <span>Sol Levinson — </span><span className="text-emerald-300">Inventory</span>
            </a>
            <nav className="flex flex-wrap gap-4 text-sm">
              <a className="hover:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded" href="/">Dashboard</a>
              <a className="hover:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded" href="/caskets">Caskets</a>
              <a className="hover:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded" href="/urns">Urns</a>
              <a className="hover:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded" href="/suppliers">Suppliers</a>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
