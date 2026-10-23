"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  Sparkles,
  MapPin,
  Clock,
  User,
  ArrowLeft,
  GitCompare,
  GraduationCap,
  Calendar,
  Layers,
  ChevronRight,
  ChevronLeft,
  X,
  Target,
  Award,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  SlidersHorizontal,
  Compass,
} from "lucide-react";
import { courseApi } from "@/lib/api";

type TabType = "exact" | "fuzzy" | "recommend" | "roadmap" | "compare";

export default function CoursesPage() {
  const [activeTab, setActiveTab] = useState<TabType>("exact");

  // Metadata State
  const [meta, setMeta] = useState<{
    departments: string[];
    semesters: Array<{ id: string; name: string; short: string; count: number }>;
    degrees: string[];
    total_courses: number;
  } | null>(null);

  // Exact Search State
  const [exactSemester, setExactSemester] = useState<string>("");
  const [exactDept, setExactDept] = useState<string>("");
  const [exactDegree, setExactDegree] = useState<string>("");
  const [exactGrade, setExactGrade] = useState<string>("");
  const [exactCredits, setExactCredits] = useState<string>("");
  const [exactDay, setExactDay] = useState<string>("");
  const [exactKeyword, setExactKeyword] = useState<string>("");
  const [exactPage, setExactPage] = useState<number>(1);
  const [exactCourses, setExactCourses] = useState<any[]>([]);
  const [exactTotal, setExactTotal] = useState<number>(0);
  const [isExactSearching, setIsExactSearching] = useState<boolean>(false);

  // Fuzzy / Semantic Search State
  const [fuzzyQuery, setFuzzyQuery] = useState<string>("");
  const [fuzzySemester, setFuzzySemester] = useState<string>("");
  const [fuzzyDept, setFuzzyDept] = useState<string>("");
  const [fuzzyDegree, setFuzzyDegree] = useState<string>("");
  const [fuzzyResults, setFuzzyResults] = useState<any[]>([]);
  const [isFuzzySearching, setIsFuzzySearching] = useState<boolean>(false);
  const [fuzzySearched, setFuzzySearched] = useState<boolean>(false);

  // Department Recommendation State
  const [recommendQuery, setRecommendQuery] = useState<string>("");
  const [recommendSemester, setRecommendSemester] = useState<string>("");
  const [recommendData, setRecommendData] = useState<{
    query: string;
    departments: any[];
    top_courses: any[];
    consultant_advice: string;
  } | null>(null);
  const [isRecommending, setIsRecommending] = useState<boolean>(false);

  // Detail Modal State
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);

  // Roadmap State
  const [roadmapDept, setRoadmapDept] = useState<string>("資訊管理學系");
  const [roadmapData, setRoadmapData] = useState<any | null>(null);
  const [isRoadmapLoading, setIsRoadmapLoading] = useState<boolean>(false);

  // Compare State
  const [compareMode, setCompareMode] = useState<"course" | "dept">("course");
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [compareResult, setCompareResult] = useState<any | null>(null);
  const [isComparing, setIsComparing] = useState<boolean>(false);

  // 1. Initial Load Meta
  useEffect(() => {
    courseApi
      .getMeta()
      .then((data) => setMeta(data))
      .catch((err) => console.error("載入課程中繼資料失敗:", err));
  }, []);

  // 2. Fetch Exact Courses
  const fetchExactCourses = async (pageToFetch = 1) => {
    setIsExactSearching(true);
    try {
      const res = await courseApi.search({
        semester: exactSemester || undefined,
        dept: exactDept || undefined,
        degree: exactDegree || undefined,
        grade: exactGrade ? parseInt(exactGrade) : undefined,
        credits: exactCredits ? parseFloat(exactCredits) : undefined,
        day: exactDay ? parseInt(exactDay) : undefined,
        keyword: exactKeyword.trim() || undefined,
        page: pageToFetch,
        pageSize: 24,
      });
      setExactCourses(res.items || []);
      setExactTotal(res.total || 0);
      setExactPage(pageToFetch);
    } catch (err) {
      console.error("精準查詢失敗:", err);
    } finally {
      setIsExactSearching(false);
    }
  };

  useEffect(() => {
    if (activeTab === "exact") {
      fetchExactCourses(1);
    }
  }, [exactSemester, exactDept, exactDegree, exactGrade, exactCredits, exactDay, activeTab]);

  const handleExactSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchExactCourses(1);
  };

  // 3. Handle Fuzzy Search
  const handleFuzzySearch = async (queryText?: string) => {
    const q = (queryText !== undefined ? queryText : fuzzyQuery).trim();
    if (!q) return;
    setIsFuzzySearching(true);
    setFuzzySearched(true);
    try {
      const res = await courseApi.semanticSearch({
        query: q,
        semester: fuzzySemester || undefined,
        department: fuzzyDept || undefined,
        degree: fuzzyDegree || undefined,
        top_k: 24,
      });
      setFuzzyResults(res.items || []);
    } catch (err) {
      console.error("模糊語意檢索失敗:", err);
    } finally {
      setIsFuzzySearching(false);
    }
  };

  // 4. Handle Department Recommendation
  const handleRecommend = async (interestText?: string) => {
    const q = (interestText !== undefined ? interestText : recommendQuery).trim();
    if (!q) return;
    setIsRecommending(true);
    try {
      const res = await courseApi.recommendDepartments({
        interest_query: q,
        semester: recommendSemester || undefined,
        top_departments_count: 5,
        courses_per_dept: 4,
      });
      setRecommendData(res);
    } catch (err) {
      console.error("學系推薦失敗:", err);
    } finally {
      setIsRecommending(false);
    }
  };

  // 5. Open Course Detail Modal
  const openCourseDetail = async (semester: string, serialNo: string) => {
    setIsLoadingDetail(true);
    setSelectedCourse(null);
    try {
      const detail = await courseApi.getDetail(semester, serialNo);
      setSelectedCourse(detail);
    } catch (err) {
      console.error("載入課程詳情失敗:", err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // 6. Roadmap
  const loadRoadmap = async (targetDept: string) => {
    setIsRoadmapLoading(true);
    try {
      const data = await courseApi.getRoadmap(targetDept);
      setRoadmapData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRoadmapLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "roadmap" && !roadmapData) {
      loadRoadmap(roadmapDept);
    }
  }, [activeTab]);

  // 7. Course Comparison
  const handleCompare = async () => {
    if (selectedCourseIds.length < 2) return;
    setIsComparing(true);
    try {
      const data = await courseApi.compareCourses(selectedCourseIds);
      setCompareResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsComparing(false);
    }
  };

  const toggleSelectCourse = (courseId: string) => {
    if (selectedCourseIds.includes(courseId)) {
      setSelectedCourseIds(selectedCourseIds.filter((id) => id !== courseId));
    } else {
      if (selectedCourseIds.length >= 3) {
        alert("最多只能選取 3 門課程進行對照比較");
        return;
      }
      setSelectedCourseIds([...selectedCourseIds, courseId]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 頂部導航列 */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              title="返回首頁"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                NCU 課程智慧探索平台
              </h1>
              <p className="text-xs text-slate-400">
                中央大學 1151（上學期）與 1142（下學期）全校課程知識庫
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {meta && (
              <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-950/60 text-indigo-300 border border-indigo-800/50">
                已收錄 {meta.total_courses.toLocaleString()} 門課程
              </span>
            )}
            <Link
              href="/admin/dashboard"
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center space-x-1 border border-slate-700"
            >
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>管理後台 (3D 向量庫)</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 主體內容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {/* 核心功能頁籤 */}
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 mb-6 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("exact")}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
              activeTab === "exact"
                ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/20"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80"
            }`}
          >
            <Search className="w-4 h-4" />
            <span>精準查詢課程</span>
          </button>

          <button
            onClick={() => setActiveTab("fuzzy")}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
              activeTab === "fuzzy"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-600/20"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>模糊向量查詢</span>
          </button>

          <button
            onClick={() => setActiveTab("recommend")}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
              activeTab === "recommend"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>學系與領域推薦</span>
          </button>

          <button
            onClick={() => setActiveTab("roadmap")}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
              activeTab === "roadmap"
                ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-600/20"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>四年學習脈絡</span>
          </button>

          <button
            onClick={() => setActiveTab("compare")}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
              activeTab === "compare"
                ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80"
            }`}
          >
            <GitCompare className="w-4 h-4" />
            <span>課程深度對照</span>
            {selectedCourseIds.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-white text-indigo-700 font-bold">
                {selectedCourseIds.length}
              </span>
            )}
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: 精準查詢課程 (Exact Keyword & Multi-factor Search)         */}
        {/* ============================================================== */}
        {activeTab === "exact" && (
          <div className="space-y-6">
            {/* 搜尋控制盤 */}
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
              <form onSubmit={handleExactSearchSubmit} className="space-y-4">
                {/* 關鍵字搜尋列 */}
                <div className="relative flex items-center">
                  <Search className="absolute left-4 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={exactKeyword}
                    onChange={(e) => setExactKeyword(e.target.value)}
                    placeholder="輸入課名、課號代碼、教師姓名、領域標籤或授課大綱關鍵字（如：機器學習、演算法、王中成、日文）"
                    className="w-full pl-12 pr-28 py-3.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition text-sm"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm transition shadow-md shadow-cyan-600/30"
                  >
                    搜尋
                  </button>
                </div>

                {/* 篩選條件下拉列 */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {/* 開課學期 */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">開課學期</label>
                    <select
                      value={exactSemester}
                      onChange={(e) => setExactSemester(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950/70 border border-slate-700/70 rounded-lg text-slate-200 text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                    >
                      <option value="">全部學期 (1151 + 1142)</option>
                      {meta?.semesters.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.count}門)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 開課系所 */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">開課系所</label>
                    <select
                      value={exactDept}
                      onChange={(e) => setExactDept(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950/70 border border-slate-700/70 rounded-lg text-slate-200 text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                    >
                      <option value="">全部系所 ({meta?.departments.length || 0} 個)</option>
                      {meta?.departments.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 學制 */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">學制類別</label>
                    <select
                      value={exactDegree}
                      onChange={(e) => setExactDegree(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950/70 border border-slate-700/70 rounded-lg text-slate-200 text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                    >
                      <option value="">全部學制</option>
                      {meta?.degrees.map((deg) => (
                        <option key={deg} value={deg}>
                          {deg}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 學分數 */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">學分數</label>
                    <select
                      value={exactCredits}
                      onChange={(e) => setExactCredits(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950/70 border border-slate-700/70 rounded-lg text-slate-200 text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                    >
                      <option value="">不限學分</option>
                      <option value="1">1 學分</option>
                      <option value="2">2 學分</option>
                      <option value="3">3 學分</option>
                      <option value="4">4 學分</option>
                    </select>
                  </div>

                  {/* 上課星期 */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">上課星期</label>
                    <select
                      value={exactDay}
                      onChange={(e) => setExactDay(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950/70 border border-slate-700/70 rounded-lg text-slate-200 text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                    >
                      <option value="">不限星期</option>
                      <option value="1">週一 (Mon)</option>
                      <option value="2">週二 (Tue)</option>
                      <option value="3">週三 (Wed)</option>
                      <option value="4">週四 (Thu)</option>
                      <option value="5">週五 (Fri)</option>
                    </select>
                  </div>

                  {/* 重設按鈕 */}
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => {
                        setExactSemester("");
                        setExactDept("");
                        setExactDegree("");
                        setExactGrade("");
                        setExactCredits("");
                        setExactDay("");
                        setExactKeyword("");
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 text-xs transition border border-slate-700"
                    >
                      重設條件
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* 搜尋結果統計列 */}
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <div>
                共找到 <span className="font-bold text-cyan-400 text-sm">{exactTotal.toLocaleString()}</span> 門符合條件之課程
                {exactKeyword && (
                  <span>
                    ，關鍵字：「<span className="text-white font-medium">{exactKeyword}</span>」
                  </span>
                )}
              </div>
              <div>第 {exactPage} 頁 / 共 {Math.ceil(exactTotal / 24) || 1} 頁</div>
            </div>

            {/* 課程卡片網格 */}
            {isExactSearching ? (
              <div className="py-24 text-center">
                <div className="inline-block w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-sm text-slate-400">正在快速檢索全校課程資料庫...</p>
              </div>
            ) : exactCourses.length === 0 ? (
              <div className="py-16 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
                <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                <p className="text-slate-300 font-medium">查無符合條件的課程</p>
                <p className="text-xs text-slate-500 mt-1">請嘗試放寬篩選條件或更換搜尋關鍵字</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {exactCourses.map((c) => {
                  const is1151 = c.semester === "1151";
                  const isSelected = selectedCourseIds.includes(c.id);

                  return (
                    <div
                      key={c.id}
                      className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-cyan-500/50 hover:bg-slate-850 transition flex flex-col justify-between shadow-lg relative group"
                    >
                      <div>
                        {/* 頂部標籤列 */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                is1151
                                  ? "bg-blue-950/80 text-blue-300 border border-blue-800/60"
                                  : "bg-emerald-950/80 text-emerald-300 border border-emerald-800/60"
                              }`}
                            >
                              {is1151 ? "1151 上學期" : "1142 下學期"}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                              {c.degree || "學士班"}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400">
                              流水號: {c.serial_no}
                            </span>
                          </div>

                          <button
                            onClick={() => toggleSelectCourse(c.id)}
                            className={`p-1.5 rounded-lg border text-xs transition ${
                              isSelected
                                ? "bg-cyan-600 border-cyan-500 text-white"
                                : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white"
                            }`}
                            title="加入比較"
                          >
                            <GitCompare className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* 課名 */}
                        <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition line-clamp-1">
                          {c.course_name_zh}
                        </h3>
                        {c.course_name_en && (
                          <p className="text-xs text-slate-400 line-clamp-1 italic mb-2">
                            {c.course_name_en}
                          </p>
                        )}

                        {/* 課程代碼、系所與教師 */}
                        <div className="text-xs text-slate-300 space-y-1 my-3 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/50">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">課號：</span>
                            <span className="font-mono text-cyan-400 font-semibold">{c.course_code || "未定"}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">系所：</span>
                            <span className="font-medium text-white truncate max-w-[180px]">{c.department}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">授課教師：</span>
                            <span className="text-slate-200">{c.teacher || "未定"}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">學分數：</span>
                            <span className="font-semibold text-emerald-400">{c.credits} 學分</span>
                          </div>
                        </div>

                        {/* 上課時間與地點 */}
                        {c.schedules && c.schedules.length > 0 && (
                          <div className="space-y-1 mb-3">
                            {c.schedules.map((s: any, idx: number) => (
                              <div
                                key={idx}
                                className="flex items-center space-x-1.5 text-xs text-cyan-300 bg-cyan-950/30 px-2 py-1 rounded-lg border border-cyan-800/30 font-mono"
                              >
                                <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
                                <span>{s.time}</span>
                                {s.location && (
                                  <>
                                    <span className="text-slate-600">|</span>
                                    <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                                    <span className="truncate">{s.location}</span>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 課程綱要預覽 */}
                        {c.objectives && (
                          <p className="text-xs text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                            {c.objectives}
                          </p>
                        )}
                      </div>

                      {/* 底部查看詳情按鈕 */}
                      <button
                        onClick={() => openCourseDetail(c.semester, c.serial_no)}
                        className="mt-4 w-full py-2 rounded-xl bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 text-xs font-semibold transition flex items-center justify-center space-x-1 border border-slate-700/60"
                      >
                        <span>完整課綱與分發條件</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 分頁按鈕列 */}
            {exactTotal > 24 && (
              <div className="flex items-center justify-center space-x-3 pt-4">
                <button
                  disabled={exactPage <= 1}
                  onClick={() => fetchExactCourses(exactPage - 1)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-850 transition flex items-center space-x-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>上一頁</span>
                </button>
                <span className="text-xs text-slate-400">
                  第 <span className="text-white font-bold">{exactPage}</span> 頁 / 共{" "}
                  {Math.ceil(exactTotal / 24)} 頁
                </span>
                <button
                  disabled={exactPage >= Math.ceil(exactTotal / 24)}
                  onClick={() => fetchExactCourses(exactPage + 1)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-850 transition flex items-center space-x-1"
                >
                  <span>下一頁</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: 模糊向量查詢 (Semantic Vector Search with ChromaDB)         */}
        {/* ============================================================== */}
        {activeTab === "fuzzy" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-800/40 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center space-x-2 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <Sparkles className="w-4 h-4" />
                <span>ChromaDB 512 維度語意向量檢索</span>
              </div>
              <h2 className="text-lg font-bold text-white mb-2">
                用自己的語言，模糊搜尋與你意圖最契合的課程
              </h2>
              <p className="text-xs text-slate-400 mb-4 max-w-3xl leading-relaxed">
                無需死記課程名稱或精確代碼。向量引擎將你的查詢轉化為語意嵌入向量，在中央大學 4,399 門課程文本幾何空間中搜尋最相似的目標。
              </p>

              {/* 搜尋列 */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={fuzzyQuery}
                    onChange={(e) => setFuzzyQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleFuzzySearch()}
                    placeholder="例如：想學習前端網頁設計與人機介面、機器學習與大數據分析、第二外語實用對話、公司法與智慧財產權..."
                    className="w-full px-4 py-3.5 bg-slate-950/80 border border-purple-700/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>
                <button
                  onClick={() => handleFuzzySearch()}
                  disabled={isFuzzySearching || !fuzzyQuery.trim()}
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-sm transition shadow-lg shadow-purple-600/30 disabled:opacity-50 whitespace-nowrap flex items-center justify-center space-x-2"
                >
                  {isFuzzySearching ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>語意檢索</span>
                </button>
              </div>

              {/* 推薦熱門查詢 Chip */}
              <div className="flex items-center space-x-2 mt-4 flex-wrap gap-y-2">
                <span className="text-xs text-slate-400">推薦靈感：</span>
                {[
                  "人工智慧與深度學習",
                  "Python 資料分析與視覺化",
                  "日語實用會話與文化體驗",
                  "投資理財與公司治理",
                  "永續綠能與環境科技",
                  "晶片製程與半導體元件",
                ].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => {
                      setFuzzyQuery(chip);
                      handleFuzzySearch(chip);
                    }}
                    className="px-3 py-1 rounded-full text-xs bg-slate-800/90 hover:bg-purple-900/50 hover:text-purple-300 text-slate-300 transition border border-slate-700/60"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* 結果展示 */}
            {isFuzzySearching ? (
              <div className="py-24 text-center">
                <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-sm text-slate-400">正在透過向量資料庫計算餘弦相似度 (Cosine Metric)...</p>
              </div>
            ) : fuzzySearched && fuzzyResults.length === 0 ? (
              <div className="py-16 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
                <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                <p className="text-slate-300 font-medium">未找到高相關度的課程</p>
                <p className="text-xs text-slate-500 mt-1">請嘗試更換描述方式或點擊上方的靈感推薦</p>
              </div>
            ) : fuzzyResults.length > 0 ? (
              <div className="space-y-4">
                <div className="text-xs text-slate-400 flex items-center justify-between">
                  <span>
                    依語意關聯度排序，共找出 <span className="font-bold text-purple-400">{fuzzyResults.length}</span> 門相關課程
                  </span>
                  <span>向量庫: ChromaDB (BAAI/bge-small-zh-v1.5)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {fuzzyResults.map((c) => {
                    const is1151 = c.semester === "1151";
                    return (
                      <div
                        key={c.id}
                        className="bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-5 transition flex flex-col justify-between shadow-lg"
                      >
                        <div>
                          {/* 相符度進度條 */}
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="font-semibold text-purple-300 flex items-center space-x-1">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>語意相符度</span>
                              </span>
                              <span className="font-mono font-bold text-pink-400 text-sm">
                                {c.similarity}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                                style={{ width: `${Math.min(100, Math.max(10, c.similarity))}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* 學期與系所 */}
                          <div className="flex items-center space-x-2 mb-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                is1151
                                  ? "bg-blue-950 text-blue-300 border border-blue-800/60"
                                  : "bg-emerald-950 text-emerald-300 border border-emerald-800/60"
                              }`}
                            >
                              {is1151 ? "1151 上學期" : "1142 下學期"}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-300">
                              {c.department}
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-white mb-1 line-clamp-1">
                            {c.course_name_zh}
                          </h3>
                          {c.course_name_en && (
                            <p className="text-xs text-slate-400 italic line-clamp-1 mb-2">
                              {c.course_name_en}
                            </p>
                          )}

                          <div className="text-xs text-slate-300 flex items-center space-x-4 mb-3">
                            <span>授課：{c.teacher || "未定"}</span>
                            <span>學分：{c.credits}</span>
                          </div>

                          {/* 上課時間 */}
                          {c.schedules && c.schedules.length > 0 && (
                            <div className="space-y-1 mb-3">
                              {c.schedules.map((s: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex items-center space-x-1.5 text-xs text-purple-300 bg-purple-950/20 px-2 py-1 rounded-lg border border-purple-800/20 font-mono"
                                >
                                  <Clock className="w-3 h-3 text-purple-400 shrink-0" />
                                  <span>{s.time}</span>
                                  {s.location && (
                                    <>
                                      <span className="text-slate-600">|</span>
                                      <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                                      <span className="truncate">{s.location}</span>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          <p className="text-xs text-slate-400 line-clamp-3 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40">
                            {c.preview || c.objectives || "課程概要"}
                          </p>
                        </div>

                        <button
                          onClick={() => openCourseDetail(c.semester, c.serial_no)}
                          className="mt-4 w-full py-2 rounded-xl bg-purple-950/40 hover:bg-purple-600 hover:text-white text-purple-300 text-xs font-semibold transition flex items-center justify-center space-x-1 border border-purple-800/50"
                        >
                          <span>檢視詳情與分發條件</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: 學系推薦 (Department Recommendation by Interest)          */}
        {/* ============================================================== */}
        {activeTab === "recommend" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-800/40 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <GraduationCap className="w-4 h-4" />
                <span>全校跨系所語意聚類推薦</span>
              </div>
              <h2 className="text-lg font-bold text-white mb-2">
                輸入你有興趣的專業領域或想學的內容，智能推薦契合系所
              </h2>
              <p className="text-xs text-slate-400 mb-4 max-w-3xl leading-relaxed">
                系統將檢索全校 84 個系所開辦的所有課程，計算各系所與你的學習興趣的關聯強度，排列出最合適就讀或跨系修課的系所榜單與推薦代表課程。
              </p>

              {/* 輸入列 */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={recommendQuery}
                    onChange={(e) => setRecommendQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRecommend()}
                    placeholder="輸入學習目標，例如：半導體晶片製造與量子物理、UI/UX 設計與人因工程、金融大數據與風險管理..."
                    className="w-full px-4 py-3.5 bg-slate-950/80 border border-emerald-700/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
                <button
                  onClick={() => handleRecommend()}
                  disabled={isRecommending || !recommendQuery.trim()}
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm transition shadow-lg shadow-emerald-600/30 disabled:opacity-50 whitespace-nowrap flex items-center justify-center space-x-2"
                >
                  {isRecommending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Compass className="w-4 h-4" />
                  )}
                  <span>推薦學系</span>
                </button>
              </div>

              {/* 熱門學系領域標籤 */}
              <div className="flex items-center space-x-2 mt-4 flex-wrap gap-y-2">
                <span className="text-xs text-slate-400">熱門領域範例：</span>
                {[
                  "半導體元件與光電晶片",
                  "前端開發與使用者經驗設計",
                  "人工智慧與資料科學",
                  "永續環境與綠色減碳科技",
                  "財務金融與量化投資分析",
                  "多國語言溝通與跨文化交流",
                ].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setRecommendQuery(tag);
                      handleRecommend(tag);
                    }}
                    className="px-3 py-1 rounded-full text-xs bg-slate-800/90 hover:bg-emerald-900/50 hover:text-emerald-300 text-slate-300 transition border border-slate-700/60"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* 推薦輸出 */}
            {isRecommending ? (
              <div className="py-24 text-center">
                <div className="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-sm text-slate-400">正在分析全校 84 個系所課程矩陣並計算契合度...</p>
              </div>
            ) : recommendData ? (
              <div className="space-y-6">
                {/* AI 顧問導讀卡 */}
                {recommendData.consultant_advice && (
                  <div className="bg-slate-900/90 border border-emerald-800/50 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-emerald-300 mb-1 flex items-center space-x-2">
                          <span>AI 選課顧問學習路徑引導</span>
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                          {recommendData.consultant_advice}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 推薦系所排行 */}
                <div>
                  <h3 className="text-base font-bold text-white mb-4 flex items-center space-x-2">
                    <Award className="w-5 h-5 text-emerald-400" />
                    <span>最相符學系排行榜</span>
                  </h3>

                  <div className="space-y-4">
                    {recommendData.departments.map((dept, idx) => (
                      <div
                        key={dept.department}
                        className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg hover:border-emerald-500/40 transition"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 mb-4 gap-2">
                          <div className="flex items-center space-x-3">
                            <span className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-300 font-bold text-xs flex items-center justify-center">
                              #{idx + 1}
                            </span>
                            <div>
                              <h4 className="text-base font-bold text-white">
                                {dept.department}
                              </h4>
                              <p className="text-xs text-slate-400">
                                收錄 {dept.course_count} 門高度相關課程
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <span className="text-xs text-slate-400">最高相符度</span>
                              <div className="text-base font-mono font-bold text-emerald-400">
                                {dept.match_score}%
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setExactDept(dept.department);
                                setActiveTab("exact");
                              }}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition"
                            >
                              瀏覽全系課程
                            </button>
                          </div>
                        </div>

                        {/* 代表精選課程 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {dept.featured_courses.map((fc: any) => (
                            <div
                              key={fc.id}
                              onClick={() => openCourseDetail(fc.semester, fc.serial_no)}
                              className="bg-slate-950/60 border border-slate-800/80 hover:border-emerald-500/50 rounded-xl p-3 cursor-pointer transition"
                            >
                              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                                <span>{fc.semester === "1151" ? "1151 上" : "1142 下"}</span>
                                <span className="font-mono text-emerald-400 font-semibold">{fc.similarity}%</span>
                              </div>
                              <div className="text-xs font-bold text-white line-clamp-1 mb-1">
                                {fc.course_name_zh}
                              </div>
                              <div className="text-[11px] text-slate-400 line-clamp-1">
                                教師：{fc.teacher || "未定"} | {fc.credits} 學分
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: 四年學習脈絡 (Department Roadmap)                          */}
        {/* ============================================================== */}
        {activeTab === "roadmap" && (
          <div className="space-y-6">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white">系所四年修課地圖脈絡</h3>
                <p className="text-xs text-slate-400">大一至大四完整學程脈絡與代表性核心課程</p>
              </div>
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <select
                  value={roadmapDept}
                  onChange={(e) => {
                    setRoadmapDept(e.target.value);
                    loadRoadmap(e.target.value);
                  }}
                  className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                >
                  {meta?.departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => loadRoadmap(roadmapDept)}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs transition"
                >
                  更新分析
                </button>
              </div>
            </div>

            {isRoadmapLoading ? (
              <div className="py-24 text-center">
                <div className="inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-sm text-slate-400">正在生成 {roadmapDept} 四年學習路徑分析...</p>
              </div>
            ) : roadmapData ? (
              <div className="space-y-6">
                {/* AI 脈絡摘要 */}
                <div className="bg-amber-950/20 border border-amber-800/40 rounded-2xl p-5">
                  <h4 className="text-sm font-bold text-amber-300 mb-2">四年學習重心總覽</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {roadmapData.ai_analysis?.four_year_overview || "循序漸進養成專業核心知能。"}
                  </p>
                </div>

                {/* 8 學期展示 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(roadmapData.semesters || {}).map(([semLabel, cList]: [string, any]) => (
                    <div key={semLabel} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
                        <span className="font-bold text-amber-400 text-sm">{semLabel}</span>
                        <span className="text-xs text-slate-500">{cList.length} 門</span>
                      </div>
                      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                        {cList.map((c: any) => (
                          <div
                            key={c.id}
                            onClick={() => openCourseDetail(c.semester, c.serial_no || c.id.split("_")[1])}
                            className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-850 hover:border-amber-500/40 cursor-pointer transition text-xs"
                          >
                            <div className="font-semibold text-white truncate">{c.course_name}</div>
                            <div className="text-[11px] text-slate-400 flex items-center justify-between mt-1">
                              <span>{c.instructor}</span>
                              <span className="text-emerald-400">{c.credits} 學分</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: 課程深度對照 (Course Comparison)                           */}
        {/* ============================================================== */}
        {activeTab === "compare" && (
          <div className="space-y-6">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">課程多維度對照比較</h3>
                  <p className="text-xs text-slate-400">
                    目前已選取 {selectedCourseIds.length} 門課程（上限 3 門）
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    disabled={selectedCourseIds.length < 2 || isComparing}
                    onClick={handleCompare}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs transition"
                  >
                    {isComparing ? "分析中..." : "開始深入對照"}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCourseIds([]);
                      setCompareResult(null);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs transition"
                  >
                    清空
                  </button>
                </div>
              </div>

              {selectedCourseIds.length > 0 && (
                <div className="flex items-center space-x-2 mt-3 flex-wrap gap-y-2">
                  {selectedCourseIds.map((cid) => (
                    <span
                      key={cid}
                      className="px-3 py-1 rounded-full text-xs bg-indigo-950 text-indigo-300 border border-indigo-800 flex items-center space-x-1.5"
                    >
                      <span>{cid}</span>
                      <button onClick={() => toggleSelectCourse(cid)}>
                        <X className="w-3 h-3 hover:text-white" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {compareResult && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h4 className="text-sm font-bold text-indigo-300">AI 綜合對照摘要</h4>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                  {compareResult.comparison?.summary || "已完成課程比較。"}
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* 課程詳細資訊彈窗 (Course Detail Modal)                             */}
      {/* ============================================================== */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* 彈窗頂部 */}
            <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-slate-950/60">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                    {selectedCourse.semester === "1151" ? "1151 上學期" : "1142 下學期"}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
                    {selectedCourse.degree || "學士班"}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    課號: {selectedCourse.course_code || selectedCourse.serial_no}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mt-1">
                  {selectedCourse.course_name_zh}
                </h2>
                {selectedCourse.course_name_en && (
                  <p className="text-xs text-slate-400 italic mt-0.5">
                    {selectedCourse.course_name_en}
                  </p>
                )}
              </div>

              <button
                onClick={() => setSelectedCourse(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 彈窗可滾動內容 */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs text-slate-300">
              {/* 基本資訊格網 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80">
                <div>
                  <div className="text-slate-500 mb-0.5">開課系所</div>
                  <div className="font-semibold text-white truncate">{selectedCourse.department}</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-0.5">授課教師</div>
                  <div className="font-semibold text-white">{selectedCourse.teacher || "未定"}</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-0.5">學分數</div>
                  <div className="font-semibold text-emerald-400">{selectedCourse.credits} 學分</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-0.5">領域標籤</div>
                  <div className="font-semibold text-cyan-400 truncate">{selectedCourse.fields || "專業必選修"}</div>
                </div>
              </div>

              {/* 上課時間與地點 */}
              {selectedCourse.schedules && selectedCourse.schedules.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>上課時段與教室地點</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedCourse.schedules.map((s: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between"
                      >
                        <span className="font-mono text-cyan-300 font-semibold">{s.time}</span>
                        <span className="text-emerald-400 font-medium flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{s.location || "未指定教室"}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 課程目標 */}
              {selectedCourse.objectives && (
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                    <Target className="w-3.5 h-3.5 text-indigo-400" />
                    <span>課程學習目標 (Course Objectives)</span>
                  </h4>
                  <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800 text-slate-300 leading-relaxed whitespace-pre-line">
                    {selectedCourse.objectives}
                  </div>
                </div>
              )}

              {/* 授課綱要內容 */}
              {selectedCourse.content && (
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                    <span>授課內容與教學進度 (Syllabus)</span>
                  </h4>
                  <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800 text-slate-300 leading-relaxed whitespace-pre-line">
                    {selectedCourse.content}
                  </div>
                </div>
              )}

              {/* 教科書與參考書 */}
              {selectedCourse.textbooks && (
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span>教科書與參考書目 (Textbooks)</span>
                  </h4>
                  <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 text-slate-300">
                    {selectedCourse.textbooks}
                  </div>
                </div>
              )}

              {/* 分發限制條件 */}
              {selectedCourse.distribution_conditions && selectedCourse.distribution_conditions.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span>分發限制與選課優先順位 (Distribution Conditions)</span>
                  </h4>
                  <div className="space-y-2">
                    {selectedCourse.distribution_conditions.map((dc: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-rose-950/20 border border-rose-900/40 p-2.5 rounded-xl flex items-start space-x-2.5"
                      >
                        <span className="px-2 py-0.5 rounded-md bg-rose-900/60 text-rose-300 font-bold text-[11px] shrink-0">
                          順位 {dc.priority}
                        </span>
                        <span className="text-slate-200 text-xs">{dc.condition}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 系所核心能力指標 */}
              {selectedCourse.core_skills && selectedCourse.core_skills.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                    <Award className="w-3.5 h-3.5 text-teal-400" />
                    <span>系所核心能力養成指標 (Core Competencies)</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedCourse.core_skills.map((cs: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-slate-950/50 border border-slate-800 p-2.5 rounded-xl space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">{cs.ability}</span>
                          <span className="text-teal-400 font-bold text-[11px]">{cs.strength}</span>
                        </div>
                        {cs.assessment_method && (
                          <div className="text-[11px] text-slate-400 truncate">
                            評量方式: {cs.assessment_method}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 彈窗底部 */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end">
              <button
                onClick={() => setSelectedCourse(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition"
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
