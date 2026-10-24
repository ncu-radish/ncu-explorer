import logging
import random
import re
from typing import Any

from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.llm_client import call_ollama_structured
from app.models.tables import (
    Building,
    CampusLifeInfo,
    CampusLocation,
    GameSession,
    RandomEvent,
)
from app.schemas.llm import (
    OnboardingParseSchema,
    OptionItem,
    TurnGenerationSchema,
)
from app.schemas.sim import ScheduleSlot
from app.services.course_db import course_db_service
from app.services.prompts import (
    ONBOARDING_PROMPT_TEMPLATE,
    TURN_NARRATIVE_PROMPT_TEMPLATE,
    WEEK_SUMMARY_PROMPT_TEMPLATE,
)

logger = logging.getLogger(__name__)

DAY_NAMES = ["週一", "週二", "週三", "週四", "週五"]

NCU_PERIOD_TIME: dict[str, tuple[str, str]] = {
    "1": ("08:00", "08:50"),
    "2": ("09:00", "09:50"),
    "3": ("10:00", "10:50"),
    "4": ("11:00", "11:50"),
    "Z": ("12:00", "12:50"),
    "5": ("13:00", "13:50"),
    "6": ("14:00", "14:50"),
    "7": ("15:00", "15:50"),
    "8": ("16:00", "16:50"),
    "9": ("17:00", "17:50"),
    "A": ("18:30", "19:20"),
    "B": ("19:25", "20:15"),
    "C": ("20:20", "21:10"),
    "D": ("21:15", "22:05"),
}

PERIOD_ORDER = ["1", "2", "3", "4", "Z", "5", "6", "7", "8", "9", "A", "B", "C", "D"]

def get_periods_time_range(periods: list[str]) -> tuple[str, str, str]:
    """Given a list of period strings like ['2', '3', '4'], returns ('09:00', '11:50', '第 2-4 節 (09:00~11:50)')"""
    sorted_p = sorted([p for p in periods if p in NCU_PERIOD_TIME], key=lambda x: PERIOD_ORDER.index(x))
    if not sorted_p:
        return ("08:00", "09:50", "08:00~09:50")
    start = NCU_PERIOD_TIME[sorted_p[0]][0]
    end = NCU_PERIOD_TIME[sorted_p[-1]][1]
    if len(sorted_p) == 1:
        p_str = f"第 {sorted_p[0]} 節"
    else:
        p_str = f"第 {sorted_p[0]}-{sorted_p[-1]} 節"
    return start, end, f"{p_str} ({start}~{end})"

DAY_MAP = {
    "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5,
    "一": 1, "二": 2, "三": 3, "四": 4, "五": 5
}

def parse_schedule_periods(time_str: str | None) -> list[tuple[int, list[str]]]:
    """解析課程時間字串，如 '三34'、'Mon234'、'一78 / 四1'"""
    if not time_str or time_str in ("安排中", "依各班排定"):
        return []
    res = []
    for part in re.split(r"[/,; ]+", time_str.strip()):
        m = re.match(r"^(Mon|Tue|Wed|Thu|Fri|[一二三四五])([0-9A-Za-z]+)$", part)
        if m:
            d = DAY_MAP.get(m.group(1))
            if d:
                res.append((d, list(m.group(2))))
    return res

