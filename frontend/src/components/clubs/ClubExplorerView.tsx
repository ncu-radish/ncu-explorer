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
  ChevronRight,
  Globe,
  Share2,
  Check,
  Compass,
  ArrowRight,
} from "lucide-react";
import { exploreApi, ClubItem, ClubCategorySummary } from "@/lib/api";

interface CategoryStyle {
  label: string;
  rowBg: string;
  rowHover: string;
  border: string;
  badgeBg: string;
  dotColor: string;
  accentText: string;
}

const categoryStyles: Record<string, CategoryStyle> = {
  "學術性": {
    label: "學術性",
    rowBg: "bg-blue-50/45",
    rowHover: "hover:bg-blue-50/90 hover:border-blue-200",
    border: "border-blue-100/70",
    badgeBg: "bg-blue-100/70 text-blue-800 border-blue-200/60",
    dotColor: "bg-blue-500",
    accentText: "text-blue-700",
  },
  "康樂性": {
    label: "康樂性",
    rowBg: "bg-rose-50/45",
    rowHover: "hover:bg-rose-50/90 hover:border-rose-200",
    border: "border-rose-100/70",
    badgeBg: "bg-rose-100/70 text-rose-800 border-rose-200/60",
    dotColor: "bg-rose-500",
    accentText: "text-rose-700",
  },
  "體育性": {
    label: "體育性",
    rowBg: "bg-emerald-50/45",
    rowHover: "hover:bg-emerald-50/90 hover:border-emerald-200",
    border: "border-emerald-100/70",
    badgeBg: "bg-emerald-100/70 text-emerald-800 border-emerald-200/60",
    dotColor: "bg-emerald-500",
    accentText: "text-emerald-700",
  },
  "服務性": {
    label: "服務性",
    rowBg: "bg-amber-50/45",
    rowHover: "hover:bg-amber-50/90 hover:border-amber-200",
    border: "border-amber-100/70",
    badgeBg: "bg-amber-100/70 text-amber-800 border-amber-200/60",
    dotColor: "bg-amber-500",
    accentText: "text-amber-700",
  },
  "聯誼性": {
    label: "聯誼性",
    rowBg: "bg-purple-50/45",
    rowHover: "hover:bg-purple-50/90 hover:border-purple-200",
    border: "border-purple-100/70",
    badgeBg: "bg-purple-100/70 text-purple-800 border-purple-200/60",
    dotColor: "bg-purple-500",
    accentText: "text-purple-700",
  },
  "系學會": {
    label: "系學會",
    rowBg: "bg-sky-50/45",
    rowHover: "hover:bg-sky-50/90 hover:border-sky-200",
    border: "border-sky-100/70",
    badgeBg: "bg-sky-100/70 text-sky-800 border-sky-200/60",
    dotColor: "bg-sky-500",
    accentText: "text-sky-700",
  },
};

const defaultStyle: CategoryStyle = {
  label: "其它",
  rowBg: "bg-stone-50/50",
  rowHover: "hover:bg-stone-100/90 hover:border-stone-200",
  border: "border-stone-200/70",
  badgeBg: "bg-stone-100 text-stone-700 border-stone-200",
  dotColor: "bg-stone-400",
  accentText: "text-stone-700",
};

interface ClubExplorerViewProps {
  isEmbedded?: boolean;
}

