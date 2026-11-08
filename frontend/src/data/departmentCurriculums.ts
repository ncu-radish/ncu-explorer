export interface CandidateCourseItem {
  name: string;
  credits: number;
  type: "必修" | "選修" | "交換" | "檢定";
  stage: string;
  description: string;
  tag: string;
  ruleNote?: string;
}

export interface DepartmentCurriculum {
  name: string;
  tag: string;
  code: string;
  minorCredits: number;
  doubleCredits: number;
  ruleSummary: string;
  basic: CandidateCourseItem[];
  intermediate: CandidateCourseItem[];
  advanced: CandidateCourseItem[];
  defaultMajorSchedule: Array<{ name: string; cred: number; note: string }>;
}

export const DEPARTMENT_CURRICULUMS: Record<string, DepartmentCurriculum> = {
  // ==========================================
  // 1. 資訊工程學系 (CE)
  // ==========================================
  "資訊工程學系": {
    name: "資訊工程學系",
    tag: "資工",
    code: "CE",
    minorCredits: 28,
    doubleCredits: 60,
    ruleSummary: "★ 官方規章：滿足資訊工程學系輔系 28 學分核心必修（涵蓋計算機概論、程式設計、資料結構、演算法、作業系統與計算機組織）。",
    basic: [
      { name: "CE1001 計算機概論", credits: 3, type: "選修", stage: "大一上", description: "計算機底層邏輯、二進位數制、作業系統導論與演算法初探。", tag: "資工探索" },
      { name: "CE1003 計算機實習Ⅰ", credits: 3, type: "選修", stage: "大一下", description: "C/C++ 核心語法、指標運算、記憶體管理與模組化程式架構。", tag: "資工探索" },
      { name: "CE2002 資料結構", credits: 3, type: "選修", stage: "大二上", description: "鏈結串列、堆疊佇列、二元搜尋樹與圖形走訪演算法實作。", tag: "資工探索" },
      { name: "CE3005 演算法", credits: 3, type: "選修", stage: "大二下", description: "分治法、貪婪法、動態規劃與 NP 完整性問題核心思維。", tag: "資工探索" }
    ],
    intermediate: [
      { name: "CE1001 計算機概論", credits: 3, type: "必修", stage: "大一上", description: "輔系指定必修：計算思維、軟體工程基礎與資訊系統概念。", tag: "資工必修", ruleNote: "★ 官方規章：資工輔系 28 學分核心必修科目。" },
      { name: "CE1003 計算機實習Ⅰ", credits: 3, type: "必修", stage: "大一下", description: "輔系指定必修：深入資料型態、遞迴、動態記憶體配置與檔案處理。", tag: "資工必修", ruleNote: "★ 官方規章：資工輔系指定必修科目。" },
      { name: "CE2002 資料結構", credits: 3, type: "必修", stage: "大二上", description: "輔系指定必修：紅黑樹、AVL 平衡樹、最短路徑與拓撲排序。", tag: "資工必修", ruleNote: "★ 官方規章：資工輔系指定必修科目。" },
      { name: "CE3005 演算法", credits: 3, type: "必修", stage: "大二下", description: "輔系指定必修：高階演算法分析、近似演算法與複雜度證明。", tag: "資工必修", ruleNote: "★ 官方規章：資工輔系指定必修科目。" },
      { name: "CE3002 作業系統", credits: 3, type: "必修", stage: "大三上", description: "輔系指定必修：行程同步、死結處理、虛擬記憶體分頁與檔案系統。", tag: "資工必修", ruleNote: "★ 官方規章：資工輔系指定必修科目。" },
      { name: "CE3001 計算機組織", credits: 3, type: "必修", stage: "大三下", description: "輔系指定必修：RISC-V/MIPS 指令集、管線化技術與快取記憶體設計。", tag: "資工必修", ruleNote: "★ 官方規章：資工輔系指定必修科目。" },
      { name: "CE3007 計算機網路", credits: 3, type: "選修", stage: "大四上", description: "輔系推薦選修：TCP/IP 堆疊、封包轉發路由演算法與網路資安基礎。", tag: "資工選修" }
    ],
    advanced: [
      { name: "CE1001 計算機概論", credits: 3, type: "必修", stage: "大一上", description: "雙主修基礎必修：計算機科學體系全面打底。", tag: "資工雙主修" },
      { name: "CE1003 計算機實習Ⅰ", credits: 3, type: "必修", stage: "大一下", description: "雙主修基礎必修：高效能 C/C++ 系統級程式開發。", tag: "資工雙主修" },
      { name: "CE1006 工程數學", credits: 3, type: "必修", stage: "大一下", description: "雙主修核心必修：線性代數空間轉換、微分方程與離散結構。", tag: "資工雙主修" },
      { name: "CE2002 資料結構", credits: 3, type: "必修", stage: "大二上", description: "雙主修核心必修：樹狀、圖形結構與自平衡演算法完整精通。", tag: "資工雙主修" },
      { name: "CE3005 演算法", credits: 3, type: "必修", stage: "大二下", description: "雙主修核心必修：最優化問題求解、動態規劃與網路流模型。", tag: "資工雙主修" },
      { name: "CE3002 作業系統", credits: 3, type: "必修", stage: "大三上", description: "雙主修核心必修：Linux 核心內部排程、記憶體映射與多執行緒競態。", tag: "資工雙主修" },
      { name: "CE3001 計算機組織", credits: 3, type: "必修", stage: "大三下", description: "雙主修核心必修：處理器分支預測、超純量架構與硬體加速器設計。", tag: "資工雙主修" },
      { name: "CE3007 計算機網路", credits: 3, type: "必修", stage: "大四上", description: "雙主修核心必修：分散式系統協同運作、雲端網路與密碼學應用。", tag: "資工雙主修" },
      { name: "CE3008 專題實驗 I", credits: 3, type: "必修", stage: "大四下", description: "雙主修總整發表：前沿 AI 系統、雲端分散式服務公開結案發表。", tag: "資工雙主修" }
    ],
    defaultMajorSchedule: [
      { name: "CE1001 計算機概論", cred: 3, note: "程式邏輯思維與二進位體系" },
      { name: "CE1003 計算機實習Ⅰ", cred: 3, note: "C/C++ 記憶體與指標架構" },
      { name: "CE2002 資料結構", cred: 3, note: "樹狀與圖形演算法分析實作" },
      { name: "CE3005 演算法", cred: 3, note: "動態規劃與最優化複雜度證明" },
      { name: "CE3002 作業系統", cred: 3, note: "行程排程、虛擬記憶體與並行機制" },
      { name: "CE3001 計算機組織", cred: 3, note: "CPU 管線化與處理器指令集架構" },
      { name: "CE3007 計算機網路", cred: 3, note: "TCP/IP 協定通訊與安全架構" },
      { name: "CE3008 專題實驗 I", cred: 3, note: "教授實驗室頂尖前沿專案實作成果發表" }
    ]
  },

  // ==========================================
  // 2. 資訊管理學系 (IM)
  // ==========================================
  "資訊管理學系": {
    name: "資訊管理學系",
    tag: "資管",
    code: "IM",
    minorCredits: 20,
    doubleCredits: 40,
    ruleSummary: "★ 官方規章：滿足資訊管理學系輔系 20 學分必修科目要求，涵蓋資管導論、物件導向、資料庫與管理資訊系統。",
    basic: [
      { name: "IM1018 資訊管理導論", credits: 3, type: "選修", stage: "大一上", description: "探索數位轉型、企業架構與現代企業 IT 策略應用。", tag: "資管探索" },
      { name: "IM1013 初階程式設計", credits: 3, type: "選修", stage: "大一下", description: "掌握 Java 核心語法、類別封裝、繼承多型與系統設計。", tag: "資管探索" },
      { name: "IM2002 資料庫管理", credits: 3, type: "選修", stage: "大二上", description: "關聯式資料庫理論、SQL 查詢優化、ER 模型與交易安全。", tag: "資管探索" },
      { name: "IM4048 管理資訊系統", credits: 3, type: "選修", stage: "大二下", description: "雲端運算、企業 ERP 整合、大數據決策與商務智能應用。", tag: "資管探索" }
    ],
    intermediate: [
      { name: "IM1018 資訊管理導論", credits: 3, type: "必修", stage: "大一上", description: "輔系指定必修：建立 IT 與企業商業策略之核心連結思維。", tag: "資管必修", ruleNote: "★ 官方規章：資管輔系 20 學分核心必修科目。" },
      { name: "IM1013 初階程式設計", credits: 3, type: "必修", stage: "大一下", description: "輔系指定必修：物件導向軟體架構與進階實務開發。", tag: "資管必修", ruleNote: "★ 官方規章：資管輔系指定必修科目。" },
      { name: "IM2002 資料庫管理", credits: 3, type: "必修", stage: "大二上", description: "輔系指定必修：關聯式資料庫綱要設計、正規化與 SQL 實務。", tag: "資管必修", ruleNote: "★ 官方規章：資管輔系指定必修科目。" },
      { name: "IM4048 管理資訊系統", credits: 3, type: "必修", stage: "大二下", description: "輔系指定必修：企業資訊系統整合、雲端架構與商業決策分析。", tag: "資管必修", ruleNote: "★ 官方規章：資管輔系指定必修科目。" },
      { name: "IM2037 演算法", credits: 3, type: "選修", stage: "大三上", description: "輔系推薦選修：經典演算法設計、複雜度分析與動態規劃。", tag: "資管選修" },
      { name: "CE3007 計算機網路", credits: 3, type: "選修", stage: "大三下", description: "輔系推薦選修：TCP/IP 協定通訊協定、雲端網路與資訊安全。", tag: "資管選修" },
      { name: "IM2046 作業系統", credits: 3, type: "選修", stage: "大四上", description: "輔系推薦選修：UML 塑模、軟體工程生命週期與專案管理實務。", tag: "資管選修" }
    ],
    advanced: [
      { name: "IM1018 資訊管理導論", credits: 3, type: "必修", stage: "大一上", description: "雙主修基礎必修：企業資訊架構與數位策略規劃。", tag: "資管雙主修" },
      { name: "IM1013 初階程式設計", credits: 3, type: "必修", stage: "大一下", description: "雙主修基礎必修：進階物件導向設計模式與系統實作。", tag: "資管雙主修" },
      { name: "IM2002 資料庫管理", credits: 3, type: "必修", stage: "大二上", description: "雙主修核心必修：關聯式資料庫引擎、NoSQL 與分散式存取。", tag: "資管雙主修" },
      { name: "IM4048 管理資訊系統", credits: 3, type: "必修", stage: "大二下", description: "雙主修核心必修：大數據分散式分析與企業雲端策略。", tag: "資管雙主修" },
      { name: "IM2037 演算法", credits: 3, type: "必修", stage: "大三上", description: "雙主修必修骨幹：計算複雜度理論與進階演算法設計。", tag: "資管雙主修" },
      { name: "IM2011 資料與檔案結構", credits: 3, type: "必修", stage: "大三上", description: "雙主修必修：樹狀結構、圖形走訪、雜湊表與平衡樹。", tag: "資管雙主修" },
      { name: "CE3007 計算機網路", credits: 3, type: "必修", stage: "大三下", description: "雙主修必修：網路協定設計、Socket 程式設計與網路安全。", tag: "資管雙主修" },
      { name: "IM2046 作業系統", credits: 3, type: "必修", stage: "大四上", description: "雙主修必修：企業大型專案系統分析、架構規劃與敏捷開發。", tag: "資管雙主修" },
      { name: "IM3028 資訊系統發展專題Ｉ", credits: 3, type: "必修", stage: "大四下", description: "雙主修總整必修：跨領域企業系統公開發表與結案審查。", tag: "資管雙主修" }
    ],
    defaultMajorSchedule: [
      { name: "IM1018 資訊管理導論", cred: 3, note: "現代企業資訊系統核心架構" },
      { name: "IM1013 初階程式設計", cred: 3, note: "Java 軟體工程實務開發" },
      { name: "IM2002 資料庫管理", cred: 3, note: "SQL 關聯式架構與資料分析" },
      { name: "IM2037 演算法", cred: 3, note: "演算法設計分析與複雜度" },
      { name: "IM2011 資料與檔案結構", cred: 3, note: "樹、圖與高效記憶體資料結構" },
      { name: "CE3007 計算機網路", cred: 3, note: "TCP/IP 堆疊與通訊架構" },
      { name: "IM4048 管理資訊系統", cred: 3, note: "大數據雲端商務決策支援" },
      { name: "IM3028 資訊系統發展專題Ｉ", cred: 3, note: "企業資訊系統綜合成果審查" }
    ]
  },

  // ==========================================
  // 3. 電機工程學系 (EE)
  // ==========================================
  "電機工程學系": {
    name: "電機工程學系",
    tag: "電機",
    code: "EE",
    minorCredits: 20,
    doubleCredits: 40,
    ruleSummary: "★ 官方規章：滿足電機工程學系輔系 20 學分要求（含電路學、數位邏輯、電子學及電磁學）。",
    basic: [
      { name: "EE1003 電路學 I", credits: 3, type: "選修", stage: "大一上", description: "基本電路定律、網目與節點分析法、運算放大器基本電路。", tag: "電機探索" },
      { name: "EE1006 數位邏輯", credits: 3, type: "選修", stage: "大一下", description: "布林代數、組合邏輯電路、循序電路與暫存器計數器設計。", tag: "電機探索" },
      { name: "EE2001 電子學 I", credits: 3, type: "選修", stage: "大二上", description: "二極體、BJT 雙極性電晶體與 MOSFET 場效電晶體放大器模型。", tag: "電機探索" },
      { name: "EE3009 信號與系統", credits: 3, type: "選修", stage: "大二下", description: "連續與離散時間訊號、LTI 線性非時變系統、傅立葉與拉氏轉換。", tag: "電機探索" }
    ],
    intermediate: [
      { name: "EE1003 電路學 I", credits: 3, type: "必修", stage: "大一上", description: "輔系指定必修：電路基本定理、交流穩態分析與頻率響應。", tag: "電機必修", ruleNote: "★ 官方規章：電機輔系 20 學分核心必修科目。" },
      { name: "EE1006 數位邏輯", credits: 3, type: "必修", stage: "大一下", description: "輔系指定必修：卡諾圖化簡、狀態機 (FSM) 設計與硬體描述語言。", tag: "電機必修", ruleNote: "★ 官方規章：電機輔系指定必修科目。" },
      { name: "EE2001 電子學 I", credits: 3, type: "必修", stage: "大二上", description: "輔系指定必修：半導體元件物理特性、小訊號放大與頻率響應分析。", tag: "電機必修", ruleNote: "★ 官方規章：電機輔系指定必修科目。" },
      { name: "EE2009 電子學 Ⅱ", credits: 3, type: "必修", stage: "大二下", description: "輔系指定必修：差動放大器、多級放大電路與負回授穩定度分析。", tag: "電機必修", ruleNote: "★ 官方規章：電機輔系指定必修科目。" },
      { name: "EE2004 電磁學 Ｉ", credits: 3, type: "選修", stage: "大三上", description: "輔系推薦選修：靜電場、靜磁場、馬克士威爾方程式與平面電磁波。", tag: "電機選修" },
      { name: "EE3009 信號與系統", credits: 3, type: "選修", stage: "大三下", description: "輔系推薦選修：頻域分析、取樣定理、Z 轉換與數位濾波器基礎。", tag: "電機選修" },
      { name: "EE3046 微算機原理與實作", credits: 3, type: "選修", stage: "大四上", description: "輔系推薦選修：ARM 架構處理器、中斷系統、周邊介面控制實務。", tag: "電機選修" }
    ],
    advanced: [
      { name: "EE1003 電路學 I", credits: 3, type: "必修", stage: "大一上", description: "雙主修基礎必修：電路理論與時域交流穩態分析。", tag: "電機雙主修" },
      { name: "EE2011 電路學 Ⅱ", credits: 3, type: "必修", stage: "大一下", description: "雙主修基礎必修：雙埠網路、三相電源與拉氏轉換求解暫態電路。", tag: "電機雙主修" },
      { name: "EE1006 數位邏輯", credits: 3, type: "必修", stage: "大一下", description: "雙主修核心必修：數位系統架構與邏輯電路實體設計。", tag: "電機雙主修" },
      { name: "EE2001 電子學 I", credits: 3, type: "必修", stage: "大二上", description: "雙主修核心必修：半導體晶體管放大模型與偏壓穩定設計。", tag: "電機雙主修" },
      { name: "EE2009 電子學 Ⅱ", credits: 3, type: "必修", stage: "大二下", description: "雙主修核心必修：類比放大器回授、輸出級與濾波器頻譜特性。", tag: "電機雙主修" },
      { name: "EE2004 電磁學 Ｉ", credits: 3, type: "必修", stage: "大三上", description: "雙主修核心必修：靜態電磁場分佈與電磁能量守恆定律。", tag: "電機雙主修" },
      { name: "EE2015 電磁學 Ⅱ", credits: 3, type: "必修", stage: "大三下", description: "雙主修核心必修：傳輸線理論、波導管共振腔與天線輻射原理。", tag: "電機雙主修" },
      { name: "EE3009 信號與系統", credits: 3, type: "必修", stage: "大三下", description: "雙主修必修：信號頻譜分析、濾波器響應與系統控制理論。", tag: "電機雙主修" },
      { name: "EE4004 專題實作", credits: 3, type: "必修", stage: "大四下", description: "雙主修總整發表：晶片設計、電力電子或智慧控制實作展覽。", tag: "電機雙主修" }
    ],
    defaultMajorSchedule: [
      { name: "EE1003 電路學 I", cred: 3, note: "基本電路定律與節點分析" },
      { name: "EE1006 數位邏輯", cred: 3, note: "組合與循序數位系統" },
      { name: "EE2001 電子學 I", cred: 3, note: "半導體元件與放大電路" },
      { name: "EE2009 電子學 Ⅱ", cred: 3, note: "差動放大與回授穩定度" },
      { name: "EE2004 電磁學 Ｉ", cred: 3, note: "馬克士威爾方程式與電磁波" },
      { name: "EE3009 信號與系統", cred: 3, note: "連續與離散信號頻譜轉換" },
      { name: "EE3046 微算機原理與實作", cred: 3, note: "嵌入式處理器硬體架構" },
      { name: "EE4004 專題實作", cred: 3, note: "電機硬體系統整合公開驗收" }
    ]
  },

  // ==========================================
  // 4. 機械工程學系 (ME)
  // ==========================================
  "機械工程學系": {
    name: "機械工程學系",
    tag: "機械",
    code: "ME",
    minorCredits: 20,
    doubleCredits: 40,
    ruleSummary: "★ 官方規章：滿足機械工程學系（先進材料與精密製造組）輔系 20 學分規定。",
    basic: [
      { name: "ME1006 靜力學與材料力學", credits: 3, type: "選修", stage: "大一上", description: "質點與剛體力平衡、梁之剪力彎矩圖、應力應變關係。", tag: "機械探索" },
      { name: "ME1041 製造工程實習 Ｉ", credits: 2, type: "選修", stage: "大一下", description: "材料拉伸扭轉檢驗、應變規量測與金相顯微鏡操作。", tag: "機械探索" },
      { name: "ME2001 熱力學 I", credits: 3, type: "選修", stage: "大二上", description: "熱力學第一與第二定律、卡諾循環、蒸汽動力與冷凍循環。", tag: "機械探索" },
      { name: "ME3001 機械製造", credits: 3, type: "選修", stage: "大二下", description: "鑄造、塑性加工、切削加工理論與先進精密製造技術。", tag: "機械探索" }
    ],
    intermediate: [
      { name: "ME1006 靜力學與材料力學", credits: 3, type: "必修", stage: "大一上", description: "輔系指定必修：剛體平衡、主應力主應變與變形計算。", tag: "機械必修", ruleNote: "★ 官方規章：機械輔系 20 學分核心必修科目。" },
      { name: "ME1041 製造工程實習 Ｉ", credits: 2, type: "必修", stage: "大一下", description: "輔系指定必修：機械力學與材料性質實務檢測檢定。", tag: "機械必修", ruleNote: "★ 官方規章：機械輔系指定必修實習。" },
      { name: "ME2001 熱力學 I", credits: 3, type: "必修", stage: "大二上", description: "輔系指定必修：熱功轉換、可用能與熱力工程循環分析。", tag: "機械必修", ruleNote: "★ 官方規章：機械輔系指定必修科目。" },
      { name: "ME3081 流體力學", credits: 3, type: "必修", stage: "大二下", description: "輔系指定必修：流體靜力學、白努利方程式、控制容積動量方程式。", tag: "機械必修", ruleNote: "★ 官方規章：機械輔系指定必修科目。" },
      { name: "ME2013 動力學", credits: 3, type: "選修", stage: "大三上", description: "輔系推薦選修：運動學、牛頓第二運動定律與剛體平面運動。", tag: "機械選修" },
      { name: "ME3001 機械製造", credits: 3, type: "選修", stage: "大三下", description: "輔系推薦選修：CNC 數值控制、放電加工與半導體封裝製造。", tag: "機械選修" },
      { name: "ME3044 精密機械設計II", credits: 3, type: "選修", stage: "大四上", description: "輔系推薦選修：齒輪齒輪箱設計、軸承軸系與破壞疲勞理論。", tag: "機械選修" }
    ],
    advanced: [
      { name: "ME1006 靜力學與材料力學", credits: 3, type: "必修", stage: "大一上", description: "雙主修核心必修：固體力學理論基礎與應力集中分析。", tag: "機械雙主修" },
      { name: "ME1041 製造工程實習 Ｉ", credits: 2, type: "必修", stage: "大一下", description: "雙主修必修：精密量測儀器、破壞試驗與振動分析。", tag: "機械雙主修" },
      { name: "ME2001 熱力學 I", credits: 3, type: "必修", stage: "大二上", description: "雙主修核心必修：經典熱力學系統與燃燒動力循環。", tag: "機械雙主修" },
      { name: "ME3081 流體力學", credits: 3, type: "必修", stage: "大二下", description: "雙主修核心必修：管流摩擦損失、邊界層理論與外流場分析。", tag: "機械雙主修" },
      { name: "ME2013 動力學", credits: 3, type: "必修", stage: "大三上", description: "雙主修核心必修：拉格朗日力學、三維剛體運動與振動學基礎。", tag: "機械雙主修" },
      { name: "ME3001 機械製造", credits: 3, type: "必修", stage: "大三下", description: "雙主修必修：精密材料成型、雷射加工與積層製造技術。", tag: "機械雙主修" },
      { name: "ME3044 精密機械設計II", credits: 3, type: "必修", stage: "大四上", description: "雙主修必修：機件破壞準則、扣件螺栓與傳動機構設計實務。", tag: "機械雙主修" },
      { name: "ME3011 專題研究(I)", credits: 3, type: "必修", stage: "大四下", description: "雙主修總整發表：機器人、自走車或先進熱流機構發表審查。", tag: "機械雙主修" }
    ],
    defaultMajorSchedule: [
      { name: "ME1006 靜力學與材料力學", cred: 3, note: "結構平衡與應力分析" },
      { name: "ME1041 製造工程實習 Ｉ", cred: 2, note: "材料物性與力學檢驗" },
      { name: "ME2001 熱力學 I", cred: 3, note: "熱功轉換與動力循環" },
      { name: "ME3081 流體力學", cred: 3, note: "流動場分析與動量守恆" },
      { name: "ME2013 動力學", cred: 3, note: "剛體平面運動與能量守恆" },
      { name: "ME3001 機械製造", cred: 3, note: "材料成型與精密加工" },
      { name: "ME3044 精密機械設計II", cred: 3, note: "機構強度與機件整合設計" },
      { name: "ME3011 專題研究(I)", cred: 3, note: "機械自控系統公開成果展" }
    ]
  },

  // ==========================================
  // 5. 財務金融學系 (FM)
  // ==========================================
  "財務金融學系": {
    name: "財務金融學系",
    tag: "財金",
    code: "FM",
    minorCredits: 20,
    doubleCredits: 40,
    ruleSummary: "★ 官方規章：滿足財務金融學系輔系 20 學分規定（含財務管理、經濟學、個體經濟與投資學）。",
    basic: [
      { name: "FM1011 財務金融概論", credits: 3, type: "選修", stage: "大一上", description: "認識現代金融市場、金融體系與公司理財基礎框架。", tag: "財金探索" },
      { name: "EC2004 個體經濟學", credits: 3, type: "選修", stage: "大一下", description: "供需市場均衡、消費者效用與生產者成本理論。", tag: "財金探索" },
      { name: "FM2003 個體經濟學", credits: 3, type: "選修", stage: "大二上", description: "市場結構、賽局理論與一般均衡分析。", tag: "財金探索" },
      { name: "FM3005 投資學", credits: 3, type: "選修", stage: "大二下", description: "馬可維茲投資組合理論、CAPM 模型與證券評價技術。", tag: "財金探索" }
    ],
    intermediate: [
      { name: "FM1011 財務金融概論", credits: 3, type: "必修", stage: "大一上", description: "輔系指定必修：貨幣時間價值、資本預算與金融商品導論。", tag: "財金必修", ruleNote: "★ 官方規章：財金輔系 20 學分核心必修科目。" },
      { name: "EC2004 個體經濟學", credits: 3, type: "必修", stage: "大一下", description: "輔系指定必修：總體經濟指標、貨幣政策與市場運作原理。", tag: "財金必修", ruleNote: "★ 官方規章：財金輔系指定必修科目。" },
      { name: "FM2003 個體經濟學", credits: 3, type: "必修", stage: "大二上", description: "輔系指定必修：市場效率、不確定性下決策與資訊不對稱。", tag: "財金必修", ruleNote: "★ 官方規章：財金輔系指定必修科目。" },
      { name: "FM3005 投資學", credits: 3, type: "必修", stage: "大二下", description: "輔系指定必修：股票債券定價、效率市場假說與基金績效評估。", tag: "財金必修", ruleNote: "★ 官方規章：財金輔系指定必修科目。" },
      { name: "FM2004 總體經濟學", credits: 3, type: "選修", stage: "大三上", description: "輔系推薦選修：IS-LM 模型、通貨膨脹與央行外匯利率決策。", tag: "財金選修" },
      { name: "FM3002 期貨與選擇權", credits: 3, type: "選修", stage: "大三下", description: "輔系推薦選修：衍生性金融商品定價、二項式模型與避險策略。", tag: "財金選修" },
      { name: "FM4003 金融機構管理", credits: 3, type: "選修", stage: "大四上", description: "輔系推薦選修：量化交易演算法、區塊鏈與智慧理財系統。", tag: "財金選修" }
    ],
    advanced: [
      { name: "FM1011 財務金融概論", credits: 3, type: "必修", stage: "大一上", description: "雙主修核心必修：公司理財、財務報表分析與金融倫理。", tag: "財金雙主修" },
      { name: "EC2004 個體經濟學", credits: 3, type: "必修", stage: "大一下", description: "雙主修基礎必修：個體總體經濟學基石。", tag: "財金雙主修" },
      { name: "FM2003 個體經濟學", credits: 3, type: "必修", stage: "大二上", description: "雙主修核心必修：嚴謹數理推導、生產函數與一般均衡理論。", tag: "財金雙主修" },
      { name: "FM2004 總體經濟學", credits: 3, type: "必修", stage: "大二下", description: "雙主修核心必修：經濟成長模型、國際金融與開放經濟體系。", tag: "財金雙主修" },
      { name: "FM3005 投資學", credits: 3, type: "必修", stage: "大三上", description: "雙主修核心必修：套利定價理論 (APT)、因子投資與量化配置。", tag: "財金雙主修" },
      { name: "FM3002 期貨與選擇權", credits: 3, type: "必修", stage: "大三下", description: "雙主修核心必修：布萊克-休斯模型 (Black-Scholes) 與波動率微笑。", tag: "財金雙主修" },
      { name: "FM4003 金融機構管理", credits: 3, type: "選修", stage: "大四上", description: "雙主修高階選修：演算法交易、高頻市場微結構與風險模型。", tag: "財金雙主修" },
      { name: "FM4001 畢業專案研究", credits: 3, type: "必修", stage: "大四下", description: "雙主修總整發表：資產定價模型實證或量化投資策略發表。", tag: "財金雙主修" }
    ],
    defaultMajorSchedule: [
      { name: "FM1011 財務金融概論", cred: 3, note: "金融市場運作與貨幣時間價值" },
      { name: "EC2004 個體經濟學", cred: 3, note: "供需平衡與總體經濟框架" },
      { name: "FM2003 個體經濟學", cred: 3, note: "消費者效用與廠商定價賽局" },
      { name: "FM2004 總體經濟學", cred: 3, note: "總體產出與跨國利率貨幣政策" },
      { name: "FM3005 投資學", cred: 3, note: "現代投資組合與資產定價模型" },
      { name: "FM3002 期貨與選擇權", cred: 3, note: "衍生性金融商品定價與避險" },
      { name: "FM4003 金融機構管理", cred: 3, note: "AI 演算法投資與量化交易實戰" },
      { name: "FM4001 畢業專案研究", cred: 3, note: "財務金融實證專案公開成果展" }
    ]
  },

  // ==========================================
  // 6. 企業管理學系 (BA)
  // ==========================================
  "企業管理學系": {
    name: "企業管理學系",
    tag: "企管",
    code: "BA",
    minorCredits: 20,
    doubleCredits: 40,
    ruleSummary: "★ 官方規章：滿足企業管理學系輔系 20 學分規定（五大管理功能：產銷人發財）。",
    basic: [
      { name: "BA1003 管理學", credits: 3, type: "選修", stage: "大一上", description: "管理規劃、組織設計、領導激勵與控制機制四大功能。", tag: "企管探索" },
      { name: "EC2004 個體經濟學", credits: 3, type: "選修", stage: "大一下", description: "市場運作、定價策略與總體經濟環境分析。", tag: "企管探索" },
      { name: "BA2000 財務管理", credits: 3, type: "選修", stage: "大二上", description: "公司資本結構、資金成本評估與營運資金管理。", tag: "企管探索" },
      { name: "BA2030 行銷管理", credits: 3, type: "選修", stage: "大二下", description: "STP 市場定位、行銷 4P 組合與消費者行為模式。", tag: "企管探索" }
    ],
    intermediate: [
      { name: "BA1003 管理學", credits: 3, type: "必修", stage: "大一上", description: "輔系指定必修：企業經營本質與組織運作邏輯。", tag: "企管必修", ruleNote: "★ 官方規章：企管輔系 20 學分核心必修科目。" },
      { name: "EC2004 個體經濟學", credits: 3, type: "必修", stage: "大一下", description: "輔系指定必修：微觀經濟廠商競爭與宏觀景氣脈動。", tag: "企管必修", ruleNote: "★ 官方規章：企管輔系指定必修科目。" },
      { name: "BA2000 財務管理", credits: 3, type: "必修", stage: "大二上", description: "輔系指定必修：企業股利政策、併購評價與融資決策分析。", tag: "企管必修", ruleNote: "★ 官方規章：企管輔系指定必修科目。" },
      { name: "BA2030 行銷管理", credits: 3, type: "必修", stage: "大二下", description: "輔系指定必修：數位品牌經營、顧客關係管理 (CRM) 與促銷策略。", tag: "企管必修", ruleNote: "★ 官方規章：企管輔系指定必修科目。" },
      { name: "BAA057 統計學", credits: 3, type: "選修", stage: "大三上", description: "輔系推薦選修：資料假設檢定、迴歸分析與商業大數據預測。", tag: "企管選修" },
      { name: "BA3001 組織行為", credits: 3, type: "選修", stage: "大三下", description: "輔系推薦選修：團隊溝通動態、跨文化領導與組織變革阻力消除。", tag: "企管選修" },
      { name: "BA4002 策略管理", credits: 3, type: "選修", stage: "大四上", description: "輔系推薦選修：波特五力分析、企業核心競爭力與跨國併購策略。", tag: "企管選修" }
    ],
    advanced: [
      { name: "BA1003 管理學", credits: 3, type: "必修", stage: "大一上", description: "雙主修基礎必修：管理理論演進與現代管理範式轉移。", tag: "企管雙主修" },
      { name: "EC2004 個體經濟學", credits: 3, type: "必修", stage: "大一下", description: "雙主修基礎必修：個體市場結構與總體經濟政策。", tag: "企管雙主修" },
      { name: "BA2000 財務管理", credits: 3, type: "必修", stage: "大二上", description: "雙主修核心必修：企業長期資本預算與跨國財務管理。", tag: "企管雙主修" },
      { name: "BA2030 行銷管理", credits: 3, type: "必修", stage: "大二下", description: "雙主修核心必修：整合行銷溝通 (IMC) 與社群媒體策略實務。", tag: "企管雙主修" },
      { name: "BAA057 統計學", credits: 3, type: "必修", stage: "大三上", description: "雙主修核心必修：多變量統計、方差分析與商業計量。", tag: "企管雙主修" },
      { name: "BA3001 組織行為", credits: 3, type: "必修", stage: "大三下", description: "雙主修核心必修：領導風格評估、組織文化形塑與權力政治動態。", tag: "企管雙主修" },
      { name: "BA4002 策略管理", credits: 3, type: "必修", stage: "大四上", description: "雙主修必修總整：個案教學法剖析全球跨國企業競爭策略。", tag: "企管雙主修" },
      { name: "BA4086 企管專題", credits: 3, type: "必修", stage: "大四下", description: "雙主修總整發表：企業實體個案診斷與策略顧問成果結案報告。", tag: "企管雙主修" }
    ],
    defaultMajorSchedule: [
      { name: "BA1003 管理學", cred: 3, note: "企業管理五大功能與組織設計" },
      { name: "EC2004 個體經濟學", cred: 3, note: "供需市場與宏觀景氣脈動" },
      { name: "BA2000 財務管理", cred: 3, note: "資本結構與營運資金管理" },
      { name: "BA2030 行銷管理", cred: 3, note: "市場定位 STP 與數位行銷組合" },
      { name: "BAA057 統計學", cred: 3, note: "商業數據推論與迴歸模型" },
      { name: "BA3001 組織行為", cred: 3, note: "跨文化溝通與團隊領導激勵" },
      { name: "BA4002 策略管理", cred: 3, note: "全球競爭策略與核心競爭力" },
      { name: "BA4086 企管專題", cred: 3, note: "企業經營診斷公開發表評審" }
    ]
  },

  // ==========================================
  // 7. 法國語文學系 (FR)
  // ==========================================
  "法國語文學系": {
    name: "法國語文學系",
    tag: "法文",
    code: "FR",
    minorCredits: 24,
    doubleCredits: 40,
    ruleSummary: "★ 官方規章：滿足法國語文學系輔系 24 學分規定（含口語表達 4 學分、讀本 8 學分、文法與寫作 8 學分及選修 4 學分）。",
    basic: [
      { name: "FR0001 科技法文 Ｉ", credits: 2, type: "選修", stage: "大一上", description: "零基礎科技法語入門，掌握生活與專業詞彙發音。", tag: "法文探索" },
      { name: "FR0003 科技法文 Ⅱ", credits: 2, type: "選修", stage: "大一下", description: "進階實用法語情境會話與科學閱讀練習。", tag: "法文探索" },
      { name: "FR1019 口語表達（一）", credits: 2, type: "選修", stage: "大二上", description: "法語標準發音規則、音標咬字與基礎生活情境會話。", tag: "法文探索" },
      { name: "FR1020 口語表達（一）", credits: 2, type: "選修", stage: "大二下", description: "延伸情境溝通、法語聽力理解與即席口說演練。", tag: "法文探索" }
    ],
    intermediate: [
      { name: "FR1019 口語表達（一）", credits: 2, type: "必修", stage: "大一上", description: "輔系指定必修：法語正音技巧、朗讀練習與對話基礎。", tag: "法文必修", ruleNote: "★ 官方規章：法文輔系 24 學分核心必修科目。" },
      { name: "FR1023 讀本", credits: 4, type: "必修", stage: "大一上", description: "輔系指定必修：基礎法語閱讀、篇章分析與詞彙擴充。", tag: "法文必修", ruleNote: "★ 官方規章：法文輔系指定必修讀本課程。" },
      { name: "FR1020 口語表達（一）", credits: 2, type: "必修", stage: "大一下", description: "輔系指定必修：進階日常口語聽力與對話實務溝通。", tag: "法文必修", ruleNote: "★ 官方規章：法文輔系核心口語表達科目。" },
      { name: "FR1024 讀本", credits: 4, type: "必修", stage: "大一下", description: "輔系指定必修：短篇文學選讀與法語文化生活短文賞析。", tag: "法文必修", ruleNote: "★ 官方規章：法文輔系指定必修科目。" },
      { name: "FR1033 文法與寫作", credits: 4, type: "必修", stage: "大二上", description: "輔系指定必修：法語動詞變化、時態系統與句子結構習作。", tag: "法文必修", ruleNote: "★ 官方規章：法文輔系指定必修文法與寫作科目。" },
      { name: "FR1034 文法與寫作", credits: 4, type: "必修", stage: "大二下", description: "輔系指定必修：複合過去時、未完成過去時之精確解析與段落書寫。", tag: "法文必修", ruleNote: "★ 官方規章：法文輔系指定必修科目。" },
      { name: "FR0001 科技法文 Ｉ", credits: 2, type: "選修", stage: "大三上", description: "輔系推薦選修：專業法語文獻閱讀與商務科技詞彙應用。", tag: "法文選修" },
      { name: "FR0003 科技法文 Ⅱ", credits: 2, type: "選修", stage: "大三下", description: "輔系推薦選修：法漢雙向日常轉譯技巧與科技文件解析。", tag: "法文選修" }
    ],
    advanced: [
      { name: "FR1019 口語表達（一）", credits: 2, type: "必修", stage: "大一上", description: "雙主修基礎必修：精準法語語音正音與對話練習。", tag: "法文雙主修" },
      { name: "FR1023 讀本", credits: 4, type: "必修", stage: "大一上", description: "雙主修高強度核心基礎：深入法語篇章閱讀與語境理解。", tag: "法文雙主修" },
      { name: "FR1020 口語表達（一）", credits: 2, type: "必修", stage: "大一下", description: "雙主修必修：全法語口語密集演練與即興發表。", tag: "法文雙主修" },
      { name: "FR1024 讀本", credits: 4, type: "必修", stage: "大一下", description: "雙主修必修：法國文學名家選讀與文化背景深究。", tag: "法文雙主修" },
      { name: "FR1033 文法與寫作", credits: 4, type: "必修", stage: "大二上", description: "雙主修核心必修：嚴謹法語句法剖析與短文創作。", tag: "法文雙主修" },
      { name: "FR1034 文法與寫作", credits: 4, type: "必修", stage: "大二下", description: "雙主修核心必修：高階虛擬式、條件式文法精確運用。", tag: "法文雙主修" },
      { name: "FR0001 科技法文 Ｉ", credits: 2, type: "選修", stage: "大三上", description: "雙主修專業選修：跨國科技合作契約與專利法規導讀。", tag: "法文雙主修" },
      { name: "FR0003 科技法文 Ⅱ", credits: 2, type: "選修", stage: "大三下", description: "雙主修專業選修：法漢雙向科技專題口筆譯實習。", tag: "法文雙主修" },
      { name: "FR1024 讀本", credits: 3, type: "必修", stage: "大四下", description: "雙主修總整發表：法語人文或科技跨域整合專案成果展示。", tag: "法文雙主修" }
    ],
    defaultMajorSchedule: [
      { name: "FR1019 口語表達（一）", cred: 2, note: "法語語音正音與基礎情境溝通" },
      { name: "FR1023 讀本", cred: 4, note: "初級法語閱讀與基礎篇章理解" },
      { name: "FR1020 口語表達（一）", cred: 2, note: "進階日常對話與口說聽力訓練" },
      { name: "FR1024 讀本", cred: 4, note: "法國短篇文學與文化生活短文" },
      { name: "FR1033 文法與寫作", cred: 4, note: "法語時態體系與句子結構習作" },
      { name: "FR1034 文法與寫作", cred: 4, note: "高階文法語法與邏輯段落書寫" },
      { name: "FR0001 科技法文 Ｉ", cred: 2, note: "科技與商務專業法語文件閱讀" },
      { name: "FR1024 讀本", cred: 3, note: "法語語言與人文跨域成果公開發表" }
    ]
  },

  // ==========================================
  // 8. 通訊工程學系 (CO)
  // ==========================================
  "通訊工程學系": {
    name: "通訊工程學系",
    tag: "通訊",
    code: "CO",
    minorCredits: 20,
    doubleCredits: 40,
    ruleSummary: "★ 官方規章：滿足通訊工程學系輔系 20 學分規定（含電路學、數位系統導論、電子學及電磁學）。",
    basic: [
      { name: "CO1001 計算機概論Ⅰ", credits: 3, type: "選修", stage: "大一上", description: "通訊資訊系統基礎架構與程式邏輯思考。", tag: "通訊探索" },
      { name: "CO1002 數位系統導論", credits: 3, type: "選修", stage: "大一下", description: "組合邏輯電路與循序系統基礎概念。", tag: "通訊探索" },
      { name: "CO2001 電路學Ⅰ", credits: 3, type: "選修", stage: "大二上", description: "基本電路定律、網目分析法與交流穩態分析。", tag: "通訊探索" },
      { name: "CO2003 電磁學I", credits: 3, type: "選修", stage: "大二下", description: "靜電學、靜磁學與馬克士威爾方程式入門。", tag: "通訊探索" }
    ],
    intermediate: [
      { name: "CO1002 數位系統導論", credits: 3, type: "必修", stage: "大一上", description: "輔系指定必修：邏輯閘設計、卡諾圖化簡與數位架構。", tag: "通訊必修", ruleNote: "★ 官方規章：通訊輔系 20 學分核心必修科目。" },
      { name: "CO2001 電路學Ⅰ", credits: 3, type: "必修", stage: "大一下", description: "輔系指定必修：電路基本定理與時域暫態分析。", tag: "通訊必修", ruleNote: "★ 官方規章：通訊輔系指定必修科目。" },
      { name: "CO2005 電子學I", credits: 3, type: "必修", stage: "大二上", description: "輔系指定必修：二極體、BJT 與 MOSFET 元件放大原理。", tag: "通訊必修", ruleNote: "★ 官方規章：通訊輔系指定必修科目。" },
      { name: "CO2006 電子學II", credits: 3, type: "必修", stage: "大二下", description: "輔系指定必修：差動放大器、回授系統與頻率響應分析。", tag: "通訊必修", ruleNote: "★ 官方規章：通訊輔系指定必修科目。" },
      { name: "CO2003 電磁學I", credits: 3, type: "必修", stage: "大三上", description: "輔系指定必修：馬克士威爾方程式、時變場與平面電磁波。", tag: "通訊必修", ruleNote: "★ 官方規章：通訊輔系核心必修科目。" },
      { name: "CO2012 資料結構", credits: 3, type: "選修", stage: "大三下", description: "輔系推薦選修：通訊軟體系統高效能記憶體與走訪演算法。", tag: "通訊選修" },
      { name: "CO3001 通訊實驗I", credits: 1, type: "選修", stage: "大四上", description: "輔系推薦選修：無線訊號調變解調與射頻頻譜儀實務操作。", tag: "通訊選修" }
    ],
    advanced: [
      { name: "CO1001 計算機概論Ⅰ", credits: 3, type: "必修", stage: "大一上", description: "雙主修基礎必修：通訊計算思維與演算法設計。", tag: "通訊雙主修" },
      { name: "CO1002 數位系統導論", credits: 3, type: "必修", stage: "大一下", description: "雙主修基礎必修：硬體描述語言與數位電路實作。", tag: "通訊雙主修" },
      { name: "CO2001 電路學Ⅰ", credits: 3, type: "必修", stage: "大二上", description: "雙主修核心必修：雙埠網路與頻域響應分析。", tag: "通訊雙主修" },
      { name: "CO2005 電子學I", credits: 3, type: "必修", stage: "大二上", description: "雙主修核心必修：類比放大電路與偏壓設計。", tag: "通訊雙主修" },
      { name: "CO2006 電子學II", credits: 3, type: "必修", stage: "大二下", description: "雙主修核心必修：輸出級放大與運算放大器應用。", tag: "通訊雙主修" },
      { name: "CO2003 電磁學I", credits: 3, type: "必修", stage: "大三上", description: "雙主修核心必修：電磁能量分佈與波傳導理論。", tag: "通訊雙主修" },
      { name: "CO2004 電磁學Ⅱ", credits: 3, type: "選修", stage: "大三下", description: "雙主修進階選修：傳輸線理論、微波波導與天線設計。", tag: "通訊雙主修" },
      { name: "CO3026 專題實作II", credits: 3, type: "必修", stage: "大四下", description: "雙主修總整發表：5G/6G 無線通訊或光通訊實作展示。", tag: "通訊雙主修" }
    ],
    defaultMajorSchedule: [
      { name: "CO1001 計算機概論Ⅰ", cred: 3, note: "通訊計算思維與系統架構" },
      { name: "CO1002 數位系統導論", cred: 3, note: "組合與循序數位邏輯電路" },
      { name: "CO2001 電路學Ⅰ", cred: 3, note: "基本電路定律與暫態分析" },
      { name: "CO2005 電子學I", cred: 3, note: "電晶體放大器模型與分析" },
      { name: "CO2006 電子學II", cred: 3, note: "差動放大與回授頻譜特性" },
      { name: "CO2003 電磁學I", cred: 3, note: "馬克士威爾方程式與電磁波" },
      { name: "CO2012 資料結構", cred: 3, note: "通訊網路資料結構與演算法" },
      { name: "CO3026 專題實作II", cred: 3, note: "通訊硬體與訊號系統公開成果驗收" }
    ]
  },

  // ==========================================
  // 9. 經濟學系 (EC)
  // ==========================================
  "經濟學系": {
    name: "經濟學系",
    tag: "經濟",
    code: "EC",
    minorCredits: 20,
    doubleCredits: 40,
    ruleSummary: "★ 官方規章：滿足經濟學系輔系 20 學分規定（含個體經濟學、總體經濟學、中央銀行與計量經濟學）。",
    basic: [
      { name: "EC2004 個體經濟學", credits: 3, type: "選修", stage: "大一上", description: "經濟學核心觀念、市場供需調節與效率分析。", tag: "經濟探索" },
      { name: "EC2003 個體經濟學", credits: 3, type: "選修", stage: "大一下", description: "消費者偏好、生產理論與廠商成本結構。", tag: "經濟探索" },
      { name: "EC2005 總體經濟學", credits: 3, type: "選修", stage: "大二上", description: "國民所得、通貨膨脹與貨幣政策機制。", tag: "經濟探索" },
      { name: "EC2054 中央銀行與金融機構", credits: 3, type: "選修", stage: "大二下", description: "各國央行利率政策、金融監理與貨幣市場運作。", tag: "經濟探索" }
    ],
    intermediate: [
      { name: "EC2003 個體經濟學", credits: 3, type: "必修", stage: "大一上", description: "輔系指定必修：消費者最適化、一般均衡與賽局理論分析。", tag: "經濟必修", ruleNote: "★ 官方規章：經濟輔系 20 學分核心必修科目。" },
      { name: "EC2004 個體經濟學", credits: 3, type: "必修", stage: "大一下", description: "輔系指定必修：不完全競爭市場、資訊不對稱與外部性問題。", tag: "經濟必修", ruleNote: "★ 官方規章：經濟輔系指定必修科目。" },
      { name: "EC2005 總體經濟學", credits: 3, type: "必修", stage: "大二上", description: "輔系指定必修：IS-LM 模型、AD-AS 總體分析與經濟循環。", tag: "經濟必修", ruleNote: "★ 官方規章：經濟輔系指定必修科目。" },
      { name: "EC2006 總體經濟學", credits: 3, type: "必修", stage: "大二下", description: "輔系指定必修：開放經濟總體模型、匯率決定與跨國資本流動。", tag: "經濟必修", ruleNote: "★ 官方規章：經濟輔系指定必修科目。" },
      { name: "EC2054 中央銀行與金融機構", credits: 3, type: "必修", stage: "大三上", description: "輔系指定必修：貨幣政策傳遞、銀行體系與金融穩定政策。", tag: "經濟必修", ruleNote: "★ 官方規章：經濟輔系指定核心科目。" },
      { name: "EC3018 計量經濟學(一)", credits: 3, type: "選修", stage: "大三下", description: "輔系推薦選修：普通最小平方法 (OLS)、假設檢定與經濟數據實證。", tag: "經濟選修" },
      { name: "EC3071 國際貿易", credits: 3, type: "選修", stage: "大四上", description: "輔系推薦選修：比較利益法則、貿易關稅壁壘與 WTO 架構。", tag: "經濟選修" }
    ],
    advanced: [
      { name: "EC2003 個體經濟學", credits: 3, type: "必修", stage: "大一上", description: "雙主修核心必修：嚴謹數理推導個體效用與市場均衡。", tag: "經濟雙主修" },
      { name: "EC2004 個體經濟學", credits: 3, type: "必修", stage: "大一下", description: "雙主修核心必修：寡占定價賽局、拍賣機制與公共財供給理論。", tag: "經濟雙主修" },
      { name: "EC2005 總體經濟學", credits: 3, type: "必修", stage: "大二上", description: "雙主修核心必修：內生成長理論、動態總體經濟與就業市場模型。", tag: "經濟雙主修" },
      { name: "EC2006 總體經濟學", credits: 3, type: "必修", stage: "大二下", description: "雙主修核心必修：貨幣學派與新凱因斯學派爭議之動態推導。", tag: "經濟雙主修" },
      { name: "EC2054 中央銀行與金融機構", credits: 3, type: "必修", stage: "大三上", description: "雙主修必修：全球央行量化寬鬆、升息循環與系統性金融風險。", tag: "經濟雙主修" },
      { name: "EC3018 計量經濟學(一)", credits: 3, type: "選修", stage: "大三下", description: "雙主修核心選修：聯立方程式模型、時間序列分析與因果推論。", tag: "經濟雙主修" },
      { name: "EC3071 國際貿易", credits: 3, type: "必修", stage: "大四上", description: "雙主修核心必修：跨國要素流動、全球價值鏈與自由貿易協定。", tag: "經濟雙主修" },
      { name: "EC2037 當代經濟問題討論（三）", credits: 3, type: "必修", stage: "大四下", description: "雙主修總整發表：實證計量經濟學專題論文公開答辯。", tag: "經濟雙主修" }
    ],
    defaultMajorSchedule: [
      { name: "EC2003 個體經濟學", cred: 3, note: "市場供需均衡與效用極大化推導" },
      { name: "EC2004 個體經濟學", cred: 3, note: "寡占賽局理論與福利經濟學分析" },
      { name: "EC2005 總體經濟學", cred: 3, note: "國民所得決定與貨幣財政政策" },
      { name: "EC2006 總體經濟學", cred: 3, note: "開放總體經濟與國際金融匯率政策" },
      { name: "EC2054 中央銀行與金融機構", cred: 3, note: "央行調控機制與金融體系監理" },
      { name: "EC3018 計量經濟學(一)", cred: 3, note: "經濟大數據迴歸實證分析" },
      { name: "EC3071 國際貿易", cred: 3, note: "全球經貿關稅與比較利益架構" },
      { name: "EC2037 當代經濟問題討論（三）", cred: 3, note: "經濟學實證論文公開審查展覽" }
    ]
  },

  // ==========================================
  // 10. 英美語文學系 (EL)
  // ==========================================
  "英美語文學系": {
    name: "英美語文學系",
    tag: "英文",
    code: "EL",
    minorCredits: 21,
    doubleCredits: 40,
    ruleSummary: "★ 官方規章：滿足英美語文學系輔系 21 學分規定（含口語訓練、進階閱讀、影像分析寫作與西方文學概論）。",
    basic: [
      { name: "EL1029 希臘羅馬神話", credits: 3, type: "選修", stage: "大一上", description: "西方文學與神話母題之文化起源探索。", tag: "英文探索" },
      { name: "EL1035 英文口語訓練IB", credits: 3, type: "選修", stage: "大一下", description: "小組討論、英語表達技巧與即席演講自信培訓。", tag: "英文探索" },
      { name: "EL1060 影像分析寫作", credits: 3, type: "選修", stage: "大二上", description: "電影敘事鏡頭美學與英語短文論述實習。", tag: "英文探索" },
      { name: "EL1062 進階閱讀", credits: 3, type: "選修", stage: "大二下", description: "當代英美經典散文與批判性思維深入閱讀。", tag: "英文探索" }
    ],
    intermediate: [
      { name: "EL1029 希臘羅馬神話", credits: 3, type: "選修", stage: "大一上", description: "輔系推薦必選：神話原型、西方史詩與文化隱喻解析。", tag: "英文必選", ruleNote: "★ 官方規章：英美輔系 21 學分推薦科目。" },
      { name: "EL1035 英文口語訓練IB", credits: 3, type: "選修", stage: "大一下", description: "輔系核心修習：跨文化英語溝通與學術口語表達。", tag: "英文必選", ruleNote: "★ 官方規章：英美語文輔系核心訓練科目。" },
      { name: "EL1060 影像分析寫作", credits: 3, type: "選修", stage: "大二上", description: "輔系指定核心：批判文本書寫與影像符號學論述構建。", tag: "英文必修", ruleNote: "★ 官方規章：英美語文輔系指定必修寫作課程。" },
      { name: "EL1062 進階閱讀", credits: 3, type: "選修", stage: "大二下", description: "輔系指定核心：精讀英美現代文選，強化學術閱讀能力。", tag: "英文必修", ruleNote: "★ 官方規章：英美語文輔系核心閱讀科目。" },
      { name: "EL1201 比較觀念文化史", credits: 3, type: "選修", stage: "大三上", description: "輔系推薦選修：啟蒙思想、現代主義與跨文化思潮比較。", tag: "英文選修" },
      { name: "EL1202 文學、歷史與哲思", credits: 3, type: "選修", stage: "大三下", description: "輔系推薦選修：西方哲學主題與文學作品跨域對話研析。", tag: "英文選修" },
      { name: "EL1204 文獻蒐集與論證寫作", credits: 3, type: "選修", stage: "大四上", description: "輔系推薦選修：MLA 規範、學術文獻引用與長篇論述實作。", tag: "英文選修" }
    ],
    advanced: [
      { name: "EL1029 希臘羅馬神話", credits: 3, type: "必修", stage: "大一上", description: "雙主修基礎必修：古典希臘羅馬文學與西方文化奠基。", tag: "英文雙主修" },
      { name: "EL1035 英文口語訓練IB", credits: 3, type: "必修", stage: "大一下", description: "雙主修基礎必修：高階學術演講、公眾辯論與即時口譯準備。", tag: "英文雙主修" },
      { name: "EL1060 影像分析寫作", credits: 3, type: "必修", stage: "大二上", description: "雙主修核心必修：當代視覺文化符號學與學術論文寫作。", tag: "英文雙主修" },
      { name: "EL1062 進階閱讀", credits: 3, type: "必修", stage: "大二下", description: "雙主修核心必修：英美小說詩歌深度文本細讀分析。", tag: "英文雙主修" },
      { name: "EL1201 比較觀念文化史", credits: 3, type: "必修", stage: "大三上", description: "雙主修核心必修：西方近代觀念史與意識形態演進批判。", tag: "英文雙主修" },
      { name: "EL1202 文學、歷史與哲思", credits: 3, type: "必修", stage: "大三下", description: "雙主修核心必修：跨學科文本交互指涉與後現代文化理論。", tag: "英文雙主修" },
      { name: "EL1204 文獻蒐集與論證寫作", credits: 3, type: "必修", stage: "大四上", description: "雙主修總整論文前置：學術專題獨立研究方法與論文框架構建。", tag: "英文雙主修" },
      { name: "EL1060 影像分析寫作", credits: 3, type: "必修", stage: "大四下", description: "雙主修總整發表：英美文學批評或跨文化轉譯成果展示。", tag: "英文雙主修" }
    ],
    defaultMajorSchedule: [
      { name: "EL1029 希臘羅馬神話", cred: 3, note: "西方神話母題與文學源流" },
      { name: "EL1035 英文口語訓練IB", cred: 3, note: "英語學術演講與即席論辯能力" },
      { name: "EL1060 影像分析寫作", cred: 3, note: "影像文化符號學與英語分析論文" },
      { name: "EL1062 進階閱讀", cred: 3, note: "當代英美經典散文文本深度精讀" },
      { name: "EL1201 比較觀念文化史", cred: 3, note: "西方思想史與跨文化觀念演進" },
      { name: "EL1202 文學、歷史與哲思", cred: 3, note: "文學作品與哲學批判跨學門對話" },
      { name: "EL1204 文獻蒐集與論證寫作", cred: 3, note: "學術論述邏輯與嚴謹論文撰寫" },
      { name: "EL1060 影像分析寫作", cred: 3, note: "英美語言文學專題論文公開答辯" }
    ]
  },

  // ==========================================
  // 11. 太空科學與工程學系 (SS)
  // ==========================================
  "太空科學與工程學系": {
    name: "太空科學與工程學系",
    tag: "太空",
    code: "SS",
    minorCredits: 20,
    doubleCredits: 40,
    ruleSummary: "★ 官方規章：滿足太空科學與工程學系輔系 20 學分規定（含工程實習、太空科學導論、程式語言與力學）。",
    basic: [
      { name: "SS1002 太空科學與工程導論", credits: 2, type: "選修", stage: "大一上", description: "地球大氣外圍、太陽風、電離層與人造衛星軌道基礎。", tag: "太空探索" },
      { name: "SS1003 程式語言與繪圖", credits: 2, type: "選修", stage: "大一下", description: "Python 太空數據視覺化、科學計算與繪圖模組。", tag: "太空探索" },
      { name: "SS2001 力學", credits: 3, type: "選修", stage: "大二上", description: "質點動力學、剛體旋轉、萬有引力與衛星軌道計算。", tag: "太空探索" },
      { name: "SS2003 電磁學 I", credits: 3, type: "選修", stage: "大二下", description: "真空電磁場、帶電粒子運動與電磁波輻射基本原理。", tag: "太空探索" }
    ],
    intermediate: [
      { name: "SS1001 工程實習", credits: 1, type: "必修", stage: "大一上", description: "輔系指定必修：太空量測感測器焊接、電路測試與工程實做。", tag: "太空必修", ruleNote: "★ 官方規章：太空輔系 20 學分核心必修科目。" },
      { name: "SS1002 太空科學與工程導論", credits: 2, type: "必修", stage: "大一上", description: "輔系指定必修：太空環境物理、立方衛星與太空任務設計概論。", tag: "太空必修", ruleNote: "★ 官方規章：太空輔系指定必修科目。" },
      { name: "SS1003 程式語言與繪圖", credits: 2, type: "必修", stage: "大一下", description: "輔系指定必修：太空大數據處理、時序資料繪圖與數值模擬。", tag: "太空必修", ruleNote: "★ 官方規章：太空輔系指定必修科目。" },
      { name: "SS2001 力學", credits: 3, type: "必修", stage: "大二上", description: "輔系指定必修：拉格朗日力學方程式與衛星天體軌道力學。", tag: "太空必修", ruleNote: "★ 官方規章：太空輔系核心科目。" },
      { name: "SS2003 電磁學 I", credits: 3, type: "必修", stage: "大二下", description: "輔系指定必修：馬克士威爾方程式與太空電漿電磁交互作用。", tag: "太空必修", ruleNote: "★ 官方規章：太空輔系指定必修科目。" },
      { name: "SS1005 衛星系統實作", credits: 2, type: "選修", stage: "大三上", description: "輔系推薦選修：立方衛星通訊、姿態控制與酬載次系統組裝實務。", tag: "太空選修" },
      { name: "SS1011 向量分析", credits: 2, type: "選修", stage: "大三下", description: "輔系推薦選修：散度旋度定理、曲線坐標系與場論數學工具。", tag: "太空選修" }
    ],
    advanced: [
      { name: "SS1001 工程實習", credits: 1, type: "必修", stage: "大一上", description: "雙主修基礎必修：太空儀器研發與電路實務驗收。", tag: "太空雙主修" },
      { name: "SS1002 太空科學與工程導論", credits: 2, type: "必修", stage: "大一上", description: "雙主修基礎必修：深入近地太空、日地關係與行星科學。", tag: "太空雙主修" },
      { name: "SS1003 程式語言與繪圖", credits: 2, type: "必修", stage: "大一下", description: "雙主修基礎必修：衛星遙測大數據演算法與高效能模擬。", tag: "太空雙主修" },
      { name: "SS2001 力學", credits: 3, type: "必修", stage: "大二上", description: "雙主修核心必修：軌道轉移、三體問題與微重力力學理論。", tag: "太空雙主修" },
      { name: "SS2003 電磁學 I", credits: 3, type: "必修", stage: "大二下", description: "雙主修核心必修：空間電漿波動、極光現象與磁層物理。", tag: "太空雙主修" },
      { name: "SS1005 衛星系統實作", credits: 2, type: "選修", stage: "大三上", description: "雙主修必修選修：衛星地面接收站架構與衛星訊號追蹤。", tag: "太空雙主修" },
      { name: "SS1011 向量分析", credits: 2, type: "必修", stage: "大三下", description: "雙主修核心必修：高等場論數學在太空物理中之嚴謹推導。", tag: "太空雙主修" },
      { name: "SS2008 太空專題II", credits: 3, type: "必修", stage: "大四下", description: "雙主修總整發表：人造衛星酬載設計或太空天氣預報模型發表。", tag: "太空雙主修" }
    ],
    defaultMajorSchedule: [
      { name: "SS1001 工程實習", cred: 1, note: "感測器電路焊接與量測實習" },
      { name: "SS1002 太空科學與工程導論", cred: 2, note: "近地太空環境與衛星軌道工程" },
      { name: "SS1003 程式語言與繪圖", cred: 2, note: "Python 太空數據處理與視覺化" },
      { name: "SS2001 力學", cred: 3, note: "牛頓天體力學與衛星軌道攝動" },
      { name: "SS2003 電磁學 I", cred: 3, note: "馬克士威爾方程與太空電磁波" },
      { name: "SS1005 衛星系統實作", cred: 2, note: "立方衛星酬載組裝與地面站接收" },
      { name: "SS1011 向量分析", cred: 2, note: "高等向量場論與太空物理數學" },
      { name: "SS2008 太空專題II", cred: 3, note: "立方衛星專案公開成果審查" }
    ]
  },

  // ==========================================
  // 12. 生命科學系 (LS)
  // ==========================================
  "生命科學系": {
    name: "生命科學系",
    tag: "生科",
    code: "LS",
    minorCredits: 20,
    doubleCredits: 40,
    ruleSummary: "★ 官方規章：滿足生命科學系輔系 20 學分規定（含普通生物學、普通生物學實驗與分子生物領域）。",
    basic: [
      { name: "LS1001 普通生物學", credits: 3, type: "選修", stage: "大一上", description: "細胞構造、能量代謝、遺傳密碼與生物多樣性通論。", tag: "生科探索" },
      { name: "LS1003 普通生物學實驗", credits: 1, type: "選修", stage: "大一上", description: "光學顯微鏡操作、細胞染色與組織切片檢驗。", tag: "生科探索" },
      { name: "LS1002 普通生物學", credits: 3, type: "選修", stage: "大一下", description: "植物生理、動物體系構造與生態演化系統。", tag: "生科探索" },
      { name: "LS1004 普通生物學實驗", credits: 1, type: "選修", stage: "大一下", description: "動植物解剖生理檢驗與生理酵素反應實驗。", tag: "生科探索" }
    ],
    intermediate: [
      { name: "LS1001 普通生物學", credits: 3, type: "必修", stage: "大一上", description: "輔系指定必修：生命化學分子、細胞分裂與基因重組核心機制。", tag: "生科必修", ruleNote: "★ 官方規章：生科輔系 20 學分核心必修科目。" },
      { name: "LS1003 普通生物學實驗", credits: 1, type: "必修", stage: "大一上", description: "輔系指定必修：生物分子定性定量檢驗與微生物無菌培養實務。", tag: "生科必修", ruleNote: "★ 官方規章：生科輔系指定必修實驗。" },
      { name: "LS1002 普通生物學", credits: 3, type: "必修", stage: "大一下", description: "輔系指定必修：動物神經內分泌系統、免疫防禦與生態多樣性。", tag: "生科必修", ruleNote: "★ 官方規章：生科輔系指定必修科目。" },
      { name: "LS1004 普通生物學實驗", credits: 1, type: "必修", stage: "大一下", description: "輔系指定必修：光合作用速率測定與遺傳雜交實習檢定。", tag: "生科必修", ruleNote: "★ 官方規章：生科輔系指定必修實驗。" },
      { name: "LS1006 生命科學時事導讀", credits: 1, type: "選修", stage: "大二上", description: "輔系推薦選修：CRISPR 基因編輯、mRNA 疫苗與生醫前沿科技研析。", tag: "生科選修" },
      { name: "LS1017 認識昆蟲", credits: 2, type: "選修", stage: "大二下", description: "輔系推薦選修：昆蟲分類鑑別、生態適應與農業環境共生關係。", tag: "生科選修" },
      { name: "LS1013 普通生物學I", credits: 3, type: "選修", stage: "大三上", description: "輔系推薦選修：高階細胞訊號傳遞與分子生物學深入探討。", tag: "生科選修" }
    ],
    advanced: [
      { name: "LS1001 普通生物學", credits: 3, type: "必修", stage: "大一上", description: "雙主修基礎必修：分子遺傳與細胞生物學基石。", tag: "生科雙主修" },
      { name: "LS1003 普通生物學實驗", credits: 1, type: "必修", stage: "大一上", description: "雙主修必修實習：無菌操作、離心萃取與電泳分析。", tag: "生科雙主修" },
      { name: "LS1002 普通生物學", credits: 3, type: "必修", stage: "大一下", description: "雙主修基礎必修：動物生理學與生態平衡機制深度剖析。", tag: "生科雙主修" },
      { name: "LS1004 普通生物學實驗", credits: 1, type: "必修", stage: "大一下", description: "雙主修必修實習：解剖生理觀察與酵素動力學測定。", tag: "生科雙主修" },
      { name: "LS1006 生命科學時事導讀", credits: 1, type: "選修", stage: "大二上", description: "雙主修研討選修：現代精準醫療與前沿生物科技論文研討。", tag: "生科雙主修" },
      { name: "LS1013 普通生物學I", credits: 3, type: "必修", stage: "大二下", description: "雙主修核心必修：分子層次之基因轉錄轉譯與蛋白質功能解析。", tag: "生科雙主修" },
      { name: "LS1014 普通生物學Ⅱ", credits: 3, type: "必修", stage: "大三上", description: "雙主修核心必修：系統生物學與多體學整合分析。", tag: "生科雙主修" },
      { name: "LS4001 畢業專案研究", credits: 3, type: "必修", stage: "大四下", description: "雙主修總整發表：分子生醫或生態演化實驗室論文公開發表。", tag: "生科雙主修" }
    ],
    defaultMajorSchedule: [
      { name: "LS1001 普通生物學", cred: 3, note: "生命化學組成與細胞生理代謝" },
      { name: "LS1003 普通生物學實驗", cred: 1, note: "顯微技術與生物分子檢驗實作" },
      { name: "LS1002 普通生物學", cred: 3, note: "動物神經生理與生態平衡機制" },
      { name: "LS1004 普通生物學實驗", cred: 1, note: "解剖生理實務與酵素反應分析" },
      { name: "LS1006 生命科學時事導讀", cred: 1, note: "生醫前沿科技與 CRISPR 論文導讀" },
      { name: "LS1013 普通生物學I", cred: 3, note: "分子層次基因調控與蛋白質結構" },
      { name: "LS1014 普通生物學Ⅱ", cred: 3, note: "跨尺度多體學生態演化模型" },
      { name: "LS4001 畢業專案研究", cred: 3, note: "生命科學實驗室專案成果公開發表" }
    ]
  },

  // ==========================================
  // 13. 生醫科學與工程學系 (BM)
  // ==========================================
  "生醫科學與工程學系": {
    name: "生醫科學與工程學系",
    tag: "生醫",
    code: "BM",
    minorCredits: 20,
    doubleCredits: 40,
    ruleSummary: "★ 官方規章：滿足生醫科學與工程學系輔系 20 學分規定（含計算機概論、普通生物學、電子電路學及工程數學）。",
    basic: [
      { name: "BM1004 計算機概論", credits: 3, type: "選修", stage: "大一上", description: "生醫資訊科學、Python 數據分析與演算法基礎。", tag: "生醫探索" },
      { name: "BM1009 普通生物學", credits: 3, type: "選修", stage: "大一下", description: "分子細胞生物學、人體生理機能與醫學工程導論。", tag: "生醫探索" },
      { name: "BM1011 人工智慧程式入門", credits: 3, type: "選修", stage: "大二上", description: "生醫影像辨識、機器學習在健康醫療之應用實務。", tag: "生醫探索" },
      { name: "BM2012 電子電路學", credits: 3, type: "選修", stage: "大二下", description: "生物電訊號放大器、感測電路與生理監測儀器架構。", tag: "生醫探索" }
    ],
    intermediate: [
      { name: "BM1004 計算機概論", credits: 3, type: "必修", stage: "大一上", description: "輔系指定必修：醫學工程計算思維、生理訊號數據擷取實作。", tag: "生醫必修", ruleNote: "★ 官方規章：生醫輔系 20 學分核心必修科目。" },
      { name: "BM1009 普通生物學", credits: 3, type: "必修", stage: "大一下", description: "輔系指定必修：細胞機制、心血管系統與生物相容性材料通論。", tag: "生醫必修", ruleNote: "★ 官方規章：生醫輔系指定必修科目。" },
      { name: "BM2010 工程數學 (上)", credits: 3, type: "必修", stage: "大二上", description: "輔系指定必修：微分方程在生理動態系統模擬中之應用。", tag: "生醫必修", ruleNote: "★ 官方規章：生醫輔系指定工程數學科目。" },
      { name: "BM2012 電子電路學", credits: 3, type: "必修", stage: "大二下", description: "輔系指定必修：心電圖 (ECG) 前端電路、濾波器與運算放大器。", tag: "生醫必修", ruleNote: "★ 官方規章：生醫輔系指定必修科目。" },
      { name: "BM2013 電子電路學實驗", credits: 1, type: "必修", stage: "大二下", description: "輔系指定必修：生醫電路示波器量測與雜訊抑制實習驗證。", tag: "生醫必修", ruleNote: "★ 官方規章：生醫輔系指定實驗科目。" },
      { name: "BM1011 人工智慧程式入門", credits: 3, type: "選修", stage: "大三上", description: "輔系推薦選修：深度學習於醫學影像 (X光/MRI) 之病灶輔助判讀。", tag: "生醫選修" },
      { name: "BM2005 認知神經科學", credits: 3, type: "選修", stage: "大三下", description: "輔系推薦選修：腦波 (EEG) 解析、腦機介面 (BCI) 與認知神經迴路。", tag: "生醫選修" }
    ],
    advanced: [
      { name: "BM1004 計算機概論", credits: 3, type: "必修", stage: "大一上", description: "雙主修基礎必修：生醫訊號演算法架構打底。", tag: "生醫雙主修" },
      { name: "BM1009 普通生物學", credits: 3, type: "必修", stage: "大一下", description: "雙主修基礎必修：細胞力學、生物化學與人體組織生理學。", tag: "生醫雙主修" },
      { name: "BM2010 工程數學 (上)", credits: 3, type: "必修", stage: "大二上", description: "雙主修核心必修：常微分方程與拉氏轉換在生醫系統建模之應用。", tag: "生醫雙主修" },
      { name: "BM2011 工程數學(下)", credits: 3, type: "必修", stage: "大二下", description: "雙主修核心必修：線性代數特徵值與生醫感測器陣列矩陣運算。", tag: "生醫雙主修" },
      { name: "BM2012 電子電路學", credits: 3, type: "必修", stage: "大二下", description: "雙主修核心必修：微弱生理訊號放大器設計與噪訊比優化。", tag: "生醫雙主修" },
      { name: "BM2013 電子電路學實驗", credits: 1, type: "必修", stage: "大二下", description: "雙主修必修：可穿戴生醫監控裝置硬體電路實體除錯驗收。", tag: "生醫雙主修" },
      { name: "BM1011 人工智慧程式入門", credits: 3, type: "必修", stage: "大三上", description: "雙主修核心必修：醫療大數據神經網路與臨床預測模型建構。", tag: "生醫雙主修" },
      { name: "BM2037 專題研究(上)", credits: 3, type: "必修", stage: "大四下", description: "雙主修總整發表：生醫晶片、醫療 AI 或穿戴感測儀器成果發表。", tag: "生醫雙主修" }
    ],
    defaultMajorSchedule: [
      { name: "BM1004 計算機概論", cred: 3, note: "生醫工程計算思維與訊號擷取" },
      { name: "BM1009 普通生物學", cred: 3, note: "人體組織生理與生醫材料原理" },
      { name: "BM2010 工程數學 (上)", cred: 3, note: "微分方程與生醫動態系統建模" },
      { name: "BM2011 工程數學(下)", cred: 3, note: "線性代數與生理訊號矩陣運算" },
      { name: "BM2012 電子電路學", cred: 3, note: "生理微弱電訊號放大器與濾波電路" },
      { name: "BM2013 電子電路學實驗", cred: 1, note: "心電/腦波生理儀器實體檢測實習" },
      { name: "BM1011 人工智慧程式入門", cred: 3, note: "醫療影像深度學習與智慧輔助診斷" },
      { name: "BM2037 專題研究(上)", cred: 3, note: "生醫科技創新醫材公開成果展示" }
    ]
  },

  // ==========================================
  // 14. 光電科學與工程學系 (OS)
  // ==========================================
  "光電科學與工程學系": {
    name: "光電科學與工程學系",
    tag: "光電",
    code: "OS",
    minorCredits: 20,
    doubleCredits: 40,
    ruleSummary: "★ 官方規章：滿足光電科學與工程學系輔系 20 學分規定（含光電科技概論、計算機概論、近代物理與電磁學）。",
    basic: [
      { name: "OS1006 光電科技概論Ⅰ", credits: 1, type: "選修", stage: "大一上", description: "光電前瞻產業、雷射物理基礎與半導體光電發展導論。", tag: "光電探索" },
      { name: "OS1008 計算機概論", credits: 3, type: "選修", stage: "大一下", description: "光學數值運算、波動模擬與程式設計實踐。", tag: "光電探索" },
      { name: "OS2001 近代物理", credits: 3, type: "選修", stage: "大二上", description: "量子理論、波粒二象性、光電效應與原子能階結構。", tag: "光電探索" },
      { name: "OS2003 電磁學Ⅰ", credits: 3, type: "選修", stage: "大二下", description: "光波導管、全反射定律、偏振與平面電磁波傳播方程式。", tag: "光電探索" }
    ],
    intermediate: [
      { name: "OS1006 光電科技概論Ⅰ", credits: 1, type: "必修", stage: "大一上", description: "輔系指定必修：幾何光學透鏡、雷射共振腔與光纖通訊原理。", tag: "光電必修", ruleNote: "★ 官方規章：光電輔系 20 學分核心必修科目。" },
      { name: "OS1007 光電科技概論II", credits: 1, type: "必修", stage: "大一下", description: "輔系指定必修：顯示器科技、發光二極體 (LED) 與太陽能電池導論。", tag: "光電必修", ruleNote: "★ 官方規章：光電輔系指定必修科目。" },
      { name: "OS1008 計算機概論", credits: 3, type: "必修", stage: "大一下", description: "輔系指定必修：光場傳播模擬演算法與數據分析。", tag: "光電必修", ruleNote: "★ 官方規章：光電輔系指定必修科目。" },
      { name: "OS2001 近代物理", credits: 3, type: "必修", stage: "大二上", description: "輔系指定必修：薛丁格方程式、穿隧效應與半導體能隙物理。", tag: "光電必修", ruleNote: "★ 官方規章：光電輔系核心科目。" },
      { name: "OS2003 電磁學Ⅰ", credits: 3, type: "必修", stage: "大二下", description: "輔系指定必修：菲涅耳方程式、光學薄膜反射與繞射干涉理論。", tag: "光電必修", ruleNote: "★ 官方規章：光電輔系指定必修科目。" },
      { name: "OS2004 電磁學Ⅱ", credits: 3, type: "必修", stage: "大三上", description: "輔系指定必修：光纖模式理論、高頻傳輸與波導色散分析。", tag: "光電必修", ruleNote: "★ 官方規章：光電輔系核心必修科目。" },
      { name: "OS2007 工程數學Ⅰ", credits: 3, type: "選修", stage: "大三下", description: "輔系推薦選修：傅立葉光學轉換與波動微分方程求解實戰。", tag: "光電選修" }
    ],
    advanced: [
      { name: "OS1006 光電科技概論Ⅰ", credits: 1, type: "必修", stage: "大一上", description: "雙主修基礎必修：光學元件成像原理與雷射系統概論。", tag: "光電雙主修" },
      { name: "OS1007 光電科技概論II", credits: 1, type: "必修", stage: "大一下", description: "雙主修基礎必修：先進光電半導體元件與光子晶體前沿。", tag: "光電雙主修" },
      { name: "OS1008 計算機概論", credits: 3, type: "必修", stage: "大一下", description: "雙主修基礎必修：光線追跡模擬與波動傳播數值解算。", tag: "光電雙主修" },
      { name: "OS2001 近代物理", credits: 3, type: "必修", stage: "大二上", description: "雙主修核心必修：固態物理能帶、半導體光激發與受激輻射。", tag: "光電雙主修" },
      { name: "OS2003 電磁學Ⅰ", credits: 3, type: "必修", stage: "大二下", description: "雙主修核心必修：馬克士威爾電磁方程、光波反射透射係數嚴密推導。", tag: "光電雙主修" },
      { name: "OS2004 電磁學Ⅱ", credits: 3, type: "必修", stage: "大三上", description: "雙主修核心必修：導波光學、共振腔理論與非線性光學效應。", tag: "光電雙主修" },
      { name: "OS2007 工程數學Ⅰ", credits: 3, type: "必修", stage: "大三下", description: "雙主修核心必修：偏微分方程式在波動光學與熱傳之應用解算。", tag: "光電雙主修" },
      { name: "OS1010 專題四", credits: 3, type: "必修", stage: "大四下", description: "雙主修總整發表：矽光子晶片、先進雷射或生目光學專案展示。", tag: "光電雙主修" }
    ],
    defaultMajorSchedule: [
      { name: "OS1006 光電科技概論Ⅰ", cred: 1, note: "幾何光學與雷射物理入門" },
      { name: "OS1007 光電科技概論II", cred: 1, note: "光電半導體與顯示科技導論" },
      { name: "OS1008 計算機概論", cred: 3, note: "光線追跡與光波數值模擬程式" },
      { name: "OS2001 近代物理", cred: 3, note: "量子物理、波粒二象性與原子光譜" },
      { name: "OS2003 電磁學Ⅰ", cred: 3, note: "光電磁場、偏振與菲涅耳公式" },
      { name: "OS2004 電磁學Ⅱ", cred: 3, note: "光纖波導模式與共振腔電磁分析" },
      { name: "OS2007 工程數學Ⅰ", cred: 3, note: "傅立葉轉換與波動微分方程求解" },
      { name: "OS1010 專題四", cred: 3, note: "矽光子或前瞻光電系統公開驗收發表" }
    ]
  },

  // ==========================================
  // 15. 地球科學學系 (GP)
  // ==========================================
  "地球科學學系": {
    name: "地球科學學系",
    tag: "地科",
    code: "GP",
    minorCredits: 20,
    doubleCredits: 40,
    ruleSummary: "★ 官方規章：滿足地球科學學系輔系 20 學分規定（含地球科學通論、程式語言與應用、力學與應用數學）。",
    basic: [
      { name: "GP1019 地球科學通論", credits: 1, type: "選修", stage: "大一上", description: "板塊構造運動、地震波傳播、地磁場與地球內部構造。", tag: "地科探索" },
      { name: "GP1017 程式語言與應用", credits: 2, type: "選修", stage: "大一下", description: "地球科學觀測大數據分析與地球物理資料繪圖。", tag: "地科探索" },
      { name: "GP2002 力學", credits: 3, type: "選修", stage: "大二上", description: "固體地球力學、應力張量、彈性波與斷層滑移物理。", tag: "地科探索" },
      { name: "GP2019 應用數學", credits: 3, type: "選修", stage: "大二下", description: "微積分應用於地質重力場反演與地下構造建模。", tag: "地科探索" }
    ],
    intermediate: [
      { name: "GP1019 地球科學通論", credits: 1, type: "必修", stage: "大一上", description: "輔系指定必修：地函對流、造山運動與地球物理全貌概論。", tag: "地科必修", ruleNote: "★ 官方規章：地科輔系 20 學分核心必修科目。" },
      { name: "GP1020 地球科學的挑戰與機會", credits: 1, type: "必修", stage: "大一上", description: "輔系指定必修：氣候變遷地質記錄、天然災害防減災與地熱永續。", tag: "地科必修", ruleNote: "★ 官方規章：地科輔系指定必修科目。" },
      { name: "GP1017 程式語言與應用", credits: 2, type: "必修", stage: "大一下", description: "輔系指定必修：地震波形資料讀取、訊號濾波與震央定位演算法。", tag: "地科必修", ruleNote: "★ 官方規章：地科輔系指定必修科目。" },
      { name: "GP2002 力學", credits: 3, type: "必修", stage: "大二上", description: "輔系指定必修：連續體力學原理與岩石圈形變量測分析。", tag: "地科必修", ruleNote: "★ 官方規章：地科輔系核心力學科目。" },
      { name: "GP2019 應用數學", credits: 3, type: "必修", stage: "大二下", description: "輔系指定必修：位能理論、拉普拉斯方程式與重磁異常分析。", tag: "地科必修", ruleNote: "★ 官方規章：地科輔系指定必修科目。" },
      { name: "GP2004 遙測科學導論", credits: 2, type: "選修", stage: "大三上", description: "輔系推薦選修：光學雷達 (LiDAR)、InSAR 地表變形觀測與 GIS 分析。", tag: "地科選修" },
      { name: "GP2014 電磁學", credits: 3, type: "選修", stage: "大三下", description: "輔系推薦選修：大地電磁測勘 (MT)、地電阻探勘與地下水文構造。", tag: "地科選修" }
    ],
    advanced: [
      { name: "GP1019 地球科學通論", credits: 1, type: "必修", stage: "大一上", description: "雙主修基礎必修：固體地球物理與動力學機制深入解析。", tag: "地科雙主修" },
      { name: "GP1020 地球科學的挑戰與機會", credits: 1, type: "必修", stage: "大一上", description: "雙主修基礎必修：地質災害預警、深部鑽探與地球能源政策。", tag: "地科雙主修" },
      { name: "GP1017 程式語言與應用", credits: 2, type: "必修", stage: "大一下", description: "雙主修基礎必修：分散式地震即時速報系統與波形反演運算。", tag: "地科雙主修" },
      { name: "GP2002 力學", credits: 3, type: "必修", stage: "大二上", description: "雙主修核心必修：地震破裂動態學、斷層磨擦本構律與應力觸發。", tag: "地科雙主修" },
      { name: "GP2019 應用數學", credits: 3, type: "必修", stage: "大二下", description: "雙主修核心必修：格林函數法、邊界值問題與地球波傳方程式求解。", tag: "地科雙主修" },
      { name: "GP2020 應用數學", credits: 3, type: "必修", stage: "大三上", description: "雙主修核心必修：球面諧波函數與全球重力地磁場建模推導。", tag: "地科雙主修" },
      { name: "GP2014 電磁學", credits: 3, type: "必修", stage: "大三下", description: "雙主修核心必修：地磁反轉、電磁感應測勘與深層岩漿庫偵測。", tag: "地科雙主修" },
      { name: "GP4088 地球科學專題 (Ⅱ)", credits: 3, type: "必修", stage: "大四下", description: "雙主修總整發表：斷層構造鑽探、地震速報或地熱探勘成果發表。", tag: "地科雙主修" }
    ],
    defaultMajorSchedule: [
      { name: "GP1019 地球科學通論", cred: 1, note: "板塊動力學與地球構造全貌" },
      { name: "GP1020 地球科學的挑戰與機會", cred: 1, note: "地質天然災害與永續能源探勘" },
      { name: "GP1017 程式語言與應用", cred: 2, note: "地震波形處理與地科數據分析" },
      { name: "GP2002 力學", cred: 3, note: "岩石圈彈性變形與斷層力學" },
      { name: "GP2019 應用數學", cred: 3, note: "重力異常反演與偏微分方程解算" },
      { name: "GP2020 應用數學", cred: 3, note: "球面諧波展開與地磁場數理模型" },
      { name: "GP2014 電磁學", cred: 3, note: "大地電磁測勘與地下電阻率成像" },
      { name: "GP4088 地球科學專題 (Ⅱ)", cred: 3, note: "地震地質調查專題公開成果發表" }
    ]
  },

  // ==========================================
  // 16. 地球科學學院院學士班 (GA)
  // ==========================================
  "地球科學學院院學士班": {
    name: "地球科學學院院學士班",
    tag: "地科學士",
    code: "GA",
    minorCredits: 20,
    doubleCredits: 40,
    ruleSummary: "★ 官方規章：滿足地球科學學院學士班 20 學分跨領域選修與專題研究規定。",
    basic: [
      { name: "GA1001 地球系統科學研究專題導論", credits: 1, type: "選修", stage: "大一上", description: "跨領域地球系統（岩石、大氣、海洋、太空）整合研討。", tag: "院學士探索" },
      { name: "GA1002 基礎程式語言", credits: 2, type: "選修", stage: "大一下", description: "環境資訊數據分析與跨領域計算程式設計基礎。", tag: "院學士探索" },
      { name: "GA2004 智慧校園實作", credits: 3, type: "選修", stage: "大二上", description: "IoT 感測器架設、環境微氣候與空間地理資訊整合。", tag: "院學士探索" },
      { name: "GA2002 研究計畫寫作", credits: 1, type: "選修", stage: "大二下", description: "跨學門專題企劃、研究方法與科技部大專生計畫書寫作。", tag: "院學士探索" }
    ],
    intermediate: [
      { name: "GA1001 地球系統科學研究專題導論", credits: 1, type: "必修", stage: "大一上", description: "輔系指定必修：地球圈層交互作用與永續環境前沿議題。", tag: "院學士必修", ruleNote: "★ 官方規章：院學士班核心科目。" },
      { name: "GA1002 基礎程式語言", credits: 2, type: "必修", stage: "大一下", description: "輔系指定必修：Python 跨域資料處理、環境感測數據分析。", tag: "院學士必修", ruleNote: "★ 官方規章：院學士班指定必修科目。" },
      { name: "GA2002 研究計畫寫作", credits: 1, type: "必修", stage: "大二上", description: "輔系指定必修：科學論述架構、文獻回顧與跨領域研究設計。", tag: "院學士必修", ruleNote: "★ 官方規章：院學士班指定必修科目。" },
      { name: "GA2004 智慧校園實作", credits: 3, type: "選修", stage: "大二下", description: "輔系推薦選修：微型感測物聯網監測中大校園環境微氣候。", tag: "院學士選修" },
      { name: "GA3001 專題研究I", credits: 2, type: "必修", stage: "大三上", description: "輔系指定必修：指導教授實驗室深入跨學門專題研究。", tag: "院學士必修", ruleNote: "★ 官方規章：院學士班專題研究必修。" },
      { name: "GA3002 專題研究II", credits: 2, type: "必修", stage: "大三下", description: "輔系指定必修：實驗數據驗證、研究成果階段性進度答辯。", tag: "院學士必修", ruleNote: "★ 官方規章：院學士班專題研究必修。" },
      { name: "GA4001 專題研究III", credits: 2, type: "選修", stage: "大四上", description: "輔系推薦選修：跨域總整專題深化與國際學術研討會發表準備。", tag: "院學士選修" }
    ],
    advanced: [
      { name: "GA1001 地球系統科學研究專題導論", credits: 1, type: "必修", stage: "大一上", description: "雙主修基礎必修：跨圈層動力學整合架構。", tag: "院學士雙主修" },
      { name: "GA1002 基礎程式語言", credits: 2, type: "必修", stage: "大一下", description: "雙主修基礎必修：大尺度地球環境資料科學建模。", tag: "院學士雙主修" },
      { name: "GA2002 研究計畫寫作", credits: 1, type: "必修", stage: "大二上", description: "雙主修核心必修：學術獨立提案、嚴謹研究方法設計與論文格式。", tag: "院學士雙主修" },
      { name: "GA2004 智慧校園實作", credits: 3, type: "選修", stage: "大二下", description: "雙主修專業選修：智慧感測系統設計與多感測器即時串流。", tag: "院學士雙主修" },
      { name: "GA3001 專題研究I", credits: 2, type: "必修", stage: "大三上", description: "雙主修核心必修：院級跨領域專案研發第一階段審查。", tag: "院學士雙主修" },
      { name: "GA3002 專題研究II", credits: 2, type: "必修", stage: "大三下", description: "雙主修核心必修：實驗模型成果驗證與專題海報公開展示。", tag: "院學士雙主修" },
      { name: "GA4001 專題研究III", credits: 2, type: "必修", stage: "大四上", description: "雙主修核心必修：跨領域學士專案論文草稿撰寫。", tag: "院學士雙主修" },
      { name: "GA4002 專題研究IV", credits: 2, type: "必修", stage: "大四下", description: "雙主修總整發表：院學士班跨學院總整論文公開口試。", tag: "院學士雙主修" }
    ],
    defaultMajorSchedule: [
      { name: "GA1001 地球系統科學研究專題導論", cred: 1, note: "跨圈層整合系統與永續環境導論" },
      { name: "GA1002 基礎程式語言", cred: 2, note: "環境資料科學與數值分析程式實作" },
      { name: "GA2002 研究計畫寫作", cred: 1, note: "獨立研究提案與學術論文寫作訓練" },
      { name: "GA2004 智慧校園實作", cred: 3, note: "物聯網微氣候即時監測系統建置" },
      { name: "GA3001 專題研究I", cred: 2, note: "跨學門實驗室深入專題研發 (一)" },
      { name: "GA3002 專題研究II", cred: 2, note: "階段性研究成果答辯與成果審查" },
      { name: "GA4001 專題研究III", cred: 2, note: "跨域學術論文架構與國際研討會準備" },
      { name: "GA4002 專題研究IV", cred: 2, note: "院學士跨領域畢業論文公開口試答辯" }
    ]
  },

  // ==========================================
  // 17. 法律與政府學系 (LG)
  // ==========================================
  "法律與政府學系": {
    name: "法律與政府學系",
    tag: "法政",
    code: "LG",
    minorCredits: 20,
    doubleCredits: 40,
    ruleSummary: "★ 官方規章：滿足法律與政府學系輔系 20 學分規定（含憲法、民法總則、刑法總則、行政學及訴訟法）。",
    basic: [
      { name: "LG1001 憲法(一)", credits: 3, type: "選修", stage: "大一上", description: "人權保障體系、權力分立原則與違憲審查制度初探。", tag: "法政探索" },
      { name: "LG1003 民法總則(一)", credits: 2, type: "選修", stage: "大一下", description: "法律行為、權利能力、意思表示瑕疵與代理權理論。", tag: "法政探索" },
      { name: "LG1005 刑法總則(一)", credits: 3, type: "選修", stage: "大二上", description: "犯罪構成要件、違法性、罪責體系與未遂犯犯意評估。", tag: "法政探索" },
      { name: "LG1008 行政學", credits: 2, type: "選修", stage: "大二下", description: "公共政策規劃、政府組織官僚體系與現代公共管理實踐。", tag: "法政探索" }
    ],
    intermediate: [
      { name: "LG1001 憲法(一)", credits: 3, type: "必修", stage: "大一上", description: "輔系指定必修：基本權利限制比例原則與司法院大法官憲法法庭判決。", tag: "法政必修", ruleNote: "★ 官方規章：法政輔系 20 學分核心必修科目。" },
      { name: "LG1003 民法總則(一)", credits: 2, type: "必修", stage: "大一下", description: "輔系指定必修：私法自治基石、消滅時效與權利行使界限。", tag: "法政必修", ruleNote: "★ 官方規章：法政輔系指定必修科目。" },
      { name: "LG1005 刑法總則(一)", credits: 3, type: "必修", stage: "大二上", description: "輔系指定必修：正當防衛、緊急避難、共同正犯與教唆犯責任判定。", tag: "法政必修", ruleNote: "★ 官方規章：法政輔系指定必修科目。" },
      { name: "LG1008 行政學", credits: 2, type: "必修", stage: "大二下", description: "輔系指定必修：政務官與事務官互動、行政決策模型與治理成效。", tag: "法政必修", ruleNote: "★ 官方規章：法政輔系指定必修科目。" },
      { name: "LG0001 民法總則", credits: 2, type: "必修", stage: "大三上", description: "輔系指定核心：進階私法個案法律適用與判決論理解析。", tag: "法政必修", ruleNote: "★ 官方規章：法政輔系核心科目。" },
      { name: "LG0007 民事訴訟法", credits: 3, type: "選修", stage: "大三下", description: "輔系推薦選修：起訴要件、舉證責任分配、辯論主義與判決效力。", tag: "法政選修" },
      { name: "LG0008 刑事訴訟法", credits: 3, type: "選修", stage: "大四上", description: "輔系推薦選修：無罪推定原則、強制處分偵查程序與證據排除法則。", tag: "法政選修" }
    ],
    advanced: [
      { name: "LG1001 憲法(一)", credits: 3, type: "必修", stage: "大一上", description: "雙主修基礎必修：當代民主憲政體系與人權救濟途徑完整精通。", tag: "法政雙主修" },
      { name: "LG1003 民法總則(一)", credits: 2, type: "必修", stage: "大一下", description: "雙主修基礎必修：民事財產權利變更與契約成立效力之精確研析。", tag: "法政雙主修" },
      { name: "LG1005 刑法總則(一)", credits: 3, type: "必修", stage: "大二上", description: "雙主修核心必修：古典與現代刑法理論、三階層體系實務案例演練。", tag: "法政雙主修" },
      { name: "LG1008 行政學", credits: 2, type: "必修", stage: "大二下", description: "雙主修核心必修：當代治理網路、公私協力 (PPP) 與政府危機管理。", tag: "法政雙主修" },
      { name: "LG0004 刑法分則", credits: 2, type: "必修", stage: "大三上", description: "雙主修核心必修：侵害國家法益、社會法益與個人財產法益罪章。", tag: "法政雙主修" },
      { name: "LG0007 民事訴訟法", credits: 3, type: "必修", stage: "大三下", description: "雙主修核心必修：當事人能力、訴訟標的理論與既判力客觀範圍。", tag: "法政雙主修" },
      { name: "LG0008 刑事訴訟法", credits: 3, type: "必修", stage: "大四上", description: "雙主修核心必修：傳聞法則、交互詰問技巧與刑事再審救濟途徑。", tag: "法政雙主修" },
      { name: "LG0007 民事訴訟法", credits: 3, type: "必修", stage: "大四下", description: "雙主修總整發表：模擬法庭實戰辯論或法政前沿專題論文發表。", tag: "法政雙主修" }
    ],
    defaultMajorSchedule: [
      { name: "LG1001 憲法(一)", cred: 3, note: "憲政主義與基本權保障司法審查" },
      { name: "LG1003 民法總則(一)", cred: 2, note: "法律行為與私法自治核心體系" },
      { name: "LG1005 刑法總則(一)", cred: 3, note: "三階層犯罪論與正犯責任歸屬" },
      { name: "LG1008 行政學", cred: 2, note: "現代政府治理與公共政策制定" },
      { name: "LG0004 刑法分則", cred: 2, note: "具體犯罪構成要件與實務判決" },
      { name: "LG0007 民事訴訟法", cred: 3, note: "民事司法審判程序與舉證責任" },
      { name: "LG0008 刑事訴訟法", cred: 3, note: "正當法律程序與證據法則是辨" },
      { name: "LG0007 民事訴訟法", cred: 3, note: "法政模擬法庭公開言詞辯論展覽" }
    ]
  },

  // ==========================================
  // 18. 物理學系 (PH)
  // ==========================================
  "物理學系": {
    name: "物理學系",
    tag: "物理",
    code: "PH",
    minorCredits: 20,
    doubleCredits: 40,
    ruleSummary: "★ 官方規章：滿足物理學系輔系 20 學分規定（含普通物理、普通物理實驗、理論力學與電磁學）。",
    basic: [
      { name: "PH1003 普通物理實驗", credits: 1, type: "選修", stage: "大一上", description: "基本力學量測、轉動慣量與簡諧震盪實驗驗證。", tag: "物理探索" },
      { name: "PH1004 普通物理實驗", credits: 1, type: "選修", stage: "大一下", description: "電路交直流量測、透鏡成像與光學繞射干涉實驗。", tag: "物理探索" },
      { name: "MA1001 微積分", credits: 4, type: "選修", stage: "大二上", description: "單變數多變數微積分在物理模型推導之扎實應用。", tag: "物理探索" },
      { name: "EE2004 電磁學 Ｉ", credits: 3, type: "選修", stage: "大二下", description: "靜電位能、高斯定律與安培環路定律基本推導。", tag: "物理探索" }
    ],
    intermediate: [
      { name: "PH1003 普通物理實驗", credits: 1, type: "必修", stage: "大一上", description: "輔系指定必修：誤差分析、精準儀器量測與實驗報告寫作規範。", tag: "物理必修", ruleNote: "★ 官方規章：物理輔系 20 學分核心必修實驗。" },
      { name: "PH1004 普通物理實驗", credits: 1, type: "必修", stage: "大一下", description: "輔系指定必修：示波器操作、磁場量測與邁克生干涉儀實驗。", tag: "物理必修", ruleNote: "★ 官方規章：物理輔系指定必修實驗。" },
      { name: "MA1001 微積分", credits: 4, type: "必修", stage: "大一上", description: "輔系指定必修：數理嚴密推導極限、微分方程與級數展開。", tag: "物理必修", ruleNote: "★ 官方規章：物理輔系指定基礎數理科目。" },
      { name: "MA1002 微積分", credits: 4, type: "必修", stage: "大一下", description: "輔系指定必修：重積分、線積分、面積分與散度定理應用。", tag: "物理必修", ruleNote: "★ 官方規章：物理輔系指定必修科目。" },
      { name: "SS2001 力學", credits: 3, type: "必修", stage: "大二上", description: "輔系指定必修：古典理論力學、哈密頓原理與質點系運動方程。", tag: "物理必修", ruleNote: "★ 官方規章：物理輔系指定必修力學科目。" },
      { name: "EE2004 電磁學 Ｉ", credits: 3, type: "必修", stage: "大二下", description: "輔系指定必修：馬克士威爾方程式、靜態電磁場能量與向量位。", tag: "物理必修", ruleNote: "★ 官方規章：物理輔系指定必修科目。" },
      { name: "OS2001 近代物理", credits: 3, type: "選修", stage: "大三上", description: "輔系推薦選修：波粒二象性、原子光譜量子化與狹義相對論導論。", tag: "物理選修" }
    ],
    advanced: [
      { name: "PH1003 普通物理實驗", credits: 1, type: "必修", stage: "大一上", description: "雙主修基礎必修：力學光學實驗驗證與數據誤差分析。", tag: "物理雙主修" },
      { name: "PH1004 普通物理實驗", credits: 1, type: "必修", stage: "大一下", description: "雙主修基礎必修：電磁學近代物理實驗儀器實作操作。", tag: "物理雙主修" },
      { name: "MA1001 微積分", credits: 4, type: "必修", stage: "大一上", description: "雙主修基礎必修：嚴密數理分析與物理微分方程打底。", tag: "物理雙主修" },
      { name: "MA1002 微積分", credits: 4, type: "必修", stage: "大一下", description: "雙主修基礎必修：向量微積分與場論數學核心訓練。", tag: "物理雙主修" },
      { name: "SS2001 力學", credits: 3, type: "必修", stage: "大二上", description: "雙主修核心必修：經典力學微分方程求解與非線性擺動。", tag: "物理雙主修" },
      { name: "EE2004 電磁學 Ｉ", credits: 3, type: "必修", stage: "大二下", description: "雙主修核心必修：電磁邊界條件、多極展開與導體介電質極化。", tag: "物理雙主修" },
      { name: "OS2001 近代物理", credits: 3, type: "必修", stage: "大三上", description: "雙主修核心必修：量子力學一維位能阱求解與統計物理導論。", tag: "物理雙主修" },
      { name: "PH3016 物理專題II", credits: 3, type: "必修", stage: "大四下", description: "雙主修總整發表：凝態物理、高能粒子或量子光學專題展示。", tag: "物理雙主修" }
    ],
    defaultMajorSchedule: [
      { name: "PH1003 普通物理實驗", cred: 1, note: "古典力學與熱學精準實驗量測" },
      { name: "PH1004 普通物理實驗", cred: 1, note: "電磁光學示波器與干涉儀實作" },
      { name: "MA1001 微積分", cred: 4, note: "單變數微積分與物理運動方程式" },
      { name: "MA1002 微積分", cred: 4, note: "多重積分與向量微積分格林定理" },
      { name: "SS2001 力學", cred: 3, note: "拉格朗日力學與守恆律數學推導" },
      { name: "EE2004 電磁學 Ｉ", cred: 3, note: "靜電磁場高斯定律與電磁位能" },
      { name: "OS2001 近代物理", cred: 3, note: "量子波粒二象性與原子能階躍遷" },
      { name: "PH3016 物理專題II", cred: 3, note: "物理前沿實驗室專案成果公開展覽" }
    ]
  },

  // ==========================================
  // 19. 客家語文與社會 (HK)
  // ==========================================
  "客家語文與社會": {
    name: "客家語文與社會",
    tag: "客家",
    code: "HK",
    minorCredits: 20,
    doubleCredits: 40,
    ruleSummary: "★ 官方規章：滿足客家學院輔系 20 學分規定（含基礎客語、客家文化概論、社會學與客家移墾史）。",
    basic: [
      { name: "HK1001 基礎客語Ⅰ", credits: 2, type: "選修", stage: "大一上", description: "客語四縣海陸調腔發音拼音、日常生活情境實用語詞。", tag: "客家探索" },
      { name: "HK1002 基礎客語 II", credits: 2, type: "選修", stage: "大一下", description: "日常生活進階口語對話、客家歌謠與民間故事聆賞。", tag: "客家探索" },
      { name: "HK1009 客家文化概論", credits: 2, type: "選修", stage: "大二上", description: "客家族群歷史源流、夥房建築、信仰民俗與文化特質。", tag: "客家探索" },
      { name: "HK1005 社會學", credits: 2, type: "選修", stage: "大二下", description: "社會結構、族群認同、階級分層與當代社會變遷議題。", tag: "客家探索" }
    ],
    intermediate: [
      { name: "HK1001 基礎客語Ⅰ", credits: 2, type: "必修", stage: "大一上", description: "輔系指定必修：客語音標系統認讀、聲調規律與朗讀會話訓練。", tag: "客家必修", ruleNote: "★ 官方規章：客家輔系 20 學分核心必修科目。" },
      { name: "HK1002 基礎客語 II", credits: 2, type: "必修", stage: "大一下", description: "輔系指定必修：情境句型造句、詞彙擴充與客語認證中級實戰模擬。", tag: "客家必修", ruleNote: "★ 官方規章：客家輔系指定必修科目。" },
      { name: "HK1009 客家文化概論", credits: 2, type: "必修", stage: "大二上", description: "輔系指定必修：台灣客家文史脈絡、民俗歲時節慶與文化資產保存。", tag: "客家必修", ruleNote: "★ 官方規章：客家輔系指定必修科目。" },
      { name: "HK1010 客家文化概論", credits: 2, type: "必修", stage: "大二下", description: "輔系指定必修：全球客家社群網絡、海外移民與文化流變比較分析。", tag: "客家必修", ruleNote: "★ 官方規章：客家輔系指定必修科目。" },
      { name: "HK1005 社會學", credits: 2, type: "必修", stage: "大二上", description: "輔系指定必修：社會學理論視角分析族群關係、文化資本與多元社會。", tag: "客家必修", ruleNote: "★ 官方規章：客家輔系指定必修科目。" },
      { name: "HK1015 臺灣客家移墾史", credits: 3, type: "選修", stage: "大三上", description: "輔系推薦選修：清代客家移民拓墾水利、隘防體系與聚落形成史。", tag: "客家選修" },
      { name: "HK1014 影像紀錄製作基礎課程", credits: 2, type: "選修", stage: "大三下", description: "輔系推薦選修：田野口述歷史訪談、紀錄片攝製與族群文化影像傳播。", tag: "客家選修" }
    ],
    advanced: [
      { name: "HK1001 基礎客語Ⅰ", credits: 2, type: "必修", stage: "大一上", description: "雙主修基礎必修：客家語言音韻結構與雙腔調對照精通。", tag: "客家雙主修" },
      { name: "HK1002 基礎客語 II", credits: 2, type: "必修", stage: "大一下", description: "雙主修基礎必修：高階客語即席演講、田野採集口語轉換能力。", tag: "客家雙主修" },
      { name: "HK1009 客家文化概論", credits: 2, type: "必修", stage: "大二上", description: "雙主修核心必修：族群認同理論、客家學研究方法與文化政治學。", tag: "客家雙主修" },
      { name: "HK1010 客家文化概論", credits: 2, type: "必修", stage: "大二下", description: "雙主修核心必修：東南亞與美洲客家移民聚落與跨國經貿網絡。", tag: "客家雙主修" },
      { name: "HK1005 社會學", credits: 2, type: "必修", stage: "大二上", description: "雙主修核心必修：涂爾幹、韋伯與馬克思經典社會學理論研讀。", tag: "客家雙主修" },
      { name: "HK1015 臺灣客家移墾史", credits: 3, type: "必修", stage: "大三上", description: "雙主修核心必修：歷史文獻檔案判讀、古地圖解讀與家族譜牒研究。", tag: "客家雙主修" },
      { name: "HK1014 影像紀錄製作基礎課程", credits: 2, type: "必修", stage: "大三下", description: "雙主修核心必修：非虛構地方創生紀錄短片獨立編導剪輯實務。", tag: "客家雙主修" },
      { name: "HK1014 影像紀錄製作基礎課程", credits: 3, type: "必修", stage: "大四下", description: "雙主修總整發表：客家文創政策、語言數位典藏或田野論文發表。", tag: "客家雙主修" }
    ],
    defaultMajorSchedule: [
      { name: "HK1001 基礎客語Ⅰ", cred: 2, note: "客語語音音標與基礎對話練習" },
      { name: "HK1002 基礎客語 II", cred: 2, note: "進階客語會話與文化語詞應用" },
      { name: "HK1009 客家文化概論", cred: 2, note: "族群起源遷徙與夥房民俗信仰" },
      { name: "HK1010 客家文化概論", cred: 2, note: "全球客家移民網絡與比較研究" },
      { name: "HK1005 社會學", cred: 2, note: "族群關係、文化資本與社會結構" },
      { name: "HK1015 臺灣客家移墾史", cred: 3, note: "拓墾聚落史料判讀與田野調查" },
      { name: "HK1014 影像紀錄製作基礎課程", cred: 2, note: "口述歷史訪談與紀錄片拍攝實作" },
      { name: "HK1014 影像紀錄製作基礎課程", cred: 3, note: "客家文化跨領域專案公開發表展示" }
    ]
  },

  // ==========================================
  // 20. 數學系 (MA)
  // ==========================================
  "數學系": {
    name: "數學系",
    tag: "數學",
    code: "MA",
    minorCredits: 20,
    doubleCredits: 40,
    ruleSummary: "★ 官方規章：滿足數學系輔系 20 學分規定（含微積分、線性代數與高等微積分核心先修）。",
    basic: [
      { name: "MA1001 微積分", credits: 4, type: "選修", stage: "大一上", description: "單變數函數極限、連續性、導數運算與積分技巧通論。", tag: "數學探索" },
      { name: "MA1002 微積分", credits: 4, type: "選修", stage: "大一下", description: "多變數微積分、偏導數、重積分與向量微積分定理入門。", tag: "數學探索" },
      { name: "CO1007 工程數學-線性代數", credits: 3, type: "選修", stage: "大二上", description: "向量空間、矩陣運算、特徵值特徵向量與正交對角化。", tag: "數學探索" },
      { name: "CE3005 演算法", credits: 3, type: "選修", stage: "大二下", description: "離散數學邏輯思維與圖論複雜度數理證明實踐。", tag: "數學探索" }
    ],
    intermediate: [
      { name: "MA1001 微積分", credits: 4, type: "必修", stage: "大一上", description: "輔系指定必修：嚴格伊普西龍-德爾塔 (ε-δ) 極限定理與微分均值定理。", tag: "數學必修", ruleNote: "★ 官方規章：數學輔系 20 學分核心必修科目。" },
      { name: "MA1002 微積分", credits: 4, type: "必修", stage: "大一下", description: "輔系指定必修：級數收斂檢驗、泰勒級數、格林定理與史托克定理。", tag: "數學必修", ruleNote: "★ 官方規章：數學輔系指定必修科目。" },
      { name: "CO1007 工程數學-線性代數", credits: 3, type: "必修", stage: "大二上", description: "輔系指定必修：線性映射、核空間值域與奇異值分解 (SVD)。", tag: "數學必修", ruleNote: "★ 官方規章：數學輔系指定必修科目。" },
      { name: "CE3005 演算法", credits: 3, type: "選修", stage: "大二下", description: "輔系推薦選修：計算複雜度理論、圖論拓撲與數學歸納證明。", tag: "數學選修" },
      { name: "BAA057 統計學", credits: 3, type: "選修", stage: "大三上", description: "輔系推薦選修：機率分配、大數法則、中央極限定理與不偏估計。", tag: "數學選修" },
      { name: "EC3018 計量經濟學(一)", credits: 3, type: "選修", stage: "大三下", description: "輔系推薦選修：多變量隨機過程與數理金融統計模型實作。", tag: "數學選修" }
    ],
    advanced: [
      { name: "MA1001 微積分", credits: 4, type: "必修", stage: "大一上", description: "雙主修基礎必修：純數學分析奠基，完整掌握極限與連續拓撲性質。", tag: "數學雙主修" },
      { name: "MA1002 微積分", credits: 4, type: "必修", stage: "大一下", description: "雙主修基礎必修：歐氏空間向量微積分與微分形式幾何入門。", tag: "數學雙主修" },
      { name: "CO1007 工程數學-線性代數", credits: 3, type: "必修", stage: "大二上", description: "雙主修核心必修：抽象代數結構導向之向量空間與內積空間定理。", tag: "數學雙主修" },
      { name: "CE3005 演算法", credits: 3, type: "必修", stage: "大二下", description: "雙主修核心必修：離散結構的最優化理論、圖論演算法與組合數學。", tag: "數學雙主修" },
      { name: "BAA057 統計學", credits: 3, type: "必修", stage: "大三上", description: "雙主修核心必修：數理統計學推論基礎與最大概似估計量證明。", tag: "數學雙主修" },
      { name: "EC3018 計量經濟學(一)", credits: 3, type: "必修", stage: "大三下", description: "雙主修核心必修：高維隨機矩陣運算與時間序列平穩性數學檢定。", tag: "數學雙主修" },
      { name: "MA1002 微積分", credits: 3, type: "必修", stage: "大四下", description: "雙主修總整發表：純粹數學論文證明或科學計算建模成果公開答辯。", tag: "數學雙主修" }
    ],
    defaultMajorSchedule: [
      { name: "MA1001 微積分", cred: 4, note: "單變數函數極限與微積分理論推導" },
      { name: "MA1002 微積分", cred: 4, note: "多變數微積分與高維向量場分析" },
      { name: "CO1007 工程數學-線性代數", cred: 3, note: "抽象向量空間與矩陣對角化分解" },
      { name: "CE3005 演算法", cred: 3, note: "離散數學邏輯與最優化證明技巧" },
      { name: "BAA057 統計學", cred: 3, note: "機率測度論與大樣本統計推論" },
      { name: "EC3018 計量經濟學(一)", cred: 3, note: "高維矩陣統計迴歸與時間序列" },
      { name: "MA1002 微積分", cred: 3, note: "高等數學理論專題公開答辯展覽" },
      { name: "MA1001 微積分", cred: 2, note: "前沿數學研究專題探討與成果交流" }
    ]
  },

  // ==========================================
  // 21. 土木工程學系 (CI)
  // ==========================================
  "土木工程學系": {
    name: "土木工程學系",
    tag: "土木",
    code: "CI",
    minorCredits: 20,
    doubleCredits: 40,
    ruleSummary: "★ 官方規章：滿足土木工程學系輔系 20 學分規定（含土木概論、應用力學、測量學與材料力學）。",
    basic: [
      { name: "CI1002 土木工程概論", credits: 1, type: "選修", stage: "大一上", description: "結構工程、水利大地、交通與永續綠建築工程基礎通論。", tag: "土木探索" },
      { name: "CI1005 應用力學", credits: 3, type: "選修", stage: "大一下", description: "質點力系平衡、桁架分析、重心與摩擦力工程計算。", tag: "土木探索" },
      { name: "CI1009 測量學", credits: 3, type: "選修", stage: "大二上", description: "水準測量、經緯儀角度測量與工程地形圖繪製基礎。", tag: "土木探索" },
      { name: "CI2004 材料力學", credits: 3, type: "選修", stage: "大二下", description: "軸向應力應變、梁彎曲應力、扭轉剪應力與撓度計算。", tag: "土木探索" }
    ],
    intermediate: [
      { name: "CI1002 土木工程概論", credits: 1, type: "必修", stage: "大一上", description: "輔系指定必修：基礎建設智慧化、BIM 建築資訊模型導論。", tag: "土木必修", ruleNote: "★ 官方規章：土木輔系 20 學分核心必修科目。" },
      { name: "CI1005 應用力學", credits: 3, type: "必修", stage: "大一上", description: "輔系指定必修：剛體平衡方程式、虛功原理與內力分佈圖解。", tag: "土木必修", ruleNote: "★ 官方規章：土木輔系指定必修科目。" },
      { name: "CI1009 測量學", credits: 3, type: "必修", stage: "大一下", description: "輔系指定必修：GPS 衛星定位、全測站儀操作與誤差傳播定律。", tag: "土木必修", ruleNote: "★ 官方規章：土木輔系指定必修科目。" },
      { name: "CI1010 測量實習", credits: 1, type: "必修", stage: "大一下", description: "輔系指定必修：校園戶外導線測量實務操作與閉合差計算校正。", tag: "土木必修", ruleNote: "★ 官方規章：土木輔系指定必修實習。" },
      { name: "CI2004 材料力學", credits: 3, type: "必修", stage: "大二上", description: "輔系指定必修：莫爾圓應力轉換、複合梁分析與柱之挫屈理論。", tag: "土木必修", ruleNote: "★ 官方規章：土木輔系核心力學科目。" },
      { name: "CI2005 工程材料學", credits: 3, type: "必修", stage: "大二下", description: "輔系指定必修：混凝土配比設計、鋼筋力學性質與瀝青鋪面材料。", tag: "土木必修", ruleNote: "★ 官方規章：土木輔系指定必修科目。" },
      { name: "CI2007 工程圖學", credits: 1, type: "選修", stage: "大三上", description: "輔系推薦選修：AutoCAD 電腦輔助製圖、三視圖與施工結構圖判讀。", tag: "土木選修" }
    ],
    advanced: [
      { name: "CI1002 土木工程概論", credits: 1, type: "必修", stage: "大一上", description: "雙主修基礎必修：國家大型重大公共工程管理全流程。", tag: "土木雙主修" },
      { name: "CI1005 應用力學", credits: 3, type: "必修", stage: "大一上", description: "雙主修基礎必修：空間桁架與剛架力學平衡深入推導。", tag: "土木雙主修" },
      { name: "CI1009 測量學", credits: 3, type: "必修", stage: "大一下", description: "雙主修基礎必修：大地測量坐標系統轉換與三維空間點雲處理。", tag: "土木雙主修" },
      { name: "CI1010 測量實習", credits: 1, type: "必修", stage: "大一下", description: "雙主修必修實習：高精度全測站儀三角高程測量綜合實習。", tag: "土木雙主修" },
      { name: "CI2004 材料力學", credits: 3, type: "必修", stage: "大二上", description: "雙主修核心必修：三維主應力狀態分析、能量法求位移與破壞準則。", tag: "土木雙主修" },
      { name: "CI2005 工程材料學", credits: 3, type: "必修", stage: "大二下", description: "雙主修核心必修：材料微觀結構微裂縫擴展與耐久性試驗機制。", tag: "土木雙主修" },
      { name: "CI2007 工程圖學", credits: 1, type: "必修", stage: "大三上", description: "雙主修必修：BIM 3D 建築結構參數化建模實戰驗收。", tag: "土木雙主修" },
      { name: "CI3052 專題研究 I", credits: 3, type: "必修", stage: "大四下", description: "雙主修總整發表：耐震結構設計、智慧邊坡監測或橋梁工程模型展示。", tag: "土木雙主修" }
    ],
    defaultMajorSchedule: [
      { name: "CI1002 土木工程概論", cred: 1, note: "現代基礎設施與智慧營建導論" },
      { name: "CI1005 應用力學", cred: 3, note: "質點剛體平衡與結構內力分析" },
      { name: "CI1009 測量學", cred: 3, note: "現代空間測量與高程坐標系統" },
      { name: "CI1010 測量實習", cred: 1, note: "校園戶外全測站儀實地實習" },
      { name: "CI2004 材料力學", cred: 3, note: "應力應變轉換與梁柱受力分析" },
      { name: "CI2005 工程材料學", cred: 3, note: "高性能混凝土與鋼結構材料特性" },
      { name: "CI2007 工程圖學", cred: 1, note: "BIM 3D 結構建模與工程施工圖" },
      { name: "CI3052 專題研究 I", cred: 3, note: "土木工程實務專案公開驗收發表" }
    ]
  },

  // ==========================================
  // 22. 大氣科學學系 (AP)
  // ==========================================
  "大氣科學學系": {
    name: "大氣科學學系",
    tag: "大氣",
    code: "AP",
    minorCredits: 20,
    doubleCredits: 40,
    ruleSummary: "★ 官方規章：滿足大氣科學學系輔系 20 學分規定（含大氣科學概論、應用數學、流體力學與大氣動力學）。",
    basic: [
      { name: "AP1001 大氣科學概論", credits: 1, type: "選修", stage: "大一上", description: "大氣垂直構造、天氣系統、溫室效應與氣候變遷通論。", tag: "大氣探索" },
      { name: "AP1006 向量分析", credits: 2, type: "選修", stage: "大一下", description: "氣象場旋度散度、梯度運算與流場流線數學解析。", tag: "大氣探索" },
      { name: "AP2010 流體力學", credits: 3, type: "選修", stage: "大二上", description: "納維-斯托克斯 (N-S) 方程式在大氣旋轉流場之簡化應用。", tag: "大氣探索" },
      { name: "AP2011 大氣熱力學", credits: 3, type: "選修", stage: "大二下", description: "絕熱直減率、斜壓圖判讀、水氣凝結與對流胞胞發展機制。", tag: "大氣探索" }
    ],
    intermediate: [
      { name: "AP1001 大氣科學概論", credits: 1, type: "必修", stage: "大一上", description: "輔系指定必修：輻射平衡、大氣環流與颱風梅雨天氣系統全貌。", tag: "大氣必修", ruleNote: "★ 官方規章：大氣輔系 20 學分核心必修科目。" },
      { name: "AP1006 向量分析", credits: 2, type: "必修", stage: "大一下", description: "輔系指定必修：旋轉坐標系柯氏力、渦度方程式數理工具打底。", tag: "大氣必修", ruleNote: "★ 官方規章：大氣輔系指定必修科目。" },
      { name: "AP2007 應用數學", credits: 3, type: "必修", stage: "大二上", description: "輔系指定必修：數值天氣預報偏微分方程數值解算與邊界條件。", tag: "大氣必修", ruleNote: "★ 官方規章：大氣輔系核心數學科目。" },
      { name: "AP2010 流體力學", credits: 3, type: "必修", stage: "大二上", description: "輔系指定必修：旋轉流體地轉平衡、熱成風關係式推導。", tag: "大氣必修", ruleNote: "★ 官方規章：大氣輔系指定必修科目。" },
      { name: "AP2011 大氣熱力學", credits: 3, type: "必修", stage: "大二下", description: "輔系指定必修：大氣穩定度判別、潛熱釋放與強對流豪雨機制。", tag: "大氣必修", ruleNote: "★ 官方規章：大氣輔系核心科目。" },
      { name: "AP3001 大氣動力學", credits: 3, type: "必修", stage: "大三上", description: "輔系指定必修：行星波、準地轉動力學與大氣槽脊發展理論。", tag: "大氣必修", ruleNote: "★ 官方規章：大氣輔系指定高階必修科目。" },
      { name: "AP2039 大氣測計及操作Ⅰ", credits: 3, type: "選修", stage: "大三下", description: "輔系推薦選修：氣象雷達回波判讀、探空氣球施放與氣象衛星資料分析。", tag: "大氣選修" }
    ],
    advanced: [
      { name: "AP1001 大氣科學概論", credits: 1, type: "必修", stage: "大一上", description: "雙主修基礎必修：全球氣候系統與極端天氣事件成因深入探討。", tag: "大氣雙主修" },
      { name: "AP1006 向量分析", credits: 2, type: "必修", stage: "大一下", description: "雙主修基礎必修：球坐標旋轉流體場算子與環流定理數學推導。", tag: "大氣雙主修" },
      { name: "AP2007 應用數學", credits: 3, type: "必修", stage: "大二上", description: "雙主修核心必修：氣象數值離散網格化、傅立葉譜方法數值分析。", tag: "大氣雙主修" },
      { name: "AP2010 流體力學", credits: 3, type: "必修", stage: "大二上", description: "雙主修核心必修：大氣邊界層紊流、摩擦耗散與動量垂直傳輸。", tag: "大氣雙主修" },
      { name: "AP2011 大氣熱力學", credits: 3, type: "必修", stage: "大二下", description: "雙主修核心必修：水相變熱力學、微物理過程與雲物理數值參數化。", tag: "大氣雙主修" },
      { name: "AP3001 大氣動力學", credits: 3, type: "必修", stage: "大三上", description: "雙主修核心必修：斜壓不穩定理論、溫帶氣旋生成與波流交互作用。", tag: "大氣雙主修" },
      { name: "AP2039 大氣測計及操作Ⅰ", credits: 3, type: "必修", stage: "大三下", description: "雙主修核心必修：雙偏極化都卜勒雷達雨量推估與即時天氣預警實習。", tag: "大氣雙主修" },
      { name: "AP2101 大氣科學專題Ⅰ", credits: 3, type: "必修", stage: "大四下", description: "雙主修總整發表：數值天氣預報模式改進或氣候變遷衝擊分析論文展。", tag: "大氣雙主修" }
    ],
    defaultMajorSchedule: [
      { name: "AP1001 大氣科學概論", cred: 1, note: "全球天氣系統與大氣環流基礎" },
      { name: "AP1006 向量分析", cred: 2, note: "旋轉流場渦度與氣象場向量微積分" },
      { name: "AP2007 應用數學", cred: 3, note: "大氣偏微分方程與數值離散算法" },
      { name: "AP2010 流體力學", cred: 3, note: "地轉平衡與熱成風動力方程" },
      { name: "AP2011 大氣熱力學", cred: 3, note: "大氣穩定度與水氣對流潛熱機制" },
      { name: "AP3001 大氣動力學", cred: 3, note: "準地轉理論與溫帶氣旋槽脊動態" },
      { name: "AP2039 大氣測計及操作Ⅰ", cred: 3, note: "都卜勒雷達與氣象衛星實地觀測" },
      { name: "AP2101 大氣科學專題Ⅰ", cred: 3, note: "大氣數值預報專題公開成果展示" }
    ]
  },

  // ==========================================
  // 23. 化學學系 (CM)
  // ==========================================
  "化學系": {
    name: "化學系",
    tag: "化學",
    code: "CM",
    minorCredits: 20,
    doubleCredits: 40,
    ruleSummary: "★ 官方規章：滿足化學系輔系 20 學分規定（含普通化學、普通化學實驗、分析化學與有機化學）。",
    basic: [
      { name: "CM1001 普通化學", credits: 3, type: "選修", stage: "大一上", description: "原子軌域、化學鍵結理論、熱化學與化學反應動力學通論。", tag: "化學探索" },
      { name: "CM1003 普通化學實驗", credits: 1, type: "選修", stage: "大一上", description: "化學滴定分析、溶液配製與沉澱反應實驗實習。", tag: "化學探索" },
      { name: "CM1002 普通化學", credits: 3, type: "選修", stage: "大一下", description: "酸鹼平衡、電化學電池、過渡金屬配位化學通論。", tag: "化學探索" },
      { name: "CM1004 普通化學實驗", credits: 1, type: "選修", stage: "大一下", description: "電解電鍍實驗、分光光度計吸光值測定實務。", tag: "化學探索" }
    ],
    intermediate: [
      { name: "CM1001 普通化學", credits: 3, type: "必修", stage: "大一上", description: "輔系指定必修：分子軌域 (MO) 理論、晶體結構與相圖分析。", tag: "化學必修", ruleNote: "★ 官方規章：化學輔系 20 學分核心必修科目。" },
      { name: "CM1003 普通化學實驗", credits: 1, type: "必修", stage: "大一上", description: "輔系指定必修：精準重量分析、標準酸鹼溶液標定實作檢定。", tag: "化學必修", ruleNote: "★ 官方規章：化學輔系指定必修實驗。" },
      { name: "CM1002 普通化學", credits: 3, type: "必修", stage: "大一下", description: "輔系指定必修：能斯特方程式、氧化還原反應與錯化合物反應性。", tag: "化學必修", ruleNote: "★ 官方規章：化學輔系指定必修科目。" },
      { name: "CM1004 普通化學實驗", credits: 1, type: "必修", stage: "大一下", description: "輔系指定必修：分光比色法定律驗證與化學動力學速率常數測定。", tag: "化學必修", ruleNote: "★ 官方規章：化學輔系指定必修實驗。" },
      { name: "CM2021 分析化學", credits: 3, type: "必修", stage: "大二上", description: "輔系指定必修：沉澱滴定、錯合滴定、統計數據誤差評估與緩衝溶液。", tag: "化學必修", ruleNote: "★ 官方規章：化學輔系指定必修核心科目。" },
      { name: "CH2001 有機化學", credits: 3, type: "必修", stage: "大二下", description: "輔系指定必修：立體化學、親核取代 (SN1/SN2) 與脫去反應機制。", tag: "化學必修", ruleNote: "★ 官方規章：化學輔系指定必修科目。" },
      { name: "CM2012 化學動力學", credits: 2, type: "選修", stage: "大三上", description: "輔系推薦選修：反應過渡態理論、阿瑞尼斯方程式與催化反應活化能。", tag: "化學選修" }
    ],
    advanced: [
      { name: "CM1001 普通化學", credits: 3, type: "必修", stage: "大一上", description: "雙主修基礎必修：現代化學鍵結與熱力學平衡嚴密推導。", tag: "化學雙主修" },
      { name: "CM1003 普通化學實驗", credits: 1, type: "必修", stage: "大一上", description: "雙主修必修實習：實驗數據統計檢驗與無機合成技術操作。", tag: "化學雙主修" },
      { name: "CM1002 普通化學", credits: 3, type: "必修", stage: "大一下", description: "雙主修基礎必修：配位化學晶體場理論與光化學反應機制。", tag: "化學雙主修" },
      { name: "CM1004 普通化學實驗", credits: 1, type: "必修", stage: "大一下", description: "雙主修必修實習：電位滴定曲線繪製與錯合物穩定常數計算。", tag: "化學雙主修" },
      { name: "CM2021 分析化學", credits: 3, type: "必修", stage: "大二上", description: "雙主修核心必修：高效液相層析 (HPLC)、氣相層析 (GC) 與儀器分析原理。", tag: "化學雙主修" },
      { name: "CH2001 有機化學", credits: 3, type: "必修", stage: "大二下", description: "雙主修核心必修：芳香族親電取代、碳基加成反應與全合成策略。", tag: "化學雙主修" },
      { name: "CH2005 物理化學", credits: 3, type: "必修", stage: "大三上", description: "雙主修核心必修：量子化學基礎、統計熱力學與分子光譜學。", tag: "化學雙主修" },
      { name: "CM4001 畢業專案研究", credits: 3, type: "必修", stage: "大四下", description: "雙主修總整發表：有機新藥合成、材料奈米催化或理論計算發表。", tag: "化學雙主修" }
    ],
    defaultMajorSchedule: [
      { name: "CM1001 普通化學", cred: 3, note: "原子軌域鍵結與化學熱力學" },
      { name: "CM1003 普通化學實驗", cred: 1, note: "標準定量分析與滴定化學實驗" },
      { name: "CM1002 普通化學", cred: 3, note: "氧化還原電化學與過渡金屬錯合" },
      { name: "CM1004 普通化學實驗", cred: 1, note: "分光比色與化學反應動力學測定" },
      { name: "CM2021 分析化學", cred: 3, note: "層析分離技術與精密儀器定量分析" },
      { name: "CH2001 有機化學", cred: 3, note: "有機分子結構反應性與機構推導" },
      { name: "CH2005 物理化學", cred: 3, note: "量子分子軌域與統計熱力學狀態" },
      { name: "CM4001 畢業專案研究", cred: 3, note: "化學合成與分析專題成果公開答辯" }
    ]
  },

  // ==========================================
  // 24. 化學工程與材料工程學系 (CH)
  // ==========================================
  "化學工程與材料工程學系": {
    name: "化學工程與材料工程學系",
    tag: "化材",
    code: "CH",
    minorCredits: 20,
    doubleCredits: 40,
    ruleSummary: "★ 官方規章：滿足化材系輔系 20 學分規定（含質能平衡、材料工程概論、有機化學與單元操作）。",
    basic: [
      { name: "CH1012 質能平衡與化工計算", credits: 3, type: "選修", stage: "大一上", description: "化學工程系統穩態非穩態質量守恆與能量守恆計算基石。", tag: "化材探索" },
      { name: "CH1023 材料工程概論I", credits: 3, type: "選修", stage: "大一下", description: "晶體結構缺陷、金屬晶相圖與半導體材料特性導論。", tag: "化材探索" },
      { name: "CH2001 有機化學", credits: 3, type: "選修", stage: "大二上", description: "烴類化合物、高分子聚合物結構與有機合成反應機制。", tag: "化材探索" },
      { name: "CH2021 輸送現象與單元操作Ｉ", credits: 3, type: "選修", stage: "大二下", description: "流體流動動量傳送、管路壓降與化工泵浦選用計算。", tag: "化材探索" }
    ],
    intermediate: [
      { name: "CH1012 質能平衡與化工計算", credits: 3, type: "必修", stage: "大一上", description: "輔系指定必修：反應器物料循環、旁路計算與熱力燃燒焓平衡。", tag: "化材必修", ruleNote: "★ 官方規章：化材輔系 20 學分核心必修科目。" },
      { name: "CH1023 材料工程概論I", credits: 3, type: "必修", stage: "大一下", description: "輔系指定必修：鐵碳平衡相圖、差排力學強化與材料熱處理技術。", tag: "化材必修", ruleNote: "★ 官方規章：化材輔系指定必修科目。" },
      { name: "CH2001 有機化學", credits: 3, type: "必修", stage: "大二上", description: "輔系指定必修：自由基聚合反應、芳香烴官能基轉換與立體化學。", tag: "化材必修", ruleNote: "★ 官方規章：化材輔系指定必修科目。" },
      { name: "CH2005 物理化學", credits: 3, type: "必修", stage: "大二下", description: "輔系指定必修：化學熱力學三大定律、吉布斯自由能與相平衡。", tag: "化材必修", ruleNote: "★ 官方規章：化材輔系指定核心科目。" },
      { name: "CH2021 輸送現象與單元操作Ｉ", credits: 3, type: "必修", stage: "大三上", description: "輔系指定必修：熱量傳送熱傳導、熱對流與熱交換器板型設計實務。", tag: "化材必修", ruleNote: "★ 官方規章：化材輔系指定必修科目。" },
      { name: "CH1022 基礎材料化學實驗 I", credits: 1, type: "選修", stage: "大三下", description: "輔系推薦選修：奈米金顆粒合成、聚合物分子量測定實作檢驗。", tag: "化材選修" },
      { name: "CH2026 結晶繞射概論", credits: 3, type: "選修", stage: "大四上", description: "輔系推薦選修：X光繞射 (XRD) 晶格常數解析與布拉格定律應用。", tag: "化材選修" }
    ],
    advanced: [
      { name: "CH1012 質能平衡與化工計算", credits: 3, type: "必修", stage: "大一上", description: "雙主修基礎必修：工業級大型化工場程序平衡精確計算。", tag: "化材雙主修" },
      { name: "CH1023 材料工程概論I", credits: 3, type: "必修", stage: "大一下", description: "雙主修基礎必修：先進陶瓷、電子封裝材料與奈米碳管微結構。", tag: "化材雙主修" },
      { name: "CH2001 有機化學", credits: 3, type: "必修", stage: "大二上", description: "雙主修核心必修：光電半導體光阻材料化學與高分子流變特性。", tag: "化材雙主修" },
      { name: "CH2005 物理化學", credits: 3, type: "必修", stage: "大二下", description: "雙主修核心必修：化學平衡常數、非理想溶液活度與表面界面化學。", tag: "化材雙主修" },
      { name: "CH2021 輸送現象與單元操作Ｉ", credits: 3, type: "必修", stage: "大三上", description: "雙主修核心必修：質量傳送擴散方程式、蒸餾塔與吸收塔級數計算。", tag: "化材雙主修" },
      { name: "CH2009 工程數學", credits: 3, type: "必修", stage: "大三下", description: "雙主修核心必修：貝索函數、勒讓德多項式在化工擴散之解析解。", tag: "化材雙主修" },
      { name: "CH2026 結晶繞射概論", credits: 3, type: "選修", stage: "大四上", description: "雙主修高階選修：半導體晶圓薄膜應力與穿透式電子顯微鏡 (TEM) 解析。", tag: "化材雙主修" },
      { name: "CH3063 專題製作", credits: 3, type: "必修", stage: "大四下", description: "雙主修總整發表：先進二次鋰電池材料、半導體蝕刻或高分子薄膜發表。", tag: "化材雙主修" }
    ],
    defaultMajorSchedule: [
      { name: "CH1012 質能平衡與化工計算", cred: 3, note: "化工製程質能平衡與熱力計算" },
      { name: "CH1023 材料工程概論I", cred: 3, note: "晶體晶格結構與材料相圖分析" },
      { name: "CH2001 有機化學", cred: 3, note: "有機聚合物與高分子合成反應" },
      { name: "CH2005 物理化學", cred: 3, note: "自由能熱力學與界面化學平衡" },
      { name: "CH2021 輸送現象與單元操作Ｉ", cred: 3, note: "動量與熱量傳送及蒸餾塔設計" },
      { name: "CH2009 工程數學", cred: 3, note: "偏微分方程在擴散質傳之解析" },
      { name: "CH2026 結晶繞射概論", cred: 3, note: "XRD 繞射分析與半導體薄膜晶相" },
      { name: "CH3063 專題製作", cred: 3, note: "先進化材專題研究公開成果驗收" }
    ]
  },

  // ==========================================
  // 25. 前瞻半導體學分學程 (ST)
  // ==========================================
  "前瞻半導體學分學程": {
    name: "前瞻半導體學分學程",
    tag: "半導體",
    code: "ST",
    minorCredits: 15,
    doubleCredits: 30,
    ruleSummary: "★ 官方規章：滿足國立中央大學前瞻半導體微學程／學分學程規章（含半導體元件物理、製程技術、晶片封裝與晶圓代工實務）。",
    basic: [
      { name: "EE2001 電子學 I", credits: 3, type: "選修", stage: "大一上", description: "半導體材料物理特性、PN 接面二極體與 MOSFET 元件開關原理。", tag: "半導體探索" },
      { name: "CH1023 材料工程概論I", credits: 3, type: "選修", stage: "大一下", description: "單晶矽晶圓長晶、晶格缺陷與薄膜磊晶成長物理基礎。", tag: "半導體探索" },
      { name: "OS2001 近代物理", credits: 3, type: "選修", stage: "大二上", description: "固態物理能帶理論、電子電洞載子統計與量子穿隧效應。", tag: "半導體探索" },
      { name: "EE1006 數位邏輯", credits: 3, type: "選修", stage: "大二下", description: "CMOS 反向器邏輯電路、傳輸閘與數位積體電路基礎模組。", tag: "半導體探索" }
    ],
    intermediate: [
      { name: "EE2001 電子學 I", credits: 3, type: "必修", stage: "大一上", description: "學程指定必修：場效電晶體次微米短通道效應與偏壓電路。", tag: "半導體必修", ruleNote: "★ 官方規章：前瞻半導體學程核心必修科目。" },
      { name: "CH1023 材料工程概論I", credits: 3, type: "必修", stage: "大一下", description: "學程指定必修：半導體晶圓材料、擴散摻雜與介電絕緣薄膜特性。", tag: "半導體必修", ruleNote: "★ 官方規章：前瞻半導體學程指定必修科目。" },
      { name: "OS2001 近代物理", credits: 3, type: "必修", stage: "大二上", description: "學程指定必修：費米-狄拉克分佈、直接與間接能隙半導體物理機制。", tag: "半導體必修", ruleNote: "★ 官方規章：半導體元件物理核心基石。" },
      { name: "EE1006 數位邏輯", credits: 3, type: "必修", stage: "大二下", description: "學程指定必修：超大型積體電路 (VLSI) 邏輯合成與時序時鐘分析。", tag: "半導體必修", ruleNote: "★ 官方規章：前瞻半導體學程指定必修科目。" },
      { name: "EE3046 微算機原理與實作", credits: 3, type: "必修", stage: "大三上", description: "學程指定必修：晶片系統 (SoC) 匯流排架構與硬體周邊控制器介面整合。", tag: "半導體必修", ruleNote: "★ 官方規章：半導體系統整合核心科目。" },
      { name: "ME3001 機械製造", credits: 3, type: "選修", stage: "大三下", description: "學程推薦選修：先進封裝與異質整合 (CoWoS)、晶圓級封裝與精密微切削。", tag: "半導體選修" },
      { name: "CH2026 結晶繞射概論", credits: 3, type: "選修", stage: "大四上", description: "學程推薦選修：晶圓應力檢測、X光繞射薄膜分析與先進微影分析。", tag: "半導體選修" }
    ],
    advanced: [
      { name: "EE2001 電子學 I", credits: 3, type: "必修", stage: "大一上", description: "雙主修高階必修：FinFET 與 GAA 奈米線奈米片電晶體物理建模。", tag: "半導體雙主修" },
      { name: "CH1023 材料工程概論I", credits: 3, type: "必修", stage: "大一下", description: "雙主修高階必修：三五族化合物半導體 (GaN/SiC) 寬能隙功率元件材料。", tag: "半導體雙主修" },
      { name: "OS2001 近代物理", credits: 3, type: "必修", stage: "大二上", description: "雙主修核心必修：二維材料 (石墨烯/二硫化鉬) 量子傳輸理論。", tag: "半導體雙主修" },
      { name: "EE1006 數位邏輯", credits: 3, type: "必修", stage: "大二下", description: "雙主修核心必修：Verilog 硬體描述語言設計與 FPGA 晶片即時驗證。", tag: "半導體雙主修" },
      { name: "EE3046 微算機原理與實作", credits: 3, type: "必修", stage: "大三上", description: "雙主修核心必修：AI 晶片邊緣運算加速器 (NPU) 硬體微架構設計。", tag: "半導體雙主修" },
      { name: "ME3001 機械製造", credits: 3, type: "必修", stage: "大三下", description: "雙主修核心必修：半導體前段黃光微影乾蝕刻與後段先進 3D 封裝製造。", tag: "半導體雙主修" },
      { name: "CH2026 結晶繞射概論", credits: 3, type: "必修", stage: "大四上", description: "雙主修核心必修：極紫外光 (EUV) 光罩缺陷檢驗與穿透顯微分析。", tag: "半導體雙主修" },
      { name: "EE4004 專題實作", credits: 3, type: "必修", stage: "大四下", description: "雙主修總整發表：先進半導體晶片設計、台積電/聯發科產學成果公開答辯。", tag: "半導體雙主修" }
    ],
    defaultMajorSchedule: [
      { name: "EE2001 電子學 I", cred: 3, note: "半導體物理特徵與電晶體開關原理" },
      { name: "CH1023 材料工程概論I", cred: 3, note: "晶圓長晶結晶構造與磊晶沉積技術" },
      { name: "OS2001 近代物理", cred: 3, note: "固態電子能帶與量子穿隧載子動力學" },
      { name: "EE1006 數位邏輯", cred: 3, note: "CMOS 積體電路與 VLSI 邏輯合成實作" },
      { name: "EE3046 微算機原理與實作", cred: 3, note: "SoC 單晶片系統微架構與硬體整合" },
      { name: "ME3001 機械製造", cred: 3, note: "先進晶圓製程蝕刻與 CoWoS 封裝製造" },
      { name: "CH2026 結晶繞射概論", cred: 3, note: "XRD 晶相檢測與極紫外光 EUV 微影" },
      { name: "EE4004 專題實作", cred: 3, note: "前瞻半導體晶片產學成果公開展覽發表" }
    ]
  }
};
