"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  X,
  MapPin,
  Building2,
  RotateCcw,
  ArrowLeft,
  ChevronRight,
  BookOpen,
  Home,
  Utensils,
  Trophy,
  Landmark,
  Layers,
  Info,
  Bike,
  Route as RouteIcon,
  Bus,
  Trees,
} from "lucide-react";
import { useMapStore } from "@/store/useMapStore";
import { exploreApi, Building } from "@/lib/api";

const CampusScene = dynamic(
  () => import("@/components/three/CampusScene").then((mod) => mod.CampusScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#1c2029] text-stone-300 gap-3">
        <div className="w-8 h-8 border-3 border-stone-300 border-t-violet-600 rounded-full animate-spin" />
        <span className="text-sm font-medium tracking-wide">載入中央大學 3D 校園地圖...</span>
      </div>
    ),
  }
);

const CATEGORIES = [
  { key: "all", label: "全部", icon: Layers },
  { key: "teaching", label: "教學館舍", icon: BookOpen },
  { key: "dorm", label: "學生宿舍", icon: Home },
  { key: "function", label: "行政功能", icon: Landmark },
  { key: "sport", label: "運動場館", icon: Trophy },
  { key: "restaurant", label: "生活餐飲", icon: Utensils },
  { key: "youbike", label: "YouBike", icon: Bike },
  { key: "bus", label: "公車站", icon: Bus },
  { key: "view", label: "校園景觀", icon: Trees },
];

function CategoryBadge({ category }: { category?: string | null }) {
  let label = "校園館舍";
  switch (category) {
    case "teaching":
      label = "教學館舍";
      break;
    case "dorm":
      label = "學生宿舍";
      break;
    case "function":
      label = "行政功能";
      break;
    case "sport":
      label = "運動場館";
      break;
    case "restaurant":
      label = "生活餐飲";
      break;
    case "youbike":
      label = "YouBike";
      break;
    case "bus":
      label = "公車站";
      break;
    case "view":
      label = "校園景觀";
      break;
    default:
      label = "校園館舍";
      break;
  }
  return (
    <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200 font-medium">
      {label}
    </span>
  );
}

