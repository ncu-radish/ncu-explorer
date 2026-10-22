"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Sliders,
  Send,
  ArrowLeft,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { AdminAuthGuard } from "@/components/admin/AdminAuthGuard";

function EventsContent() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [weight, setWeight] = useState(15);
  const [eventPrompt, setEventPrompt] = useState("");
  const [optionAHint, setOptionAHint] = useState("");
  const [optionBHint, setOptionBHint] = useState("");
  const [optionCHint, setOptionCHint] = useState("");

  // Sandbox Live Test State
  const [sandboxStory, setSandboxStory] = useState<any | null>(null);
  const [isSandboxTesting, setIsSandboxTesting] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const loadEvents = async () => {
    try {
      const data = await adminApi.getEvents();
      setEvents(data);
      if (data.length > 0 && !selectedEvent) {
        selectForEdit(data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const selectForEdit = (ev: any) => {
    setSelectedEvent(ev);
    setTitle(ev.title);
    setWeight(ev.weight);
    setEventPrompt(ev.event_prompt);
    setOptionAHint(ev.preset_options?.[0]?.intent_hint || "");
    setOptionBHint(ev.preset_options?.[1]?.intent_hint || "");
    setOptionCHint(ev.preset_options?.[2]?.intent_hint || "");
    setSandboxStory(null);
  };

  const handleTestSandbox = async () => {
    setIsSandboxTesting(true);
    try {
      const presetOptions = [
        { option_key: "A", intent_hint: optionAHint || "全力以赴應對", effects: {} },
        { option_key: "B", intent_hint: optionBHint || "尋求室友幫助", effects: {} },
        { option_key: "C", intent_hint: optionCHint || "先回宿舍補眠", effects: {} },
      ];
      const data = await adminApi.testSandbox({
        event_prompt: eventPrompt || "突發狀況發生",
        preset_options: presetOptions,
        location_id: selectedEvent?.cond_location || "loc_park_creek",
      });
      setSandboxStory(data.generated_story);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSandboxTesting(false);
    }
  };

  const handleSaveEvent = async () => {
    if (!selectedEvent) return;
    try {
      const updatedOptions = [
        {
          option_key: "A",
          intent_hint: optionAHint,
          effects: selectedEvent.preset_options?.[0]?.effects || { stamina: -10, study: 10, social: 0, money: 0 },
        },
        {
          option_key: "B",
          intent_hint: optionBHint,
          effects: selectedEvent.preset_options?.[1]?.effects || { stamina: -5, study: 5, social: 10, money: -50 },
        },
        {
          option_key: "C",
          intent_hint: optionCHint,
          effects: selectedEvent.preset_options?.[2]?.effects || { stamina: 15, study: -10, social: -5, money: 0 },
        },
      ];

      await adminApi.updateEvent(selectedEvent.id, {
        title,
        weight,
        event_prompt: eventPrompt,
        preset_options: updatedOptions,
      });
      setSaveMessage("事件已成功更新！");
      setTimeout(() => setSaveMessage(null), 3000);
      await loadEvents();
    } catch (err: any) {
      setSaveMessage(`更新失敗: ${err.message}`);
    }
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/dashboard"
            className="p-2 rounded-xl glass-panel text-gray-400 hover:text-white border border-white/10"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              突發事件管理與 AI 即時沙盒
            </h1>
            <p className="text-xs text-gray-400">
              調整機率加權、修改觸發 Prompt，並點擊即時測試由本地端合規 LLM 生成預覽
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Left Column: Events List (4 cols) */}
        <div className="lg:col-span-4 glass-panel p-4 rounded-2xl border border-white/10 flex flex-col gap-2 max-h-[750px] overflow-y-auto">
          <span className="text-xs font-bold text-gray-300 mb-2 block">突發事件庫清單 ({events.length})</span>
          {events.map((ev) => {
            const isSelected = selectedEvent?.id === ev.id;
            return (
              <div
                key={ev.id}
                onClick={() => selectForEdit(ev)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 ${
                  isSelected
                    ? "bg-blue-600/25 border-cyan-400 shadow-md shadow-blue-500/20"
                    : "bg-white/5 border-white/5 hover:border-white/15"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>{ev.title}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300">
                    權重 {ev.weight}
                  </span>
                </div>
                <span className="text-[11px] text-gray-400 line-clamp-2">{ev.event_prompt}</span>
              </div>
            );
          })}
        </div>

        {/* Right Column: Event Editor & Live Sandbox (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {selectedEvent ? (
            <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h2 className="text-base font-bold text-white">編輯事件：{selectedEvent.title}</h2>
                {saveMessage && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1 animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {saveMessage}
                  </span>
                )}
              </div>

              {/* Title & Weight */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-gray-400 mb-1">事件標題</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>抽籤權重 (1~100)</span>
                    <span className="text-amber-400 font-mono font-bold">{weight}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={weight}
                    onChange={(e) => setWeight(parseInt(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Event Prompt */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  餵給本地 LLM 的突發情境指令 (event_prompt)
                </label>
                <textarea
                  value={eventPrompt}
                  onChange={(e) => setEventPrompt(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400 resize-none"
                />
              </div>

              {/* Option Hints */}
              <div className="space-y-2">
                <span className="text-xs text-gray-400 block font-medium">
                  三個預設選項意圖提示（由 LLM 潤飾為大學生生動語句）：
                </span>
                <input
                  type="text"
                  placeholder="選項 A 提示..."
                  value={optionAHint}
                  onChange={(e) => setOptionAHint(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="選項 B 提示..."
                  value={optionBHint}
                  onChange={(e) => setOptionBHint(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="選項 C 提示..."
                  value={optionCHint}
                  onChange={(e) => setOptionCHint(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSaveEvent}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs cursor-pointer shadow-md shadow-blue-500/20"
                >
                  儲存修改
                </button>
                <button
                  onClick={handleTestSandbox}
                  disabled={isSandboxTesting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-bold text-xs cursor-pointer shadow-md shadow-amber-500/20 flex items-center gap-1.5"
                >
                  {isSandboxTesting ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>★ AI 即時預覽沙盒測試</span>
                </button>
              </div>

              {/* Live Sandbox Output Box */}
              {sandboxStory && (
                <div className="mt-3 p-5 rounded-2xl glass-panel-glow border border-amber-500/30 bg-amber-500/5 flex flex-col gap-3">
                  <span className="text-xs font-mono uppercase text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    本地 LLM 即時生成沙盒結果
                  </span>
                  <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">
                    {sandboxStory.narrative}
                  </p>
                  <div className="flex flex-col gap-1.5 pt-2 border-t border-white/10">
                    {sandboxStory.options?.map((opt: any) => (
                      <div key={opt.option_key} className="text-xs text-gray-300 flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-black/40 text-amber-300 font-mono font-bold">
                          {opt.option_key}
                        </span>
                        <span>{opt.display_text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-3xl text-center text-gray-500 text-sm">
              請從左側清單選擇欲編輯之突發事件
            </div>
          )}
        </div>
      </div>
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
