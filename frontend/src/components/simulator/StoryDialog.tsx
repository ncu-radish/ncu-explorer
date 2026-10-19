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
    <div className="glass-panel-glow rounded-3xl p-6 sm:p-7 flex flex-col justify-between border border-cyan-500/20 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div>
        {/* Header Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-cyan-300 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" />
            {dayName} {slotName}
          </span>

          <button
            onClick={onFocusLocation}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs transition-colors group cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>{locationName || "校園巡禮"}</span>
            <span className="text-[10px] text-cyan-400/80 underline ml-0.5">3D聚焦</span>
          </button>
        </div>

        {/* Narrative Text */}
        <div className="min-h-[110px] mb-6 flex items-center">
          {isLoading ? (
            <div className="flex items-center gap-3 text-cyan-300 animate-pulse text-sm py-4">
              <Sparkles className="w-5 h-5 animate-spin" />
              <span>校園情境推進中，中央大學生活故事生成中...</span>
            </div>
          ) : (
            <p className="text-gray-100 text-base sm:text-lg leading-relaxed font-normal">
              {story?.narrative || "正在讀取當前校園情境..."}
            </p>
          )}
        </div>
      </div>

      {/* Options Buttons */}
      <div className="space-y-2.5">
        <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400 block mb-1">
          請選擇你的下一步行動：
        </span>
        {story?.options.map((opt) => (
          <button
            key={opt.option_key}
            disabled={isLoading}
            onClick={() => onChoose(opt.option_key)}
            className="w-full text-left p-3.5 sm:p-4 rounded-xl glass-panel hover:bg-blue-600/20 border border-white/10 hover:border-cyan-400/40 text-gray-200 hover:text-white transition-all flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-400/30 text-cyan-300 font-bold text-xs flex items-center justify-center font-mono group-hover:bg-cyan-500 group-hover:text-black transition-colors shrink-0">
                {opt.option_key}
              </span>
              <span className="text-sm font-medium">{opt.display_text}</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