# 優先根據教室代碼/建築物代號 (如 I1, E6, O, TR, S4, M, YH 等) 或中文名稱精準映射至 3D 建築物 ID
BUILDING_MATCH_RULES: list[tuple[str, str, str]] = [
    # (Regex/Pattern, Building ID, Canonical Name)
    # --- 管理學院 ---
    (r"\bI1\b|^I1[-_\s]|管理二館|管二", "bldg_mgmt_2", "管理二館"),
    (r"\bI\b|^I[-_\s]|志希館|管理一館|管一", "bldg_mgmt_1", "志希館/管一"),

    # --- 資訊電機與工學院 ---
    (r"\bE6\b|^E6[-_\s]|工程五館|工五", "bldg_eng_5", "工程五館"),
    (r"\bE1\b|^E1[-_\s]|工程二館|工二", "bldg_eng_2", "工程二館"),
    (r"\bE2\b|^E2[-_\s]|機械館", "bldg_eng_m", "機械館"),
    (r"\bE3\b|^E3[-_\s]|環工化工館|環工|化工", "bldg_eng_env", "環工化工館"),
    (r"\bE4\b|^E4[-_\s]|機電實驗室", "bldg_eng_ml", "機電實驗室"),
    (r"\bE5\b|^E5[-_\s]|大型力學實驗室", "bldg_eng_ecce", "大型力學實驗室"),
    (r"\bE\b|^E[-_\s]|工程一館|工一", "bldg_eng_1", "工程一館"),

    # --- 通識教育中心、語言中心、教研綜合 ---
    (r"\bO\b|^O[-_\s]|綜教館|綜合教學大樓|綜教", "bldg_general_edu", "綜教館"),
    (r"\bTR\b|^TR[-_\s]|教學研究綜合大樓|教學研究大樓|教研大樓|教研", "bldg_tr", "教研大樓"),

    # --- 理學院與科學大樓 ---
    (r"\bM\b|^M[-_\s]|鴻經館|鴻經", "bldg_hong_jing", "鴻經館"),
    (r"\bS4\b|^S4[-_\s]|健雄館|科四館|科四", "bldg_science_4", "健雄館/科四"),
    (r"\bS5\b|^S5[-_\s]|科學五館|科五", "bldg_science_5", "科學五館"),
    (r"\bS1\b|^S1[-_\s]|科學二館|科二", "bldg_science_2", "科學二館"),
    (r"\bS2\b|^S2[-_\s]|科學三館|科三", "bldg_science_3", "科學三館"),
    (r"\bS\b|^S[-_\s]|科學一館|科一", "bldg_science_1", "科學一館"),
    (r"\bH2\b|^H2[-_\s]|理學院教學館", "bldg_science_0", "理學院教學館"),
    (r"\bIL\b|^IL[-_\s]|國鼎光電大樓|光電大樓", "bldg_optics", "國鼎光電大樓"),

    # --- 文學院 ---
    (r"\bA\b|^A[-_\s]|文學一館|文學⼀館|文一館|文一", "bldg_art_1", "文學一館"),
    (r"\bC2\b|^C2[-_\s]|文學二館|文二館|文二", "bldg_art_2", "文學二館"),
    (r"\bLS\b|^LS[-_\s]|人文社會科學大樓|人社大樓|文三", "bldg_art_3", "人文社會科學大樓"),

    # --- 客家學院 ---
    (r"\bHK\b|^HK[-_\s]|客家學院大樓|客家大樓|客院", "bldg_hk", "客家學院大樓"),

    # --- 體育設施 ---
    (r"\bYH\b|^YH[-_\s]|依仁堂|體育館|羽球|桌球|籃球|排球|游泳池|網球", "bldg_yireng", "依仁堂體育館"),

    # --- 圖書館、大講堂、大禮堂、行政 ---
    (r"\bL2\b|^L2[-_\s]|總圖書館|總圖", "bldg_lib_main", "總圖書館"),
    (r"\bL\b|^L[-_\s]|中正圖書館|舊圖", "bldg_lib_old", "中正圖書館"),
    (r"\bLH\b|^LH[-_\s]|大講堂", "bldg_grand_lecture", "大講堂"),
    (r"\bMA\b|^MA[-_\s]|大禮堂", "bldg_auditorium", "大禮堂"),
    (r"\bA1\b|^A1[-_\s]|行政大樓", "bldg_admin", "行政大樓"),
]

# 學系與所屬系館映射 (當課表地點為空、未定、或僅填教室號碼時的強力系館回退機制)
DEPT_HOME_BUILDING_MAP: dict[str, tuple[str, str]] = {
    "資訊管理學系": ("bldg_mgmt_2", "管理二館"),
    "企業管理學系": ("bldg_mgmt_2", "管理二館"),
    "財務金融學系": ("bldg_mgmt_2", "管理二館"),
    "經濟學系": ("bldg_mgmt_2", "管理二館"),
    "資訊工程學系": ("bldg_eng_5", "工程五館"),
    "電機工程學系": ("bldg_eng_2", "工程二館"),
    "通訊工程學系": ("bldg_eng_2", "工程二館"),
    "機械工程學系": ("bldg_eng_m", "機械館"),
    "化學工程與材料工程學系": ("bldg_eng_env", "環工化工館"),
    "土木工程學系": ("bldg_eng_1", "工程一館"),
    "數學系": ("bldg_hong_jing", "鴻經館"),
    "物理學系": ("bldg_science_4", "健雄館(科四館)"),
    "化學學系": ("bldg_science_5", "科學五館"),
    "生命科學系": ("bldg_science_2", "科學二館"),
    "生醫科學與工程學系": ("bldg_science_2", "科學二館"),
    "光電科學與工程學系": ("bldg_optics", "國鼎光電大樓"),
    "中國文學系": ("bldg_art_1", "文學一館"),
    "英美語文學系": ("bldg_art_2", "文學二館"),
    "法國語文學系": ("bldg_art_2", "文學二館"),
    "地球科學學系": ("bldg_science_1", "科學一館"),
    "大氣科學學系": ("bldg_science_4", "健雄館(科四館)"),
    "客家語文暨社會科學學系": ("bldg_hk", "客家學院大樓"),
    "體育室": ("bldg_yireng", "依仁堂體育館"),
    "通識教育中心": ("bldg_general_edu", "綜教館"),
    "語言中心": ("bldg_general_edu", "綜教館"),
}

