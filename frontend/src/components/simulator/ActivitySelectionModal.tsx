"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Utensils, Home, Compass, Clock, Check, X, Sparkles, MapPin, Coffee, Moon } from "lucide-react";
import { Building, PlayerActivity, MealOption, exploreApi, simApi } from "@/lib/api";

const SPORT_ACTIVITY_ID = "act_campus_sport";

// 3D map used to pick a sport venue
const CampusScene = dynamic(
  () => import("@/components/three/CampusScene").then((mod) => mod.CampusScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-stone-900 text-stone-300 text-xs">
        載入 3D 校園...
      </div>
    ),
  }
);

interface ActivitySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: "lunch" | "dinner" | "dorm_leisure" | "campus_leisure" | "night_leisure" | string;
  sessionId?: string | null;
  activities: PlayerActivity[];
  maxAvailableHours?: number;
  currentStartTime?: string;
  onConfirm: (
    activityId: string,
    optionKey: string,
    durationHours: number,
    customTitle?: string,
    durationMinutes?: number,
    customEndTime?: string,
    locationId?: string
  ) => Promise<void>;
  isLoading?: boolean;
}

function calcEndTime(startTime: string, minutes: number): string {
  try {
    const [h, m] = startTime.split(":").map(Number);
    const totalMins = h * 60 + (m || 0) + minutes;
    const endH = Math.floor((totalMins % (24 * 60)) / 60);
    const endM = totalMins % 60;
    return `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`;
  } catch {
    return startTime;
  }
}

