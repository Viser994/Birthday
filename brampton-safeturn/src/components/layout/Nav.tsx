"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, AlertTriangle, BarChart3, Route, Shield } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Map", icon: Map },
  { href: "/report", label: "Report", icon: AlertTriangle },
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/route", label: "Route", icon: Route },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-gray-900">
          <Shield className="h-6 w-6 text-red-500" />
          <span className="hidden sm:inline">Brampton SafeTurn</span>
          <span className="sm:hidden">SafeTurn</span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-red-50 text-red-600"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
