"use client";

import { Sparkles, MapPin, Clock, ArrowRight, GraduationCap, User, Zap, AlertTriangle } from "lucide-react";
import { StoryState, ScheduleSlot } from "@/store/useSimulatorStore";

export function StoryDialog({
  story,
  dayName,
  slotName,
  locationName,
  slot,
  isLoading,
  onChoose,
  onGoToSleep: _onGoToSleep,
  onFocusLocation,
}: {
  story: StoryState | null;
  dayName: string;
  slotName: string;
  locationName: string;
  slot?: ScheduleSlot | null;
  isLoading: boolean;
  onChoose: (key: string) => void;
  onGoToSleep?: () => void;
  onFocusLocation?: () => void;
}) {
  const isRandomEvent = Boolean(story?.is_random_event);

  return (
    <div
      className={`bg-white rounded-3xl p-6 sm:p-7 flex flex-col justify-between border shadow-xs relative overflow-hidden transition-all ${
        isRandomEvent
          ? "border-amber-400 ring-4 ring-amber-400/15"
          : "border-stone-200"
      }`}
    >
      <div>
        {/* Header Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {/* Prominent Random Event Pill */}
          {isRandomEvent ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-bold shadow-xs animate-pulse">
              <Zap className="w-3.5 h-3.5 fill-white text-white" />
              <span>⚡ 突發狀況 · {story?.event_title || "突發事件"}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5" />
              {dayName} {slot?.display_time || slot?.time_label || slotName}
            </span>
          )}

          {isRandomEvent && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 text-xs border border-stone-200">
              <Clock className="w-3 h-3 text-stone-500" />
              <span>原定時段：{slot?.display_time || slot?.time_label || slotName}</span>
            </span>
          )}

          <button
            onClick={onFocusLocation}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 text-xs transition-colors group cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
            <span>{locationName || "校園巡禮"}</span>
            <span className="text-[10px] text-blue-600 underline ml-0.5">3D聚焦</span>
          </button>

          {slot?.course_category && (
            <span
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                slot.course_category.includes("通識")
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : slot.course_category.includes("體育")
                  ? "bg-teal-50 text-teal-700 border-teal-200"
                  : slot.course_category.includes("語言")
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                  : slot.course_category.includes("選修")
                  ? "bg-violet-50 text-violet-700 border-violet-200"
                  : "bg-blue-50 text-blue-700 border-blue-200"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{slot.course_category}</span>
              {slot.credits !== undefined && slot.credits > 0 && (
                <span className="ml-1 font-mono">({slot.credits}學分)</span>
              )}
            </span>
          )}

          {slot?.instructor && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 text-xs border border-stone-200">
              <User className="w-3 h-3 text-stone-500" />
              <span>{slot.instructor} 老師</span>
            </span>
          )}
        </div>

        {/* 突發事件專屬 Alert Banner */}
        {isRandomEvent && (
          <div className="mb-4 p-4 rounded-2xl bg-amber-50/90 border-2 border-amber-400 text-stone-900 shadow-xs relative overflow-hidden">
            <div className="flex items-start gap-3 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[11px] font-black tracking-wider uppercase shadow-xs">
                    ⚡ 突發狀況
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
                    【{story?.event_title || "校園危機事件"}】
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-amber-900 font-medium mt-1">
                  注意：此為獨立突發事件（不佔用左側行事曆時段）。做出抉擇後將立即影響數值，原定行程將接續進行或依決策應變！
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Narrative Text */}
        <div className="min-h-[110px] mb-6 flex items-center">
          {isLoading ? (
            <div className="flex items-center gap-3 text-blue-600 animate-pulse text-sm py-4">
              <Sparkles className="w-5 h-5 animate-spin text-amber-500" />
              <span className="font-medium text-stone-700">活動進行中...</span>
            </div>
          ) : (
            <p className="text-stone-800 text-base sm:text-lg leading-relaxed font-normal">
              {story?.narrative || "正在讀取當前校園情境..."}
            </p>
          )}
        </div>
      </div>

      {/* Options Buttons */}
      <div className="space-y-2.5">
        {story?.options.map((opt) => {
          const isSleep = opt.display_text.includes("去睡覺");
          const isNightAct = opt.display_text.includes("進行活動");

          return (
            <button
              key={opt.option_key}
              disabled={isLoading}
              onClick={() => onChoose(opt.option_key)}
              className={`w-full text-left p-3.5 sm:p-4 rounded-xl transition-all flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] cursor-pointer border ${
                isRandomEvent
                  ? "bg-amber-50/40 hover:bg-amber-100/80 border-amber-300 hover:border-amber-500 text-stone-900 shadow-xs"
                  : isSleep
                  ? "bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-indigo-500/40 hover:border-indigo-400 shadow-md"
                  : isNightAct
                  ? "bg-slate-50 hover:bg-indigo-50/70 border-slate-200 hover:border-indigo-300 text-stone-800 hover:text-stone-900 shadow-xs"
                  : "bg-stone-50 hover:bg-blue-50 border-stone-200 hover:border-blue-300 text-stone-800 hover:text-stone-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center font-mono shrink-0 transition-colors ${
                    isRandomEvent
                      ? "bg-amber-500 text-white font-extrabold shadow-xs group-hover:scale-105"
                      : isSleep
                      ? "bg-indigo-500/30 border border-indigo-400/40 text-amber-300"
                      : isNightAct
                      ? "bg-indigo-100 border border-indigo-200 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white"
                      : "bg-blue-100 border border-blue-200 text-blue-800 group-hover:bg-blue-600 group-hover:text-white"
                  }`}
                >
                  {opt.option_key}
                </span>
                <span
                  className={`text-sm font-medium ${
                    isRandomEvent
                      ? "text-stone-900 font-semibold"
                      : isSleep
                      ? "text-indigo-50 font-semibold"
                      : ""
                  }`}
                >
                  {opt.display_text}
                </span>
              </div>
              <ArrowRight
                className={`w-4 h-4 transition-all shrink-0 ${
                  isRandomEvent
                    ? "text-amber-600 group-hover:text-amber-700 group-hover:translate-x-1"
                    : isSleep
                    ? "text-indigo-300 group-hover:translate-x-1"
                    : "text-stone-400 group-hover:text-blue-600 group-hover:translate-x-1"
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
