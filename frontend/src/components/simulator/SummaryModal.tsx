"use client";

import Link from "next/link";
import { Trophy, Award, MapPin, BookOpen, RotateCcw, ArrowRight } from "lucide-react";
import { useSimulatorStore } from "@/store/useSimulatorStore";

export function SummaryModal({ isOpen }: { isOpen: boolean }) {
  const { summary, stats, resetSimulation } = useSimulatorStore();

  if (!isOpen || !summary) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white max-w-2xl w-full p-6 sm:p-8 rounded-3xl relative my-8 border border-stone-200 shadow-xl">
        {/* Title Trophy Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 border border-amber-200 text-amber-600 flex items-center justify-center shadow-xs mb-3">
            <Trophy className="w-8 h-8" />
          </div>
          <span className="text-xs font-mono uppercase tracking-widest text-amber-700">
            一週生活模擬結算
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1">
            榮獲稱號：<span className="text-amber-600">{summary.title}</span>
          </h2>
        </div>

        {/* Weekly Diary Card */}
        <div className="p-5 rounded-2xl mb-6 border border-stone-200 bg-stone-50">
          <h3 className="text-xs font-mono uppercase text-stone-500 mb-2 flex items-center gap-1.5 font-bold">
            <Award className="w-4 h-4 text-blue-600" />
            新生週記回顧
          </h3>
          <p className="text-stone-700 text-sm sm:text-base leading-relaxed">
            {summary.summary_diary}
          </p>
        </div>

        {/* Final Scorecard */}
        <div className="grid grid-cols-4 gap-2 mb-6 text-center">
          <div className="p-3 rounded-xl border border-stone-200 bg-white">
            <span className="text-[10px] text-stone-500 block">體力</span>
            <span className="text-sm sm:text-base font-bold text-emerald-600 font-mono">
              {stats.stamina}%
            </span>
          </div>
          <div className="p-3 rounded-xl border border-stone-200 bg-white">
            <span className="text-[10px] text-stone-500 block">學業</span>
            <span className="text-sm sm:text-base font-bold text-blue-600 font-mono">
              {stats.study}分
            </span>
          </div>
          <div className="p-3 rounded-xl border border-stone-200 bg-white">
            <span className="text-[10px] text-stone-500 block">社交</span>
            <span className="text-sm sm:text-base font-bold text-purple-600 font-mono">
              {stats.social}點
            </span>
          </div>
          <div className="p-3 rounded-xl border border-stone-200 bg-white">
            <span className="text-[10px] text-stone-500 block">剩餘資金</span>
            <span className="text-sm sm:text-base font-bold text-amber-600 font-mono">
              ${stats.money}
            </span>
          </div>
        </div>

        {/* Visited Locations & Courses Deep Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50">
            <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5 mb-2">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              本週探訪場域 ({summary.visited_locations.length})
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
              {summary.visited_locations.map((loc: any) => (
                <Link
                  key={loc.id}
                  href={`/map?loc=${loc.id}`}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 transition-colors flex items-center gap-1"
                >
                  {loc.name} <ArrowRight className="w-2.5 h-2.5" />
                </Link>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50">
            <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5 mb-2">
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              修習課程紀錄 ({summary.enrolled_courses.length})
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
              {summary.enrolled_courses.map((course: any) => (
                <Link
                  key={course.id}
                  href={`/courses?keyword=${encodeURIComponent(course.name)}`}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 transition-colors flex items-center gap-1"
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
            className="w-full sm:w-1/2 py-3 rounded-xl bg-white hover:bg-stone-50 text-stone-700 font-semibold text-sm transition-all flex items-center justify-center gap-2 border border-stone-300 cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-4 h-4" />
            <span>重新開局</span>
          </button>

          <Link
            href="/courses"
            className="w-full sm:w-1/2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            <span>前往課程中心選課</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
