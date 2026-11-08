"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  Sparkles,
  MapPin,
  Clock,
  ArrowRight,
  GitCompare,
  GraduationCap,
  Layers,
  ChevronRight,
  ChevronLeft,
  X,
  Target,
  Award,
  AlertCircle,
  Compass,
  ExternalLink,
} from "lucide-react";
import { courseApi } from "@/lib/api";

type TabType = "exact" | "fuzzy" | "recommend" | "roadmap" | "compare";

interface CourseExplorerViewProps {
  isEmbedded?: boolean;
}

export function CourseExplorerView({ isEmbedded = false }: CourseExplorerViewProps) {
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
  const [exactReqType, setExactReqType] = useState<string>("");
  const [exactDegree, setExactDegree] = useState<string>("");
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
  const [selectedSections, setSelectedSections] = useState<any[]>([]);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);

  // Roadmap State
  const [roadmapDept, setRoadmapDept] = useState<string>("資訊管理學系");
  const [roadmapData, setRoadmapData] = useState<any | null>(null);
  const [isRoadmapLoading, setIsRoadmapLoading] = useState<boolean>(false);

  // Compare State
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
        credits: exactCredits ? parseFloat(exactCredits) : undefined,
        day: exactDay ? parseInt(exactDay) : undefined,
        keyword: exactKeyword.trim() || undefined,
        required_or_elective: exactReqType || undefined,
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
  }, [exactSemester, exactDept, exactReqType, exactDegree, exactCredits, exactDay, activeTab]);

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
  const openCourseDetail = async (semester: string, serialNo: string, sections?: any[]) => {
    setIsLoadingDetail(true);
    setSelectedCourse(null);
    setSelectedSections(sections || []);
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
    <div className="flex flex-col gap-6 w-full">
      {/* 頂部標頭 */}
      {!isEmbedded ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
          <div className="flex items-center gap-3">
            <Link
              href="/explore"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 text-stone-700 text-xs font-semibold transition-colors border border-stone-300 shadow-xs"
              title="回到中大資訊"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>回到中大資訊</span>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-violet-600" />
                全校課程智慧探索
              </h1>
              <p className="text-xs text-stone-500">
                收錄 1151（上學期）與 1142（下學期）全校課程資料庫
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
          <div>
            <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-violet-600" />
              全校課程智慧探索
            </h2>
            <p className="text-xs text-stone-600 mt-0.5">
              收錄 1151（上學期）與 1142（下學期）全校課程資料庫，支援精準檢索、語義模糊查詢與學系推薦
            </p>
          </div>

          <div className="flex items-center gap-2">
            {meta && (
              <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200 font-medium">
                已收錄 {meta.total_courses.toLocaleString()} 門課程
              </span>
            )}
            <Link
              href="/courses"
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 transition flex items-center gap-1.5 shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-stone-600" />
              <span>獨立分頁開啟</span>
            </Link>
            <Link
              href="/admin/dashboard"
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 transition flex items-center gap-1.5 shadow-xs"
            >
              <Compass className="w-3.5 h-3.5 text-violet-600" />
              <span>3D 向量宇宙 (後台)</span>
            </Link>
          </div>
        </div>
      )}

      {/* 核心功能頁籤 */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("exact")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === "exact"
              ? "bg-violet-600 text-white shadow-xs"
              : "bg-white hover:bg-stone-100 text-stone-700 border border-stone-200"
            }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>精準查詢課程</span>
        </button>

        <button
          onClick={() => setActiveTab("fuzzy")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === "fuzzy"
              ? "bg-purple-600 text-white shadow-xs"
              : "bg-white hover:bg-stone-100 text-stone-700 border border-stone-200"
            }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>模糊向量查詢</span>
        </button>

        <button
          onClick={() => setActiveTab("recommend")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === "recommend"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-white hover:bg-stone-100 text-stone-700 border border-stone-200"
            }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>學系與領域推薦</span>
        </button>

        <button
          onClick={() => setActiveTab("roadmap")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === "roadmap"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-white hover:bg-stone-100 text-stone-700 border border-stone-200"
            }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>四年學習脈絡</span>
        </button>

        <button
          onClick={() => setActiveTab("compare")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === "compare"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-white hover:bg-stone-100 text-stone-700 border border-stone-200"
            }`}
        >
          <GitCompare className="w-3.5 h-3.5" />
          <span>課程深度對照</span>
          {selectedCourseIds.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-xs bg-white text-indigo-700 font-bold">
              {selectedCourseIds.length}
            </span>
          )}
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: 精準查詢課程                                             */}
      {/* ============================================================== */}
      {activeTab === "exact" && (
        <div className="flex flex-col gap-5">
          {/* 搜尋控制盤 */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col gap-4">
            <form onSubmit={handleExactSearchSubmit} className="flex flex-col gap-4">
              {/* 關鍵字搜尋列 */}
              <div className="relative flex items-center">
                <Search className="absolute left-3.5 w-4 h-4 text-stone-500" />
                <input
                  type="text"
                  value={exactKeyword}
                  onChange={(e) => setExactKeyword(e.target.value)}
                  placeholder="搜尋課名、課號代碼、教師姓名、大綱關鍵字（如：機器學習、演算法、微積分、日文）..."
                  className="w-full pl-9 pr-24 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-500 focus:outline-none focus:border-violet-500 text-xs"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs transition shadow-2xs cursor-pointer"
                >
                  搜尋
                </button>
              </div>

              {/* 篩選條件下拉列 */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* 開課學期 */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">開課學期</label>
                  <select
                    value={exactSemester}
                    onChange={(e) => setExactSemester(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 text-xs focus:outline-none focus:border-violet-500"
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
                  <label className="block text-xs font-semibold text-stone-700 mb-1">開課系所</label>
                  <select
                    value={exactDept}
                    onChange={(e) => setExactDept(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 text-xs focus:outline-none focus:border-violet-500"
                  >
                    <option value="">全部系所 ({meta?.departments.length || 0} 個)</option>
                    {meta?.departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 修別 (必修 / 選修) */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">修別類別</label>
                  <select
                    value={exactReqType}
                    onChange={(e) => setExactReqType(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 text-xs focus:outline-none focus:border-violet-500"
                  >
                    <option value="">全部修別</option>
                    <option value="必修">必修</option>
                    <option value="選修">選修</option>
                  </select>
                </div>

                {/* 學制 */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">學制類別</label>
                  <select
                    value={exactDegree}
                    onChange={(e) => setExactDegree(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 text-xs focus:outline-none focus:border-violet-500"
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
                  <label className="block text-xs font-semibold text-stone-700 mb-1">學分數</label>
                  <select
                    value={exactCredits}
                    onChange={(e) => setExactCredits(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 text-xs focus:outline-none focus:border-violet-500"
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
                  <label className="block text-xs font-semibold text-stone-700 mb-1">上課星期</label>
                  <select
                    value={exactDay}
                    onChange={(e) => setExactDay(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 text-xs focus:outline-none focus:border-violet-500"
                  >
                    <option value="">不限星期</option>
                    <option value="1">週一 (Mon)</option>
                    <option value="2">週二 (Tue)</option>
                    <option value="3">週三 (Wed)</option>
                    <option value="4">週四 (Thu)</option>
                    <option value="5">週五 (Fri)</option>
                  </select>
                </div>
              </div>
            </form>
          </div>

          {/* 搜尋結果統計列 */}
          <div className="flex items-center justify-between text-xs text-stone-500 px-1">
            <div>
              共找到 <span className="font-bold text-violet-700 text-sm">{exactTotal.toLocaleString()}</span> 門符合條件之課程
              {exactKeyword && (
                <span>
                  ，關鍵字：「<span className="text-stone-900 font-medium">{exactKeyword}</span>」
                </span>
              )}
            </div>
            <div>第 {exactPage} 頁 / 共 {Math.ceil(exactTotal / 24) || 1} 頁</div>
          </div>

          {/* 課程卡片網格 */}
          {isExactSearching ? (
            <div className="py-20 text-center">
              <div className="inline-block w-8 h-8 border-3 border-violet-600 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-xs text-stone-500">正在快速檢索全校課程資料庫...</p>
            </div>
          ) : exactCourses.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-stone-200">
              <AlertCircle className="w-9 h-9 text-stone-500 mx-auto mb-2" />
              <p className="text-stone-800 font-bold text-sm">查無符合條件的課程</p>
              <p className="text-xs text-stone-500 mt-1">請嘗試放寬篩選條件或更換搜尋關鍵字</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exactCourses.map((c) => {
                const is1151 = c.semester === "1151";
                const isSelected = selectedCourseIds.includes(c.id);

                return (
                  <div
                    key={c.id}
                    className="bg-white border border-stone-200 rounded-2xl p-5 hover:border-violet-400 hover:shadow-sm transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* 頂部標籤列 */}
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold ${is1151
                                ? "bg-stone-100 text-stone-700 border border-stone-200 font-medium"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}
                          >
                            {is1151 ? "1151 上學期" : "1142 下學期"}
                          </span>
                          {c.required_or_elective && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                c.required_or_elective === "必修"
                                  ? "bg-amber-100 text-amber-800 border border-amber-300"
                                  : "bg-stone-100 text-stone-700 border border-stone-200"
                              }`}
                            >
                              {c.required_or_elective}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600">
                            {c.degree || "學士班"}
                          </span>
                          <span className="text-xs text-stone-500 font-mono">
                            流水號: {c.serial_no}
                          </span>
                        </div>

                        <button
                          onClick={() => toggleSelectCourse(c.id)}
                          className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${isSelected
                              ? "bg-violet-600 border-violet-600 text-white"
                              : "bg-stone-50 border-stone-200 text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                            }`}
                          title="加入對照比較"
                        >
                          <GitCompare className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* 課名 */}
                      <h3 className="text-base font-bold text-stone-900 group-hover:text-violet-700 transition-colors line-clamp-1">
                        {c.course_name_zh}
                      </h3>
                      {c.course_name_en && (
                        <p className="text-xs text-stone-500 line-clamp-1 italic mb-2">
                          {c.course_name_en}
                        </p>
                      )}

                      {/* 課號、系所與教師 */}
                      <div className="text-xs text-stone-600 space-y-1 my-2.5 bg-stone-50 p-2.5 rounded-xl border border-stone-200/80">
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500">課號：</span>
                          <span className="font-mono text-violet-700 font-bold">{c.course_code || "未定"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500">系所：</span>
                          <span className="font-medium text-stone-800 truncate max-w-[180px]">{c.department}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500">授課教師：</span>
                          <span className="text-stone-700">{c.teacher || "未定"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500">學分數：</span>
                          <span className="font-bold text-emerald-600">{c.credits} 學分</span>
                        </div>
                      </div>

                      {/* 上課時間與地點 */}
                      {c.schedules && c.schedules.length > 0 && (
                        <div className="space-y-1 mb-2.5">
                          {c.schedules.map((s: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center gap-1.5 text-xs text-stone-800 bg-stone-100 px-2 py-1 rounded-lg border border-stone-200 font-mono"
                            >
                              <Clock className="w-3 h-3 text-violet-700 shrink-0" />
                              <span>{s.time}</span>
                              {s.location && (
                                <>
                                  <span className="text-stone-500">|</span>
                                  <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span className="truncate">{s.location}</span>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 課程綱要預覽 */}
                      {c.objectives && (
                        <p className="text-xs text-stone-500 line-clamp-2 mt-1 leading-relaxed">
                          {c.objectives}
                        </p>
                      )}
                    </div>

                    {/* 底部按鈕 */}
                    <button
                      onClick={() => openCourseDetail(c.semester, c.serial_no)}
                      className="mt-3.5 w-full py-2 rounded-xl bg-stone-50 hover:bg-violet-600 hover:text-white text-stone-700 text-xs font-semibold transition-all flex items-center justify-center gap-1 border border-stone-200 cursor-pointer"
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
            <div className="flex items-center justify-center gap-3 pt-3">
              <button
                disabled={exactPage <= 1}
                onClick={() => fetchExactCourses(exactPage - 1)}
                className="px-4 py-2 rounded-xl bg-white border border-stone-200 text-xs font-semibold text-stone-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50 transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>上一頁</span>
              </button>
              <span className="text-xs text-stone-500">
                第 <span className="text-stone-900 font-bold">{exactPage}</span> 頁 / 共{" "}
                {Math.ceil(exactTotal / 24)} 頁
              </span>
              <button
                disabled={exactPage >= Math.ceil(exactTotal / 24)}
                onClick={() => fetchExactCourses(exactPage + 1)}
                className="px-4 py-2 rounded-xl bg-white border border-stone-200 text-xs font-semibold text-stone-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50 transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <span>下一頁</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: 模糊向量查詢                                             */}
      {/* ============================================================== */}
      {activeTab === "fuzzy" && (
        <div className="flex flex-col gap-5">
          <div className="bg-white border border-purple-200 rounded-2xl p-6 shadow-xs flex flex-col gap-3">
            <div className="flex items-center gap-2 text-purple-700 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>ChromaDB 512 維度語意向量檢索</span>
            </div>
            <h2 className="text-lg font-bold text-stone-900">
              用自己的語言，模糊搜尋與你意圖最契合的課程
            </h2>
            <p className="text-xs text-stone-600 leading-relaxed max-w-3xl">
              無需死記課程名稱或精確代碼。向量引擎將你的查詢轉化為語意嵌入向量，在中央大學 4,399 門課程文本幾何空間中搜尋最相似的目標。
            </p>

            {/* 搜尋列 */}
            <div className="flex flex-col sm:flex-row gap-2.5 mt-1">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={fuzzyQuery}
                  onChange={(e) => setFuzzyQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFuzzySearch()}
                  placeholder="例如：想學習前端網頁設計與使用者體驗、機器學習與大數據分析、日語會話、智慧財產權與商法..."
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-500 focus:outline-none focus:border-purple-500 text-xs"
                />
              </div>
              <button
                onClick={() => handleFuzzySearch()}
                disabled={isFuzzySearching || !fuzzyQuery.trim()}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition shadow-xs disabled:opacity-50 whitespace-nowrap flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isFuzzySearching ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>語意檢索</span>
              </button>
            </div>

            {/* 推薦熱門查詢 Chip */}
            <div className="flex items-center gap-1.5 flex-wrap pt-2">
              <span className="text-xs text-stone-500">熱門靈感：</span>
              {[
                "人工智慧與深度學習",
                "Python 資料分析與視覺化",
                "日語實用會話與文化體驗",
                "投資理財與量化分析",
                "永續綠能與減碳科技",
                "半導體元件與晶片製造",
              ].map((chip) => (
                <button
                  key={chip}
                  onClick={() => {
                    setFuzzyQuery(chip);
                    handleFuzzySearch(chip);
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs bg-stone-100 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 text-stone-600 transition border border-stone-200 cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* 結果展示 */}
          {isFuzzySearching ? (
            <div className="py-20 text-center">
              <div className="inline-block w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-xs text-stone-500">正在透過向量資料庫計算餘弦相似度 (Cosine Metric)...</p>
            </div>
          ) : fuzzySearched && fuzzyResults.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-stone-200">
              <AlertCircle className="w-9 h-9 text-stone-500 mx-auto mb-2" />
              <p className="text-stone-800 font-bold text-sm">未找到高相關度的課程</p>
              <p className="text-xs text-stone-500 mt-1">請嘗試更換描述方式或點擊上方的靈感推薦</p>
            </div>
          ) : fuzzyResults.length > 0 ? (
            <div className="flex flex-col gap-4">
              <div className="text-xs text-stone-500 flex items-center justify-between px-1">
                <span>
                  依語意關聯度排序，共找出 <span className="font-bold text-purple-700">{fuzzyResults.length}</span> 門相關課程
                </span>
                <span className="font-mono text-stone-500">向量庫: ChromaDB (BAAI/bge-small-zh-v1.5)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fuzzyResults.map((c) => {
                  const is1151 = c.semester === "1151";
                  return (
                    <div
                      key={c.id}
                      className="bg-white border border-stone-200 hover:border-purple-300 hover:shadow-sm rounded-2xl p-5 transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* 相符度進度條 */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-bold text-purple-700 flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>語意相符度</span>
                            </span>
                            <span className="font-mono font-bold text-purple-600 text-sm">
                              {c.similarity}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                              style={{ width: `${Math.min(100, Math.max(10, c.similarity))}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* 學期與系所 */}
                        <div className="flex items-center gap-1.5 mb-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold ${is1151
                                ? "bg-stone-100 text-stone-700 border border-stone-200 font-medium"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}
                          >
                            {is1151 ? "1151 上學期" : "1142 下學期"}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-xs bg-stone-100 text-stone-600 font-medium">
                            {c.department}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-stone-900 mb-1 line-clamp-1">
                          {c.course_name_zh}
                        </h3>
                        {c.course_name_en && (
                          <p className="text-xs text-stone-500 italic line-clamp-1 mb-2">
                            {c.course_name_en}
                          </p>
                        )}

                        <div className="text-xs text-stone-500 flex items-center gap-4 mb-2.5">
                          <span>授課：{c.teacher || "未定"}</span>
                          <span>學分：{c.credits}</span>
                        </div>

                        {/* 上課時間 */}
                        {c.schedules && c.schedules.length > 0 && (
                          <div className="space-y-1 mb-2.5">
                            {c.schedules.map((s: any, idx: number) => (
                              <div
                                key={idx}
                                className="flex items-center gap-1.5 text-xs text-purple-800 bg-purple-50/70 px-2 py-1 rounded-lg border border-purple-200/60 font-mono"
                              >
                                <Clock className="w-3 h-3 text-purple-600 shrink-0" />
                                <span>{s.time}</span>
                                {s.location && (
                                  <>
                                    <span className="text-stone-500">|</span>
                                    <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                                    <span className="truncate">{s.location}</span>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        <p className="text-xs text-stone-600 line-clamp-3 bg-stone-50 p-2.5 rounded-xl border border-stone-200/80 leading-relaxed">
                          {c.preview || c.objectives || "課程概要"}
                        </p>
                      </div>

                      <button
                        onClick={() => openCourseDetail(c.semester, c.serial_no)}
                        className="mt-4 w-full py-2 rounded-xl bg-purple-50 hover:bg-purple-600 hover:text-white text-purple-700 text-xs font-semibold transition-all flex items-center justify-center gap-1 border border-purple-200 cursor-pointer"
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
      {/* TAB 3: 學系推薦                                                 */}
      {/* ============================================================== */}
      {activeTab === "recommend" && (
        <div className="flex flex-col gap-5">
          <div className="bg-white border border-emerald-200 rounded-2xl p-6 shadow-xs flex flex-col gap-3">
            <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider">
              <GraduationCap className="w-4 h-4 text-emerald-600" />
              <span>全校跨系所語意聚類推薦</span>
            </div>
            <h2 className="text-lg font-bold text-stone-900">
              輸入你有興趣的專業領域，智能推薦契合系所與核心課程
            </h2>
            <p className="text-xs text-stone-600 leading-relaxed max-w-3xl">
              系統將檢索全校 84 個系所開辦的所有課程，計算各系所與你的學習興趣的關聯強度，排列出最合適就讀或跨系修課的系所榜單與推薦代表課程。
            </p>

            {/* 輸入列 */}
            <div className="flex flex-col sm:flex-row gap-2.5 mt-1">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={recommendQuery}
                  onChange={(e) => setRecommendQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRecommend()}
                  placeholder="輸入學習目標，例如：半導體晶片製造與量子物理、UI/UX 設計與人機介面、金融大數據與風險管理..."
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-500 focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>
              <button
                onClick={() => handleRecommend()}
                disabled={isRecommending || !recommendQuery.trim()}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-xs disabled:opacity-50 whitespace-nowrap flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isRecommending ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Compass className="w-3.5 h-3.5" />
                )}
                <span>推薦學系</span>
              </button>
            </div>

            {/* 熱門學系領域標籤 */}
            <div className="flex items-center gap-1.5 flex-wrap pt-2">
              <span className="text-xs text-stone-500">熱門領域範例：</span>
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
                  className="px-2.5 py-1 rounded-lg text-xs bg-stone-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-stone-600 transition border border-stone-200 cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* 推薦輸出 */}
          {isRecommending ? (
            <div className="py-20 text-center">
              <div className="inline-block w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-xs text-stone-500">正在分析全校 84 個系所課程矩陣並計算契合度...</p>
            </div>
          ) : recommendData ? (
            <div className="flex flex-col gap-6">
              {/* AI 顧問導讀卡 */}
              {recommendData.consultant_advice && (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-emerald-900 mb-1">
                        AI 選課顧問學習路徑引導
                      </h3>
                      <p className="text-xs text-emerald-800 leading-relaxed whitespace-pre-line">
                        {recommendData.consultant_advice}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 推薦系所排行 */}
              <div>
                <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>最相符學系排行榜</span>
                </h3>

                <div className="space-y-4">
                  {recommendData.departments.map((dept, idx) => (
                    <div
                      key={dept.department}
                      className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs hover:border-emerald-300 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 mb-3.5 gap-2">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <div>
                            <h4 className="text-base font-bold text-stone-900">
                              {dept.department}
                            </h4>
                            <p className="text-xs text-stone-500">
                              收錄 {dept.course_count} 門高度相關課程
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="text-xs text-stone-500 block">最高相符度</span>
                            <span className="text-base font-mono font-bold text-emerald-600">
                              {dept.match_score}%
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setExactDept(dept.department);
                              setActiveTab("exact");
                            }}
                            className="px-3 py-1.5 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold border border-stone-200 transition-colors cursor-pointer"
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
                            className="bg-stone-50 border border-stone-200 hover:border-emerald-400 rounded-xl p-3 cursor-pointer transition-all hover:bg-white"
                          >
                            <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                              <span>{fc.semester === "1151" ? "1151 上" : "1142 下"}</span>
                              <span className="font-mono text-emerald-600 font-bold">{fc.similarity}%</span>
                            </div>
                            <div className="text-xs font-bold text-stone-900 line-clamp-1 mb-1">
                              {fc.course_name_zh}
                            </div>
                            <div className="text-xs text-stone-500 line-clamp-1">
                              教師：{fc.teacher || "未定"} • {fc.credits} 學分
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
      {/* TAB 4: 四年學習脈絡                                             */}
      {/* ============================================================== */}
      {activeTab === "roadmap" && (
        <div className="flex flex-col gap-5">
          <div className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-stone-900">系所四年修課地圖脈絡</h3>
              <p className="text-xs text-stone-500">大一至大四完整學程脈絡與代表性核心課程</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={roadmapDept}
                onChange={(e) => {
                  setRoadmapDept(e.target.value);
                  loadRoadmap(e.target.value);
                }}
                className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-xs focus:outline-none focus:border-amber-500"
              >
                {meta?.departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <button
                onClick={() => loadRoadmap(roadmapDept)}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition shadow-xs cursor-pointer"
              >
                更新分析
              </button>
            </div>
          </div>

          {isRoadmapLoading ? (
            <div className="py-20 text-center">
              <div className="inline-block w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-xs text-stone-500">正在生成 {roadmapDept} 四年學習路徑分析...</p>
            </div>
          ) : roadmapData ? (
            <div className="flex flex-col gap-5">
              {/* AI 脈絡摘要 */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 shadow-xs">
                <h4 className="text-xs font-bold text-amber-900 mb-1">四年學習重心總覽</h4>
                <p className="text-xs text-amber-800 leading-relaxed">
                  {roadmapData.ai_analysis?.four_year_overview || "循序漸進養成專業核心知能。"}
                </p>
              </div>

              {/* 8 學期展示 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(roadmapData.semesters || {}).map(([semLabel, cList]: [string, any]) => {
                  const isUpperSem = semLabel.endsWith("上");
                  const semCode = isUpperSem ? "1151" : "1142";
                  return (
                    <div key={semLabel} className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-stone-100 mb-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-amber-800 text-xs">{semLabel}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600 font-mono">
                              {semCode}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            {cList.length} 門必修
                          </span>
                        </div>

                        {cList.length === 0 ? (
                          <div className="py-8 text-center text-stone-500 text-xs">
                            <p>本學期無指定必修</p>
                            <span className="text-xs text-stone-500 mt-1 block">（主要為彈性專業選修與畢業學分）</span>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                            {cList.map((c: any) => {
                              const secCount = c.sections?.length || 0;
                              return (
                                <div
                                  key={c.id}
                                  onClick={() => openCourseDetail(c.semester, c.serial_no || c.id.split("_")[1], c.sections)}
                                  className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 hover:border-amber-400 hover:bg-white cursor-pointer transition text-xs group"
                                >
                                  <div className="flex items-center justify-between gap-1.5">
                                    <div className="font-bold text-stone-900 group-hover:text-amber-700 transition-colors truncate">
                                      {c.course_name}
                                    </div>
                                    {secCount > 1 && (
                                      <span className="text-xs px-1.5 py-0.2 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-semibold shrink-0">
                                        {secCount} 師/班可選
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-stone-500 flex items-center justify-between mt-1">
                                    <span className="truncate max-w-[120px]">{c.instructor}</span>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <span className="text-xs px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 font-medium">必修</span>
                                      <span className="text-emerald-600 font-bold">{c.credits} 學分</span>
                                    </div>
                                  </div>
                                  {c.raw_schedule && c.raw_schedule !== "安排中" && (
                                    <div className="text-xs text-stone-500 font-mono mt-1 flex items-center gap-1 truncate">
                                      <Clock className="w-2.5 h-2.5 shrink-0 text-stone-500" />
                                      <span className="truncate">{c.raw_schedule}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: 課程深度對照                                             */}
      {/* ============================================================== */}
      {activeTab === "compare" && (
        <div className="flex flex-col gap-5">
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-900">課程多維度對照比較</h3>
                <p className="text-xs text-stone-500">
                  目前已選取 {selectedCourseIds.length} 門課程（上限 3 門）
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={selectedCourseIds.length < 2 || isComparing}
                  onClick={handleCompare}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs transition shadow-xs cursor-pointer"
                >
                  {isComparing ? "分析中..." : "開始深入對照"}
                </button>
                <button
                  onClick={() => {
                    setSelectedCourseIds([]);
                    setCompareResult(null);
                  }}
                  className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs transition cursor-pointer"
                >
                  清空
                </button>
              </div>
            </div>

            {selectedCourseIds.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {selectedCourseIds.map((cid) => (
                  <span
                    key={cid}
                    className="px-2.5 py-1 rounded-lg text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1.5"
                  >
                    <span>{cid}</span>
                    <button onClick={() => toggleSelectCourse(cid)} className="hover:text-indigo-900 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {compareResult && (
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col gap-3">
              <h4 className="text-sm font-bold text-indigo-900">AI 綜合對照摘要</h4>
              <p className="text-xs text-stone-700 leading-relaxed whitespace-pre-line">
                {compareResult.comparison?.summary || "已完成課程比較。"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 課程詳細資訊彈窗 (Course Detail Modal)                             */}
      {/* ============================================================== */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-stone-300 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-xl overflow-hidden">
            {/* 彈窗頂部 */}
            <div className="p-6 border-b border-stone-200 flex items-start justify-between bg-stone-50">
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-100 text-stone-700 border border-stone-200 font-medium">
                    {selectedCourse.semester === "1151" ? "1151 上學期" : "1142 下學期"}
                  </span>
                  {selectedCourse.required_or_elective && (
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        selectedCourse.required_or_elective === "必修"
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : "bg-stone-100 text-stone-700 border border-stone-300"
                      }`}
                    >
                      {selectedCourse.required_or_elective}
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-200/80 text-stone-700">
                    {selectedCourse.degree || "學士班"}
                  </span>
                  <span className="text-xs text-stone-500 font-mono">
                    課號: {selectedCourse.course_code || selectedCourse.serial_no}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-stone-900">
                  {selectedCourse.course_name_zh}
                </h2>
                {selectedCourse.course_name_en && (
                  <p className="text-xs text-stone-500 italic mt-0.5">
                    {selectedCourse.course_name_en}
                  </p>
                )}
              </div>

              <button
                onClick={() => setSelectedCourse(null)}
                className="p-1.5 rounded-lg bg-stone-200/70 hover:bg-stone-300 text-stone-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 彈窗可滾動內容 */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs text-stone-700">
              {/* 多班級/多教師群選切換選單 */}
              {selectedSections && selectedSections.length > 1 && (
                <div className="bg-amber-50/90 border border-amber-300/80 rounded-2xl p-4 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-700" />
                      <span>可選班級 / 授課教師（本系共 {selectedSections.length} 位可選）</span>
                    </span>
                    <span className="text-xs text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-md font-medium">
                      {selectedCourse.course_name_zh.includes("服務學習") ? "各班時段略有不同" : "固定同一排課時段"}
                    </span>
                  </div>

                  <select
                    value={selectedCourse.serial_no}
                    onChange={(e) => {
                      const targetSec = selectedSections.find((s) => s.serial_no === e.target.value);
                      if (targetSec) {
                        openCourseDetail(targetSec.semester, targetSec.serial_no, selectedSections);
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-xs"
                  >
                    {selectedSections.map((sec) => (
                      <option key={sec.serial_no} value={sec.serial_no}>
                        {sec.course_name} — {sec.instructor || "授課教師"} ({sec.raw_schedule} @ {sec.location_name}) [課號: {sec.course_code}]
                      </option>
                    ))}
                  </select>

                  <p className="text-xs text-amber-800/90 mt-2 leading-relaxed">
                    {selectedCourse.course_name_zh.includes("服務學習")
                      ? "💡 服務學習課程各班別之時段與合作機構不同，請點選上方選單切換檢視。"
                      : "💡 本系此課程為全系同步排課時段，所有班級的上課時段皆相同，可自由選擇想修習的教師或主題內容。"}
                  </p>
                </div>
              )}

              {/* 基本資訊格網 */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
                <div>
                  <div className="text-stone-500 mb-0.5 text-xs">開課系所</div>
                  <div className="font-bold text-stone-900 truncate">{selectedCourse.department}</div>
                </div>
                <div>
                  <div className="text-stone-500 mb-0.5 text-xs">修別</div>
                  <div className={`font-bold ${selectedCourse.required_or_elective === "必修" ? "text-amber-800" : "text-stone-800"}`}>
                    {selectedCourse.required_or_elective || "未定"}
                  </div>
                </div>
                <div>
                  <div className="text-stone-500 mb-0.5 text-xs">授課教師</div>
                  <div className="font-bold text-stone-900">{selectedCourse.teacher || "未定"}</div>
                </div>
                <div>
                  <div className="text-stone-500 mb-0.5 text-xs">學分數</div>
                  <div className="font-bold text-emerald-600">{selectedCourse.credits} 學分</div>
                </div>
                <div>
                  <div className="text-stone-500 mb-0.5 text-xs">領域標籤</div>
                  <div className="font-bold text-violet-700 truncate">{selectedCourse.fields || "專業必選修"}</div>
                </div>
              </div>

              {/* 上課時間與地點 */}
              {selectedCourse.schedules && selectedCourse.schedules.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-violet-700" />
                    <span>上課時段與教室地點</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedCourse.schedules.map((s: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-violet-50/60 p-2.5 rounded-xl border border-violet-200 flex items-center justify-between"
                      >
                        <span className="font-mono text-stone-800 font-bold">{s.time}</span>
                        <span className="text-emerald-700 font-medium flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
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
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-indigo-600" />
                    <span>課程學習目標 (Objectives)</span>
                  </h4>
                  <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 text-stone-700 leading-relaxed whitespace-pre-line">
                    {selectedCourse.objectives}
                  </div>
                </div>
              )}

              {/* 授課綱要內容 */}
              {selectedCourse.content && (
                <div>
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                    <span>授課內容與教學進度 (Syllabus)</span>
                  </h4>
                  <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 text-stone-700 leading-relaxed whitespace-pre-line">
                    {selectedCourse.content}
                  </div>
                </div>
              )}

              {/* 教科書與參考書 */}
              {selectedCourse.textbooks && (
                <div>
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                    <span>教科書與參考書目 (Textbooks)</span>
                  </h4>
                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-stone-700">
                    {selectedCourse.textbooks}
                  </div>
                </div>
              )}

              {/* 分發限制條件 */}
              {selectedCourse.distribution_conditions && selectedCourse.distribution_conditions.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>分發限制與選課優先順位 (Distribution Conditions)</span>
                  </h4>
                  <div className="space-y-2">
                    {selectedCourse.distribution_conditions.map((dc: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl flex items-start gap-2.5"
                      >
                        <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-bold text-xs shrink-0">
                          順位 {dc.priority}
                        </span>
                        <span className="text-rose-900 text-xs font-medium">{dc.condition}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 系所核心能力指標 */}
              {selectedCourse.core_skills && selectedCourse.core_skills.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-emerald-600" />
                    <span>系所核心能力養成指標 (Core Competencies)</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedCourse.core_skills.map((cs: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-stone-50 border border-stone-200 p-2.5 rounded-xl space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-900">{cs.ability}</span>
                          <span className="text-emerald-700 font-bold text-xs">{cs.strength}</span>
                        </div>
                        {cs.assessment_method && (
                          <div className="text-xs text-stone-500 truncate">
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
            <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-end">
              <button
                onClick={() => setSelectedCourse(null)}
                className="px-5 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold text-xs transition cursor-pointer"
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
