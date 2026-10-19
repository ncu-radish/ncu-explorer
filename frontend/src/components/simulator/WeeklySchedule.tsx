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
    <div className="glass-panel rounded-2xl p-4 flex flex-col h-full border border-white/10">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">一週動態行事曆 (21 時段)</h3>
        </div>
        <span className="text-[11px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
          進度 {Math.min(21, currentTurn + 1)} / 21
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1.5 overflow-x-auto text-center flex-1">
        {DAYS.map((dayName, dIdx) => (
          <div key={dIdx} className="flex flex-col gap-1 min-w-[70px]">
            <span className="text-[11px] font-bold text-gray-400 py-1 bg-white/5 rounded-t-lg">
              {dayName}
            </span>
            {SLOTS.map((slotMeta, sIdx) => {
              const turnIdx = dIdx * 3 + sIdx;
              const slot = schedule[turnIdx];
              const isCurrent = turnIdx === currentTurn;
              const isPast = turnIdx < currentTurn;

              let typeColor = "border-white/5 bg-white/5 text-gray-400";
              if (slot?.type === "course") {
                typeColor = "border-blue-500/30 bg-blue-500/10 text-blue-300";
              } else if (slot?.type === "club") {
                typeColor = "border-purple-500/30 bg-purple-500/10 text-purple-300";
              }

              return (
                <div
                  key={sIdx}
                  onClick={() => slot && onSelectSlot && onSelectSlot(slot)}
                  className={`p-1.5 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer h-20 ${typeColor} ${
                    isCurrent
                      ? "ring-2 ring-cyan-400 bg-blue-600/30 shadow-md shadow-cyan-500/20 scale-[1.02]"
                      : isPast
                      ? "opacity-60"
                      : "hover:border-cyan-500/40"
                  }`}
                >
                  <div className="flex items-center justify-between text-[9px] font-mono mb-1">
                    <span className="text-gray-400">{slotMeta.label.slice(0, 1)}</span>
                    {isCurrent && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    )}
                  </div>
                  <span className="text-[10px] font-bold line-clamp-2 leading-tight">
                    {slot?.title || "自由時間"}
                  </span>
                  <span className="text-[8px] text-gray-400 truncate flex items-center gap-0.5 mt-auto">
                    <MapPin className="w-2.5 h-2.5 shrink-0" />
                    {slot?.location_name || "校園"}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
