"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Gamepad2, BookOpen, Map, Library, Shield } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/simulator", label: "生活模擬器", icon: Gamepad2 },
    { href: "/courses", label: "課程探索中心", icon: BookOpen },
    { href: "/map", label: "3D 校園地圖", icon: Map },
    { href: "/explore", label: "校園生活百科", icon: Library },
    { href: "/admin/dashboard", label: "管理後台", icon: Shield },
  ];

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/10 px-4 md:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
              NCU <span className="text-cyan-400">Explorer</span>
            </span>
            <span className="hidden sm:block text-[10px] text-gray-400 -mt-1 tracking-wider uppercase">
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
                    ? "bg-blue-600/20 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-blue-500/20"
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-gray-400"}`} />
                <span className="hidden md:inline">{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
