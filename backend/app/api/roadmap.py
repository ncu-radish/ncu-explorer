from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/roadmap", tags=["Future Map (夢想導航)"])

class CourseItem(BaseModel):
    course_name: str
    credits: int
    category: str = "必修"  # 必修, 選修, 跨域, 交換
    tag: str = "專業必修"
    note: str = ""

class SemesterPlan(BaseModel):
    semester_index: int  # 1~8
    grade: int  # 1~4
    term: int  # 1: 上學期, 2: 下學期
    semester_label: str  # e.g., "大一上學期"
    total_credits: int
    courses: list[CourseItem]
    key_deadlines: list[str]
    highlight: str

class TierRoadmap(BaseModel):
    tier_id: str  # basic, intermediate, advanced
    tier_name: str
    target_summary: str
    total_credits_estimate: int
    weekly_intensity: str  # 輕鬆探索, 扎實跨域, 高強度挑戰
    semesters: list[SemesterPlan]
    career_and_advantage: list[str]

class QueryGenerateRequest(BaseModel):
    query: str = Field(..., description="用戶輸入之自由自然語言夢想目標")

# ==========================================
# 方案課表模版與動態生成器
# ==========================================

def build_roadmap_for_query(query: str) -> dict[str, TierRoadmap]:
    q = query.lower()

    # 中央大學系所關鍵字映射表
    dept_map = [
        (["資工", "資訊工程", "cs", "軟體", "演算法", "程式"], "資訊工程學系", 28, 60, "法國國立高等應用電子學院 (ENSEA)"),
        (["法文", "法國語文", "法語", "歐洲", "法語系"], "法國語文學系", 24, 60, "法國國立高等應用電子學院 (ENSEA)"),
        (["半導體", "晶片", "ic", "製程", "矽島"], "前瞻半導體學分學程", 33, 45, "比利時魯汶大學 / 歐洲半導體研究中心 (IMEC)"),
        (["資管", "資訊管理", "mis"], "資訊管理學系", 21, 79, "歐洲頂尖資訊與商管名校交換"),
        (["企管", "企業管理", "商管", "商業"], "企業管理學系", 24, 65, "歐洲頂尖商學院 (HEC / ESSEC)"),
        (["電機", "電機工程", "ee"], "電機工程學系", 30, 60, "美國伊利諾大學香檳分校 (UIUC)"),
        (["機械", "機械工程", "me"], "機械工程學系", 27, 60, "德國亞琛工業大學 (RWTH Aachen)"),
        (["通訊", "通訊工程"], "通訊工程學系", 26, 60, "瑞典皇家理工學院 (KTH)"),
        (["生醫", "生物醫學"], "生醫科學與工程學系", 28, 60, "日本東京大學 / 京都大學"),
        (["化材", "化學工程", "材料"], "化學工程與材料工程學系", 28, 60, "美國普渡大學 (Purdue)"),
        (["土木", "土木工程"], "土木工程學系", 28, 60, "荷蘭台夫特理工大學 (TU Delft)"),
        (["大氣", "氣象"], "大氣科學學系", 24, 60, "美國國家大氣研究中心 (NCAR)"),
        (["太空", "衛星"], "太空科學與工程學系", 26, 60, "美國科羅拉多大學波德分校"),
        (["經濟"], "經濟學系", 24, 60, "荷蘭鹿特丹伊拉斯姆斯大學"),
        (["財金", "金融"], "財務金融學系", 24, 60, "英國倫敦政經學院 (LSE)"),
        (["數學", "應數"], "數學系", 24, 60, "法國巴黎第十一大學"),
        (["物理"], "物理學系", 26, 60, "德國海德堡大學"),
        (["化學"], "化學系", 26, 60, "日本東北大學"),
        (["英文", "英美語文", "外文"], "英美語文學系", 24, 60, "英國里茲大學 (University of Leeds)"),
        (["中文", "中國文學"], "中國文學系", 24, 60, "香港中文大學 / 新加坡國立大學"),
    ]

    matched_depts = []
    for keywords, name, min_cred, dbl_cred, exchange in dept_map:
        if any(k in q for k in keywords):
            matched_depts.append((name, min_cred, dbl_cred, exchange))

    # 預設領域兜底（資工 + 法文）
    primary_domain = "資訊工程學系"
    secondary_domain = "法國語文學系"
    minor_credits = 24
    double_credits = 60
    exchange_dest = "法國國立高等應用電子學院 (ENSEA)"

    if len(matched_depts) >= 2:
        primary_domain, _, _, _ = matched_depts[0]
        secondary_domain, minor_credits, double_credits, exchange_dest = matched_depts[1]
    elif len(matched_depts) == 1:
        name, min_c, dbl_c, ex_d = matched_depts[0]
        if name == "法國語文學系":
            primary_domain = "資訊工程學系"
            secondary_domain = name
        else:
            primary_domain = name
            secondary_domain = "法國語文學系"

    # --- 1. 基礎方案 ---
    basic_semesters = [
        SemesterPlan(
            semester_index=1, grade=1, term=1, semester_label="大一上學期", total_credits=8,
            courses=[
                CourseItem(course_name=f"{primary_domain}核心概論（一）", credits=3, category="必修", tag=f"{primary_domain[:2]}專業", note="核心專業學科基礎思維"),
                CourseItem(course_name="微積分與數理基礎（一）", credits=3, category="必修", tag=f"{primary_domain[:2]}專業", note="必修基礎工具"),
                CourseItem(course_name=f"{secondary_domain[:2]}基礎探索/跨域選修（一）", credits=2, category="選修", tag="跨域選修", note=f"無負擔探索{secondary_domain}入門")
            ],
            key_deadlines=["開學第 1~2 週確認核心專業實習課與跨域選課時段"],
            highlight=f"扎根{primary_domain[:2]}基礎，無負擔探索第二領域。"
        ),
        SemesterPlan(
            semester_index=2, grade=1, term=2, semester_label="大一下學期", total_credits=11,
            courses=[
                CourseItem(course_name=f"{primary_domain}核心實務（二）", credits=3, category="必修", tag=f"{primary_domain[:2]}專業", note="進階系統實務設計"),
                CourseItem(course_name="微積分與數理基礎（二）", credits=3, category="必修", tag=f"{primary_domain[:2]}專業", note="多變數分析工具"),
                CourseItem(course_name="離散數學/基礎專業架構", credits=3, category="必修", tag=f"{primary_domain[:2]}專業", note="邏輯思維與架構基礎"),
                CourseItem(course_name=f"{secondary_domain[:2]}基礎探索/跨域選修（二）", credits=2, category="選修", tag="跨域選修", note=f"深化{secondary_domain}實用知識")
            ],
            key_deadlines=["修畢大一重要基礎先修科目，通過大二重要擋修門檻"],
            highlight="完成主修先修鏈，具備跨域基礎溝通能力。"
        ),
        SemesterPlan(
            semester_index=3, grade=2, term=1, semester_label="大二上學期", total_credits=12,
            courses=[
                CourseItem(course_name="線性代數 / 矩陣運算", credits=3, category="必修", tag=f"{primary_domain[:2]}專業", note="空間映射與最佳化工具"),
                CourseItem(course_name="核心資料結構與系統設計", credits=3, category="必修", tag=f"{primary_domain[:2]}專業", note="經典資料結構演算法"),
                CourseItem(course_name="數位系統 / 專業中階分析", credits=3, category="必修", tag=f"{primary_domain[:2]}專業", note="專業中堅核心"),
                CourseItem(course_name="專業實驗/工程實作", credits=1, category="必修", tag=f"{primary_domain[:2]}專業", note="實驗手作實務驗證"),
                CourseItem(course_name=f"{secondary_domain[:2]}實務專題選修（一）", credits=2, category="選修", tag="跨域選修", note="中階跨域主題探討")
            ],
            key_deadlines=["掌握核心基礎，開始接觸實務專案開發"],
            highlight="進入主修中堅架構，跨域領域持續維持語感與廣度。"
        ),
        SemesterPlan(
            semester_index=4, grade=2, term=2, semester_label="大二下學期", total_credits=11,
            courses=[
                CourseItem(course_name="演算法與最佳化理論", credits=3, category="必修", tag=f"{primary_domain[:2]}專業", note="複雜度分析與動態規劃"),
                CourseItem(course_name="機率與統計模型", credits=3, category="必修", tag=f"{primary_domain[:2]}專業", note="隨機變數與假說檢定"),
                CourseItem(course_name="計算機架構 / 系統工程", credits=3, category="必修", tag=f"{primary_domain[:2]}專業", note="底層管線硬體結構"),
                CourseItem(course_name=f"{secondary_domain[:2]}實務專題選修（二）", credits=2, category="選修", tag="跨域選修", note="跨域實務文章研討")
            ],
            key_deadlines=["暑假深入了解專案指導教授專長與實驗室方向"],
            highlight="突破最硬核心科目，完成基礎跨域學分修習。"
        ),
        SemesterPlan(
            semester_index=5, grade=3, term=1, semester_label="大三上學期", total_credits=7,
            courses=[
                CourseItem(course_name="作業系統與底層架構", credits=3, category="必修", tag=f"{primary_domain[:2]}專業", note="行程同步與虛擬記憶體管理"),
                CourseItem(course_name="分散式網路通訊協定", credits=3, category="必修", tag=f"{primary_domain[:2]}專業", note="TCP/IP 協定通訊安全"),
                CourseItem(course_name="專案專題（一）", credits=1, category="必修", tag=f"{primary_domain[:2]}專業", note="加入教授實驗室確立專題主題")
            ],
            key_deadlines=["與專題組員定案系統設計架構與技術棧"],
            highlight="全心投入專題研究與系統底層開發。"
        ),
        SemesterPlan(
            semester_index=6, grade=3, term=2, semester_label="大三下學期", total_credits=5,
            courses=[
                CourseItem(course_name="專案專題（二）", credits=2, category="必修", tag=f"{primary_domain[:2]}專業", note="系統實作完成與公開成果發表"),
                CourseItem(course_name=f"{primary_domain[:2]}專業高階選修", credits=3, category="選修", tag=f"{primary_domain[:2]}專業", note="依個人志向選修專業前瞻領域")
            ],
            key_deadlines=["專題成果發表，製作展示海報與系統 Demo"],
            highlight="收穫專題作品集，奠定紮實專業實戰能力。"
        ),
        SemesterPlan(
            semester_index=7, grade=4, term=1, semester_label="大四上學期", total_credits=6,
            courses=[
                CourseItem(course_name="高階架構專案選修（一）", credits=3, category="選修", tag=f"{primary_domain[:2]}專業", note="前沿領域實務應用"),
                CourseItem(course_name="高階架構專案選修（二）", credits=3, category="選修", tag=f"{primary_domain[:2]}專業", note="大型系統分析設計")
            ],
            key_deadlines=["準備碩士班甄試備審或科技業校園徵才面試"],
            highlight="補齊專業選修學分，銜接頂尖就業或升學。"
        ),
        SemesterPlan(
            semester_index=8, grade=4, term=2, semester_label="大四下學期", total_credits=3,
            courses=[
                CourseItem(course_name="畢業學分清查與自主專案", credits=3, category="選修", tag=f"{primary_domain[:2]}專業", note=f"檢核 {primary_domain} 128 畢業總學分")
            ],
            key_deadlines=["5~6月教務處畢業審查，確認畢業資格"],
            highlight=f"順利畢業！具備{primary_domain[:2]}專業底蘊與{secondary_domain[:2]}獨特跨域競爭力。"
        )
    ]

    # --- 2. 中階方案 ---
    intermediate_semesters = [
        SemesterPlan(
            semester_index=1, grade=1, term=1, semester_label="大一上學期", total_credits=14,
            courses=[
                CourseItem(course_name=f"{primary_domain}核心概論（一）", credits=3, category="必修", tag=f"{primary_domain[:2]}專業", note="專業基石入門"),
                CourseItem(course_name="微積分與數理基礎（一）", credits=3, category="必修", tag=f"{primary_domain[:2]}專業", note="數理工具必備"),
                CourseItem(course_name=f"{secondary_domain}核心讀本/先修（一）", credits=4, category="必修", tag=f"{secondary_domain[:2]}輔系", note=f"{secondary_domain}輔系核心必修第一階段"),
                CourseItem(course_name=f"{secondary_domain}語法/分析基礎（一）", credits=4, category="必修", tag=f"{secondary_domain[:2]}輔系", note=f"{secondary_domain}輔系核心基礎理論")
            ],
            key_deadlines=["維持班級前 25% 頂尖成績，符合輔系/學程審查門檻"],
            highlight=f"同時啟動{primary_domain[:2]}與{secondary_domain[:2]}一年級專業核心。"
        ),
        SemesterPlan(
            semester_index=2, grade=1, term=2, semester_label="大一下學期", total_credits=17,
            courses=[
                CourseItem(course_name=f"{primary_domain}核心實務（二）", credits=3, category="必修", tag=f"{primary_domain[:2]}專業", note="物件導向/進階設計"),
                CourseItem(course_name="微積分與數理基礎（二）", credits=3, category="必修", tag=f"{primary_domain[:2]}專業", note="數理分析完結"),
                CourseItem(course_name="離散數學/架構設計", credits=3, category="必修", tag=f"{primary_domain[:2]}專業", note="演算法基石"),
                CourseItem(course_name=f"{secondary_domain}核心讀本/先修（二）", credits=4, category="必修", tag=f"{secondary_domain[:2]}輔系", note=f"{secondary_domain}輔系大一必修下學期"),
                CourseItem(course_name=f"{secondary_domain}語法/分析基礎（二）", credits=4, category="必修", tag=f"{secondary_domain[:2]}輔系", note="修畢後滿足大二輔系選修先修條件")
            ],
            key_deadlines=[f"修畢{secondary_domain}大一先修課程，暑期 8 月線上提出輔系/學程申請"],
            highlight=f"完成{secondary_domain}大一核心門檻，正式具備大二修課資格。"
        ),
        SemesterPlan(
            semester_index=3, grade=2, term=1, semester_label="大二上學期", total_credits=14,
            courses=[
                CourseItem(course_name="線性代數與空間運算", credits=3, category="必修", tag=f"{primary_domain[:2]}專業", note="矩陣與線性空間"),
                CourseItem(course_name="核心資料結構設計", credits=3, category="必修", tag=f"{primary_domain[:2]}專業", note="經典資料結構"),
                CourseItem(course_name="數位系統與架構設計", credits=3, category="必修", tag=f"{primary_domain[:2]}專業", note="硬體邏輯設計"),
                CourseItem(course_name="專業實驗/工程實作", credits=1, category="必修", tag=f"{primary_domain[:2]}專業", note="實戰工程驗證"),
                CourseItem(course_name=f"{secondary_domain}口語/專業表達（二）", credits=2, category="選修", tag=f"{secondary_domain[:2]}輔系", note=f"{secondary_domain}大二選修模組"),
                CourseItem(course_name=f"{secondary_domain}進階文法/應用理論", credits=2, category="選修", tag=f"{secondary_domain[:2]}輔系", note="進階應用分析")
            ],
            key_deadlines=["9月中旬教務處公告核定名單，加退選確認輔系選修"],
            highlight=f"{primary_domain[:2]}骨幹與{secondary_domain[:2]}進階實作同步邁進。"
        ),
        SemesterPlan(
            semester_index=4, grade=2, term=2, semester_label="大二下學期", total_credits=13,
            courses=[
                CourseItem(course_name="演算法與最佳化理論", credits=3, category="必修", tag=f"{primary_domain[:2]}專業", note="演算法設計分析"),
                CourseItem(course_name="機率與統計模型", credits=3, category="必修", tag=f"{primary_domain[:2]}專業", note="隨機分佈與檢定"),
                CourseItem(course_name="計算機組織 / 系統架構", credits=3, category="必修", tag=f"{primary_domain[:2]}專業", note="處理器結構"),
                CourseItem(course_name=f"{secondary_domain}雙向轉譯與實務表達", credits=2, category="選修", tag=f"{secondary_domain[:2]}輔系", note="精準跨領域轉譯表達練習"),
                CourseItem(course_name=f"{secondary_domain}專業經典文選研讀", credits=2, category="選修", tag=f"{secondary_domain[:2]}輔系", note="深度思想與專業專題研讀")
            ],
            key_deadlines=[f"確認累積滿 {minor_credits} 學分輔系門檻"],
            highlight=f"完成{secondary_domain}輔系規定（核心必修+高階選修）。"
        ),
        SemesterPlan(
            semester_index=5, grade=3, term=1, semester_label="大三上學期", total_credits=7,
            courses=[
                CourseItem(course_name="作業系統與底層架構", credits=3, category="必修", tag=f"{primary_domain[:2]}專業", note="核心系統排程"),
                CourseItem(course_name="分散式網路通訊協定", credits=3, category="必修", tag=f"{primary_domain[:2]}專業", note="通訊協定安全"),
                CourseItem(course_name="專案專題（一）", credits=1, category="必修", tag=f"{primary_domain[:2]}專業", note="進駐實驗室確立專題主題")
            ],
            key_deadlines=["輔系學分修畢，大三專注專題研究與研究室深造"],
            highlight=f"重心回歸{primary_domain[:2]}高階專案研究與工程實作。"
        ),
        SemesterPlan(
            semester_index=6, grade=3, term=2, semester_label="大三下學期", total_credits=5,
            courses=[
                CourseItem(course_name="專案專題（二）", credits=2, category="必修", tag=f"{primary_domain[:2]}專業", note="成果實作發表與評審"),
                CourseItem(course_name=f"{primary_domain[:2]}專業高階選修", credits=3, category="選修", tag=f"{primary_domain[:2]}專業", note="高階前瞻領域選修")
            ],
            key_deadlines=["專案成果公開發表與作品集整理"],
            highlight=f"完成專案實作，取得{secondary_domain[:2]}輔系之雙專長競爭力。"
        ),
        SemesterPlan(
            semester_index=7, grade=4, term=1, semester_label="大四上學期", total_credits=6,
            courses=[
                CourseItem(course_name="前沿領域架構選修（一）", credits=3, category="選修", tag=f"{primary_domain[:2]}專業", note="高階架構實務"),
                CourseItem(course_name="前沿領域架構選修（二）", credits=3, category="選修", tag=f"{primary_domain[:2]}專業", note="工程整合實務")
            ],
            key_deadlines=["報考頂尖研究所或參與國際外商科技大廠預聘"],
            highlight="專業學分完整達標，具備跨文化跨領域團隊合作優勢。"
        ),
        SemesterPlan(
            semester_index=8, grade=4, term=2, semester_label="大四下學期", total_credits=3,
            courses=[
                CourseItem(course_name="畢業資格確認與專案審核", credits=3, category="選修", tag=f"{primary_domain[:2]}專業", note="畢業學分清查")
            ],
            key_deadlines=[f"畢業審查：核定{primary_domain}學士學位 ＋ {secondary_domain}輔系註記"],
            highlight=f"獲頒附註「{secondary_domain}輔系」之中大正式學位證書！"
        )
    ]

    # --- 3. 進階方案 ---
    advanced_semesters = [
        SemesterPlan(
            semester_index=1, grade=1, term=1, semester_label="大一上學期", total_credits=16,
            courses=[
                CourseItem(course_name=f"{primary_domain}核心概論（一）", credits=3, category="必修", tag=f"{primary_domain[:2]}專業", note="專業基石"),
                CourseItem(course_name="微積分與數理基礎（一）", credits=3, category="必修", tag=f"{primary_domain[:2]}專業", note="數理工具基石"),
                CourseItem(course_name=f"{secondary_domain}專業讀本/必修（一）", credits=4, category="必修", tag=f"{secondary_domain[:2]}雙主修", note=f"{secondary_domain}雙主修核心"),
                CourseItem(course_name=f"{secondary_domain}理論架構/寫作（一）", credits=4, category="必修", tag=f"{secondary_domain[:2]}雙主修", note="深入理論基礎建構"),
                CourseItem(course_name=f"{secondary_domain}語音會話/實驗分析（一）", credits=2, category="必修", tag=f"{secondary_domain[:2]}雙主修", note="實務表達專長培訓")
            ],
            key_deadlines=["適應雙倍學科強度（16學分專業），掌握雙核心節奏"],
            highlight="雙主修高強度啟航，奠定數理與跨領域雙軌核心。"
        ),
        SemesterPlan(
            semester_index=2, grade=1, term=2, semester_label="大一下學期", total_credits=17,
            courses=[
                CourseItem(course_name=f"{primary_domain}核心實務（二）", credits=3, category="必修", tag=f"{primary_domain[:2]}專業", note="物件導向/軟體架構"),
                CourseItem(course_name="微積分與數理基礎（二）", credits=3, category="必修", tag=f"{primary_domain[:2]}專業", note="微積分完結"),
                CourseItem(course_name="離散數學/架構設計", credits=3, category="必修", tag=f"{primary_domain[:2]}專業", note="演算法基石"),
                CourseItem(course_name=f"{secondary_domain}專業讀本/必修（二）", credits=4, category="必修", tag=f"{secondary_domain[:2]}雙主修", note="深度閱讀理解"),
                CourseItem(course_name=f"{secondary_domain}理論架構/寫作（二）", credits=4, category="必修", tag=f"{secondary_domain[:2]}雙主修", note="進階寫作完成")
            ],
            key_deadlines=["維持前一學年成績，暑期 8 月線上送交雙主修申請表"],
            highlight="完成大一雙核心，大二正式獲取雙主修資格。"
        ),
        SemesterPlan(
            semester_index=3, grade=2, term=1, semester_label="大二上學期", total_credits=17,
            courses=[
                CourseItem(course_name="線性代數與空間運算", credits=3, category="必修", tag=f"{primary_domain[:2]}專業", note="大二核心必修"),
                CourseItem(course_name="核心資料結構設計", credits=3, category="必修", tag=f"{primary_domain[:2]}專業", note="核心資料結構"),
                CourseItem(course_name="數位系統與實驗實作", credits=4, category="必修", tag=f"{primary_domain[:2]}專業", note="含硬體實驗 1 學分"),
                CourseItem(course_name=f"{secondary_domain}進階語法與習作（一）", credits=3, category="必修", tag=f"{secondary_domain[:2]}雙主修", note=f"{secondary_domain}大二必修"),
                CourseItem(course_name=f"{secondary_domain}進階聽講與專案表達", credits=2, category="必修", tag=f"{secondary_domain[:2]}雙主修", note="進階溝通表達"),
                CourseItem(course_name=f"{secondary_domain}文化概論/跨國脈絡", credits=2, category="必修", tag=f"{secondary_domain[:2]}雙主修", note="國際人文背景必修")
            ],
            key_deadlines=["9月正式以雙主修身分修讀，開始報名準備外語/專業檢定"],
            highlight="硬核專業設計與跨域思維強勢並進。"
        ),
        SemesterPlan(
            semester_index=4, grade=2, term=2, semester_label="大二下學期", total_credits=14,
            courses=[
                CourseItem(course_name="演算法與最佳化理論", credits=3, category="必修", tag=f"{primary_domain[:2]}專業", note="演算法分析"),
                CourseItem(course_name="機率與統計模型", credits=3, category="必修", tag=f"{primary_domain[:2]}專業", note="統計推論檢定"),
                CourseItem(course_name="計算機組織 / 系統工程", credits=3, category="必修", tag=f"{primary_domain[:2]}專業", note="處理器架構"),
                CourseItem(course_name=f"{secondary_domain}進階語法與習作（二）", credits=3, category="必修", tag=f"{secondary_domain[:2]}雙主修", note=f"{secondary_domain}大二必修"),
                CourseItem(course_name=f"{secondary_domain}雙向精準轉譯實務", credits=2, category="選修", tag=f"{secondary_domain[:2]}雙主修", note="雙主修選修模組")
            ],
            key_deadlines=[
                "★ 關鍵考核：暑假前考取專業語言檢定（如 DELF B1 / 托福 85+），符合雙主修與出國資格",
                "備妥成績單與專題推薦，備戰 10 月國際處姐妹校海外交換申請"
            ],
            highlight="通過檢定取得雙主修鑰匙，解鎖海外交換門檻！"
        ),
        SemesterPlan(
            semester_index=5, grade=3, term=1, semester_label="大三上學期", total_credits=13,
            courses=[
                CourseItem(course_name="作業系統與底層架構", credits=3, category="必修", tag=f"{primary_domain[:2]}專業", note="系統核心排程"),
                CourseItem(course_name="分散式網路通訊協定", credits=3, category="必修", tag=f"{primary_domain[:2]}專業", note="通訊安全機制"),
                CourseItem(course_name="專案專題（一）", credits=1, category="必修", tag=f"{primary_domain[:2]}專業", note="進實驗室選定出國前研究框架"),
                CourseItem(course_name=f"{secondary_domain}高階文選閱讀與習作", credits=3, category="必修", tag=f"{secondary_domain[:2]}雙主修", note=f"{secondary_domain}大三核心"),
                CourseItem(course_name=f"{secondary_domain}專業思想史/前沿發展", credits=3, category="必修", tag=f"{secondary_domain[:2]}雙主修", note="核心專業思潮")
            ],
            key_deadlines=[
                f"★ 10~11月：向中大國際處 OIA 送出交換甄選，志願鎖定「{exchange_dest}」",
                "備妥歷年成績單、讀書計畫自傳與中大院級推薦資格"
            ],
            highlight="專題進駐、跨域思維與海外交換甄選申請決勝期！"
        ),
        SemesterPlan(
            semester_index=6, grade=3, term=2, semester_label="大三下學期", total_credits=5,
            courses=[
                CourseItem(course_name="專案專題（二）", credits=2, category="必修", tag=f"{primary_domain[:2]}專業", note="專案提前結案並完成公開發表評審"),
                CourseItem(course_name=f"{secondary_domain}高階實務選修", credits=3, category="選修", tag=f"{secondary_domain[:2]}雙主修", note="累積雙主修應修學分")
            ],
            key_deadlines=[
                f"1~2月國際處放榜確認錄取 {exchange_dest}",
                "辦理長期學生簽證，填寫「出國交換學分採認先期審查表」"
            ],
            highlight="完成專案成果發表，啟動海外名校留學交換行前準備。"
        ),
        SemesterPlan(
            semester_index=7, grade=4, term=1, semester_label="大四上學期（海外交換研習）", total_credits=12,
            courses=[
                CourseItem(course_name="海外名校研習：前沿專業工程模組", credits=4, category="交換", tag="海外交換", note="全英語修習尖端工程，學分回台抵免主系選修"),
                CourseItem(course_name="海外名校研習：國際跨域研究專案", credits=4, category="交換", tag="海外交換", note="跨國頂尖實驗室合作實作"),
                CourseItem(course_name="海外在地生活文化與語言實踐", credits=4, category="交換", tag="海外交換", note="沉浸式在地語言文化實踐")
            ],
            key_deadlines=[
                "人在海外名校校園研習，建立跨國科技與商業人脈",
                "學期末取得海外大學學分成績單，送回中大辦理抵免"
            ],
            highlight="大四上遠赴海外交換！達成國際化工程視野與外語實踐。"
        ),
        SemesterPlan(
            semester_index=8, grade=4, term=2, semester_label="大四下學期", total_credits=3,
            courses=[
                CourseItem(course_name="雙主修學分總清查與抵免確認", credits=3, category="必修", tag=f"{primary_domain[:2]}專業", note=f"主修 + {secondary_domain}雙主修全面結算")
            ],
            key_deadlines=[
                "教務處雙主修畢業資格複核通過",
                f"獲頒中央大學「{primary_domain} ╳ {secondary_domain}」雙學士學位證書！"
            ],
            highlight="頂級榮耀！取得中大雙學士學位證書，直接進軍跨國外商或海外名校深造。"
        )
    ]

    return {
        "basic": TierRoadmap(
            tier_id="basic",
            tier_name=f"基礎方案（主修{primary_domain[:2]} ＋ {secondary_domain[:2]}選修）",
            target_summary=f"扎實修畢{primary_domain}核心專業 128 學分，課餘無負擔修習 8 學分{secondary_domain}實用選修，維持頂尖 GPA。",
            total_credits_estimate=136,
            weekly_intensity="平穩充實（每學期約 16~19 學分）",
            semesters=basic_semesters,
            career_and_advantage=[
                f"紮實掌握中央{primary_domain[:2]}核心專業工程與底層技術",
                f"具備{secondary_domain[:2]}跨領域溝通與實務基礎，履歷格外亮眼",
                "課業負擔適中，有充分時間維持頂尖 GPA 銜接頂尖研究所推甄"
            ]
        ),
        "intermediate": TierRoadmap(
            tier_id="intermediate",
            tier_name=f"中階方案（主修{primary_domain[:2]} ＋ {secondary_domain[:2]}輔系）",
            target_summary=f"在{primary_domain[:2]}專業基礎上，額外修畢{secondary_domain}「輔系」門檻所需的 {minor_credits} 學分。",
            total_credits_estimate=128 + minor_credits,
            weekly_intensity="精實挑戰（每學期約 19~22 學分）",
            semesters=intermediate_semesters,
            career_and_advantage=[
                f"畢業證書正式加註「{secondary_domain}輔系」榮銜，全校跨域標竿",
                "具備雙向精準轉譯與跨領域溝通實戰能力，勝任跨國科技顧問",
                "專業技術與跨領域素養兼備，國內外頂尖機構求才首選"
            ]
        ),
        "advanced": TierRoadmap(
            tier_id="advanced",
            tier_name=f"進階方案（主修{primary_domain[:2]} ＋ {secondary_domain[:2]}雙主修 {double_credits} 學分）",
            target_summary=f"高強度雙學士學位挑戰（修滿雙學位共計約 {128 + double_credits} 學分），培養全方位的跨領域領導人才。",
            total_credits_estimate=128 + double_credits + 4,
            weekly_intensity="頂尖卓越（每學期約 21~25 學分，需強大自我管理）",
            semesters=advanced_semesters,
            career_and_advantage=[
                f"獲得中央大學「{primary_domain} ╳ {secondary_domain}」雙學士學位，全台稀缺雙專長頂尖人才",
                f"大四赴海外名校（如 {exchange_dest}）修習尖端模組，建立國際科技人脈",
                "無縫申請歐美頂尖名校碩博士，具備國際學術與跨國團隊競爭力",
                "直通跨國企業駐台核心研發主管或國際開拓專案經理 (Global PM)"
            ]
        )
    }

@router.post("/generate-plans", response_model=dict[str, TierRoadmap], summary="輸入自由自然語言夢想，動態產生三種方案課表")
def generate_plans_by_query(req: QueryGenerateRequest):
    """
    根據使用者輸入的任何自由需求（如「想讀資工＋學法文」、「資工＋半導體」、「資管＋資工」），
    動態為其生成對應之基礎、中階、進階專屬 4 年時序課表！
    """
    return build_roadmap_for_query(req.query)

@router.get("/plan/{tier_id}", response_model=TierRoadmap, summary="取得特定方案的四年課表")
def get_tier_plan(tier_id: str):
    plans = build_roadmap_for_query("資工 法文")
    return plans.get(tier_id, plans["basic"])

@router.get("/plans", response_model=dict[str, TierRoadmap], summary="一次取得預設三種方案完整課表")
def get_all_tier_plans():
    return build_roadmap_for_query("資工 法文")
