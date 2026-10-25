"use client";

import { useState } from "react";
import { Calendar, Clock, Check, X, Sparkles, MapPin, Coffee, Utensils, Home, Compass, BookOpen } from "lucide-react";
import { ScheduleSlot } from "@/store/useSimulatorStore";

const DAYS = ["週一", "週二", "週三", "週四", "週五"];

interface PrePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDay: number; // 2 for Tuesday, etc.
  existingSchedule: ScheduleSlot[];
  onConfirm: (targetDay: number, prePlannedSlots: any[]) => Promise<void>;
  isLoading?: boolean;
}

export function PrePlanModal({
  isOpen,
  onClose,
  targetDay,
  existingSchedule,
  onConfirm,
  isLoading = false,
}: PrePlanModalProps) {
  const [enableBreakfast, setEnableBreakfast] = useState<boolean>(true);
  const [breakfastChoice, setBreakfastChoice] = useState<string>("松果早餐店 (蛋餅豆漿)");

  const [enableLunch, setEnableLunch] = useState<boolean>(true);
  const [lunchChoice, setLunchChoice] = useState<string>("松果餐廳自助餐 (百花川旁)");

  const [enableLeisure, setEnableLeisure] = useState<boolean>(false);
  const [leisureCategory, setLeisureCategory] = useState<"dorm" | "campus">("dorm");
  const [leisureHours, setLeisureHours] = useState<number>(2);
  const [leisureChoice, setLeisureChoice] = useState<string>("宿舍補眠與小憩放空");

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const targetDayName = DAYS[Math.max(0, Math.min(4, targetDay - 1))];

  // Get tomorrow's existing courses
  const tomorrowCourses = existingSchedule.filter(
    (s) => s.day === targetDay && s.type === "course"
  ).sort((a, b) => (a.start_time || "00:00").localeCompare(b.start_time || "00:00"));

  const handleSaveAndProceed = async () => {
    setIsSubmitting(true);
    try {
      const slots: any[] = [];

      if (enableBreakfast) {
        slots.push({
          title: `【早餐】${breakfastChoice}`,
          type: "breakfast",
          location_id: "loc_pine_restaurant",
          location_name: "松果餐廳早餐部",
          start_time: "07:30",
          end_time: "08:30",
          duration_hours: 1,
        });
      }

      if (enableLunch) {
        slots.push({
          title: `【午餐】${lunchChoice}`,
          type: "lunch",
          location_id: "loc_pine_restaurant",
          location_name: "松果餐廳",
          start_time: "12:00",
          end_time: "13:00",
          duration_hours: 1,
        });
      }

      if (enableLeisure) {
        const startTime = "15:30";
        const h = 15 + leisureHours;
        const endTime = `${h.toString().padStart(2, "0")}:30`;
        slots.push({
          title: `【${leisureCategory === "dorm" ? "宿舍休閒" : "校園休閒"}】${leisureChoice}`,
          type: leisureCategory === "dorm" ? "dorm" : "campus_leisure",
          location_id: leisureCategory === "dorm" ? "loc_dorm_boy9" : "loc_lib_main",
          location_name: leisureCategory === "dorm" ? "學生宿舍" : "依仁堂/總圖",
          start_time: startTime,
          end_time: endTime,
          duration_hours: leisureHours,
        });
      }

      await onConfirm(targetDay, slots);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-stone-100 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 shadow-inner flex items-center justify-center shrink-0 text-amber-300">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  明日作息預備
                </span>
                <span className="text-xs text-blue-200/80 font-mono">
                  {targetDayName}行程規劃
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                預先規劃【{targetDayName}】生活作息
              </h3>
              <p className="text-xs text-blue-200/90 mt-0.5 leading-relaxed">
                在展開明日新的一天前，你可以先預排早餐、午餐或課餘休閒活動，系統將自動寫入時間軸。
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Tomorrow's Existing Courses Glance */}
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200">
            <h4 className="text-xs font-bold text-stone-800 flex items-center gap-1.5 mb-2">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>{targetDayName}已排定課程預覽 ({tomorrowCourses.length} 堂)：</span>
            </h4>
            {tomorrowCourses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {tomorrowCourses.map((c, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-white border border-stone-200 text-xs">
                    <div className="flex items-center justify-between text-stone-500 font-mono text-[11px] mb-1">
                      <span>{c.display_time || c.start_time}</span>
                      <span className="text-blue-600 font-bold">{c.course_category || "必修"}</span>
                    </div>
                    <div className="font-bold text-stone-900 truncate">{c.title}</div>
                    <div className="text-[11px] text-stone-500 truncate mt-0.5">{c.location_name}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-500">明日全天無排定課程，你可以自由揮灑規劃整日時程！</p>
            )}
          </div>

          {/* Section 1: Breakfast Pre-plan */}
          <div className="p-4 rounded-2xl border border-stone-200 bg-white hover:border-stone-300 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Coffee className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-bold text-stone-900">晨光早餐 (07:30 ~ 08:30)</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableBreakfast}
                  onChange={(e) => setEnableBreakfast(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs text-stone-600 font-medium">預排此行程</span>
              </label>
            </div>
            {enableBreakfast && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                {[
                  "松果早餐店 (蛋餅豆漿)",
                  "小木屋鬆餅 (藍莓鬆餅+奶茶)",
                  "全家早餐組合 (三明治+燕麥奶)",
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setBreakfastChoice(item)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      breakfastChoice === item
                        ? "bg-amber-50 border-amber-400 text-amber-950 font-bold ring-1 ring-amber-400"
                        : "bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Lunch Pre-plan */}
          <div className="p-4 rounded-2xl border border-stone-200 bg-white hover:border-stone-300 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-bold text-stone-900">中午午膳 (12:00 ~ 13:00)</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableLunch}
                  onChange={(e) => setEnableLunch(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs text-stone-600 font-medium">預排此行程</span>
              </label>
            </div>
            {enableLunch && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                {[
                  "松果餐廳自助餐 (百花川旁)",
                  "後門美食街排骨飯",
                  "外帶便當至大草坪悠閒野餐",
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setLunchChoice(item)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      lunchChoice === item
                        ? "bg-amber-50 border-amber-400 text-amber-950 font-bold ring-1 ring-amber-400"
                        : "bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Afternoon / Evening Leisure Pre-plan */}
          <div className="p-4 rounded-2xl border border-stone-200 bg-white hover:border-stone-300 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-teal-600" />
                <span className="text-sm font-bold text-stone-900">課餘休閒時光 (15:30 ~ 依時長)</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableLeisure}
                  onChange={(e) => setEnableLeisure(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs text-stone-600 font-medium">預排此行程</span>
              </label>
            </div>
            {enableLeisure && (
              <div className="space-y-3 mt-2">
                {/* Category & Hours */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-stone-600 block mb-1">場地類型：</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setLeisureCategory("dorm");
                          setLeisureChoice("宿舍補眠與小憩放空");
                        }}
                        className={`p-2 rounded-xl border text-xs font-bold cursor-pointer ${
                          leisureCategory === "dorm"
                            ? "bg-indigo-50 border-indigo-400 text-indigo-900"
                            : "bg-stone-50 border-stone-200 text-stone-600"
                        }`}
                      >
                        宿舍休息
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLeisureCategory("campus");
                          setLeisureChoice("依仁堂體育館健身");
                        }}
                        className={`p-2 rounded-xl border text-xs font-bold cursor-pointer ${
                          leisureCategory === "campus"
                            ? "bg-teal-50 border-teal-400 text-teal-900"
                            : "bg-stone-50 border-stone-200 text-stone-600"
                        }`}
                      >
                        校園休閒
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-stone-600 block mb-1">預計時長：</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[1, 2, 3].map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setLeisureHours(h)}
                          className={`p-2 rounded-xl border text-xs font-bold cursor-pointer ${
                            leisureHours === h
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-stone-50 border-stone-200 text-stone-600"
                          }`}
                        >
                          {h} 小時
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Specific choice list */}
                <div>
                  <label className="text-[11px] font-bold text-stone-600 block mb-1">活動項目：</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(leisureCategory === "dorm"
                      ? ["宿舍補眠與小憩放空", "與室友連線打手遊", "洗衣整理收拾書桌", "追劇看動漫放鬆"]
                      : ["依仁堂體育館健身", "總圖書館自習閱覽", "百花川與中大湖散步", "舊圖K書中心充實"]
                    ).map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setLeisureChoice(item)}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                          leisureChoice === item
                            ? "bg-blue-50 border-blue-400 text-blue-900 font-bold ring-1 ring-blue-400"
                            : "bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-stone-100 bg-stone-50/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 text-xs font-semibold transition-colors cursor-pointer"
          >
            暫不預排 (明日依當下提示決定)
          </button>
          <button
            type="button"
            disabled={isSubmitting || isLoading}
            onClick={handleSaveAndProceed}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>正在排程並展開明日...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>確認預排並開始【{targetDayName}】</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
