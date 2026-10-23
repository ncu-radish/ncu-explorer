"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Compass, RotateCcw, MapPin, Maximize2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSimulatorStore } from "@/store/useSimulatorStore";
import { OnboardingModal } from "@/components/simulator/OnboardingModal";
import { StatsBar } from "@/components/simulator/StatsBar";
import { WeeklySchedule } from "@/components/simulator/WeeklySchedule";
import { StoryDialog } from "@/components/simulator/StoryDialog";
import { SummaryModal } from "@/components/simulator/SummaryModal";

// Dynamic import for 3D Canvas Scene
const CampusScene = dynamic(
  () => import("@/components/three/CampusScene").then((mod) => mod.CampusScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-black/40 text-gray-500 text-xs">
        載入 3D 校園...
      </div>
    ),
  }
);

const DAYS = ["週一", "週二", "週三", "週四", "週五"];
const SLOTS_MAP: Record<string, string> = {
  slot_1: "晨光早課 (08:00~10:00)",
  slot_2: "上午主修 (10:00~12:00)",
  slot_3: "午膳漫步 (12:00~13:00)",
  slot_4: "午後專修 (13:00~15:00)",
  slot_5: "下晝研討 (15:00~17:00)",
  slot_6: "晚間校園 (18:00~21:00)",
  morning: "上午時段",
  afternoon: "下午時段",
  evening: "晚間時段",
};

export default function SimulatorPage() {
  const {
    sessionId,
    weeklySchedule,
    currentTurn,
    stats,
    story,
    currentLocationId,
    currentLocationName,
    isGameOver,
    isLoading,
    chooseOption,
    resetSimulation,
  } = useSimulatorStore();

  const [focusedLoc, setFocusedLoc] = useState<string | null>(null);

  useEffect(() => {
    if (currentLocationId) {
      setFocusedLoc(currentLocationId);
    }
  }, [currentLocationId]);

  const currentSlotInfo = weeklySchedule[currentTurn] || {};
  const dayName = DAYS[Math.max(0, Math.min(4, (currentSlotInfo.day || 1) - 1))];
  const slotName = SLOTS_MAP[currentSlotInfo.slot || "slot_1"] || currentSlotInfo.time_label || "當前時段";

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 max-w-7xl mx-auto w-full gap-5">
      {/* Onboarding Dialog */}
      <OnboardingModal isOpen={!sessionId} />

      {/* Week End Summary Dialog */}
      <SummaryModal isOpen={isGameOver} />

      {/* Top Simulator Control Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 text-stone-700 text-xs font-medium transition-colors border border-stone-300 shadow-xs"
            title="回首頁"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>回首頁</span>
          </Link>
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-stone-900 tracking-tight flex items-center gap-2">
              中央大學一週生活模擬器
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Turn {Math.min(30, currentTurn + 1)} / 30
              </span>
            </h1>
            <p className="text-xs text-stone-500">
              {currentSlotInfo.title ? `當前行程：${currentSlotInfo.title}` : "正在排程中..."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/explore"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-stone-100 text-stone-700 text-xs transition-colors border border-stone-300 shadow-xs"
          >
            <span>相關資料</span>
          </Link>
          <button
            onClick={resetSimulation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-stone-100 text-stone-700 text-xs transition-colors border border-stone-300 shadow-xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>重新開局</span>
          </button>
          <Link
            href="/map"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>全螢幕 3D 地圖</span>
          </Link>
        </div>
      </div>

      {/* Four Dimensions Stats Bar */}
      <StatsBar stats={stats} />

      {/* Main Game Interface: Left Calendar + Right Narrative & 3D PiP */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-[500px]">
        {/* Left Column: Calendar (5 cols) */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-[350px]">
          <WeeklySchedule
            schedule={weeklySchedule}
            currentTurn={currentTurn}
            onSelectSlot={(slot) => {
              if (slot.location_id) setFocusedLoc(slot.location_id);
            }}
          />
        </div>

        {/* Right Column: 3D PiP + Story Narrative (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* 3D PiP Mini Map */}
          <div className="h-48 sm:h-52 rounded-2xl bg-white overflow-hidden relative border border-stone-200 shadow-xs">
            <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-xs text-xs text-stone-800 border border-stone-300 shadow-xs">
              <MapPin className="w-3 h-3 text-blue-600" />
              <span>3D 場景：{currentLocationName || "中大校園"}</span>
            </div>

            <CampusScene
              focusedLocationId={focusedLoc}
              onSelectBuilding={(id) => setFocusedLoc(id)}
              interactive={true}
            />
          </div>

          {/* Central Story Dialog */}
          <StoryDialog
            story={story}
            dayName={dayName}
            slotName={slotName}
            locationName={currentLocationName || "中大校園"}
            slot={currentSlotInfo}
            isLoading={isLoading}
            onChoose={(key) => chooseOption(key)}
            onFocusLocation={() => {
              if (currentLocationId) setFocusedLoc(currentLocationId);
            }}
          />
        </div>
      </div>
    </div>
  );
}
