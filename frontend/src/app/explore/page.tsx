"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Map,
  Bus,
  Coffee,
  Compass,
  Home,
  Users,
  Gamepad2,
  Shield,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Bike,
  Car,
  ChevronRight,
} from "lucide-react";
import { exploreApi } from "@/lib/api";
import { CourseExplorerView } from "@/components/courses/CourseExplorerView";
import { ClubExplorerView } from "@/components/clubs/ClubExplorerView";
// [新增: 引入 Future Map 夢想導航組件]
import { FutureMapExplorerView } from "@/components/future_map/FutureMapExplorerView";

// [修改: 移除 dorm，替換為 future_map]
type CategoryId = "courses" | "transport" | "food" | "future_map" | "clubs";

type FoodItem = {
  id: number;
  title: string;
  location_id?: string | null;
  location_name?: string | null;
  tags: string[];
  game_snippet: string;
  content_html: string;
};

function sanitizeHtml(html: string) {
  if (typeof window === "undefined") return "";

  const allowedTags = new Set(["H2", "H3", "P", "UL", "OL", "LI", "STRONG", "EM", "BR"]);
  const documentFragment = new DOMParser().parseFromString(html, "text/html");

  documentFragment.body.querySelectorAll("*").forEach((element) => {
    if (!allowedTags.has(element.tagName)) {
      element.replaceWith(...Array.from(element.childNodes));
      return;
    }

    Array.from(element.attributes).forEach((attribute) => element.removeAttribute(attribute.name));
  });

  return documentFragment.body.innerHTML;
}

