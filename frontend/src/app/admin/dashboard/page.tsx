"use client";

import { useState, useEffect, useRef } from "react";
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
  UploadCloud,
  FileBox,
  AlertCircle,
  ExternalLink,
  Check,
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { AdminAuthGuard } from "@/components/admin/AdminAuthGuard";

function DashboardContent() {
  const [metrics, setMetrics] = useState<any | null>(null);
  const [activeModel, setActiveModel] = useState<string>("gemma3:4b");
  const [triggerProb, setTriggerProb] = useState<number>(0.35);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  // 3D Model Upload State
  const [modelInfo, setModelInfo] = useState<any | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const loadModelInfo = async () => {
    try {
      const info = await adminApi.getModelInfo();
      setModelInfo(info);
    } catch (err) {
      console.error("載入模型資訊失敗:", err);
    }
  };

  useEffect(() => {
    loadDashboard();
    loadModelInfo();
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith(".glb")) {
        setUploadError("僅支援上傳 .glb 格式之 3D 模型檔案");
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
      setUploadSuccess(null);
    }
  };

  const handleUploadModel = async () => {
    if (!selectedFile) {
      setUploadError("請先選擇要上傳的 .glb 檔案");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const res = await adminApi.uploadModel(selectedFile);
      setUploadSuccess(res.message);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await loadModelInfo();
    } catch (err: any) {
      setUploadError(err.message || "上傳失敗，請確認檔案有效性與網路連線");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 flex flex-col gap-6 bg-[#FAF8F5]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <Link
            href="/explore"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 text-stone-700 text-xs font-semibold transition-colors border border-stone-300 shadow-xs"
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
              維護 3D 校園模型、調校 AI 推論參數與課程雙向量索引
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

      {/* ================================================================= */}
      {/* 3D Campus Model (.glb) Upload Card */}
      {/* ================================================================= */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-stone-200 shadow-xs flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-200 gap-2">
          <div>
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <FileBox className="w-5 h-5 text-indigo-600" />
              3D 校園地圖模型更新 (.glb)
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              直接上傳更新伺服器上的 <code className="font-mono text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded">campus_buildings.glb</code> 檔案
            </p>
          </div>

          <Link
            href="/map"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold border border-indigo-200 transition-colors w-fit shadow-2xs"
          >
            <span>預覽 3D 地圖</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Current Model Status Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs">
          <div>
            <span className="text-stone-400 block mb-0.5">伺服器模型檔案</span>
            <span className="font-mono font-bold text-stone-800">
              {modelInfo?.filename || "campus_buildings.glb"}
            </span>
          </div>
          <div>
            <span className="text-stone-400 block mb-0.5">目前檔案大小</span>
            <span className="font-mono font-bold text-stone-800">
              {modelInfo?.file_size_formatted || "讀取中..."}
            </span>
          </div>
          <div>
            <span className="text-stone-400 block mb-0.5">最後更新時間</span>
            <span className="font-mono text-stone-700">
              {modelInfo?.last_modified || "尚未更新"}
            </span>
          </div>
        </div>

        {modelInfo?.has_backup && (
          <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-amber-600" />
              伺服器已自動建立上一版安全備份檔案 (<code className="font-mono">campus_buildings.glb.bak</code> - {modelInfo.backup_size_formatted})
            </span>
            <span className="text-[10px] text-amber-600 font-mono hidden sm:inline">
              備份時間: {modelInfo.backup_last_modified}
            </span>
          </div>
        )}

        {/* Success / Error Messages */}
        {uploadSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-semibold">{uploadSuccess}</span>
            </div>
            <Link
              href="/map"
              className="px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold transition-colors whitespace-nowrap shadow-2xs"
            >
              立刻前往 3D 地圖查看
            </Link>
          </div>
        )}

        {uploadError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* File Dropzone / Selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".glb"
            onChange={handleFileSelect}
            className="hidden"
            id="glb-file-upload"
          />

          <label
            htmlFor="glb-file-upload"
            className="flex-1 p-5 rounded-2xl border-2 border-dashed border-stone-300 hover:border-indigo-400 bg-stone-50 hover:bg-stone-100/70 transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 text-center group"
          >
            <UploadCloud className="w-7 h-7 text-stone-400 group-hover:text-indigo-600 transition-colors" />
            <span className="text-xs font-bold text-stone-700 group-hover:text-indigo-700">
              {selectedFile ? selectedFile.name : "點擊或拖曳選擇新版 .glb 檔案"}
            </span>
            <span className="text-[11px] text-stone-400">
              {selectedFile
                ? `檔案大小: ${(selectedFile.size / 1024).toFixed(1)} KB`
                : "僅支援標準 glTF 二進位模型檔案 (.glb，上限 100MB)"}
            </span>
          </label>

          <button
            onClick={handleUploadModel}
            disabled={!selectedFile || isUploading}
            className="px-6 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all shrink-0 sm:w-56"
          >
            {isUploading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>正在上傳覆寫...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>上傳並更新伺服器檔案</span>
              </>
            )}
          </button>
        </div>

        <p className="text-[11px] text-stone-400 leading-relaxed border-t border-stone-100 pt-3">
          提示：上傳後系統會即時覆寫前端資源目錄中的模型檔案，瀏覽器刷新後即可呈現全新館舍外觀。為確保 3D 地圖互動搜尋正常，請確認 Blender 中的物件名稱（Object Name）與 <code className="font-mono text-stone-600">buildings.json</code> 中的建築 ID 相符。
        </p>
      </div>

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
          {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
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

export default function AdminDashboardPage() {
  return (
    <AdminAuthGuard>
      <DashboardContent />
    </AdminAuthGuard>
  );
}
