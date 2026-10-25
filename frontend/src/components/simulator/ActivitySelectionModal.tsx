"use client";

import { useState } from "react";
import { Utensils, Home, Compass, Clock, Check, X, Sparkles, MapPin, Coffee } from "lucide-react";
import { CampusActivity } from "@/lib/api";

interface ActivitySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: "lunch" | "dorm_leisure" | "campus_leisure" | string;
  activities: CampusActivity[];
  onConfirm: (activityId: string, optionKey: string, durationHours: number, customTitle?: string) => Promise<void>;
  isLoading?: boolean;
}

export function ActivitySelectionModal({
  isOpen,
  onClose,
  category,
  activities,
  onConfirm,
  isLoading = false,
}: ActivitySelectionModalProps) {
  const [selectedActId, setSelectedActId] = useState<string>("");
  const [selectedOptionKey, setSelectedOptionKey] = useState<string>("A");
  const [durationHours, setDurationHours] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Filter activities matching the category
  const categoryActivities = activities.filter((act) => act.category === category);

  // Fallback preset options if DB activities are empty
  const defaultItems = category === "lunch" ? [
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
        { key: "A", name: "經典雞排與炒飯", effects: "+25體力, -$120" },
        { key: "B", name: "外帶咖啡三明治回系館", effects: "+15體力, +8學術, -$95" },
      ],
    },
    {
      id: "act_lunch",
      title: "全家超商微波便當",
      location_name: "全家便利商店 (綜教/男九)",
      options: [
        { key: "A", name: "快速微波便當加茶飲", effects: "+15體力, -$80" },
        { key: "B", name: "飯糰拿鐵邊走邊吃", effects: "+10體力, -$60" },
      ],
    },
  ] : category === "dorm_leisure" ? [
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
  ] : [
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
      title: "中大湖與百花川悠閒散步",
      location_name: "中大湖畔 / 百花川步道",
      options: [
        { key: "A", name: "環湖吹風看黑天鵝優游", effects: "+15體力, +5社交/小時" },
        { key: "B", name: "在大草坪樹蔭下散心沉澱", effects: "+18體力/小時" },
      ],
    },
  ];

  // Pick first item by default if nothing selected
  const activeList = categoryActivities.length > 0 ? categoryActivities : defaultItems;
  const currentSelectedAct = activeList.find((a: any) => a.id === selectedActId) || activeList[0];

  const handleConfirmAction = async () => {
    if (!currentSelectedAct) return;
    setIsSubmitting(true);
    try {
      const actId = (currentSelectedAct as any).id || "act_lunch";
      const title = (currentSelectedAct as any).title;
      await onConfirm(actId, selectedOptionKey, durationHours, title);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const getHeaderInfo = () => {
    if (category === "lunch") {
      return {
        icon: <Utensils className="w-5 h-5 text-amber-500" />,
        badge: "午膳時段",
        badgeBg: "bg-amber-100 text-amber-800 border-amber-300",
        title: "請挑選你想進行的午餐行程",
        subtitle: "12:00 中午無排定課程，選好美食後系統將即時在行事曆標記你的用餐時段",
        showDuration: false,
      };
    }
    if (category === "dorm_leisure") {
      return {
        icon: <Home className="w-5 h-5 text-indigo-500" />,
        badge: "宿舍休閒",
        badgeBg: "bg-indigo-100 text-indigo-800 border-indigo-300",
        title: "回到宿舍，你打算安排哪些放鬆活動？",
        subtitle: "請選擇你想在宿舍進行的活動與預計時長 (1 ~ 3 小時不等)",
        showDuration: true,
      };
    }
    return {
      icon: <Compass className="w-5 h-5 text-teal-600" />,
      badge: "校園休閒",
      badgeBg: "bg-teal-100 text-teal-800 border-teal-300",
      title: "漫步校園，你打算前往哪項休閒設施？",
      subtitle: "依仁堂健身房、總圖自習或百花川散步，可自主選擇 1 ~ 3 小時",
      showDuration: true,
    };
  };

  const header = getHeaderInfo();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-stone-100 bg-stone-50/80 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-stone-200 shadow-xs flex items-center justify-center shrink-0">
              {header.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${header.badgeBg}`}>
                  {header.badge}
                </span>
                <span className="text-xs text-stone-400 font-mono">即時排入行事曆</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                {header.title}
              </h3>
              <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
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
          {/* Duration Selector (Only for leisure activities) */}
          {header.showDuration && (
            <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
              <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5 mb-2">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>預計活動時長 (小時)：</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((hours) => (
                  <button
                    key={hours}
                    type="button"
                    onClick={() => setDurationHours(hours)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      durationHours === hours
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs scale-[1.02]"
                        : "bg-white text-stone-700 border-stone-200 hover:border-stone-300 hover:bg-stone-100"
                    }`}
                  >
                    <span>{hours} 小時</span>
                    {durationHours === hours && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-stone-400 mt-1.5 font-mono">
                時長越長，相應的精力回復或學術/社交成長效果將以倍率結算。
              </p>
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
                        ? "bg-blue-50/50 border-blue-400 ring-2 ring-blue-500/30 shadow-xs"
                        : "bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                          isSelected ? "bg-blue-600 text-white" : "bg-stone-100 text-stone-600"
                        }`}>
                          {idx + 1}
                        </span>
                        <h4 className="text-sm font-bold text-stone-900">{item.title}</h4>
                      </div>
                      <span className="flex items-center gap-1 text-[11px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                        <MapPin className="w-3 h-3 text-blue-600" />
                        <span>{item.location_name || "校內設施"}</span>
                      </span>
                    </div>

                    {/* Sub-options for this activity */}
                    {isSelected && itemOptions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-blue-100/80 space-y-1.5">
                        <span className="text-[11px] text-stone-500 font-medium block mb-1">
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
                                  ? "bg-white border-blue-500 text-blue-900 font-bold shadow-xs"
                                  : "bg-white/80 border-stone-200 text-stone-700 hover:bg-white"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`w-5 h-5 rounded-md text-[10px] font-mono font-bold flex items-center justify-center ${
                                  isOptSelected ? "bg-blue-600 text-white" : "bg-stone-100 text-stone-600"
                                }`}>
                                  {optKey}
                                </span>
                                <span>{optText}</span>
                              </div>
                              {opt.effects && typeof opt.effects === "string" ? (
                                <span className="text-[11px] font-mono text-emerald-600 font-medium">
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
            className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 text-xs font-semibold transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            disabled={isSubmitting || isLoading}
            onClick={handleConfirmAction}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
