"use client";

import { useEffect, useState, useRef, type ReactNode } from "react";
import { MapPin, Sparkles, FastForward } from "lucide-react";
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
  leading?: ReactNode;
  actions?: ReactNode;
  isFlowing?: boolean;
  flowFromTime?: string;
  flowToTime?: string;
  onFlowComplete?: () => void;
  onSkip?: () => void;
  onFocusLocation?: () => void;
}

export function CampusTimeWidget({
  slot,
  leading,
  actions,
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

  if (!slot) {
    return leading || actions ? (
      <div className="surface flex flex-wrap items-center gap-x-4 gap-y-1.5 px-3 py-2 sm:px-4">
        {leading}
        {actions && <div className="ml-auto flex flex-wrap items-center gap-1.5">{actions}</div>}
      </div>
    ) : null;
  }

  const currentDisplayClock = minutesToTime(clockMinutes);

  return (
    <div
      className={`surface relative flex flex-wrap items-center gap-x-4 gap-y-1.5 px-3 py-2 sm:px-4 transition-colors ${
        isFlowing ? "ring-1 ring-amber-300 bg-amber-50/60" : ""
      }`}
    >
      {leading}

      {/* Weekday + clock + status */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-violet-700">{dayName}</span>
        <span
          className={`font-mono text-lg font-black tracking-tight transition-colors ${
            isFlowing ? "text-amber-600" : "text-stone-900"
          }`}
        >
          {currentDisplayClock}
        </span>
        {isFlowing ? (
          <span className="flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 font-mono text-xs font-bold text-amber-700 animate-pulse">
            <Sparkles className="h-3 w-3 animate-spin" />
            時間流逝中
          </span>
        ) : (
          <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 font-mono text-xs text-stone-500">
            ⏸️ 等待決策
          </span>
        )}
        {isFlowing && (
          <button
            type="button"
            onClick={onSkip}
            className="flex cursor-pointer items-center gap-1 rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-bold text-stone-950 shadow-sm transition hover:bg-amber-300 active:scale-95"
            title="快速跳到下一個事件選項"
          >
            <FastForward className="h-3 w-3 fill-stone-950" />
            跳過
          </button>
        )}
      </div>

      {/* Current activity + location focus */}
      <div className="flex min-w-0 items-center gap-2 text-sm">
        <strong className="max-w-[14rem] truncate font-semibold text-stone-800">{slot.title}</strong>
        {slot.location_name && (
          <button
            onClick={onFocusLocation}
            className="group flex cursor-pointer items-center gap-1 rounded-full border border-stone-200 bg-white px-2.5 py-0.5 text-xs font-medium text-stone-700 transition hover:border-violet-300 hover:text-violet-700"
          >
            <MapPin className="h-3 w-3 text-violet-600" />
            <span className="max-w-[9rem] truncate">{slot.location_name}</span>
            <span className="text-violet-600 underline">3D聚焦</span>
          </button>
        )}
      </div>

      {actions && <div className="ml-auto flex flex-wrap items-center gap-1.5">{actions}</div>}
    </div>
  );
}