def map_campus_location(
    location_name: str | None,
    course_name: str | None = None,
    dept: str | None = None
) -> tuple[str, str]:
    """
    精準映射課程地點至 3D 地圖建築物 ID (bldg_*) 與可讀中文名稱。
    相容支援兩學期不同標記風格：大樓代號 (如 I1-105, E6-A204, O-214, TR-A001) 與完整中文名稱 (如 管理二館-017, 工程五館)。
    若未標明地點，自動依據開課系所回退至系館，確保地圖自動聚焦於所屬系館。
    """
    loc_raw = (location_name or "").strip()
    c_name = (course_name or "").strip()
    d_name = (dept or "").strip()

    # 1. 優先由地點代碼/名稱匹配
    if loc_raw and loc_raw not in ("未定", "安排中"):
        for pattern, bldg_id, canon_name in BUILDING_MATCH_RULES:
            if re.search(pattern, loc_raw, re.IGNORECASE):
                if loc_raw == canon_name:
                    display_name = canon_name
                elif canon_name in loc_raw:
                    display_name = loc_raw
                else:
                    display_name = f"{canon_name} ({loc_raw})"
                return bldg_id, display_name

    # 2. 次依課程名稱特徵判斷
    if any(k in c_name for k in ["體育", "羽球", "網球", "保齡球", "桌球", "籃球", "排球", "游泳", "體能"]):
        return "bldg_yireng", "依仁堂體育館"
    if any(k in c_name for k in ["大一英文", "日語", "德語", "法語", "西班牙語", "英語"]):
        return "bldg_general_edu", "綜教館 (語言中心)"
    if any(k in c_name for k in ["國文", "經典閱讀"]):
        return "bldg_general_edu", "綜教館"

    # 3. 依據開課系所回退至系館
    if d_name:
        for known_dept, (bldg_id, canon_name) in DEPT_HOME_BUILDING_MAP.items():
            if known_dept == d_name or known_dept in d_name or d_name in known_dept:
                if loc_raw and loc_raw not in ("未定", "安排中"):
                    return bldg_id, f"{canon_name} ({loc_raw})"
                return bldg_id, canon_name

    # 4. 全校通用回退 (綜教館)
    return "bldg_general_edu", loc_raw or "綜合教學大樓"


