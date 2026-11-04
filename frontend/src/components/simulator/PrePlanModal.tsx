"use client";

import { useState } from "react";
import { Clock, Coffee, Utensils, Compass, BookOpen, Bell, Moon, AlertTriangle } from "lucide-react";
import { ScheduleSlot } from "@/store/useSimulatorStore";

const DAYS = ["週一", "週二", "週三", "週四", "週五"];

interface PrePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDay: number;
  existingSchedule: ScheduleSlot[];
  currentSleepTime?: string;
  onConfirm: (targetDay: number, prePlannedSlots: any[], sleepTime: string, alarmTime: string) => Promise<void>;
  isLoading?: boolean;
}

function calcSleepDuration(sleepT: string, alarmT: string): number {
  try {
    const [sh, sm] = sleepT.split(":").map(Number);
    const [ah, am] = alarmT.split(":").map(Number);
    const sleepMins = sh * 60 + (sm || 0);
    const alarmMins = ah * 60 + (am || 0);
    const totalMins = alarmMins <= sleepMins ? (24 * 60 - sleepMins) + alarmMins : alarmMins - sleepMins;
    return Math.max(1, Math.round((totalMins / 60) * 10) / 10);
  } catch {
    return 8;
  }
}

export function PrePlanModal({
  isOpen,
  onClose,
  targetDay,
  existingSchedule,
  currentSleepTime = "21:00",
  onConfirm,
  isLoading = false,
}: PrePlanModalProps) {
  const [alarmTime, setAlarmTime] = useState<string>("07:30");

  const adjustAlarmMinutes = (deltaMins: number) => {
    try {
      const [h, m] = alarmTime.split(":").map(Number);
      let totalMins = h * 60 + (m || 0) + deltaMins;
      if (totalMins < 0) totalMins += 24 * 60;
      totalMins = totalMins % (24 * 60);
      const newH = Math.floor(totalMins / 60);
      const newM = totalMins % 60;
      setAlarmTime(`${newH.toString().padStart(2, "0")}:${newM.toString().padStart(2, "0")}`);
    } catch {
      // ignore
    }
  };

  const [enableBreakfast, setEnableBreakfast] = useState<boolean>(true);
  const [breakfastChoice, setBreakfastChoice] = useState<string>("松果早餐店 (蛋餅豆漿)");

  const [enableLunch, setEnableLunch] = useState<boolean>(true);
  const [lunchChoice, setLunchChoice] = useState<string>("松果餐廳自助餐 (百花川旁)");

  const [enableLeisure, setEnableLeisure] = useState<boolean>(false);
  const [leisureCategory, setLeisureCategory] = useState<"dorm" | "campus">("dorm");
  const [leisureMinutes, setLeisureMinutes] = useState<number>(120);
  const [leisureChoice, setLeisureChoice] = useState<string>("宿舍補眠與小憩放空");

  const adjustLeisureMinutes = (delta: number) => {
    setLeisureMinutes((prev) => Math.max(30, Math.min(300, prev + delta)));
  };

  if (!isOpen) return null;

  const targetDayName = DAYS[Math.max(0, Math.min(4, targetDay - 1))];

  const tomorrowCourses = existingSchedule.filter(
    (s) => s.day === targetDay && s.type === "course"
  ).sort((a, b) => (a.start_time || "00:00").localeCompare(b.start_time || "00:00"));

  const earliestClass = tomorrowCourses[0];
  const hasOversleepRisk = earliestClass && (earliestClass.start_time || "08:00") <= alarmTime;

  const sleepHours = calcSleepDuration(currentSleepTime, alarmTime);
  let staminaPreview = 35;
  if (sleepHours >= 7 && sleepHours <= 9.5) {
    staminaPreview = Math.round(sleepHours * 5);
  } else if (sleepHours < 6) {
    staminaPreview = Math.max(10, Math.round(sleepHours * 3));
  } else {
    staminaPreview = 30;
  }

  const handleSaveAndProceed = async () => {
    const slots: any[] = [];

    if (enableBreakfast) {
      const [alarmH, alarmM] = alarmTime.split(":").map(Number);
      const bfStartMins = alarmH * 60 + alarmM + 30;
      const bfEndMins = bfStartMins + 30;
      const bfStart = `${String(Math.floor(bfStartMins / 60)).padStart(2, "0")}:${String(bfStartMins % 60).padStart(2, "0")}`;
      const bfEnd = `${String(Math.floor(bfEndMins / 60)).padStart(2, "0")}:${String(bfEndMins % 60).padStart(2, "0")}`;
      slots.push({
        title: `【早餐】${breakfastChoice}`,
        type: "breakfast",
        location_id: "loc_pine_restaurant",
        location_name: "松果餐廳早餐部",
        start_time: bfStart,
        end_time: bfEnd,
        duration_hours: 0.5,
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
      const totalEndMins = 15 * 60 + 30 + leisureMinutes;
      const endH = Math.floor(totalEndMins / 60);
      const endM = totalEndMins % 60;
      const endTime = `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`;
      const durHours = Math.round((leisureMinutes / 60.0) * 10) / 10;
      slots.push({
        title: `【${leisureCategory === "dorm" ? "宿舍休閒" : "校園休閒"}】${leisureChoice}`,
        type: leisureCategory === "dorm" ? "dorm" : "campus_leisure",
        location_id: leisureCategory === "dorm" ? "loc_dorm_boy9" : "loc_lib_main",
        location_name: leisureCategory === "dorm" ? "學生宿舍" : "依仁堂/總圖",
        start_time: startTime,
        end_time: endTime,
        duration_hours: durHours,
      });
    }

    onClose();

    try {
      await onConfirm(targetDay, slots, currentSleepTime, alarmTime);
    } catch {
      // Handled in parent
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-stone-100 bg-gradient-to-r from-stone-900 via-stone-900 to-violet-950 text-white flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <Moon className="w-5 h-5 text-violet-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-white/10 text-stone-200 border border-white/20 font-mono">
                  夜幕就寢 · 鬧鐘設定
                </span>
                <span className="text-xs text-stone-300 font-mono">
                  就寢時間：{currentSleepTime}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                準備就寢，設定明日【{targetDayName}】鬧鐘與作息
              </h3>
              <p className="text-sm text-stone-300 mt-0.5 leading-relaxed">
                定好隔天清晨起床鬧鐘，系統將依睡眠時長結算體力回復，並可預先規劃明日各項行程。
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Section: Alarm Clock System */}
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-xs">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900">
                    隔天起床鬧鐘設定 (Alarm Clock)
                  </h4>
                  <p className="text-xs text-stone-600 font-mono">
                    今晚 {currentSleepTime} 睡覺 ➔ 預計 {alarmTime} 鬧鐘響起
                  </p>
                </div>
              </div>

              {/* Sleep Duration Preview Pill */}
              <div className="text-right">
                <span className="text-xs font-bold text-violet-700 bg-white px-2.5 py-1 rounded-lg border border-violet-200 shadow-2xs font-mono">
                  睡眠 {sleepHours} 小時 · 體力 +{staminaPreview}
                </span>
              </div>
            </div>

            {/* Custom User-defined Alarm Time Picker */}
            <div className="bg-white rounded-xl p-3 border border-stone-200 shadow-2xs mb-2.5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Clock className="w-5 h-5 text-stone-500 shrink-0" />
                  <div className="flex-1">
                    <label className="text-sm font-semibold text-stone-800 block mb-0.5">
                      自訂鬧鐘時間 (直接輸入或調整)：
                    </label>
                    <input
                      type="time"
                      value={alarmTime}
                      onChange={(e) => setAlarmTime(e.target.value)}
                      className="text-lg sm:text-xl font-bold font-mono text-stone-900 bg-stone-50 border border-stone-300 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer shadow-2xs"
                    />
                  </div>
                </div>

                {/* Stepper Buttons */}
                <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => adjustAlarmMinutes(-30)}
                    className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-700 text-xs font-mono font-bold transition-all cursor-pointer"
                    title="提前 30 分鐘"
                  >
                    -30m
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustAlarmMinutes(-15)}
                    className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-700 text-xs font-mono font-bold transition-all cursor-pointer"
                    title="提前 15 分鐘"
                  >
                    -15m
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustAlarmMinutes(15)}
                    className="px-2.5 py-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-700 text-xs font-mono font-bold transition-all cursor-pointer"
                    title="延後 15 分鐘"
                  >
                    +15m
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustAlarmMinutes(30)}
                    className="px-2.5 py-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-700 text-xs font-mono font-bold transition-all cursor-pointer"
                    title="延後 30 分鐘"
                  >
                    +30m
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Alarm Reference Chips */}
            <div className="flex items-center gap-1.5 text-xs text-stone-600 overflow-x-auto pb-1 mb-1">
              <span className="font-semibold text-stone-700 shrink-0">快捷設定：</span>
              {["06:30", "07:00", "07:30", "08:00", "08:30"].map((timeStr) => (
                <button
                  key={timeStr}
                  type="button"
                  onClick={() => setAlarmTime(timeStr)}
                  className={`text-xs px-2.5 py-1 rounded-md border font-mono transition-colors cursor-pointer ${
                    alarmTime === timeStr
                      ? "bg-violet-600 text-white border-violet-600 font-bold"
                      : "bg-white text-stone-700 border-stone-200 hover:border-violet-300"
                  }`}
                >
                  {timeStr}
                </button>
              ))}
            </div>

            {/* Oversleep Warning if earliest class is earlier than alarm */}
            {hasOversleepRisk && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs mt-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  <strong>注意：</strong>明日 <strong>{earliestClass?.start_time}</strong> 有【{earliestClass?.title}】，鬧鐘設定於 {alarmTime} 可能會睡過頭遲到喔！
                </span>
              </div>
            )}
          </div>

          {/* Tomorrow's Existing Courses Glance */}
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200">
            <h4 className="text-xs font-bold text-stone-800 flex items-center gap-1.5 mb-2">
              <BookOpen className="w-3.5 h-3.5 text-stone-600" />
              <span>{targetDayName}已排定課程預覽 ({tomorrowCourses.length} 堂)：</span>
            </h4>
            {tomorrowCourses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {tomorrowCourses.map((c, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-white border border-stone-200 text-xs">
                    <div className="flex items-center justify-between text-stone-600 font-mono text-xs mb-1">
                      <span>{c.display_time || c.start_time}</span>
                      <span className="text-violet-700 font-semibold">{c.course_category || "必修"}</span>
                    </div>
                    <div className="font-bold text-stone-900 truncate">{c.title}</div>
                    <div className="text-xs text-stone-600 truncate mt-0.5">{c.location_name}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-600">明日全天無排定課程，你可以自由揮灑規劃整日時程！</p>
            )}
          </div>

          {/* Section 1: Breakfast Pre-plan */}
          <div className="p-4 rounded-2xl border border-stone-200 bg-white hover:border-stone-300 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Coffee className="w-4 h-4 text-stone-600" />
                <span className="text-sm font-bold text-stone-900">晨光早餐 (鬧鐘起床後)</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableBreakfast}
                  onChange={(e) => setEnableBreakfast(e.target.checked)}
                  className="rounded accent-violet-600 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs text-stone-700 font-medium">預排此行程</span>
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
                        ? "bg-violet-50 border-violet-400 text-violet-950 font-bold ring-1 ring-violet-400"
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
                <Utensils className="w-4 h-4 text-stone-600" />
                <span className="text-sm font-bold text-stone-900">中午午膳 (12:00 ~ 13:00)</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableLunch}
                  onChange={(e) => setEnableLunch(e.target.checked)}
                  className="rounded accent-violet-600 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs text-stone-700 font-medium">預排此行程</span>
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
                        ? "bg-violet-50 border-violet-400 text-violet-950 font-bold ring-1 ring-violet-400"
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
                <Compass className="w-4 h-4 text-stone-600" />
                <span className="text-sm font-bold text-stone-900">課餘休閒時光 (15:30 ~ 依時長)</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableLeisure}
                  onChange={(e) => setEnableLeisure(e.target.checked)}
                  className="rounded accent-violet-600 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs text-stone-700 font-medium">預排此行程</span>
              </label>
            </div>
            {enableLeisure && (
              <div className="space-y-3 mt-2">
                {/* Category & Hours */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">場地類型：</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setLeisureCategory("dorm");
                          setLeisureChoice("宿舍補眠與小憩放空");
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-bold cursor-pointer ${
                          leisureCategory === "dorm"
                            ? "bg-violet-50 border-violet-400 text-violet-900 ring-1 ring-violet-400"
                            : "bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100"
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
                        className={`p-2.5 rounded-xl border text-xs font-bold cursor-pointer ${
                          leisureCategory === "campus"
                            ? "bg-violet-50 border-violet-400 text-violet-900 ring-1 ring-violet-400"
                            : "bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100"
                        }`}
                      >
                        校園休閒
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      預計時長 (自訂調整)：
                    </label>
                    <div className="flex items-center gap-1.5 bg-stone-50 p-1.5 rounded-xl border border-stone-200">
                      <span className="text-xs font-bold font-mono text-stone-900 px-2.5 py-1 bg-white rounded-lg border border-stone-200 shadow-2xs">
                        {Math.floor(leisureMinutes / 60)}h {leisureMinutes % 60}m
                      </span>
                      <div className="flex items-center gap-1 ml-auto">
                        <button
                          type="button"
                          onClick={() => adjustLeisureMinutes(-30)}
                          className="px-2.5 py-1 rounded-lg bg-white border border-stone-300 text-stone-700 text-xs font-mono font-bold hover:bg-stone-100 cursor-pointer"
                          title="減少 30 分鐘"
                        >
                          -30m
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustLeisureMinutes(30)}
                          className="px-2.5 py-1 rounded-lg bg-violet-50 border border-violet-200 text-violet-700 text-xs font-mono font-bold hover:bg-violet-100 cursor-pointer"
                          title="增加 30 分鐘"
                        >
                          +30m
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Specific choice list */}
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">活動項目：</label>
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
                            ? "bg-violet-50 border-violet-400 text-violet-950 font-bold ring-1 ring-violet-400"
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
        <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 text-xs font-semibold transition-colors cursor-pointer"
          >
            繼續宿舍活動 (晚點再睡)
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={handleSaveAndProceed}
            className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white text-sm font-semibold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Moon className="w-4 h-4 text-violet-200" />
            <span>設定鬧鐘，就寢入眠並展開【{targetDayName}】</span>
          </button>
        </div>
      </div>
    </div>
  );
}