function MapContent() {
  const searchParams = useSearchParams();
  const initialBldgId = searchParams.get("bldg") || searchParams.get("loc");

  const {
    selectedBuildingId,
    selectBuilding,
    hoveredBuildingId,
    setHoveredBuilding,
    resetCamera,
    routeOriginId,
    route,
    setRouteOrigin,
    setRoute,
  } = useMapStore();

  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [allBuildings, setAllBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBuildingDetail, setSelectedBuildingDetail] = useState<Building | null>(null);

  const listContainerRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLDivElement>(null);

  // Fetch all buildings once on mount so 3D map always has complete building registry
  useEffect(() => {
    exploreApi.getBuildings().then(setAllBuildings).catch(console.error);
  }, []);

  // Fetch buildings from backend API filtered by query and category for the sidebar list
  const fetchBuildings = async (q?: string, cat?: string) => {
    try {
      setLoading(true);
      const data = await exploreApi.getBuildings({
        q: q || undefined,
        category: cat && cat !== "all" ? cat : undefined,
      });
      setBuildings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings(searchQuery, selectedCategory);
  }, [selectedCategory]);

  // Initial selection from URL params
  useEffect(() => {
    if (initialBldgId) {
      selectBuilding(initialBldgId);
    }
  }, [initialBldgId]);

  // Fetch full details of the currently selected building
  useEffect(() => {
    if (!selectedBuildingId) {
      setSelectedBuildingDetail(null);
      return;
    }

    const found =
      allBuildings.find((b) => b.id === selectedBuildingId) ||
      buildings.find((b) => b.id === selectedBuildingId);
    if (found) {
      setSelectedBuildingDetail(found);
    } else {
      exploreApi
        .getBuildingDetail(selectedBuildingId)
        .then(setSelectedBuildingDetail)
        .catch(() => setSelectedBuildingDetail(null));
    }
  }, [selectedBuildingId, allBuildings, buildings]);

  // Scroll active building card into view in the list
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedBuildingId]);

  // Debounced search handler
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBuildings(searchQuery, selectedCategory);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const nameOf = (id: string | null) =>
    (id && (allBuildings.find((b) => b.id === id)?.name_zh ?? id)) || "";

  const handlePlanRoute = async (toId: string) => {
    if (!routeOriginId) return;
    setRouteLoading(true);
    setRouteError(null);
    try {
      const r = await exploreApi.getRoute(routeOriginId, toId);
      setRoute({ fromId: r.from_id, toId: r.to_id, distance: r.distance, path: r.path });
    } catch (err) {
      console.error(err);
      setRoute(null);
      setRouteError("找不到這兩處之間的路線");
    } finally {
      setRouteLoading(false);
    }
  };

  const clearRoute = () => {
    setRoute(null);
    setRouteOrigin(null);
    setRouteError(null);
  };

  const handleSelectBuilding = (id: string) => {
    selectBuilding(id);
  };

  return (
    <div className="flex w-full h-screen overflow-hidden bg-[#faf8ff]">
      {/* ================= LEFT SIDEBAR: Search & Building List ================= */}
      <aside className="w-full md:w-[440px] lg:w-[480px] h-full flex flex-col bg-white border-r border-stone-200 z-10 shrink-0 shadow-sm">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-stone-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-50 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>回到中大資訊</span>
            </Link>
            <span className="text-xs font-mono font-medium text-stone-700 bg-stone-100 px-2.5 py-1 rounded-md border border-stone-200">
              {buildings.length} 棟館舍
            </span>
          </div>

          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-stone-900 leading-tight">NCU 3D 校園地圖與館舍設施</h1>
              <p className="text-xs text-stone-600">中央大學 3D 立體互動式館舍與建築設施導覽</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mt-3">
            <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋代號 (如 E6)、館名、系所、別名..."
              className="w-full pl-9 pr-8 py-2 text-sm bg-stone-50 border border-stone-300 rounded-xl text-stone-900 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-700 p-0.5 rounded-md hover:bg-stone-200 transition-colors"
                title="清除搜尋"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search scope hint */}
          <div className="flex items-center gap-1.5 mt-2.5 text-xs text-stone-600 overflow-x-auto whitespace-nowrap">
            <span className="font-semibold text-stone-700">支援欄位:</span>
            <span className="bg-stone-100 px-2 py-0.5 rounded-md text-stone-700 border border-stone-200">館舍名稱</span>
            <span className="bg-stone-100 px-2 py-0.5 rounded-md text-stone-700 border border-stone-200">教室代號 (E6/C2)</span>
            <span className="bg-stone-100 px-2 py-0.5 rounded-md text-stone-700 border border-stone-200">系所辦公室</span>
            <span className="bg-stone-100 px-2 py-0.5 rounded-md text-stone-700 border border-stone-200">別名 (工五/管二)</span>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? "bg-violet-600 text-white shadow-xs"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200 hover:text-stone-900 border border-stone-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Building Detail Card (Pinned when selected) */}
        {selectedBuildingDetail && (
          <div className="p-4 bg-violet-50/60 border-b border-violet-200 transition-all">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <CategoryBadge category={selectedBuildingDetail.category} />
                {selectedBuildingDetail.classroom_code && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-violet-600 text-white font-bold shadow-2xs">
                    代號: {selectedBuildingDetail.classroom_code}
                  </span>
                )}
                {selectedBuildingDetail.alias && (
                  <span className="text-xs px-2 py-0.5 rounded-md bg-white text-stone-700 border border-stone-300 font-medium">
                    別稱: {selectedBuildingDetail.alias}
                  </span>
                )}
              </div>
              <button
                onClick={() => selectBuilding(null)}
                className="text-stone-500 hover:text-stone-700 p-1 rounded-md hover:bg-stone-200/50 transition-colors"
                title="關閉詳細資訊"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h2 className="text-base font-bold text-stone-900 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-violet-600 shrink-0" />
              <span>{selectedBuildingDetail.name_zh}</span>
            </h2>

            {selectedBuildingDetail.name_en && (
              <p className="text-xs text-stone-600 font-sans mt-0.5 ml-5.5">
                {selectedBuildingDetail.name_en}
              </p>
            )}

            {/* Departments */}
            {selectedBuildingDetail.departments && selectedBuildingDetail.departments.length > 0 && (
              <div className="mt-3 ml-5.5">
                <p className="text-xs font-semibold text-stone-800 mb-1">所屬系所與單位：</p>
                <div className="flex flex-wrap gap-1">
                  {selectedBuildingDetail.departments.map((dept, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-0.5 bg-white text-stone-700 rounded-md border border-stone-200 shadow-2xs font-medium"
                    >
                      {dept}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {selectedBuildingDetail.description && (
              <div className="mt-3 ml-5.5 text-sm text-stone-700 leading-relaxed max-h-36 overflow-y-auto pr-1">
                <div
                  className="prose-content"
                  dangerouslySetInnerHTML={{ __html: selectedBuildingDetail.description }}
                />
              </div>
            )}

            {/* Route planning */}
            <div className="mt-3 ml-5.5 flex flex-wrap items-center gap-2">
              {routeOriginId !== selectedBuildingDetail.id && (
                <button
                  onClick={() => {
                    setRoute(null);
                    setRouteError(null);
                    setRouteOrigin(selectedBuildingDetail.id);
                  }}
                  className="text-xs font-semibold px-2.5 py-1 rounded-md border border-violet-300 text-violet-700 bg-white hover:bg-violet-50 cursor-pointer"
                >
                  設為路線起點
                </button>
              )}
              {routeOriginId && routeOriginId !== selectedBuildingDetail.id && (
                <button
                  onClick={() => handlePlanRoute(selectedBuildingDetail.id)}
                  disabled={routeLoading}
                  className="text-xs font-semibold px-2.5 py-1 rounded-md bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60 flex items-center gap-1 cursor-pointer"
                >
                  <RouteIcon className="w-3.5 h-3.5" />
                  {routeLoading ? "規劃中..." : `從${nameOf(routeOriginId)}到這裡`}
                </button>
              )}
              {routeOriginId === selectedBuildingDetail.id && (
                <span className="text-xs text-violet-700 font-medium">
                  已設為起點，請選擇終點建築
                </span>
              )}
            </div>
            {routeError && <p className="mt-1 ml-5.5 text-xs text-red-600">{routeError}</p>}

            <div className="mt-3 ml-5.5 flex items-center gap-2">
              <button
                onClick={() => selectBuilding(selectedBuildingDetail.id)}
                className="text-xs font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                重新聚焦視角
              </button>
              <span className="text-stone-500">|</span>
              <span className="text-xs text-stone-500 font-mono">
                ID: {selectedBuildingDetail.id}
              </span>
            </div>
          </div>
        )}

        {/* Scrollable Building List */}
        <div
          ref={listContainerRef}
          className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-stone-100"
        >
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-stone-500 gap-2">
              <div className="w-6 h-6 border-2 border-stone-300 border-t-violet-600 rounded-full animate-spin" />
              <span className="text-xs">檢索建築物資料...</span>
            </div>
          ) : buildings.length === 0 ? (
            <div className="py-16 text-center text-stone-500">
              <Building2 className="w-8 h-8 mx-auto mb-2 text-stone-500" />
              <p className="text-sm font-medium text-stone-700">找不到符合條件的建築物</p>
              <p className="text-xs text-stone-500 mt-1">
                請嘗試搜尋代號 (如 E6)、系所或別名 (如工五)
              </p>
            </div>
          ) : (
            buildings.map((bldg) => {
              const isSelected = bldg.id === selectedBuildingId;
              const isHovered = bldg.id === hoveredBuildingId;

              return (
                <div
                  key={bldg.id}
                  ref={isSelected ? activeItemRef : null}
                  onClick={() => handleSelectBuilding(bldg.id)}
                  onMouseEnter={() => setHoveredBuilding(bldg.id)}
                  onMouseLeave={() => setHoveredBuilding(null)}
                  className={`p-3 rounded-xl transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-violet-50/80 border-violet-500 shadow-xs ring-1 ring-violet-500"
                      : isHovered
                      ? "bg-stone-50 border-stone-300"
                      : "bg-white hover:bg-stone-50 border-stone-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <CategoryBadge category={bldg.category} />
                        {bldg.classroom_code && (
                          <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-800 border border-stone-300">
                            {bldg.classroom_code}
                          </span>
                        )}
                        {bldg.alias && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
                            {bldg.alias}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-stone-900 truncate">
                        {bldg.name_zh}
                      </h3>

                      {bldg.name_en && (
                        <p className="text-xs text-stone-500 truncate mt-0.5">
                          {bldg.name_en}
                        </p>
                      )}

                      {/* Department snippet */}
                      {bldg.departments && bldg.departments.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {bldg.departments.slice(0, 2).map((dept, idx) => (
                            <span
                              key={idx}
                              className="text-xs text-stone-700 bg-stone-100 px-2 py-0.5 rounded border border-stone-200 truncate max-w-[180px]"
                            >
                              {dept}
                            </span>
                          ))}
                          {bldg.departments.length > 2 && (
                            <span className="text-xs text-stone-500 self-center">
                              +{bldg.departments.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <ChevronRight
                      className={`w-4 h-4 mt-2 shrink-0 transition-transform ${
                        isSelected ? "text-violet-600 translate-x-0.5" : "text-stone-500"
                      }`}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ================= RIGHT 3D CANVAS ================= */}
      <main className="flex-1 h-full relative overflow-hidden bg-[#1c2029]">
        {route && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-stone-900/90 text-white text-sm px-4 py-2 rounded-xl border border-violet-400/60 shadow-lg">
            <RouteIcon className="w-4 h-4 text-violet-300 shrink-0" />
            <span className="font-medium">
              {nameOf(route.fromId)} → {nameOf(route.toId)}
            </span>
            <span className="font-mono text-violet-200">約 {Math.round(route.distance)} 公尺</span>
            <button
              onClick={clearRoute}
              className="p-1 rounded-md hover:bg-white/10 cursor-pointer"
              title="清除路線"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {/* Top Control Bar Overlay */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            onClick={resetCamera}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/95 backdrop-blur-xs text-stone-700 hover:text-stone-900 border border-stone-300 hover:bg-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="重置全景鳥瞰視角"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>全景鳥瞰</span>
          </button>
        </div>

        {/* 3D Scene Viewport */}
        <div className="w-full h-full">
          <CampusScene
            buildings={allBuildings.length > 0 ? allBuildings : buildings}
            onSelectBuilding={handleSelectBuilding}
          />
        </div>

        {/* Bottom Legend Overlay */}
        <div className="absolute bottom-4 right-4 z-20 bg-white/95 backdrop-blur-xs p-3.5 rounded-2xl border border-stone-300 shadow-sm text-xs hidden sm:block">
          <div className="font-semibold text-stone-800 text-xs mb-2 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-stone-500" />
            <span>3D 地圖圖例與操作</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-stone-700">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-600" />
              <span>點選目標館舍</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-stone-300 border border-stone-400" />
              <span>一般建築幾何</span>
            </div>
          </div>
          <p className="text-xs text-stone-500 mt-2 border-t border-stone-200 pt-1.5">
            滑鼠左鍵旋轉 ‧ 右鍵平移 ‧ 滾輪縮放視角
          </p>
        </div>
      </main>
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-screen flex items-center justify-center bg-[#faf8ff] text-stone-600 text-sm">
          載入中...
        </div>
      }
    >
      <MapContent />
    </Suspense>
  );
}