export default function ExplorePage() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [isFoodLoading, setIsFoodLoading] = useState(false);
  const [detailModal, setDetailModal] = useState<any | null>(null);

  useEffect(() => {
    // Check URL parameters for initial category selection (e.g. /explore?cat=courses)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get("cat") || params.get("category");
      if (cat === "map") {
        window.location.replace("/map");
        return;
      }
      if (cat === "dorm") {
        setSelectedCategory("future_map");
        return;
      }
      if (cat && ["courses", "transport", "food", "future_map", "clubs"].includes(cat)) {
        setSelectedCategory(cat as CategoryId);
      }
    }

    setIsFoodLoading(true);
    exploreApi
      .getLifeInfo("food")
      .then((items) => setFoodItems(items as FoodItem[]))
      .catch(console.error)
      .finally(() => setIsFoodLoading(false));
  }, []);

  // Main Category Cards Configuration
  const categoryCards = [
    {
      id: "courses",
      title: "課程資訊與檢索",
      icon: BookOpen,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      badge: "修課與選課",
      description: "查詢全校開課清單、系所必選修、授課時段與學分資訊，並提供修業路徑參考。",
      highlights: ["全校課程檢索", "系所修業地圖", "AI 智慧顧問推薦"],
    },
    {
      id: "map",
      title: "3D 校園地圖與館舍設施",
      icon: Map,
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      badge: "3D 空間導覽",
      description: "瀏覽中央大學各大教學大樓、行政處室、學生宿舍與運動場館分佈，提供全視角 3D 立體導覽與館舍定位。",
      highlights: ["立體空間 3D 地圖", "館舍系所檢索", "教室位置定位"],
      href: "/map",
    },
    {
      id: "transport",
      title: "交通方式與指引",
      icon: Bus,
      iconColor: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
      badge: "往返與通勤",
      description: "完整收錄 132/133 市區公車、172 高鐵接駁、YouBike 2.0 租借與自行開車停車指南。",
      highlights: ["132/133 公車時刻", "高鐵與火車轉乘", "校園 YouBike 站點"],
    },
    {
      id: "food" as CategoryId,
      title: "飲食指南與美食",
      icon: Coffee,
      iconColor: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      badge: "生活餐飲",
      description: "後門早餐一條街、宵夜街人氣排隊美食、松苑與男九舍校內學餐、校園咖啡與便利超商。",
      highlights: ["後門早午餐商圈", "宵夜街人氣必吃", "校內平價學生餐廳"],
    },
    {
      id: "future_map" as CategoryId,
      title: "Future Map 夢想導航",
      icon: Compass,
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-300",
      badge: "★ 四年方案課表",
      description: "我的夢想，在中央怎麼實現？點擊基礎、中階、進階方案按鈕，即刻切換專屬的四年動態課表與重要申請時程！",
      highlights: ["按鈕式課表切換", "資工/法文/交換", "校曆重要待辦"],
    },
    {
      id: "clubs" as CategoryId,
      title: "學生社團與活動",
      icon: Users,
      iconColor: "text-rose-600",
      bgColor: "bg-rose-50",
      borderColor: "border-rose-200",
      badge: "課外學習",
      description: "涵蓋學術研究、康樂藝文、體育運動與自治社團組織，探索多采多姿的課外校園生活。",
      highlights: ["社團活動時段", "社辦位置指引", "招新資訊一覽"],
    },
  ];

  // Transportation static data
  const transportItems = [
    {
      title: "132 / 133 市區公車（往返中壢火車站）",
      desc: "中大主要通勤路線，班次密集。停靠正門圓環、依仁堂等站，直達中壢火車站商圈。",
      icon: Bus,
      tag: "市區公車",
      tips: "尖峰時段約 10~15 分鐘一班，可使用悠遊卡、一卡通或乘車碼。",
    },
    {
      title: "172 路直達公車（往返高鐵桃園站）",
      desc: "週五返鄉與週日收假首選！依仁堂與正門發車，直達高鐵桃園站及機捷 A18 站。",
      icon: Bus,
      tag: "高鐵接駁",
      tips: "週五下午與週日傍晚為尖峰乘車時段，建議提早 10 分鐘候車。",
    },
    {
      title: "YouBike 2.0 租借站點",
      desc: "校園內外設有 4 處主要站點：正門警衛室、後門商圈、依仁堂體育館、男九舍。",
      icon: Bike,
      tag: "單車代步",
      tips: "中大斜坡多，下坡路段騎乘請注意減速慢行，雨天請留意路面濕滑。",
    },
    {
      title: "自行開車與訪客停車須知",
      desc: "訪客汽車一律由正門進出，採車牌辨識自動計費進場。大草坪周邊與正門設有停車格。",
      icon: Car,
      tag: "停車指引",
      tips: "平日 30 元/小時，假日 50 元/小時，校園內全區限速 30 公里以策安全。",
    },
  ];

  // Dorm static data
  const dormItems = [
    {
      title: "男九舍與女十四舍入住須知",
      desc: "新生主要住宿舍區，每間寢室均配備獨立冷氣電表，公共空間設有投幣式洗衣機與高速烘衣機。",
      tag: "住宿指南",
    },
    {
      title: "冷氣水電電表儲值方法",
      desc: "每間寢室配備獨立儲值型冷氣電表，可至舍監辦公室或指定販賣機加值冷氣卡以供使用。",
      tag: "水電須知",
    },
    {
      title: "門禁感應與修繕報修申請",
      desc: "宿舍大門採學生證 RFID 感應進出。寢室設備若有損壞，可至數位中大校務系統填寫修繕單申報維修。",
      tag: "生活規範",
    },
  ];

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 md:p-8 flex flex-col gap-6 bg-[#FAF8F5]">
      {/* Detail Modal */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white max-w-2xl w-full p-6 sm:p-8 rounded-2xl border border-stone-300 shadow-xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <span className="text-xs px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 font-medium">
                {detailModal.category || detailModal.tag || "詳細資料"}
              </span>
              <button
                onClick={() => setDetailModal(null)}
                className="text-stone-500 hover:text-stone-900 text-xs px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 cursor-pointer transition-colors"
              >
                關閉
              </button>
            </div>
            <h3 className="text-xl font-bold text-stone-900 mb-3">
              {detailModal.title || detailModal.name}
            </h3>
            <div className="p-4 rounded-xl mb-5 bg-stone-50 border border-stone-200 text-sm text-stone-700 leading-relaxed max-h-80 overflow-y-auto">
              {detailModal.content_html ? (
                <div
                  className="prose prose-sm max-w-none prose-headings:text-stone-900 prose-p:text-stone-700 prose-li:text-stone-700"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(detailModal.content_html) }}
                />
              ) : (
                <div className="whitespace-pre-wrap">
                  {detailModal.content_md || detailModal.full_intro || detailModal.desc}
                </div>
              )}
            </div>
            {detailModal.location_id && detailModal.info_type !== "food" && (
              <Link
                href={`/map?loc=${detailModal.location_id}`}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <MapPin className="w-4 h-4" /> 在地圖中查看位置
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 text-stone-700 text-xs font-medium transition-colors border border-stone-300 shadow-xs"
            title="回到首頁"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>回首頁</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
              中央相關資料
            </h1>
            <p className="text-xs text-stone-500">
              點擊下方卡片即可展開該類別的詳細檢索與資料
            </p>
          </div>
        </div>

        {/* Quick Access to other tools */}
        <div className="flex items-center gap-2">
          <Link
            href="/simulator"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-all shadow-xs"
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>開始生活模擬</span>
          </Link>
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-600 hover:text-stone-900 border border-stone-300 text-xs transition-colors shadow-xs"
            title="管理後台"
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">後台管理</span>
          </Link>
        </div>
      </div>

      {/* VIEW 1: ALL CATEGORIES CARD GRID (Shown when no category is selected) */}
      {selectedCategory === null && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wider">
              全校資訊類別總覽（點擊卡片查看詳細內容）
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {categoryCards.map((card) => {
              const Icon = card.icon;
              if (card.href) {
                return (
                  <Link
                    key={card.id}
                    href={card.href}
                    className="bg-white p-6 rounded-2xl border border-stone-200 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-11 h-11 rounded-xl ${card.bgColor} ${card.iconColor} flex items-center justify-center border ${card.borderColor}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                          {card.badge}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-stone-900 mb-2 group-hover:text-emerald-700 transition-colors">
                        {card.title}
                      </h3>

                      <p className="text-xs text-stone-600 leading-relaxed mb-4">
                        {card.description}
                      </p>

                      {/* Feature highlights */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {card.highlights.map((h, i) => (
                          <span
                            key={i}
                            className="text-[11px] px-2 py-0.5 rounded-md bg-stone-50 border border-stone-200 text-stone-600"
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-emerald-600 group-hover:text-emerald-700">
                      <span>開啟 3D 校園地圖</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                );
              }

              return (
                <div
                  key={card.id}
                  onClick={() => setSelectedCategory(card.id as CategoryId)}
                  className="bg-white p-6 rounded-2xl border border-stone-200 hover:border-stone-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-11 h-11 rounded-xl ${card.bgColor} ${card.iconColor} flex items-center justify-center border ${card.borderColor}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 font-medium">
                        {card.badge}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-stone-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {card.title}
                    </h3>

                    <p className="text-xs text-stone-600 leading-relaxed mb-4">
                      {card.description}
                    </p>

                    {/* Feature highlights */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {card.highlights.map((h, i) => (
                        <span
                          key={i}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-stone-50 border border-stone-200 text-stone-600"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:text-blue-700">
                    <span>點擊查看詳細內容</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Additional quick portals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <Link
              href="/simulator"
              className="bg-white p-5 rounded-2xl border border-stone-200 hover:border-blue-300 hover:shadow-sm transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900 group-hover:text-blue-600 transition-colors">
                    校園一週生活模擬
                  </h4>
                  <p className="text-xs text-stone-500">
                    模擬大一生活作息，排定課表並體驗突發隨機事件
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-stone-400 group-hover:translate-x-1 group-hover:text-stone-700 transition-all" />
            </Link>

            <Link
              href="/admin/dashboard"
              className="bg-white p-5 rounded-2xl border border-stone-200 hover:border-stone-400 hover:shadow-sm transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center border border-stone-300">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900 group-hover:text-stone-700 transition-colors">
                    管理控制台
                  </h4>
                  <p className="text-xs text-stone-500">
                    檢視模擬次數、維護事件庫與同步課程資料
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-stone-400 group-hover:translate-x-1 group-hover:text-stone-700 transition-all" />
            </Link>
          </div>
        </div>
      )}

      {/* VIEW 2: CATEGORY DETAIL VIEW (Shown when a specific card is clicked) */}
      {selectedCategory !== null && (
        <div className="flex flex-col gap-6">
          {/* Back button & Category Switcher Bar */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <button
              onClick={() => setSelectedCategory(null)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-colors cursor-pointer w-fit"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>返回所有項目卡片</span>
            </button>

            {/* Quick Switch Tabs */}
            <div className="flex flex-wrap items-center gap-1">
              {categoryCards.map((c) => {
                if (c.href) {
                  return (
                    <Link
                      key={c.id}
                      href={c.href}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-100 flex items-center gap-1.5 transition-colors"
                    >
                      <Map className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{c.title}</span>
                    </Link>
                  );
                }

                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id as CategoryId)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      selectedCategory === c.id
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-stone-600 hover:bg-stone-100"
                    }`}
                  >
                    {c.title}
                  </button>
                );
              })}
            </div>
          </div>

          {/* DETAIL 1: 課程資訊 (Courses) */}
          {selectedCategory === "courses" && (
            <CourseExplorerView isEmbedded={true} />
          )}

          {/* DETAIL 3: 交通方式 (Transportation) */}
          {selectedCategory === "transport" && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                  <Bus className="w-6 h-6 text-indigo-600" />
                  交通方式與聯外指引
                </h2>
                <p className="text-xs text-stone-600 mt-0.5">
                  市區公車路線、高鐵接駁時刻建議、校園 YouBike 站點與停車資訊
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {transportItems.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200">
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium">
                            {item.tag}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-stone-900 mb-2">
                          {item.title}
                        </h3>
                        <p className="text-xs text-stone-600 leading-relaxed mb-4">
                          {item.desc}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-stone-100 text-xs text-stone-500 bg-stone-50 p-2.5 rounded-xl">
                        💡 貼心小提醒：{item.tips}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* DETAIL 4: 飲食指南 (Dining/Food) */}
          {selectedCategory === "food" && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                  <Coffee className="w-6 h-6 text-amber-600" />
                  飲食生活與周邊美食
                </h2>
                <p className="text-xs text-stone-600 mt-0.5">
                  精選中大人必吃後門早餐、宵夜街排隊名店、校內學餐與超商資訊
                </p>
              </div>

              {isFoodLoading ? (
                <div className="py-16 text-center text-xs text-stone-500">正在載入飲食資料...</div>
              ) : foodItems.length === 0 ? (
                <div className="py-16 text-center text-xs text-stone-500">目前沒有可顯示的飲食資料。</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {foodItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setDetailModal(item)}
                    className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-medium border border-amber-200">
                          {item.tags[0] || "飲食"}
                        </span>
                        <span className="text-xs text-stone-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-600" /> {item.location_name || "校園周邊"}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-stone-900 mb-2">
                        {item.title}
                      </h3>
                      <p className="text-xs text-stone-600 leading-relaxed mb-4">
                        {item.game_snippet}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {item.tags.slice(0, 5).map((tag) => (
                          <span key={tag} className="text-[11px] px-2 py-0.5 rounded-md bg-stone-50 border border-stone-200 text-stone-600">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-stone-100 text-xs text-stone-500">
                      <span>點擊查看完整店家資訊</span>
                    </div>
                  </div>
                ))}
                </div>
              )}
            </div>
          )}

          {/* [新增 DETAIL 5: Future Map 夢想導航 (按鈕式課表切換)，替換原宿舍區塊] */}
          {selectedCategory === "future_map" && (
            <FutureMapExplorerView />
          )}

          {/* DETAIL 6: 社團活動 (Clubs) */}
          {selectedCategory === "clubs" && (
            <ClubExplorerView isEmbedded={true} />
          )}
        </div>
      )}

      {/* Footer in Explore */}
      <footer className="mt-8 pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-3">
        <span>© 2026 國立中央大學 NCU Explorer 校園資料庫</span>
        <div className="flex items-center gap-4">
          <Link href="/" className="hover:text-stone-900 transition-colors">
            首頁
          </Link>
          <Link href="/simulator" className="hover:text-stone-900 transition-colors">
            生活模擬器
          </Link>
          <Link href="/courses" className="hover:text-stone-900 transition-colors">
            課程中心
          </Link>
          <Link href="/map" className="hover:text-stone-900 transition-colors">
            3D 地圖
          </Link>
        </div>
      </footer>
    </div>
  );
}
