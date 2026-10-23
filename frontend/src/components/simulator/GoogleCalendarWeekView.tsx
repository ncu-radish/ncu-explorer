"use client";

import { useMemo } from "react";
import { Clock, MapPin, GraduationCap, Sparkles } from "lucide-react";
import { ScheduleSlot } from "@/store/useSimulatorStore";

const DAYS = ["週一", "週二", "週三", "週四", "週五"];
const HOURS = Array.from({ length: 17 }, (_, i) => i + 7); // 07:00 to 23:00

function parseMinutes(timeStr?: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(":");
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1] || "0", 10);
  return (h - 7) * 60 + m;
}

function getEventStyle(slot: ScheduleSlot) {
  if (slot.type === "dorm") {
    return {
      bg: "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800",
      badge: "bg-slate-200 text-slate-700",
      label: "宿舍生活",
    };
  }
  if (slot.type === "lunch") {
    return {
      bg: "bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900",
      badge: "bg-amber-200 text-amber-800",
      label: "午膳時光",
    };
  }
  if (slot.type === "club") {
    return {
      bg: "bg-purple-50 hover:bg-purple-100 border-purple-300 text-purple-900",
      badge: "bg-purple-200 text-purple-800",
      label: "社團活動",
    };
  }
  if (slot.type === "free") {
    return {
      bg: "bg-stone-50 hover:bg-stone-100 border-stone-300 text-stone-700",
      badge: "bg-stone-200 text-stone-600",
      label: "自主充實",
    };
  }

  const cat = slot.course_category || "";
  if (cat.includes("通識")) {
    return {
      bg: "bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-950",
      badge: "bg-emerald-200 text-emerald-800",
      label: "通識",
    };
  }
  if (cat.includes("體育")) {
    return {
      bg: "bg-teal-50 hover:bg-teal-100 border-teal-300 text-teal-950",
      badge: "bg-teal-200 text-teal-800",
      label: "體育",
    };
  }
  if (cat.includes("語言") || cat.includes("外文")) {
    return {
      bg: "bg-indigo-50 hover:bg-indigo-100 border-indigo-300 text-indigo-950",
      badge: "bg-indigo-200 text-indigo-800",
      label: "語言選修",
    };
  }
  if (cat.includes("選修")) {
    return {
      bg: "bg-violet-50 hover:bg-violet-100 border-violet-300 text-violet-950",
      badge: "bg-violet-200 text-violet-800",
      label: "系選修",
    };
  }
  return {
    bg: "bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-950",
    badge: "bg-blue-200 text-blue-800",
    label: "必修",
  };
}

export function GoogleCalendarWeekView({
  schedule,
  currentTurn,
  onSelectSlot,
}: {
  schedule: ScheduleSlot[];
  currentTurn: number;
  onSelectSlot?: (slot: ScheduleSlot) => void;
}) {
  const currentSlot = schedule[currentTurn];
  const activeDay = currentSlot?.day || 1;

  // Group slots by day
  const slotsByDay = useMemo(() => {
    const map: Record<number, { slot: ScheduleSlot; index: number }[]> = {
      1: [], 2: [], 3: [], 4: [], 5: []
    };
    schedule.forEach((slot, index) => {
      if (slot.day >= 1 && slot.day <= 5) {
        map[slot.day].push({ slot, index });
      }
    });
    return map;
  }, [schedule]);

  const totalMinutes = 16 * 60; // 07:00 to 23:00 = 960 mins

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
      {/* Calendar Top Header: 5 Days */}
      <div className="grid grid-cols-[56px_repeat(5,1fr)] border-b border-stone-200 bg-stone-50/80 sticky top-0 z-20">
        <div className="py-2.5 px-1 border-r border-stone-200 text-center flex items-center justify-center">
          <Clock className="w-3.5 h-3.5 text-stone-400" />
        </div>
        {DAYS.map((dayName, idx) => {
          const dayNum = idx + 1;
          const isToday = dayNum === activeDay;
          return (
            <div
              key={dayNum}
              className={`py-2 text-center border-r last:border-r-0 border-stone-200 transition-colors ${
                isToday ? "bg-blue-50/70" : ""
              }`}
            >
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isToday
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-stone-700"
                }`}
              >
                {dayName}
              </span>
            </div>
          );
        })}
      </div>

      {/* Calendar Body: Scrollable Time Grid */}
      <div className="flex-1 overflow-y-auto relative min-h-[520px]">
        <div
          className="grid grid-cols-[56px_repeat(5,1fr)] relative"
          style={{ height: "960px" }} // 1 hour = 60px
        >
          {/* Time Labels on the Left */}
          <div className="border-r border-stone-200 bg-stone-50/40 select-none">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="h-[60px] border-b border-stone-100 text-[10px] text-stone-400 font-mono pr-1.5 pt-1 text-right"
              >
                {String(hour).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* 5 Day Columns with Hour Grid Lines */}
          {DAYS.map((_, dIdx) => {
            const dayNum = dIdx + 1;
            const isToday = dayNum === activeDay;
            const daySlots = slotsByDay[dayNum] || [];

            return (
              <div
                key={dayNum}
                className={`relative border-r last:border-r-0 border-stone-200 ${
                  isToday ? "bg-blue-50/20" : ""
                }`}
              >
                {/* Horizontal Hour Lines */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="h-[60px] border-b border-stone-100"
                  />
                ))}

                {/* Event Blocks positioned by actual start & end times */}
                {daySlots.map(({ slot, index }) => {
                  const isCurrent = index === currentTurn;
                  const isPast = index < currentTurn;
                  const startM = parseMinutes(slot.start_time);
                  const endM = parseMinutes(slot.end_time);
                  const durationM = Math.max(35, endM - startM);

                  const topPercent = (startM / totalMinutes) * 100;
                  const heightPercent = (durationM / totalMinutes) * 100;
                  const styleMeta = getEventStyle(slot);

                  return (
                    <div
                      key={index}
                      onClick={() => onSelectSlot && onSelectSlot(slot)}
                      style={{
                        top: `${topPercent}%`,
                        height: `${heightPercent}%`,
                      }}
                      className={`absolute left-0.5 right-0.5 rounded-lg border p-1 sm:p-1.5 flex flex-col justify-between transition-all cursor-pointer shadow-2xs overflow-hidden ${
                        styleMeta.bg
                      } ${
                        isCurrent
                          ? "ring-2 ring-blue-500 bg-white shadow-md z-10 scale-[1.01]"
                          : isPast
                          ? "opacity-60 hover:opacity-100"
                          : "hover:shadow-xs"
                      }`}
                    >
                      <div>
                        {/* Event Header: Category badge & Time */}
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span
                            className={`text-[8px] px-1 py-0.2 rounded font-semibold ${styleMeta.badge}`}
                          >
                            {styleMeta.label}
                          </span>
                          <span className="text-[9px] font-mono opacity-75 truncate">
                            {slot.start_time}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-[10px] sm:text-[11px] font-bold line-clamp-2 leading-tight">
                          {slot.title}
                        </h4>
                      </div>

                      {/* Footer: Location & Credits */}
                      <div className="flex items-center justify-between text-[8px] sm:text-[9px] opacity-75 mt-0.5">
                        {slot.location_name && (
                          <span className="truncate flex items-center gap-0.5">
                            <MapPin className="w-2.5 h-2.5 shrink-0 text-blue-600" />
                            <span className="truncate">{slot.location_name}</span>
                          </span>
                        )}
                        {slot.credits !== undefined && slot.credits > 0 && (
                          <span className="font-mono font-bold text-blue-700 ml-auto shrink-0">
                            {slot.credits}學分
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
