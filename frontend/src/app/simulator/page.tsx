"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { RotateCcw, MapPin, Maximize2, CalendarDays, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSimulatorStore, ScheduleSlot } from "@/store/useSimulatorStore";
import { OnboardingModal } from "@/components/simulator/OnboardingModal";
import { StatsBar } from "@/components/simulator/StatsBar";
import { WeeklySchedule } from "@/components/simulator/WeeklySchedule";
import { StoryDialog } from "@/components/simulator/StoryDialog";
import { SummaryModal } from "@/components/simulator/SummaryModal";
import { CampusTimeWidget } from "@/components/simulator/CampusTimeWidget";
import { ActivitySelectionModal } from "@/components/simulator/ActivitySelectionModal";
import { PrePlanModal } from "@/components/simulator/PrePlanModal";
import { adminApi, exploreApi, CampusActivity } from "@/lib/api";
import { useMapStore } from "@/store/useMapStore";

// Dynamic import for 3D Canvas Scene
const CampusScene = dynamic(
  () => import("@/components/three/CampusScene").then((mod) => mod.CampusScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-500 text-xs">
        載入 3D 校園...
      </div>
    ),
  }
);

// Where the player wakes up each morning (route origin for the first stop of a day)
const HOME_LOCATION_ID = "loc_dorm_boy9";

const DAYS = ["週一", "週二", "週三", "週四", "週五"];

