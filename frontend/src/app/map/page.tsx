"use client";

import { Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { MapPin, X, BookOpen, Users, Coffee, RotateCcw } from "lucide-react";
import { useMapStore } from "@/store/useMapStore";
import { exploreApi } from "@/lib/api";

const CampusScene = dynamic(
  () => import("@/components/three/CampusScene").then((mod) => mod.CampusScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[#090d16] text-cyan-400 text-sm">
        載入中大純色 3D 校園沙盤...
      </div>
    ),
  }
);

function MapContent() {
  const searchParams = useSearchParams();
  const initialLoc = searchParams.get("loc");

  const {
    selectedBuildingId,
    selectBuilding,
    isDrawerOpen,
    closeDrawer,
    filterCategory,
    setFilterCategory,
    resetCamera,
  } = useMapStore();

  const [buildingDetail, setBuildingDetail] = useState<any | null>(null);
  const [allLocations, setAllLocations] = useState<any[]>([]);

  useEffect(() => {
    exploreApi.getLocations().then(setAllLocations).catch(console.error);
  }, []);

  useEffect(() => {
    if (initialLoc) {
      selectBuilding(initialLoc);
    }
  }, [initialLoc, selectBuilding]);

  useEffect(() => {
    if (selectedBuildingId) {
      exploreApi
        .getLocationDetail(selectedBuildingId)
        .then(setBuildingDetail)
        .catch(console.error);
    } else {
      setBuildingDetail(null);
    }
  }, [selectedBuildingId]);

  const categories = [
    { key: null, label: "全部建築" },
    { key: "academic", label: "教學館舍" },
    { key: "dorm", label: "學生宿舍" },
    { key: "dining", label: "生活餐飲" },
    { key: "leisure", label: "運動休閒" },
  ];

  return (
    <div className="relative flex-1 w-full h-[calc(100vh-61px)] overflow-hidden bg-[#0c111d]">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 max-w-[90vw]">
        <div className="glass-panel p-1.5 rounded-2xl flex items-center gap-1 border border-white/10">
          {categories.map((cat) => (
            <button
              key={cat.key || "all"}
              onClick={() => setFilterCategory(cat.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterCategory === cat.key
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-gray-300 hover:text-white hover:bg-white/5"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Location Dropdown Quick Jump */}
        <select
          value={selectedBuildingId || ""}
          onChange={(e) => {
            const locId = e.target.value;
            if (locId) selectBuilding(locId);
          }}
          className="glass-panel px-3 py-2 rounded-xl text-xs text-white border border-white/10 bg-[#121826]/90 focus:outline-none focus:border-cyan-400"
        >
          <option value="">快速導覽館舍節點...</option>
          {allLocations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </select>

        <button
          onClick={resetCamera}
          className="glass-panel p-2 rounded-xl text-gray-300 hover:text-white border border-white/10 hover:bg-white/10 cursor-pointer"
          title="重置視角"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* 3D Scene */}
      <div className="w-full h-full">
        <CampusScene />
      </div>

      {/* Right Slideout Drawer */}
      {isDrawerOpen && buildingDetail && (
        <div className="absolute top-0 right-0 z-30 w-full sm:w-[420px] h-full glass-panel-glow border-l border-white/15 p-6 overflow-y-auto animate-in slide-in-from-right duration-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-500/20 text-cyan-300 border border-blue-500/30">
                {buildingDetail.category}
              </span>
              <button
                onClick={closeDrawer}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-cyan-400" />
              {buildingDetail.name}
            </h2>

            <p className="text-xs text-cyan-200/90 mb-4 font-medium">
              {buildingDetail.short_desc}
            </p>

            <div className="glass-panel p-4 rounded-xl mb-6 bg-white/5 border border-white/5 text-xs text-gray-300 leading-relaxed">
              {buildingDetail.full_content}
            </div>

            {/* Courses held here */}
            {buildingDetail.courses?.length > 0 && (
              <div className="mb-5">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5 mb-2">
                  <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                  在此開課之課程 ({buildingDetail.courses.length})
                </h3>
                <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
                  {buildingDetail.courses.map((c: any) => (
                    <div
                      key={c.id}
                      className="p-2 rounded-lg bg-white/5 text-xs flex items-center justify-between"
                    >
                      <span className="font-semibold text-gray-200">{c.course_name}</span>
                      <span className="text-[10px] text-gray-400 font-mono">{c.raw_schedule}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Clubs stationed here */}
            {buildingDetail.activities?.length > 0 && (
              <div className="mb-5">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5 mb-2">
                  <Users className="w-3.5 h-3.5 text-purple-400" />
                  常態活動社團 ({buildingDetail.activities.length})
                </h3>
                <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto">
                  {buildingDetail.activities.map((a: any) => (
                    <div key={a.id} className="p-2 rounded-lg bg-white/5 text-xs">
                      <span className="font-semibold text-purple-300 block">{a.name}</span>
                      <span className="text-[11px] text-gray-400 line-clamp-1">{a.full_intro}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nearby Life Info */}
            {buildingDetail.life_infos?.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5 mb-2">
                  <Coffee className="w-3.5 h-3.5 text-amber-400" />
                  周遭餐飲生活指南
                </h3>
                {buildingDetail.life_infos.map((info: any) => (
                  <div key={info.id} className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs">
                    <span className="font-bold text-amber-300 block mb-1">{info.title}</span>
                    <p className="text-[11px] text-gray-300 line-clamp-2">{info.game_snippet}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center text-cyan-400 text-sm bg-[#0c111d]">
          載入 3D 地圖中...
        </div>
      }
    >
      <MapContent />
    </Suspense>
  );
}
