"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Compass,
  Calendar,
  CheckCircle2,
  GraduationCap,
  Globe2,
  Briefcase,
  Layers,
  ChevronRight,
  Clock,
  BookOpen,
  Sparkles,
  ArrowRight,
  Send,
  Loader2,
  ListFilter,
  CheckSquare,
  FileText,
  BadgeCheck,
  Award,
  Layers2,
  BookmarkCheck,
  MousePointerClick,
  Plane,
  Filter,
  Check,
  ExternalLink,
  School,
  Building2,
  X,
  MapPin,
  User,
  AlertCircle
} from "lucide-react";
import {
  DEPARTMENT_CURRICULUMS
} from "@/data/departmentCurriculums";
import { courseApi } from "@/lib/api";
import {
  ExchangeSchoolItem,
  NCU_AY116_EXCHANGE_DATABASE
} from "@/data/ncuExchangeAY116";

interface CourseItem {
  course_name: string;
  credits: number;
  category: string;
  tag: string;
  note: string;
  ruleNote?: string;
}

interface SemesterPlan {
  semester_index: number;
  grade: number;
  term: number;
  semester_label: string;
  total_credits: number;
  courses: CourseItem[];
  key_deadlines: string[];
  highlight: string;
}

interface CandidateCourse {
  name: string;
  credits: number;
  type: "必修" | "選修" | "交換" | "檢定";
  stage: string;
  description: string;
  tag: string;
  ruleNote?: string;
  track?: "primary" | "secondary" | "exchange";
}

interface TierRoadmap {
  tier_id: "basic" | "intermediate" | "advanced";
  tier_name: string;
  target_summary: string;
  total_credits_estimate: number;
  weekly_intensity: string;
  semesters: SemesterPlan[];
  career_and_advantage: string[];
  candidate_courses: CandidateCourse[];
}

