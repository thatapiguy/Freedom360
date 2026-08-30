"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScenarioSwitcher } from "@/components/ScenarioSwitcher";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/profile", label: "Your plan" },
  { href: "/roth-conversion", label: "Roth conversions" },
  { href: "/fire", label: "FIRE tools" },
  { href: "/scenarios", label: "Compare scenarios" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <header
      className="border-b sticky top-0 z-10 backdrop-blur"
      style={{ background: "color-mix(in srgb, var(--surface-1) 92%, transparent)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link href="/" className="font-semibold text-lg tracking-tight shrink-0">
            Freedom360
          </Link>
          <nav className="hidden md:flex items-center gap-1 text-sm flex-1">
            {LINKS.map((link) => {
              const active =
                link.href === "/" ? pathname === "/" : pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-1.5 rounded-full transition-colors"
                  style={{
                    color: active ? "var(--text-primary)" : "var(--text-secondary)",
                    background: active ? "var(--page-plane)" : "transparent",
                    fontWeight: active ? 600 : 500,
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <ScenarioSwitcher />
        </div>
        <nav className="flex md:hidden gap-1 overflow-x-auto pb-3 text-sm -mt-1">
          {LINKS.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 rounded-full whitespace-nowrap"
                style={{
                  color: active ? "var(--text-primary)" : "var(--text-secondary)",
                  background: active ? "var(--page-plane)" : "transparent",
                  fontWeight: active ? 600 : 500,
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
