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
} from "lucide-react";
import { courseApi } from "@/lib/api";

export default function CoursesPage() {
  const [activeTab, setActiveTab] = useState<"search" | "rag" | "roadmap" | "compare">("search");

  // SQL Search State
  const [dept, setDept] = useState("");
  const [grade, setGrade] = useState<string>("");
  const [category, setCategory] = useState("");
  const [day, setDay] = useState<string>("");
  const [keyword, setKeyword] = useState("");
  const [courses, setCourses] = useState<any[]>([]);
  const [totalCourses, setTotalCourses] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  // RAG Search State
  const [ragQuery, setRagQuery] = useState("");
  const [ragAdvice, setRagAdvice] = useState<string | null>(null);
  const [ragResults, setRagResults] = useState<any[]>([]);
  const [isRagLoading, setIsRagLoading] = useState(false);

  // Roadmap State
  const [roadmapDept, setRoadmapDept] = useState("資訊管理學系");
  const [roadmapData, setRoadmapData] = useState<any | null>(null);
  const [isRoadmapLoading, setIsRoadmapLoading] = useState(false);

  // Compare State
  const [compareMode, setCompareMode] = useState<"course" | "dept">("course");
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [compareResult, setCompareResult] = useState<any | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  // Selected course detail modal
  const [modalCourse, setModalCourse] = useState<any | null>(null);

  const fetchCourses = async () => {
    setIsSearching(true);
    try {
      const data = await courseApi.search({
        dept: dept || undefined,
        grade: grade !== "" ? parseInt(grade) : undefined,
        category: category || undefined,
        day: day !== "" ? parseInt(day) : undefined,
        keyword: keyword || undefined,
        page: 1,
        pageSize: 30,
      });
      setCourses(data.items);
      setTotalCourses(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  // Load courses for SQL tab
  useEffect(() => {
    if (activeTab === "search") {
      fetchCourses();
    }
  }, [dept, grade, category, day, activeTab]);

  const handleRagSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!ragQuery.trim()) return;
    setIsRagLoading(true);
    try {
      const data = await courseApi.aiQuery(ragQuery.trim());
      setRagAdvice(data.consultant_advice);
      setRagResults(data.recommended_courses);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRagLoading(false);
    }
  };

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
    if (activeTab === "roadmap") {
      loadRoadmap(roadmapDept);
    }
  }, [roadmapDept, activeTab]);

  const toggleCourseSelect = (id: string) => {
    if (selectedCourseIds.includes(id)) {
      setSelectedCourseIds(selectedCourseIds.filter((cid) => cid !== id));
    } else {
      if (selectedCourseIds.length >= 3) return;
      setSelectedCourseIds([...selectedCourseIds, id]);
    }
  };

  const runCourseCompare = async () => {
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

  const runDeptCompare = async () => {
    setIsComparing(true);
    try {
      const data = await courseApi.compareDepts(["資訊管理學系", "資訊工程學系"]);
      setCompareResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 flex flex-col gap-6 bg-[#FAF8F5]">
      {/* Course Detail Modal */}
      {modalCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white max-w-lg w-full p-6 rounded-2xl border border-stone-200 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-200">
              <span className="text-xs px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-mono border border-blue-200">
                {modalCourse.department} • {modalCourse.grade > 0 ? `${modalCourse.grade}年級` : "全校"}{modalCourse.category === "required" ? "必修" : "選修"}
              </span>
              <button
                onClick={() => setModalCourse(null)}
                className="text-stone-400 hover:text-stone-800 text-xs px-2.5 py-1 rounded-md bg-stone-100 hover:bg-stone-200 cursor-pointer"
              >
                關閉
              </button>
            </div>
            <h3 className="text-xl font-bold text-stone-900 mb-2">{modalCourse.course_name}</h3>
            <div className="flex flex-wrap gap-3 text-xs text-stone-600 mb-4">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-blue-600" /> 授課：{modalCourse.instructor}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" /> 節次：{modalCourse.raw_schedule} ({modalCourse.credits}學分)
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600" /> 館舍：{modalCourse.location_name || "待排定"}
              </span>
            </div>
            <div className="p-4 rounded-xl mb-4 bg-stone-50 border border-stone-200">
              <h4 className="text-xs font-bold text-stone-500 mb-1">課程目標與大綱摘要</h4>
              <p className="text-sm text-stone-700 leading-relaxed">{modalCourse.syllabus_summary}</p>
            </div>
            {modalCourse.location_id && (
              <Link
                href={`/map?loc=${modalCourse.location_id}`}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <MapPin className="w-3.5 h-3.5" /> 前往 3D 地圖查看上課館舍
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <Link
            href="/explore"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 text-stone-700 text-xs font-medium transition-colors border border-stone-300 shadow-xs"
            title="回中央相關資料"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>回相關資料</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-600" />
              AI 智慧課程探索中心
            </h1>
            <p className="text-xs text-stone-500">
              多條件課表檢索、AI 智慧選課顧問、系所課程地圖與深度比對
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-stone-200 shadow-xs">
          <button
            onClick={() => setActiveTab("search")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === "search"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
            }`}
          >
            條件檢索
          </button>
          <button
            onClick={() => setActiveTab("rag")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === "rag"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
            }`}
          >
            <Sparkles className="w-3 h-3" />
            AI 顧問找課
          </button>
          <button
            onClick={() => setActiveTab("roadmap")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === "roadmap"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
            }`}
          >
            系所課程地圖
          </button>
          <button
            onClick={() => setActiveTab("compare")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === "compare"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
            }`}
          >
            <GitCompare className="w-3 h-3" />
            AI 深入比較
          </button>
        </div>
      </div>

      {/* TAB 1: SQL FILTER SEARCH */}
      {activeTab === "search" && (
        <div className="flex flex-col gap-5">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl grid grid-cols-2 sm:grid-cols-5 gap-3 border border-stone-200 shadow-xs">
            <div>
              <label className="block text-[11px] text-stone-500 mb-1">開課系所</label>
              <select
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-stone-50 border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-blue-500"
              >
                <option value="">全部系所</option>
                <option value="資訊管理學系">資訊管理學系</option>
                <option value="資訊工程學系">資訊工程學系</option>
                <option value="通識教育中心">通識教育中心</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-stone-500 mb-1">適合年級</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-stone-50 border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-blue-500"
              >
                <option value="">全年級</option>
                <option value="1">大一</option>
                <option value="2">大二</option>
                <option value="3">大三</option>
                <option value="4">大四</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-stone-500 mb-1">必選修類別</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-stone-50 border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-blue-500"
              >
                <option value="">全部類別</option>
                <option value="required">必修</option>
                <option value="elective">選修</option>
                <option value="general">通識</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-stone-500 mb-1">上課星期</label>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-stone-50 border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-blue-500"
              >
                <option value="">週一至週五</option>
                <option value="1">星期一</option>
                <option value="2">星期二</option>
                <option value="3">星期三</option>
                <option value="4">星期四</option>
                <option value="5">星期五</option>
              </select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] text-stone-500 mb-1">課名或教師關鍵字</label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="搜尋..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchCourses()}
                  className="w-full px-3 py-2 rounded-lg bg-stone-50 border border-stone-200 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={fetchCourses}
                  className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium cursor-pointer shadow-xs"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-xs text-stone-500 px-1">
            <span>找到 {totalCourses} 門課程</span>
            {selectedCourseIds.length > 0 && (
              <span className="text-blue-600 font-medium">
                已選擇 {selectedCourseIds.length} 門課程（可至「AI 深入比較」查看分析）
              </span>
            )}
          </div>

          {/* Course Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => {
              const isSelected = selectedCourseIds.includes(course.id);
              return (
                <div
                  key={course.id}
                  className="bg-white p-5 rounded-2xl border border-stone-200 hover:border-blue-400 hover:shadow-xs transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                        {course.department}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          course.category === "required"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {course.category === "required" ? "必修" : "選修"} • {course.credits} 學分
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-stone-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {course.course_name}
                    </h3>

                    <p className="text-xs text-stone-600 line-clamp-2 mb-4 leading-relaxed">
                      {course.syllabus_summary}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                    <span className="truncate pr-2">{course.instructor} • {course.raw_schedule}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => toggleCourseSelect(course.id)}
                        className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-blue-100 border-blue-300 text-blue-800"
                            : "bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100"
                        }`}
                        title="加入比較"
                      >
                        <GitCompare className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setModalCourse(course)}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-medium cursor-pointer"
                      >
                        詳情
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: AI HYBRID RAG SEARCH */}
      {activeTab === "rag" && (
        <div className="flex flex-col gap-6">
          {/* Query Input */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
            <h2 className="text-lg font-bold text-stone-900 mb-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
              AI 智慧課程探索顧問
            </h2>
            <p className="text-xs text-stone-600 mb-4">
              用日常口語說出你的興趣、志向或想學的技能，為你量身推薦合適課程：
            </p>

            <form onSubmit={handleRagSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="例如：我對寫網頁前端框架和手機 App 很有興趣，有哪些實作導向的課？"
                value={ragQuery}
                onChange={(e) => setRagQuery(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={isRagLoading || !ragQuery.trim()}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isRagLoading ? <Sparkles className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>AI 推薦</span>
              </button>
            </form>
          </div>

          {/* AI Consultant Advice Card */}
          {ragAdvice && (
            <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50">
              <span className="text-xs font-mono uppercase text-emerald-800 flex items-center gap-1.5 mb-1.5 font-bold">
                <Sparkles className="w-4 h-4" />
                選課顧問導讀建議
              </span>
              <p className="text-stone-800 text-sm leading-relaxed">{ragAdvice}</p>
            </div>
          )}

          {/* Recommended Course Cards */}
          {ragResults.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ragResults.map((c) => (
                <div
                  key={c.id}
                  className="bg-white p-5 rounded-2xl border border-stone-200 hover:border-emerald-400 hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 block w-fit mb-2">
                      {c.department}
                    </span>
                    <h3 className="text-base font-bold text-stone-900 mb-2">{c.course_name}</h3>
                    <p className="text-xs text-stone-600 line-clamp-3 mb-4 leading-relaxed">
                      {c.syllabus_summary}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-stone-500 pt-3 border-t border-stone-100">
                    <span>{c.instructor}</span>
                    <button
                      onClick={() => setModalCourse(c)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-pointer text-xs font-medium"
                    >
                      大綱詳情
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DEPARTMENT ROADMAP */}
      {activeTab === "roadmap" && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500">切換學系：</span>
              <button
                onClick={() => setRoadmapDept("資訊管理學系")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  roadmapDept === "資訊管理學系"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
                }`}
              >
                資訊管理學系
              </button>
              <button
                onClick={() => setRoadmapDept("資訊工程學系")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  roadmapDept === "資訊工程學系"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
                }`}
              >
                資訊工程學系
              </button>
            </div>
          </div>

          {/* AI Trajectory Overview Card */}
          {roadmapData?.ai_analysis && (
            <div className="bg-blue-50/60 p-5 rounded-2xl border border-blue-200 shadow-xs">
              <span className="text-xs font-mono uppercase text-blue-800 flex items-center gap-1.5 mb-1.5 font-bold">
                <Sparkles className="w-4 h-4" />
                四年學習脈絡導覽
              </span>
              <p className="text-stone-800 text-sm leading-relaxed mb-3">
                {roadmapData.ai_analysis.four_year_overview}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-blue-200">
                {Object.entries(roadmapData.ai_analysis.year_highlights || {}).map(([yr, desc]: any) => (
                  <div key={yr} className="text-xs">
                    <span className="font-bold text-blue-700 block mb-0.5">{yr}</span>
                    <span className="text-stone-600 text-[11px] leading-tight block">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8-Semester Timeline Kanban */}
          {roadmapData?.semesters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {["大一上", "大一下", "大二上", "大二下", "大三上", "大三下", "大四上", "大四下"].map(
                (semKey) => {
                  const termCourses = roadmapData.semesters[semKey] || [];
                  return (
                    <div key={semKey} className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col gap-2">
                      <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                        <span className="font-bold text-sm text-stone-900">{semKey}</span>
                        <span className="text-[10px] font-mono text-stone-500">
                          {termCourses.length} 門必選修
                        </span>
                      </div>
                      <div className="flex flex-col gap-2">
                        {termCourses.length === 0 ? (
                          <span className="text-xs text-stone-400 py-4 text-center">自由探索與校際選修</span>
                        ) : (
                          termCourses.map((c: any) => (
                            <div
                              key={c.id}
                              onClick={() => setModalCourse(c)}
                              className="p-2.5 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 hover:border-blue-300 transition-colors cursor-pointer flex flex-col justify-between"
                            >
                              <div className="flex items-center justify-between text-[10px] mb-1">
                                <span
                                  className={`px-1.5 py-0.2 rounded font-semibold ${
                                    c.category === "required" ? "text-rose-600" : "text-emerald-600"
                                  }`}
                                >
                                  {c.category === "required" ? "必修" : "選修"}
                                </span>
                                <span className="text-stone-500">{c.credits}學分</span>
                              </div>
                              <span className="text-xs font-bold text-stone-900 truncate">{c.course_name}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: AI COMPARATOR */}
      {activeTab === "compare" && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setCompareMode("course");
                setCompareResult(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                compareMode === "course" ? "bg-blue-600 text-white" : "glass-panel text-gray-400"
              }`}
            >
              比較課程模式
            </button>
            <button
              onClick={() => {
                setCompareMode("dept");
                setCompareResult(null);
                runDeptCompare();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                compareMode === "dept" ? "bg-blue-600 text-white" : "glass-panel text-gray-400"
              }`}
            >
              比較系所模式（資管 vs. 資工）
            </button>
          </div>

          {compareMode === "course" && (
            <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col gap-3">
              <span className="text-xs text-gray-300">
                已選課程：{selectedCourseIds.length} / 3 （請先至「條件檢索」標籤點擊比較按鈕加入課程）
              </span>
              <button
                onClick={runCourseCompare}
                disabled={selectedCourseIds.length < 2 || isComparing}
                className="w-fit px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {isComparing ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <GitCompare className="w-3.5 h-3.5" />}
                <span>執行多維度 AI 課程比較</span>
              </button>
            </div>
          )}

          {/* Comparison Output Table */}
          {compareResult?.comparison && (
            <div className="glass-panel-glow p-6 rounded-3xl border border-cyan-500/30 flex flex-col gap-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                AI 多維度深入對比報告
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-panel p-4 rounded-xl border border-white/5">
                  <span className="text-xs font-bold text-cyan-300 block mb-1">核心教學目標與差異</span>
                  <p className="text-xs text-gray-200 leading-relaxed">
                    {compareResult.comparison.core_difference}
                  </p>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-white/5">
                  <span className="text-xs font-bold text-cyan-300 block mb-1">
                    {compareMode === "course" ? "理論 vs. 實作比重" : "四年課程修課重心"}
                  </span>
                  <p className="text-xs text-gray-200 leading-relaxed">
                    {compareResult.comparison.theory_vs_practice || compareResult.comparison.curriculum_focus}
                  </p>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-white/5">
                  <span className="text-xs font-bold text-cyan-300 block mb-1">
                    {compareMode === "course" ? "先修門檻與修課難度" : "畢業職涯與研究所航道"}
                  </span>
                  <p className="text-xs text-gray-200 leading-relaxed">
                    {compareResult.comparison.prerequisites_difficulty || compareResult.comparison.career_paths}
                  </p>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-white/5">
                  <span className="text-xs font-bold text-cyan-300 block mb-1">適合什麼樣的學生選修</span>
                  <p className="text-xs text-gray-200 leading-relaxed">
                    {compareResult.comparison.suitable_for}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
