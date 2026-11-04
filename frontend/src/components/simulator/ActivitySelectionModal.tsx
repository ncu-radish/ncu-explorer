"use client";

import { useState } from "react";
import { Utensils, Home, Compass, Clock, Check, X, Sparkles, MapPin, Coffee, Moon } from "lucide-react";
import { CampusActivity } from "@/lib/api";

interface ActivitySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: "lunch" | "dorm_leisure" | "campus_leisure" | "night_leisure" | string;
  activities: CampusActivity[];
  maxAvailableHours?: number;
  currentStartTime?: string;
  onConfirm: (
    activityId: string,
    optionKey: string,
    durationHours: number,
    customTitle?: string,
    durationMinutes?: number,
    customEndTime?: string
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
  activities,
  maxAvailableHours = 3,
  currentStartTime = "12:00",
  onConfirm,
  isLoading = false,
}: ActivitySelectionModalProps) {
  const [selectedActId, setSelectedActId] = useState<string>("");
  const [selectedOptionKey, setSelectedOptionKey] = useState<string>("A");
  const [nightTab, setNightTab] = useState<"dorm" | "campus">("dorm");
  const effectiveMaxHours = Math.max(1, Math.min(4, maxAvailableHours));
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const adjustMinutes = (delta: number) => {
    const maxMins = effectiveMaxHours * 60;
    setDurationMinutes((prev) => Math.max(15, Math.min(maxMins, prev + delta)));
  };

  const targetCategory = category === "night_leisure" 
    ? (nightTab === "dorm" ? "dorm_leisure" : "campus_leisure") 
    : category;

  const categoryActivities = activities.filter((act) => act.category === targetCategory);

  const dormItems = [
    {
      id: "act_dorm_leisure",
      title: "宿舍小憩與深度補眠",
      location_name: "學生宿舍房內",
      options: [
        { key: "A", name: "戴上眼罩深度補眠充電", effects: "+25體力/小時" },
        { key: "B", name: "躺床上聽音樂放空放鬆", effects: "+18體力/小時" },
      ],
    },
    {
      id: "act_dorm_leisure",
      title: "手遊開黑 / 線上追劇",
      location_name: "學生宿舍書桌",
      options: [
        { key: "A", name: "與室友開黑打傳說對決", effects: "+15體力, +10社交/小時" },
        { key: "B", name: "吃零食追最新熱門影集", effects: "+15體力, +5社交/小時" },
      ],
    },
    {
      id: "act_dorm_leisure",
      title: "洗衣服整理寢室環境",
      location_name: "宿舍洗衣間 / 寢室",
      options: [
        { key: "A", name: "排隊洗烘衣物、收拾書桌", effects: "+10學術, +5社交/小時" },
      ],
    },
  ];

  const campusItems = [
    {
      id: "act_campus_leisure",
      title: "宵夜街 / 後門炭烤美食探訪",
      location_name: "後門宵夜街",
      options: [
        { key: "A", name: "炭烤雞排配冰鎮奶茶", effects: "+22體力, +12社交/小時, -$120" },
        { key: "B", name: "滷味鹹酥雞宵夜小聚", effects: "+18體力, +15社交/小時, -$100" },
      ],
    },
    {
      id: "act_campus_leisure",
      title: "依仁堂體育館揮灑汗水",
      location_name: "依仁堂體育館 / 健身房",
      options: [
        { key: "A", name: "重訓器材核心自主鍛鍊", effects: "+12體力, +8社交/小時" },
        { key: "B", name: "室內慢跑或打羽球交流", effects: "+15體力, +10社交/小時" },
      ],
    },
    {
      id: "act_campus_leisure",
      title: "總圖書館 / K書中心沉浸充實",
      location_name: "總圖書館 / 舊圖K書中心",
      options: [
        { key: "A", name: "安靜閱覽區溫習課程講義", effects: "+22學術/小時" },
        { key: "B", name: "翻閱科技新知與課外讀物", effects: "+15學術, +5社交/小時" },
      ],
    },
    {
      id: "act_campus_leisure",
      title: "中大湖與百花川夜景散步",
      location_name: "中大湖畔 / 百花川步道",
      options: [
        { key: "A", name: "湖畔夜風散心放鬆", effects: "+16體力, +8社交/小時" },
        { key: "B", name: "大草坪看星空沉澱心靈", effects: "+18體力/小時" },
      ],
    },
  ];

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

  let fallbackList = lunchItems;
  if (category === "dorm_leisure") fallbackList = dormItems;
  if (category === "campus_leisure") fallbackList = campusItems;
  if (category === "night_leisure") fallbackList = nightTab === "dorm" ? dormItems : campusItems;

  const activeList = categoryActivities.length > 0 ? categoryActivities : fallbackList;

  const getHeaderInfo = () => {
    if (category === "lunch") {
      return {
        icon: <Utensils className="w-5 h-5 text-stone-700" />,
        badge: "午餐時段",
        title: "正午十二點，你打算如何打發午膳？",
        subtitle: "選擇今日的午餐地點與餐點偏好",
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
      subtitle: "依仁堂健身房、總圖自習或百花川散步，可自主選擇 1 ~ 3 小時",
      showDuration: true,
    };
  };

  const header = getHeaderInfo();

  const handleConfirmAction = async () => {
    if (isSubmitting || isLoading) return;
    setIsSubmitting(true);

    const chosenAct = activeList.find((a) => a.id === selectedActId) || activeList[0];
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
        customEndTime
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
                  setSelectedActId("");
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
                  setSelectedActId("");
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

          {/* Activity Category Selection List */}
          <div>
            <label className="text-xs font-bold text-stone-800 block mb-2.5">
              選擇活動地點與具體項目：
            </label>
            <div className="space-y-3">
              {activeList.map((item: any, idx: number) => {
                const isSelected = (selectedActId ? item.id === selectedActId : idx === 0);
                const itemOptions = item.preset_options || item.options || [];

                return (
                  <div
                    key={item.id + idx}
                    onClick={() => {
                      setSelectedActId(item.id);
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
                    {isSelected && itemOptions.length > 0 && (
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
                              {opt.effects && typeof opt.effects === "string" ? (
                                <span className="text-xs font-mono text-stone-600 font-medium">
                                  {opt.effects}
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
            disabled={isSubmitting || isLoading}
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
