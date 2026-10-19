"use client";

import Link from "next/link";
import { Trophy, Award, MapPin, BookOpen, RotateCcw, ArrowRight } from "lucide-react";
import { useSimulatorStore } from "@/store/useSimulatorStore";

export function SummaryModal({ isOpen }: { isOpen: boolean }) {
  const { summary, stats, resetSimulation } = useSimulatorStore();

  if (!isOpen || !summary) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="glass-panel-glow max-w-2xl w-full p-6 sm:p-8 rounded-3xl relative my-8 border border-cyan-500/30">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-32 bg-amber-500/20 blur-3xl pointer-events-none" />

        {/* Title Trophy Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-black flex items-center justify-center shadow-lg shadow-amber-500/30 mb-3 animate-bounce">
            <Trophy className="w-8 h-8" />
          </div>
          <span className="text-xs font-mono uppercase tracking-widest text-amber-400">
            一週模擬圓滿結算
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            榮獲稱號：<span className="gradient-gold-text">{summary.title}</span>
          </h2>
        </div>

        {/* Weekly Diary Card */}
        <div className="glass-panel p-5 rounded-2xl mb-6 border border-white/10 bg-white/5">
          <h3 className="text-xs font-mono uppercase text-gray-400 mb-2 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-cyan-400" />
            新生週記回顧
          </h3>
          <p className="text-gray-200 text-sm sm:text-base leading-relaxed">
            {summary.summary_diary}
          </p>
        </div>

        {/* Final Scorecard */}
        <div className="grid grid-cols-4 gap-2 mb-6 text-center">
          <div className="glass-panel p-3 rounded-xl border border-white/5">
            <span className="text-[10px] text-gray-400 block">體力</span>
            <span className="text-sm sm:text-base font-bold text-emerald-400 font-mono">
              {stats.stamina}%
            </span>
          </div>
          <div className="glass-panel p-3 rounded-xl border border-white/5">
            <span className="text-[10px] text-gray-400 block">學業</span>
            <span className="text-sm sm:text-base font-bold text-blue-400 font-mono">
              {stats.study}分
            </span>
          </div>
          <div className="glass-panel p-3 rounded-xl border border-white/5">
            <span className="text-[10px] text-gray-400 block">社交</span>
            <span className="text-sm sm:text-base font-bold text-purple-400 font-mono">
              {stats.social}點
            </span>
          </div>
          <div className="glass-panel p-3 rounded-xl border border-white/5">
            <span className="text-[10px] text-gray-400 block">剩餘資金</span>
            <span className="text-sm sm:text-base font-bold text-amber-400 font-mono">
              ${stats.money}
            </span>
          </div>
        </div>

        {/* Visited Locations & Courses Deep Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="glass-panel p-4 rounded-xl border border-white/5">
            <span className="text-xs font-bold text-white flex items-center gap-1.5 mb-2">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              本週探訪場域 ({summary.visited_locations.length})
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
              {summary.visited_locations.map((loc: any) => (
                <Link
                  key={loc.id}
                  href={`/map?loc=${loc.id}`}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-cyan-300 border border-blue-500/20 transition-colors flex items-center gap-1"
                >
                  {loc.name} <ArrowRight className="w-2.5 h-2.5" />
                </Link>
              ))}
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-white/5">
            <span className="text-xs font-bold text-white flex items-center gap-1.5 mb-2">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              修習課程紀錄 ({summary.enrolled_courses.length})
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
              {summary.enrolled_courses.map((course: any) => (
                <Link
                  key={course.id}
                  href={`/courses?keyword=${encodeURIComponent(course.name)}`}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 transition-colors flex items-center gap-1"
                >
                  {course.name} <ArrowRight className="w-2.5 h-2.5" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={resetSimulation}
            className="w-full sm:w-1/2 py-3.5 rounded-xl glass-panel hover:bg-white/10 text-gray-200 font-semibold text-sm transition-all flex items-center justify-center gap-2 border border-white/10 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>體驗其他系所 (重置)</span>
          </button>

          <Link
            href="/courses"
            className="w-full sm:w-1/2 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            <span>探索真實課程與選課</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
