"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Library, Users, Coffee, Home, Bus, Tag, MapPin, ArrowRight, ExternalLink } from "lucide-react";
import { exploreApi } from "@/lib/api";

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState<"all" | "clubs" | "food" | "dorm" | "transport">("all");
  const [lifeInfos, setLifeInfos] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [detailModal, setDetailModal] = useState<any | null>(null);

  useEffect(() => {
    exploreApi.getLifeInfo().then(setLifeInfos).catch(console.error);
    exploreApi.getClubs().then(setClubs).catch(console.error);
  }, []);

  const tags = ["早餐", "平價", "後門", "宵夜", "宿舍", "交通", "YouBike", "開箱"];

  const filteredLifeInfos = lifeInfos.filter((item) => {
    if (activeTab === "food" && item.info_type !== "food") return false;
    if (activeTab === "dorm" && item.info_type !== "dorm_detail") return false;
    if (activeTab === "transport" && item.info_type !== "transport") return false;
    if (selectedTag && !item.tags?.includes(selectedTag)) return false;
    return true;
  });

  const showClubs = activeTab === "all" || activeTab === "clubs";
  const showLife = activeTab !== "clubs";

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 flex flex-col gap-6">
      {/* Detail Modal */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel-glow max-w-xl w-full p-6 sm:p-7 rounded-3xl border border-cyan-500/30">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <span className="text-xs px-2.5 py-1 rounded-md bg-blue-500/20 text-cyan-300 font-mono">
                {detailModal.info_type || detailModal.type}
              </span>
              <button
                onClick={() => setDetailModal(null)}
                className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded-md bg-white/5 cursor-pointer"
              >
                關閉
              </button>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">
              {detailModal.title || detailModal.name}
            </h3>
            <div className="glass-panel p-4 rounded-xl mb-4 bg-white/5 text-sm text-gray-200 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
              {detailModal.content_md || detailModal.full_intro}
            </div>
            {detailModal.location_id && (
              <Link
                href={`/map?loc=${detailModal.location_id}`}
                className="w-full py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5" /> 在 3D 校園地圖上查看對應場域
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Library className="w-6 h-6 text-purple-400" />
            校園生活百科圖鑑
          </h1>
          <p className="text-xs text-gray-400">
            收錄中央大學社團組織、美食地圖、宿舍須知與交通攻略，掌握中大人必備生活指南
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl glass-panel border border-white/10">
          <button
            onClick={() => {
              setActiveTab("all");
              setSelectedTag(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              activeTab === "all" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            全部百科
          </button>
          <button
            onClick={() => setActiveTab("clubs")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              activeTab === "clubs" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            社團與自治
          </button>
          <button
            onClick={() => setActiveTab("food")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              activeTab === "food" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            中大美食
          </button>
          <button
            onClick={() => setActiveTab("dorm")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              activeTab === "dorm" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            宿舍生活
          </button>
          <button
            onClick={() => setActiveTab("transport")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              activeTab === "transport" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            聯外交通
          </button>
        </div>
      </div>

      {/* Tag Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-gray-400 mr-1 flex items-center gap-1">
          <Tag className="w-3 h-3" /> 標籤快篩：
        </span>
        <button
          onClick={() => setSelectedTag(null)}
          className={`px-2.5 py-1 rounded-md text-[11px] font-mono cursor-pointer transition-colors ${
            selectedTag === null
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30"
              : "bg-white/5 text-gray-400 hover:text-white border border-white/5"
          }`}
        >
          全部標籤
        </button>
        {tags.map((t) => (
          <button
            key={t}
            onClick={() => setSelectedTag(t)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono cursor-pointer transition-colors ${
              selectedTag === t
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30"
                : "bg-white/5 text-gray-400 hover:text-white border border-white/5"
            }`}
          >
            #{t}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Clubs Cards */}
        {showClubs &&
          clubs.map((c) => (
            <div
              key={c.id}
              className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-purple-400/40 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    社團組織
                  </span>
                  <span className="text-[10px] text-gray-400">
                    週{["一", "二", "三", "四", "五", "六", "日"][c.day_of_week - 1]}常態活動
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                  {c.name}
                </h3>
                <p className="text-xs text-gray-400 line-clamp-3 mb-4 leading-relaxed">
                  {c.full_intro}
                </p>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
                <span className="truncate pr-2 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-purple-400" />
                  {c.location_name || "活動場地"}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDetailModal(c)}
                    className="text-xs text-purple-300 hover:underline cursor-pointer"
                  >
                    詳細招新
                  </button>
                  {c.location_id && (
                    <Link
                      href={`/map?loc=${c.location_id}`}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white"
                      title="3D地圖定位"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}

        {/* Life Info Cards */}
        {showLife &&
          filteredLifeInfos.map((item) => (
            <div
              key={item.id}
              className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-amber-400/40 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    {item.info_type === "food" ? "飲食生活" : item.info_type === "dorm_detail" ? "宿舍指南" : "交通攻略"}
                  </span>
                  <div className="flex gap-1">
                    {item.tags?.slice(0, 2).map((tg: string) => (
                      <span key={tg} className="text-[9px] text-gray-500 font-mono">
                        #{tg}
                      </span>
                    ))}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
                  {item.title}
                </h3>

                <p className="text-xs text-cyan-200/80 italic mb-2">
                  💡 「{item.game_snippet}」
                </p>

                <p className="text-xs text-gray-400 line-clamp-3 mb-4 leading-relaxed whitespace-pre-wrap">
                  {item.content_md}
                </p>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
                <span className="truncate pr-2 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  {item.location_name || "中大周邊"}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDetailModal(item)}
                    className="text-xs text-amber-300 hover:underline cursor-pointer"
                  >
                    完整開箱攻略
                  </button>
                  {item.location_id && (
                    <Link
                      href={`/map?loc=${item.location_id}`}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white"
                      title="3D地圖定位"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
