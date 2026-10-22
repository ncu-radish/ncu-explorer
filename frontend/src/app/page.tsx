import Link from "next/link";
import { Gamepad2, Compass, ArrowRight, BookOpen, Map, Bus, Coffee } from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#FAF8F5]">
      {/* Main Hero Container */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        {/* Subtle Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-200/70 border border-stone-300 text-stone-700 text-xs font-medium tracking-wider mb-6">
          <Compass className="w-3.5 h-3.5 text-blue-600" />
          <span>國立中央大學 • NCU Explorer</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-3xl leading-tight sm:leading-tight mb-4 text-stone-900">
          探索中央大學的精彩生活
        </h1>

        {/* Clean Subtitle */}
        <p className="max-w-xl text-base sm:text-lg text-stone-600 mb-10 leading-relaxed">
          體驗一週校園生活模擬，或瀏覽完整課程、地圖與生活指南。
        </p>

        {/* Dual Vertical CTA Buttons */}
        <div className="flex flex-col items-center gap-4 w-full max-w-sm sm:max-w-md mx-auto">
          {/* Top Button: 開始模擬 (Solid background CTA) */}
          <Link
            href="/simulator"
            className="w-full flex items-center justify-center gap-3 px-8 py-4.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-base sm:text-lg shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] group cursor-pointer"
          >
            <Gamepad2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span className="tracking-wide">開始模擬</span>
            <ArrowRight className="w-5 h-5 ml-auto group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Bottom Button: 瀏覽中央相關資料 */}
          <Link
            href="/explore"
            className="w-full flex items-center justify-center gap-3 px-8 py-4.5 rounded-2xl bg-white hover:bg-stone-50 active:bg-stone-100 text-stone-800 font-semibold text-base sm:text-lg border border-stone-300 shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] group cursor-pointer"
          >
            <Compass className="w-5 h-5 text-blue-600 group-hover:rotate-45 transition-transform" />
            <span className="tracking-wide">瀏覽中央相關資料</span>
            <ArrowRight className="w-5 h-5 ml-auto text-stone-400 group-hover:translate-x-1 group-hover:text-stone-700 transition-all" />
          </Link>
        </div>

        {/* Quick Highlights Pills */}
        <div className="mt-14 pt-8 border-t border-stone-200 flex flex-wrap items-center justify-center gap-3 text-xs text-stone-600">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-200 shadow-xs">
            <BookOpen className="w-3.5 h-3.5 text-blue-600" /> 課程資訊
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-200 shadow-xs">
            <Map className="w-3.5 h-3.5 text-emerald-600" /> 3D 地圖
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-200 shadow-xs">
            <Bus className="w-3.5 h-3.5 text-indigo-600" /> 交通方式
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-200 shadow-xs">
            <Coffee className="w-3.5 h-3.5 text-amber-600" /> 校園飲食
          </span>
        </div>
      </div>

      {/* Simple Clean Footer */}
      <footer className="border-t border-stone-200 py-5 text-center text-xs text-stone-500 max-w-5xl mx-auto px-4 w-full flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FAF8F5]">
        <span>© 2026 國立中央大學 NCU Explorer</span>
        <div className="flex items-center gap-4">
          <Link href="/explore" className="text-stone-600 hover:text-stone-900 transition-colors">
            相關資料
          </Link>
          <Link href="/simulator" className="text-stone-600 hover:text-stone-900 transition-colors">
            生活模擬
          </Link>
          <Link href="/admin/dashboard" className="text-stone-400 hover:text-stone-700 transition-colors">
            管理後台
          </Link>
        </div>
      </footer>
    </div>
  );
}
