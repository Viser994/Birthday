"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, AlertTriangle, BarChart3, Navigation, Shield } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Map", icon: Map },
  { href: "/report", label: "Report", icon: AlertTriangle },
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/route", label: "Route", icon: Navigation },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-[1000] border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="group flex items-center gap-2.5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 shadow-lg shadow-rose-500/25 transition-transform group-hover:scale-105">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight">
              <span className="block text-sm font-bold text-white sm:text-base">
                SafeTurn
              </span>
              <span className="hidden text-[10px] font-medium uppercase tracking-wider text-slate-400 sm:block">
                Brampton
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 rounded-2xl bg-white/5 p-1 sm:flex">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  prefetch
                  className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                    active
                      ? "bg-white text-slate-900 shadow-md"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile bottom nav — more reliable than cramped top-right tabs */}
      <nav className="fixed bottom-0 left-0 right-0 z-[1000] border-t border-white/10 bg-slate-950/95 backdrop-blur-xl sm:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 py-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                prefetch
                className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-medium transition-colors ${
                  active
                    ? "text-rose-400"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "text-rose-400" : ""}`} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
