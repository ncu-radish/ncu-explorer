"use client";

import { useState } from "react";
import { Sparkles, Compass, Send, CheckCircle2, GraduationCap, Building2 } from "lucide-react";
import { useSimulatorStore } from "@/store/useSimulatorStore";

const POPULAR_DEPTS = [
  "資訊管理學系",
  "資訊工程學系",
  "電機工程學系",
  "通訊工程學系",
  "企業管理學系",
  "財務金融學系",
  "經濟學系",
  "機械工程學系",
  "土木工程學系",
  "化學工程與材料工程學系",
  "數學系",
  "物理學系",
  "化學學系",
  "生命科學系",
  "中國文學系",
  "英美語文學系",
  "法國語文學系",
];

const PRESET_PROMPTS = [
  { dept: "資訊管理學系", grade: 2, text: "我是資管系大二，雙主修資工系，想修演算法與計算機組織，晚上參加熱音社" },
  { dept: "資訊管理學系", grade: 1, text: "我是資訊管理學系大一，想參加資管系學會和熱舞社，想修一點人工智慧與現代網頁開發的課" },
  { dept: "資訊工程學系", grade: 2, text: "我是資訊工程學系大二，想參加 AI 創新研究社，對深度學習與密碼學演算法特別有熱忱" },
  { dept: "企業管理學系", grade: 3, text: "我是企管系大三，輔系財金系，想探索各類商業策略與投資理財，打算加入吉他社" },
  { dept: "資訊管理學系", grade: 4, text: "我是資管系大四老鳥，主力在畢業專題與實習，想過個充實自在的大學生活" },
];


export function OnboardingModal({ isOpen }: { isOpen: boolean }) {
  const [dept, setDept] = useState("資訊管理學系");
  const [grade, setGrade] = useState(1);
  const [input, setInput] = useState("");
  const { startSimulation, isLoading, error } = useSimulatorStore();

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading) return;
    const finalInput = input.trim() || `我是${dept}大${["一", "二", "三", "四"][grade - 1]}學生，希望能體驗豐富的中央大學校園生活。`;
    startSimulation(finalInput, dept, grade);
  };

  const handleSelectPreset = (preset: { dept: string; grade: number; text: string }) => {
    setDept(preset.dept);
    setGrade(preset.grade);
    setInput(preset.text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white max-w-xl w-full p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-700 border border-stone-200 flex items-center justify-center shadow-xs">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-900 tracking-tight">開啟中央大學一週生活模擬</h2>
            <p className="text-sm text-stone-600">週一至週五整日時間軸，依所屬學系與年級精準排定課表</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Department & Grade Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-stone-500" />
                <span>就讀學系：</span>
              </label>
              <select
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer shadow-2xs"
              >
                {POPULAR_DEPTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1.5 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-stone-500" />
                <span>年級別（預設大一）：</span>
              </label>
              <div className="grid grid-cols-4 gap-1">
                {[1, 2, 3, 4].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGrade(g)}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      grade === g
                        ? "bg-violet-600 text-white shadow-xs"
                        : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-100"
                    }`}
                  >
                    大{["一", "二", "三", "四"][g - 1]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              想加入的社團、個人興趣或大學目標（選填）：
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="例如：我是資管大二，想雙主修資工系，參加熱舞社，對演算法與深度學習有興趣...（亦支援自然輸入輔系）"
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder-stone-400 text-xs focus:outline-none focus:border-violet-500 transition-colors resize-none"
            />

          </div>

          {/* Preset Buttons */}
          <div>
            <span className="block text-xs text-stone-500 uppercase tracking-wider mb-2 font-mono">
              推薦經典劇本範本：
            </span>
            <div className="flex flex-col gap-1.5">
              {PRESET_PROMPTS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="text-left text-xs p-2 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 hover:border-stone-300 text-stone-700 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <span className="truncate pr-2">{preset.text}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-stone-400 group-hover:text-violet-600 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-6 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>正在排課與準備一週時間軸...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>開啟週一早晨 (開始模擬)</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