export function ActivitySelectionModal({
  isOpen,
  onClose,
  category,
  sessionId,
  activities,
  maxAvailableHours = 3,
  currentStartTime = "12:00",
  onConfirm,
  isLoading = false,
}: ActivitySelectionModalProps) {
  // 以清單位置（而不是 id）辨識選中的卡片：備援清單裡多張卡片共用同一個 activity id
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [selectedOptionKey, setSelectedOptionKey] = useState<string>("A");
  const [nightTab, setNightTab] = useState<"dorm" | "campus">("dorm");
  const effectiveMaxHours = Math.max(1, Math.min(4, maxAvailableHours));
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Meal (lunch / dinner): pick one of three places
  const isMealMode = category === "lunch" || category === "dinner";
  const [mealOptions, setMealOptions] = useState<MealOption[]>([]);
  const [mealLoading, setMealLoading] = useState(false);
  const [selectedMealId, setSelectedMealId] = useState<string>("");

  // Sport: pick a venue on the 3D map
  const [sportBuildings, setSportBuildings] = useState<Building[]>([]);
  const [selectedSportId, setSelectedSportId] = useState<string>("");

  useEffect(() => {
    if (!isOpen || !isMealMode || !sessionId) return;
    let cancelled = false;
    setMealLoading(true);
    setSelectedMealId("");
    simApi
      .getMealOptions(sessionId, category as "lunch" | "dinner")
      .then((opts) => {
        if (!cancelled) setMealOptions(opts);
      })
      .catch(() => {
        if (!cancelled) setMealOptions([]);
      })
      .finally(() => {
        if (!cancelled) setMealLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, isMealMode, sessionId, category]);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedSportId("");
    setSelectedIdx(0);
    setSelectedOptionKey("A");
    exploreApi.getBuildings({ category: "sport" }).then(setSportBuildings).catch(() => setSportBuildings([]));
  }, [isOpen]);

  if (!isOpen) return null;

  // 把每小時的數值效果轉成「+25體力, -$65 /小時」這類文字
  const formatEffects = (effects: Record<string, number> | string | undefined): string => {
    if (!effects) return "";
    if (typeof effects === "string") return effects;
    const labels: [string, string][] = [["stamina", "體力"], ["study", "學業"], ["social", "社交"]];
    const parts: string[] = [];
    for (const [k, label] of labels) {
      const v = effects[k];
      if (v) parts.push(`${v > 0 ? "+" : ""}${v}${label}`);
    }
    if (effects.money) parts.push(`${effects.money > 0 ? "+" : "-"}$${Math.abs(effects.money)}`);
    return parts.length ? `${parts.join(", ")} /小時` : "";
  };

  const adjustMinutes = (delta: number) => {
    const maxMins = effectiveMaxHours * 60;
    setDurationMinutes((prev) => Math.max(15, Math.min(maxMins, prev + delta)));
  };

  const targetCategory = category === "night_leisure" 
    ? (nightTab === "dorm" ? "dorm_leisure" : "campus_leisure") 
    : category;

  const categoryActivities = activities.filter((act) => act.category === targetCategory);

  const lunchItems = [
    {
      id: "act_lunch",
      title: "松果餐廳特選美食",
      location_name: "松果餐廳 (男九舍地下街)",
      options: [
        { key: "A", name: "熱騰騰排骨飯便當", effects: "+20體力, -$90" },
        { key: "B", name: "清爽輕食健康沙拉", effects: "+15體力, +5學術, -$85" },
        { key: "C", name: "鍋貼牛肉麵聚餐", effects: "+20體力, +10社交, -$110" },
      ],
    },
    {
      id: "act_lunch",
      title: "宵夜街 / 後門美味探訪",
      location_name: "後門宵夜街",
      options: [
        { key: "A", name: "排骨炒飯搭配大杯冬瓜青", effects: "+22體力, -$110" },
        { key: "B", name: "經典起司牛肉潛艇堡", effects: "+18體力, +5學術, -$100" },
        { key: "C", name: "人氣燒烤肉燥乾拌麵", effects: "+20體力, -$95" },
      ],
    },
    {
      id: "act_lunch",
      title: "校園便利超商輕食野餐",
      location_name: "全家/小七 / 大草坪",
      options: [
        { key: "A", name: "超商飯糰茶葉蛋高纖餐", effects: "+15體力, -$70" },
        { key: "B", name: "微波義大利麵加氣泡水", effects: "+18體力, -$85" },
      ],
    },
  ];

  // 休閒活動一律來自後端（每張卡片的效果就是實際套用的效果）；只有午餐沒有清單時才用備援
  const activeList: any[] =
    categoryActivities.length > 0 ? categoryActivities : category === "lunch" ? lunchItems : [];

  const getHeaderInfo = () => {
    if (category === "lunch") {
      return {
        icon: <Utensils className="w-5 h-5 text-stone-700" />,
        badge: "午餐時段",
        title: "正午十二點，你打算如何打發午膳？",
        subtitle: "從三個地點中選一處前往用餐",
        showDuration: false,
      };
    }
    if (category === "dinner") {
      return {
        icon: <Utensils className="w-5 h-5 text-stone-700" />,
        badge: "晚餐時段",
        title: "傍晚了，晚餐要去哪裡吃？",
        subtitle: "從三個地點中選一處前往用餐",
        showDuration: false,
      };
    }
    if (category === "night_leisure") {
      return {
        icon: <Moon className="w-5 h-5 text-violet-600" />,
        badge: "晚間作息",
        title: "夜深了，你打算安排哪些晚間時光？",
        subtitle: "可選擇在宿舍放鬆或進行校園夜間活動，並調整活動時長",
        showDuration: true,
      };
    }
    if (category === "dorm_leisure") {
      return {
        icon: <Home className="w-5 h-5 text-stone-700" />,
        badge: "宿舍休閒",
        title: "回到宿舍，你打算安排哪些放鬆活動？",
        subtitle: "請選擇你想在宿舍進行的活動與預計時長 (1 ~ 3 小時不等)",
        showDuration: true,
      };
    }
    return {
      icon: <Compass className="w-5 h-5 text-stone-700" />,
      badge: "校園休閒",
      title: "漫步校園，你打算前往哪項休閒設施？",
      subtitle: "運動（可在 3D 地圖挑場館）、總圖自習或中大湖散步，可自主選擇 1 ~ 3 小時",
      showDuration: true,
    };
  };

  const header = getHeaderInfo();

  const effectiveMealId = selectedMealId || mealOptions[0]?.id || "";
  const selectedItem = activeList[selectedIdx] || activeList[0];
  const isSportSelected =
    !isMealMode && targetCategory === "campus_leisure" && selectedItem?.id === SPORT_ACTIVITY_ID;
  const confirmBlocked = isMealMode ? !effectiveMealId : isSportSelected && !selectedSportId;
  const sportName = sportBuildings.find((b) => b.id === selectedSportId)?.name_zh;

  const handleConfirmAction = async () => {
    if (isSubmitting || isLoading) return;
    setIsSubmitting(true);

    const chosenAct: { id?: string; title?: string } | undefined = isMealMode
      ? {
          id:
            activities.find((a) => a.category === category)?.id ||
            (category === "dinner" ? "act_dinner" : "act_lunch"),
        }
      : activeList[selectedIdx] || activeList[0];
    const locationId = isMealMode
      ? effectiveMealId || undefined
      : isSportSelected
        ? selectedSportId || undefined
        : undefined;
    const durationHours = Math.round((durationMinutes / 60) * 10) / 10;
    const finalActId = chosenAct?.id || "act_lunch";
    const customTitle = chosenAct?.title;
    const customEndTime = currentStartTime ? calcEndTime(currentStartTime, durationMinutes) : undefined;

    try {
      onClose();
      await onConfirm(
        finalActId,
        selectedOptionKey,
        durationHours,
        customTitle,
        durationMinutes,
        customEndTime,
        locationId
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-stone-100 bg-stone-50/80 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-white border border-stone-200 shadow-xs flex items-center justify-center shrink-0">
              {header.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                  {header.badge}
                </span>
                <span className="text-xs text-stone-500 font-mono">即時排入行事曆</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                {header.title}
              </h3>
              <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                {header.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-200/60 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Night Leisure Dorm/Campus Tab Switcher */}
          {category === "night_leisure" && (
            <div className="flex rounded-xl bg-stone-100 p-1 border border-stone-200">
              <button
                type="button"
                onClick={() => {
                  setNightTab("dorm");
                  setSelectedIdx(0);
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  nightTab === "dorm"
                    ? "bg-white text-violet-700 shadow-xs border border-violet-200"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>🏠 宿舍休閒活動</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setNightTab("campus");
                  setSelectedIdx(0);
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  nightTab === "campus"
                    ? "bg-white text-violet-700 shadow-xs border border-violet-200"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>🌲 校園夜間活動</span>
              </button>
            </div>
          )}

          {/* Custom Duration Selector */}
          {header.showDuration && (
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-stone-600" />
                  <span>自訂活動時長 (可自行調整分鐘)：</span>
                </label>
                <span className="text-xs font-mono font-semibold text-violet-700 bg-violet-50 px-2.5 py-0.5 rounded-md border border-violet-200">
                  上限可用：{effectiveMaxHours} 小時
                </span>
              </div>

              {/* Time Display & Stepper Controls */}
              <div className="bg-white rounded-xl p-3 border border-stone-200 shadow-2xs mb-2.5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl sm:text-2xl font-black font-mono text-stone-900 tracking-tight">
                        {Math.floor(durationMinutes / 60)} <span className="text-xs font-normal text-stone-500">小時</span> {durationMinutes % 60} <span className="text-xs font-normal text-stone-500">分鐘</span>
                      </span>
                      <span className="text-xs font-mono font-semibold text-stone-500">
                        ({(durationMinutes / 60).toFixed(1)}h)
                      </span>
                    </div>
                    {currentStartTime && (
                      <p className="text-xs text-stone-600 font-mono mt-0.5">
                        預計時間：{currentStartTime} ➔ {calcEndTime(currentStartTime, durationMinutes)}
                      </p>
                    )}
                  </div>

                  {/* Stepper Buttons */}
                  <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => adjustMinutes(-30)}
                      className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-700 text-xs font-mono font-bold transition-all cursor-pointer"
                      title="減少 30 分鐘"
                    >
                      -30m
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustMinutes(-15)}
                      className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-700 text-xs font-mono font-bold transition-all cursor-pointer"
                      title="減少 15 分鐘"
                    >
                      -15m
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustMinutes(15)}
                      className="px-2.5 py-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-700 text-xs font-mono font-bold transition-all cursor-pointer"
                      title="增加 15 分鐘"
                    >
                      +15m
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustMinutes(30)}
                      className="px-2.5 py-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-700 text-xs font-mono font-bold transition-all cursor-pointer"
                      title="增加 30 分鐘"
                    >
                      +30m
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Preset Reference Chips */}
              <div className="flex items-center gap-1.5 text-xs text-stone-600 overflow-x-auto pb-0.5">
                <span className="font-semibold text-stone-700 shrink-0">常見時長：</span>
                {[30, 45, 60, 90, 120, 180].filter((m) => m <= effectiveMaxHours * 60).map((m) => {
                  const hLabel = m >= 60 ? (m % 60 === 0 ? `${m / 60}h` : `${(m / 60).toFixed(1)}h`) : `${m}m`;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDurationMinutes(m)}
                      className={`text-xs px-2.5 py-1 rounded-md border font-mono transition-colors cursor-pointer ${
                        durationMinutes === m
                          ? "bg-violet-600 text-white border-violet-600 font-bold"
                          : "bg-white text-stone-700 border-stone-200 hover:border-violet-300 hover:bg-stone-50"
                      }`}
                    >
                      {hLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Meal: pick one of three places */}
          {isMealMode && (
            <div>
              <label className="text-xs font-bold text-stone-800 block mb-2.5">
                選擇用餐地點：
              </label>
              {mealLoading && <p className="text-xs text-stone-500">正在尋找附近的用餐地點...</p>}
              {!mealLoading && mealOptions.length === 0 && (
                <p className="text-xs text-stone-500">目前沒有可選的地點，仍可直接確認。</p>
              )}
              <div className="space-y-3">
                {mealOptions.map((opt, idx) => {
                  const isSel = opt.id === effectiveMealId;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedMealId(opt.id)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSel
                          ? "bg-violet-50/50 border-violet-400 ring-2 ring-violet-500/20 shadow-xs"
                          : "bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                            isSel ? "bg-violet-600 text-white" : "bg-stone-100 text-stone-700"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-stone-900">{opt.name_zh}</h4>
                          <p className="text-xs text-stone-500">
                            {opt.category === "street" ? "美食街" : "餐廳"}
                          </p>
                        </div>
                      </div>
                      {opt.distance != null && (
                        <span className="flex items-center gap-1 text-xs text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-md border border-stone-200 shrink-0">
                          <MapPin className="w-3.5 h-3.5 text-stone-500" />
                          <span>
                            約 {Math.round(opt.distance)} 公尺
                            {opt.walk_minutes ? `・步行 ${opt.walk_minutes} 分` : ""}
                          </span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Activity Category Selection List */}
          {!isMealMode && (
          <div>
            <label className="text-xs font-bold text-stone-800 block mb-2.5">
              選擇活動地點與具體項目：
            </label>
            <div className="space-y-3">
              {activeList.length === 0 && (
                <p className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs text-stone-600">
                  目前沒有可選的活動，請稍後再試。
                </p>
              )}
              {activeList.map((item: any, idx: number) => {
                const isSelected = (activeList[selectedIdx] ? idx === selectedIdx : idx === 0);
                const itemOptions = item.preset_options || item.options || [];

                return (
                  <div
                    key={item.id + idx}
                    onClick={() => {
                      setSelectedIdx(idx);
                      setSelectedOptionKey("A");
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-violet-50/50 border-violet-400 ring-2 ring-violet-500/20 shadow-xs"
                        : "bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                          isSelected ? "bg-violet-600 text-white" : "bg-stone-100 text-stone-700"
                        }`}>
                          {idx + 1}
                        </span>
                        <h4 className="text-sm font-bold text-stone-900">{item.title}</h4>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-md border border-stone-200">
                        <MapPin className="w-3.5 h-3.5 text-stone-500" />
                        <span>{item.location_name || "校內設施"}</span>
                      </span>
                    </div>

                    {/* Sub-options for this activity */}
                    {isSelected && itemOptions.length > 0 && item.id !== SPORT_ACTIVITY_ID && (
                      <div className="mt-3 pt-3 border-t border-violet-100 space-y-1.5">
                        <span className="text-xs text-stone-600 font-semibold block mb-1">
                          詳細方案選擇：
                        </span>
                        {itemOptions.map((opt: any) => {
                          const optKey = opt.option_key || opt.key || "A";
                          const optText = opt.intent_hint || opt.name || "方案選項";
                          const isOptSelected = selectedOptionKey === optKey;

                          return (
                            <button
                              key={optKey}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOptionKey(optKey);
                              }}
                              className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between cursor-pointer ${
                                isOptSelected
                                  ? "bg-white border-violet-500 text-violet-950 font-bold shadow-xs"
                                  : "bg-white/80 border-stone-200 text-stone-700 hover:bg-white"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`w-5 h-5 rounded-md text-xs font-mono font-bold flex items-center justify-center ${
                                  isOptSelected ? "bg-violet-600 text-white" : "bg-stone-100 text-stone-700"
                                }`}>
                                  {optKey}
                                </span>
                                <span>{optText}</span>
                              </div>
                              {formatEffects(opt.effects) ? (
                                <span className="text-xs font-mono text-stone-600 font-medium">
                                  {formatEffects(opt.effects)}
                                </span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          )}

          {/* Sport: pick a venue on the 3D map */}
          {isSportSelected && (
            <div>
              <label className="text-xs font-bold text-stone-800 block mb-2">
                在地圖上選擇運動場館（綠色為可選）：
              </label>
              <div className="h-64 rounded-2xl overflow-hidden border border-stone-300 bg-stone-900">
                <CampusScene
                  highlightCategory="sport"
                  selectableCategory="sport"
                  fitSelection={false}
                  topDown
                  showRoute={false}
                  showLabels={false}
                  onSelectBuilding={(id) => setSelectedSportId(id)}
                />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {sportBuildings.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedSportId(b.id)}
                    className={`text-xs px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                      selectedSportId === b.id
                        ? "bg-violet-600 text-white border-violet-600 font-bold"
                        : "bg-white text-stone-700 border-stone-200 hover:border-violet-300 hover:bg-stone-50"
                    }`}
                  >
                    {b.name_zh}
                  </button>
                ))}
              </div>
              <p className="text-xs mt-2 text-stone-600">
                {sportName ? `已選擇：${sportName}` : "請先選擇一處運動場館才能確認。"}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-stone-100 bg-stone-50/80 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 bg-white hover:bg-stone-100 text-xs font-semibold transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            disabled={isSubmitting || isLoading || confirmBlocked}
            onClick={handleConfirmAction}
            className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>正在標記行程...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>確認進行並寫入行事曆</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
