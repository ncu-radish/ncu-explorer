"use client";

import { useState } from "react";
import { Calendar, Clock, Maximize2, X } from "lucide-react";
import { ScheduleSlot } from "@/store/useSimulatorStore";
import { DailyTimelineView } from "./DailyTimelineView";
import { GoogleCalendarWeekView } from "./GoogleCalendarWeekView";

const DAYS = ["週一", "週二", "週三", "週四", "週五"];

export function WeeklySchedule({
  schedule,
  currentTurn,
  onSelectSlot,
}: {
  schedule: ScheduleSlot[];
  currentTurn: number;
  onSelectSlot?: (slot: ScheduleSlot) => void;
}) {
  const [viewMode, setViewMode] = useState<"day" | "week">("day");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentSlot = schedule[currentTurn];
  const activeDay = currentSlot?.day || 1;
  const dayName = DAYS[Math.max(0, Math.min(4, activeDay - 1))];

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Top Switcher Tabs: Daily vs. Google Calendar Week */}
      <div className="flex items-center justify-between p-1 bg-stone-100 rounded-xl border border-stone-200">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode("day")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === "day"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>當日行程 ({dayName})</span>
          </button>

          <button
            onClick={() => setViewMode("week")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === "week"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>整週行事曆 (週檢視)</span>
          </button>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-stone-500 hover:text-stone-800 text-xs transition-colors cursor-pointer"
          title="全螢幕放大週行事曆"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">全螢幕放大</span>
        </button>
      </div>

      {/* Main View Area */}
      <div className="flex-1 min-h-[460px]">
        {viewMode === "day" ? (
          <DailyTimelineView
            schedule={schedule}
            currentTurn={currentTurn}
            onSelectSlot={onSelectSlot}
          />
        ) : (
          <GoogleCalendarWeekView
            schedule={schedule}
            currentTurn={currentTurn}
            onSelectSlot={onSelectSlot}
          />
        )}
      </div>

      {/* Fullscreen Expanded Google Calendar Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-6xl h-[88vh] flex flex-col p-4 sm:p-6 shadow-2xl border border-stone-200 relative overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-stone-900">
                  一週生活全景行事曆 (Google Calendar 風格)
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Calendar Body */}
            <div className="flex-1 overflow-hidden">
              <GoogleCalendarWeekView
                schedule={schedule}
                currentTurn={currentTurn}
                onSelectSlot={(slot) => {
                  if (onSelectSlot) onSelectSlot(slot);
                  setIsModalOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
