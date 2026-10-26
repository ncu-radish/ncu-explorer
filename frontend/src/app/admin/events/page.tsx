"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Zap,
  Plus,
  Trash2,
  RotateCcw,
  Utensils,
  Coffee,
  Moon,
  Compass,
  Clock,
  MapPin,
  Search,
  Filter,
  Check,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { adminApi, CampusActivity, CampusActivityOption } from "@/lib/api";
import { AdminAuthGuard } from "@/components/admin/AdminAuthGuard";

const CATEGORY_MAP: Record<string, { label: string; icon: any; color: string; badge: string }> = {
  breakfast: { label: "早餐", icon: Coffee, color: "text-amber-700", badge: "bg-amber-100 text-amber-900 border-amber-300" },
  lunch: { label: "午餐", icon: Utensils, color: "text-emerald-700", badge: "bg-emerald-100 text-emerald-900 border-emerald-300" },
  dinner: { label: "晚餐", icon: Utensils, color: "text-orange-700", badge: "bg-orange-100 text-orange-900 border-orange-300" },
  dorm_leisure: { label: "宿舍休閒活動", icon: Moon, color: "text-indigo-700", badge: "bg-indigo-100 text-indigo-900 border-indigo-300" },
  campus_leisure: { label: "校園休閒活動", icon: Compass, color: "text-cyan-700", badge: "bg-cyan-100 text-cyan-900 border-cyan-300" },
};

const TRIGGER_MODE_LABELS: Record<string, string> = {
  manual_choice: "主動選擇是否觸發（如午餐時間詢問吃不吃、下課空檔選擇回宿舍或校園活動）",
  auto_prompt: "時間到達自動提示推薦",
  conditional: "特定條件/機率觸發",
};

const PRESET_TIMINGS = [
  "07:00~09:00",
  "11:50~13:30",
  "17:30~19:30",
  "下課空閒時間",
  "課餘自由時段",
];

const PRESET_LOCATIONS = [
  { id: "loc_backgate", name: "後門美食一條街" },
  { id: "loc_pine_restaurant", name: "松果餐廳" },
  { id: "loc_night_street", name: "中大宵夜街" },
  { id: "loc_dorm_boy9", name: "男九舍 / 學生宿舍" },
  { id: "loc_dorm_girl14", name: "女十四舍 / 學生宿舍" },
  { id: "loc_yiren", name: "依仁堂體育館與健身房" },
  { id: "loc_park_creek", name: "百花川林蔭道與大草坪" },
  { id: "loc_library", name: "中大總圖書館與K書中心" },
];

