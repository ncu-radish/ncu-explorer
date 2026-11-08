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
  Building2
} from "lucide-react";
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

  // 具體系所課程候選名單庫
  const getDomainCandidates = (pDom: string, sDom: string) => {
    const pTag = pDom.slice(0, 2);
    const sTag = sDom.slice(0, 2);

    if (sDom.includes("法文") || sDom.includes("法語")) {
      return {
        basic: [
          { name: "初級法語發音與會話 (一)", credits: 2, type: "選修" as const, stage: "大一上", description: "零基礎入門，掌握標準法語發音規則與生活問候", tag: "跨域選修" },
          { name: "初級法語發音與會話 (二)", credits: 2, type: "選修" as const, stage: "大一下", description: "日常生活基礎對話，能進行簡短情境溝通", tag: "跨域選修" },
          { name: "法國日常文化與生活探索", credits: 2, type: "選修" as const, stage: "大二上", description: "認識法國風土人文、飲食藝術與歐盟社會生活", tag: "跨域選修" },
          { name: "實用法語情境對話實習", credits: 2, type: "選修" as const, stage: "大二下", description: "結合旅遊與職場日常情境，無壓力培養第二外語興趣", tag: "跨域選修" }
        ],
        intermediate: [
          { name: "法語語音學與正音", credits: 2, type: "必修" as const, stage: "大一上", description: "輔系核心必修，國際音標精準咬字與連音技巧訓練", tag: "輔系必修" },
          { name: "初級法語文法與習作 (一)", credits: 3, type: "必修" as const, stage: "大一上", description: "輔系核心必修，建構標準法語時態與基本句型結構", tag: "輔系必修" },
          { name: "初級法語文法與習作 (二)", credits: 3, type: "必修" as const, stage: "大一下", description: "複合過去時、未完成過去時之精確解析與段落書寫", tag: "輔系必修" },
          { name: "中級法語語法與寫作 (一)", credits: 3, type: "必修" as const, stage: "大二上", description: "虛擬式、條件式高階文法分析與邏輯論述表達", tag: "輔系必修" },
          { name: "中級法語語法與寫作 (二)", credits: 3, type: "必修" as const, stage: "大二下", description: "中階論說文習作與報章雜誌閱讀", tag: "輔系必修" },
          { name: "法語商業溝通與書信實習", credits: 3, type: "選修" as const, stage: "大二下", description: "跨國商務實務，練習正式法語公文與電子郵件寫作", tag: "輔系選修" },
          { name: "法國文化導論與歐洲當代社會", credits: 3, type: "選修" as const, stage: "大三上", description: "深度剖析當代歐盟體制與法國政經地位", tag: "輔系選修" },
          { name: "法漢雙向日常轉譯技巧", credits: 4, type: "選修" as const, stage: "大三下", description: "掌握外語與母語精準轉譯，滿足輔系 24 學分門檻", tag: "輔系選修" }
        ],
        advanced: [
          { name: "法語語音學與正音實務", credits: 2, type: "必修" as const, stage: "大一上", description: "雙主修基礎必修，建立精確法語語音與朗讀能力", tag: "雙主修必修" },
          { name: "初級法語文法與習作 (一)(二)", credits: 6, type: "必修" as const, stage: "大一全學年", description: "雙主修高強度核心基礎，打底扎實文法架構", tag: "雙主修必修" },
          { name: "初級法語會話與視聽練習", credits: 4, type: "必修" as const, stage: "大一全學年", description: "全法語環境聽力密集訓練，建立直覺口語反應", tag: "雙主修必修" },
          { name: "中級法語語法與寫作 (一)(二)", credits: 6, type: "必修" as const, stage: "大二全學年", description: "嚴謹法語論述架構，深度掌握各類時態與語氣", tag: "雙主修必修" },
          { name: "中級法語聽講會話實習", credits: 4, type: "必修" as const, stage: "大二全學年", description: "模擬法語辯論與學術發表，準備 DELF 檢定", tag: "雙主修必修" },
          { name: "高級法語文選與批判評論", credits: 4, type: "必修" as const, stage: "大三上", description: "閱讀法國名家經典與前沿評論，培養高階閱讀力", tag: "雙主修必修" },
          { name: "法漢科技與經貿雙向翻譯", credits: 4, type: "選修" as const, stage: "大三上", description: "針對科技專利、軟體工程與商業合約之專業翻譯", tag: "雙主修選修" },
          { name: "歐洲聯盟與法國經貿法規專題", credits: 4, type: "選修" as const, stage: "大三下", description: "歐盟科技法規、GDPR 與跨國數位市場研究", tag: "雙主修選修" },
          { name: "DELF B1/B2 法語檢定認證專案", credits: 2, type: "檢定" as const, stage: "大二暑期", description: "★ 關鍵考核：取得國際法語檢定證照，通過出國交換門檻", tag: "門檻認證" },
          { name: "海外名校留學交換研習模組 (ENSEA)", credits: 12, type: "交換" as const, stage: "大四上", description: "遠赴法國國立高等應用電子學院，全英語修習前沿工程", tag: "海外交換" },
          { name: "雙主修跨領域畢業專案發表", credits: 4, type: "必修" as const, stage: "大四下", description: "結合資工技術與法語專業之綜合專案結案評審", tag: "雙主修總整" }
        ]
      };
    }

    // 通用動態候選名單
    return {
      basic: [
        { name: `${sTag}領域基礎入門導論`, credits: 2, type: "選修" as const, stage: "大一上", description: `探索 ${sDom} 核心概念與跨領域應用`, tag: "跨域選修" },
        { name: `${sTag}實務生活應用選修`, credits: 2, type: "選修" as const, stage: "大一下", description: `理解 ${sDom} 於日常與產業中的實踐價值`, tag: "跨域選修" },
        { name: `${sTag}前沿專題講座選修`, credits: 2, type: "選修" as const, stage: "大二上", description: "專家學者產業前瞻議題分享", tag: "跨域選修" },
        { name: `${sTag}跨域專案探索實作`, credits: 2, type: "選修" as const, stage: "大二下", description: "以無修業負擔方式完成輕量跨域成果", tag: "跨域選修" }
      ],
      intermediate: [
        { name: `${sTag}核心專業理論 (一)`, credits: 3, type: "必修" as const, stage: "大一上", description: `滿足 ${sDom} 輔系 24 學分門檻必修科目`, tag: "輔系必修" },
        { name: `${sTag}核心專業理論 (二)`, credits: 3, type: "必修" as const, stage: "大一下", description: `深化 ${sDom} 理論基礎與分析能力`, tag: "輔系必修" },
        { name: `${sTag}專業中階實務研討`, credits: 3, type: "必修" as const, stage: "大二上", description: "個案分析與實務推演訓練", tag: "輔系必修" },
        { name: `${sTag}專業進階分析工具`, credits: 3, type: "必修" as const, stage: "大二下", description: "掌握該領域主流研發與分析技術", tag: "輔系必修" },
        { name: `${sTag}跨領域實務應用模組`, credits: 3, type: "選修" as const, stage: "大三上", description: `結合 ${pTag} 與 ${sTag} 之實務選修`, tag: "輔系選修" },
        { name: `${sTag}輔系專題實作`, credits: 3, type: "選修" as const, stage: "大三下", description: "指導教授帶領之專案成果", tag: "輔系選修" },
        { name: `${sTag}前瞻產業實務研討`, credits: 3, type: "選修" as const, stage: "大四上", description: "產業鏈接與未來趨勢研析", tag: "輔系選修" },
        { name: `${sTag}輔系總整評審`, credits: 3, type: "選修" as const, stage: "大四下", description: "完成全部 24 學分輔系修業審查", tag: "輔系選修" }
      ],
      advanced: [
        { name: `${sTag}專業必修核心基礎 (一)`, credits: 4, type: "必修" as const, stage: "大一上", description: `雙主修指定骨幹必修科目`, tag: "雙主修必修" },
        { name: `${sTag}專業必修核心基礎 (二)`, credits: 4, type: "必修" as const, stage: "大一下", description: `完成第二領域完整先修鏈`, tag: "雙主修必修" },
        { name: `${sTag}中堅專業架構實務 (一)`, credits: 4, type: "必修" as const, stage: "大二上", description: "第二領域核心理論與實驗分析", tag: "雙主修必修" },
        { name: `${sTag}中堅專業架構實務 (二)`, credits: 4, type: "必修" as const, stage: "大二下", description: "高階實作與專案設計", tag: "雙主修必修" },
        { name: `${sTag}高階專案研究與研習`, credits: 4, type: "必修" as const, stage: "大三上", description: "進階學術論文閱讀與研究方法", tag: "雙主修必修" },
        { name: `${sTag}跨國科技與經貿實務`, credits: 4, type: "選修" as const, stage: "大三下", description: "國際化跨領域合作研習", tag: "雙主修選修" },
        { name: "專業證照或語言檢定認證", credits: 2, type: "檢定" as const, stage: "大二暑期", description: "★ 關鍵考核：通過交換留學門檻標準", tag: "門檻認證" },
        { name: "海外姐妹校名校交換研習模組", credits: 12, type: "交換" as const, stage: "大四上", description: "赴海外姐妹名校交換留學，學分回台全數抵免", tag: "海外交換" },
        { name: "雙學士學位跨域總整專案", credits: 4, type: "必修" as const, stage: "大四下", description: `取得中大「${pDom} ╳ ${sDom}」雙學位總整發表`, tag: "雙主修總整" }
      ]
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
      "化材": "化學工程與材料工程學系",
      "土木": "土木工程學系",
      "大氣": "大氣科學學系",
      "太空": "太空科學與工程學系",
      "經濟": "經濟學系",
      "財金": "財務金融學系",
      "數學": "數學系",
      "物理": "物理學系",
      "化學": "化學系",
      "英文": "英美語文學系",
      "中文": "中國文學系",
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
        pDom = parts[0].trim();
        sDom = parts[1].trim();
      }
    }

    return { pDom, sDom };
  };

  // 根據使用者輸入之需求與交換加值設定，動態生成 3 條徹底解耦之學制路線
  const generateRoadmapPlans = (q: string, withExchange: boolean = isExchangeEnabled) => {
    const { pDom, sDom } = parseDomainsFromQuery(q);
    const pTag = pDom.slice(0, 2);
    const sTag = sDom.slice(0, 2);

    const candidates = getDomainCandidates(pDom, sDom);

    const buildSemesters = (tier: string) => {
      const sems: SemesterPlan[] = [];
      const labels = ["大一上學期", "大一下學期", "大二上學期", "大二下學期", "大三上學期", "大三下學期", "大四上學期", "大四下學期"];
      
      const csMajorCourses = [
        { name: "計算機概論與程式設計 (一)", cred: 3, note: "程式邏輯思維與 C++ 實作" },
        { name: "物件導向程式設計 (二)", cred: 3, note: "進階軟體架構與抽象化" },
        { name: "資料結構與演算法分析", cred: 3, note: "樹、圖與經典複雜度運算" },
        { name: "計算機組織與底層架構", cred: 3, note: "指令集、管線化與處理器設計" },
        { name: "作業系統與系統軟體", cred: 3, note: "行程排程、虛擬記憶體與檔案系統" },
        { name: "計算機網路通訊協定", cred: 3, note: "TCP/IP 堆疊與網路安全架構" },
        { name: "專案研究專題 (一)", cred: 1, note: "教授實驗室頂尖前沿專案實作" },
        { name: "專案研究專題 (二)", cred: 2, note: "公開成果展示與結案評審" }
      ];

      for (let i = 0; i < 8; i++) {
        const grade = Math.floor(i / 2) + 1;
        const term = (i % 2) + 1;
        const csItem = csMajorCourses[i];

        const courses: CourseItem[] = [
          { course_name: csItem.name, credits: csItem.cred, category: "必修", tag: `${pTag}核心`, note: csItem.note },
          { course_name: i < 4 ? (i % 2 === 0 ? "微積分與數理基礎" : "離散數學與線性代數") : "進階專業選修模組", credits: 3, category: i < 4 ? "必修" : "選修", tag: `${pTag}專業`, note: "主修不可或缺之專業基石" }
        ];

        if (tier === "basic") {
          if (i < candidates.basic.length) {
            courses.push({
              course_name: candidates.basic[i].name,
              credits: candidates.basic[i].credits,
              category: "選修",
              tag: `${sTag}選修`,
              note: candidates.basic[i].description
            });
          }
        } else if (tier === "intermediate") {
          if (i < candidates.intermediate.length) {
            courses.push({
              course_name: candidates.intermediate[i].name,
              credits: candidates.intermediate[i].credits,
              category: candidates.intermediate[i].type === "必修" ? "輔系必修" : "輔系選修",
              tag: `${sTag}輔系`,
              note: candidates.intermediate[i].description
            });
          }
        } else {
          // 純學制雙主修路線 (不與交換綁定)
          if (i < candidates.advanced.length) {
            courses.push({
              course_name: candidates.advanced[i].name,
              credits: candidates.advanced[i].credits,
              category: candidates.advanced[i].type === "必修" ? "雙主修必修" : "雙主修選修",
              tag: `${sTag}雙主修`,
              note: candidates.advanced[i].description
            });
          }
        }

        // 第二階段加值：若開啟出國交換，在任何主線 (basic / intermediate / advanced) 的大四上 (i === 6) 動態疊加出國交換模組！
        if (withExchange && i === 6) {
          const schoolTitle = selectedExchangeSchool
            ? `海外交換：${selectedExchangeSchool.name_zh} (${selectedExchangeSchool.country}) 研習模組`
            : "海外姐妹校留學交換研習模組 (全英語授課抵免)";
          const schoolNote = selectedExchangeSchool
            ? `赴 ${selectedExchangeSchool.name_zh} 交換研習一學期。${selectedExchangeSchool.official_note}`
            : "赴歐美頂尖姊妹校交換研習一學期，修得學分可全數返校抵免相關選修學分";
          courses.push({
            course_name: schoolTitle,
            credits: 12,
            category: "交換",
            tag: "海外交換加值",
            note: schoolNote
          });
        }

        let deadlines = ["確認本學期學分符應教務處畢業預審進度"];
        if (tier === "intermediate" && i === 1) {
          deadlines = ["大一下學期 5 月線上送出輔系申請，並確認符合先修成績門檻"];
        } else if (tier === "advanced" && i === 1) {
          deadlines = ["大一下學期 5 月線上送出雙主修申請表，維持本學期成績於系排前 30%"];
        }

        if (withExchange) {
          if (i === 3) {
            deadlines = ["★ 關鍵考核：暑假前考取專業語言檢定（如托福 85+ / 雅思 6.5+ / DELF B2），符合中大國際處出國交換門檻"];
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
          : `精準推進 ${pTag} 與 ${sTag} 跨領域學習軌跡`;

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

    const candidatesWithExchange = (cList: CandidateCourse[]) => withExchange ? [
      ...cList,
      { name: "海外姐妹校名校交換研習模組", credits: 12, type: "交換" as const, stage: "大四上", description: "赴歐美姐妹名校交換留學，學分回台全數抵免選修", tag: "海外交換加值" }
    ] : cList;

    return {
      basic: {
        tier_id: "basic" as const,
        tier_name: `基礎方案（主修${pTag} ＋ ${sTag}選修）`,
        target_summary: `扎實修畢 ${pDom} 核心專業 128 學分，課餘無負擔修習 8 學分 ${sDom} 實用選修，維持頂尖 GPA。`,
        total_credits_estimate: withExchange ? 148 : 136,
        weekly_intensity: withExchange ? "平穩充實（含一學期海外交換）" : "平穩充實（每學期約 16~19 學分）",
        semesters: buildSemesters("basic"),
        career_and_advantage: [
          `紮實掌握中央${pTag}核心專業工程與底層技術`,
          `具備${sTag}跨領域溝通與實務基礎，履歷格外亮眼`,
          "課業負擔適中，有充分時間維持頂尖 GPA 銜接頂尖研究所推甄",
          ...(withExchange ? ["結合大四海外名校出國交換經歷，兼備國際移動力與全球視野"] : [])
        ],
        candidate_courses: candidatesWithExchange(candidates.basic)
      },
      intermediate: {
        tier_id: "intermediate" as const,
        tier_name: `中階方案（主修${pTag} ＋ ${sTag}輔系 24 學分）`,
        target_summary: `在 ${pDom} 專業基礎上，額外修畢 ${sDom}「輔系」門檻所需的 24 學分指定課程。`,
        total_credits_estimate: withExchange ? 164 : 152,
        weekly_intensity: withExchange ? "精實挑戰（含一學期海外交換）" : "精實挑戰（每學期約 19~22 學分）",
        semesters: buildSemesters("intermediate"),
        career_and_advantage: [
          `畢業證書正式加註「${sDom}輔系」榮銜，全校跨域標竿`,
          "具備雙向精準轉譯與跨領域溝通實戰能力，勝任跨國科技顧問",
          "專業技術與跨領域素養兼備，國內外頂尖機構求才首選",
          ...(withExchange ? ["結合大四海外名校出國交換經歷，兼備國際移動力與全球視野"] : [])
        ],
        candidate_courses: candidatesWithExchange(candidates.intermediate)
      },
      advanced: {
        tier_id: "advanced" as const,
        tier_name: `進階方案（主修${pTag} ＋ 雙主修 40~60 學分）`,
        target_summary: `高強度雙學士學位挑戰（本系 128 ＋ ${sDom} 40~60 學分），培養全方位的跨領域領導人才。`,
        total_credits_estimate: withExchange ? 192 : 180,
        weekly_intensity: withExchange ? "頂尖卓越（含一學期海外交換）" : "頂尖卓越（每學期約 21~25 學分，需強大自主規劃能力）",
        semesters: buildSemesters("advanced"),
        career_and_advantage: [
          `獲得中央大學「${pDom} ╳ ${sDom}」雙學士學位，全台稀缺雙專長頂尖人才`,
          `兼具${pTag}硬核專業與${sTag}領域精深素養，具備跨領域溝通與專案領導能力`,
          "直通國內外頂尖名校跨領域研究所推甄或跨國企業核心研發團隊",
          ...(withExchange ? ["結合大四海外名校出國交換經歷，履歷具備高度國際化競爭優勢"] : [])
        ],
        candidate_courses: candidatesWithExchange(candidates.advanced)
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

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      {/* Header Banner & 自然語言輸入框 */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg border border-emerald-700/40">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
              <Compass className="w-3.5 h-3.5" />
              Future Map 夢想導航
            </span>
            <span className="text-xs text-emerald-200/70">輸入需求 ➔ 生成三條路線 ➔ 點擊按鈕查看課表與候選課程</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            我的夢想，在中央怎麼實現？
          </h2>
          <p className="text-stone-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            請在下方輸入你想探索的目標或跨域組合（例如：資工＋法文、資工＋半導體、資管＋雙主修資工、機械＋電機）。
            點擊「AI 生成方案」後，系統將為你規劃出基礎、中階、進階三條路線；點擊特定路線按鈕，即可展開查看該路線專屬的課表與課程候選名單！
          </p>

          {/* 自然語言 AI 輸入列 */}
          <div className="mt-2 flex flex-col sm:flex-row gap-2 bg-white/10 p-2 rounded-2xl backdrop-blur-md border border-white/20">
            <div className="flex items-center gap-2 flex-1 px-3 py-1.5 text-white">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                placeholder="輸入你的夢想（例：想讀資工＋學法文、資工＋半導體學程、機械＋電機...）"
                className="w-full bg-transparent placeholder-stone-400 text-xs sm:text-sm focus:outline-none text-white"
              />
            </div>
            <button
              type="button"
              onClick={() => handleGenerate()}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs sm:text-sm transition-all shadow-md shrink-0 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI 規劃中...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  AI 生成方案
                </>
              )}
            </button>
          </div>

          {/* 推薦靈感膠囊 */}
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-xs text-stone-400 font-medium">常見目標靈感：</span>
            {presetQueries.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setUserInput(preset);
                  handleGenerate(preset);
                }}
                className="text-xs px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-stone-300 border border-white/10 transition-colors cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>

          {/* 當尚未生成方案時的引導提示 */}
          {!plans && (
            <div className="mt-3 p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-emerald-200/90 flex items-center gap-2">
              <MousePointerClick className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                請在上方輸入你的跨域夢想或直接點擊任一推薦靈感，按下 <strong>「AI 生成方案」</strong> 開始規劃三條專屬路線！
              </span>
            </div>
          )}

          {/* 生成後的「第一階段：三條核心學制路線切換按鈕（唯一基底，互斥單選）」 */}
          {plans && (
            <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  第一階段（主線決策）：請在三條核心學制路線中，選擇唯一一條作為大學生涯的基底路線
                </span>
                <span className="text-[11px] text-emerald-200/70 font-medium">
                  （本系單主修 / 輔系 / 雙主修 互斥單選）
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 按鈕 1：本系單主修 */}
                <button
                  type="button"
                  onClick={() => setSelectedTier("basic")}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedTier === "basic"
                      ? "bg-emerald-500 text-stone-950 border-emerald-400 font-bold shadow-lg scale-[1.02] ring-2 ring-emerald-300"
                      : "bg-white/10 text-stone-200 border-white/15 hover:bg-white/20"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs uppercase tracking-wider opacity-80">Option 1</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        selectedTier === "basic" ? "bg-stone-950/20 text-stone-950" : "bg-white/20 text-white"
                      }`}>
                        本系單主修
                      </span>
                    </div>
                    <h4 className="text-sm sm:text-base font-bold">
                      {plans.basic.tier_name.split("（")[0] || "基礎方案"}
                    </h4>
                    <p className="text-[11px] mt-1 opacity-90 leading-tight">
                      {plans.basic.tier_name}
                    </p>
                  </div>
                  <div className="mt-3 text-[11px] flex items-center gap-1 opacity-90 font-medium">
                    <span>點選定為基底路線 ➔</span>
                  </div>
                </button>

                {/* 按鈕 2：輔系路線 */}
                <button
                  type="button"
                  onClick={() => setSelectedTier("intermediate")}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedTier === "intermediate"
                      ? "bg-emerald-500 text-stone-950 border-emerald-400 font-bold shadow-lg scale-[1.02] ring-2 ring-emerald-300"
                      : "bg-white/10 text-stone-200 border-white/15 hover:bg-white/20"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs uppercase tracking-wider opacity-80">Option 2</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        selectedTier === "intermediate" ? "bg-stone-950/20 text-stone-950" : "bg-white/20 text-white"
                      }`}>
                        輔系 / 跨域學程 (20~24學分)
                      </span>
                    </div>
                    <h4 className="text-sm sm:text-base font-bold">
                      {plans.intermediate.tier_name.split("（")[0] || "中階方案"}
                    </h4>
                    <p className="text-[11px] mt-1 opacity-90 leading-tight">
                      {plans.intermediate.tier_name}
                    </p>
                  </div>
                  <div className="mt-3 text-[11px] flex items-center gap-1 opacity-90 font-medium">
                    <span>點選定為基底路線 ➔</span>
                  </div>
                </button>

                {/* 按鈕 3：雙主修路線 */}
                <button
                  type="button"
                  onClick={() => setSelectedTier("advanced")}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedTier === "advanced"
                      ? "bg-emerald-500 text-stone-950 border-emerald-400 font-bold shadow-lg scale-[1.02] ring-2 ring-emerald-300"
                      : "bg-white/10 text-stone-200 border-white/15 hover:bg-white/20"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs uppercase tracking-wider opacity-80">Option 3</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        selectedTier === "advanced" ? "bg-stone-950/20 text-stone-950" : "bg-white/20 text-white"
                      }`}>
                        雙主修雙學位 (40~60學分)
                      </span>
                    </div>
                    <h4 className="text-sm sm:text-base font-bold">
                      {plans.advanced.tier_name.split("（")[0] || "進階方案"}
                    </h4>
                    <p className="text-[11px] mt-1 opacity-90 leading-tight">
                      {plans.advanced.tier_name}
                    </p>
                  </div>
                  <div className="mt-3 text-[11px] flex items-center gap-1 opacity-90 font-medium">
                    <span>點選定為基底路線 ➔</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 狀態提示：已生成三條路線，但尚未點選任何按鈕 */}
      {plans && !selectedTier && (
        <div className="bg-white rounded-3xl p-8 border border-dashed border-emerald-300 text-center flex flex-col items-center gap-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <MousePointerClick className="w-6 h-6 animate-bounce" />
          </div>
          <h3 className="text-lg font-bold text-stone-900">
            請先完成【第一階段】：點選上方任一條「核心學制主線」
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 max-w-lg leading-relaxed">
            依據學程規範，請在 <strong>Option 1（本系單主修）</strong>、<strong>Option 2（輔系 / 跨域學程）</strong> 或 <strong>Option 3（雙主修）</strong> 中，選擇唯一一條作為大學四年基底主線。確認主線後，將自動開啟【第二階段：出國交換擴充加值方案】！
          </p>
        </div>
      )}

      {/* ================================================================ */}
      {/* 第二階段（擴充加值）：是否考慮參與出國交換計畫？（徹底解耦之 Toggle） */}
      {/* ================================================================ */}
      {activePlan && (
        <div
          className={`rounded-3xl p-5 sm:p-6 border transition-all ${
            isExchangeEnabled
              ? "bg-gradient-to-r from-sky-950 via-indigo-950 to-slate-900 border-sky-400/50 shadow-md text-white animate-fadeIn"
              : "bg-white border-stone-200 shadow-xs text-stone-900"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                  isExchangeEnabled
                    ? "bg-sky-500 text-stone-950 font-bold shadow-md shadow-sky-500/30"
                    : "bg-stone-100 text-stone-600"
                }`}
              >
                <Plane className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span
                    className={`text-[11px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                      isExchangeEnabled
                        ? "bg-sky-400/20 text-sky-300 border border-sky-400/40"
                        : "bg-stone-100 text-stone-600 border border-stone-200"
                    }`}
                  >
                    第二階段（擴充加值方案）
                  </span>
                  <span className="text-[11px] text-sky-500 font-semibold">
                    ★ 徹底解耦：可自由疊加於「單主修」、「輔系」或「雙主修」任一主線
                  </span>
                </div>
                <h4 className={`text-base sm:text-lg font-bold ${isExchangeEnabled ? "text-white" : "text-stone-900"}`}>
                  是否考慮參與出國交換計畫？
                </h4>
                <p className={`text-xs mt-1 leading-relaxed max-w-2xl ${isExchangeEnabled ? "text-sky-100/80" : "text-stone-500"}`}>
                  出國交換被定位為<strong>可自由疊加的加值方案</strong>，絕非與學制平行的互斥選項。開啟後將於四年課表中加入海外名校交換模組與學分抵免機制，並標示中大國際處 OIA 申請與外語檢定關鍵時程。
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
              <span className={`text-xs font-bold ${isExchangeEnabled ? "text-sky-300 font-black" : "text-stone-500"}`}>
                {isExchangeEnabled ? "已加入交換加值" : "暫不考慮交換"}
              </span>
              <button
                type="button"
                onClick={() => setIsExchangeEnabled(!isExchangeEnabled)}
                className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isExchangeEnabled ? "bg-sky-500" : "bg-stone-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isExchangeEnabled ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 當開啟出國交換加值時：展開基於使用者動機的智慧交換學校篩選器 (116.md) */}
          {isExchangeEnabled && (
            <div className="mt-5 pt-5 border-t border-sky-400/20 flex flex-col gap-4 animate-fadeIn">
              {/* 第一步：意圖預判與動機詢問 */}
              {detectedLanguage && !customMotivationOverride ? (
                <div className="bg-sky-500/20 border border-sky-400/40 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-300 shrink-0" />
                    <span>
                      <strong>【情境 A：自動鎖定】</strong> 偵測到你的外語學習意圖（<strong>{detectedLanguage}</strong>），已主動為你跳過動機詢問，直接鎖定母語為 <strong>{detectedLanguage}</strong> 之國家姊妹校！
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomMotivationOverride(true)}
                    className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-sky-200 hover:text-white transition-colors cursor-pointer shrink-0 text-[11px] font-medium"
                  >
                    探索其他動機（專業/生活）➔
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-sky-200 font-bold flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5" />
                    第一步：請選擇你的出國交換「核心動機」（情境 A / B / C）：
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setExchangeMotivation("language")}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                        exchangeMotivation === "language"
                          ? "bg-sky-500 text-stone-950 font-bold border-sky-300 shadow-md ring-2 ring-sky-300/40"
                          : "bg-white/10 text-stone-300 border-white/15 hover:bg-white/20"
                      }`}
                    >
                      <span className="text-[10px] uppercase tracking-wider opacity-80">情境 A</span>
                      <span className="text-sm font-bold flex items-center gap-1.5">
                        🗣️ 語言學習
                      </span>
                      <span className="text-[11px] opacity-85 leading-tight">
                        精進外語（日語、法語、德語、西班牙語等母語國學校）
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setExchangeMotivation("academic")}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                        exchangeMotivation === "academic"
                          ? "bg-sky-500 text-stone-950 font-bold border-sky-300 shadow-md ring-2 ring-sky-300/40"
                          : "bg-white/10 text-stone-300 border-white/15 hover:bg-white/20"
                      }`}
                    >
                      <span className="text-[10px] uppercase tracking-wider opacity-80">情境 B</span>
                      <span className="text-sm font-bold flex items-center gap-1.5">
                        🎓 專業精進 / 學術深造
                      </span>
                      <span className="text-[11px] opacity-85 leading-tight">
                        鑽研特定學門（備註限定學院或特定 Program）
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setExchangeMotivation("lifestyle")}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                        exchangeMotivation === "lifestyle"
                          ? "bg-sky-500 text-stone-950 font-bold border-sky-300 shadow-md ring-2 ring-sky-300/40"
                          : "bg-white/10 text-stone-300 border-white/15 hover:bg-white/20"
                      }`}
                    >
                      <span className="text-[10px] uppercase tracking-wider opacity-80">情境 C</span>
                      <span className="text-sm font-bold flex items-center gap-1.5">
                        🌍 生活體驗 / 文化探索
                      </span>
                      <span className="text-[11px] opacity-85 leading-tight">
                        地區與生活風格探索（跳過嚴苛院系限制審查）
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* 第二步：子篩選條件（語言 / 專業學門 / 生活風格） */}
              <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 flex flex-col gap-2">
                {exchangeMotivation === "language" && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-sky-200 font-medium">第二步（目標語言）：</span>
                    {[
                      { label: "🇫🇷 法語 (法國/比利時)", val: "法語" },
                      { label: "🇯🇵 日語 (日本)", val: "日語" },
                      { label: "🇩🇪 德語 (德國/瑞士)", val: "德語" },
                      { label: "🇪🇸 西班牙語 (西班牙)", val: "西班牙語" },
                      { label: "🇺🇸 英語 (美/加/星/港)", val: "英語" },
                      { label: "🇰🇷 韓語 (韓國)", val: "韓語" }
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => setSelectedLanguage(item.val)}
                        className={`text-xs px-3 py-1 rounded-xl border transition-all cursor-pointer ${
                          selectedLanguage === item.val
                            ? "bg-sky-400 text-stone-950 font-bold border-sky-300 shadow-sm"
                            : "bg-white/10 text-stone-300 border-white/15 hover:bg-white/20"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}

                {exchangeMotivation === "academic" && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-sky-200 font-medium">第二步（專業學門）：</span>
                    {["資電資訊", "商管學院", "工程機械", "生醫理工", "理學自然", "人文社會", "土木工程", "太空科技"].map((disc) => (
                      <button
                        key={disc}
                        type="button"
                        onClick={() => setSelectedDiscipline(disc)}
                        className={`text-xs px-3 py-1 rounded-xl border transition-all cursor-pointer ${
                          selectedDiscipline === disc
                            ? "bg-sky-400 text-stone-950 font-bold border-sky-300 shadow-sm"
                            : "bg-white/10 text-stone-300 border-white/15 hover:bg-white/20"
                        }`}
                      >
                        {disc}
                      </button>
                    ))}
                  </div>
                )}

                {exchangeMotivation === "lifestyle" && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-sky-200 font-medium">第二步（風格偏好）：</span>
                    {[
                      { label: "🏛️ 歐洲藝文與古典城市", val: "歐洲藝文" },
                      { label: "🗽 美洲自由與都會風情", val: "美洲風情" },
                      { label: "⛩️ 亞洲生活與繁盛都會", val: "亞洲文化" },
                      { label: "❄️ 北歐自然與寧靜生活", val: "北歐自然" }
                    ].map((style) => (
                      <button
                        key={style.val}
                        type="button"
                        onClick={() => setSelectedLifestyle(style.val)}
                        className={`text-xs px-3 py-1 rounded-xl border transition-all cursor-pointer ${
                          selectedLifestyle === style.val
                            ? "bg-sky-400 text-stone-950 font-bold border-sky-300 shadow-sm"
                            : "bg-white/10 text-stone-300 border-white/15 hover:bg-white/20"
                        }`}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 第三步：結果呈現（附帶明確推薦理由與 116.md 官方規範） */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-200 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5" />
                    第三步：依據《116.md》甄選名冊，共精選推薦 {filteredSchools.length} 所目標姊妹校：
                  </span>
                  {selectedExchangeSchool && (
                    <span className="text-[11px] text-emerald-300 font-bold bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
                      已選定：{selectedExchangeSchool.name_zh}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
                  {filteredSchools.map((school) => {
                    const isSelected = selectedExchangeSchool?.id === school.id;
                    let recommendationReason = "";
                    if (exchangeMotivation === "language") {
                      recommendationReason = `🎯 語言意圖推薦：位於「${school.country}」${selectedLanguage}母語生活圈，全天候沉浸式外語聽說與跨文化實踐。`;
                    } else if (exchangeMotivation === "academic") {
                      recommendationReason = `🎓 專業精進推薦：中央 116.md 官方備註特別限定「${selectedDiscipline}」相關學院或專案，學分抵免高度契合。`;
                    } else {
                      recommendationReason = `🌍 生活體驗推薦：符合「${selectedLifestyle}」風格偏好，無嚴苛院系限制，深度探索在地人文與校園生活。`;
                    }

                    return (
                      <div
                        key={school.id}
                        className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2.5 ${
                          isSelected
                            ? "bg-emerald-950/80 border-emerald-400 text-white shadow-lg ring-1 ring-emerald-300"
                            : "bg-white/10 border-white/15 text-white hover:bg-white/15"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-bold text-sky-300 flex items-center gap-1">
                              <span>{school.flag}</span>
                              <span>{school.country}</span>
                              <span className="text-stone-400 text-[10px]">({school.region})</span>
                            </span>
                            {school.is_restricted_program && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 font-medium">
                                限定學院/專案
                              </span>
                            )}
                          </div>

                          <h5 className="font-bold text-sm sm:text-base leading-snug">
                            {school.name_zh}
                          </h5>
                          {school.name_en && (
                            <p className="text-[11px] text-stone-300 opacity-80 leading-tight">
                              {school.name_en}
                            </p>
                          )}

                          {/* 推薦理由 Badge */}
                          <div className="mt-2 p-2 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-[11px] text-emerald-200 leading-relaxed">
                            {recommendationReason}
                          </div>

                          {/* 116.md 官方備註與申請門檻 */}
                          <div className="mt-1.5 text-[11px] text-stone-300 opacity-90 leading-relaxed bg-black/20 p-2 rounded-xl">
                            <span className="font-bold text-amber-300 block mb-0.5">📌 116.md 官方申請規定：</span>
                            {school.official_note}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedExchangeSchool(isSelected ? null : school)}
                          className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            isSelected
                              ? "bg-emerald-500 text-stone-950 shadow-md"
                              : "bg-sky-500/80 hover:bg-sky-400 text-stone-950"
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              已選定此校（已同步融入大四課表）
                            </>
                          ) : (
                            <>
                              <ExternalLink className="w-3.5 h-3.5" />
                              選定為我的出國交換目標校 ➔
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
        </div>
      )}

      {/* 點擊特定按鈕後：展開該路線專屬之「方案概覽」 */}
      {activePlan && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-xs flex flex-col gap-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  目前選定之核心學制主線
                </span>
                {isExchangeEnabled && (
                  <span className="text-xs font-bold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-200 flex items-center gap-1 animate-fadeIn">
                    <Plane className="w-3.5 h-3.5 text-sky-600" />
                    已疊加出國交換加值方案
                  </span>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-stone-900">
                {activePlan.tier_name}
              </h3>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs text-stone-500 block">四年修業學分預估 / 強度</span>
              <span className="text-base sm:text-lg font-black text-emerald-700">
                約 {activePlan.total_credits_estimate} 學分（{activePlan.weekly_intensity}）
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-stone-700 leading-relaxed bg-stone-50 p-4 rounded-2xl border border-stone-100">
            {activePlan.target_summary}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {activePlan.career_and_advantage.map((adv, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-xs text-stone-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{adv}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 點擊特定按鈕後：展開該路線該選的「課程候選名單 (Candidate Courses)」 */}
      {activePlan && activePlan.candidate_courses && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-amber-200 shadow-xs flex flex-col gap-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-amber-100">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-stone-900 flex items-center gap-2">
                <BookmarkCheck className="w-5 h-5 text-amber-600" />
                該路線應選之「課程候選名單」
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                {selectedTier === "advanced"
                  ? "為達成雙主修學位與海外交換資格，建議優先納入修習之重要候選科目"
                  : selectedTier === "intermediate"
                  ? "為取得輔系資格 (24 學分門檻)，建議優先排入之核心與選修候選科目"
                  : "無修業負擔之自由興趣探索候選科目"}
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-900">
              共 {activePlan.candidate_courses.length} 門候選科目
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activePlan.candidate_courses.map((cand, cIdx) => (
              <div
                key={cIdx}
                className="p-3.5 rounded-2xl bg-amber-50/40 border border-amber-200/80 flex flex-col justify-between hover:bg-amber-50/80 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-200/90 text-amber-950">
                      {cand.stage}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                      cand.type === "交換"
                        ? "bg-purple-100 text-purple-900"
                        : cand.type === "檢定"
                        ? "bg-rose-100 text-rose-900"
                        : cand.type === "必修"
                        ? "bg-amber-300 text-amber-950"
                        : "bg-white text-stone-700 border border-stone-200"
                    }`}>
                      {cand.type}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-stone-900 leading-snug">
                    {cand.name}
                  </h4>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    {cand.description}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-amber-200/50 flex items-center justify-between text-xs">
                  <span className="text-stone-400 font-medium text-[11px]">{cand.tag}</span>
                  <span className="font-black text-amber-800">{cand.credits} 學分</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 點擊特定按鈕後：展開該路線專屬的「四年動態時序課表 (8 個學期卡片)」 */}
      {activePlan && (
        <div className="flex flex-col gap-4 animate-fadeIn">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-stone-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              專屬四年動態時序課表（大一至大四 8 學期）
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              依【{activePlan.tier_name.split("（")[0]}】排入之每學期具體修課組合、學分數與重要時程節點
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {activePlan.semesters.map((sem) => (
              <div
                key={sem.semester_index}
                className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />

                <div>
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-stone-100">
                    <div>
                      <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                        Semester {sem.semester_index}
                      </span>
                      <h4 className="text-base font-bold text-stone-900">
                        {sem.semester_label}
                      </h4>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {sem.total_credits} 學分
                    </span>
                  </div>

                  <div className="text-xs font-medium text-emerald-950 bg-emerald-50/60 p-2 rounded-xl mb-3 border border-emerald-100">
                    ✨ {sem.highlight}
                  </div>

                  <div className="flex flex-col gap-2 mb-4">
                    <span className="text-[11px] font-bold text-stone-400">當學期排入科目</span>
                    {sem.courses.map((c, cIdx) => (
                      <div
                        key={cIdx}
                        className={`p-2.5 rounded-xl border flex flex-col gap-1 text-xs transition-all ${
                          c.tag.includes("交換")
                            ? "bg-purple-50/80 border-purple-300 text-purple-950"
                            : c.tag.includes("雙主修")
                            ? "bg-amber-50/90 border-amber-300 text-amber-950 ring-1 ring-amber-300/50"
                            : c.tag.includes("輔系")
                            ? "bg-amber-50/70 border-amber-200 text-amber-900"
                            : "bg-stone-50 border-stone-100 text-stone-900"
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span className="truncate pr-1">{c.course_name}</span>
                          <span className="shrink-0 text-stone-600 font-bold">
                            {c.credits} 學分
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-sm font-bold ${
                            c.tag.includes("交換")
                              ? "bg-purple-200 text-purple-900"
                              : c.tag.includes("雙主修")
                              ? "bg-amber-300/80 text-amber-950"
                              : c.tag.includes("輔系")
                              ? "bg-amber-200/80 text-amber-900"
                              : "bg-stone-200 text-stone-700"
                          }`}>
                            {c.tag}
                          </span>
                          <span className="text-[10px] text-stone-400">•</span>
                          <span className="text-[11px] text-stone-500 truncate">{c.note}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100">
                  <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mb-1">
                    <Clock className="w-3 h-3" />
                    本學期重要時程 (To-Do)
                  </span>
                  <ul className="flex flex-col gap-1">
                    {sem.key_deadlines.map((d, dIdx) => (
                      <li
                        key={dIdx}
                        className="text-[11px] text-stone-600 flex items-start gap-1 leading-tight"
                      >
                        <span className="text-rose-500 mt-0.5">•</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