export function FutureMapExplorerView() {
  // 用戶自然語言輸入框 (初始未生成，讓使用者輸入或點擊靈感)
  const [userInput, setUserInput] = useState("想讀資工＋學法文，未來想去歐洲交換");
  const [isLoading, setIsLoading] = useState(false);

  // 三套方案之狀態 (初始為 null，代表尚未輸入生成)
  const [plans, setPlans] = useState<Record<"basic" | "intermediate" | "advanced", TierRoadmap> | null>(null);

  // 第一階段（主線決策）：三條核心學制路線（單選唯一基底：單主修、輔系、雙主修）
  const [selectedTier, setSelectedTier] = useState<"basic" | "intermediate" | "advanced" | null>(null);

  // 第二階段（擴充加值）：是否考慮參與出國交換計畫（徹底解耦之 Toggle，可自由疊加於任一主線）
  const [isExchangeEnabled, setIsExchangeEnabled] = useState<boolean>(false);

  // 智慧交換篩選器：使用者核心動機（情境 A / B / C）
  type ExchangeMotivation = "language" | "academic" | "lifestyle";
  const [exchangeMotivation, setExchangeMotivation] = useState<ExchangeMotivation>("language");
  const [customMotivationOverride, setCustomMotivationOverride] = useState<boolean>(false);

  // 子篩選條件
  const [selectedLanguage, setSelectedLanguage] = useState<string>("法語");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("資電資訊");
  const [selectedLifestyle, setSelectedLifestyle] = useState<string>("歐洲藝文");

  // 使用者選定之特定交換姐妹校
  const [selectedExchangeSchool, setSelectedExchangeSchool] = useState<ExchangeSchoolItem | null>(null);

  // 課程點擊詳細彈窗狀態
  interface CourseModalState {
    isOpen: boolean;
    isLoading: boolean;
    courseCode: string;
    name: string;
    credits: number;
    category: string;
    stage?: string;
    tag?: string;
    ruleNote?: string;
    note?: string;
    liveData?: {
      teacher?: string;
      department?: string;
      course_name_zh?: string;
      course_name_en?: string;
      objectives?: string;
      content?: string;
      textbooks?: string;
      schedules?: Array<{ time: string; location: string }>;
      core_skills?: Array<{ ability: string; strength: string; assessment_method: string }>;
      distribution_conditions?: Array<{ priority: number; condition: string }>;
    } | null;
  }
  const [modalCourse, setModalCourse] = useState<CourseModalState | null>(null);
  const [candidateFilter, setCandidateFilter] = useState<"all" | "primary" | "secondary">("all");

  const handleOpenCourseModal = async (course: {
    name: string;
    credits: number;
    category?: string;
    type?: string;
    tag?: string;
    stage?: string;
    note?: string;
    description?: string;
    ruleNote?: string;
  }) => {
    const rawName = course.name;
    const codeMatch = rawName.match(/([A-Z]{2}\d{3,4}[A-Za-z0-9\-_*]*)/);
    const code = codeMatch ? codeMatch[1].replace(/[-_*].*$/, "") : "";

    setModalCourse({
      isOpen: true,
      isLoading: Boolean(code),
      courseCode: code,
      name: rawName,
      credits: course.credits,
      category: course.category || course.type || "選修",
      stage: course.stage,
      tag: course.tag,
      ruleNote: course.ruleNote,
      note: course.note || course.description,
      liveData: null,
    });

    if (code) {
      try {
        const live = await courseApi.getByCode(code);
        setModalCourse((prev) => (prev && prev.courseCode === code ? { ...prev, isLoading: false, liveData: live } : prev));
      } catch (err) {
        console.warn("Could not fetch course by code:", code, err);
        setModalCourse((prev) => (prev && prev.courseCode === code ? { ...prev, isLoading: false } : prev));
      }
    }
  };

  // 意圖預判：偵測使用者輸入是否已明確提及特定語言
  const detectedLanguage = useMemo(() => {
    const q = userInput;
    if (q.includes("法文") || q.includes("法語")) return "法語";
    if (q.includes("日文") || q.includes("日語")) return "日語";
    if (q.includes("德文") || q.includes("德語")) return "德語";
    if (q.includes("西文") || q.includes("西班牙")) return "西班牙語";
    if (q.includes("韓文") || q.includes("韓語")) return "韓語";
    if (q.includes("英文") || q.includes("英語")) return "英語";
    return null;
  }, [userInput]);

  // 當偵測到語言時，自動鎖定情境 A 與該語言（除非使用者點擊切換其他動機）
  useEffect(() => {
    if (detectedLanguage && !customMotivationOverride) {
      setExchangeMotivation("language");
      setSelectedLanguage(detectedLanguage);
    }
  }, [detectedLanguage, customMotivationOverride]);

  // 智慧過濾推薦姊妹校清單 (情境 A / B / C)
  const filteredSchools = useMemo(() => {
    if (exchangeMotivation === "language") {
      return NCU_AY116_EXCHANGE_DATABASE.filter(s => s.official_languages.includes(selectedLanguage));
    } else if (exchangeMotivation === "academic") {
      const keyword = selectedDiscipline.slice(0, 2);
      return NCU_AY116_EXCHANGE_DATABASE.filter(s =>
        s.is_restricted_program && s.field_restrictions.some(f => f.includes(keyword))
      );
    } else {
      return NCU_AY116_EXCHANGE_DATABASE.filter(s =>
        s.lifestyle_tags.includes(selectedLifestyle) && !s.is_restricted_program
      );
    }
  }, [exchangeMotivation, selectedLanguage, selectedDiscipline, selectedLifestyle]);

  const presetQueries = [
    "想讀資工＋學法文，未來想去歐洲交換",
    "想讀資工＋修半導體學程，目標晶片研發與科技業津貼",
    "想讀資管＋雙主修資工，專攻金融科技與大數據",
    "想讀機械＋雙主修電機，跨足智慧製造與機器人",
  ];

  // 具體系所課程候選名單庫（完全依據中央大學官方修業規章與真實課號庫）
  const getDomainCandidates = (pDom: string, sDom: string) => {
    let cur = DEPARTMENT_CURRICULUMS[sDom];
    if (!cur) {
      for (const [key, val] of Object.entries(DEPARTMENT_CURRICULUMS)) {
        if (sDom.includes(val.tag) || key.includes(sDom) || sDom.includes(key)) {
          cur = val;
          break;
        }
      }
    }
    if (!cur) {
      cur = DEPARTMENT_CURRICULUMS["法國語文學系"];
    }

    return {
      ruleSummary: cur.ruleSummary,
      minorCredits: cur.minorCredits,
      doubleCredits: cur.doubleCredits,
      basic: cur.basic,
      intermediate: cur.intermediate,
      advanced: cur.advanced,
    };
  };

  // 客戶端本地備援解析系所
  const parseDomainsFromQuery = (q: string) => {
    let pDom = "資訊工程學系";
    let sDom = "法國語文學系";

    const dict: Record<string, string> = {
      "資工": "資訊工程學系",
      "資訊": "資訊工程學系",
      "法文": "法國語文學系",
      "法語": "法國語文學系",
      "半導體": "前瞻半導體學分學程",
      "晶片": "前瞻半導體學分學程",
      "資管": "資訊管理學系",
      "企管": "企業管理學系",
      "電機": "電機工程學系",
      "機械": "機械工程學系",
      "通訊": "通訊工程學系",
      "生醫": "生醫科學與工程學系",
      "生科": "生命科學系",
      "光電": "光電科學與工程學系",
      "化材": "化學工程與材料工程學系",
      "土木": "土木工程學系",
      "大氣": "大氣科學學系",
      "太空": "太空科學與工程學系",
      "地科": "地球科學學系",
      "地科學士": "地球科學學院院學士班",
      "院學士": "地球科學學院院學士班",
      "法律": "法律與政府學系",
      "法政": "法律與政府學系",
      "經濟": "經濟學系",
      "財金": "財務金融學系",
      "數學": "數學系",
      "物理": "物理學系",
      "化學": "化學系",
      "客家": "客家語文與社會",
      "英文": "英美語文學系",
    };

    const found: string[] = [];
    for (const [k, v] of Object.entries(dict)) {
      if (q.includes(k) && !found.includes(v)) {
        found.push(v);
      }
    }

    if (found.length >= 2) {
      pDom = found[0];
      sDom = found[1];
    } else if (found.length === 1) {
      pDom = found[0];
      sDom = pDom === "法國語文學系" ? "資訊工程學系" : "法國語文學系";
    } else {
      const parts = q.replace(/想讀|我想學|目標|想去/g, "").split(/[＋\+\&與和、]/);
      if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
        const d1 = dict[parts[0].trim()] || parts[0].trim();
        const d2 = dict[parts[1].trim()] || parts[1].trim();
        pDom = d1;
        sDom = d2;
      }
    }

    return { pDom, sDom };
  };

  // 根據使用者輸入之需求與交換加值設定，動態生成 3 條徹底解耦且完整呈現主修+輔修之學制路線
  const generateRoadmapPlans = (q: string, withExchange: boolean = isExchangeEnabled) => {
    const { pDom, sDom } = parseDomainsFromQuery(q);

    const pCur = DEPARTMENT_CURRICULUMS[pDom] || DEPARTMENT_CURRICULUMS["資訊工程學系"];
    const pTag = pCur.tag;
    const sCur = DEPARTMENT_CURRICULUMS[sDom] || DEPARTMENT_CURRICULUMS["法國語文學系"];
    const sTag = sCur.tag;

    const candidates = getDomainCandidates(pDom, sDom);

    const buildSemesters = (tier: string) => {
      const sems: SemesterPlan[] = [];
      const labels = ["大一上學期", "大一下學期", "大二上學期", "大二下學期", "大三上學期", "大三下學期", "大四上學期", "大四下學期"];
      
      const defaultSchedule = pCur.defaultMajorSchedule || DEPARTMENT_CURRICULUMS["資訊工程學系"].defaultMajorSchedule;
      const primaryElectives = pCur.intermediate || DEPARTMENT_CURRICULUMS["資訊工程學系"].intermediate;

      for (let i = 0; i < 8; i++) {
        const grade = Math.floor(i / 2) + 1;
        const term = (i % 2) + 1;
        const courses: CourseItem[] = [];

        // 1. 本系核心必修（確保本系大一至大四骨幹必修 100% 完整保留）
        const majorCore = defaultSchedule[i] || defaultSchedule[defaultSchedule.length - 1];
        courses.push({
          course_name: majorCore.name,
          credits: majorCore.cred,
          category: "必修",
          tag: `${pTag}核心`,
          note: majorCore.note,
          ruleNote: `★ 教務處規章：${pDom}本系畢業 128 學分核心必修科目。`
        });

        // 2. 本系數理／工程基礎必修
        // 僅理工實驗型學系（物理、電機、機械、光電、化材、土木、地科、大氣、太空）納入普通物理實驗；資工、資管、文學院與商管學院等完全排除
        const needsPhysicsLab = (
          pDom.includes("物理") ||
          pDom.includes("電機") ||
          pDom.includes("機械") ||
          pDom.includes("光電") ||
          pDom.includes("化材") ||
          pDom.includes("土木") ||
          pDom.includes("地球") ||
          pDom.includes("大氣") ||
          pDom.includes("太空")
        ) && !pDom.includes("資訊工程") && !pDom.includes("資訊管理") && pTag !== "資工" && pTag !== "資管";

        const isLiberalArtsOrLaw = (
          pDom.includes("文學") ||
          pDom.includes("法語") ||
          pDom.includes("語文") ||
          pDom.includes("法律") ||
          pDom.includes("客家")
        );

        if (i === 0) {
          if (!isLiberalArtsOrLaw) {
            courses.push({ course_name: "MA1001 微積分", credits: 4, category: "必修", tag: `${pTag}數理`, note: "極限連續與單變數微積分核心定理" });
          }
          if (needsPhysicsLab) {
            courses.push({ course_name: "PH1003 普通物理實驗", credits: 1, category: "必修", tag: `${pTag}實習`, note: "古典力學與熱學精準實驗操作" });
          } else if (pDom.includes("資訊工程") || pTag === "資工") {
            courses.push({ course_name: "CE2003 離散數學", credits: 3, category: "必修", tag: `${pTag}核心`, note: "集合論、邏輯命題、圖形理論與遞迴關係" });
          }
        } else if (i === 1) {
          if (!isLiberalArtsOrLaw) {
            courses.push({ course_name: "MA1002 微積分", credits: 4, category: "必修", tag: `${pTag}數理`, note: "多變數微積分與高維向量場分析" });
          }
          if (needsPhysicsLab) {
            courses.push({ course_name: "PH1004 普通物理實驗", credits: 1, category: "必修", tag: `${pTag}實習`, note: "電磁光學示波器與干涉儀實作" });
          } else if (pDom.includes("資訊工程") || pTag === "資工") {
            courses.push({ course_name: "CE1006 工程數學", credits: 3, category: "必修", tag: `${pTag}工數`, note: "線性聯立方程組、特徵值分解與微分方程基礎" });
          }
        } else if (i === 2) {
          if (!isLiberalArtsOrLaw) {
            courses.push({ course_name: "CO1007 工程數學-線性代數", credits: 3, category: "必修", tag: `${pTag}工數`, note: "抽象向量空間與矩陣對角化分解" });
          }
          const sec = primaryElectives[1 % primaryElectives.length];
          if (sec && sec.name !== majorCore.name) {
            courses.push({ course_name: sec.name, credits: sec.credits, category: "必修", tag: `${pTag}專業`, note: sec.description, ruleNote: sec.ruleNote });
          }
        } else if (i === 3) {
          const sec = primaryElectives[2 % primaryElectives.length];
          if (sec && sec.name !== majorCore.name) {
            courses.push({ course_name: sec.name, credits: sec.credits, category: "必修", tag: `${pTag}專業`, note: sec.description, ruleNote: sec.ruleNote });
          }
        } else if (i === 4) {
          const sec = primaryElectives[3 % primaryElectives.length];
          if (sec && sec.name !== majorCore.name) {
            courses.push({ course_name: sec.name, credits: sec.credits, category: "選修", tag: `${pTag}高階`, note: sec.description, ruleNote: sec.ruleNote });
          }
        } else if (i === 5) {
          const sec = primaryElectives[4 % primaryElectives.length];
          if (sec && sec.name !== majorCore.name) {
            courses.push({ course_name: sec.name, credits: sec.credits, category: "選修", tag: `${pTag}高階`, note: sec.description, ruleNote: sec.ruleNote });
          }
        } else if (i === 6) {
          // 大四上：若開啟交換，加入交換模組，且絕不刪除畢業專題
          if (withExchange) {
            const schoolTitle = selectedExchangeSchool
              ? `海外交換：${selectedExchangeSchool.name_zh} (${selectedExchangeSchool.country}) 研習模組`
              : "海外姐妹校留學交換研習模組 (全英語授課抵免)";
            const schoolNote = selectedExchangeSchool
              ? `赴 ${selectedExchangeSchool.name_zh} 交換研習一學期。返校依規章全額抵免主修選修。`
              : "赴歐美頂尖姊妹校交換研習一學期，修得學分可全數返校抵免相關選修學分";
            courses.push({
              course_name: schoolTitle,
              credits: 12,
              category: "交換",
              tag: "海外交換加值",
              note: schoolNote,
              ruleNote: "★ 國際處 OIA：出國交換期間所修學分返校依系所審查全額抵免。"
            });
          } else {
            const sec = primaryElectives[5 % primaryElectives.length];
            if (sec && sec.name !== majorCore.name) {
              courses.push({ course_name: sec.name, credits: sec.credits, category: "選修", tag: `${pTag}專案`, note: sec.description, ruleNote: sec.ruleNote });
            }
          }
        } else if (i === 7) {
          courses.push({
            course_name: `${pTag}跨領域畢業成果審查`,
            credits: 2,
            category: "必修",
            tag: `${pTag}畢業總整`,
            note: "本系四年完整修業學分預審與成果驗收"
          });
        }

        // 3. 第二專長 / 輔系 / 雙主修科目注入
        if (tier === "basic") {
          if (i < candidates.basic.length) {
            const cand = candidates.basic[i];
            courses.push({
              course_name: cand.name,
              credits: cand.credits,
              category: "選修",
              tag: `${sTag}選修`,
              note: cand.description,
              ruleNote: cand.ruleNote
            });
          }
        } else if (tier === "intermediate") {
          // 輔系：大一、大二、大三按部就班修畢全套 20~28 學分指定必修
          const intList = candidates.intermediate;
          if (i === 0 && intList.length > 0) {
            courses.push({ course_name: intList[0].name, credits: intList[0].credits, category: "輔系必修", tag: `${sTag}輔系`, note: intList[0].description, ruleNote: intList[0].ruleNote });
            if (intList[1]) courses.push({ course_name: intList[1].name, credits: intList[1].credits, category: "輔系必修", tag: `${sTag}輔系`, note: intList[1].description, ruleNote: intList[1].ruleNote });
          } else if (i === 1 && intList.length > 2) {
            courses.push({ course_name: intList[2].name, credits: intList[2].credits, category: "輔系必修", tag: `${sTag}輔系`, note: intList[2].description, ruleNote: intList[2].ruleNote });
            if (intList[3]) courses.push({ course_name: intList[3].name, credits: intList[3].credits, category: "輔系必修", tag: `${sTag}輔系`, note: intList[3].description, ruleNote: intList[3].ruleNote });
          } else if (i === 2 && intList.length > 4) {
            courses.push({ course_name: intList[4].name, credits: intList[4].credits, category: "輔系必修", tag: `${sTag}輔系`, note: intList[4].description, ruleNote: intList[4].ruleNote });
          } else if (i === 3 && intList.length > 5) {
            courses.push({ course_name: intList[5].name, credits: intList[5].credits, category: "輔系必修", tag: `${sTag}輔系`, note: intList[5].description, ruleNote: intList[5].ruleNote });
          } else if (i === 4 && intList.length > 6) {
            courses.push({ course_name: intList[6].name, credits: intList[6].credits, category: "輔系選修", tag: `${sTag}輔系`, note: intList[6].description, ruleNote: intList[6].ruleNote });
          } else if (i === 5 && intList.length > 7) {
            courses.push({ course_name: intList[7].name, credits: intList[7].credits, category: "輔系選修", tag: `${sTag}輔系`, note: intList[7].description, ruleNote: intList[7].ruleNote });
          }
        } else {
          // 雙主修：高強度完整修習
          const advList = candidates.advanced;
          if (i < advList.length) {
            const cand = advList[i];
            courses.push({
              course_name: cand.name,
              credits: cand.credits,
              category: cand.type === "必修" ? "雙主修必修" : "雙主修選修",
              tag: `${sTag}雙主修`,
              note: cand.description,
              ruleNote: cand.ruleNote || `★ 官方規章：滿足${sDom}雙主修${candidates.doubleCredits}學分要求`
            });
          }
        }

        let deadlines = ["確認本學期學分符應教務處畢業預審進度"];
        if (tier === "intermediate" && i === 1) {
          deadlines = [`大一下學期 5 月線上送出${sDom}輔系申請，確認符合規章門檻`];
        } else if (tier === "advanced" && i === 1) {
          deadlines = [`大一下學期 5 月線上送出${sDom}雙主修申請表，維持本學期系排前 30%`];
        }

        if (withExchange) {
          if (i === 3) {
            deadlines = ["★ 關鍵考核：暑假前考取語言檢定（托福 85+ / 雅思 6.5+ / 外語證照），符合中大國際處出國交換門檻"];
          } else if (i === 4) {
            deadlines = ["★ 10~11月向中大國際處 OIA 送交海外姐妹校出國交換甄選志願表與面試"];
          } else if (i === 6) {
            deadlines = [
              selectedExchangeSchool
                ? `★ 啟程前往 ${selectedExchangeSchool.name_zh} (${selectedExchangeSchool.country})！${selectedExchangeSchool.official_note}`
                : "★ 啟程赴海外姐妹校交換留學！沉浸國際學術殿堂與跨國人脈網絡"
            ];
          }
        }

        const semHighlight = (withExchange && i === 6)
          ? "大四上遠赴海外名校留學交換！沉浸國際學術環境與建立跨國人脈網絡。"
          : `穩健修習 ${pTag} 核心專業與 ${sTag} 跨域學程`;

        sems.push({
          semester_index: i + 1,
          grade,
          term,
          semester_label: labels[i],
          total_credits: courses.reduce((acc, c) => acc + c.credits, 0),
          courses,
          key_deadlines: deadlines,
          highlight: semHighlight
        });
      }
      return sems;
    };

    const buildCandidatePool = (trackCourses: CandidateCourse[]) => {
      // 1. 本系主修核心必修代表科目 (取自 pCur)
      const primaryItems: CandidateCourse[] = (pCur.intermediate || []).slice(0, 6).map((item) => ({
        name: item.name,
        credits: item.credits,
        type: "必修" as const,
        stage: item.stage,
        description: `【${pDom}核心必修】${item.description}`,
        tag: `${pTag}主修核心`,
        ruleNote: item.ruleNote || `★ 教務處規章：滿足${pDom}本系畢業 128 學分核心必修科目。`,
        track: "primary" as const
      }));

      // 2. 第二專長/輔系/雙主修指定規章科目
      const secondaryItems: CandidateCourse[] = trackCourses.map((item) => ({
        ...item,
        tag: item.tag.includes("輔系") || item.tag.includes("雙主修") ? item.tag : `${sTag}${item.tag}`,
        track: "secondary" as const
      }));

      // 3. 若有出國交換
      const exchangeItems: CandidateCourse[] = withExchange ? [
        {
          name: selectedExchangeSchool ? `海外交換：${selectedExchangeSchool.name_zh}` : "海外姐妹校名校交換研習模組",
          credits: 12,
          type: "交換" as const,
          stage: "大四上",
          description: selectedExchangeSchool ? `赴 ${selectedExchangeSchool.country} 交換研習一學期。${selectedExchangeSchool.official_note}` : "赴海外姐妹名校交換留學，學分回台全數抵免選修",
          tag: "海外交換加值",
          ruleNote: "★ 國際處規章：海外姊妹校全英語授課抵免。",
          track: "exchange" as const
        }
      ] : [];

      return [...primaryItems, ...secondaryItems, ...exchangeItems];
    };

    return {
      basic: {
        tier_id: "basic" as const,
        tier_name: `基礎方案（主修${pTag} 128學分 ＋ ${sTag}探索 8~12學分）`,
        target_summary: `扎實修畢 ${pDom} 完整核心專業 128 學分，課餘無修業負擔修習 8~12 學分 ${sDom} 關鍵選修，維持頂尖 GPA。`,
        total_credits_estimate: withExchange ? 148 : 136,
        weekly_intensity: withExchange ? "平穩充實（含一學期海外交換）" : "平穩充實（每學期約 16~19 學分）",
        semesters: buildSemesters("basic"),
        career_and_advantage: [
          `紮實掌握中央${pTag}核心專業工程與底層技術（128 學分一門不少）`,
          `具備${sTag}跨領域溝通與實務基礎，履歷格外亮眼`,
          "課業負擔適中，有充分時間維持頂尖 GPA 銜接頂尖研究所推甄",
          ...(withExchange ? ["結合大四海外名校出國交換經歷，兼備國際移動力與全球視野"] : [])
        ],
        candidate_courses: buildCandidatePool(candidates.basic)
      },
      intermediate: {
        tier_id: "intermediate" as const,
        tier_name: `中階方案（主修${pTag} 128學分 ＋ ${sTag}輔系 ${candidates.minorCredits} 學分）`,
        target_summary: `在 ${pDom} 完整 128 學分基礎上，額外修畢 ${sDom} 官方「輔系」門檻所需的 ${candidates.minorCredits} 學分指定科目。主修與輔系雙軌並進，${candidates.ruleSummary}`,
        total_credits_estimate: withExchange ? 148 + candidates.minorCredits : 128 + candidates.minorCredits,
        weekly_intensity: withExchange ? "精實挑戰（含一學期海外交換）" : "精實挑戰（每學期約 18~22 學分）",
        semesters: buildSemesters("intermediate"),
        career_and_advantage: [
          `畢業證書正式加註「${sDom}輔系」官方榮銜，跨域專長認證`,
          `兼備${pTag}完整主修必修骨幹與${sTag}核心先修鏈，具備實戰研發能力`,
          "專業技術與跨領域素養兼備，國內外頂尖機構求才首選",
          ...(withExchange ? ["結合大四海外名校出國交換經歷，兼備國際移動力與全球視野"] : [])
        ],
        candidate_courses: buildCandidatePool(candidates.intermediate)
      },
      advanced: {
        tier_id: "advanced" as const,
        tier_name: `高階方案（主修${pTag} 128學分 ╳ ${sTag}雙主修 ${candidates.doubleCredits} 學分）`,
        target_summary: `挑戰雙學士學位（本系 128 學分 ＋ 跨修 ${sDom} ${candidates.doubleCredits} 學分），取得中大「${pDom} ╳ ${sDom}」雙主修學位。兩系核心全數修畢。`,
        total_credits_estimate: withExchange ? 148 + candidates.doubleCredits : 128 + candidates.doubleCredits,
        weekly_intensity: withExchange ? "頂尖卓越（含一學期海外交換）" : "頂尖卓越（每學期約 22~25 學分，需強大自主規劃能力）",
        semesters: buildSemesters("advanced"),
        career_and_advantage: [
          `獲得中央大學「${pDom} ╳ ${sDom}」雙學士學位，全台稀缺雙專長頂尖人才`,
          `${pTag}本系專業完全不妥協，同時具備${sTag}領域精深素養`,
          "直通國內外頂尖名校跨領域研究所推甄或跨國企業核心研發團隊",
          ...(withExchange ? ["結合大四海外名校出國交換經歷，履歷具備高度國際化競爭優勢"] : [])
        ],
        candidate_courses: buildCandidatePool(candidates.advanced)
      }
    };
  };

  // 監聽第二階段交換加值狀態與選定學校：即時動態重算課表
  useEffect(() => {
    if (plans) {
      setPlans(generateRoadmapPlans(userInput, isExchangeEnabled));
    }
  }, [isExchangeEnabled, selectedExchangeSchool]);

  // 點擊「AI 動態生成」: 輸入完 prompt 才會生成三條路線
  const handleGenerate = async (queryText: string = userInput) => {
    if (!queryText.trim()) return;
    setIsLoading(true);
    setSelectedTier(null); // 重設選取狀態，讓使用者主動點擊想看的按鈕

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);

      const res = await fetch("http://localhost:8000/api/v1/roadmap/generate-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryText }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error("API call failed");
      const data = await res.json();
      
      // 確保 candidate_courses 存在
      const localFallback = generateRoadmapPlans(queryText, isExchangeEnabled);
      data.basic = localFallback.basic;
      data.intermediate = localFallback.intermediate;
      data.advanced = localFallback.advanced;

      setPlans(data);
    } catch {
      // 本地智慧引擎毫秒級生成
      const localPlans = generateRoadmapPlans(queryText, isExchangeEnabled);
      setPlans(localPlans);
    } finally {
      setIsLoading(false);
    }
  };

  // 取得目前使用者點擊按鈕後選取的方案數據
  const activePlan = (plans && selectedTier) ? plans[selectedTier] : null;

  const exchangeCardsOpen = isExchangeEnabled;

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* ─── 1. 夢想輸入 ─── */}
      <section className="surface p-5 sm:p-6 flex flex-col gap-4">
        <div>
          <p className="eyebrow">Step 0</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-stone-900">我的夢想，在中央怎麼實現？</h2>
          <p className="mt-1.5 text-sm text-stone-600 leading-relaxed max-w-3xl">
            輸入你想探索的目標或跨域組合（例如：資工＋法文、資管＋雙主修資工、機械＋電機），系統會規劃出基礎、中階、進階三條路線。
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <label className="flex flex-1 items-center gap-2.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-200">
            <Sparkles className="w-4 h-4 text-violet-600 shrink-0" />
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              placeholder="輸入你的夢想（例：想讀資工＋學法文、機械＋電機…）"
              className="w-full bg-transparent text-sm text-stone-900 placeholder-stone-500 focus:outline-none"
            />
          </label>
          <button
            type="button"
            onClick={() => handleGenerate()}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-60 cursor-pointer shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                規劃中…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                生成方案
              </>
            )}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-stone-500">常見目標：</span>
          {presetQueries.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setUserInput(preset);
                handleGenerate(preset);
              }}
              className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs text-stone-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 cursor-pointer"
            >
              {preset}
            </button>
          ))}
        </div>

        {!plans && (
          <div className="flex items-center gap-2 rounded-xl bg-violet-50 px-4 py-3 text-xs text-violet-800">
            <MousePointerClick className="w-4 h-4 shrink-0" />
            輸入你的夢想或點選任一常見目標，按下「生成方案」開始規劃。
          </div>
        )}
      </section>

      {/* ─── 2. 第一階段：選擇主線 ─── */}
      {plans && (
        <section className="flex flex-col gap-3 animate-rise">
          <div>
            <p className="eyebrow">Step 1</p>
            <h3 className="mt-1 text-lg font-bold text-stone-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-violet-600" />
              選擇你的核心學制主線
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">本系單主修／輔系／雙主修，三選一作為大學四年的基底路線</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {TIER_OPTIONS.map((opt) => {
              const active = selectedTier === opt.id;
              const plan = plans[opt.id];
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedTier(opt.id)}
                  aria-pressed={active}
                  className={`relative flex flex-col justify-between rounded-2xl border p-4 text-left transition cursor-pointer ${
                    active
                      ? "border-violet-500 bg-violet-50 shadow-md ring-2 ring-violet-200"
                      : "border-stone-200 bg-white hover:border-violet-300 hover:shadow-sm"
                  }`}
                >
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                        Option {opt.n}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          active ? "bg-violet-600 text-white" : "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {opt.badge}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-stone-900">
                      {plan.tier_name.split("（")[0] || opt.fallback}
                    </h4>
                    <p className="mt-1 text-xs leading-snug text-stone-500">{plan.tier_name}</p>
                  </div>
                  <span
                    className={`mt-3 inline-flex items-center gap-1 text-xs font-semibold ${
                      active ? "text-violet-700" : "text-stone-500"
                    }`}
                  >
                    {active ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        已選為基底路線
                      </>
                    ) : (
                      <>
                        選為基底路線
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {plans && !selectedTier && (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-8 text-center">
          <MousePointerClick className="mx-auto w-6 h-6 text-violet-600" />
          <h3 className="mt-2 text-base font-bold text-stone-900">請先選擇一條核心學制主線</h3>
          <p className="mx-auto mt-1 max-w-lg text-xs leading-relaxed text-stone-500">
            選定後會顯示方案概覽、課程候選名單與四年課表，並可進一步加入出國交換加值方案。
          </p>
        </div>
      )}

      {/* ─── 3. 第二階段：出國交換 ─── */}
      {activePlan && (
        <section className="surface p-5 sm:p-6 animate-rise">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  exchangeCardsOpen ? "bg-violet-600 text-white" : "bg-stone-100 text-stone-500"
                }`}
              >
                <Plane className="w-5 h-5" />
              </span>
              <div>
                <p className="eyebrow">Step 2 · 擴充加值</p>
                <h4 className="mt-1 text-base font-bold text-stone-900">是否考慮參與出國交換計畫？</h4>
                <p className="mt-1 text-xs leading-relaxed text-stone-500 max-w-2xl">
                  交換是可疊加在單主修、輔系或雙主修任一主線上的加值方案。開啟後會在四年課表加入海外交換模組與學分抵免，並標示國際處申請與外語檢定時程。
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
              <span className={`text-xs font-semibold ${exchangeCardsOpen ? "text-violet-700" : "text-stone-500"}`}>
                {exchangeCardsOpen ? "已加入交換加值" : "暫不考慮交換"}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={exchangeCardsOpen}
                aria-label="切換出國交換加值方案"
                onClick={() => setIsExchangeEnabled(!isExchangeEnabled)}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  exchangeCardsOpen ? "bg-violet-600" : "bg-stone-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow transition ${
                    exchangeCardsOpen ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {exchangeCardsOpen && (
            <div className="mt-5 flex flex-col gap-5 border-t border-stone-100 pt-5">
              {/* 動機 */}
              {detectedLanguage && !customMotivationOverride ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-violet-50 px-4 py-3 text-xs text-violet-900">
                  <span className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      偵測到你想學習 <strong>{detectedLanguage}</strong>，已自動鎖定該語言母語國家的姊妹校。
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setCustomMotivationOverride(true)}
                    className="shrink-0 cursor-pointer rounded-full border border-violet-200 bg-white px-3 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100"
                  >
                    改選其他動機
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-stone-700">
                    <Filter className="w-3.5 h-3.5 text-violet-600" />
                    第一步：你的出國交換核心動機
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {MOTIVATION_OPTIONS.map((m) => {
                      const active = exchangeMotivation === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setExchangeMotivation(m.id)}
                          aria-pressed={active}
                          className={`flex flex-col gap-1 rounded-xl border p-3.5 text-left transition cursor-pointer ${
                            active
                              ? "border-violet-500 bg-violet-50 ring-2 ring-violet-200"
                              : "border-stone-200 bg-white hover:border-violet-300"
                          }`}
                        >
                          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                            {m.tag}
                          </span>
                          <span className="text-sm font-bold text-stone-900">{m.title}</span>
                          <span className="text-xs leading-snug text-stone-500">{m.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 子篩選 */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-stone-500">
                  {exchangeMotivation === "language" && "第二步（目標語言）："}
                  {exchangeMotivation === "academic" && "第二步（專業學門）："}
                  {exchangeMotivation === "lifestyle" && "第二步（風格偏好）："}
                </span>
                {exchangeMotivation === "language" &&
                  LANGUAGE_OPTIONS.map((item) => (
                    <FilterChip
                      key={item.val}
                      active={selectedLanguage === item.val}
                      onClick={() => setSelectedLanguage(item.val)}
                    >
                      {item.label}
                    </FilterChip>
                  ))}
                {exchangeMotivation === "academic" &&
                  DISCIPLINE_OPTIONS.map((disc) => (
                    <FilterChip
                      key={disc}
                      active={selectedDiscipline === disc}
                      onClick={() => setSelectedDiscipline(disc)}
                    >
                      {disc}
                    </FilterChip>
                  ))}
                {exchangeMotivation === "lifestyle" &&
                  LIFESTYLE_OPTIONS.map((style) => (
                    <FilterChip
                      key={style.val}
                      active={selectedLifestyle === style.val}
                      onClick={() => setSelectedLifestyle(style.val)}
                    >
                      {style.label}
                    </FilterChip>
                  ))}
              </div>

              {/* 學校結果 */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-stone-700">
                    <GraduationCap className="w-3.5 h-3.5 text-violet-600" />
                    依國際處甄選簡章，精選 {filteredSchools.length} 所目標姊妹校
                  </span>
                  {selectedExchangeSchool && (
                    <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-800">
                      已選定：{selectedExchangeSchool.name_zh}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                  {filteredSchools.map((school) => {
                    const isSelected = selectedExchangeSchool?.id === school.id;
                    let reason = "";
                    if (exchangeMotivation === "language") {
                      reason = `位於「${school.country}」${selectedLanguage}母語生活圈，可全天候沉浸式練習外語。`;
                    } else if (exchangeMotivation === "academic") {
                      reason = `國際處簡章限定「${selectedDiscipline}」相關學院或專案，學分抵免高度契合。`;
                    } else {
                      reason = `符合「${selectedLifestyle}」風格偏好，無嚴苛院系限制，適合深度體驗在地文化。`;
                    }

                    return (
                      <div
                        key={school.id}
                        className={`flex flex-col justify-between gap-3 rounded-xl border p-4 transition ${
                          isSelected
                            ? "border-violet-500 bg-violet-50 ring-2 ring-violet-200"
                            : "border-stone-200 bg-white hover:border-violet-300"
                        }`}
                      >
                        <div>
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1 text-xs font-semibold text-violet-700">
                              <span>{school.flag}</span>
                              <span>{school.country}</span>
                              <span className="text-xs font-normal text-stone-500">({school.region})</span>
                            </span>
                            {school.is_restricted_program && (
                              <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
                                限定學院／專案
                              </span>
                            )}
                          </div>
                          <h5 className="text-sm font-bold leading-snug text-stone-900">{school.name_zh}</h5>
                          {school.name_en && (
                            <p className="text-xs leading-tight text-stone-500">{school.name_en}</p>
                          )}
                          <p className="mt-2 text-xs leading-relaxed text-stone-600">{reason}</p>
                          <div className="mt-2 rounded-lg bg-stone-50 p-2.5 text-xs leading-relaxed text-stone-600">
                            <span className="mb-0.5 block font-semibold text-stone-800">國際處甄選與申請規定</span>
                            {school.official_note}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedExchangeSchool(isSelected ? null : school)}
                          className={`flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                            isSelected
                              ? "bg-violet-600 text-white hover:bg-violet-700"
                              : "border border-violet-200 bg-white text-violet-700 hover:bg-violet-50"
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              已選定（已融入大四課表）
                            </>
                          ) : (
                            <>
                              <ExternalLink className="w-3.5 h-3.5" />
                              選為我的交換目標校
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ─── 4. 方案概覽 ─── */}
      {activePlan && (
        <section className="surface p-5 sm:p-6 flex flex-col gap-4 animate-rise">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div>
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                  目前選定的核心學制主線
                </span>
                {isExchangeEnabled && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700">
                    <Plane className="w-3.5 h-3.5 text-violet-600" />
                    已疊加出國交換
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-stone-900">{activePlan.tier_name}</h3>
            </div>
            <div className="sm:text-right">
              <span className="block text-xs text-stone-500">四年修業學分預估／強度</span>
              <span className="text-base font-bold text-violet-700">
                約 {activePlan.total_credits_estimate} 學分（{activePlan.weekly_intensity}）
              </span>
            </div>
          </div>

          <p className="rounded-xl bg-stone-50 p-4 text-sm leading-relaxed text-stone-700">{activePlan.target_summary}</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {activePlan.career_and_advantage.map((adv, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 rounded-xl border border-stone-200 bg-white p-3.5 text-xs text-stone-700"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 text-violet-600 mt-0.5" />
                <span>{adv}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── 5. 候選課程 ─── */}
      {activePlan && activePlan.candidate_courses && (
        <section className="surface p-5 sm:p-6 flex flex-col gap-4 animate-rise">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900">
                <BookmarkCheck className="w-5 h-5 text-violet-600" />
                課程候選名單
              </h3>
              <p className="mt-0.5 text-xs text-stone-500">
                列出主修學系核心必修與第二專長／輔系指定科目，兩者並行不排擠
              </p>
            </div>
            <div className="flex items-center gap-1 self-start rounded-full bg-stone-100 p-1 text-xs font-semibold sm:self-auto">
              {(
                [
                  ["all", `全部 (${activePlan.candidate_courses.length})`],
                  ["primary", "主修核心"],
                  ["secondary", "第二專長"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setCandidateFilter(id)}
                  className={`cursor-pointer rounded-full px-3.5 py-1.5 transition ${
                    candidateFilter === id
                      ? "bg-white text-violet-700 shadow-sm"
                      : "text-stone-500 hover:text-stone-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activePlan.candidate_courses
              .filter((cand) => {
                if (candidateFilter === "primary")
                  return cand.track === "primary" || cand.tag.includes("主修") || cand.tag.includes("核心");
                if (candidateFilter === "secondary")
                  return cand.track === "secondary" || cand.tag.includes("輔系") || cand.tag.includes("雙主修");
                return true;
              })
              .map((cand, cIdx) => (
                <button
                  type="button"
                  key={cIdx}
                  onClick={() =>
                    handleOpenCourseModal({
                      name: cand.name,
                      credits: cand.credits,
                      type: cand.type,
                      stage: cand.stage,
                      tag: cand.tag,
                      description: cand.description,
                      ruleNote: cand.ruleNote,
                    })
                  }
                  className="group flex cursor-pointer flex-col justify-between rounded-xl border border-stone-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md"
                >
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-1">
                      <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-600">
                        {cand.stage}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                          cand.type === "交換"
                            ? "bg-purple-50 text-purple-700"
                            : cand.type === "檢定"
                            ? "bg-rose-50 text-rose-700"
                            : cand.type === "必修"
                            ? "bg-violet-100 text-violet-800"
                            : "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {cand.type}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold leading-snug text-stone-900 group-hover:text-violet-700">
                      {cand.name}
                    </h4>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-stone-500">{cand.description}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2 text-xs">
                    <span className="text-xs text-stone-500 group-hover:text-violet-600">{cand.tag} · 課綱與規章 ↗</span>
                    <span className="font-bold text-violet-700">{cand.credits} 學分</span>
                  </div>
                </button>
              ))}
          </div>
        </section>
      )}

      {/* ─── 6. 四年課表 ─── */}
      {activePlan && (
        <section className="flex flex-col gap-4 animate-rise">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900">
              <Calendar className="w-5 h-5 text-violet-600" />
              四年動態時序課表
            </h3>
            <p className="mt-0.5 text-xs text-stone-500">
              依【{activePlan.tier_name.split("（")[0]}】排入每學期的修課組合、學分與重要時程
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {activePlan.semesters.map((sem) => (
              <article key={sem.semester_index} className="surface flex flex-col justify-between p-4">
                <div>
                  <div className="mb-3 flex items-center justify-between border-b border-stone-100 pb-3">
                    <div>
                      <span className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
                        Semester {sem.semester_index}
                      </span>
                      <h4 className="text-base font-bold text-stone-900">{sem.semester_label}</h4>
                    </div>
                    <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
                      {sem.total_credits} 學分
                    </span>
                  </div>

                  <p className="mb-3 rounded-lg bg-stone-50 px-3 py-2 text-xs leading-relaxed text-stone-600">
                    {sem.highlight}
                  </p>

                  <div className="mb-4 flex flex-col gap-2">
                    <span className="text-xs font-semibold text-stone-500">當學期排入科目</span>
                    {sem.courses.map((c, cIdx) => {
                      const isExchange = c.tag.includes("交換");
                      const isDouble = c.tag.includes("雙主修");
                      const isMinor = c.tag.includes("輔系");
                      return (
                        <button
                          type="button"
                          key={cIdx}
                          onClick={() =>
                            handleOpenCourseModal({
                              name: c.course_name,
                              credits: c.credits,
                              category: c.category,
                              tag: c.tag,
                              note: c.note,
                              ruleNote: c.ruleNote,
                            })
                          }
                          className={`group flex w-full cursor-pointer flex-col gap-1 rounded-lg border p-2.5 text-left text-xs transition hover:border-violet-300 hover:shadow-sm ${
                            isExchange
                              ? "border-purple-200 bg-purple-50/60"
                              : isDouble || isMinor
                              ? "border-violet-200 bg-violet-50/50"
                              : "border-stone-200 bg-white"
                          }`}
                        >
                          <span className="flex items-center justify-between gap-2 font-semibold text-stone-900">
                            <span className="truncate group-hover:text-violet-700">{c.course_name}</span>
                            <span className="shrink-0 text-stone-500">{c.credits} 學分</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span
                              className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                                isExchange
                                  ? "bg-purple-100 text-purple-800"
                                  : isDouble || isMinor
                                  ? "bg-violet-100 text-violet-800"
                                  : "bg-stone-100 text-stone-600"
                              }`}
                            >
                              {c.tag}
                            </span>
                            <span className="flex-1 truncate text-xs text-stone-500">{c.note}</span>
                            <span className="shrink-0 text-xs text-stone-500 group-hover:text-violet-700">課綱 ↗</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-stone-100 pt-3">
                  <span className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-stone-700">
                    <Clock className="w-3 h-3 text-violet-600" />
                    本學期重要時程
                  </span>
                  <ul className="flex flex-col gap-1">
                    {sem.key_deadlines.map((d, dIdx) => (
                      <li key={dIdx} className="flex items-start gap-1.5 text-xs leading-tight text-stone-600">
                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-violet-400" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ─── 課程詳細彈窗 ─── */}
      {modalCourse?.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-xs"
          onClick={() => setModalCourse(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={modalCourse.name}
            className="surface-raised relative flex max-h-[88vh] w-full max-w-2xl flex-col gap-4 overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="關閉"
              onClick={() => setModalCourse(null)}
              className="absolute right-4 top-4 cursor-pointer rounded-full p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-wrap items-center gap-2 pr-10">
              {modalCourse.courseCode && (
                <span className="rounded-md bg-stone-900 px-2.5 py-1 font-mono text-xs font-semibold text-white">
                  課號：{modalCourse.courseCode}
                </span>
              )}
              <span className="rounded-md bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                {modalCourse.category} · {modalCourse.credits} 學分
              </span>
              {modalCourse.stage && (
                <span className="rounded-md bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600">
                  {modalCourse.stage}
                </span>
              )}
              {modalCourse.tag && (
                <span className="rounded-md bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600">
                  {modalCourse.tag}
                </span>
              )}
            </div>

            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-stone-900">
                {modalCourse.liveData?.course_name_zh || modalCourse.name}
              </h2>
              {modalCourse.liveData?.course_name_en && (
                <p className="mt-0.5 text-xs text-stone-500">{modalCourse.liveData.course_name_en}</p>
              )}
            </div>

            {modalCourse.ruleNote && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900">
                <BadgeCheck className="w-5 h-5 shrink-0 text-amber-600" />
                <div className="flex-1">
                  <span className="mb-0.5 block font-bold">國立中央大學官方修業規章審定</span>
                  <span className="leading-relaxed">{modalCourse.ruleNote}</span>
                </div>
              </div>
            )}

            {modalCourse.isLoading && (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-stone-500">
                <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
                <span className="text-xs">連線中央大學課程資料庫，檢索即時課綱、教室與授課師資…</span>
              </div>
            )}

            {!modalCourse.isLoading && (
              <div className="flex flex-col gap-4 text-xs text-stone-700">
                <div className="grid grid-cols-1 gap-2.5 rounded-xl bg-stone-50 p-3.5 sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-stone-500" />
                    <span>
                      授課教師：<strong className="text-stone-900">{modalCourse.liveData?.teacher || "中央大學專任師資"}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-stone-500" />
                    <span>
                      開課學系：<strong className="text-stone-900">{modalCourse.liveData?.department || "中央大學"}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <MapPin className="w-4 h-4 shrink-0 text-stone-500" />
                    <span>
                      上課時間與教室：
                      <strong className="ml-1 text-stone-900">
                        {modalCourse.liveData?.schedules && modalCourse.liveData.schedules.length > 0
                          ? modalCourse.liveData.schedules
                              .map((s) => `${s.time} (${s.location || "教室排定中"})`)
                              .join("、")
                          : "依教務處最新選課時程公告"}
                      </strong>
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-stone-900">
                    <BookOpen className="w-4 h-4 text-violet-600" />
                    課程目標與內容綱要
                  </h4>
                  <div className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-xl border border-stone-200 bg-white p-3.5 leading-relaxed">
                    {modalCourse.liveData?.objectives ||
                      modalCourse.note ||
                      "具體培養學生該學門之核心理論素養、演算法模型架構與實務專題解題能力。"}
                  </div>
                </div>

                <div>
                  <h4 className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-stone-900">
                    <ListFilter className="w-4 h-4 text-violet-600" />
                    選課資格限制與先修科目鏈
                  </h4>
                  <div className="flex flex-col gap-1.5 rounded-xl bg-stone-50 p-3">
                    {modalCourse.liveData?.distribution_conditions &&
                    modalCourse.liveData.distribution_conditions.length > 0 ? (
                      modalCourse.liveData.distribution_conditions.map((dist, dIdx) => (
                        <div key={dIdx} className="flex items-start gap-2 rounded-lg border border-stone-200 bg-white p-2.5">
                          <span className="mt-0.5 shrink-0 rounded-md bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-800">
                            順位 {dist.priority}
                          </span>
                          <span className="leading-relaxed">{dist.condition}</span>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="flex items-start gap-2 rounded-lg border border-stone-200 bg-white p-2.5">
                          <span className="mt-0.5 shrink-0 rounded-md bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-800">
                            分發保障
                          </span>
                          <span className="leading-relaxed">
                            本系生享有第 1 順位優先選課保障；獲教務處核定之雙主修／輔系生享有第 2 順位保障名額。
                          </span>
                        </div>
                        <div className="flex items-start gap-2 rounded-lg border border-stone-200 bg-white p-2.5">
                          <span className="mt-0.5 shrink-0 rounded-md bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-800">
                            先修建議
                          </span>
                          <span className="leading-relaxed">
                            修習本課程前，建議依序修畢各學期對應之基礎科目鏈，以利銜接中高階專業論述與專題實作。
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-stone-900">
                    <GraduationCap className="w-4 h-4 text-violet-600" />
                    跨域學分採計與畢業抵免規則
                  </h4>
                  <div className="flex flex-col gap-2 rounded-xl bg-stone-50 p-3">
                    <div className="flex items-start gap-2.5 rounded-lg border border-stone-200 bg-white p-2.5">
                      <BadgeCheck className="w-4 h-4 shrink-0 text-violet-600 mt-0.5" />
                      <div>
                        <span className="mb-0.5 block font-bold text-stone-900">
                          {modalCourse.tag?.includes("輔系")
                            ? "輔系指定學分認列"
                            : modalCourse.tag?.includes("雙主修")
                            ? "雙主修學位學分認列"
                            : modalCourse.tag?.includes("交換")
                            ? "海外交換全額抵免"
                            : "主修學系核心學分認列"}
                        </span>
                        <span className="leading-relaxed text-stone-600">
                          {modalCourse.tag?.includes("輔系")
                            ? "本課程修習成績達 60 分（等級制 C- 以上），全額計入該學系輔系規章之最低學分要求。"
                            : modalCourse.tag?.includes("雙主修")
                            ? "本課程為第二專長雙主修核心必備學分，完整修畢全數核發國立中央大學雙學士學位證明書。"
                            : modalCourse.tag?.includes("交換")
                            ? "交換期間於海外姊妹校所修之專業課程，返校填具學分抵免審查表，經系主任核可全數抵免選修學分。"
                            : "本課程計入主修學系 128 學分畢業最低門檻，為本系授予學士學位之骨幹必修科目。"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5 rounded-lg border border-stone-200 bg-white p-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                      <div>
                        <span className="mb-0.5 block font-bold text-stone-900">重疊科目免修與補修原則</span>
                        <span className="leading-relaxed text-stone-600">
                          依中大教務處雙主修／輔系辦法：若主修與輔系有相同必修科目，不得重複採計。學生得以本系科目抵免，但須另補修該系指定之專業選修，以補足輔系／雙主修規章規定之總學分數。
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end border-t border-stone-100 pt-3">
              <button
                type="button"
                onClick={() => setModalCourse(null)}
                className="cursor-pointer rounded-full bg-violet-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-violet-700"
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

// ───────────────────────── 版面用常數與小元件 ─────────────────────────

const TIER_OPTIONS = [
  { id: "basic", n: 1, badge: "本系單主修", fallback: "基礎方案" },
  { id: "intermediate", n: 2, badge: "輔系／跨域學程 (20~24 學分)", fallback: "中階方案" },
  { id: "advanced", n: 3, badge: "雙主修雙學位 (40~60 學分)", fallback: "進階方案" },
] as const;

const MOTIVATION_OPTIONS = [
  { id: "language", tag: "情境 A", title: "🗣️ 語言學習", desc: "精進外語（日、法、德、西班牙語等母語國學校）" },
  { id: "academic", tag: "情境 B", title: "🎓 專業精進", desc: "鑽研特定學門（限定學院或特定 Program）" },
  { id: "lifestyle", tag: "情境 C", title: "🌍 生活體驗", desc: "地區與生活風格探索（不受嚴苛院系限制）" },
] as const;

const LANGUAGE_OPTIONS = [
  { label: "🇫🇷 法語 (法國/比利時)", val: "法語" },
  { label: "🇯🇵 日語 (日本)", val: "日語" },
  { label: "🇩🇪 德語 (德國/瑞士)", val: "德語" },
  { label: "🇪🇸 西班牙語 (西班牙)", val: "西班牙語" },
  { label: "🇺🇸 英語 (美/加/星/港)", val: "英語" },
  { label: "🇰🇷 韓語 (韓國)", val: "韓語" },
];

const DISCIPLINE_OPTIONS = ["資電資訊", "商管學院", "工程機械", "生醫理工", "理學自然", "人文社會", "土木工程", "太空科技"];

const LIFESTYLE_OPTIONS = [
  { label: "🏛️ 歐洲藝文與古典城市", val: "歐洲藝文" },
  { label: "🗽 美洲自由與都會風情", val: "美洲風情" },
  { label: "⛩️ 亞洲生活與繁盛都會", val: "亞洲文化" },
  { label: "❄️ 北歐自然與寧靜生活", val: "北歐自然" },
];

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`cursor-pointer rounded-full border px-3 py-1 text-xs transition ${
        active
          ? "border-violet-600 bg-violet-600 font-semibold text-white"
          : "border-stone-200 bg-white text-stone-600 hover:border-violet-300 hover:text-violet-700"
      }`}
    >
      {children}
    </button>
  );
}
