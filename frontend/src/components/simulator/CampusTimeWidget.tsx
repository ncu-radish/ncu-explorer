"use client";

import { useEffect, useState, useRef } from "react";
import { Clock, MapPin, Play, Pause, Sparkles, FastForward } from "lucide-react";
import { ScheduleSlot } from "@/store/useSimulatorStore";

const DAYS = ["週一", "週二", "週三", "週四", "週五"];

function timeToMinutes(t: string): number {
  if (!t) return 480;
  const parts = t.split(":");
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1] || "0", 10);
}

function minutesToTime(m: number): string {
  const total = Math.max(0, Math.floor(m));
  const h = Math.floor(total / 60) % 24;
  const mins = total % 60;
  return `${h.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

interface CampusTimeWidgetProps {
  slot?: ScheduleSlot | null;
  currentTurn: number;
  totalTurns: number;
  isFlowing?: boolean;
  flowFromTime?: string;
  flowToTime?: string;
  onFlowComplete?: () => void;
  onSkip?: () => void;
  onFocusLocation?: () => void;
}

export function CampusTimeWidget({
  slot,
  currentTurn,
  totalTurns,
  isFlowing = false,
  flowFromTime = "08:00",
  flowToTime = "12:00",
  onFlowComplete,
  onSkip,
  onFocusLocation,
}: CampusTimeWidgetProps) {
  const dayIndex = Math.max(0, Math.min(4, ((slot?.day || 1) - 1)));
  const dayName = DAYS[dayIndex];

  const staticTimeStr = slot?.start_time || "08:00";
  const [clockMinutes, setClockMinutes] = useState<number>(() => timeToMinutes(staticTimeStr));

  const animFrameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  // If not flowing, freeze clock at current slot start time
  useEffect(() => {
    if (!isFlowing) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      setClockMinutes(timeToMinutes(staticTimeStr));
    }
  }, [isFlowing, staticTimeStr]);

  // When isFlowing is true, linearly tick from flowFromTime to flowToTime
  useEffect(() => {
    if (isFlowing) {
      const fromMin = timeToMinutes(flowFromTime);
      const toMin = Math.max(fromMin + 30, timeToMinutes(flowToTime));
      let cur = fromMin;
      setClockMinutes(cur);
      lastTickRef.current = performance.now();

      const step = (now: number) => {
        if (now - lastTickRef.current >= 40) {
          cur += 1;
          lastTickRef.current = now;
          setClockMinutes(cur);
        }

        if (cur < toMin) {
          animFrameRef.current = requestAnimationFrame(step);
        } else {
          setClockMinutes(toMin);
          animFrameRef.current = null;
          if (onFlowComplete) {
            onFlowComplete();
          }
        }
      };

      animFrameRef.current = requestAnimationFrame(step);

      return () => {
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = null;
        }
      };
    }
  }, [isFlowing, flowFromTime, flowToTime, onFlowComplete]);

  if (!slot) return null;

  const currentDisplayClock = minutesToTime(clockMinutes);

  return (
    <div className="bg-gradient-to-r from-stone-900 via-stone-900 to-violet-950 rounded-2xl p-4 text-white shadow-md border border-stone-800 flex flex-wrap items-center justify-between gap-3 relative overflow-hidden">
      {/* Running time highlight ambient glow */}
      {isFlowing && (
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-amber-500/15 to-transparent animate-pulse pointer-events-none" />
      )}

      {/* Left: Day & Linear Flowing Clock Display */}
      <div className="flex items-center gap-3.5 relative z-10">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
            isFlowing
              ? "bg-amber-500/20 border-amber-400/50 shadow-amber-500/20 scale-105"
              : "bg-white/10 backdrop-blur-xs border-white/20 text-stone-200"
          }`}
        >
          {isFlowing ? (
            <Play className="w-5 h-5 text-amber-300 animate-pulse fill-amber-300" />
          ) : (
            <Pause className="w-5 h-5 text-stone-300" />
          )}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Pure Time Display: Weekday + Linear Clock */}
            <div className="flex items-baseline gap-2">
              <span className="text-base sm:text-lg font-bold text-violet-200">
                {dayName}
              </span>
              <span
                className={`text-xl sm:text-2xl font-black font-mono tracking-tight drop-shadow-xs transition-colors ${
                  isFlowing ? "text-amber-300" : "text-white"
                }`}
              >
                {currentDisplayClock}
              </span>
            </div>

            {/* Time Status Badge (Flowing vs Paused) */}
            {isFlowing ? (
              <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-amber-500/25 text-amber-300 border border-amber-400/40 animate-pulse font-mono">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>時間流逝中...</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full bg-white/10 text-stone-300 border border-white/20 font-mono">
                <span>⏸️ 時間暫停 · 等待決策</span>
              </span>
            )}

            {/* Skip Button: Instant skip to next event */}
            {isFlowing && (
              <button
                type="button"
                onClick={onSkip}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 hover:bg-amber-300 active:scale-95 text-stone-950 text-xs font-bold transition-all shadow-md cursor-pointer animate-in fade-in"
                title="快速跳到下一個事件選項"
              >
                <FastForward className="w-3.5 h-3.5 fill-stone-950" />
                <span>跳過 (Skip)</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-stone-300 mt-1">
            <span className="text-stone-400">當前行程：</span>
            <strong className="text-white font-semibold truncate max-w-[220px] sm:max-w-xs">
              {slot.title}
            </strong>
          </div>
        </div>
      </div>

      {/* Right: Location 3D Focus & Turn Progress */}
      <div className="flex items-center gap-2.5 relative z-10">
        {slot.location_name && (
          <button
            onClick={onFocusLocation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-medium transition-all backdrop-blur-xs cursor-pointer group"
          >
            <MapPin className="w-3.5 h-3.5 text-violet-300 group-hover:scale-110 transition-transform" />
            <span className="truncate max-w-[140px]">{slot.location_name}</span>
            <span className="text-xs text-violet-300 underline font-normal">3D聚焦</span>
          </button>
        )}

        <div className="px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/20 text-stone-200 text-xs font-mono font-medium shrink-0">
          進度 {Math.min(totalTurns, currentTurn + 1)} / {totalTurns}
        </div>
      </div>
    </div>
  );
}
