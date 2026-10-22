"use client";

import { Calendar, Clock, MapPin } from "lucide-react";
import { ScheduleSlot } from "@/store/useSimulatorStore";

const DAYS = ["週一", "週二", "週三", "週四", "週五", "週六", "週日"];
const SLOTS = [
  { key: "morning", label: "早 (08:00~12:00)" },
  { key: "afternoon", label: "午 (13:00~17:00)" },
  { key: "evening", label: "晚 (18:00~21:00)" },
];

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
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-stone-900">一週動態行事曆 (21 時段)</h3>
        </div>
        <span className="text-[11px] font-mono text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
          進度 {Math.min(21, currentTurn + 1)} / 21
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1.5 overflow-x-auto text-center flex-1">
        {DAYS.map((dayName, dIdx) => (
          <div key={dIdx} className="flex flex-col gap-1 min-w-[70px]">
            <span className="text-[11px] font-bold text-stone-600 py-1 bg-stone-100 rounded-t-lg">
              {dayName}
            </span>
            {SLOTS.map((slotMeta, sIdx) => {
              const turnIdx = dIdx * 3 + sIdx;
              const slot = schedule[turnIdx];
              const isCurrent = turnIdx === currentTurn;
              const isPast = turnIdx < currentTurn;

              let typeColor = "border-stone-200 bg-stone-50 text-stone-600";
              if (slot?.type === "course") {
                typeColor = "border-blue-200 bg-blue-50 text-blue-800";
              } else if (slot?.type === "club") {
                typeColor = "border-purple-200 bg-purple-50 text-purple-800";
              }

              return (
                <div
                  key={sIdx}
                  onClick={() => slot && onSelectSlot && onSelectSlot(slot)}
                  className={`p-1.5 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer h-20 ${typeColor} ${
                    isCurrent
                      ? "ring-2 ring-blue-500 bg-blue-100 shadow-xs scale-[1.02]"
                      : isPast
                      ? "opacity-60"
                      : "hover:border-stone-400"
                  }`}
                >
                  <div>
                    <span className="text-[9px] font-mono block opacity-75">
                      {slotMeta.key === "morning" ? "早" : slotMeta.key === "afternoon" ? "午" : "晚"}
                    </span>
                    <span className="text-[11px] font-bold line-clamp-2 leading-tight">
                      {slot?.title || "自由探索"}
                    </span>
                  </div>

                  {slot?.location_name && (
                    <span className="text-[9px] opacity-75 truncate flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5 shrink-0" />
                      {slot.location_name}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
