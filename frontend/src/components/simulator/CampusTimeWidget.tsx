"use client";

import { Clock, Calendar, MapPin, Moon, Sun, Sunrise, Sunset, Utensils, Music, Home } from "lucide-react";
import { ScheduleSlot } from "@/store/useSimulatorStore";

const DAYS = ["週一", "週二", "週三", "週四", "週五"];

export function CampusTimeWidget({
  slot,
  currentTurn,
  totalTurns,
  onFocusLocation,
}: {
  slot?: ScheduleSlot | null;
  currentTurn: number;
  totalTurns: number;
  onFocusLocation?: () => void;
}) {
  if (!slot) return null;

  const dayName = DAYS[Math.max(0, Math.min(4, (slot.day || 1) - 1))];
  const startTime = slot.start_time || "08:00";
  const displayTime = slot.display_time || slot.time_label || startTime;

  // Compute status icon and atmosphere label
  let timeIcon = <Sun className="w-4 h-4 text-amber-500" />;
  let atmosphereLabel = "日間課程時段";
  let atmosphereBadge = "bg-amber-50 text-amber-800 border-amber-200";

  if (slot.type === "dorm") {
    if (startTime < "12:00") {
      timeIcon = <Sunrise className="w-4 h-4 text-orange-500" />;
      atmosphereLabel = "晨光起居 · 宿舍時光";
      atmosphereBadge = "bg-orange-50 text-orange-800 border-orange-200";
    } else {
      timeIcon = <Moon className="w-4 h-4 text-indigo-500" />;
      atmosphereLabel = "夜幕深垂 · 宿舍生活";
      atmosphereBadge = "bg-indigo-50 text-indigo-800 border-indigo-200";
    }
  } else if (slot.type === "lunch") {
    timeIcon = <Utensils className="w-4 h-4 text-emerald-500" />;
    atmosphereLabel = "午膳漫步 · 校園美食";
    atmosphereBadge = "bg-emerald-50 text-emerald-800 border-emerald-200";
  } else if (slot.type === "club") {
    timeIcon = <Music className="w-4 h-4 text-purple-500" />;
    atmosphereLabel = "社團交流 · 夜色微涼";
    atmosphereBadge = "bg-purple-50 text-purple-800 border-purple-200";
  } else if (startTime >= "17:00" && startTime < "19:00") {
    timeIcon = <Sunset className="w-4 h-4 text-rose-500" />;
    atmosphereLabel = "黃昏漫步 · 百花川夕照";
    atmosphereBadge = "bg-rose-50 text-rose-800 border-rose-200";
  }

  return (
    <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-3 sm:p-4 text-white shadow-md border border-blue-800/40 flex flex-wrap items-center justify-between gap-3">
      {/* Left: Date & Time Clock Display */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-amber-300 shrink-0 shadow-inner">
          {timeIcon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
              <span>{dayName}</span>
              <span className="font-mono text-amber-300 font-extrabold">{displayTime}</span>
            </span>
            <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full border font-semibold ${atmosphereBadge}`}>
              {atmosphereLabel}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-blue-200/90 mt-0.5">
            <span>當前行動：<strong className="text-white font-semibold">{slot.title}</strong></span>
          </div>
        </div>
      </div>

      {/* Right: Location & Turn Step Pill */}
      <div className="flex items-center gap-2">
        {slot.location_name && (
          <button
            onClick={onFocusLocation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs transition-all backdrop-blur-xs cursor-pointer group"
          >
            <MapPin className="w-3.5 h-3.5 text-blue-300 group-hover:scale-110 transition-transform" />
            <span className="truncate max-w-[130px]">{slot.location_name}</span>
            <span className="text-[10px] text-blue-300 underline">3D聚焦</span>
          </button>
        )}

        <div className="px-3 py-1.5 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-mono font-medium shrink-0">
          進度 {Math.min(totalTurns, currentTurn + 1)} / {totalTurns}
        </div>
      </div>
    </div>
  );
}
