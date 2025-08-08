import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sol Levinson — Inventory Control",
  description: "Futuristic cloud inventory control panel for caskets, urns, and orders."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen">
        <header className="sticky top-0 z-50 backdrop-blur-md border-b border-white/10 bg-black/20">
          <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
            <div className="text-xl font-semibold tracking-tight">
              Sol Levinson — <span className="text-cyan-300">Inventory</span>
            </div>
            <nav className="flex gap-4 text-sm">
              <a className="hover:text-cyan-300 transition-colors" href="/">Dashboard</a>
              <a className="hover:text-cyan-300 transition-colors" href="/caskets">Caskets</a>
              <a className="hover:text-cyan-300 transition-colors" href="/urns">Urns</a>
              <a className="hover:text-cyan-300 transition-colors" href="/suppliers">Suppliers</a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-7xl px-4 pb-10 pt-6 text-sm text-white/50">
          © {new Date().getFullYear()} Sol Levinson
        </footer>
      </body>
    </html>
  );
}
