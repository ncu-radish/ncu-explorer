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
import { simApi, exploreApi, PlayerActivity } from "@/lib/api";
import { useMapStore, routeWalkSeconds, WALK_METERS_PER_MIN } from "@/store/useMapStore";

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

// Fallback home when the session has no chosen dorm
const DEFAULT_HOME_LOCATION_ID = "bldg_dorm_b9a";

// 與後端起始生活費一致，生活費條以此為滿格
const INITIAL_MONEY = 1500;

const DAYS = ["週一", "週二", "週三", "週四", "週五"];

export default function SimulatorPage() {
  const {
    sessionId,
    playerProfile,
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
    error,
    eventOutcome,
    clearError,
    restoreSession,
    isRestoring,
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

  const [focusedLoc, setFocusedLoc] = useState<string | null>(null);

  // While the clock is running through the previous activity the map stays put;
  // the commute and the new focus only play once the time flow is done.
  const [isTimeFlowing, setIsTimeFlowing] = useState(false);

  // Activity Database State
  const [activities, setActivities] = useState<PlayerActivity[]>([]);

  // Modal States
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityCategory, setActivityCategory] = useState<"lunch" | "dinner" | "dorm_leisure" | "campus_leisure" | "night_leisure">("lunch");

  const [prePlanModalOpen, setPrePlanModalOpen] = useState(false);
  // 任何彈窗開啟時先隱藏地圖上的建築標籤，避免標籤浮在彈窗上遮住選項
  const anyDialogOpen = activityModalOpen || prePlanModalOpen || isGameOver || (!sessionId && !isRestoring);
  const [prePlanTargetDay, setPrePlanTargetDay] = useState<number>(2);

  // 重新整理後還原上一局（沒有存檔或存檔失效時維持開局畫面）
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // 建築 id → 中文名稱，供 3D 場景左上角標籤顯示目前聚焦的地點
  const [buildingNames, setBuildingNames] = useState<Record<string, string>>({});
  useEffect(() => {
    exploreApi
      .getBuildings()
      .then((list) => setBuildingNames(Object.fromEntries(list.map((b) => [b.id, b.name_zh]))))
      .catch(() => {});
  }, []);

  // Load backend activities
  useEffect(() => {
    simApi.getActivities().then((res) => {
      if (res && res.length > 0) {
        setActivities(res);
      }
    }).catch(() => {
      // Fallback handled in modal
    });
  }, []);

  // Show the walking route from the previous stop to the current one on the 3D map
  const homeLocationId = playerProfile?.home_dorm_id || DEFAULT_HOME_LOCATION_ID;
  const sameDayStop = (slot: ScheduleSlot | undefined, day?: number) =>
    slot && slot.day === day && !slot.is_skipped && slot.location_id ? slot.location_id : undefined;
  const prevSlot = currentTurn > 0 ? weeklySchedule[currentTurn - 1] : undefined;

  // 午餐／晚餐／空閒提示還沒選地點：不顯示路線，地圖停在玩家目前所在的位置
  const isPromptSlot = ["lunch_prompt", "dinner_prompt", "leisure_prompt"].includes(currentSlotInfo.type);
  const routeToId = isPromptSlot || currentSlotInfo.is_skipped ? undefined : currentSlotInfo.location_id;
  const routeFromId = sameDayStop(prevSlot, currentSlotInfo.day) ?? homeLocationId;

  useEffect(() => {
    if (isTimeFlowing) return;
    const locId = isPromptSlot ? routeFromId : currentLocationId || currentSlotInfo?.location_id;
    if (locId) {
      setFocusedLoc(locId);
    }
  }, [currentTurn, currentLocationId, currentSlotInfo?.location_id, isTimeFlowing, isPromptSlot, routeFromId]);

  useEffect(() => {
    if (isTimeFlowing) return;
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
            : { fromId: r.from_id, toId: r.to_id, distance: r.distance, path: r.path, once: true }
        );
      })
      .catch(() => {
        if (!cancelled) setRoute(null);
      });
    return () => {
      cancelled = true;
    };
  }, [routeFromId, routeToId, currentTurn, isTimeFlowing]);

  // The route lives in a global store; clear it when leaving the simulator
  useEffect(() => {
    return () => useMapStore.getState().setRoute(null);
  }, []);

  // Time Transition Pipeline States
  const [flowFrom, setFlowFrom] = useState("08:00");
  const [flowTo, setFlowTo] = useState("12:00");
  const [flowWalk, setFlowWalk] = useState<{ minutes: number; seconds: number } | null>(null);
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
    setFlowWalk(null);
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
    // 請求失敗時不再播放假的時間流轉：立刻結束動畫，錯誤訊息由頁面上的提示顯示
    const stopFlow = () => handleFlowComplete();
    const actionPromise = action()
      .then(() => {
        if (useSimulatorStore.getState().error) stopFlow();
      })
      .catch(stopFlow);

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

    // 晚餐提示：與午餐相同，A 開啟晚餐選擇、B 略過
    if (slotType === "dinner_prompt") {
      if (optionKey === "A") {
        setActivityCategory("dinner");
        setActivityModalOpen(true);
        return;
      }
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
        // 週五夜晚沒有明天可預排：直接結束這一週
        if ((currentSlotInfo.day || currentDay || 1) >= 5) {
          await executeWithTimeFlow(() => chooseOption(optionKey));
          return;
        }
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
        s.type !== "dinner_prompt" &&
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

  // 標籤跟著地圖實際聚焦的地點走（點選建築、提示時段、選完餐廳都會改變聚焦）
  const focusedLocationName =
    (focusedLoc && buildingNames[focusedLoc]) ||
    weeklySchedule.find((s) => s.location_id === focusedLoc && s.location_name)?.location_name ||
    (focusedLoc && focusedLoc === playerProfile?.home_dorm_id ? playerProfile?.home_dorm_name : undefined) ||
    "中大校園";

  // Activity Modal Confirm Callback
  const handleConfirmActivity = async (
    activityId: string,
    optionKey: string,
    durationHours: number,
    customTitle?: string,
    durationMinutes?: number,
    customEndTime?: string,
    locationId?: string
  ) => {
    // 一確認地點就立刻顯示前往該地點的路線並聚焦（時間流轉期間路線會保持不變）
    const destinationId = locationId ?? (activityCategory === "dorm_leisure" ? homeLocationId : undefined);
    if (destinationId) {
      setFocusedLoc(destinationId);
      const { setRoute } = useMapStore.getState();
      if (destinationId !== routeFromId) {
        try {
          const r = await exploreApi.getRoute(routeFromId, destinationId);
          if (r.distance < 1) {
            setRoute(null);
          } else {
            setRoute({ fromId: r.from_id, toId: r.to_id, distance: r.distance, path: r.path, once: true });
            // 走路的這段時間，上方時鐘改成接近真實步行的速度，與地圖上的標記同步；抵達後才恢復快速
            setFlowWalk({
              minutes: Math.max(1, Math.ceil(r.distance / WALK_METERS_PER_MIN)),
              seconds: routeWalkSeconds(r.path),
            });
          }
        } catch {
          setRoute(null);
        }
      } else {
        setRoute(null);
      }
    }
    await executeWithTimeFlow(() =>
      triggerDynamicActivity(
        activityId,
        optionKey,
        durationHours,
        customTitle,
        durationMinutes,
        customEndTime,
        locationId
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
    <div className="flex-1 flex flex-col p-3 md:p-4 max-w-7xl mx-auto w-full gap-3 lg:h-dvh lg:flex-none lg:overflow-hidden">
      {/* Onboarding Dialog */}
      <OnboardingModal isOpen={!sessionId && !isRestoring} />

      {/* Week End Summary Dialog */}
      <SummaryModal isOpen={isGameOver} />

      {/* Activity Selection Modal (Lunch / Dorm Leisure / Campus Leisure) */}
      <ActivitySelectionModal
        isOpen={activityModalOpen}
        onClose={() => setActivityModalOpen(false)}
        category={activityCategory}
        sessionId={sessionId}
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

      {/* 操作失敗的提示 */}
      {error && sessionId && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          <span>{error}（請再試一次，或重新開局）</span>
          <button onClick={clearError} className="shrink-0 cursor-pointer font-semibold hover:text-rose-900">
            關閉
          </button>
        </div>
      )}

      {/* 課表備註（例如找不到的社團、學分超過上限） */}
      {Array.isArray(playerProfile?.schedule_notes) && playerProfile.schedule_notes.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
          {playerProfile.schedule_notes.map((note: string) => (
            <p key={note}>• {note}</p>
          ))}
        </div>
      )}

      {/* 剛處理完突發事件 */}
      {eventOutcome && (
        <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm text-violet-800">
          事件已處理：{eventOutcome}
        </div>
      )}

      {/* Top Simulator Control Bar */}
      {/* Merged top banner: controls + weekday/clock/current activity */}
      <CampusTimeWidget
        slot={currentSlotInfo}
        leading={
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1 rounded-full border border-stone-200 px-2.5 py-0.5 text-xs font-medium text-stone-600 transition hover:border-violet-300 hover:text-violet-700"
            >
              <ArrowLeft className="h-3 w-3" />
              首頁
            </Link>
            <h1 className="text-sm font-bold tracking-tight text-stone-900 sm:text-base">
              中央大學一週生活模擬器
            </h1>
          </div>
        }
        actions={
          <>
            <button
              onClick={handleOpenSleepModal}
              disabled={!canGoToSleep || activeDay >= 5}
              className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-700 transition hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-stone-200 disabled:hover:text-stone-700"
              title={
                activeDay >= 5
                  ? "週五是最後一天，沒有明天可以預排"
                  : canGoToSleep
                    ? "預先規劃明日行程"
                    : "21:00 之後才能就寢並預排明日行程"
              }
            >
              <CalendarDays className="h-3.5 w-3.5" />
              預排明日活動
            </button>
            <button
              onClick={resetSimulation}
              className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-700 transition hover:border-rose-300 hover:text-rose-600"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              重新開局
            </button>
            <Link
              href="/map"
              className="inline-flex items-center gap-1 rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              全螢幕 3D 地圖
            </Link>
          </>
        }
        isFlowing={isTimeFlowing}
        flowFromTime={flowFrom}
        flowToTime={flowTo}
        flowWalk={flowWalk}
        onFlowComplete={handleFlowComplete}
        onSkip={handleSkipFlow}
        onFocusLocation={() => {
          if (currentLocationId) setFocusedLoc(currentLocationId);
        }}
      />

      {/* Main Game Interface: everything fits in one viewport on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 lg:min-h-0">
        {/* Left Column: Story + choices (top) and schedule (bottom, scrolls internally) */}
        <div className="lg:col-span-4 flex flex-col gap-3 lg:min-h-0">
          <div className="lg:max-h-[58%] lg:overflow-y-auto lg:shrink-0 rounded-3xl">
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
          <div className="flex-1 flex flex-col min-h-[320px] lg:min-h-0">
            <WeeklySchedule
              schedule={weeklySchedule}
              currentTurn={currentTurn}
              onSelectSlot={(slot) => {
                if (slot.location_id) setFocusedLoc(slot.location_id);
              }}
            />
          </div>
        </div>

        {/* Right Column: 3D map (same size as before) + stats */}
        <div className="lg:col-span-8 flex flex-col gap-3 lg:min-h-0">
          <div className="surface h-[55vh] min-h-[360px] lg:h-auto lg:flex-1 lg:min-h-0 overflow-hidden relative">
            <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-xs text-xs text-stone-800 border border-stone-300 shadow-xs">
              <MapPin className="w-3 h-3 text-violet-600" />
              <span>3D 場景：{focusedLocationName}</span>
            </div>

            <CampusScene
              focusedLocationId={focusedLoc}
              onSelectBuilding={(id) => setFocusedLoc(id)}
              interactive={true}
              showLabels={!anyDialogOpen}
            />
          </div>

          <div className="shrink-0"><StatsBar stats={stats} moneyMax={INITIAL_MONEY} /></div>
        </div>
      </div>
    </div>
  );
}