export default function SimulatorPage() {
  const {
    sessionId,
    weeklySchedule,
    currentTurn,
    currentTime,
    currentDay,
    stats,
    story,
    currentLocationId,
    currentLocationName,
    isGameOver,
    isLoading,
    chooseOption,
    triggerDynamicActivity,
    prePlanTomorrow,
    resetSimulation,
  } = useSimulatorStore();

  const currentSlotInfo = weeklySchedule[currentTurn] || {};
  const activeDay = currentSlotInfo.day || currentDay || 1;
  const dayName = DAYS[Math.max(0, Math.min(4, activeDay - 1))];
  const slotTime = currentSlotInfo.start_time || currentTime || "08:00";
  const slotName = currentSlotInfo.display_time || `${slotTime}`;
  const totalTurns = weeklySchedule.length || 30;

  const [focusedLoc, setFocusedLoc] = useState<string | null>(null);

  // Activity Database State
  const [activities, setActivities] = useState<CampusActivity[]>([]);

  // Modal States
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityCategory, setActivityCategory] = useState<"lunch" | "dorm_leisure" | "campus_leisure" | "night_leisure">("lunch");

  const [prePlanModalOpen, setPrePlanModalOpen] = useState(false);
  const [prePlanTargetDay, setPrePlanTargetDay] = useState<number>(2);

  // Load backend activities
  useEffect(() => {
    adminApi.getActivities().then((res) => {
      if (res && res.length > 0) {
        setActivities(res);
      }
    }).catch(() => {
      // Fallback handled in modal
    });
  }, []);

  useEffect(() => {
    const locId = currentLocationId || currentSlotInfo?.location_id;
    if (locId) {
      setFocusedLoc(locId);
    }
  }, [currentTurn, currentLocationId, currentSlotInfo?.location_id]);

  // Show the walking route from the previous stop to the current one on the 3D map
  const prevSlot = currentTurn > 0 ? weeklySchedule[currentTurn - 1] : undefined;
  const routeToId = currentSlotInfo.is_skipped ? undefined : currentSlotInfo.location_id;
  const routeFromId =
    prevSlot && prevSlot.day === currentSlotInfo.day && !prevSlot.is_skipped && prevSlot.location_id
      ? prevSlot.location_id
      : HOME_LOCATION_ID;

  useEffect(() => {
    const { setRoute } = useMapStore.getState();
    if (!routeToId || routeToId === routeFromId) {
      setRoute(null);
      return;
    }
    let cancelled = false;
    exploreApi
      .getRoute(routeFromId, routeToId)
      .then((r) => {
        if (cancelled) return;
        setRoute(
          r.distance < 1
            ? null
            : { fromId: r.from_id, toId: r.to_id, distance: r.distance, path: r.path }
        );
      })
      .catch(() => {
        if (!cancelled) setRoute(null);
      });
    return () => {
      cancelled = true;
    };
  }, [routeFromId, routeToId, currentTurn]);

  // The route lives in a global store; clear it when leaving the simulator
  useEffect(() => {
    return () => useMapStore.getState().setRoute(null);
  }, []);

  // Time Transition Pipeline States
  const [isTimeFlowing, setIsTimeFlowing] = useState(false);
  const [flowFrom, setFlowFrom] = useState("08:00");
  const [flowTo, setFlowTo] = useState("12:00");
  const flowResolverRef = useRef<(() => void) | null>(null);

  const startFlowingTransition = (fromTime: string, toTime: string): Promise<void> => {
    setFlowFrom(fromTime);
    setFlowTo(toTime);
    setIsTimeFlowing(true);

    return new Promise((resolve) => {
      flowResolverRef.current = resolve;
    });
  };

  const handleFlowComplete = () => {
    setIsTimeFlowing(false);
    if (flowResolverRef.current) {
      flowResolverRef.current();
      flowResolverRef.current = null;
    }
  };

  const handleSkipFlow = () => {
    handleFlowComplete();
  };

  const executeWithTimeFlow = async (action: () => Promise<any>) => {
    const curStart = currentSlotInfo.start_time || currentTime || "08:00";
    const nextSlot = weeklySchedule[currentTurn + 1];
    const targetEnd = nextSlot?.start_time || currentSlotInfo.end_time || "12:00";

    // Run linear ticking animation and action concurrently
    const flowPromise = startFlowingTransition(curStart, targetEnd);
    const actionPromise = action().catch(() => {});

    await Promise.all([flowPromise, actionPromise]);
  };

  // Handle options with two-phase workflow
  const handleChooseOption = async (optionKey: string) => {
    // 突發事件為獨立偶發事件，不進入常規 lunch/leisure/sleep 攔截器，直接向後端提交抉擇
    if (story?.is_random_event) {
      const prevTime = currentSlotInfo?.start_time || currentTime || "08:00";
      const res = await chooseOption(optionKey);
      const nextTime = res?.current_time;
      // 只有當時間確實有所前進或跳轉時才播放時間流轉動畫，避免不耗時間時誤跳到下個時段又彈回
      if (nextTime && nextTime !== prevTime) {
        await startFlowingTransition(prevTime, nextTime);
      }
      return;
    }
    const slotType = currentSlotInfo.type;

    // Phase 1: 12:00 Lunch prompt
    if (slotType === "lunch_prompt") {
      if (optionKey === "A") {
        // User said YES to lunch -> open lunch selector
        setActivityCategory("lunch");
        setActivityModalOpen(true);
        return;
      }
      // User said NO -> skip lunch and advance with linear time flow
      await executeWithTimeFlow(() => chooseOption(optionKey));
      return;
    }

    // Phase 2: Leisure prompt (after classes or gap)
    if (slotType === "leisure_prompt") {
      if (optionKey === "A") {
        // User chose to return to dorm -> open dorm leisure selector (1~3 hrs)
        setActivityCategory("dorm_leisure");
        setActivityModalOpen(true);
        return;
      }
      if (optionKey === "B") {
        // User chose campus leisure -> open campus activity selector (1~3 hrs)
        setActivityCategory("campus_leisure");
        setActivityModalOpen(true);
        return;
      }
      // User chose C (skip) -> advance with linear time flow
      await executeWithTimeFlow(() => chooseOption(optionKey));
      return;
    }

    // Phase 3: 21:00 開始晚間時段與換日線 (05:00) 嚴格雙選項抉擇
    const currentStartTime = currentSlotInfo.start_time || currentTime || "08:00";
    const isLateNight =
      slotType === "day_end" ||
      currentStartTime >= "21:00" ||
      currentStartTime < "05:00";

    if (isLateNight) {
      if (optionKey === "A") {
        // 使用者點選「🛏️ 去睡覺」-> 自動進入設鬧鐘以及預排行程頁面
        const nextDay = Math.min(5, (currentSlotInfo.day || currentDay || 1) + 1);
        setPrePlanTargetDay(nextDay);
        setPrePlanModalOpen(true);
        return;
      }
      if (optionKey === "B") {
        // 使用者點選「🌙 進行活動 (宿舍 & 校園活動)」-> 開啟夜間活動彈窗
        setActivityCategory("night_leisure");
        setActivityModalOpen(true);
        return;
      }
      // 備援推進
      await executeWithTimeFlow(() => chooseOption(optionKey));
      return;
    }

    // Normal story turns: advance with linear time flow
    await executeWithTimeFlow(() => chooseOption(optionKey));
  };

  // Calculate maximum hours available before next scheduled event or 05:00 cutoff
  const calcAvailableHours = (): number => {
    if (!currentSlotInfo) return 1;
    const currentStart = currentSlotInfo.start_time || currentTime || "12:00";
    const day = currentSlotInfo.day || currentDay || 1;

    // 若在晚間或深夜時段 (21:00 ~ 05:00)，以清晨 05:00 換日線計算最大可用小時
    const isLateNight = currentStart >= "21:00" || currentStart < "05:00";
    if (isLateNight) {
      const [h, m] = currentStart.split(":").map(Number);
      const nightMins = (h < 5 ? h + 24 : h) * 60 + (m || 0);
      const cutoffMins = 29 * 60; // 05:00 (次日凌晨換日線)
      const remainHours = Math.floor((cutoffMins - nightMins) / 60);
      return Math.max(1, Math.min(3, remainHours));
    }

    const laterEvents = weeklySchedule.filter(
      (s) =>
        s.day === day &&
        (s.start_time || "00:00") > currentStart &&
        s.type !== "lunch_prompt" &&
        s.type !== "leisure_prompt" &&
        s.type !== "day_end"
    );
    if (laterEvents.length === 0) return 3;
    const sorted = [...laterEvents].sort((a, b) => (a.start_time || "00:00").localeCompare(b.start_time || "00:00"));
    const nextStart = sorted[0].start_time || "21:00";
    const [h1, m1] = currentStart.split(":").map(Number);
    const [h2, m2] = nextStart.split(":").map(Number);
    const diffHours = (h2 * 60 + m2 - (h1 * 60 + m1)) / 60;
    return Math.max(1, Math.min(3, Math.floor(diffHours)));
  };

  // Activity Modal Confirm Callback
  const handleConfirmActivity = async (
    activityId: string,
    optionKey: string,
    durationHours: number,
    customTitle?: string,
    durationMinutes?: number,
    customEndTime?: string
  ) => {
    await executeWithTimeFlow(() =>
      triggerDynamicActivity(
        activityId,
        optionKey,
        durationHours,
        customTitle,
        durationMinutes,
        customEndTime
      )
    );
  };

  const currentStartTime = currentSlotInfo.start_time || currentTime || "08:00";
  const canGoToSleep =
    currentStartTime >= "21:00" ||
    currentSlotInfo.type === "day_end" ||
    (currentSlotInfo.type === "dorm" && currentStartTime >= "20:00");

  const handleOpenSleepModal = () => {
    const nextDay = Math.min(5, (currentSlotInfo.day || currentDay || 1) + 1);
    setPrePlanTargetDay(nextDay);
    setPrePlanModalOpen(true);
  };

  // Pre-Plan Tomorrow & Sleep Confirm Callback
  const handleConfirmPrePlan = async (
    targetDay: number,
    slots: any[],
    sleepTime: string = "22:00",
    alarmTime: string = "07:30"
  ) => {
    await executeWithTimeFlow(() =>
      prePlanTomorrow(targetDay, slots, sleepTime, alarmTime)
    );
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 max-w-7xl mx-auto w-full gap-4 sm:gap-5">
      {/* Onboarding Dialog */}
      <OnboardingModal isOpen={!sessionId} />

      {/* Week End Summary Dialog */}
      <SummaryModal isOpen={isGameOver} />

      {/* Activity Selection Modal (Lunch / Dorm Leisure / Campus Leisure) */}
      <ActivitySelectionModal
        isOpen={activityModalOpen}
        onClose={() => setActivityModalOpen(false)}
        category={activityCategory}
        activities={activities}
        maxAvailableHours={calcAvailableHours()}
        currentStartTime={currentStartTime}
        onConfirm={handleConfirmActivity}
        isLoading={isLoading}
      />

      {/* Pre-Plan Tomorrow & Sleep Alarm Modal */}
      <PrePlanModal
        isOpen={prePlanModalOpen}
        onClose={() => setPrePlanModalOpen(false)}
        targetDay={prePlanTargetDay}
        existingSchedule={weeklySchedule}
        currentSleepTime={currentStartTime}
        onConfirm={handleConfirmPrePlan}
        isLoading={isLoading}
      />

      {/* Top Simulator Control Bar */}
      <header className="surface flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1 rounded-full border border-stone-200 px-2.5 py-0.5 text-xs font-medium text-stone-600 transition hover:border-violet-300 hover:text-violet-700"
            >
              <ArrowLeft className="h-3 w-3" />
              首頁
            </Link>
            <span className="eyebrow">Week Simulator</span>
            <span className="rounded-full bg-violet-50 px-2.5 py-0.5 font-mono text-xs font-medium text-violet-700">
              Turn {Math.min(totalTurns, currentTurn + 1)} / {totalTurns}
            </span>
          </div>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">
            中央大學一週生活模擬器
          </h1>
          <p className="mt-0.5 truncate text-sm text-stone-500">
            {currentSlotInfo.title ? `當前行程：${currentSlotInfo.title}` : "正在排程中..."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenSleepModal}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 transition hover:border-violet-300 hover:text-violet-700"
            title="預先規劃明日行程"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            預排明日活動
          </button>
          <button
            onClick={resetSimulation}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 transition hover:border-rose-300 hover:text-rose-600"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            重新開局
          </button>
          <Link
            href="/map"
            className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            全螢幕 3D 地圖
          </Link>
        </div>
      </header>

      {/* Four Dimensions Stats Bar */}
      <StatsBar stats={stats} />

      {/* Dedicated Campus Time & Atmosphere Widget */}
      <CampusTimeWidget
        slot={currentSlotInfo}
        currentTurn={currentTurn}
        totalTurns={totalTurns}
        isFlowing={isTimeFlowing}
        flowFromTime={flowFrom}
        flowToTime={flowTo}
        onFlowComplete={handleFlowComplete}
        onSkip={handleSkipFlow}
        onFocusLocation={() => {
          if (currentLocationId) setFocusedLoc(currentLocationId);
        }}
      />

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
          <div className="surface h-48 sm:h-52 overflow-hidden relative">
            <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-xs text-xs text-stone-800 border border-stone-300 shadow-xs">
              <MapPin className="w-3 h-3 text-violet-600" />
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
            isLoading={isLoading || isTimeFlowing}
            onChoose={handleChooseOption}
            onFocusLocation={() => {
              if (currentLocationId) setFocusedLoc(currentLocationId);
            }}
          />
        </div>
      </div>
    </div>
  );
}
