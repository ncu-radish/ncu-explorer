"use client";

import { useState } from "react";
import {
  Utensils,
  Coffee,
  Moon,
  Compass,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Clock,
  MapPin,
  X,
  Zap,
} from "lucide-react";
import { useSimulatorStore } from "@/store/useSimulatorStore";

interface QuickActivityItem {
  id: string;
  category: "breakfast" | "lunch" | "dinner" | "dorm_leisure" | "campus_leisure";
  title: string;
  shortDesc: string;
  timeHint: string;
  triggerModeHint: string;
  icon: any;
  color: string;
  badgeBg: string;
  options: Array<{
    key: string;
    text: string;
    effects: string;
  }>;
}

const QUICK_ACTIVITIES: QuickActivityItem[] = [
  {
    id: "act_breakfast",
    category: "breakfast",
    title: "早餐活動",
    shortDesc: "後門早餐一條街，起司蛋餅與大杯溫豆漿",
    timeHint: "早晨 07:00~09:00",
    triggerModeHint: "早課前主動選擇是否吃早餐",
    icon: Coffee,
    color: "text-amber-500",
    badgeBg: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    options: [
      { key: "A", text: "衝後門早午餐吃現做起司蛋餅配溫豆漿", effects: "體力 +20，學業 +5，花費 $65" },
      { key: "B", text: "超商快速抓飯糰與美式黑咖啡邊走邊吃", effects: "體力 +10，花費 $45" },
      { key: "C", text: "多賴床十分鐘或直接趕教室，先不吃早餐", effects: "體力 -5，學業 +5 (不標記)" },
    ],
  },
  {
    id: "act_lunch",
    category: "lunch",
    title: "午餐活動",
    shortDesc: "松果餐廳自助餐或後門美食，補充午後元氣",
    timeHint: "中午 11:50~13:30",
    triggerModeHint: "午餐時間選擇是否要吃午餐",
    icon: Utensils,
    color: "text-emerald-500",
    badgeBg: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    options: [
      { key: "A", text: "快步進松果餐廳吃高CP值雙主菜自助餐", effects: "體力 +25，社交 +5，花費 $90" },
      { key: "B", text: "揪同學散步到後門吃炒泡麵配鮮奶茶", effects: "體力 +20，社交 +15，花費 $120" },
      { key: "C", text: "不吃午餐，留在教室安靜趴著補眠小憩", effects: "體力 +5，學業 +10 (不標記)" },
    ],
  },
  {
    id: "act_dinner",
    category: "dinner",
    title: "晚餐活動",
    shortDesc: "宵夜街探索，熱騰騰拉麵、炭烤與地瓜球",
    timeHint: "傍晚 17:30~19:30",
    triggerModeHint: "下課傍晚選擇是否進行晚餐活動",
    icon: Utensils,
    color: "text-orange-500",
    badgeBg: "bg-orange-500/10 text-orange-300 border-orange-500/30",
    options: [
      { key: "A", text: "與室友直奔宵夜街吃熱騰騰拉麵與地瓜球", effects: "體力 +25，社交 +15，花費 $150" },
      { key: "B", text: "外帶少油少鹽平價健康餐盒回宿舍享用", effects: "體力 +15，學業 +5，花費 $95" },
      { key: "C", text: "全神貫注準備專題，先不吃晚餐", effects: "體力 -10，學業 +15 (不標記)" },
    ],
  },
  {
    id: "act_dorm_leisure",
    category: "dorm_leisure",
    title: "宿舍休閒活動",
    shortDesc: "回宿舍吹冷氣補眠、與室友開黑打手遊放鬆",
    timeHint: "下課空閒時間 / 課餘空檔",
    triggerModeHint: "空閒時可選擇回到宿舍休息",
    icon: Moon,
    color: "text-indigo-400",
    badgeBg: "bg-indigo-500/10 text-indigo-300 border-indigo-500/30",
    options: [
      { key: "A", text: "回宿舍躺平痛快補眠一小時補足精神", effects: "體力 +30，學業 -5" },
      { key: "B", text: "戴上耳機與室友開黑連線打手遊英雄聯盟", effects: "體力 +10，社交 +15" },
      { key: "C", text: "整理房間洗衣服，悠閒泡茶追最新一集動漫", effects: "體力 +15，花費 $30" },
    ],
  },
  {
    id: "act_campus_leisure",
    category: "campus_leisure",
    title: "校園休閒活動",
    shortDesc: "健身房、K書中心自習、百花川與中大湖散步",
    timeHint: "下課空閒時間 / 課餘午後",
    triggerModeHint: "空檔時可選擇前往校園設施",
    icon: Compass,
    color: "text-cyan-400",
    badgeBg: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
    options: [
      { key: "A", text: "前往依仁堂健身房重量訓練或大草坪慢跑", effects: "體力 +15，社交 +5，花費 $20" },
      { key: "B", text: "前往中大總圖書館或K書中心享受靜謐自習", effects: "學業 +25，體力 -5" },
      { key: "C", text: "漫步百花川林蔭道與中大湖看天鵝放空", effects: "體力 +20，社交 +5" },
    ],
  },
];

