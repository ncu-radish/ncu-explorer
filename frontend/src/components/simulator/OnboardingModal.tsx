"use client";

import { useState } from "react";
import { Sparkles, Compass, Send, CheckCircle2 } from "lucide-react";
import { useSimulatorStore } from "@/store/useSimulatorStore";

const PRESET_PROMPTS = [
  "我是資訊管理學系大一，想參加資管系學會和熱舞社，想修一點人工智慧與現代網頁開發的課",
  "我是資訊工程學系大一，想參加 AI 創新研究社，對深度學習與密碼學演算法特別有熱忱",
  "我是大一新生，想探索各類人文通識與電影美學，打算加入吉他社與攝影社結交跨系好友",
];

export function OnboardingModal({ isOpen }: { isOpen: boolean }) {
  const [input, setInput] = useState("");
  const { startSimulation, isLoading, error } = useSimulatorStore();

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    startSimulation(input.trim());
  };

  const handleSelectPreset = (preset: string) => {
    setInput(preset);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white max-w-xl w-full p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shadow-xs">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-900 tracking-tight">開啟中央大學一週生活模擬</h2>
            <p className="text-xs text-stone-500">輸入你的學系與興趣，由系統為你客製課表與事件</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              描述你的系所、年級、想加入的社團或興趣：
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="例如：我是資訊管理學系大一，想參加熱舞社，對人工智慧和投資理財有興趣..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          {/* Preset Buttons */}
          <div>
            <span className="block text-[11px] text-stone-500 uppercase tracking-wider mb-2 font-mono">
              推薦新鮮人範本：
            </span>
            <div className="flex flex-col gap-2">
              {PRESET_PROMPTS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="text-left text-xs p-2.5 rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200 hover:border-stone-300 text-stone-700 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <span className="truncate pr-2">{preset}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-stone-400 group-hover:text-blue-600 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-full mt-2 py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>正在排課與準備情境...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>進入週一早晨 (開始模擬)</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