class SimEngine:
    async def parse_onboarding(
        self,
        user_input: str,
        model_name: str,
        dept_hint: str | None = None,
        grade_hint: int | None = None
    ) -> OnboardingParseSchema:
        # 1. 啟發式/正則快速萃取學系與年級，作為穩健基底
        dept = dept_hint or "資訊管理學系"
        grade = grade_hint or 1

        dept_keywords = {
            "資訊管理": "資訊管理學系", "資管": "資訊管理學系",
            "資訊工程": "資訊工程學系", "資工": "資訊工程學系",
            "電機工程": "電機工程學系", "電機": "電機工程學系",
            "通訊工程": "通訊工程學系", "通訊": "通訊工程學系",
            "企業管理": "企業管理學系", "企管": "企業管理學系",
            "財務金融": "財務金融學系", "財金": "財務金融學系",
            "經濟": "經濟學系", "機械": "機械工程學系",
            "土木": "土木工程學系", "化材": "化學工程與材料工程學系",
            "數學": "數學系", "物理": "物理學系", "化學": "化學學系",
            "生科": "生命科學系", "中文": "中國文學系", "英文": "英美語文學系", "法文": "法國語文學系",
            "大氣": "大氣科學學系", "地科": "地球科學學系"
        }

        # 透過使用者文字直接判斷「雙主修」或「輔系」
        sec_type = None
        sec_dept = None

        double_major_match = re.search(r"(?:雙主修|雙修|double\s*major)\s*[:：]?\s*([^\s,，。!！?？]+)", user_input, re.IGNORECASE)
        minor_match = re.search(r"(?:輔系|輔修|minor)\s*[:：]?\s*([^\s,，。!！?？]+)", user_input, re.IGNORECASE)

        if double_major_match:
            sec_type = "雙主修"
            target_str = double_major_match.group(1)
            for kw, full_name in dept_keywords.items():
                if kw in target_str:
                    sec_dept = full_name
                    break
        elif minor_match:
            sec_type = "輔系"
            target_str = minor_match.group(1)
            for kw, full_name in dept_keywords.items():
                if kw in target_str:
                    sec_dept = full_name
                    break

        if not sec_type:
            if "雙主修" in user_input or "雙修" in user_input:
                sec_type = "雙主修"
            elif "輔系" in user_input or "輔修" in user_input:
                sec_type = "輔系"

        if not dept_hint:
            for kw, target in dept_keywords.items():
                if kw in user_input and target != sec_dept:
                    dept = target
                    break

        if sec_type and not sec_dept:
            for kw, full_name in dept_keywords.items():
                if kw in user_input and full_name != dept:
                    sec_dept = full_name
                    break

        # 年級萃取 (使用者輸入文字有明確指定年級時優先)
        if "大一" in user_input or "一年級" in user_input:
            grade = 1
        elif "大二" in user_input or "二年級" in user_input:
            grade = 2
        elif "大三" in user_input or "三年級" in user_input:
            grade = 3
        elif "大四" in user_input or "四年級" in user_input:
            grade = 4
        elif sec_type and grade == 1 and not grade_hint:
            # 雙主修/輔系主要適用於大二以上，未指定年級時自動推進為大二
            grade = 2

        fallback = OnboardingParseSchema(
            department=dept,
            grade=grade,
            semester_term=1,
            secondary_type=sec_type,
            secondary_department=sec_dept,
            clubs=["熱舞社", "系學會"],
            interest_query="校園生活"
        )

        prompt = ONBOARDING_PROMPT_TEMPLATE.format(user_input=user_input)
        try:
            parsed = await call_ollama_structured(
                user_prompt=prompt,
                response_schema=OnboardingParseSchema,
                model_name=model_name,
                fallback_instance=fallback,
                timeout=25.0
            )
            if dept_hint:
                parsed.department = dept_hint
            if grade_hint and not any(g in user_input for g in ["大一", "大二", "大三", "大四"]):
                parsed.grade = grade_hint
            if sec_type and not parsed.secondary_type:
                parsed.secondary_type = sec_type
            if sec_dept and not parsed.secondary_department:
                parsed.secondary_department = sec_dept
            return parsed
        except Exception as e:
            logger.warning(f"Onboarding parse failed, using fallback: {e}")
            return fallback

    def build_weekly_schedule(
        self,
        db: Session | None = None,
        profile: OnboardingParseSchema | None = None,
    ) -> list[ScheduleSlot]:
        """
        為週一至週五排定完整一日時間軸 (僅保留真實課程與社團行程)
        1. 根據所選學系與年級撈取本系 courses.db 準確必修課
        2. 雙主修/輔系 (適用大二以上)：在本系必修排滿後，優先排目標系所必修課
        3. 空堂填補 (通識/體育/語言隨機挑選)：至多加選2堂，隨機打散候選池增加多樣性
        4. 學分規範：大一至大三 16~25 學分；大四 9~16 學分
        """
        if profile is None:
            profile = OnboardingParseSchema()
        dept = profile.department or "資訊管理學系"
        grade = profile.grade if profile.grade in (1, 2, 3, 4) else 1

        min_credits = 9.0 if grade == 4 else 16.0
        max_credits = 16.0 if grade == 4 else 25.0

        # 1. 撈取本系必修課基本盤
        roadmap = course_db_service.get_department_roadmap(dept)
        grade_map = {1: "大一上", 2: "大二上", 3: "大三上", 4: "大四上"}
        sem_key = grade_map.get(grade, "大一上")
        req_courses = roadmap.get(sem_key, [])

        enrolled_courses: list[dict[str, Any]] = []
        occupied_periods: set[tuple[int, str]] = set()
        total_credits = 0.0

        for c in req_courses:
            c_time = c.get("raw_schedule") or ""
            parsed = parse_schedule_periods(c_time)

            # 若主課程時間未定 (如 未123) 且有分班，挑選不衝突的分班時間
            if not parsed and c.get("sections"):
                for sec in c["sections"]:
                    sec_time = sec.get("raw_schedule") or ""
                    sec_parsed = parse_schedule_periods(sec_time)
                    if sec_parsed:
                        sec_conflict = False
                        for d, pers in sec_parsed:
                            for p in pers:
                                if (d, p) in occupied_periods:
                                    sec_conflict = True
                                    break
                            if sec_conflict:
                                break
                        if not sec_conflict:
                            c_time = sec_time
                            parsed = sec_parsed
                            if sec.get("location_name"):
                                c["location_name"] = sec["location_name"]
                            if sec.get("instructor"):
                                c["instructor"] = sec["instructor"]
                            break

            if not parsed:
                continue

            conflicts = False
            for d, pers in parsed:
                for p in pers:
                    if (d, p) in occupied_periods:
                        conflicts = True
                        break
                if conflicts:
                    break

            if not conflicts:
                for d, pers in parsed:
                    for p in pers:
                        occupied_periods.add((d, p))
                cr = float(c.get("credits") or 0.0)
                total_credits += cr
                enrolled_courses.append({
                    "name": c["course_name"],
                    "credits": cr,
                    "category": "必修",
                    "time": c_time,
                    "code": c.get("course_code") or "",
                    "teacher": c.get("instructor") or "",
                    "location": c.get("location_name") or "",
                    "dept": dept,
                    "parsed_periods": parsed
                })


        # 1.5 雙主修 / 輔系功能 (適用於大二以上，優先排目標系所必修課程)
        sec_dept = getattr(profile, "secondary_department", None)
        sec_type = getattr(profile, "secondary_type", None) or "雙主修"
        if sec_dept and sec_dept != dept and grade >= 2:
            sec_roadmap = course_db_service.get_department_roadmap(sec_dept)
            candidate_sems = [sem_key]
            if grade == 2:
                candidate_sems.append("大一上")
            elif grade == 3:
                candidate_sems.extend(["大二上", "大一上"])
            elif grade == 4:
                candidate_sems.extend(["大三上", "大二上"])

            for target_sem in candidate_sems:
                sec_courses = sec_roadmap.get(target_sem, [])
                for sc in sec_courses:
                    sc_cr = float(sc.get("credits") or 0.0)
                    if total_credits + sc_cr > max_credits:
                        continue
                    sc_name = sc["course_name"]
                    sc_code = sc.get("course_code") or ""
                    if any(ec["name"] == sc_name or (sc_code and ec["code"] == sc_code) for ec in enrolled_courses):
                        continue

                    sc_time = sc.get("raw_schedule") or ""
                    sc_parsed = parse_schedule_periods(sc_time)
                    if not sc_parsed and sc.get("sections"):
                        for sec in sc["sections"]:
                            sec_time = sec.get("raw_schedule") or ""
                            sec_parsed = parse_schedule_periods(sec_time)
                            if sec_parsed:
                                sec_conflict = any((d, p) in occupied_periods for d, pers in sec_parsed for p in pers)
                                if not sec_conflict:
                                    sc_time = sec_time
                                    sc_parsed = sec_parsed
                                    if sec.get("location_name"):
                                        sc["location_name"] = sec["location_name"]
                                    if sec.get("instructor"):
                                        sc["instructor"] = sec["instructor"]
                                    break
                    if not sc_parsed:
                        continue

                    conflicts = any((d, p) in occupied_periods for d, pers in sc_parsed for p in pers)
                    if not conflicts:
                        for d, pers in sc_parsed:
                            for p in pers:
                                occupied_periods.add((d, p))
                        total_credits += sc_cr
                        enrolled_courses.append({
                            "name": sc_name,
                            "credits": sc_cr,
                            "category": f"{sec_type}必修",
                            "time": sc_time,
                            "code": sc_code,
                            "teacher": sc.get("instructor") or "",
                            "location": sc.get("location_name") or "",
                            "dept": sec_dept,
                            "parsed_periods": sc_parsed
                        })


        # 2. 空堂填補與加選邏輯 (至多加選兩堂，隨機挑選通識與體育)
        added_count = 0
        conn = course_db_service.get_connection()
        cur = conn.cursor()

        def try_add_course(
            query: str,
            params: tuple,
            cat_name: str,
            must_have_credits: bool = False,
            ignore_max_count: bool = False,
        ):
            nonlocal added_count, total_credits
            if not ignore_max_count and added_count >= 2:
                return
            cur.execute(query, params)
            rows = list(cur.fetchall())
            random.shuffle(rows)  # 每次隨機打散候選池，使每次通識/體育等課程更具多樣性
            for r in rows:
                if not ignore_max_count and added_count >= 2:
                    break

                code = r["course_code"] or ""
                name = r["course_name_zh"] or ""
                cr = float(r["credits"] or 0.0)
                t_str = r["time"] or ""
                loc = r["location"] or "綜合教學大樓"
                teacher = r["teacher"] or ""

                # Avoid duplicate courses
                if any(ec["name"] == name or ec["code"] == code for ec in enrolled_courses):
                    continue

                if must_have_credits and cr <= 0:
                    continue
                if total_credits + cr > max_credits:
                    continue

                parsed = parse_schedule_periods(t_str)
                if not parsed:
                    continue
                has_conflict = False
                for d, pers in parsed:
                    for p in pers:
                        if (d, p) in occupied_periods:
                            has_conflict = True
                            break
                    if has_conflict:
                        break
                if not has_conflict:
                    for d, pers in parsed:
                        for p in pers:
                            occupied_periods.add((d, p))
                    total_credits += cr
                    added_count += 1
                    enrolled_courses.append({
                        "name": name,
                        "credits": cr,
                        "category": cat_name,
                        "time": t_str,
                        "code": code,
                        "teacher": teacher,
                        "location": loc,
                        "dept": dept,
                        "parsed_periods": parsed
                    })

                    break

        # Priority 1: 通識課程 (最優先) (課號 CC、GS 開頭) - 至多先加1堂
        if added_count < 2:
            try_add_course("""
                SELECT c.course_code, c.course_name_zh, c.credits, c.teacher, s.time, s.location
                FROM courses c
                JOIN schedules s ON c.semester = s.semester AND c.serial_no = s.serial_no
                WHERE c.semester='1151' AND (c.course_code LIKE 'CC%' OR c.course_code LIKE 'GS%')
                  AND s.time IS NOT NULL AND s.time != ''
                ORDER BY RANDOM()
            """, (), "通識")

        # Priority 2: 體育課 (大二以上、選擇零學分、且非校隊) - 至多先加1堂
        if grade >= 2 and added_count < 2:
            try_add_course("""
                SELECT c.course_code, c.course_name_zh, c.credits, c.teacher, s.time, s.location
                FROM courses c
                JOIN schedules s ON c.semester = s.semester AND c.serial_no = s.serial_no
                WHERE c.semester='1151' AND (c.course_code LIKE 'PE%' OR c.department='體育室')
                  AND c.credits = 0
                  AND c.course_name_zh NOT LIKE '%男子%'
                  AND c.course_name_zh NOT LIKE '%女子%'
                  AND c.course_name_zh NOT LIKE '%代表隊%'
                  AND c.course_name_zh NOT LIKE '%校隊%'
                  AND c.course_name_zh NOT LIKE '%大一體育%'
                  AND s.time IS NOT NULL AND s.time != ''
                ORDER BY RANDOM()
            """, (), "體育")

        # Priority 3: 語言選修 (課號 LN 開頭) - 若未達2堂可加選
        if added_count < 2:
            try_add_course("""
                SELECT c.course_code, c.course_name_zh, c.credits, c.teacher, s.time, s.location
                FROM courses c
                JOIN schedules s ON c.semester = s.semester AND c.serial_no = s.serial_no
                WHERE c.semester='1151' AND c.course_code LIKE 'LN%'
                  AND s.time IS NOT NULL AND s.time != ''
                ORDER BY RANDOM()
            """, (), "語言選修")

        # 關鍵規則：假設該學系該年級必修極少，可以考慮新增該系該年級選修課
        # 總共學分數不要低於 16、不要大於 25，大四不要低於 9、不要大於 16
        if total_credits < min_credits:
            # 優先搜尋該系該年級選修課 (課號含年級代碼)
            grade_char = str(grade)
            try_add_course("""
                SELECT c.course_code, c.course_name_zh, c.credits, c.teacher, s.time, s.location
                FROM courses c
                JOIN schedules s ON c.semester = s.semester AND c.serial_no = s.serial_no
                WHERE c.semester='1151' AND (c.department = ? OR c.department LIKE ?)
                  AND c.required_or_elective = '選修'
                  AND c.course_code LIKE ?
                  AND c.credits > 0
                  AND s.time IS NOT NULL AND s.time != ''
                ORDER BY RANDOM()
            """, (dept, f"%{dept}%", f"%{grade_char}%"), "系選修", must_have_credits=True, ignore_max_count=True)

        # 若仍低於門檻，搜尋該系其他年級選修課
        while total_credits < min_credits:
            prev_credits = total_credits
            try_add_course("""
                SELECT c.course_code, c.course_name_zh, c.credits, c.teacher, s.time, s.location
                FROM courses c
                JOIN schedules s ON c.semester = s.semester AND c.serial_no = s.serial_no
                WHERE c.semester='1151' AND (c.department = ? OR c.department LIKE ?)
                  AND c.required_or_elective = '選修'
                  AND c.credits > 0
                  AND s.time IS NOT NULL AND s.time != ''
                ORDER BY RANDOM()
            """, (dept, f"%{dept}%"), "系選修", must_have_credits=True, ignore_max_count=True)
            if total_credits == prev_credits:
                # 該系選修已用盡或衝突，嘗試有學分的通識課補足
                break

        # 若仍低於門檻，嘗試有學分的通識課程補足
        while total_credits < min_credits:
            prev_credits = total_credits
            try_add_course("""
                SELECT c.course_code, c.course_name_zh, c.credits, c.teacher, s.time, s.location
                FROM courses c
                JOIN schedules s ON c.semester = s.semester AND c.serial_no = s.serial_no
                WHERE c.semester='1151' AND (c.course_code LIKE 'CC%' OR c.course_code LIKE 'GS%')
                  AND c.credits > 0
                  AND s.time IS NOT NULL AND s.time != ''
                ORDER BY RANDOM()
            """, (), "通識", must_have_credits=True, ignore_max_count=True)
            if total_credits == prev_credits:
                break

        # 3. 鋪設週一到週五真實課堂與社團行程 (僅保留課程與社團活動)
        schedule: list[ScheduleSlot] = []

        for day in range(1, 6):
            day_name = DAY_NAMES[day - 1]
            day_events: list[ScheduleSlot] = []

            # (1) 當天所有排定課程 (每堂課保持完整連續時段)
            for c in enrolled_courses:
                for cd, pers in c["parsed_periods"]:
                    if cd == day:
                        s_time, e_time, p_label = get_periods_time_range(pers)
                        loc_id, loc_name = map_campus_location(
                            c.get("location"),
                            c.get("name"),
                            c.get("dept") or dept
                        )
                        day_events.append(ScheduleSlot(
                            day=day,
                            slot=s_time,
                            title=f"{c['name']} ({c['category']})",
                            type="course",
                            location_id=loc_id,
                            location_name=loc_name,
                            course_id=c.get("code") or c["name"],
                            course_code=c.get("code"),
                            course_category=c["category"],
                            credits=c["credits"],
                            instructor=c.get("teacher"),
                            raw_schedule=c.get("time"),
                            start_time=s_time,
                            end_time=e_time,
                            display_time=f"{s_time} ~ {e_time}",
                            time_label=f"{day_name} {p_label}",
                            periods=pers
                        ))

            # (2) 社團團體活動 (若有填寫社團，安排於週二與週四晚間 18:30~20:30)
            club_name = profile.clubs[(day - 1) % len(profile.clubs)] if profile.clubs else None
            if club_name and day in (2, 4):
                day_events.append(ScheduleSlot(
                    day=day,
                    slot="18:30",
                    title=f"{club_name} (社團課堂與團體練習)",
                    type="club",
                    location_id="bldg_general_edu",
                    location_name="綜教館 (學生活動中心)",
                    start_time="18:30",
                    end_time="20:30",
                    display_time="18:30 ~ 20:30",
                    time_label=f"{day_name} 社團活動 (18:30~20:30)",
                    periods=["A", "B"]
                ))

            # 當天行程按開始時間排序
            day_events.sort(key=lambda s: s.start_time or "00:00")
            schedule.extend(day_events)

        return schedule

    async def generate_turn_content(
        self,
        db: Session,
        session: GameSession,
        active_model: str,
        trigger_prob: float
    ) -> tuple[TurnGenerationSchema, dict[str, Any], str | None, str | None]:
        """
        為當前 turn 生成情境與三個選項：
        1. 確定時段與館舍 Grounding
        2. 抽籤突發事件或使用常規骨架
        3. 呼叫 LLM 潤飾文本
        回傳: (TurnGenerationSchema, selected_preset_effects, location_id, location_name)
        """
        turn = session.current_turn
        slot_info = session.weekly_schedule[turn]
        day_num = slot_info.get("day", 1)
        day_str = DAY_NAMES[(day_num - 1) % len(DAY_NAMES)]
        slot_name = slot_info.get("slot") or "morning"
        slot_str = slot_info.get("time_label") or slot_info.get("display_time") or "校園時段"

        loc_id = slot_info.get("location_id") or "bldg_general_edu"
        bldg = db.query(Building).filter(Building.id == loc_id).first()
        if bldg:
            loc_name = bldg.name_zh
            loc_desc = bldg.description or f"中央大學{bldg.name_zh}"
        else:
            loc = db.query(CampusLocation).filter(CampusLocation.id == loc_id).first()
            loc_name = loc.name if loc else (slot_info.get("location_name") or "中大校園")
            loc_desc = loc.short_desc if loc else "綠意盎然的中央大學校園"


        # 撈取該館舍生活背景碎片
        life_info = db.query(CampusLifeInfo).filter(CampusLifeInfo.location_id == loc_id).first()
        if slot_info.get("type") == "dorm":
            if "07:" in (slot_info.get("start_time") or ""):
                life_snippet = "晨光透過宿舍窗櫺灑進房內，室友鬧鐘作響，走廊傳來盥洗刷牙聲與趕早八的步伐聲。"
            else:
                life_snippet = "深夜的學生宿舍瀰漫著泡麵與宵夜街的香氣，交誼廳有人在討論作業，走廊偶爾傳來室友的歡笑聲。"
        else:
            life_snippet = life_info.game_snippet if life_info else "微風徐徐吹過百花川與大草坪，下課鐘聲在校園迴盪。"

        # 判定突發事件
        chosen_event = None
        if random.random() < trigger_prob:
            stamina = session.stats.get("stamina", 80)
            candidate_events = db.query(RandomEvent).filter(
                RandomEvent.is_active == True,
                RandomEvent.id.notin_(session.triggered_evts or []),
                RandomEvent.cond_min_stamina <= stamina,
                RandomEvent.cond_max_stamina >= stamina
            ).all()

            filtered = []
            for ev in candidate_events:
                if ev.cond_days and day_num not in ev.cond_days:
                    continue
                if ev.cond_slots and slot_name not in ev.cond_slots:
                    continue
                if ev.cond_location and ev.cond_location != loc_id:
                    continue
                filtered.append(ev)

            if filtered:
                weights = [e.weight for e in filtered]
                chosen_event = random.choices(filtered, weights=weights, k=1)[0]
                session.triggered_evts = (session.triggered_evts or []) + [chosen_event.id]

        if chosen_event:
            event_instruction = f"【突發狀況事件：{chosen_event.title}】\n{chosen_event.event_prompt}"
            preset_options = chosen_event.preset_options
        else:
            event_instruction = f"常規校園作息：你在 {loc_name} 進行【{slot_info.get('title', '活動')}】。請描述你沉浸在此時段的心情與學習/活動情境。"
            preset_options = [
                {
                    "option_key": "A",
                    "intent_hint": "全神貫注認真參與，主動與教授或身旁同學交流提問",
                    "effects": {"stamina": -10, "study": 12, "social": 5, "money": 0}
                },
                {
                    "option_key": "B",
                    "intent_hint": "稍微放空小憩片刻，適度維持體力並順手滑滑手機中大校園論壇",
                    "effects": {"stamina": 10, "study": 0, "social": 0, "money": 0}
                },
                {
                    "option_key": "C",
                    "intent_hint": "活動結束後揪身邊同學一起去附近的學餐或外帶手搖飲聊八卦",
                    "effects": {"stamina": -5, "study": 0, "social": 12, "money": -60}
                }
            ]

        # 備援內容
        fallback_story = TurnGenerationSchema(
            narrative=f"【{day_str} {slot_str}】你來到了{loc_name}。四周充滿了中大學生來來往往的交談聲，空氣中帶著松林泥土的清香。現在正進行著「{slot_info.get('title')}」，你的大學一週日常正精彩展開。",
            options=[
                OptionItem(option_key="A", display_text=preset_options[0]["intent_hint"][:24]),
                OptionItem(option_key="B", display_text=preset_options[1]["intent_hint"][:24]),
                OptionItem(option_key="C", display_text=preset_options[2]["intent_hint"][:24]),
            ]
        )

        recent_hist = "、".join(session.history_logs[-2:]) if session.history_logs else "剛踏入中央大學展開第一週校園生活"
        prompt = TURN_NARRATIVE_PROMPT_TEMPLATE.format(
            day_name=day_str,
            slot_name=slot_str,
            location_name=loc_name,
            location_short_desc=loc_desc,
            schedule_title=slot_info.get("title", "自習時間"),
            life_snippet=life_snippet,
            recent_history=recent_hist,
            event_instruction=event_instruction,
            opt_a_hint=preset_options[0]["intent_hint"],
            opt_b_hint=preset_options[1]["intent_hint"],
            opt_c_hint=preset_options[2]["intent_hint"],
        )

        try:
            story = await call_ollama_structured(
                user_prompt=prompt,
                response_schema=TurnGenerationSchema,
                model_name=active_model,
                fallback_instance=fallback_story,
                timeout=25.0
            )
        except Exception as e:
            logger.warning(f"Turn story generation failed, using fallback: {e}")
            story = fallback_story

        effects_map = {opt["option_key"]: opt["effects"] for opt in preset_options}
        return story, effects_map, loc_id, loc_name

    def apply_choice_effects(
        self,
        session: GameSession,
        effects_map: dict[str, dict[str, int]],
        choice_key: str
    ) -> dict[str, int]:
        eff = effects_map.get(choice_key, {"stamina": 0, "study": 0, "social": 0, "money": 0})
        stats = session.stats.copy()

        # Update stats with bounded stamina
        stats["stamina"] = max(0, min(100, stats.get("stamina", 80) + eff.get("stamina", 0)))
        stats["study"] = max(0, min(100, stats.get("study", 50) + eff.get("study", 0)))
        stats["social"] = max(0, min(100, stats.get("social", 50) + eff.get("social", 0)))
        stats["money"] = max(0, stats.get("money", 1500) + eff.get("money", 0))

        session.stats = stats
        return eff

    async def generate_week_summary(
        self,
        db: Session,
        session: GameSession,
        active_model: str
    ) -> tuple[str, str]:
        stats = session.stats
        study = stats.get("study", 50)
        social = stats.get("social", 50)
        stamina = stats.get("stamina", 50)

        # 稱號判定邏輯
        if study >= 80:
            title = "中大書卷獎領跑者"
        elif social >= 80:
            title = "全方位百花川系核"
        elif stamina <= 20:
            title = "被早八榨乾的極限生存狂"
        elif "loc_night_street" in (session.visited_locs or []):
            title = "中大宵夜街守護神"
        else:
            title = "從容漫步的大一新鮮人"

        hist_summary = "\n".join([f"- {h}" for h in (session.history_logs or [])])
        prompt = WEEK_SUMMARY_PROMPT_TEMPLATE.format(
            stamina=stamina,
            study=study,
            social=social,
            money=stats.get("money", 1500),
            title=title,
            history_summary=hist_summary or "完成了一週多元充實的中央大學生活！"
        )

        fallback_diary = (
            f"這一週在中大，你經歷了必修課的挑戰、社團的熱情與百花川的微風。"
            f"最終你以體力 {stamina}、學業 {study}、社交 {social} 的亮眼成績，"
            f"榮獲「{title}」的殊榮！中央大學的校園還有更多未知等著你繼續探索！"
        )

        try:
            # We don't need complex schema for diary, just use ollama directly or structured
            class DiarySchema(BaseModel):
                diary_content: str

            res = await call_ollama_structured(
                user_prompt=prompt,
                response_schema=DiarySchema,
                model_name=active_model,
                fallback_instance=DiarySchema(diary_content=fallback_diary),
                timeout=25.0
            )
            diary_text = res.diary_content
        except Exception:
            diary_text = fallback_diary

        return title, diary_text

sim_engine = SimEngine()
