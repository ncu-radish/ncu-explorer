"use client";

import { useMemo } from "react";
import { Clock, MapPin } from "lucide-react";
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
  if (slot.type === "breakfast" || slot.type === "lunch" || slot.type === "dinner") {
    return {
      bg: "bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-950",
      badge: "bg-amber-200 text-amber-900",
      label: slot.type === "breakfast" ? "早餐" : slot.type === "lunch" ? "午膳" : "晚餐",
    };
  }
  if (slot.type === "dorm" || slot.type === "free") {
    return {
      bg: "bg-stone-100 hover:bg-stone-200 border-stone-300 text-stone-800",
      badge: "bg-stone-200 text-stone-800",
      label: slot.type === "dorm" ? "宿舍" : "自由",
    };
  }
  if (slot.type === "campus_leisure" || slot.type === "club") {
    return {
      bg: "bg-violet-50 hover:bg-violet-100 border-violet-200 text-violet-950",
      badge: "bg-violet-200 text-violet-900",
      label: slot.type === "club" ? "社團" : "活動",
    };
  }

  // Course styles
  return {
    bg: "bg-violet-50 hover:bg-violet-100 border-violet-300 text-violet-950",
    badge: "bg-violet-200 text-violet-900",
    label: slot.course_category || "課程",
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

  const slotsByDay = useMemo(() => {
    const map: Record<number, { slot: ScheduleSlot; index: number }[]> = {
      1: [], 2: [], 3: [], 4: [], 5: []
    };
    schedule.forEach((slot, index) => {
      if (slot.type === "lunch_prompt" || slot.type === "dinner_prompt" || slot.type === "leisure_prompt" || slot.type === "day_end") {
        return;
      }
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
          <Clock className="w-4 h-4 text-stone-500" />
        </div>
        {DAYS.map((dayName, idx) => {
          const dayNum = idx + 1;
          const isToday = dayNum === activeDay;
          return (
            <div
              key={dayNum}
              className={`py-2 text-center border-r last:border-r-0 border-stone-200 transition-colors ${
                isToday ? "bg-violet-50/50" : ""
              }`}
            >
              <span
                className={`inline-block px-3 py-0.5 rounded-full text-xs font-bold ${
                  isToday
                    ? "bg-violet-600 text-white shadow-xs"
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
      <div className="flex-1 overflow-y-auto relative min-h-0">
        <div
          className="grid grid-cols-[56px_repeat(5,1fr)] relative"
          style={{ height: "960px" }}
        >
          {/* Time Labels on the Left */}
          <div className="border-r border-stone-200 bg-stone-50/40 select-none">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="h-[60px] border-b border-stone-100 text-xs text-stone-500 font-mono pr-2 pt-1 text-right"
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
                  isToday ? "bg-violet-50/20" : ""
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
                  const isSkipped = Boolean(slot.is_skipped);
                  const startM = parseMinutes(slot.start_time);
                  const endM = parseMinutes(slot.end_time);
                  const durationM = Math.max(38, endM - startM);

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
                      className={`absolute left-0.5 right-0.5 rounded-lg border p-1.5 flex flex-col justify-between transition-all cursor-pointer shadow-2xs overflow-hidden ${
                        isSkipped
                          ? "border-dashed border-rose-300 bg-stone-100/90 text-stone-500 opacity-70 hover:opacity-100"
                          : styleMeta.bg
                      } ${
                        !isSkipped && isCurrent
                          ? "ring-2 ring-violet-500 bg-white shadow-md z-10 scale-[1.01]"
                          : !isSkipped && isPast
                          ? "opacity-60 hover:opacity-100"
                          : "hover:shadow-xs"
                      }`}
                    >
                      <div>
                        {/* Event Header: Category badge & Time */}
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span
                            className={`text-xs px-1.5 py-0.2 rounded font-semibold ${
                              isSkipped
                                ? "bg-rose-100 text-rose-700 border border-rose-200"
                                : styleMeta.badge
                            }`}
                          >
                            {isSkipped ? "已跳過" : styleMeta.label}
                          </span>
                          <span className="text-xs font-mono text-stone-600 truncate font-medium">
                            {slot.start_time}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className={`text-xs font-bold line-clamp-2 leading-tight ${
                          isSkipped ? "line-through text-stone-500" : "text-stone-900"
                        }`}>
                          {slot.title}
                        </h4>
                      </div>

                      {/* Footer: Location & Credits */}
                      <div className="flex items-center justify-between text-xs text-stone-600 mt-0.5">
                        {slot.location_name && (
                          <span className="truncate flex items-center gap-0.5">
                            <MapPin className="w-2.5 h-2.5 shrink-0 text-violet-600" />
                            <span className="truncate">{slot.location_name}</span>
                          </span>
                        )}
                        {slot.credits !== undefined && slot.credits > 0 && (
                          <span className="font-mono font-bold text-violet-700 ml-auto shrink-0">
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
