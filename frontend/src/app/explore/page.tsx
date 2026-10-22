"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Map,
  Bus,
  Coffee,
  Home,
  Users,
  Gamepad2,
  Shield,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Search,
  Bike,
  Car,
  Filter,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { exploreApi, courseApi } from "@/lib/api";

type CategoryId = "courses" | "map" | "transport" | "food" | "dorm" | "clubs";

export default function ExplorePage() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [lifeInfos, setLifeInfos] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [sampleCourses, setSampleCourses] = useState<any[]>([]);
  const [detailModal, setDetailModal] = useState<any | null>(null);

  // Search & Filter inside detailed views
  const [courseKeyword, setCourseKeyword] = useState("");
  const [courseDept, setCourseDept] = useState("");
  const [locationCat, setLocationCat] = useState<string | null>(null);
  const [locationKeyword, setLocationKeyword] = useState("");
  const [clubType, setClubType] = useState<string | null>(null);

  useEffect(() => {
    exploreApi.getLifeInfo().then(setLifeInfos).catch(console.error);
    exploreApi.getClubs().then(setClubs).catch(console.error);
    exploreApi.getLocations().then(setLocations).catch(console.error);
    courseApi
      .search({ pageSize: 12 })
      .then((data) => {
        if (data && data.items) setSampleCourses(data.items);
      })
      .catch(console.error);
  }, []);

  const handleSearchCourses = async () => {
    try {
      const data = await courseApi.search({
        keyword: courseKeyword || undefined,
        dept: courseDept || undefined,
        pageSize: 15,
      });
      if (data && data.items) setSampleCourses(data.items);
    } catch (e) {
      console.error(e);
    }
  };

  // Main Category Cards Configuration
  const categoryCards = [
    {
      id: "courses" as CategoryId,
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
      id: "map" as CategoryId,
      title: "校園地圖與館舍",
      icon: Map,
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      badge: "空間導覽",
      description: "瀏覽中央大學各大教學大樓、行政處室、學生宿舍與運動場館分佈及開課資訊。",
      highlights: ["立體空間地圖", "各館舍開課一覽", "活動地點定位"],
    },
    {
      id: "transport" as CategoryId,
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
      id: "dorm" as CategoryId,
      title: "宿舍生活與入住",
      icon: Home,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      badge: "新生住宿",
      description: "男九舍、女十四舍生活開箱須知，包含獨立冷氣電表儲值、洗衣烘衣設施與修繕申報流程。",
      highlights: ["寢室配備與設施", "冷氣卡儲值辦法", "修繕與門禁規範"],
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

  // Food static data
  const foodItems = [
    {
      title: "後門早餐一條街",
      desc: "緊鄰中央大學後門警衛亭，聚集多家早餐店：酥皮蛋餅、大份量炒泡麵與手工奶茶，早八必吃。",
      tag: "早餐商圈",
      location: "後門商圈",
    },
    {
      title: "宵夜街人氣美食",
      desc: "位於校園東側，深夜熱鬧的宵夜聚集地。碳烤雞排、現炸鹽酥雞、黑糖手工豆花與香酥地瓜球。",
      tag: "宵夜食堂",
      location: "宵夜街",
    },
    {
      title: "松苑餐廳與男九舍餐廳",
      desc: "校內用餐首選，提供平價自助餐、現切燒臘便當、日式丼飯、湯麵與素食專區。",
      tag: "校內學餐",
      location: "松苑 / 男九舍",
    },
    {
      title: "校園便利超商與咖啡館",
      desc: "女十四舍全家、總圖 7-ELEVEN、百花川路易莎咖啡，提供日常輕食、自習咖啡與提神飲品。",
      tag: "咖啡超商",
      location: "百花川 / 總圖",
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

  const filteredLocations = locations.filter((loc) => {
    if (locationCat && loc.category !== locationCat) return false;
    if (locationKeyword) {
      const q = locationKeyword.toLowerCase();
      return (
        loc.name?.toLowerCase().includes(q) ||
        loc.short_desc?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredClubs = clubs.filter((c) => {
    if (clubType && c.type !== clubType) return false;
    return true;
  });

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
            <div className="p-4 rounded-xl mb-5 bg-stone-50 border border-stone-200 text-sm text-stone-700 leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto">
              {detailModal.content_md || detailModal.full_intro || detailModal.desc}
            </div>
            {detailModal.location_id && (
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
              return (
                <div
                  key={card.id}
                  onClick={() => setSelectedCategory(card.id)}
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
              {categoryCards.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    selectedCategory === c.id
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  {c.title}
                </button>
              ))}
            </div>
          </div>

          {/* DETAIL 1: 課程資訊 (Courses) */}
          {selectedCategory === "courses" && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                    課程資訊與篩選檢索
                  </h2>
                  <p className="text-xs text-stone-600 mt-0.5">
                    支援關鍵字、系所篩選，並可進入完整課程中心使用 AI 選課顧問
                  </p>
                </div>

                <Link
                  href="/courses"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 w-fit shadow-xs"
                >
                  <span>前往完整課程中心</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Course Search Box */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="搜尋課程名稱、教授或關鍵字（例：演算法、微積分、Python）..."
                    value={courseKeyword}
                    onChange={(e) => setCourseKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchCourses()}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder-stone-400 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <select
                  value={courseDept}
                  onChange={(e) => setCourseDept(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="">所有系所</option>
                  <option value="資訊管理學系">資訊管理學系</option>
                  <option value="資訊工程學系">資訊工程學系</option>
                  <option value="數學系">數學系</option>
                  <option value="共同通識">共同通識</option>
                </select>
                <button
                  onClick={handleSearchCourses}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  立即搜尋
                </button>
              </div>

              {/* Course Result Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sampleCourses.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white p-5 rounded-2xl border border-stone-200 hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                          {c.category === "required" ? "必修" : "選修"} • {c.credits} 學分
                        </span>
                        <span className="text-xs text-stone-500">{c.department}</span>
                      </div>
                      <h3 className="text-base font-bold text-stone-900 mb-1">
                        {c.course_name}
                      </h3>
                      <p className="text-xs text-stone-500 mb-3">
                        授課教師：{c.instructor || "授課教師"} • 時段：{c.raw_schedule || "待定"}
                      </p>
                      <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed mb-4">
                        {c.syllabus_summary || "暫無課程大綱描述"}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                      <span className="text-stone-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-stone-400" />
                        {c.location_name || "教學館舍"}
                      </span>
                      <Link
                        href={`/courses?keyword=${encodeURIComponent(c.course_name)}`}
                        className="text-blue-600 font-medium hover:underline"
                      >
                        詳情
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DETAIL 2: 校園地圖 (Map) */}
          {selectedCategory === "map" && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                    <Map className="w-6 h-6 text-emerald-600" />
                    校園地圖與館舍設施
                  </h2>
                  <p className="text-xs text-stone-600 mt-0.5">
                    查看教學大樓、學生宿舍、餐飲與休閒空間，支援 3D 地圖導覽
                  </p>
                </div>

                <Link
                  href="/map"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 w-fit shadow-xs"
                >
                  <span>開啟 3D 校園地圖</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Map Filter & Search */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => setLocationCat(null)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                      locationCat === null
                        ? "bg-emerald-600 text-white"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                    }`}
                  >
                    全部館舍
                  </button>
                  <button
                    onClick={() => setLocationCat("academic")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                      locationCat === "academic"
                        ? "bg-emerald-600 text-white"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                    }`}
                  >
                    教學館舍
                  </button>
                  <button
                    onClick={() => setLocationCat("dorm")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                      locationCat === "dorm"
                        ? "bg-emerald-600 text-white"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                    }`}
                  >
                    學生宿舍
                  </button>
                  <button
                    onClick={() => setLocationCat("dining")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                      locationCat === "dining"
                        ? "bg-emerald-600 text-white"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                    }`}
                  >
                    生活餐飲
                  </button>
                  <button
                    onClick={() => setLocationCat("transport")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                      locationCat === "transport"
                        ? "bg-emerald-600 text-white"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                    }`}
                  >
                    交通樞紐
                  </button>
                </div>

                <div className="relative w-full sm:w-60">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="搜尋館舍名稱..."
                    value={locationKeyword}
                    onChange={(e) => setLocationKeyword(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-xs placeholder-stone-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Location Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLocations.map((loc) => (
                  <div
                    key={loc.id}
                    className="bg-white p-5 rounded-2xl border border-stone-200 hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                          {loc.category === "academic"
                            ? "教學館舍"
                            : loc.category === "dorm"
                            ? "學生宿舍"
                            : loc.category === "dining"
                            ? "生活餐飲"
                            : loc.category === "transport"
                            ? "交通樞紐"
                            : "運動休閒"}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-stone-900 mb-1">
                        {loc.name}
                      </h3>
                      <p className="text-xs text-stone-600 leading-relaxed mb-4">
                        {loc.short_desc}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                      <Link
                        href={`/map?loc=${loc.id}`}
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                      >
                        <MapPin className="w-3.5 h-3.5" /> 在 3D 地圖中定位
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {foodItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-medium border border-amber-200">
                          {item.tag}
                        </span>
                        <span className="text-xs text-stone-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-600" /> {item.location}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-stone-900 mb-2">
                        {item.title}
                      </h3>
                      <p className="text-xs text-stone-600 leading-relaxed mb-4">
                        {item.desc}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                      <span>可至 3D 地圖查看商圈位置</span>
                      <Link href="/map" className="text-amber-700 font-semibold hover:underline">
                        查看地圖 →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DETAIL 5: 宿舍生活 (Dormitories) */}
          {selectedCategory === "dorm" && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                  <Home className="w-6 h-6 text-purple-600" />
                  宿舍生活與入住須知
                </h2>
                <p className="text-xs text-stone-600 mt-0.5">
                  寢室環境、冷氣卡水電儲值、洗衣烘衣設施與報修流程指南
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {dormItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 font-medium border border-purple-200 mb-3 inline-block">
                        {item.tag}
                      </span>
                      <h3 className="text-base font-bold text-stone-900 mb-2">
                        {item.title}
                      </h3>
                      <p className="text-xs text-stone-600 leading-relaxed mb-4">
                        {item.desc}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-stone-100 text-xs text-stone-500">
                      入住前請先備齊學生證與身分證件
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DETAIL 6: 社團活動 (Clubs) */}
          {selectedCategory === "clubs" && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                    <Users className="w-6 h-6 text-rose-600" />
                    學生社團與活動名錄
                  </h2>
                  <p className="text-xs text-stone-600 mt-0.5">
                    探索中央大學學術、文藝、康樂及自治社團組織
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setClubType(null)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                      clubType === null
                        ? "bg-rose-600 text-white"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                    }`}
                  >
                    全部社團
                  </button>
                  <button
                    onClick={() => setClubType("academic_club")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                      clubType === "academic_club"
                        ? "bg-rose-600 text-white"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                    }`}
                  >
                    學術社團
                  </button>
                  <button
                    onClick={() => setClubType("recreation_club")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                      clubType === "recreation_club"
                        ? "bg-rose-600 text-white"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                    }`}
                  >
                    康樂藝文
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredClubs.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white p-5 rounded-2xl border border-stone-200 hover:border-rose-300 hover:shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200">
                          {c.type === "academic_club" ? "學術研究" : "康樂藝文"}
                        </span>
                        <span className="text-xs text-stone-500">
                          週{["一", "二", "三", "四", "五", "六", "日"][c.day_of_week - 1]}常態活動
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-stone-900 mb-1.5">
                        {c.name}
                      </h3>
                      <p className="text-xs text-stone-600 leading-relaxed mb-4 line-clamp-3">
                        {c.full_intro}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-600" />
                        {c.location_name || "活動場地"}
                      </span>
                      <button
                        onClick={() => setDetailModal(c)}
                        className="text-rose-700 font-semibold hover:underline cursor-pointer"
                      >
                        詳細招新
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
