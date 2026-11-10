"use client";

import { MapPin, CheckCircle2, User, BookOpen, Moon, Sun, Sunrise, Utensils, Music, Coffee, Compass, AlertCircle, Ban } from "lucide-react";
import { ScheduleSlot } from "@/store/useSimulatorStore";


function getEventIcon(slot: ScheduleSlot) {
  if (slot.type === "breakfast") {
    return <Coffee className="w-4 h-4 text-stone-600" />;
  }
  if (slot.type === "lunch" || slot.type === "dinner") {
    return <Utensils className="w-4 h-4 text-stone-600" />;
  }
  if (slot.type === "dorm") {
    if (slot.start_time && slot.start_time < "12:00") {
      return <Sunrise className="w-4 h-4 text-stone-600" />;
    }
    return <Moon className="w-4 h-4 text-stone-600" />;
  }
  if (slot.type === "campus_leisure") {
    return <Compass className="w-4 h-4 text-stone-600" />;
  }
  if (slot.type === "club") {
    return <Music className="w-4 h-4 text-stone-600" />;
  }
  if (slot.type === "free") {
    return <Sun className="w-4 h-4 text-stone-500" />;
  }
  return <BookOpen className="w-4 h-4 text-violet-600" />;
}

function getCategoryBadge(slot: ScheduleSlot) {
  if (slot.type === "breakfast") return { label: "晨光早餐" };
  if (slot.type === "lunch") return { label: "午膳時光" };
  if (slot.type === "dinner") return { label: "晚餐時光" };
  if (slot.type === "dorm") return { label: "宿舍休閒" };
  if (slot.type === "campus_leisure") return { label: "校園休閒" };
  if (slot.type === "club") return { label: "社團活動" };
  if (slot.type === "free") return { label: "自主充實" };
  const cat = slot.course_category || "";
  if (cat.includes("雙主修")) return { label: "雙主修" };
  if (cat.includes("輔系") || cat.includes("輔修")) return { label: "輔系" };
  if (cat.includes("通識")) return { label: "通識" };
  if (cat.includes("體育")) return { label: "體育" };
  if (cat.includes("語言") || cat.includes("外文")) return { label: "語言選修" };
  if (cat.includes("選修")) return { label: "系選修" };
  return { label: "必修" };
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

  const todaySlots = schedule
    .map((slot, index) => ({ slot, index }))
    .filter(({ slot, index }) => {
      if (slot.day !== activeDay) return false;
      if (
        (slot.type === "lunch_prompt" || slot.type === "dinner_prompt" || slot.type === "leisure_prompt" || slot.type === "day_end") &&
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
      {/* Chronological Timeline List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {todaySlots.map(({ slot, index }) => {
          const isCurrent = index === currentTurn;
          const isPast = index < currentTurn;
          const isSkipped = Boolean(slot.is_skipped);
          const badge = getCategoryBadge(slot);
          const icon = getEventIcon(slot);

          let cardBorder = "border-stone-200 bg-stone-50/60";
          if (isSkipped) {
            cardBorder = "border-dashed border-rose-300 bg-rose-50/30";
          } else if (isCurrent) {
            cardBorder = "ring-2 ring-violet-500 bg-white shadow-md border-violet-300 scale-[1.01]";
          } else if (isPast) {
            cardBorder = "border-stone-200 bg-stone-50/40";
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
                  <span className="text-xs px-2 py-0.5 rounded-md border border-stone-200 bg-stone-100 text-stone-700 font-medium">
                    {badge.label}
                  </span>
                  {isSkipped ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full shadow-2xs">
                      <Ban className="w-3 h-3 text-rose-600" />
                      已跳過
                    </span>
                  ) : isCurrent ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-white bg-violet-600 px-2.5 py-0.5 rounded-full animate-pulse shadow-xs">
                      進行中
                    </span>
                  ) : isPast ? (
                    <span className="text-stone-500" title="已完成">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Event Title */}
              <h4 className={`text-sm font-bold mb-1.5 leading-snug ${
                isSkipped ? "line-through text-stone-500" : "text-stone-900"
              }`}>
                {slot.title}
              </h4>

              {/* Skipped Reason Badge */}
              {isSkipped && slot.skip_reason && (
                <div className="mb-2 px-2.5 py-1 rounded-md bg-rose-50 border border-rose-200 flex items-center gap-1.5 text-xs text-rose-700">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span className="font-medium">{slot.skip_reason}</span>
                </div>
              )}

              {/* Bottom Meta: Location, Instructor, Credits */}
              <div className="flex flex-wrap items-center justify-between text-xs text-stone-600 gap-1.5 pt-1.5 border-t border-stone-100">
                <div className="flex items-center gap-2.5 truncate">
                  {slot.location_name && (
                    <span className="flex items-center gap-1 truncate text-stone-700" title={slot.location_name}>
                      <MapPin className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                      <span className="truncate">{slot.location_name}</span>
                    </span>
                  )}
                  {slot.instructor && (
                    <span className="flex items-center gap-1 truncate text-stone-600">
                      <User className="w-3.5 h-3.5 shrink-0" />
                      <span>{slot.instructor}</span>
                    </span>
                  )}
                </div>

                {slot.credits !== undefined && slot.credits > 0 && (
                  <span className="font-mono text-xs text-violet-700 font-bold shrink-0">
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