export function ClubExplorerView({ isEmbedded = false }: ClubExplorerViewProps) {
  const [clubs, setClubs] = useState<ClubItem[]>([]);
  const [categories, setCategories] = useState<ClubCategorySummary[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("全部");
  const [keyword, setKeyword] = useState<string>("");
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

  // Filtered Clubs
  const filteredClubs = useMemo(() => {
    return clubs.filter((c) => {
      // Category filter
      if (selectedCategory !== "全部") {
        if (c.category !== selectedCategory && c.type !== selectedCategory) {
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
  }, [clubs, selectedCategory, keyword]);

  // Copy handler
  const handleCopy = (club: ClubItem) => {
    const shareText = `中央大學社團【${club.name}】（${club.category || club.type}）\n${club.full_intro?.slice(0, 100)}...\n社辦地點：${club.location_text || "未登記專屬社辦"}`;
    navigator.clipboard.writeText(shareText);
    setCopiedId(club.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const totalCount = clubs.length;

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Header Banner (Shown when not embedded) */}
      {!isEmbedded && (
        <div className="relative overflow-hidden rounded-2xl bg-white p-6 md:p-8 border border-stone-200/80 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 mb-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>國立中央大學學生社團組織</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
                社團活動名錄
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 mt-1">
                全校共 {totalCount} 個立案社團、學術研究會、藝文康樂、體育競賽及各系所學會
              </p>
            </div>

            {/* Category Color Legend Indicator */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-200/70">
              <span className="text-stone-400 font-medium">類別底色：</span>
              {Object.entries(categoryStyles).map(([cat, style]) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] transition-all cursor-pointer ${
                    style.badgeBg
                  } ${selectedCategory === cat ? "ring-2 ring-stone-800 ring-offset-1 font-bold" : "opacity-85 hover:opacity-100"}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${style.dotColor}`} />
                  <span>{cat}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="bg-white rounded-xl border border-stone-200 p-1.5 shadow-2xs flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setSelectedCategory("全部")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedCategory === "全部"
              ? "bg-stone-900 text-white shadow-2xs"
              : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>全部社團</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              selectedCategory === "全部" ? "bg-white/20 text-white" : "bg-stone-100 text-stone-500"
            }`}
          >
            {totalCount}
          </span>
        </button>

        {categories.map((cat) => {
          const style = categoryStyles[cat.category] || defaultStyle;
          const isSelected = selectedCategory === cat.category;

          return (
            <button
              key={cat.category}
              onClick={() => setSelectedCategory(cat.category)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? "bg-stone-900 text-white shadow-2xs"
                  : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : style.dotColor}`} />
              <span>{cat.category}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? "bg-white/20 text-white" : style.badgeBg
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Input Bar */}
      <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-2xs flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜尋社團中文名稱、英文簡稱或縮寫（例：吉他社、熱舞、NCUFCS、資管系學會）..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-stone-50/80 border border-stone-200/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400/20 focus:border-stone-400 transition-all text-stone-900 placeholder-stone-400"
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

        {/* Count Indicator */}
        <div className="text-xs text-stone-500 whitespace-nowrap hidden sm:block">
          共 <strong className="text-stone-900">{filteredClubs.length}</strong> 個社團
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-16 flex flex-col items-center justify-center gap-2.5 text-stone-400">
          <div className="w-7 h-7 border-2 border-stone-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">正在載入社團名錄...</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredClubs.length === 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center flex flex-col items-center justify-center gap-2">
          <Users className="w-8 h-8 text-stone-400 mb-1" />
          <h3 className="text-sm font-bold text-stone-800">查無符合的社團</h3>
          <p className="text-xs text-stone-500 max-w-sm">
            找不到符合關鍵字「{keyword}」的社團名稱。請嘗試縮短搜尋詞或切換其他分類。
          </p>
          <button
            onClick={() => {
              setSelectedCategory("全部");
              setKeyword("");
            }}
            className="mt-2 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium transition-colors cursor-pointer"
          >
            重設篩選
          </button>
        </div>
      )}

      {/* HORIZONTAL LIST OF CLUBS */}
      {!isLoading && filteredClubs.length > 0 && (
        <div className="flex flex-col gap-2">
          {filteredClubs.map((club) => {
            const style = categoryStyles[club.category || club.type] || defaultStyle;

            return (
              <div
                key={club.id}
                onClick={() => setActiveModalClub(club)}
                className={`w-full flex items-center justify-between px-4 py-3 sm:px-5 sm:py-3.5 rounded-xl border transition-all duration-150 cursor-pointer group ${style.rowBg} ${style.border} ${style.rowHover}`}
              >
                {/* Left: Chinese Name & English Name */}
                <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1 pr-3">
                  {/* Category Indicator Dot */}
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${style.dotColor}`}
                    title={club.category || club.type}
                  />

                  {/* Chinese Name */}
                  <span className="font-bold text-sm sm:text-base text-stone-900 group-hover:text-stone-950 truncate">
                    {club.name}
                  </span>

                  {/* English Name / Abbreviation */}
                  {club.english_name && (
                    <span className="text-xs sm:text-sm text-stone-500 font-normal truncate">
                      {club.english_name}
                    </span>
                  )}
                </div>

                {/* Right: Details Button */}
                <div className="shrink-0 flex items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveModalClub(club);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/90 hover:bg-stone-900 hover:text-white text-stone-700 font-medium text-xs border border-stone-200/80 shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>詳細資訊</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL MODAL DIALOG */}
      {activeModalClub && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setActiveModalClub(null)}
        >
          <div
            className="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-stone-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-stone-100 flex items-start justify-between gap-4 bg-stone-50/60">
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border ${
                      (categoryStyles[activeModalClub.category || activeModalClub.type] || defaultStyle).badgeBg
                    }`}
                  >
                    {activeModalClub.category || activeModalClub.type}
                  </span>
                  {activeModalClub.english_name && (
                    <span className="text-xs text-stone-500 font-medium">
                      {activeModalClub.english_name}
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
                  {activeModalClub.name}
                </h2>
              </div>

              <button
                onClick={() => setActiveModalClub(null)}
                className="w-8 h-8 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="關閉"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-stone-700 leading-relaxed">
              {/* Location & Website Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-stone-50/80 p-3.5 rounded-xl border border-stone-200/70">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] text-stone-400 font-medium">社辦地點</div>
                    <div className="font-semibold text-xs text-stone-800">
                      {activeModalClub.location_text || "未登記專屬社辦（於活動中心借用）"}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Globe className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] text-stone-400 font-medium">官方網站 / 粉絲專頁</div>
                    {activeModalClub.website_url ? (
                      <a
                        href={activeModalClub.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        前往官方網站 <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <div className="font-semibold text-xs text-stone-400">未填寫社團網站</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Chinese Description */}
              <div>
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-stone-600" />
                  社團簡介
                </h4>
                <div className="bg-stone-50/60 p-4 rounded-xl border border-stone-200/70 text-stone-700 whitespace-pre-line text-xs sm:text-sm">
                  {activeModalClub.full_intro || "暫無詳細自介內容。"}
                </div>
              </div>

              {/* English Description (if available) */}
              {activeModalClub.english_intro && (
                <div>
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-stone-600" />
                    English Overview
                  </h4>
                  <div className="bg-stone-50/60 p-4 rounded-xl border border-stone-200/70 text-stone-600 whitespace-pre-line text-xs">
                    {activeModalClub.english_intro}
                  </div>
                </div>
              )}

              {/* Simulator Action Banner */}
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-between gap-3">
                <div className="text-xs text-stone-600">
                  想在大學生活模擬器中體驗？輸入【{activeModalClub.name}】探索社課劇情
                </div>
                <Link
                  href="/simulator"
                  className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs flex items-center gap-1 shrink-0 transition-colors"
                >
                  進入模擬器 <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
              <button
                onClick={() => handleCopy(activeModalClub)}
                className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 font-medium cursor-pointer"
              >
                {copiedId === activeModalClub.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-semibold">已複製簡介！</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>複製社團資訊</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setActiveModalClub(null)}
                className="px-4 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
