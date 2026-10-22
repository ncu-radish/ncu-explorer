"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Cpu,
  BarChart3,
  Sliders,
  Sparkles,
  Database,
  RefreshCw,
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { adminApi } from "@/lib/api";

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<any | null>(null);
  const [activeModel, setActiveModel] = useState<string>("gemma3:4b");
  const [triggerProb, setTriggerProb] = useState<number>(0.35);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const loadDashboard = async () => {
    try {
      const data = await adminApi.getDashboard();
      setMetrics(data);
      setActiveModel(data.active_model);
      setTriggerProb(data.event_trigger_prob);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleSaveConfig = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await adminApi.updateConfig({
        active_llm_model: activeModel,
        event_trigger_prob: triggerProb,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncVectors = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await adminApi.syncVectors();
      setSyncResult(res.message);
      await loadDashboard();
    } catch (err: any) {
      setSyncResult(`同步失敗: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 flex flex-col gap-6 bg-[#FAF8F5]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <Link
            href="/explore"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 text-stone-700 text-xs font-medium transition-colors border border-stone-300 shadow-xs"
            title="回中央相關資料"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>回相關資料</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              管理控制台
            </h1>
            <p className="text-xs text-stone-500">
              監控模擬數據、動態調整事件觸發機率與課程資料同步
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/events"
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 border border-stone-300 flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <span>突發事件管理與沙盒</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
            <span className="text-xs text-stone-500 block mb-1">總遊玩體驗人次</span>
            <span className="text-2xl font-extrabold text-stone-900 font-mono">
              {metrics.total_sessions}
            </span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
            <span className="text-xs text-stone-500 block mb-1">歷年課程資料總數</span>
            <span className="text-2xl font-extrabold text-blue-600 font-mono">
              {metrics.total_courses} 門
            </span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
            <span className="text-xs text-stone-500 block mb-1">已同步向量索引</span>
            <span className="text-2xl font-extrabold text-emerald-600 font-mono">
              {metrics.synced_courses} / {metrics.total_courses}
            </span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
            <span className="text-xs text-stone-500 block mb-1">全域突發事件機率</span>
            <span className="text-2xl font-extrabold text-amber-600 font-mono">
              {Math.round(metrics.event_trigger_prob * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* AI Model Switcher & System Config Card */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-stone-200 shadow-xs flex flex-col gap-5">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div>
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-600" />
              合規開源 LLM 模型切換
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              遵守校園資安規範，切換本地推論模型配置
            </p>
          </div>

          {saveSuccess && (
            <span className="text-xs text-emerald-600 flex items-center gap-1 font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" /> 設定已儲存上線
            </span>
          )}
        </div>

        {/* Model Selection Radio List */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {metrics?.available_models.map((mod: any) => {
            const isSelected = activeModel === mod.id;
            return (
              <div
                key={mod.id}
                onClick={() => setActiveModel(mod.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-blue-50 border-blue-400 shadow-xs"
                    : "bg-stone-50 border-stone-200 hover:border-stone-300"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-stone-900">{mod.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white text-stone-600 border border-stone-200">
                      {mod.org}
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-500">{mod.type}</span>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[10px] text-stone-500 font-mono">
                  <span className={`w-2 h-2 rounded-full ${isSelected ? "bg-blue-600" : "bg-stone-300"}`} />
                  {isSelected ? "目前推論使用中" : "點擊切換"}
                </div>
              </div>
            );
          })}
        </div>

        {/* Trigger Probability Slider */}
        <div className="p-5 rounded-2xl border border-stone-200 bg-stone-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-600" />
              每回合突發事件觸發機率控制（10% ~ 80%）：
            </span>
            <span className="text-sm font-bold font-mono text-amber-700">
              {Math.round(triggerProb * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="0.8"
            step="0.05"
            value={triggerProb}
            onChange={(e) => setTriggerProb(parseFloat(e.target.value))}
            className="w-full accent-amber-600 cursor-pointer"
          />
        </div>

        <button
          onClick={handleSaveConfig}
          disabled={isSaving}
          className="w-fit px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          <span>儲存並套用設定</span>
        </button>
      </div>

      {/* Vector Sync Panel */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-600" />
            課程資料庫索引同步管理
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            儲存於 <code className="text-blue-700 font-mono">./data/qdrant_storage</code>，維護課程搜尋語意與關鍵字索引。
          </p>
          {syncResult && <p className="text-xs text-emerald-600 mt-2">{syncResult}</p>}
        </div>

        <button
          onClick={handleSyncVectors}
          disabled={isSyncing}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
        >
          {isSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          <span>執行課程索引重新同步</span>
        </button>
      </div>
    </div>
  );
}

function Save(props: any) {
  return <CheckCircle2 {...props} />;
}
