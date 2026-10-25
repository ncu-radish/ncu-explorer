"use client";

import { useEffect, useState, useRef } from "react";
import { Clock, MapPin, Play, Pause, Sparkles } from "lucide-react";
import { ScheduleSlot } from "@/store/useSimulatorStore";

const DAYS = ["週一", "週二", "週三", "週四", "週五"];

function timeToMinutes(t: string): number {
  if (!t) return 480;
  const parts = t.split(":");
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1] || "0", 10);
}

function minutesToTime(m: number): string {
  const total = Math.max(0, m);
  const h = Math.floor(total / 60) % 24;
  const mins = Math.floor(total % 60);
  return `${h.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

export function CampusTimeWidget({
  slot,
  currentTurn,
  totalTurns,
  isLoading = false,
  onFocusLocation,
}: {
  slot?: ScheduleSlot | null;
  currentTurn: number;
  totalTurns: number;
  isLoading?: boolean;
  onFocusLocation?: () => void;
}) {
  const dayIndex = Math.max(0, Math.min(4, ((slot?.day || 1) - 1)));
  const dayName = DAYS[dayIndex];

  const startTimeStr = slot?.start_time || "08:00";
  const endTimeStr = slot?.end_time || slot?.start_time || "10:00";

  // Dynamic ticking clock state
  const [clockMinutes, setClockMinutes] = useState<number>(() => timeToMinutes(startTimeStr));
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // When slot changes and not loading, snap to slot's start time and pause
  useEffect(() => {
    if (!isLoading) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setClockMinutes(timeToMinutes(startTimeStr));
    }
  }, [slot, startTimeStr, isLoading]);

  // When user selects an option (isLoading = true), clock runs continuously forward
  useEffect(() => {
    if (isLoading) {
      const startMin = timeToMinutes(startTimeStr);
      const endMin = Math.max(startMin + 50, timeToMinutes(endTimeStr));
      const totalSpan = endMin - startMin;
      let cur = startMin;

      // Animate ticking every 40ms, advancing dynamically
      timerRef.current = setInterval(() => {
        cur += Math.max(2, Math.ceil(totalSpan / 25));
        if (cur >= endMin) {
          cur = endMin;
        }
        setClockMinutes(cur);
      }, 40);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    }
  }, [isLoading, startTimeStr, endTimeStr]);

  if (!slot) return null;

  const currentDisplayClock = minutesToTime(clockMinutes);

  return (
    <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 rounded-2xl p-3.5 sm:p-4 text-white shadow-lg border border-blue-800/40 flex flex-wrap items-center justify-between gap-3 relative overflow-hidden">
      {/* Running time highlight beam */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-amber-500/20 to-transparent animate-pulse pointer-events-none" />
      )}

      {/* Left: Day & Flowing Clock Display */}
      <div className="flex items-center gap-3 relative z-10">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-amber-300 shrink-0 shadow-inner border transition-all ${
          isLoading
            ? "bg-amber-500/20 border-amber-400/50 shadow-amber-500/30 scale-105"
            : "bg-white/10 backdrop-blur-xs border-white/20"
        }`}>
          {isLoading ? (
            <Play className="w-5 h-5 text-amber-300 animate-pulse fill-amber-300" />
          ) : (
            <Pause className="w-5 h-5 text-blue-300" />
          )}
        </div>

        <div>
          <div className="flex items-center gap-2.5">
            {/* Pure Time Display (e.g., 週一 12:00) */}
            <div className="flex items-baseline gap-2">
              <span className="text-base sm:text-lg font-bold text-blue-200">
                {dayName}
              </span>
              <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white drop-shadow-xs">
                {currentDisplayClock}
              </span>
            </div>

            {/* Time Status Badge (Running vs Paused) */}
            {isLoading ? (
              <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/30 text-amber-300 border border-amber-400/50 animate-pulse shadow-xs font-mono">
                <Sparkles className="w-3 h-3 animate-spin" />
                <span>時間流逝中...</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 font-mono">
                <span>⏸️ 時間暫停 · 等待決策</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-300 mt-1">
            <span className="text-stone-400">當前行程：</span>
            <strong className="text-white font-semibold truncate max-w-[200px] sm:max-w-xs">
              {slot.title}
            </strong>
          </div>
        </div>
      </div>

      {/* Right: Location 3D Focus & Turn Progress */}
      <div className="flex items-center gap-2 relative z-10">
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
