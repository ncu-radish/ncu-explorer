"use client";

import { Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MapPin, X, BookOpen, Users, Coffee, RotateCcw, ArrowLeft } from "lucide-react";
import { useMapStore } from "@/store/useMapStore";
import { exploreApi } from "@/lib/api";

const CampusScene = dynamic(
  () => import("@/components/three/CampusScene").then((mod) => mod.CampusScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[#090d16] text-cyan-400 text-sm">
        載入 3D 校園地圖...
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
    <div className="relative flex-1 w-full h-screen overflow-hidden bg-[#FAF8F5]">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 max-w-[90vw]">
        <Link
          href="/explore"
          className="px-3 py-2 rounded-xl text-xs font-semibold bg-white text-stone-700 hover:text-stone-900 border border-stone-300 hover:bg-stone-50 flex items-center gap-1.5 transition-colors shadow-xs"
          title="回中央相關資料"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>回相關資料</span>
        </Link>

        <div className="bg-white p-1 rounded-2xl flex items-center gap-1 border border-stone-300 shadow-xs">
          {categories.map((cat) => (
            <button
              key={cat.key || "all"}
              onClick={() => setFilterCategory(cat.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterCategory === cat.key
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
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
          className="px-3 py-2 rounded-xl text-xs text-stone-800 border border-stone-300 bg-white focus:outline-none focus:border-blue-500 shadow-xs"
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
          className="p-2 rounded-xl bg-white text-stone-700 hover:text-stone-900 border border-stone-300 hover:bg-stone-50 cursor-pointer shadow-xs"
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
        <div className="absolute top-0 right-0 z-30 w-full sm:w-[420px] h-full bg-white border-l border-stone-200 shadow-xl p-6 overflow-y-auto animate-in slide-in-from-right duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-300">
                {buildingDetail.category}
              </span>
              <button
                onClick={closeDrawer}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h2 className="text-2xl font-bold text-stone-900 mb-2 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              {buildingDetail.name}
            </h2>

            <p className="text-xs text-stone-600 mb-4 font-medium">
              {buildingDetail.short_desc}
            </p>

            <div className="p-4 rounded-xl mb-6 bg-stone-50 border border-stone-200 text-xs text-stone-700 leading-relaxed">
              {buildingDetail.full_content}
            </div>

            {/* Courses held here */}
            {buildingDetail.courses?.length > 0 && (
              <div className="mb-5">
                <h3 className="text-xs font-bold text-stone-900 flex items-center gap-1.5 mb-2">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  在此開課之課程 ({buildingDetail.courses.length})
                </h3>
                <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
                  {buildingDetail.courses.map((c: any) => (
                    <div
                      key={c.id}
                      className="p-2 rounded-lg bg-stone-50 border border-stone-200 text-xs flex items-center justify-between"
                    >
                      <span className="font-semibold text-stone-800">{c.course_name}</span>
                      <span className="text-[10px] text-stone-500 font-mono">{c.raw_schedule}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Clubs stationed here */}
            {buildingDetail.activities?.length > 0 && (
              <div className="mb-5">
                <h3 className="text-xs font-bold text-stone-900 flex items-center gap-1.5 mb-2">
                  <Users className="w-3.5 h-3.5 text-purple-600" />
                  常態活動社團 ({buildingDetail.activities.length})
                </h3>
                <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto">
                  {buildingDetail.activities.map((a: any) => (
                    <div key={a.id} className="p-2 rounded-lg bg-stone-50 border border-stone-200 text-xs">
                      <span className="font-semibold text-purple-700 block">{a.name}</span>
                      <span className="text-[11px] text-stone-500 line-clamp-1">{a.full_intro}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nearby Life Info */}
            {buildingDetail.life_infos?.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-stone-900 flex items-center gap-1.5 mb-2">
                  <Coffee className="w-3.5 h-3.5 text-amber-600" />
                  周遭餐飲生活指南
                </h3>
                {buildingDetail.life_infos.map((info: any) => (
                  <div key={info.id} className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs">
                    <span className="font-bold text-amber-800 block mb-1">{info.title}</span>
                    <p className="text-[11px] text-stone-600 line-clamp-2">{info.game_snippet}</p>
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
        <div className="flex-1 flex items-center justify-center text-stone-600 text-sm bg-[#FAF8F5]">
          載入 3D 地圖中...
        </div>
      }
    >
      <MapContent />
    </Suspense>
  );
}
