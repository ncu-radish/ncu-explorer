"use client";

import { Clock, MapPin, CheckCircle2, ChevronRight, User, BookOpen, Moon, Sun, Sunrise, Utensils, Music, Home, Coffee, Compass } from "lucide-react";
import { ScheduleSlot } from "@/store/useSimulatorStore";

const DAYS = ["週一", "週二", "週三", "週四", "週五"];

function getEventIcon(slot: ScheduleSlot) {
  if (slot.type === "breakfast") {
    return <Coffee className="w-4 h-4 text-amber-500" />;
  }
  if (slot.type === "lunch") {
    return <Utensils className="w-4 h-4 text-amber-600" />;
  }
  if (slot.type === "dinner") {
    return <Utensils className="w-4 h-4 text-orange-600" />;
  }
  if (slot.type === "dorm") {
    if (slot.start_time && slot.start_time < "12:00") {
      return <Sunrise className="w-4 h-4 text-amber-500" />;
    }
    return <Moon className="w-4 h-4 text-indigo-500" />;
  }
  if (slot.type === "campus_leisure") {
    return <Compass className="w-4 h-4 text-teal-600" />;
  }
  if (slot.type === "club") {
    return <Music className="w-4 h-4 text-purple-600" />;
  }
  if (slot.type === "free") {
    return <Sun className="w-4 h-4 text-stone-500" />;
  }
  return <BookOpen className="w-4 h-4 text-blue-600" />;
}

function getCategoryBadge(slot: ScheduleSlot) {
  if (slot.type === "breakfast") {
    return { label: "晨光早餐", bg: "bg-yellow-100 text-yellow-800 border-yellow-200" };
  }
  if (slot.type === "lunch") {
    return { label: "午膳時光", bg: "bg-amber-100 text-amber-700 border-amber-200" };
  }
  if (slot.type === "dinner") {
    return { label: "晚餐時光", bg: "bg-orange-100 text-orange-800 border-orange-200" };
  }
  if (slot.type === "dorm") {
    return { label: "宿舍休閒", bg: "bg-slate-100 text-slate-700 border-slate-200" };
  }
  if (slot.type === "campus_leisure") {
    return { label: "校園休閒", bg: "bg-teal-100 text-teal-800 border-teal-200" };
  }
  if (slot.type === "club") {
    return { label: "社團活動", bg: "bg-purple-100 text-purple-700 border-purple-200" };
  }
  if (slot.type === "free") {
    return { label: "自主充實", bg: "bg-stone-100 text-stone-600 border-stone-200" };
  }
  const cat = slot.course_category || "";

  if (cat.includes("雙主修")) {
    return { label: "雙主修", bg: "bg-rose-100 text-rose-800 border-rose-200" };
  }
  if (cat.includes("輔系") || cat.includes("輔修")) {
    return { label: "輔系", bg: "bg-amber-100 text-amber-800 border-amber-200" };
  }
  if (cat.includes("通識")) {

    return { label: "通識", bg: "bg-emerald-100 text-emerald-800 border-emerald-200" };
  }
  if (cat.includes("體育")) {
    return { label: "體育", bg: "bg-teal-100 text-teal-800 border-teal-200" };
  }
  if (cat.includes("語言") || cat.includes("外文")) {
    return { label: "語言選修", bg: "bg-indigo-100 text-indigo-800 border-indigo-200" };
  }
  if (cat.includes("選修")) {
    return { label: "系選修", bg: "bg-violet-100 text-violet-800 border-violet-200" };
  }
  return { label: "必修", bg: "bg-blue-100 text-blue-800 border-blue-200" };
}

export function DailyTimelineView({
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
  const dayName = DAYS[Math.max(0, Math.min(4, activeDay - 1))];

  // Filter and sort slots for the current active day strictly by start_time
  const todaySlots = schedule
    .map((slot, index) => ({ slot, index }))
    .filter(({ slot, index }) => {
      if (slot.day !== activeDay) return false;
      // 隱藏未觸發的內部檢查點 (僅在是當前回合時才呈現或互動)
      if (
        (slot.type === "lunch_prompt" || slot.type === "leisure_prompt" || slot.type === "day_end") &&
        index !== currentTurn
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      const timeA = a.slot.start_time || "00:00";
      const timeB = b.slot.start_time || "00:00";
      return timeA.localeCompare(timeB);
    });

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-stone-200 bg-stone-50/70">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
              <span>{dayName}日程</span>
              <span className="text-[11px] font-normal text-stone-500 font-mono">
                (本日共 {todaySlots.length} 個時段)
              </span>
            </h3>
          </div>
        </div>
        <span className="text-[11px] font-mono text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 font-medium">
          模擬當日
        </span>
      </div>

      {/* Chronological Timeline List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {todaySlots.map(({ slot, index }) => {
          const isCurrent = index === currentTurn;
          const isPast = index < currentTurn;
          const badge = getCategoryBadge(slot);
          const icon = getEventIcon(slot);

          let cardBorder = "border-stone-200 bg-stone-50/60";
          if (isCurrent) {
            cardBorder = "ring-2 ring-blue-500 bg-white shadow-md border-blue-300 scale-[1.01]";
          } else if (isPast) {
            cardBorder = "border-stone-200 bg-stone-50/40 opacity-70";
          }

          return (
            <div
              key={index}
              onClick={() => onSelectSlot && onSelectSlot(slot)}
              className={`p-3 rounded-xl border transition-all cursor-pointer relative ${cardBorder} hover:border-stone-400 hover:shadow-xs`}
            >
              {/* Top Row: Time & Category */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-stone-100 border border-stone-200 flex items-center justify-center">
                    {icon}
                  </span>
                  <span className="text-xs font-mono font-bold text-stone-900">
                    {slot.display_time || slot.time_label || slot.start_time}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${badge.bg}`}>
                    {badge.label}
                  </span>
                  {isCurrent && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-white bg-blue-600 px-2 py-0.5 rounded-full animate-pulse shadow-xs">
                      進行中
                    </span>
                  )}
                  {isPast && (
                    <span className="text-stone-400" title="已完成">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>

              {/* Event Title */}
              <h4 className="text-sm font-bold text-stone-900 mb-1.5 leading-snug">
                {slot.title}
              </h4>

              {/* Bottom Meta: Location, Instructor, Credits */}
              <div className="flex flex-wrap items-center justify-between text-xs text-stone-500 gap-1.5 pt-1.5 border-t border-stone-100">
                <div className="flex items-center gap-2 truncate">
                  {slot.location_name && (
                    <span className="flex items-center gap-1 truncate text-stone-600" title={slot.location_name}>
                      <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
                      <span className="truncate">{slot.location_name}</span>
                    </span>
                  )}
                  {slot.instructor && (
                    <span className="flex items-center gap-1 truncate text-stone-500">
                      <User className="w-3 h-3 shrink-0" />
                      <span>{slot.instructor}</span>
                    </span>
                  )}
                </div>

                {slot.credits !== undefined && slot.credits > 0 && (
                  <span className="font-mono text-xs text-blue-600 font-bold shrink-0">
                    {slot.credits} 學分
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