function EventsContent() {
  const [activeTab, setActiveTab] = useState<"activities" | "random_events">("activities");

  // ==================== Activities State ====================
  const [activities, setActivities] = useState<CampusActivity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<CampusActivity | null>(null);
  const [isCreatingNewActivity, setIsCreatingNewActivity] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [activitySearchQuery, setActivitySearchQuery] = useState("");

  // Activity Form State
  const [actId, setActId] = useState("");
  const [actTitle, setActTitle] = useState("");
  const [actCategory, setActCategory] = useState<string>("lunch");
  const [actTriggerType, setActTriggerType] = useState<string>("time_slot");
  const [actTriggerTiming, setActTriggerTiming] = useState<string>("11:50~13:30");
  const [actTriggerMode, setActTriggerMode] = useState<string>("manual_choice");
  const [actLocationId, setActLocationId] = useState<string>("loc_pine_restaurant");
  const [actLocationName, setActLocationName] = useState<string>("松果餐廳");
  const [actIsActive, setActIsActive] = useState<boolean>(true);
  const [actWeight, setActWeight] = useState<number>(15);
  const [actEventPrompt, setActEventPrompt] = useState("");
  const [actOptions, setActOptions] = useState<CampusActivityOption[]>([
    { option_key: "A", intent_hint: "", effects: { stamina: 20, study: 0, social: 5, money: -80 }, marks_activity: true },
    { option_key: "B", intent_hint: "", effects: { stamina: 10, study: 5, social: 10, money: -50 }, marks_activity: true },
    { option_key: "C", intent_hint: "", effects: { stamina: -5, study: 10, social: 0, money: 0 }, marks_activity: false },
  ]);

  // Activity Sandbox
  const [actSandboxStory, setActSandboxStory] = useState<any | null>(null);
  const [isActSandboxTesting, setIsActSandboxTesting] = useState(false);
  const [actSaveMessage, setActSaveMessage] = useState<string | null>(null);

  // ==================== Random Events State ====================
  const [randomEvents, setRandomEvents] = useState<any[]>([]);
  const [selectedRandomEvent, setSelectedRandomEvent] = useState<any | null>(null);
  const [isCreatingNewRandomEvent, setIsCreatingNewRandomEvent] = useState(false);
  const [reId, setReId] = useState("");
  const [reTitle, setReTitle] = useState("");
  const [reWeight, setReWeight] = useState(15);
  const [reTriggerRate, setReTriggerRate] = useState(0.5);
  const [reCondTimeStart, setReCondTimeStart] = useState("");
  const [reCondTimeEnd, setReCondTimeEnd] = useState("");
  const [reCondActivityType, setReCondActivityType] = useState("");
  const [reCondActivityTitle, setReCondActivityTitle] = useState("");
  const [reCondPrevActivity, setReCondPrevActivity] = useState("");
  const [reCondPrevEventId, setReCondPrevEventId] = useState("");
  const [reCondLocation, setReCondLocation] = useState("");
  const [reCondMinStamina, setReCondMinStamina] = useState(0);
  const [reCondMaxStamina, setReCondMaxStamina] = useState(100);
  const [reIsActive, setReIsActive] = useState(true);
  const [rePrompt, setRePrompt] = useState("");
  const [reOptA, setReOptA] = useState("");
  const [reOptB, setReOptB] = useState("");
  const [reOptC, setReOptC] = useState("");
  const [reSandboxStory, setReSandboxStory] = useState<any | null>(null);
  const [isReSandboxTesting, setIsReSandboxTesting] = useState(false);
  const [reSaveMessage, setReSaveMessage] = useState<string | null>(null);

  const selectActivityForEdit = (act: CampusActivity) => {
    setIsCreatingNewActivity(false);
    setSelectedActivity(act);
    setActId(act.id);
    setActTitle(act.title);
    setActCategory(act.category);
    setActTriggerType(act.trigger_type || "time_slot");
    setActTriggerTiming(act.trigger_timing || "11:50~13:30");
    setActTriggerMode(act.trigger_mode || "manual_choice");
    setActLocationId(act.location_id || "loc_pine_restaurant");
    setActLocationName(act.location_name || "松果餐廳");
    setActIsActive(act.is_active);
    setActWeight(act.weight);
    setActEventPrompt(act.event_prompt);

    const opts = act.preset_options && act.preset_options.length >= 3
      ? act.preset_options
      : [
          { option_key: "A", intent_hint: "", effects: { stamina: 20, study: 0, social: 5, money: -80 }, marks_activity: true },
          { option_key: "B", intent_hint: "", effects: { stamina: 10, study: 5, social: 10, money: -50 }, marks_activity: true },
          { option_key: "C", intent_hint: "", effects: { stamina: -5, study: 10, social: 0, money: 0 }, marks_activity: false },
        ];
    setActOptions(opts);
    setActSandboxStory(null);
  };

  const selectRandomEventForEdit = (ev: any) => {
    setIsCreatingNewRandomEvent(false);
    setSelectedRandomEvent(ev);
    setReId(ev.id);
    setReTitle(ev.title);
    setReWeight(ev.weight ?? 15);
    setReTriggerRate(ev.trigger_rate ?? 0.5);
    setReCondTimeStart(ev.cond_time_start || "");
    setReCondTimeEnd(ev.cond_time_end || "");
    setReCondActivityType(ev.cond_activity_type || "");
    setReCondActivityTitle(ev.cond_activity_title || "");
    setReCondPrevActivity(ev.cond_prev_activity || "");
    setReCondPrevEventId(ev.cond_prev_event_id || "");
    setReCondLocation(ev.cond_location || "");
    setReCondMinStamina(ev.cond_min_stamina ?? 0);
    setReCondMaxStamina(ev.cond_max_stamina ?? 100);
    setReIsActive(ev.is_active ?? true);
    setRePrompt(ev.event_prompt || "");
    setReOptA(ev.preset_options?.[0]?.intent_hint || "");
    setReOptB(ev.preset_options?.[1]?.intent_hint || "");
    setReOptC(ev.preset_options?.[2]?.intent_hint || "");
    setReSandboxStory(null);
  };

  const handleStartCreateRandomEvent = () => {
    setIsCreatingNewRandomEvent(true);
    setSelectedRandomEvent(null);
    const newId = `evt_${Date.now().toString(36)}`;
    setReId(newId);
    setReTitle("新突發事件");
    setReWeight(15);
    setReTriggerRate(0.6);
    setReCondTimeStart("");
    setReCondTimeEnd("");
    setReCondActivityType("");
    setReCondActivityTitle("");
    setReCondPrevActivity("");
    setReCondPrevEventId("");
    setReCondLocation("");
    setReCondMinStamina(0);
    setReCondMaxStamina(100);
    setReIsActive(true);
    setRePrompt("突發事件：你在校園中遇到了突發狀況...");
    setReOptA("冷靜應對，採取穩健對策");
    setReOptB("尋求身邊同學或室友協助");
    setReOptC("隨機應變，嘗試新選擇");
    setReSandboxStory(null);
  };

  // 載入活動清單
  const loadActivities = async () => {
    try {
      const data = await adminApi.getActivities();
      setActivities(data);
      if (data.length > 0 && !selectedActivity && !isCreatingNewActivity) {
        selectActivityForEdit(data[0]);
      }
    } catch (err) {
      console.error("載入校園活動失敗:", err);
    }
  };

  // 載入隨機突發事件
  const loadRandomEvents = async () => {
    try {
      const data = await adminApi.getEvents();
      setRandomEvents(data);
      if (data.length > 0 && !selectedRandomEvent) {
        selectRandomEventForEdit(data[0]);
      }
    } catch (err) {
      console.error("載入突發事件失敗:", err);
    }
  };

  useEffect(() => {
    loadActivities();
    loadRandomEvents();
  }, []);

  const handleCreateNewActivityClick = () => {
    setIsCreatingNewActivity(true);
    setSelectedActivity(null);
    const newId = `act_${Date.now().toString().slice(-6)}`;
    setActId(newId);
    setActTitle("新活動名稱");
    setActCategory("lunch");
    setActTriggerType("time_slot");
    setActTriggerTiming("11:50~13:30");
    setActTriggerMode("manual_choice");
    setActLocationId("loc_pine_restaurant");
    setActLocationName("松果餐廳");
    setActIsActive(true);
    setActWeight(15);
    setActEventPrompt("活動時間到了，校園人來人往。當前可選擇是否觸發此活動：");
    setActOptions([
      { option_key: "A", intent_hint: "方案 A 描述 (如進行活動)", effects: { stamina: 20, study: 0, social: 5, money: -80 }, marks_activity: true },
      { option_key: "B", intent_hint: "方案 B 描述 (如替代方案)", effects: { stamina: 10, study: 5, social: 10, money: -50 }, marks_activity: true },
      { option_key: "C", intent_hint: "方案 C 描述 (如不進行活動)", effects: { stamina: -5, study: 10, social: 0, money: 0 }, marks_activity: false },
    ]);
    setActSandboxStory(null);
  };

  const handleSaveActivity = async () => {
    if (!actTitle.trim()) {
      alert("請填寫活動名稱");
      return;
    }

    try {
      const payload: Partial<CampusActivity> = {
        id: actId,
        title: actTitle,
        category: actCategory,
        trigger_type: actTriggerType,
        trigger_timing: actTriggerTiming,
        trigger_mode: actTriggerMode,
        location_id: actLocationId,
        location_name: actLocationName,
        is_active: actIsActive,
        weight: actWeight,
        event_prompt: actEventPrompt,
        preset_options: actOptions,
      };

      if (isCreatingNewActivity) {
        const created = await adminApi.createActivity(payload);
        setActSaveMessage("成功新增校園活動！");
        await loadActivities();
        selectActivityForEdit(created);
      } else if (selectedActivity) {
        await adminApi.updateActivity(selectedActivity.id, payload);
        setActSaveMessage("活動已成功更新！");
        await loadActivities();
      }
      setTimeout(() => setActSaveMessage(null), 3000);
    } catch (err: any) {
      setActSaveMessage(`儲存失敗: ${err.message}`);
    }
  };

  const handleDeleteActivity = async (id: string) => {
    if (!confirm(`確定要刪除活動「${id}」嗎？此動作無法復原。`)) return;
    try {
      await adminApi.deleteActivity(id);
      setActSaveMessage("已成功刪除活動！");
      setTimeout(() => setActSaveMessage(null), 3000);
      await loadActivities();
      setSelectedActivity(null);
    } catch (err: any) {
      alert(`刪除失敗: ${err.message}`);
    }
  };

  const handleSeedDefaults = async () => {
    if (!confirm("確定要重設並恢復 5 大預設活動（早餐、午餐、晚餐、宿舍休閒、校園休閒）嗎？")) return;
    try {
      const data = await adminApi.seedDefaultActivities();
      setActivities(data);
      if (data.length > 0) selectActivityForEdit(data[0]);
      setActSaveMessage("已成功恢復 5 大預設活動！");
      setTimeout(() => setActSaveMessage(null), 3000);
    } catch (err: any) {
      alert(`恢復預設失敗: ${err.message}`);
    }
  };

  const handleTestActivitySandbox = async () => {
    setIsActSandboxTesting(true);
    try {
      const data = await adminApi.testActivitySandbox({
        event_prompt: actEventPrompt || "當前為活動時段，請選擇是否進行活動：",
        preset_options: actOptions,
        location_id: actLocationId || "loc_pine_restaurant",
        slot: actTriggerTiming,
      });
      setActSandboxStory(data.generated_story);
    } catch (err) {
      console.error(err);
    } finally {
      setIsActSandboxTesting(false);
    }
  };

  // ==================== Random Events Helpers ====================

  const handleSaveRandomEvent = async () => {
    if (!isCreatingNewRandomEvent && !selectedRandomEvent) return;
    try {
      const updatedOptions = [
        {
          option_key: "A",
          intent_hint: reOptA || "全力以赴應對",
          effects: selectedRandomEvent?.preset_options?.[0]?.effects || { stamina: -5, study: 5, social: 0, money: 0 },
        },
        {
          option_key: "B",
          intent_hint: reOptB || "尋求同學或室友協助",
          effects: selectedRandomEvent?.preset_options?.[1]?.effects || { stamina: 5, study: 0, social: 5, money: 0 },
        },
        {
          option_key: "C",
          intent_hint: reOptC || "隨機應變，冒險嘗試",
          effects: selectedRandomEvent?.preset_options?.[2]?.effects || { stamina: 0, study: 0, social: 10, money: -30 },
        },
      ];

      const payload = {
        title: reTitle,
        weight: reWeight,
        trigger_rate: reTriggerRate,
        cond_time_start: reCondTimeStart.trim() || null,
        cond_time_end: reCondTimeEnd.trim() || null,
        cond_activity_type: reCondActivityType || null,
        cond_activity_title: reCondActivityTitle.trim() || null,
        cond_prev_activity: reCondPrevActivity.trim() || null,
        cond_prev_event_id: reCondPrevEventId || null,
        cond_location: reCondLocation || null,
        cond_min_stamina: reCondMinStamina,
        cond_max_stamina: reCondMaxStamina,
        is_active: reIsActive,
        event_prompt: rePrompt,
        preset_options: updatedOptions,
      };

      if (isCreatingNewRandomEvent) {
        const created = await adminApi.createEvent({
          id: reId.trim() || `evt_${Date.now().toString(36)}`,
          ...payload,
        });
        setReSaveMessage("🎉 新增突發事件成功！");
        setIsCreatingNewRandomEvent(false);
        setSelectedRandomEvent(created);
      } else if (selectedRandomEvent) {
        await adminApi.updateEvent(selectedRandomEvent.id, payload);
        setReSaveMessage("突發事件已成功更新！");
      }
      setTimeout(() => setReSaveMessage(null), 3000);
      await loadRandomEvents();
    } catch (err: any) {
      setReSaveMessage(`儲存失敗: ${err.message}`);
    }
  };

  const handleDeleteRandomEvent = async () => {
    if (!selectedRandomEvent) return;
    if (!confirm(`確定要刪除突發事件「${selectedRandomEvent.title}」嗎？`)) return;
    try {
      await adminApi.deleteEvent(selectedRandomEvent.id);
      setReSaveMessage("已成功刪除該突發事件！");
      setTimeout(() => setReSaveMessage(null), 3000);
      setSelectedRandomEvent(null);
      await loadRandomEvents();
    } catch (err: any) {
      setReSaveMessage(`刪除失敗: ${err.message}`);
    }
  };

  const handleTestRandomSandbox = async () => {
    setIsReSandboxTesting(true);
    try {
      const presetOptions = [
        { option_key: "A", intent_hint: reOptA || "全力以赴應對", effects: {} },
        { option_key: "B", intent_hint: reOptB || "尋求室友幫助", effects: {} },
        { option_key: "C", intent_hint: reOptC || "先回宿舍補眠", effects: {} },
      ];
      const data = await adminApi.testSandbox({
        event_prompt: rePrompt || "突發狀況發生",
        preset_options: presetOptions,
        location_id: reCondLocation || selectedRandomEvent?.cond_location || "loc_park_creek",
      });
      setReSandboxStory(data.generated_story);
    } catch (err) {
      console.error(err);
    } finally {
      setIsReSandboxTesting(false);
    }
  };

  // Filter activities
  const filteredActivities = activities.filter((act) => {
    if (categoryFilter !== "all" && act.category !== categoryFilter) return false;
    if (activitySearchQuery.trim()) {
      const q = activitySearchQuery.toLowerCase();
      return (
        act.title.toLowerCase().includes(q) ||
        (act.location_name && act.location_name.toLowerCase().includes(q)) ||
        act.event_prompt.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 flex flex-col gap-6 bg-[#FAF8F5] text-stone-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-stone-200 gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/dashboard"
            className="p-2.5 rounded-xl bg-white text-stone-700 hover:text-stone-900 hover:bg-stone-100 border border-stone-300 shadow-xs transition-colors"
            title="回管理控制台"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
              <Zap className="w-6 h-6 text-amber-500" />
              校園活動與突發事件管理後台
            </h1>
            <p className="text-xs text-stone-600 mt-0.5">
              新增、修改、刪除日常活動（早餐、午餐、晚餐、宿舍休閒、校園休閒），設定觸發時間點與觸發方式，並在模擬進行後即時標記在行事曆上
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-stone-100 border border-stone-300 shadow-2xs">
          <button
            onClick={() => setActiveTab("activities")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "activities"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>日常活動管理 ({activities.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("random_events")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "random_events"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>突發事件庫 ({randomEvents.length})</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: DAILY CAMPUS ACTIVITIES (Core User Request) */}
      {/* ======================================================== */}
      {activeTab === "activities" && (
        <div className="flex flex-col gap-5">
          {/* Action and Filter Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
              <button
                onClick={() => setCategoryFilter("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  categoryFilter === "all"
                    ? "bg-stone-900 text-white shadow-xs"
                    : "bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200"
                }`}
              >
                全部活動 ({activities.length})
              </button>
              {Object.entries(CATEGORY_MAP).map(([catKey, catMeta]) => {
                const Icon = catMeta.icon;
                const count = activities.filter((a) => a.category === catKey).length;
                return (
                  <button
                    key={catKey}
                    onClick={() => setCategoryFilter(catKey)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      categoryFilter === catKey
                        ? "bg-stone-900 text-white shadow-xs"
                        : "bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${catMeta.color}`} />
                    <span>{catMeta.label} ({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Right Buttons: Search + Create + Seed Defaults */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative flex-1 md:w-48">
                <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="搜尋活動標題/地點..."
                  value={activitySearchQuery}
                  onChange={(e) => setActivitySearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-stone-50 border border-stone-300 text-xs text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <button
                onClick={handleSeedDefaults}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-xs text-amber-800 font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                title="重設為 5 大預設活動 (早餐、午餐、晚餐、宿舍休閒、校園休閒)"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">恢復預設活動</span>
              </button>

              <button
                onClick={handleCreateNewActivityClick}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新增活動</span>
              </button>
            </div>
          </div>

          {/* Main 2-Column Split: Activities List + Comprehensive Editor */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Activities List (4 cols) */}
            <div className="lg:col-span-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col gap-2.5 max-h-[780px] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                <span className="text-xs font-bold text-stone-900">
                  活動清單 ({filteredActivities.length})
                </span>
                <span className="text-[10px] text-stone-500 font-medium">點擊卡片編輯設定</span>
              </div>

              {filteredActivities.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-500">
                  尚無符合條件之活動項目，可點擊上方「新增活動」或「恢復預設活動」
                </div>
              ) : (
                filteredActivities.map((act) => {
                  const isSelected = (!isCreatingNewActivity && selectedActivity?.id === act.id);
                  const catMeta = CATEGORY_MAP[act.category] || { label: act.category, icon: Compass, color: "text-blue-700", badge: "bg-blue-100 text-blue-900 border-blue-300" };
                  const Icon = catMeta.icon;

                  return (
                    <div
                      key={act.id}
                      onClick={() => selectActivityForEdit(act)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 relative ${
                        isSelected
                          ? "bg-blue-50/70 border-blue-500 shadow-xs ring-1 ring-blue-500"
                          : "bg-stone-50/60 hover:bg-stone-100/80 border-stone-200 shadow-2xs"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${catMeta.color} shrink-0`} />
                          <span className="text-xs font-bold text-stone-900 line-clamp-1">{act.title}</span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono font-bold shrink-0 ${catMeta.badge}`}>
                          {catMeta.label}
                        </span>
                      </div>

                      {/* Trigger Timing & Mode Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-800 border border-stone-300 font-mono flex items-center gap-1 font-semibold">
                          <Clock className="w-3 h-3 text-stone-600" />
                          <span>{act.trigger_timing || "全天"}</span>
                        </span>
                        {act.location_name && (
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200 flex items-center gap-1 truncate max-w-[140px] font-medium">
                            <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
                            <span className="truncate">{act.location_name}</span>
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200 text-[10px] font-semibold">
                          權重 {act.weight}
                        </span>
                      </div>

                      <p className="text-[11px] text-stone-600 line-clamp-2 leading-relaxed">
                        {act.event_prompt}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Column: Activity Editor & Live Sandbox (8 cols) */}
            <div className="lg:col-span-8 flex flex-col gap-5">
              {(selectedActivity || isCreatingNewActivity) ? (
                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col gap-5">
                  {/* Editor Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                        {isCreatingNewActivity ? (
                          <>
                            <Plus className="w-4 h-4 text-emerald-600" />
                            <span>新增校園動態活動</span>
                          </>
                        ) : (
                          <>
                            <Utensils className="w-4 h-4 text-blue-600" />
                            <span>編輯活動：{actTitle}</span>
                          </>
                        )}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2">
                      {actSaveMessage && (
                        <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 animate-in fade-in">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {actSaveMessage}
                        </span>
                      )}
                      {!isCreatingNewActivity && selectedActivity && (
                        <button
                          onClick={() => handleDeleteActivity(selectedActivity.id)}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                          title="刪除此活動"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>刪除</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Form Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Activity ID */}
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">活動代碼 (ID)</label>
                      <input
                        type="text"
                        value={actId}
                        disabled={!isCreatingNewActivity}
                        onChange={(e) => setActId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs text-stone-900 font-mono disabled:opacity-50 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                      />
                    </div>

                    {/* Activity Title */}
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">活動名稱</label>
                      <input
                        type="text"
                        value={actTitle}
                        onChange={(e) => setActTitle(e.target.value)}
                        placeholder="例如：午膳美味時光、宿舍補眠放鬆..."
                        className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                      />
                    </div>

                    {/* Category Selector */}
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">活動類別</label>
                      <select
                        value={actCategory}
                        onChange={(e) => setActCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-blue-600 cursor-pointer"
                      >
                        <option value="breakfast">早餐 (Breakfast)</option>
                        <option value="lunch">午餐 (Lunch)</option>
                        <option value="dinner">晚餐 (Dinner)</option>
                        <option value="dorm_leisure">宿舍休閒活動 (Dormitory Leisure)</option>
                        <option value="campus_leisure">校園休閒活動 (Campus Leisure)</option>
                      </select>
                    </div>

                    {/* Trigger Mode */}
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">觸發方式 (Trigger Mode)</label>
                      <select
                        value={actTriggerMode}
                        onChange={(e) => setActTriggerMode(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-blue-600 cursor-pointer"
                      >
                        <option value="manual_choice">主動選擇是否觸發 (要不要吃午餐 / 空檔選擇回宿舍或校園活動)</option>
                        <option value="auto_prompt">時間到達時自動提示與推薦</option>
                        <option value="conditional">符合特定條件/機率時觸發</option>
                      </select>
                    </div>

                    {/* Trigger Timing Input & Quick Presets */}
                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-stone-700">觸發時間點 (Trigger Timing)</label>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {PRESET_TIMINGS.map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setActTriggerTiming(preset)}
                              className="px-2 py-0.5 rounded-lg bg-stone-100 hover:bg-stone-200 border border-stone-300 text-[10px] text-stone-700 font-mono transition-colors cursor-pointer"
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>
                      <input
                        type="text"
                        value={actTriggerTiming}
                        onChange={(e) => setActTriggerTiming(e.target.value)}
                        placeholder="例如：11:50~13:30、下課空閒時間、07:00~09:00..."
                        className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs text-stone-900 font-mono focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                      />
                    </div>

                    {/* Location Selector */}
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">活動場域 / 館舍</label>
                      <select
                        value={actLocationId}
                        onChange={(e) => {
                          const lid = e.target.value;
                          setActLocationId(lid);
                          const found = PRESET_LOCATIONS.find((p) => p.id === lid);
                          if (found) setActLocationName(found.name);
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-blue-600 cursor-pointer"
                      >
                        {PRESET_LOCATIONS.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name} ({loc.id})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Weight and Active Toggle */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-xs font-semibold text-stone-700 mb-1">
                          <span>抽籤權重</span>
                          <span className="text-amber-700 font-mono font-bold">{actWeight}</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={actWeight}
                          onChange={(e) => setActWeight(parseInt(e.target.value))}
                          className="w-full accent-amber-600 cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-3">
                        <label className="text-xs font-semibold text-stone-800 cursor-pointer flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={actIsActive}
                            onChange={(e) => setActIsActive(e.target.checked)}
                            className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                          />
                          <span>啟用此活動</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Event Prompt */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      餵給本地 LLM 的情境指令 (event_prompt)
                    </label>
                    <textarea
                      value={actEventPrompt}
                      onChange={(e) => setActEventPrompt(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 resize-none leading-relaxed"
                      placeholder="描述當前時間點的環境氣氛，引導玩家做出是否參與或何種方式參與之抉擇..."
                    />
                  </div>

                  {/* Preset Options & Stat Effects */}
                  <div className="space-y-3 pt-3 border-t border-stone-200">
                    <span className="text-xs text-stone-900 font-bold block flex items-center justify-between">
                      <span>行動選項設定 (三個方案與數值增減)：</span>
                      <span className="text-[11px] text-stone-500 font-medium">
                        勾選「標記於行事曆」者將在玩家選擇後即時於課表上加入行程
                      </span>
                    </span>

                    {actOptions.map((opt, idx) => (
                      <div
                        key={opt.option_key}
                        className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col gap-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-lg bg-blue-600 text-white font-mono font-bold text-xs">
                            選項 {opt.option_key}
                          </span>
                          <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={opt.marks_activity !== false}
                              onChange={(e) => {
                                const next = [...actOptions];
                                next[idx] = { ...next[idx], marks_activity: e.target.checked };
                                setActOptions(next);
                              }}
                              className="w-3.5 h-3.5 rounded accent-blue-600 cursor-pointer"
                            />
                            <span className="text-blue-800">選擇後標記在行事曆上</span>
                          </label>
                        </div>

                        <input
                          type="text"
                          value={opt.intent_hint}
                          onChange={(e) => {
                            const next = [...actOptions];
                            next[idx] = { ...next[idx], intent_hint: e.target.value };
                            setActOptions(next);
                          }}
                          placeholder={`方案 ${opt.option_key} 意圖提示...`}
                          className="w-full px-3 py-1.5 rounded-xl bg-white border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                        />

                        {/* Effects sliders / numbers */}
                        <div className="grid grid-cols-4 gap-2.5 pt-1">
                          <div>
                            <span className="text-[11px] font-bold text-emerald-800 block mb-0.5">體力 (Stamina)</span>
                            <input
                              type="number"
                              value={opt.effects?.stamina ?? 0}
                              onChange={(e) => {
                                const next = [...actOptions];
                                next[idx] = {
                                  ...next[idx],
                                  effects: { ...next[idx].effects, stamina: parseInt(e.target.value) || 0 },
                                };
                                setActOptions(next);
                              }}
                              className="w-full px-2 py-1.5 rounded-xl bg-white border border-stone-300 text-xs text-stone-900 font-mono text-center focus:outline-none focus:border-blue-600"
                            />
                          </div>

                          <div>
                            <span className="text-[11px] font-bold text-blue-800 block mb-0.5">學業 (Study)</span>
                            <input
                              type="number"
                              value={opt.effects?.study ?? 0}
                              onChange={(e) => {
                                const next = [...actOptions];
                                next[idx] = {
                                  ...next[idx],
                                  effects: { ...next[idx].effects, study: parseInt(e.target.value) || 0 },
                                };
                                setActOptions(next);
                              }}
                              className="w-full px-2 py-1.5 rounded-xl bg-white border border-stone-300 text-xs text-stone-900 font-mono text-center focus:outline-none focus:border-blue-600"
                            />
                          </div>

                          <div>
                            <span className="text-[11px] font-bold text-purple-800 block mb-0.5">社交 (Social)</span>
                            <input
                              type="number"
                              value={opt.effects?.social ?? 0}
                              onChange={(e) => {
                                const next = [...actOptions];
                                next[idx] = {
                                  ...next[idx],
                                  effects: { ...next[idx].effects, social: parseInt(e.target.value) || 0 },
                                };
                                setActOptions(next);
                              }}
                              className="w-full px-2 py-1.5 rounded-xl bg-white border border-stone-300 text-xs text-stone-900 font-mono text-center focus:outline-none focus:border-blue-600"
                            />
                          </div>

                          <div>
                            <span className="text-[11px] font-bold text-amber-800 block mb-0.5">金錢 (Money)</span>
                            <input
                              type="number"
                              value={opt.effects?.money ?? 0}
                              onChange={(e) => {
                                const next = [...actOptions];
                                next[idx] = {
                                  ...next[idx],
                                  effects: { ...next[idx].effects, money: parseInt(e.target.value) || 0 },
                                };
                                setActOptions(next);
                              }}
                              className="w-full px-2 py-1.5 rounded-xl bg-white border border-stone-300 text-xs text-stone-900 font-mono text-center focus:outline-none focus:border-blue-600"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-stone-200">
                    <button
                      onClick={handleSaveActivity}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors"
                    >
                      {isCreatingNewActivity ? "建立並儲存活動" : "儲存活動修改"}
                    </button>

                    <button
                      onClick={handleTestActivitySandbox}
                      disabled={isActSandboxTesting}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold text-xs cursor-pointer shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      {isActSandboxTesting ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span>★ AI 即時沙盒預覽測試</span>
                    </button>
                  </div>

                  {/* Live Sandbox Output */}
                  {actSandboxStory && (
                    <div className="mt-2 p-5 rounded-2xl border border-amber-300 bg-amber-50/80 flex flex-col gap-3 animate-in fade-in">
                      <span className="text-xs font-mono uppercase text-amber-900 flex items-center gap-1.5 font-bold">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        本地 LLM 即時生成情境預覽
                      </span>
                      <p className="text-xs sm:text-sm text-stone-800 leading-relaxed font-normal">
                        {actSandboxStory.narrative}
                      </p>
                      <div className="flex flex-col gap-2 pt-2 border-t border-amber-200">
                        {actSandboxStory.options?.map((opt: any) => (
                          <div key={opt.option_key} className="text-xs text-stone-800 bg-white border border-amber-200 rounded-xl p-2.5 flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-stone-900 text-amber-300 font-mono font-bold">
                              {opt.option_key}
                            </span>
                            <span className="font-medium">{opt.display_text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white p-16 rounded-2xl text-center text-stone-500 text-sm border border-stone-200 shadow-xs flex flex-col items-center justify-center gap-3">
                  <Utensils className="w-10 h-10 text-stone-400" />
                  <p className="font-medium">請從左側清單選擇欲編輯的日常活動，或點擊「新增活動」建立項目</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: RANDOM EVENTS POOL (Preserved Existing Management) */}
      {/* ======================================================== */}
      {activeTab === "random_events" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
          {/* Left Column: Events List (4 cols) */}
          <div className="lg:col-span-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col gap-3 max-h-[820px] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <span className="text-xs font-bold text-stone-900">
                突發事件庫清單 ({randomEvents.length})
              </span>
              <button
                onClick={handleStartCreateRandomEvent}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs cursor-pointer shadow-xs flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新增事件</span>
              </button>
            </div>

            {randomEvents.map((ev) => {
              const isSelected = !isCreatingNewRandomEvent && selectedRandomEvent?.id === ev.id;
              const trigRate = Math.round((ev.trigger_rate ?? 0.5) * 100);
              return (
                <div
                  key={ev.id}
                  onClick={() => selectRandomEventForEdit(ev)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                    isSelected
                      ? "bg-blue-50/80 border-blue-500 ring-1 ring-blue-500 shadow-xs"
                      : "bg-stone-50/70 border-stone-200 hover:border-stone-400 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate pr-2 text-xs font-bold text-stone-900">{ev.title}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 border border-blue-300 font-bold">
                        機率 {trigRate}%
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                        權重 {ev.weight}
                      </span>
                    </div>
                  </div>

                  {/* Conditions summary badges */}
                  <div className="flex flex-wrap items-center gap-1 text-[10px]">
                    {(ev.cond_time_start || ev.cond_time_end) && (
                      <span className="px-1.5 py-0.5 rounded bg-stone-200 text-stone-800 border border-stone-300 font-medium flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5 text-stone-600" />
                        {ev.cond_time_start || "00:00"}~{ev.cond_time_end || "24:00"}
                      </span>
                    )}
                    {ev.cond_activity_type && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-medium">
                        活動:{ev.cond_activity_type}
                      </span>
                    )}
                    {ev.cond_activity_title && (
                      <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-300 font-medium">
                        名稱:{ev.cond_activity_title}
                      </span>
                    )}
                    {ev.cond_prev_activity && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-medium">
                        前置活動:{ev.cond_prev_activity}
                      </span>
                    )}
                    {ev.cond_prev_event_id && (
                      <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-900 border border-rose-300 font-medium">
                        前置事件
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-stone-600 line-clamp-2 leading-relaxed">{ev.event_prompt}</span>
                </div>
              );
            })}
          </div>

          {/* Right Column: Event Editor & Live Sandbox (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            {isCreatingNewRandomEvent || selectedRandomEvent ? (
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col gap-5">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-stone-900">
                      {isCreatingNewRandomEvent ? "✨ 新增自訂突發事件" : `編輯事件：${selectedRandomEvent?.title}`}
                    </h2>
                    {isCreatingNewRandomEvent && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800 border border-blue-200 font-bold">
                        NEW
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {reSaveMessage && (
                      <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 animate-in fade-in">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {reSaveMessage}
                      </span>
                    )}
                    {!isCreatingNewRandomEvent && selectedRandomEvent && (
                      <button
                        onClick={handleDeleteRandomEvent}
                        className="px-3 py-1.5 rounded-xl border border-rose-300 hover:bg-rose-50 text-rose-700 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        title="刪除此突發事件"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>刪除</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 1. 基本資訊 */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-semibold text-stone-700 mb-1">事件代碼 (ID)</label>
                    <input
                      type="text"
                      disabled={!isCreatingNewRandomEvent}
                      value={reId}
                      onChange={(e) => setReId(e.target.value)}
                      placeholder="例如 evt_library_exam"
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-blue-600 font-mono disabled:opacity-50"
                    />
                  </div>
                  <div className="sm:col-span-6">
                    <label className="block text-xs font-semibold text-stone-700 mb-1">事件標題</label>
                    <input
                      type="text"
                      value={reTitle}
                      onChange={(e) => setReTitle(e.target.value)}
                      placeholder="例如：中午松果餐廳排隊大塞車"
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-blue-600 font-medium"
                    />
                  </div>
                  <div className="sm:col-span-2 flex flex-col justify-center pt-3">
                    <label className="flex items-center gap-2 text-xs text-stone-800 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reIsActive}
                        onChange={(e) => setReIsActive(e.target.checked)}
                        className="rounded accent-blue-600 cursor-pointer w-4 h-4"
                      />
                      <span>啟用事件</span>
                    </label>
                  </div>
                </div>

                {/* 2. 獨立觸發機率與權重設定 */}
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex flex-col gap-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
                    <Zap className="w-4 h-4 text-blue-600" />
                    <span>觸發機率與抽籤權重配置</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* 觸發機率 Slider */}
                    <div>
                      <div className="flex justify-between items-center text-xs font-semibold text-stone-700 mb-1">
                        <span>專屬觸發機率 (trigger_rate)</span>
                        <span className="text-blue-700 font-mono font-extrabold text-sm">
                          {Math.round(reTriggerRate * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={reTriggerRate}
                        onChange={(e) => setReTriggerRate(parseFloat(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                      <span className="text-[11px] text-stone-500 block mt-1">
                        滿足下方設定條件時，此事件單獨觸發的機率（設為 100% 則滿足條件即必定觸發）
                      </span>
                    </div>

                    {/* 抽籤權重 Slider */}
                    <div>
                      <div className="flex justify-between items-center text-xs font-semibold text-stone-700 mb-1">
                        <span>多事件競爭權重 (weight)</span>
                        <span className="text-amber-800 font-mono font-extrabold text-sm">{reWeight}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={reWeight}
                        onChange={(e) => setReWeight(parseInt(e.target.value))}
                        className="w-full accent-amber-600 cursor-pointer"
                      />
                      <span className="text-[11px] text-stone-500 block mt-1">
                        當同一個時段有多個事件均通過觸發機率時，依此權重進行抽取
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. 觸發條件設定區 (Trigger Conditions) */}
                <div className="p-4 rounded-xl bg-blue-50/40 border border-blue-200 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
                      <Filter className="w-4 h-4 text-blue-600" />
                      <span>觸發條件設定（未填寫者代表無限制）</span>
                    </div>
                    <span className="text-[11px] text-stone-500 font-medium">
                      所有已填寫之條件須同時滿足
                    </span>
                  </div>

                  {/* 條件一：在 OO:XX 時間 */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-stone-200">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <label className="text-xs text-stone-800 font-semibold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>① 時間觸發範圍（在 OO:XX 時間內）</span>
                      </label>
                      {/* 快速填寫按鈕 */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => { setReCondTimeStart(""); setReCondTimeEnd(""); }}
                          className="px-2 py-0.5 rounded-lg bg-white border border-stone-300 hover:bg-stone-100 text-[11px] text-stone-700 cursor-pointer transition-colors"
                        >
                          全天不限
                        </button>
                        <button
                          type="button"
                          onClick={() => { setReCondTimeStart("07:30"); setReCondTimeEnd("09:00"); }}
                          className="px-2 py-0.5 rounded-lg bg-blue-100 border border-blue-300 hover:bg-blue-200 text-[11px] text-blue-900 font-medium cursor-pointer transition-colors"
                        >
                          早晨 (07:30~09:00)
                        </button>
                        <button
                          type="button"
                          onClick={() => { setReCondTimeStart("12:00"); setReCondTimeEnd("13:30"); }}
                          className="px-2 py-0.5 rounded-lg bg-emerald-100 border border-emerald-300 hover:bg-emerald-200 text-[11px] text-emerald-900 font-medium cursor-pointer transition-colors"
                        >
                          午餐 (12:00~13:30)
                        </button>
                        <button
                          type="button"
                          onClick={() => { setReCondTimeStart("17:30"); setReCondTimeEnd("19:30"); }}
                          className="px-2 py-0.5 rounded-lg bg-orange-100 border border-orange-300 hover:bg-orange-200 text-[11px] text-orange-900 font-medium cursor-pointer transition-colors"
                        >
                          晚餐 (17:30~19:30)
                        </button>
                        <button
                          type="button"
                          onClick={() => { setReCondTimeStart("21:00"); setReCondTimeEnd("23:59"); }}
                          className="px-2 py-0.5 rounded-lg bg-indigo-100 border border-indigo-300 hover:bg-indigo-200 text-[11px] text-indigo-900 font-medium cursor-pointer transition-colors"
                        >
                          深夜 (21:00~23:59)
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[11px] text-stone-600 block mb-1 font-medium">起始時間 (例如 12:00)</span>
                        <input
                          type="text"
                          value={reCondTimeStart}
                          onChange={(e) => setReCondTimeStart(e.target.value)}
                          placeholder="例如 12:00 (留空不限)"
                          className="w-full px-3 py-1.5 rounded-xl bg-white border border-stone-300 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-blue-600 font-mono"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-stone-600 block mb-1 font-medium">結束時間 (例如 13:30)</span>
                        <input
                          type="text"
                          value={reCondTimeEnd}
                          onChange={(e) => setReCondTimeEnd(e.target.value)}
                          placeholder="例如 13:30 (留空不限)"
                          className="w-full px-3 py-1.5 rounded-xl bg-white border border-stone-300 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-blue-600 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 條件二：當前活動條件 (有甚麼活動) */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-stone-200">
                    <label className="text-xs text-stone-800 font-semibold flex items-center gap-1">
                      <Utensils className="w-3.5 h-3.5 text-emerald-700" />
                      <span>② 當前進行之活動條件（當前有甚麼活動時觸發）</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-[11px] text-stone-600 block mb-1 font-medium">活動類型要求</span>
                        <select
                          value={reCondActivityType}
                          onChange={(e) => setReCondActivityType(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl bg-white border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-blue-600 cursor-pointer font-medium"
                        >
                          <option value="">不限活動類型（任何活動時段）</option>
                          <option value="course">正式課程時段 (course)</option>
                          <option value="club">社團課後活動 (club)</option>
                          <option value="dining">用餐美食時段 (dining / lunch)</option>
                          <option value="dorm">學生宿舍休閒 (dorm)</option>
                          <option value="leisure">校園設施休閒 (leisure)</option>
                        </select>
                      </div>

                      <div>
                        <span className="text-[11px] text-stone-600 block mb-1 font-medium">當前活動名稱關鍵字</span>
                        <input
                          type="text"
                          value={reCondActivityTitle}
                          onChange={(e) => setReCondActivityTitle(e.target.value)}
                          placeholder="例如：微積分、羽球、宵夜 (留空不限)"
                          className="w-full px-3 py-1.5 rounded-xl bg-white border border-stone-300 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-blue-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 條件三：先前活動條件 (先發生甚麼活動) */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-stone-200">
                    <label className="text-xs text-stone-800 font-semibold flex items-center gap-1">
                      <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                      <span>③ 前置活動與歷史條件（先發生過甚麼活動或事件）</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-[11px] text-stone-600 block mb-1 font-medium">
                          先前歷史中需曾進行的活動關鍵字
                        </span>
                        <input
                          type="text"
                          value={reCondPrevActivity}
                          onChange={(e) => setReCondPrevActivity(e.target.value)}
                          placeholder="例如：體育、系學會、午餐 (留空不限)"
                          className="w-full px-3 py-1.5 rounded-xl bg-white border border-stone-300 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-blue-600"
                        />
                        <span className="text-[10px] text-stone-500 block mt-0.5">
                          若填寫，玩家先前行程或日誌中必須包含該關鍵字才會觸發
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-stone-600 block mb-1 font-medium">
                          先前需曾觸發的前置突發事件
                        </span>
                        <select
                          value={reCondPrevEventId}
                          onChange={(e) => setReCondPrevEventId(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl bg-white border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-blue-600 cursor-pointer font-medium"
                        >
                          <option value="">無前置事件要求（可直接觸發）</option>
                          {randomEvents.map((ev) => (
                            <option key={ev.id} value={ev.id}>
                              {ev.title} ({ev.id})
                            </option>
                          ))}
                        </select>
                        <span className="text-[10px] text-stone-500 block mt-0.5">
                          可設定系列連續劇事件，例如必須先觸發松鼠搶劫後才觸發報恩
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 條件四：地點與體力要求 */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-stone-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-stone-700 font-semibold block mb-1">限制館舍或地點</label>
                        <select
                          value={reCondLocation}
                          onChange={(e) => setReCondLocation(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl bg-white border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-blue-600 cursor-pointer font-medium"
                        >
                          <option value="">全校園任意地點不限</option>
                          {PRESET_LOCATIONS.map((loc) => (
                            <option key={loc.id} value={loc.id}>
                              {loc.name} ({loc.id})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs text-stone-700 font-semibold block mb-1">
                          體力限制區間 ({reCondMinStamina} ~ {reCondMaxStamina})
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={reCondMinStamina}
                            onChange={(e) => setReCondMinStamina(parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1.5 rounded-xl bg-white border border-stone-300 text-xs text-stone-900 text-center font-mono focus:border-blue-600"
                          />
                          <span className="text-stone-500 text-xs font-medium">至</span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={reCondMaxStamina}
                            onChange={(e) => setReCondMaxStamina(parseInt(e.target.value) || 100)}
                            className="w-20 px-2 py-1.5 rounded-xl bg-white border border-stone-300 text-xs text-stone-900 text-center font-mono focus:border-blue-600"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Event Prompt */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    餵給本地 LLM 的突發情境指令 (event_prompt)
                  </label>
                  <textarea
                    value={rePrompt}
                    onChange={(e) => setRePrompt(e.target.value)}
                    rows={3}
                    placeholder="例如：突發事件：正值中午 12 點用餐尖峰時段，你來到學餐準備填飽肚子，赫然發現排隊人龍已經一路排到了門口..."
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-blue-600 resize-none font-normal leading-relaxed"
                  />
                </div>

                {/* 5. Option Hints */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-stone-700 block">
                    三個預設選項意圖提示（由 LLM 潤飾為大學生生動語句）：
                  </span>
                  <input
                    type="text"
                    placeholder="選項 A 提示..."
                    value={reOptA}
                    onChange={(e) => setReOptA(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-blue-600"
                  />
                  <input
                    type="text"
                    placeholder="選項 B 提示..."
                    value={reOptB}
                    onChange={(e) => setReOptB(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-blue-600"
                  />
                  <input
                    type="text"
                    placeholder="選項 C 提示..."
                    value={reOptC}
                    onChange={(e) => setReOptC(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-blue-600"
                  />
                </div>

                {/* 6. Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleSaveRandomEvent}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs cursor-pointer shadow-xs transition-all"
                  >
                    {isCreatingNewRandomEvent ? "建立並儲存事件" : "儲存事件修改"}
                  </button>
                  <button
                    onClick={handleTestRandomSandbox}
                    disabled={isReSandboxTesting}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs cursor-pointer shadow-xs flex items-center gap-1.5 transition-all"
                  >
                    {isReSandboxTesting ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>★ AI 即時預覽沙盒測試</span>
                  </button>
                </div>

                {/* 7. Live Sandbox Output Box */}
                {reSandboxStory && (
                  <div className="mt-2 p-5 rounded-2xl border border-amber-300 bg-amber-50/80 flex flex-col gap-3 animate-in fade-in">
                    <span className="text-xs font-mono uppercase text-amber-900 flex items-center gap-1.5 font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      本地 LLM 即時生成沙盒結果
                    </span>
                    <p className="text-xs sm:text-sm text-stone-800 leading-relaxed font-normal">
                      {reSandboxStory.narrative}
                    </p>
                    <div className="flex flex-col gap-2 pt-2 border-t border-amber-200">
                      {reSandboxStory.options?.map((opt: any) => (
                        <div key={opt.option_key} className="text-xs text-stone-800 bg-white border border-amber-200 rounded-xl p-2.5 flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-stone-900 text-amber-300 font-mono font-bold">
                            {opt.option_key}
                          </span>
                          <span className="font-medium">{opt.display_text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white p-16 rounded-2xl text-center text-stone-500 text-sm border border-stone-200 shadow-xs flex flex-col items-center justify-center gap-3">
                <Zap className="w-10 h-10 text-stone-400" />
                <p className="font-medium">請從左側清單選擇欲編輯之突發事件，或點擊「新增事件」自訂設定觸發條件與機率</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminEventsPage() {
  return (
    <AdminAuthGuard>
      <EventsContent />
    </AdminAuthGuard>
  );
}
