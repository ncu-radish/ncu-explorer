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
    <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            管理控制台（Admin CMS）
          </h1>
          <p className="text-xs text-gray-400">
            監控生活模擬遊玩數據、動態切換資安合規開源 LLM、調整突發事件觸發率與向量庫同步
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/events"
            className="px-3.5 py-2 rounded-xl glass-panel hover:bg-white/10 text-xs font-semibold text-gray-200 border border-white/10 flex items-center gap-1.5 transition-colors"
          >
            <span>突發事件管理與沙盒</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-white/10">
            <span className="text-xs text-gray-400 block mb-1">總遊玩體驗人次</span>
            <span className="text-2xl font-extrabold text-white font-mono">
              {metrics.total_sessions}
            </span>
          </div>
          <div className="glass-panel p-5 rounded-2xl border border-white/10">
            <span className="text-xs text-gray-400 block mb-1">歷年課程資料總數</span>
            <span className="text-2xl font-extrabold text-cyan-400 font-mono">
              {metrics.total_courses} 門
            </span>
          </div>
          <div className="glass-panel p-5 rounded-2xl border border-white/10">
            <span className="text-xs text-gray-400 block mb-1">已同步向量索引</span>
            <span className="text-2xl font-extrabold text-emerald-400 font-mono">
              {metrics.synced_courses} / {metrics.total_courses}
            </span>
          </div>
          <div className="glass-panel p-5 rounded-2xl border border-white/10">
            <span className="text-xs text-gray-400 block mb-1">全域突發事件機率</span>
            <span className="text-2xl font-extrabold text-amber-400 font-mono">
              {Math.round(metrics.event_trigger_prob * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* AI Model Switcher & System Config Card */}
      <div className="glass-panel-glow p-6 sm:p-7 rounded-3xl border border-cyan-500/30 flex flex-col gap-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              合規開源 LLM 動態切換器
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              本平台嚴格遵守校園資安，全面採用歐美與台灣本土研發之開源模型，杜絕中國企業背景模型
            </p>
          </div>

          {saveSuccess && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 animate-in fade-in">
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
                    ? "bg-blue-600/25 border-cyan-400 shadow-md shadow-blue-500/20"
                    : "glass-panel border-white/10 hover:border-white/20"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{mod.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-cyan-300">
                      {mod.org}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400">{mod.type}</span>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[10px] text-gray-500 font-mono">
                  <span className={`w-2 h-2 rounded-full ${isSelected ? "bg-cyan-400 animate-ping" : "bg-gray-600"}`} />
                  {isSelected ? "目前正在推論使用中" : "點擊切換"}
                </div>
              </div>
            );
          })}
        </div>

        {/* Trigger Probability Slider */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              每回合突發事件觸發機率控制（10% ~ 80%）：
            </span>
            <span className="text-sm font-bold font-mono text-amber-400">
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
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>

        <button
          onClick={handleSaveConfig}
          disabled={isSaving}
          className="w-fit px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-lg shadow-blue-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          <span>儲存並套用模型與事件機率設定</span>
        </button>
      </div>

      {/* FastEmbed Qdrant Vector Sync Panel */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            FastEmbed 雙向量同步管理
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            本機嵌入模式儲存於 <code className="text-cyan-300 font-mono">./data/qdrant_storage</code>。包含微軟 E5 稠密語意與 BM25 稀疏字詞。
          </p>
          {syncResult && <p className="text-xs text-emerald-400 mt-2">{syncResult}</p>}
        </div>

        <button
          onClick={handleSyncVectors}
          disabled={isSyncing}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
        >
          {isSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          <span>執行 FastEmbed 雙向量重新同步</span>
        </button>
      </div>
    </div>
  );
}

function Save(props: any) {
  return <CheckCircle2 {...props} />;
}
