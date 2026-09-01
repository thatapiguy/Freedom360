import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { StoreHydration } from "@/components/StoreHydration";

export const metadata: Metadata = {
  title: "Freedom360 — Retirement Planner",
  description:
    "A private, local-first retirement planning tool: Monte Carlo projections, tax-aware withdrawals, Roth conversions, and FIRE calculators. Your data never leaves your browser.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <StoreHydration />
        <NavBar />
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {children}
        </main>
        <footer className="border-t py-6 text-center text-xs" style={{ color: "var(--text-muted)" }}>
          Freedom360 keeps everything in your browser — nothing is uploaded, and
          nothing here is tax or investment advice.
        </footer>
      </body>
    </html>
  );
}
