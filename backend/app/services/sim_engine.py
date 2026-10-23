import logging
import random
import re
from typing import Any

from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.llm_client import call_ollama_structured
from app.models.tables import (
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

def map_campus_location(location_name: str | None, course_name: str | None = None, dept: str | None = None) -> tuple[str, str]:
    loc_str = (location_name or "") + (course_name or "") + (dept or "")
    if any(k in loc_str for k in ["I1", "I2", "管二", "管理", "資管", "企管", "財金"]):
        return "loc_mgt2", location_name or "管理二館"
    if any(k in loc_str for k in ["E6", "工五", "資工", "資訊工程"]):
        return "loc_eng5", location_name or "工程五館"
    if any(k in loc_str for k in ["理", "科五", "S4", "物理", "化學", "數學"]):
        return "loc_sci5", location_name or "科學五館 / 理學院"
    if any(k in loc_str for k in ["體育", "依仁", "排球", "籃球", "羽球", "網球", "壘球", "游泳", "瑜珈", "體"]):
        return "loc_yiren", location_name or "依仁堂體育館"
    if any(k in loc_str for k in ["圖", "閱覽", "自修"]):
        return "loc_lib", location_name or "總圖書館"
    if any(k in loc_str for k in ["TR", "教研", "綜教", "文學", "文學院", "法文", "中文", "英文"]):
        return "loc_teaching", location_name or "綜合教學大樓"
    return "loc_teaching", location_name or "教學大樓"

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

        if not dept_hint:
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
                "生科": "生命科學系", "中文": "中國文學系", "英文": "英美語文學系", "法文": "法國語文學系"
            }
            for kw, target in dept_keywords.items():
                if kw in user_input:
                    dept = target
                    break

        if not grade_hint:
            if "大一" in user_input or "一年級" in user_input:
                grade = 1
            elif "大二" in user_input or "二年級" in user_input:
                grade = 2
            elif "大三" in user_input or "三年級" in user_input:
                grade = 3
            elif "大四" in user_input or "四年級" in user_input:
                grade = 4

        fallback = OnboardingParseSchema(
            department=dept,
            grade=grade,
            semester_term=1,
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
            if grade_hint:
                parsed.grade = grade_hint
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
        為週一至週五排定完整一日時間軸 (5天 x 6時段 = 30回合)
        1. 根據所選學系與年級撈取 courses.db 準確必修課 (大一含國文、英文、微積分、體育、服學)
        2. 空堂填補 (至多加選2堂，優先順序：通識(CC/GS) -> 體育(大二以上零學分非校隊) -> 語言選修(LN) -> 系選修)
        3. 學分規範：大一至大三 16~25 學分；大四 9~16 學分
        4. 映射到週一至週五整天時段 (08:00~21:00)
        """
        if profile is None:
            profile = OnboardingParseSchema()
        dept = profile.department or "資訊管理學系"
        grade = profile.grade if profile.grade in (1, 2, 3, 4) else 1

        min_credits = 9.0 if grade == 4 else 16.0
        max_credits = 16.0 if grade == 4 else 25.0

        # 1. 撈取必修課基本盤
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
                    "location": c.get("location_name") or "教學館舍",
                    "parsed_periods": parsed
                })

        # 2. 空堂填補與加選邏輯 (至多加選兩堂)
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
            rows = cur.fetchall()
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

        # 3. 鋪設週一到週五完整真實作息時間軸 (Google Calendar 風格連續日程)
        schedule: list[ScheduleSlot] = []

        dining_spots = [
            ("loc_pine_restaurant", "松苑學生餐廳"),
            ("loc_dorm_boy9", "男九舍學生學餐"),
            ("loc_backgate", "中央後門商圈"),
            ("loc_night_street", "中大宵夜街美食")
        ]

        free_spots = [
            ("loc_lib", "總圖書館自習室"),
            ("loc_park_creek", "百花川林蔭步道"),
            ("loc_cathay_tree", "國泰樹大草坪"),
            ("loc_teaching", "綜合教學大樓研討室")
        ]

        for day in range(1, 6):
            day_name = DAY_NAMES[day - 1]
            day_courses = []
            for c in enrolled_courses:
                for cd, pers in c["parsed_periods"]:
                    if cd == day:
                        s_time, e_time, p_label = get_periods_time_range(pers)
                        day_courses.append({
                            "course": c,
                            "periods": pers,
                            "start_time": s_time,
                            "end_time": e_time,
                            "period_label": p_label,
                        })
            day_courses.sort(key=lambda x: x["start_time"])

            # (1) 晨光朝氣 · 宿舍起居 (07:30 ~ 08:30) - 方便一早宿舍出發與早餐模擬
            schedule.append(ScheduleSlot(
                day=day,
                slot="07:30",
                title="晨光朝氣 · 宿舍起居與出發",
                type="dorm",
                location_id="loc_dorm_boy9",
                location_name="學生宿舍區",
                start_time="07:30",
                end_time="08:30",
                display_time="07:30 ~ 08:30",
                time_label=f"{day_name} 晨光起居 (07:30~08:30)",
                periods=[]
            ))

            # (2) 上午時段：是否有上午課程 (start_time < 12:00)
            m_courses = [dc for dc in day_courses if dc["start_time"] < "12:00"]
            if m_courses:
                for dc in m_courses:
                    c = dc["course"]
                    loc_id, loc_name = map_campus_location(
                        c.get("location"),
                        c.get("name"),
                        dept
                    )
                    schedule.append(ScheduleSlot(
                        day=day,
                        slot=dc["start_time"],
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
                        start_time=dc["start_time"],
                        end_time=dc["end_time"],
                        display_time=f"{dc['start_time']} ~ {dc['end_time']}",
                        time_label=f"{day_name} {dc['period_label']}",
                        periods=dc["periods"]
                    ))
            else:
                # 上午無課：自主晨讀
                spot = free_spots[(day * 2) % len(free_spots)]
                schedule.append(ScheduleSlot(
                    day=day,
                    slot="09:30",
                    title="晨曦漫步 · 圖書館自主研習",
                    type="free",
                    location_id=spot[0],
                    location_name=spot[1],
                    start_time="09:30",
                    end_time="11:30",
                    display_time="09:30 ~ 11:30",
                    time_label=f"{day_name} 悠閒晨間 (09:30~11:30)",
                    periods=["2", "3", "4"]
                ))

            # (3) 午膳時段 (12:00 ~ 13:00)
            has_z_course = any("Z" in dc["periods"] for dc in day_courses)
            if not has_z_course:
                dining_spot = dining_spots[(day - 1) % len(dining_spots)]
                schedule.append(ScheduleSlot(
                    day=day,
                    slot="12:00",
                    title="校園午膳與漫步休憩",
                    type="lunch",
                    location_id=dining_spot[0],
                    location_name=dining_spot[1],
                    start_time="12:00",
                    end_time="13:00",
                    display_time="12:00 ~ 13:00",
                    time_label=f"{day_name} 午膳漫步 (12:00~13:00)",
                    periods=["Z"]
                ))

            # (4) 下午時段：是否有下午課程 (13:00 <= start_time < 18:00)
            a_courses = [dc for dc in day_courses if "13:00" <= dc["start_time"] < "18:00"]
            if a_courses:
                for dc in a_courses:
                    c = dc["course"]
                    loc_id, loc_name = map_campus_location(
                        c.get("location"),
                        c.get("name"),
                        dept
                    )
                    schedule.append(ScheduleSlot(
                        day=day,
                        slot=dc["start_time"],
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
                        start_time=dc["start_time"],
                        end_time=dc["end_time"],
                        display_time=f"{dc['start_time']} ~ {dc['end_time']}",
                        time_label=f"{day_name} {dc['period_label']}",
                        periods=dc["periods"]
                    ))
            else:
                # 下午無課：自主探索
                spot = free_spots[(day * 3) % len(free_spots)]
                schedule.append(ScheduleSlot(
                    day=day,
                    slot="14:00",
                    title="午後微風 · 校園自主探索與自習",
                    type="free",
                    location_id=spot[0],
                    location_name=spot[1],
                    start_time="14:00",
                    end_time="16:00",
                    display_time="14:00 ~ 16:00",
                    time_label=f"{day_name} 午後自主 (14:00~16:00)",
                    periods=["6", "7"]
                ))

            # (5) 晚間時段 (18:30 ~ 20:30)：夜間課程或社團交流
            e_courses = [dc for dc in day_courses if dc["start_time"] >= "18:00"]
            if e_courses:
                for dc in e_courses:
                    c = dc["course"]
                    loc_id, loc_name = map_campus_location(
                        c.get("location"),
                        c.get("name"),
                        dept
                    )
                    schedule.append(ScheduleSlot(
                        day=day,
                        slot=dc["start_time"],
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
                        start_time=dc["start_time"],
                        end_time=dc["end_time"],
                        display_time=f"{dc['start_time']} ~ {dc['end_time']}",
                        time_label=f"{day_name} {dc['period_label']}",
                        periods=dc["periods"]
                    ))
            else:
                club_name = profile.clubs[(day - 1) % len(profile.clubs)] if profile.clubs else None
                if club_name and day in (2, 4):  # 常態週二、週四社課
                    schedule.append(ScheduleSlot(
                        day=day,
                        slot="18:30",
                        title=f"{club_name} (社團課堂與交流)",
                        type="club",
                        location_id="loc_teaching",
                        location_name="學生活動中心 / 綜教館",
                        start_time="18:30",
                        end_time="20:30",
                        display_time="18:30 ~ 20:30",
                        time_label=f"{day_name} 晚間社團 (18:30~20:30)",
                        periods=["A", "B"]
                    ))
                else:
                    spot = free_spots[day % len(free_spots)]
                    schedule.append(ScheduleSlot(
                        day=day,
                        slot="18:30",
                        title="晚風漫步 · 總圖書館研習與放空",
                        type="free",
                        location_id=spot[0],
                        location_name=spot[1],
                        start_time="18:30",
                        end_time="20:30",
                        display_time="18:30 ~ 20:30",
                        time_label=f"{day_name} 晚間漫步 (18:30~20:30)",
                        periods=["A", "B"]
                    ))

            # (6) 深夜時光 · 宿舍生活 (21:30 ~ 23:00) - 方便夜間回宿舍與室友互動模擬
            schedule.append(ScheduleSlot(
                day=day,
                slot="21:30",
                title="夜幕深垂 · 宿舍夜生活與就寢",
                type="dorm",
                location_id="loc_dorm_boy9",
                location_name="學生宿舍 / 宵夜街",
                start_time="21:30",
                end_time="23:00",
                display_time="21:30 ~ 23:00",
                time_label=f"{day_name} 深夜宿舍 (21:30~23:00)",
                periods=[]
            ))

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

        loc_id = slot_info.get("location_id") or "loc_park_creek"
        loc = db.query(CampusLocation).filter(CampusLocation.id == loc_id).first()
        loc_name = loc.name if loc else "中大校園"
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