export function DynamicActivityBar() {
  const { triggerDynamicActivity, isLoading } = useSimulatorStore();
  const [selectedAct, setSelectedAct] = useState<QuickActivityItem | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectOption = async (actId: string, optionKey: string) => {
    setIsSubmitting(true);
    try {
      const res = await triggerDynamicActivity(actId, optionKey);
      setSuccessMsg(res?.message || "已成功參與活動並標記於行事曆！");
      setTimeout(() => {
        setSuccessMsg(null);
        setSelectedAct(null);
      }, 1800);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex flex-col gap-3">
      {/* Bar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <span>動態校園活動快選</span>
              <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                免事前排程 · 選擇後即時標記在行事曆
              </span>
            </h3>
            <p className="text-[11px] text-stone-500">
              下課或用餐時間，點擊即可觸發相應的校園日常與休閒活動
            </p>
          </div>
        </div>
      </div>

      {/* Buttons Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {QUICK_ACTIVITIES.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              onClick={() => setSelectedAct(act)}
              className="flex flex-col items-start p-2.5 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-white hover:border-blue-400 hover:shadow-xs transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center justify-between w-full mb-1">
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-4 h-4 ${act.color}`} />
                  <span className="text-xs font-bold text-stone-900 group-hover:text-blue-600 transition-colors">
                    {act.title}
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <span className="text-[10px] text-stone-500 font-mono line-clamp-1">
                {act.timeHint}
              </span>
            </button>
          );
        })}
      </div>

      {/* Interactive Trigger Modal */}
      {selectedAct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl border border-stone-200 flex flex-col gap-4 relative animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                  <selectedAct.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                    {selectedAct.title}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${selectedAct.badgeBg}`}>
                      {selectedAct.timeHint}
                    </span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">{selectedAct.triggerModeHint}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedAct(null)}
                className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-700 leading-relaxed">
              <p>{selectedAct.shortDesc}</p>
              <p className="text-[11px] text-blue-600 font-medium mt-1">
                ✦ 選擇進行活動後，系統將自動於一週行事曆與時間軸上標記此行程！
              </p>
            </div>

            {/* Success Message Banner */}
            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Options List */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-stone-600">請選擇行動方案：</span>
              {selectedAct.options.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => handleSelectOption(selectedAct.id, opt.key)}
                  disabled={isSubmitting || isLoading}
                  className="p-3 rounded-xl border border-stone-200 bg-white hover:border-blue-500 hover:bg-blue-50/50 transition-all text-left flex items-start gap-3 cursor-pointer group disabled:opacity-50"
                >
                  <span className="w-6 h-6 rounded-lg bg-stone-100 text-stone-800 font-mono font-bold text-xs flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                    {opt.key}
                  </span>
                  <div className="flex-1">
                    <span className="text-xs font-semibold text-stone-900 block group-hover:text-blue-900 transition-colors">
                      {opt.text}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-600 block mt-0.5">
                      效果：{opt.effects}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
