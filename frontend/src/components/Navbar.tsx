"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Gamepad2, BookOpen, Users, Map, Library, Shield } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/simulator", label: "生活模擬器", icon: Gamepad2 },
    { href: "/courses", label: "課程中心", icon: BookOpen },
    { href: "/clubs", label: "社團活動", icon: Users },
    { href: "/map", label: "3D 地圖", icon: Map },
    { href: "/explore", label: "生活百科", icon: Library },
    { href: "/admin/dashboard", label: "管理後台", icon: Shield },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-stone-200 px-4 md:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-stone-900 flex items-center gap-1.5">
              NCU <span className="text-violet-600">Explorer</span>
            </span>
            <span className="hidden sm:block text-xs text-stone-500 -mt-0.5 tracking-wider uppercase">
              中央大學智慧校園生活與課程平台
            </span>
          </div>
        </Link>

        {/* Navigation Items */}
        <nav className="flex items-center gap-1 md:gap-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-violet-50 text-violet-700 border border-violet-200"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-violet-600" : "text-stone-500"}`} />
                <span className="hidden md:inline">{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
