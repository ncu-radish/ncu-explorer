"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  MapPin,
  ExternalLink,
  X,
  Sparkles,
  Grid,
  List,
  Building2,
  Calendar,
  Share2,
  Check,
  Globe,
  Compass,
  ArrowRight,
  Filter,
} from "lucide-react";
import { exploreApi, ClubItem, ClubCategorySummary } from "@/lib/api";

const categoryMeta: Record<
  string,
  {
    label: string;
    badgeBg: string;
    textCol: string;
    borderCol: string;
    gradient: string;
  }
> = {
  "學術性": {
    label: "學術性",
    badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
    textCol: "text-blue-600",
    borderCol: "border-blue-500/30",
    gradient: "from-blue-600 to-indigo-700",
  },
  "康樂性": {
    label: "康樂性",
    badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
    textCol: "text-rose-600",
    borderCol: "border-rose-500/30",
    gradient: "from-rose-500 to-pink-600",
  },
  "體育性": {
    label: "體育性",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    textCol: "text-emerald-600",
    borderCol: "border-emerald-500/30",
    gradient: "from-emerald-500 to-teal-600",
  },
  "服務性": {
    label: "服務性",
    badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
    textCol: "text-amber-600",
    borderCol: "border-amber-500/30",
    gradient: "from-amber-500 to-orange-600",
  },
  "聯誼性": {
    label: "聯誼性",
    badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
    textCol: "text-purple-600",
    borderCol: "border-purple-500/30",
    gradient: "from-purple-500 to-indigo-600",
  },
  "系學會": {
    label: "系學會",
    badgeBg: "bg-sky-50 text-sky-700 border-sky-200",
    textCol: "text-sky-600",
    borderCol: "border-sky-500/30",
    gradient: "from-sky-600 to-cyan-600",
  },
};

const defaultMeta = {
  label: "綜合組織",
  badgeBg: "bg-stone-50 text-stone-700 border-stone-200",
  textCol: "text-stone-600",
  borderCol: "border-stone-500/30",
  gradient: "from-stone-600 to-slate-700",
};

interface ClubExplorerViewProps {
  isEmbedded?: boolean;
}

