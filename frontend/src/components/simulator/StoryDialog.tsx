"use client";

import { Sparkles, MapPin, Clock, ArrowRight } from "lucide-react";
import { StoryState } from "@/store/useSimulatorStore";

export function StoryDialog({
  story,
  dayName,
  slotName,
  locationName,
  isLoading,
  onChoose,
  onFocusLocation,
}: {
  story: StoryState | null;
  dayName: string;
  slotName: string;
  locationName: string;
  isLoading: boolean;
  onChoose: (key: string) => void;
  onFocusLocation?: () => void;
}) {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 flex flex-col justify-between border border-stone-200 shadow-xs relative overflow-hidden">
      <div>
        {/* Header Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" />
            {dayName} {slotName}
          </span>

          <button
            onClick={onFocusLocation}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 text-xs transition-colors group cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
            <span>{locationName || "校園巡禮"}</span>
            <span className="text-[10px] text-blue-600 underline ml-0.5">3D聚焦</span>
          </button>
        </div>

        {/* Narrative Text */}
        <div className="min-h-[110px] mb-6 flex items-center">
          {isLoading ? (
            <div className="flex items-center gap-3 text-blue-600 animate-pulse text-sm py-4">
              <Sparkles className="w-5 h-5 animate-spin" />
              <span>校園情境推進中，故事生成中...</span>
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
        <span className="text-[11px] font-mono uppercase tracking-wider text-stone-500 block mb-1">
          請選擇你的下一步行動：
        </span>
        {story?.options.map((opt) => (
          <button
            key={opt.option_key}
            disabled={isLoading}
            onClick={() => onChoose(opt.option_key)}
            className="w-full text-left p-3.5 sm:p-4 rounded-xl bg-stone-50 hover:bg-blue-50 border border-stone-200 hover:border-blue-300 text-stone-800 hover:text-stone-900 transition-all flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-blue-100 border border-blue-200 text-blue-800 font-bold text-xs flex items-center justify-center font-mono group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                {opt.option_key}
              </span>
              <span className="text-sm font-medium">{opt.display_text}</span>
            </div>
            <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
