import Link from "next/link";
import { Gamepad2, BookOpen, Map, Sparkles, ShieldCheck, Compass, ArrowRight, Layers, Users, Coffee } from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative min-h-full flex flex-col justify-between overflow-hidden">
      {/* Background Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-gradient-to-tr from-blue-600/20 via-cyan-500/15 to-emerald-500/10 blur-[130px] rounded-full pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-12 text-center flex flex-col items-center">
        {/* Compliance & Campus Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-cyan-300 text-xs font-semibold tracking-wide uppercase mb-6 animate-pulse">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>符合校園資安規範 • 歐美與台灣在地合規 AI 模型</span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight sm:leading-tight mb-6">
          探索中央大學的精彩生活 <br className="hidden sm:inline" />
          開啟你的 <span className="gradient-text">AI 智慧校園新篇章</span>
        </h1>

        <p className="max-w-2xl text-base sm:text-lg text-gray-400 mb-10 leading-relaxed">
          專為高中生與大一新生打造的雙核心探索平台。透過自然語言模擬體驗一週中大生活，或藉由雙向量混合 RAG 與純色 3D 地圖，零死角深度解析學術與校園環境。
        </p>

        {/* Dual CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href="/simulator"
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-base shadow-lg shadow-blue-500/25 transition-all hover:scale-105 active:scale-95 group"
          >
            <Gamepad2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span>【路徑 A】開始校園生活模擬</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/courses"
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-xl glass-panel hover:bg-white/10 text-gray-200 font-semibold text-base border border-white/10 transition-all hover:scale-105 active:scale-95"
          >
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <span>【路徑 B】直接瀏覽課程與百科</span>
          </Link>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Simulator */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between hover:border-blue-500/40 transition-colors group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                AI 一週生活模擬遊戲
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">21 回合</span>
              </h2>
              <p className="text-sm text-gray-400 leading-relaxed mb-4">
                自然語言輸入志向，後端狀態機排定真實課表與社團。依時段抽取百花川、宵夜街等館舍背景，由本地模型生成情境事件與專屬結算稱號。
              </p>
            </div>
            <Link
              href="/simulator"
              className="text-sm font-medium text-cyan-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
            >
              進入模擬體驗 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 2: Hybrid RAG Course Explorer */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between hover:border-emerald-500/40 transition-colors group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                雙路混合 RAG 課程中心
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">Dense+BM25</span>
              </h2>
              <p className="text-sm text-gray-400 leading-relaxed mb-4">
                FastEmbed 本地極速向量化，微軟 E5 繁中語意捕捉 + BM25 精準命中。提供八學期系所地圖與跨系所/課程多維度 AI 深入對照。
              </p>
            </div>
            <Link
              href="/courses"
              className="text-sm font-medium text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
            >
              探索系所課程 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 3: 3D Minimalist Map & Encyclopedia */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between hover:border-purple-500/40 transition-colors group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Map className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                純色 3D 校園地圖與百科
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">Three.js</span>
              </h2>
              <p className="text-sm text-gray-400 leading-relaxed mb-4">
                Clay 純色莫蘭迪美學沙盤，射線點擊建築觸發平滑鏡頭飛行。連動側邊欄展開該館舍開設課程、社團、鄰近美食與交通指南。
              </p>
            </div>
            <Link
              href="/map"
              className="text-sm font-medium text-purple-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
            >
              檢視 3D 沙盤 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Compliance Bottom Banner */}
      <footer className="border-t border-white/5 py-6 text-center text-xs text-gray-500 max-w-6xl mx-auto px-4 w-full flex flex-col sm:flex-row items-center justify-between gap-3">
        <span>© 2026 國立中央大學智慧校園生活模擬與 AI 課程探索平台</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-gray-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> 本地推論端點連線就緒
          </span>
          <Link href="/admin/dashboard" className="text-gray-400 hover:text-cyan-300">
            管理端 CMS
          </Link>
        </div>
      </footer>
    </div>
  );
}