export function ClubExplorerView({ isEmbedded = false }: ClubExplorerViewProps) {
  const [clubs, setClubs] = useState<ClubItem[]>([]);
  const [categories, setCategories] = useState<ClubCategorySummary[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("全部");
  const [keyword, setKeyword] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("全部");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeModalClub, setActiveModalClub] = useState<ClubItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [allClubs, cats] = await Promise.all([
          exploreApi.getClubs(),
          exploreApi.getClubCategories(),
        ]);
        setClubs(allClubs);
        setCategories(cats);
      } catch (err) {
        console.error("Failed to fetch club data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Distinct locations for quick filtering
  const locationOptions = useMemo(() => {
    const locs = new Set<string>();
    clubs.forEach((c) => {
      if (c.location_text) {
        // Normalize some common locations
        if (c.location_text.includes("據德")) locs.add("據德樓");
        else if (c.location_text.includes("游藝")) locs.add("游藝館");
        else if (c.location_text.includes("夢工廠")) locs.add("夢工廠");
        else if (c.location_text.includes("館") || c.location_text.includes("系辦"))
          locs.add("各學院系館");
        else locs.add(c.location_text.trim());
      }
    });
    return ["全部", "據德樓", "游藝館", "夢工廠", "各學院系館"];
  }, [clubs]);

  // Filtered Clubs
  const filteredClubs = useMemo(() => {
    return clubs.filter((c) => {
      // Category filter
      if (selectedCategory !== "全部") {
        if (c.category !== selectedCategory && c.type !== selectedCategory) {
          return false;
        }
      }

      // Location filter
      if (selectedLocation !== "全部") {
        if (!c.location_text) return false;
        if (selectedLocation === "各學院系館") {
          if (
            !c.location_text.includes("館") &&
            !c.location_text.includes("系辦") &&
            !c.location_text.includes("工程") &&
            !c.location_text.includes("管理")
          ) {
            return false;
          }
        } else if (!c.location_text.includes(selectedLocation)) {
          return false;
        }
      }

      // Keyword search
      if (keyword.trim()) {
        const kw = keyword.trim().toLowerCase();
        const matchName = c.name.toLowerCase().includes(kw);
        const matchEng = c.english_name?.toLowerCase().includes(kw);
        const matchIntro = c.full_intro?.toLowerCase().includes(kw);
        const matchLoc = c.location_text?.toLowerCase().includes(kw);
        if (!matchName && !matchEng && !matchIntro && !matchLoc) {
          return false;
        }
      }

      return true;
    });
  }, [clubs, selectedCategory, selectedLocation, keyword]);

  // Copy handler
  const handleCopy = (club: ClubItem) => {
    const shareText = `中央大學社團【${club.name}】（${club.category || club.type}）\n${club.full_intro?.slice(0, 80)}...\n社辦地點：${club.location_text || "請洽社團粉專"}`;
    navigator.clipboard.writeText(shareText);
    setCopiedId(club.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const totalCount = clubs.length;

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Hero Header */}
      {!isEmbedded && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-slate-900 to-rose-950 p-6 md:p-10 text-white shadow-xl border border-stone-800">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5 text-rose-400 animate-spin-slow" />
                <span>NCU CLUBS & STUDENT ORGANIZATIONS</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">
                中央大學學生社團探索中心
              </h1>
              <p className="text-sm md:text-base text-stone-300 leading-relaxed">
                全校收錄 117 個立案社團、學術研究會、藝文康樂、體育競技與系所自治會。
                尋找你的大學熱情所在，拓展跨域人脈與豐富課外時光！
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-white/5 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/10 shrink-0">
              <div className="text-center px-2">
                <div className="text-xl sm:text-2xl font-black text-rose-400">117</div>
                <div className="text-[11px] text-stone-400 font-medium">活躍社團</div>
              </div>
              <div className="text-center px-2 border-x border-white/10">
                <div className="text-xl sm:text-2xl font-black text-cyan-400">6 大</div>
                <div className="text-[11px] text-stone-400 font-medium">多元面向</div>
              </div>
              <div className="text-center px-2">
                <div className="text-xl sm:text-2xl font-black text-amber-400">27</div>
                <div className="text-[11px] text-stone-400 font-medium">系所學會</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Categories Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-2 shadow-xs flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setSelectedCategory("全部")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${selectedCategory === "全部"
            ? "bg-rose-600 text-white shadow-sm"
            : "text-stone-600 hover:bg-stone-100"
            }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>全部社團</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedCategory === "全部" ? "bg-white/20 text-white" : "bg-stone-100 text-stone-500"
              }`}
          >
            {totalCount}
          </span>
        </button>

        {categories.map((cat) => {
          const meta = categoryMeta[cat.category] || defaultMeta;
          const isSelected = selectedCategory === cat.category;

          return (
            <button
              key={cat.category}
              onClick={() => setSelectedCategory(cat.category)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${isSelected
                ? "bg-stone-900 text-white shadow-sm"
                : "text-stone-600 hover:bg-stone-100"
                }`}
            >
              <span>{cat.category}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? "bg-white/20 text-white" : meta.badgeBg
                  }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Location Controls */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Keyword Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜尋社團名稱、英文縮寫、社辦或簡介關鍵字（例：吉他、資管、據德樓）..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-stone-800 placeholder-stone-400"
          />
          {keyword && (
            <button
              onClick={() => setKeyword("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters Group */}
        <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
          {/* Location Chip Dropdown / Selector */}
          <div className="flex items-center gap-1.5 text-xs text-stone-600 bg-stone-50 px-2.5 py-1.5 rounded-xl border border-stone-200">
            <Building2 className="w-3.5 h-3.5 text-stone-500" />
            <span className="text-[11px] font-medium text-stone-500">據點：</span>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="bg-transparent text-xs font-semibold text-stone-800 focus:outline-none cursor-pointer"
            >
              {locationOptions.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${viewMode === "grid" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500 hover:text-stone-700"
                }`}
              title="卡片網格視圖"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${viewMode === "list" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500 hover:text-stone-700"
                }`}
              title="簡明列表視圖"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Stats Notice */}
      <div className="flex items-center justify-between text-xs text-stone-500 px-1">
        <span>
          顯示符合條件的 <strong className="text-stone-900">{filteredClubs.length}</strong> 個社團組織
          {selectedCategory !== "全部" && `（分類：${selectedCategory}）`}
          {selectedLocation !== "全部" && `（社辦地點：${selectedLocation}）`}
          {keyword && `（搜尋：“${keyword}”）`}
        </span>
        {(selectedCategory !== "全部" || selectedLocation !== "全部" || keyword) && (
          <button
            onClick={() => {
              setSelectedCategory("全部");
              setSelectedLocation("全部");
              setKeyword("");
            }}
            className="text-rose-600 hover:underline cursor-pointer flex items-center gap-1 font-medium"
          >
            <X className="w-3.5 h-3.5" /> 重設所有篩選
          </button>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-stone-400">
          <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium">正在載入中央大學社團資料庫...</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredClubs.length === 0 && (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-1">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-stone-900">找不到符合的社團組織</h3>
          <p className="text-xs text-stone-500 max-w-sm leading-relaxed">
            未搜尋到符合目前篩選關鍵字「{keyword}」或所選地點的社團。請嘗試更換關鍵字或切換至其他分類！
          </p>
          <button
            onClick={() => {
              setSelectedCategory("全部");
              setSelectedLocation("全部");
              setKeyword("");
            }}
            className="mt-2 px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors cursor-pointer"
          >
            清除篩選條件
          </button>
        </div>
      )}

      {/* GRID VIEW */}
      {!isLoading && viewMode === "grid" && filteredClubs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClubs.map((club) => {
            const meta = categoryMeta[club.category || club.type] || defaultMeta;

            return (
              <div
                key={club.id}
                className="group bg-white rounded-2xl border border-stone-200 hover:border-rose-300 hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Card Media Header */}
                  <div className="relative h-40 bg-stone-100 overflow-hidden border-b border-stone-100">
                    {club.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={club.image_url}
                        alt={club.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          // Fallback to placeholder gradient if image cannot be loaded
                          (e.currentTarget as HTMLElement).style.display = "none";
                          const fallback = e.currentTarget.parentElement?.querySelector(".fallback-bg");
                          if (fallback) fallback.classList.remove("hidden");
                        }}
                      />
                    ) : null}

                    {/* Fallback Graphic Banner */}
                    <div
                      className={`fallback-bg ${club.image_url ? "hidden" : ""
                        } w-full h-full bg-gradient-to-br ${meta.gradient
                        } flex flex-col items-center justify-center p-4 text-white text-center relative`}
                    >
                      <span className="text-3xl font-black tracking-tight opacity-25 uppercase font-mono">
                        {club.english_name || club.name.slice(0, 4)}
                      </span>
                      <span className="text-xs font-medium text-white/90 mt-1">國立中央大學</span>
                    </div>

                    {/* Category Pill Tag Overlay */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs border backdrop-blur-md ${meta.badgeBg}`}
                      >
                        {club.category || club.type}
                      </span>
                      {club.english_name && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-md">
                          {club.english_name}
                        </span>
                      )}
                    </div>

                    {/* Location Badge Overlay */}
                    {club.location_text && (
                      <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-stone-900/80 backdrop-blur-md text-white text-[10px] font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-rose-400" />
                        <span>{club.location_text}</span>
                      </div>
                    )}
                  </div>

                  {/* Body Info */}
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-base font-bold text-stone-900 group-hover:text-rose-600 transition-colors line-clamp-1">
                        {club.name}
                      </h3>
                    </div>

                    <p className="text-xs text-stone-600 leading-relaxed mb-4 line-clamp-3">
                      {club.full_intro || "暫無社團詳細自介，歡迎透過官方粉專或招新管道深入瞭解！"}
                    </p>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-4 py-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {club.website_url ? (
                      <a
                        href={club.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 hover:text-rose-900 hover:underline"
                        title="前往社團網站或官方粉專"
                      >
                        <Globe className="w-3 h-3" />
                        <span>官方網站</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-stone-400">活動中心交流</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopy(club)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
                      title="複製社團簡介"
                    >
                      {copiedId === club.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Share2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => setActiveModalClub(club)}
                      className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-rose-600 text-white font-semibold text-[11px] transition-colors cursor-pointer"
                    >
                      詳細資訊
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LIST VIEW */}
      {!isLoading && viewMode === "list" && filteredClubs.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold text-[11px]">
                  <th className="py-3 px-4">社團名稱</th>
                  <th className="py-3 px-4">類別</th>
                  <th className="py-3 px-4">英文名稱 / 簡稱</th>
                  <th className="py-3 px-4">社辦地點</th>
                  <th className="py-3 px-4">常態時段</th>
                  <th className="py-3 px-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredClubs.map((club) => {
                  const meta = categoryMeta[club.category || club.type] || defaultMeta;

                  return (
                    <tr
                      key={club.id}
                      className="hover:bg-stone-50/70 transition-colors group cursor-pointer"
                      onClick={() => setActiveModalClub(club)}
                    >
                      <td className="py-3.5 px-4 font-bold text-stone-900 group-hover:text-rose-600">
                        {club.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${meta.badgeBg}`}>
                          {club.category || club.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-stone-500">
                        {club.english_name || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-stone-600">
                        {club.location_text ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-rose-500" />
                            {club.location_text}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-stone-500">
                        週{["一", "二", "三", "四", "五", "六", "日"][club.day_of_week - 1]} 晚間
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setActiveModalClub(club)}
                          className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium text-[11px] transition-colors"
                        >
                          查看
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL MODAL DIALOG */}
      {activeModalClub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header Media */}
            <div className="relative h-48 bg-stone-900 text-white shrink-0 overflow-hidden">
              {activeModalClub.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeModalClub.image_url}
                  alt={activeModalClub.name}
                  className="w-full h-full object-cover opacity-85"
                />
              ) : (
                <div
                  className={`w-full h-full bg-gradient-to-r ${(categoryMeta[activeModalClub.category || activeModalClub.type] || defaultMeta).gradient
                    } flex flex-col items-center justify-center p-6 text-center`}
                >
                  <span className="text-4xl font-extrabold tracking-tight font-mono opacity-30">
                    {activeModalClub.english_name || activeModalClub.name}
                  </span>
                  <span className="text-sm font-medium mt-1">國立中央大學學生社團</span>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={() => setActiveModalClub(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Title & Category over image */}
              <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-stone-950 via-stone-950/80 to-transparent">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${(categoryMeta[activeModalClub.category || activeModalClub.type] || defaultMeta).badgeBg
                      }`}
                  >
                    {activeModalClub.category || activeModalClub.type}
                  </span>
                  {activeModalClub.english_name && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-white/20 text-white backdrop-blur-md">
                      {activeModalClub.english_name}
                    </span>
                  )}
                  <span className="text-xs text-stone-300">
                    週{["一", "二", "三", "四", "五", "六", "日"][activeModalClub.day_of_week - 1]}常態活動
                  </span>
                </div>
                <h2 className="text-2xl font-black text-white">{activeModalClub.name}</h2>
              </div>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-stone-700 text-xs sm:text-sm">
              {/* Location & Links Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                <div className="flex items-center gap-2 text-stone-700">
                  <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
                  <div>
                    <div className="text-[10px] text-stone-400 font-medium">社辦地點</div>
                    <div className="font-semibold text-xs text-stone-900">
                      {activeModalClub.location_text || "未登記專屬社辦（於活動中心借用）"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-stone-700">
                  <Globe className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <div className="text-[10px] text-stone-400 font-medium">官方網站</div>
                    {activeModalClub.website_url ? (
                      <a
                        href={activeModalClub.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        官方網站連結 <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <div className="font-semibold text-xs text-stone-400">未填寫社團網站</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Chinese Description */}
              <div>
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-rose-600" />
                  社團簡介與特色亮點
                </h4>
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-stone-700 leading-relaxed whitespace-pre-line text-xs">
                  {activeModalClub.full_intro || "暫無詳細自介內容。"}
                </div>
              </div>

              {/* English Description (if available) */}
              {activeModalClub.english_intro && (
                <div>
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-indigo-600" />
                    English Overview
                  </h4>
                  <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-stone-600 leading-relaxed whitespace-pre-line text-xs">
                    {activeModalClub.english_intro}
                  </div>
                </div>
              )}

              {/* 3D Map & Simulator Action Tips */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-rose-900 text-xs">想在大學生活模擬器中體驗？</div>
                  <div className="text-[11px] text-rose-700 mt-0.5">
                    在「NCU 生活模擬器」的新增人物中輸入【{activeModalClub.name}】，AI 將安排專屬社課劇情！
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href="/simulator"
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center gap-1 shadow-xs transition-colors"
                  >
                    前往模擬器 <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between shrink-0">
              <button
                onClick={() => handleCopy(activeModalClub)}
                className="flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 font-medium cursor-pointer"
              >
                {copiedId === activeModalClub.id ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-600 font-semibold">已複製簡介至剪貼簿！</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>分享社團資訊</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setActiveModalClub(null)}
                className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                關閉視窗
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
