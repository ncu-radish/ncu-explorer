"use client";

import { Calendar, MapPin, BookOpen, Clock } from "lucide-react";
import { ScheduleSlot } from "@/store/useSimulatorStore";

const DAYS = ["週一", "週二", "週三", "週四", "週五"];

export const TIMELINE_SLOTS = [
  { key: "slot_1", name: "晨光早課", time: "08:00~10:00", short: "1-2節" },
  { key: "slot_2", name: "上午主修", time: "10:00~12:00", short: "3-4節" },
  { key: "slot_3", name: "午膳漫步", time: "12:00~13:00", short: "午間Z" },
  { key: "slot_4", name: "午後專修", time: "13:00~15:00", short: "5-6節" },
  { key: "slot_5", name: "下晝研討", time: "15:00~17:00", short: "7-8節" },
  { key: "slot_6", name: "晚間校園", time: "18:00~21:00", short: "夜間" },
];

function getCategoryBadge(slot?: ScheduleSlot) {
  if (!slot) return null;
  if (slot.type === "club") {
    return { label: "社團活動", bg: "bg-purple-100 text-purple-700 border-purple-200" };
  }
  if (slot.type === "lunch") {
    return { label: "午間休息", bg: "bg-amber-100 text-amber-700 border-amber-200" };
  }
  if (slot.type === "free") {
    return { label: "自主充實", bg: "bg-stone-100 text-stone-600 border-stone-200" };
  }
  const cat = slot.course_category || "";
  if (cat.includes("必修")) {
    return { label: "必修", bg: "bg-blue-100 text-blue-700 border-blue-200" };
  }
  if (cat.includes("通識")) {
    return { label: "通識", bg: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  }
  if (cat.includes("體育")) {
    return { label: "體育", bg: "bg-teal-100 text-teal-700 border-teal-200" };
  }
  if (cat.includes("語言") || cat.includes("外文")) {
    return { label: "語言選修", bg: "bg-indigo-100 text-indigo-700 border-indigo-200" };
  }
  if (cat.includes("選修")) {
    return { label: "系選修", bg: "bg-violet-100 text-violet-700 border-violet-200" };
  }
  return { label: cat || "課程", bg: "bg-blue-100 text-blue-700 border-blue-200" };
}

export function WeeklySchedule({
  schedule,
  currentTurn,
  onSelectSlot,
}: {
  schedule: ScheduleSlot[];
  currentTurn: number;
  onSelectSlot?: (slot: ScheduleSlot) => void;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 flex flex-col h-full border border-stone-200 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-stone-900">週一至週五 動態全日程 (30 時段)</h3>
        </div>
        <span className="text-[11px] font-mono text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
          進度 {Math.min(30, currentTurn + 1)} / 30
        </span>
      </div>

      {/* Grid: 5 days */}
      <div className="grid grid-cols-5 gap-2 overflow-x-auto text-center flex-1">
        {DAYS.map((dayName, dIdx) => (
          <div key={dIdx} className="flex flex-col gap-1.5 min-w-[96px]">
            {/* Day Header */}
            <div className="py-1 px-1.5 bg-stone-100 rounded-lg text-xs font-bold text-stone-700 border border-stone-200 flex items-center justify-center gap-1">
              <span>{dayName}</span>
            </div>

            {/* 6 Timeline Slots */}
            {TIMELINE_SLOTS.map((slotMeta, sIdx) => {
              const turnIdx = dIdx * 6 + sIdx;
              const slot = schedule[turnIdx];
              const isCurrent = turnIdx === currentTurn;
              const isPast = turnIdx < currentTurn;
              const badge = getCategoryBadge(slot);

              let cardBg = "border-stone-200 bg-stone-50/70 text-stone-600";
              if (slot?.type === "course") {
                if (slot.course_category?.includes("通識")) {
                  cardBg = "border-emerald-200 bg-emerald-50/60 text-emerald-950";
                } else if (slot.course_category?.includes("體育")) {
                  cardBg = "border-teal-200 bg-teal-50/60 text-teal-950";
                } else if (slot.course_category?.includes("語言")) {
                  cardBg = "border-indigo-200 bg-indigo-50/60 text-indigo-950";
                } else if (slot.course_category?.includes("選修")) {
                  cardBg = "border-violet-200 bg-violet-50/60 text-violet-950";
                } else {
                  cardBg = "border-blue-200 bg-blue-50/60 text-blue-950";
                }
              } else if (slot?.type === "club") {
                cardBg = "border-purple-200 bg-purple-50/60 text-purple-950";
              } else if (slot?.type === "lunch") {
                cardBg = "border-amber-200 bg-amber-50/50 text-amber-950";
              }

              return (
                <div
                  key={sIdx}
                  onClick={() => slot && onSelectSlot && onSelectSlot(slot)}
                  className={`p-1.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer min-h-[76px] ${cardBg} ${
                    isCurrent
                      ? "ring-2 ring-blue-500 bg-white shadow-md scale-[1.02] border-blue-400 z-10"
                      : isPast
                      ? "opacity-60"
                      : "hover:border-stone-400 hover:shadow-xs"
                  }`}
                >
                  <div>
                    {/* Time & Badge Row */}
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-[9px] font-mono text-stone-500">
                        {slotMeta.short}
                      </span>
                      {badge && (
                        <span
                          className={`text-[8px] px-1 py-0.2 rounded border font-medium ${badge.bg}`}
                        >
                          {badge.label}
                        </span>
                      )}
                    </div>

                    {/* Course / Event Title */}
                    <span className="text-[11px] font-bold line-clamp-2 leading-tight">
                      {slot?.title || "自主充實"}
                    </span>
                  </div>

                  {/* Footer: Location or Instructor */}
                  <div className="mt-1 flex items-center justify-between text-[9px] text-stone-500">
                    {slot?.location_name ? (
                      <span className="truncate flex items-center gap-0.5" title={slot.location_name}>
                        <MapPin className="w-2.5 h-2.5 shrink-0 text-blue-600" />
                        <span className="truncate">{slot.location_name}</span>
                      </span>
                    ) : (
                      <span className="truncate">{slotMeta.time}</span>
                    )}

                    {slot?.credits !== undefined && slot.credits > 0 && (
                      <span className="shrink-0 font-mono text-[9px] text-blue-600 font-semibold ml-1">
                        {slot.credits}學分
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
