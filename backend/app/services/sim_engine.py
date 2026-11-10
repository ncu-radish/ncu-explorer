import difflib
import json
import logging
import math
import random
import re
from pathlib import Path
from typing import Any

from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.llm_client import call_ollama_structured
from app.models.tables import (
    Building,
    CampusActivity,
    CampusLifeInfo,
    CampusLocation,
    ClubAndActivity,
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

COMMON_CLUB_ALIASES: dict[str, str] = {
    "熱舞": "熱門舞蹈社", "熱舞社": "熱門舞蹈社",
    "熱音": "熱門音樂社", "熱音社": "熱門音樂社",
    "資安": "網安讀書會", "資安讀書會": "網安讀書會", "中央資安讀書會": "網安讀書會",
    "汪汪": "中大汪汪社", "汪汪社": "中大汪汪社",
    "基服": "基層文化服務社", "基服社": "基層文化服務社",
    "圍棋": "棋藝社", "圍棋社": "棋藝社",
    "吉他": "吉他社",
    "火舞": "火舞藝術研究社", "火舞社": "火舞藝術研究社",
    "鋼琴": "鋼琴社",
    "資管系會": "資管系學會",
    "資工系會": "資工系學會",
    "電機系會": "電機系學會",
    "企管系會": "企管系學會",
    "財金系會": "財金系學會",
    "新竹友會": "新竹校友會", "竹友會": "新竹校友會",
    "雄友": "雄友會", "雄友會": "雄友會",
    "彰友": "彰化校友會", "彰友會": "彰化校友會",
    "雲嘉": "雲嘉會", "雲嘉會": "雲嘉會",
    "管樂": "管樂社", "管樂社": "管樂社",
    "弦樂": "弦樂社", "弦樂社": "弦樂社",
    "合唱": "合唱團", "合唱團": "合唱團",
    "攝影": "攝影社", "攝影社": "攝影社",
}

MAX_EVENT_OCCURRENCES = 2  # 同一事件每局最多出現次數
EVENT_MIN_GAP_TURNS = 3  # 兩次突發事件之間至少間隔的回合數
DAY_START_MINUTES = 8 * 60
DAY_END_MINUTES = 21 * 60
LUNCH_WINDOW = (11 * 60, 14 * 60)
DINNER_WINDOW = (17 * 60, 19 * 60 + 30)
MIN_MEAL_GAP_MINUTES = 30
MEAL_PROMPT_MINUTES = 60
LEISURE_MIN_GAP_MINUTES = 90


def free_gaps(busy: list[tuple[int, int]], lo: int, hi: int) -> list[tuple[int, int]]:
    """在 [lo, hi) 內扣掉 busy 區間後剩下的空檔。busy 需已依起點排序。"""
    gaps: list[tuple[int, int]] = []
    cursor = lo
    for b_start, b_end in busy:
        if b_end <= cursor:
            continue
        if b_start >= hi:
            break
        if b_start > cursor:
            gaps.append((cursor, b_start))
        cursor = max(cursor, b_end)
    if cursor < hi:
        gaps.append((cursor, hi))
    return gaps


def pick_meal_window(
    gaps: list[tuple[int, int]], window: tuple[int, int], preferred: int
) -> tuple[int, int] | None:
    """在空檔與用餐時段的交集中挑一段（至少 30 分鐘），盡量靠近偏好的開始時間，長度最多 60 分鐘。"""
    best: tuple[int, int] | None = None
    for g_start, g_end in gaps:
        lo, hi = max(g_start, window[0]), min(g_end, window[1])
        if hi - lo < MIN_MEAL_GAP_MINUTES:
            continue
        start = min(max(preferred, lo), hi - MIN_MEAL_GAP_MINUTES)
        cand = (start, min(start + MEAL_PROMPT_MINUTES, hi))
        if best is None or abs(cand[0] - preferred) < abs(best[0] - preferred):
            best = cand
    return best


FALLBACK_SCENES: dict[str, list[str]] = {
    "course": [
        "你走進{loc}，找了個位子坐下。投影機的風扇嗡嗡作響，教授翻開講義，「{title}」開始了。",
        "{loc}的教室裡人聲漸漸安靜下來，你翻開筆記本，「{title}」的內容在黑板上一行行展開。",
        "你在上課鈴響前一分鐘抵達{loc}，喘口氣的同時，「{title}」的點名單已經傳了下來。",
    ],
    "club": [
        "社團教室在{loc}，大家陸續到齊，「{title}」的活動在熱鬧的寒暄聲中展開。",
        "傍晚的{loc}燈火通明，你推開門，夥伴們已經開始準備今天的「{title}」。",
    ],
    "dorm": ["你回到{loc}，房間裡的檯燈柔和地亮著，準備迎接「{title}」。"],
    "default": [
        "你來到了{loc}。四周是中大學生來來往往的交談聲，空氣中帶著松林泥土的清香，現在是「{title}」。",
        "{loc}附近的百花川微風徐徐，你放慢腳步，迎接「{title}」。",
    ],
}

COURSE_OPTION_VARIANTS: list[tuple[str, str, str]] = [
    ("全神貫注認真參與，主動與教授或身旁同學交流提問",
     "稍微放空小憩片刻，適度維持體力並順手滑滑手機中大校園論壇",
     "活動結束後揪身邊同學一起去附近的學餐或外帶手搖飲聊八卦"),
    ("坐到第一排認真抄筆記，把不懂的地方都記下來下課問",
     "靠著椅背放鬆聽課，把精神留給晚點的行程",
     "趁課間跟隔壁同學交換筆記，順便約下課一起行動"),
    ("跟著教授的節奏專心推導，下課前把重點整理完",
     "半聽半休息，偶爾低頭看看手機緩一緩",
     "下課後邀同學去合作社買點心，邊吃邊聊修課心得"),
]


def fallback_scene(slot_info: dict[str, Any], loc_name: str, turn: int) -> str:
    """沒有 LLM 時依行程類型輪替的敘事模板。"""
    kind = str(slot_info.get("type") or "default")
    pool = FALLBACK_SCENES.get(kind) or FALLBACK_SCENES["default"]
    return pool[turn % len(pool)].format(loc=loc_name, title=slot_info.get("title", "活動"))


# 學系全名 → 系學會名稱（資料庫中的社團名稱用簡稱）
DEPT_CLUB_NAMES: dict[str, str] = {
    "資訊管理學系": "資管系學會", "資訊工程學系": "資工系學會",
    "電機工程學系": "電機系學會", "通訊工程學系": "通訊系學會",
    "企業管理學系": "企管系學會", "財務金融學系": "財金系學會",
    "經濟學系": "經濟系學會", "機械工程學系": "機械系學會",
    "土木工程學系": "土木系學會", "化學工程與材料工程學系": "化材系學會",
    "數學系": "數學系學會", "物理學系": "物理系學會", "化學學系": "化學系學會",
    "生命科學系": "生科系學會", "中國文學系": "中文系學會",
    "英美語文學系": "英文系學會", "法國語文學系": "法文系學會",
    "大氣科學學系": "大氣系學會", "地球科學學系": "地科聯合系學會",
    "光電科學與工程學系": "光電系學會", "客家語文暨社會科學學系": "客家系學會",
}
CLUB_FUZZY_THRESHOLD = 0.6  # 模糊比對的最低相似度，低於此視為找不到

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

    # 1. 優先由地點代碼/名稱匹配；地點含多間教室（「I1-105 / 綜教館-210」）時只取第一間能辨識的
    if loc_raw and loc_raw not in ("未定", "安排中"):
        segments = [seg for seg in re.split(r"\s*[/／、,，;；]\s*", loc_raw) if seg] or [loc_raw]
        for segment in segments:
            for pattern, bldg_id, canon_name in BUILDING_MATCH_RULES:
                if re.search(pattern, segment, re.IGNORECASE):
                    if segment == canon_name:
                        display_name = canon_name
                    elif canon_name in segment:
                        display_name = segment
                    else:
                        display_name = f"{canon_name} ({segment})"
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


DEFAULT_HOME_DORM_ID = "bldg_dorm_b9a"
SPORT_ACTIVITY_ID = "act_campus_sport"
MEAL_CATEGORIES = ("lunch", "dinner")
WALK_SPEED_M_PER_MIN = 80.0  # 約 4.8 km/h 的步行速度


WALK_METERS_PER_STAMINA = 200.0  # 每走這麼遠扣 1 點體力


def walking_stamina_cost(distance_m: float) -> int:
    """走 distance_m 公尺消耗的體力點數（每 200 公尺 1 點，不足不計）。"""
    return int(distance_m // WALK_METERS_PER_STAMINA)


def walking_minutes(distance_m: float) -> int:
    """步行 distance_m 公尺需要的分鐘數（無條件進位；距離極短視為 0）。"""
    if distance_m < 1:
        return 0
    return max(1, math.ceil(distance_m / WALK_SPEED_M_PER_MIN))


def sleep_stamina_gain(hours: float) -> int:
    """睡眠回復的體力：隨睡眠時數連續變化。

    < 6 小時按比例遞減（睡越少恢復越少）、6~9 小時每小時 +5（9 小時 +45 為最佳）、
    超過 9 小時每多睡 1 小時少 4 點，最低維持 30。
    """
    if hours <= 0:
        return 0
    if hours < 6.0:
        return int(round(5 * hours * (hours / 6.0)))
    if hours <= 9.0:
        return int(round(5 * hours))
    return int(round(max(30.0, 45.0 - 4.0 * (hours - 9.0))))


def apply_sleep(session: GameSession, hours: float) -> int:
    """睡眠回復體力（上限 100），回傳實際回復量。"""
    before = int((session.stats or {}).get("stamina", 80))
    stats = dict(session.stats or {})
    stats["stamina"] = min(100, before + sleep_stamina_gain(hours))
    session.stats = stats
    return stats["stamina"] - before


def time_to_minutes(time_str: str, night: bool = False) -> int:
    """'HH:MM' 轉為分鐘數。night=True 時 05:00 以前視為隔天（加 24 小時）。"""
    parts = time_str.split(":")
    h = int(parts[0])
    m = int(parts[1]) if len(parts) > 1 else 0
    if night and h < 5:
        h += 24
    return h * 60 + m


def minutes_to_time(total_minutes: int) -> str:
    total_minutes %= 24 * 60
    return f"{total_minutes // 60:02d}:{total_minutes % 60:02d}"


NIGHT_CUTOFF_MINUTES = 29 * 60  # 清晨 05:00 換日線
MAX_MEAL_MINUTES = 120


def scale_activity_effects(
    effects: dict[str, int], on_site_minutes: int, travel_stamina: int = 0
) -> dict[str, int]:
    """活動每小時的效果，依「實際待在現場」的分鐘數縮放，並另外扣除步行消耗的體力。"""
    hours = max(0.25, on_site_minutes / 60.0)
    scaled = {k: int(round(v * hours)) for k, v in effects.items()}
    if travel_stamina:
        scaled["stamina"] = scaled.get("stamina", 0) - travel_stamina
    return scaled


ABSENCE_STUDY_PENALTY_PER_HOUR = 8  # 缺課每一小時扣的學業
ENDING_FAINT = "faint"


def skip_slots(
    session: GameSession, schedule: list[dict[str, Any]], indices: Any, reason: str
) -> dict[str, int]:
    """把行程標記為跳過；其中尚未跳過的「課程」算缺課，依時數扣學業。回傳學業實際變化量。"""
    from sqlalchemy.orm.attributes import flag_modified

    absent_courses = 0
    absent_hours = 0.0
    for i in indices:
        if not 0 <= i < len(schedule):
            continue
        slot = schedule[i]
        if slot.get("is_skipped"):
            continue
        slot["is_skipped"] = True
        slot["skip_reason"] = reason
        if slot.get("type") == "course":
            absent_courses += 1
            start = time_to_minutes(slot.get("start_time") or "00:00")
            end = time_to_minutes(slot.get("end_time") or slot.get("start_time") or "00:00")
            absent_hours += max(0, end - start) / 60.0
    if not absent_courses:
        return {}

    profile = dict(session.player_profile or {})
    profile["absences"] = int(profile.get("absences", 0)) + absent_courses
    profile["absence_hours"] = round(float(profile.get("absence_hours", 0.0)) + absent_hours, 2)
    session.player_profile = profile
    flag_modified(session, "player_profile")

    stats = dict(session.stats or {})
    before = int(stats.get("study", 50))
    stats["study"] = max(0, before - int(round(ABSENCE_STUDY_PENALTY_PER_HOUR * absent_hours)))
    session.stats = stats
    session.history_logs = (session.history_logs or []) + [
        f"缺課 {absent_courses} 堂（{absent_hours:g} 小時），學業 {stats['study'] - before}"
    ]
    return {"study": stats["study"] - before}


COMMUTE_FIXED_TYPES = ("course", "club")


def commute_penalty(
    session: GameSession,
    from_slot: dict[str, Any],
    to_slot: dict[str, Any],
    distance_m: float,
) -> dict[str, int]:
    """固定行程（課程、社團）之間換館舍的步行：扣體力；走不完下課空檔則寫入日誌。回傳實際數值變化。"""
    if from_slot.get("type") not in COMMUTE_FIXED_TYPES or to_slot.get("type") not in COMMUTE_FIXED_TYPES:
        return {}
    if from_slot.get("day") != to_slot.get("day") or distance_m <= 0:
        return {}
    minutes = walking_minutes(distance_m)
    cost = walking_stamina_cost(distance_m)
    gap = time_to_minutes(to_slot.get("start_time") or "00:00") - time_to_minutes(from_slot.get("end_time") or "00:00")
    if minutes > gap:
        session.history_logs = (session.history_logs or []) + [
            f"從「{from_slot.get('location_name')}」走到「{to_slot.get('location_name')}」要 {minutes} 分鐘，"
            f"下課只有 {gap} 分鐘，趕得很匆忙"
        ]
    if not cost:
        return {}
    before = int((session.stats or {}).get("stamina", 80))
    stats = dict(session.stats or {})
    stats["stamina"] = max(0, before - cost)
    session.stats = stats
    return {"stamina": stats["stamina"] - before}


def club_mentioned(club: str, user_input: str) -> bool:
    """社團名稱（或其別名、「系學會」）是否真的出現在使用者的輸入裡。"""
    name = (club or "").strip()
    text = user_input or ""
    if not name or not text:
        return False
    if name in text:
        return True
    if name in ("系學會", "系會"):
        return "系學會" in text or "系會" in text
    return any(alias in text and target == name for alias, target in COMMON_CLUB_ALIASES.items())


def pick_title(session: GameSession) -> str:
    """依結算數值、缺課與行程判定稱號（由嚴格到寬鬆）。"""
    stats = session.stats or {}
    profile = session.player_profile or {}
    study = stats.get("study", 50)
    social = stats.get("social", 50)
    stamina = stats.get("stamina", 50)
    money = stats.get("money", 1500)
    absences = int(profile.get("absences", 0))

    if profile.get("ending") == ENDING_FAINT:
        return "體力透支的保健室常客"
    if study >= 80 and absences == 0 and stamina > 20:
        return "中大書卷獎領跑者"
    if social >= 80 and study >= 40:
        return "全方位百花川系核"
    if absences >= 3:
        return "與教室緣分很淺的自由靈魂"
    if stamina <= 20:
        return "被早八榨乾的極限生存狂"
    if money <= 100:
        return "月底吃土的窮忙大學生"
    if "loc_night_street" in (session.visited_locs or []):
        return "中大宵夜街守護神"
    return "從容漫步的大一新鮮人"


def merge_deltas(*deltas: dict[str, int] | None) -> dict[str, int]:
    merged: dict[str, int] = {}
    for d in deltas:
        for k, v in (d or {}).items():
            merged[k] = merged.get(k, 0) + v
    return merged


def check_faint(session: GameSession) -> bool:
    """體力歸零 → 昏倒結局，遊戲立刻結束。"""
    from sqlalchemy.orm.attributes import flag_modified

    if int((session.stats or {}).get("stamina", 80)) > 0:
        return False
    profile = dict(session.player_profile or {})
    profile["ending"] = ENDING_FAINT
    profile.pop("active_random_event", None)
    session.player_profile = profile
    flag_modified(session, "player_profile")
    session.current_turn = len(session.weekly_schedule or [])
    session.history_logs = (session.history_logs or []) + ["體力耗盡，當場昏倒被送往保健室……"]
    return True


def pick_meal_options(
    candidates: list[str],
    distances: dict[str, float],
    streets: set[str],
    rng: random.Random,
    count: int = 3,
) -> list[str]:
    """從餐廳與街口候選中挑出供玩家選擇的地點。

    規則：一個是離目前位置最近的；一個是街口（宵夜街／後門，有的話）；其餘隨機補滿。
    沒有距離資料時，最近的那一項會略過，整體退化成隨機抽取。
    """
    pool = sorted(set(candidates))
    if len(pool) <= count:
        return pool

    chosen: list[str] = []
    reachable = [c for c in pool if c in distances]
    if reachable:
        chosen.append(min(reachable, key=lambda c: (distances[c], c)))

    street_pool = [c for c in pool if c in streets and c not in chosen]
    if street_pool and not any(c in streets for c in chosen):
        chosen.append(rng.choice(street_pool))

    rest = [c for c in pool if c not in chosen]
    rng.shuffle(rest)
    chosen.extend(rest[: count - len(chosen)])
    return chosen[:count]


def resolve_home_dorm(db: Session | None, dorm_id: str | None) -> tuple[str, str]:
    """回傳 (宿舍建築 id, 中文名稱)。id 無效或不是宿舍時退回預設宿舍。"""
    if db is not None:
        for candidate in (dorm_id, DEFAULT_HOME_DORM_ID):
            if not candidate:
                continue
            bldg = db.query(Building).filter(Building.id == candidate).first()
            if bldg is not None and bldg.category == "dorm":
                return bldg.id, bldg.name_zh
    return DEFAULT_HOME_DORM_ID, "學生宿舍"


class SimEngine:
    @staticmethod
    def load_all_clubs(db: Session | None = None) -> list[dict[str, Any]]:
        """載入全校所有立案社團清單 (優先自 SQLite 讀取，回退自 ncu_clubs.json)"""
        if db:
            try:
                db_clubs = db.query(ClubAndActivity).all()
                if db_clubs and len(db_clubs) >= 10:
                    return [
                        {
                            "id": c.id,
                            "name": c.name,
                            "english_name": c.english_name,
                            "category": c.category or c.type,
                            "location_text": c.location_text,
                            "location_id": c.location_id,
                            "full_intro": c.full_intro,
                        }
                        for c in db_clubs
                    ]
            except Exception as e:
                logger.warning(f"Failed to query ClubAndActivity from db: {e}")

        clubs_file = Path(__file__).resolve().parent.parent.parent / "data" / "ncu_clubs.json"
        if clubs_file.exists():
            with open(clubs_file, encoding="utf-8") as f:
                raw = json.load(f)
            return [
                {
                    "id": f"club_{i:03d}",
                    "name": d.get("中文名稱", ""),
                    "english_name": d.get("英文名稱或縮寫"),
                    "category": d.get("社團分類", "其它"),
                    "location_text": d.get("社辦地點"),
                    "location_id": None,
                    "full_intro": d.get("中文簡介", ""),
                }
                for i, d in enumerate(raw, 1)
            ]
        return []

    def match_nearest_club(
        self,
        query: str,
        all_clubs: list[dict[str, Any]],
        dept_hint: str | None = None
    ) -> dict[str, Any] | None:
        """從全校社團清單找出對應社團（精確、別名、系學會對照、子字串、高門檻相似度）。找不到回傳 None。"""
        q = (query or "").strip()
        if not q or not all_clubs:
            return None
        by_name = {c["name"]: c for c in all_clubs}

        if q in ("系學會", "系會"):
            club_name = DEPT_CLUB_NAMES.get(dept_hint or "")
            return by_name.get(club_name) if club_name else None

        if q in COMMON_CLUB_ALIASES:
            hit = by_name.get(COMMON_CLUB_ALIASES[q])
            if hit:
                return hit

        if q in by_name:
            return by_name[q]
        for c in all_clubs:
            if c.get("english_name") and c["english_name"].lower() == q.lower():
                return c

        if len(q) >= 2:
            substring_matches = [
                c for c in all_clubs
                if q in c["name"] or c["name"] in q
                or (c.get("english_name") and q.lower() in c["english_name"].lower())
            ]
            if substring_matches:
                return max(substring_matches, key=lambda c: difflib.SequenceMatcher(None, q, c["name"]).ratio())

        best_club, best_ratio = None, 0.0
        for c in all_clubs:
            ratio = difflib.SequenceMatcher(None, q, c["name"]).ratio()
            if ratio > best_ratio:
                best_club, best_ratio = c, ratio
        return best_club if best_ratio >= CLUB_FUZZY_THRESHOLD else None

    def classify_club_activity(self, club: dict[str, Any]) -> dict[str, Any]:
        """
        AI 與專家規則研判社團活動排程：
        1. 教學性社團 (中央資安讀書會、XX研究社、XX系學會、XX友會)：多半每週 1 天課程，時長約 2 小時 (18:30~20:30)
        2. 服務性、體育性、興趣休閒型 (中大汪汪社、基服社、圍棋社、鋼琴社、球隊等)：為 1~2 天社課，時長約 2.5 小時 (18:30~21:00)
        3. 表演性社團 (火舞藝術研究社、熱門舞蹈社、熱門音樂社、吉他社等)：為 3 天社課，時長約 3 小時 (18:30~21:30)
        """
        name = club.get("name", "")
        cat = club.get("category", "")
        loc_text = club.get("location_text") or ""

        perf_keywords = [
            "火舞", "舞蹈", "熱舞", "熱音", "音樂", "樂團", "吉他", "管樂", "弦樂",
            "國樂", "合唱", "阿卡貝拉", "戲劇", "話劇", "搖滾", "表演", "成發"
        ]
        sports_keywords = [
            "球", "隊", "體育", "道", "拳", "滑輪", "溜冰", "射箭", "登山", "攀岩",
            "單車", "自行車", "桌球", "羽球", "網球", "排球", "籃球", "棒球", "壘球",
            "足球", "武術", "太極", "瑜珈", "健身", "游泳", "潛水", "飛盤"
        ]
        service_keywords = [
            "服務", "汪汪", "志工", "慈青", "童軍", "扶輪", "春暉", "救護", "紅十字"
        ]
        hobby_keywords = [
            "棋", "圍棋", "鋼琴", "攝影", "動漫", "桌遊", "咖啡", "烘焙", "手作",
            "繪畫", "美術", "手語", "生存遊戲", "調酒", "魔術", "電影"
        ]

        if any(k in name for k in perf_keywords):
            days_count = 3
            start_time = "18:30"
            end_time = "21:30"
            periods = ["A", "B", "C"]
            activity_label = "常態集訓與排演"
        elif cat in ("體育性", "服務性") or any(k in name for k in sports_keywords + service_keywords + hobby_keywords):
            days_count = 2
            start_time = "18:30"
            end_time = "21:00"
            periods = ["A", "B"]
            activity_label = "常態社課與練習"
        else:
            days_count = 1
            start_time = "18:30"
            end_time = "20:30"
            periods = ["A", "B"]
            activity_label = "每週社課研討與例會"

        if "據德" in loc_text:
            loc_id, loc_name = "bldg_jude", "據德樓 (學生社團大樓)"
        elif "游藝" in loc_text:
            loc_id, loc_name = "bldg_youyi", "游藝館 (藝文活動中心)"
        elif "夢工廠" in loc_text:
            loc_id, loc_name = "bldg_jude", "夢工廠 (學生創意基地)"
        elif "依仁" in loc_text or cat == "體育性":
            loc_id, loc_name = "bldg_yireng", "依仁堂體育館"
        elif loc_text:
            loc_id, loc_name = "bldg_general_edu", loc_text
        else:
            loc_id, loc_name = "bldg_general_edu", "綜教館 (學生活動中心)"

        return {
            "days_count": days_count,
            "start_time": start_time,
            "end_time": end_time,
            "periods": periods,
            "activity_label": activity_label,
            "location_id": loc_id,
            "location_name": loc_name,
        }

    def resolve_club_weekly_schedule(
        self,
        db: Session | None,
        profile: OnboardingParseSchema | None,
        busy: dict[int, list[tuple[int, int]]] | None = None,
        notes: list[str] | None = None,
    ) -> dict[int, list[ScheduleSlot]]:
        """
        為使用者輸入的目標社團解析真實社團並排定週一至週五晚間時段
        - 找不到對應社團時略過並寫入 notes（不隨機配對）
        - 表演性 3 天、體育/服務/興趣 2 天、教學/學術/系學會/友會 1 天
        - busy：各日已被課程佔用的 (起, 迄) 分鐘；與社團重疊的日子不排，排不滿就少排並記錄
        """
        busy = busy or {}
        notes = notes if notes is not None else []
        all_clubs = self.load_all_clubs(db)
        dept_hint = profile.department if profile else None

        raw_candidates: list[str] = []
        if profile and profile.clubs:
            for c in profile.clubs:
                if c and c.strip() and c.strip() not in raw_candidates:
                    raw_candidates.append(c.strip())

        if profile and getattr(profile, "club", None):
            single_c = profile.club.strip()
            if single_c and single_c not in raw_candidates:
                raw_candidates.append(single_c)

        if not raw_candidates:
            return {d: [] for d in range(1, 6)}  # 沒有要求就不參加任何社團

        resolved_clubs: list[dict[str, Any]] = []
        seen_ids: set[Any] = set()
        for raw_q in raw_candidates:
            matched = self.match_nearest_club(raw_q, all_clubs, dept_hint=dept_hint)
            if matched is None:
                notes.append(f"找不到社團「{raw_q}」，已略過")
                continue
            if matched.get("id") in seen_ids:
                continue
            seen_ids.add(matched.get("id"))
            resolved_clubs.append({"club": matched, "profile": self.classify_club_activity(matched)})

        resolved_clubs.sort(key=lambda x: x["profile"]["days_count"], reverse=True)

        slots_by_day: dict[int, list[ScheduleSlot]] = {d: [] for d in range(1, 6)}
        club_busy: dict[int, list[tuple[int, int]]] = {d: list(busy.get(d, [])) for d in range(1, 6)}

        def is_free(day: int, start: int, end: int) -> bool:
            return all(end <= bs or start >= be for bs, be in club_busy[day])

        for item in resolved_clubs:
            club = item["club"]
            info = item["profile"]
            needed_days = info["days_count"]
            start_m = time_to_minutes(info["start_time"])
            end_m = time_to_minutes(info["end_time"])

            preferred = {3: [1, 3, 5], 2: [2, 4]}.get(needed_days, [2, 3, 4])
            order = preferred + [d for d in range(1, 6) if d not in preferred]
            assigned_days = [d for d in order if is_free(d, start_m, end_m)][:needed_days]
            if len(assigned_days) < needed_days:
                notes.append(
                    f"社團「{club['name']}」每週需 {needed_days} 天，與課程衝突後只排得下 {len(assigned_days)} 天"
                )

            for day_idx in assigned_days:
                club_busy[day_idx].append((start_m, end_m))
                day_name = DAY_NAMES[day_idx - 1]
                s_time = info["start_time"]
                e_time = info["end_time"]
                display_t = f"{s_time} ~ {e_time}"
                title_str = f"{club['name']} ({info['activity_label']})"

                slots_by_day[day_idx].append(ScheduleSlot(
                    day=day_idx,
                    slot=s_time,
                    title=title_str,
                    type="club",
                    club_id=club.get("id"),
                    location_id=info["location_id"],
                    location_name=info["location_name"],
                    start_time=s_time,
                    end_time=e_time,
                    display_time=display_t,
                    time_label=f"{day_name} 社團活動 ({display_t})",
                    periods=info["periods"]
                ))

        return slots_by_day

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

        # 年級萃取 (若有傳入 grade_hint 則直接採用，否則從使用者輸入文字萃取)
        if grade_hint in (1, 2, 3, 4):
            grade = grade_hint
        elif "大四" in user_input or "四年級" in user_input or "4年級" in user_input:
            grade = 4
        elif "大三" in user_input or "三年級" in user_input or "3年級" in user_input:
            grade = 3
        elif "大二" in user_input or "二年級" in user_input or "2年級" in user_input:
            grade = 2
        elif "大一" in user_input or "一年級" in user_input or "1年級" in user_input:
            grade = 1
        elif sec_type and grade == 1 and not grade_hint:
            # 雙主修/輔系主要適用於大二以上，未指定年級時自動推進為大二
            grade = 2

        fallback = OnboardingParseSchema(
            department=dept,
            grade=grade,
            semester_term=1,
            secondary_type=sec_type,
            secondary_department=sec_dept,
            clubs=[],  # 使用者沒提到社團就不參加任何社團
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
            # 確定性控制：學系與年級以使用者明確選擇 (dept_hint / grade_hint) 或基底萃取為準，杜絕輕量 LLM 默認大一的覆蓋
            if dept_hint:
                parsed.department = dept_hint
            elif not parsed.department or parsed.department == "資訊管理學系":
                if dept:
                    parsed.department = dept

            if grade_hint in (1, 2, 3, 4):
                parsed.grade = grade_hint
            elif grade in (1, 2, 3, 4):
                parsed.grade = grade

            if sec_type and not parsed.secondary_type:
                parsed.secondary_type = sec_type
            if sec_dept and not parsed.secondary_department:
                parsed.secondary_department = sec_dept

            # 只保留使用者真的提過的社團，避免小模型憑空補上社團
            parsed.clubs = [c for c in parsed.clubs if club_mentioned(c, user_input)]
            if parsed.club and not club_mentioned(parsed.club, user_input):
                parsed.club = None

            # 啟發式社團關鍵字萃取補強 (當 LLM 未成功萃取使用者輸入時)
            if not parsed.clubs:
                extracted_clubs = []
                for alias_k, target_n in COMMON_CLUB_ALIASES.items():
                    if len(alias_k) >= 2 and alias_k in user_input and target_n not in extracted_clubs:
                        extracted_clubs.append(target_n)
                if "系學會" in user_input or "系會" in user_input:
                    extracted_clubs.append("系學會")
                if extracted_clubs:
                    parsed.clubs = extracted_clubs

            return parsed
        except Exception as e:
            logger.warning(f"Onboarding parse failed, using fallback: {e}")
            return fallback

    def build_weekly_schedule(
        self,
        db: Session | None = None,
        profile: OnboardingParseSchema | None = None,
        home_dorm: tuple[str, str] | None = None,
        notes: list[str] | None = None,
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
        dorm_id, dorm_name = home_dorm or (DEFAULT_HOME_DORM_ID, "學生宿舍")
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

        if notes is not None:
            if total_credits > max_credits:
                notes.append(f"本學期必修共 {total_credits:g} 學分，超過建議上限 {max_credits:g} 學分（必修不刪減）")
            elif total_credits < min_credits:
                notes.append(f"本學期只排得到 {total_credits:g} 學分，低於建議下限 {min_credits:g} 學分")

        # 3. 鋪設週一到週五真實課堂與社團行程 (僅保留課程與社團活動)
        schedule: list[ScheduleSlot] = []

        # 智慧解析並排定社團真實活動時程 (依社團類型排定 1~3 天晚間 18:00~22:00，智慧杜絕衝突)
        course_busy: dict[int, list[tuple[int, int]]] = {}
        for c in enrolled_courses:
            for cd, pers in c["parsed_periods"]:
                c_start, c_end, _ = get_periods_time_range(pers)
                course_busy.setdefault(cd, []).append((time_to_minutes(c_start), time_to_minutes(c_end)))
        club_slots_by_day = self.resolve_club_weekly_schedule(db, profile, busy=course_busy, notes=notes)

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
                            time_label=f"{day_name} {s_time}",
                            periods=pers
                        ))

            # (2) 社團團體活動 (依 AI 研判之天數與時段排定)
            if day in club_slots_by_day:
                day_events.extend(club_slots_by_day[day])

            # 當天行程按開始時間排序
            day_events.sort(key=lambda s: s.start_time or "00:00")

            # (3)(4) 由固定行程（課程、社團）算出空檔，在空檔內放置午餐、晚餐與課餘空閒提示
            fixed = sorted(
                (time_to_minutes(s.start_time or "00:00"), time_to_minutes(s.end_time or "00:00"))
                for s in day_events
            )
            gaps = free_gaps(fixed, DAY_START_MINUTES, DAY_END_MINUTES)
            meal_slots: list[ScheduleSlot] = []

            lunch_win = pick_meal_window(gaps, LUNCH_WINDOW, 12 * 60)
            if lunch_win:
                ls, le = lunch_win
                meal_slots.append(ScheduleSlot(
                    day=day, slot=minutes_to_time(ls), title=f"{minutes_to_time(ls)} 中午時光",
                    type="lunch_prompt", location_id="loc_pine_restaurant", location_name="松果餐廳",
                    start_time=minutes_to_time(ls), end_time=minutes_to_time(le),
                    display_time=f"{minutes_to_time(ls)} ~ {minutes_to_time(le)}",
                    time_label=f"{day_name} {minutes_to_time(ls)}",
                ))
            dinner_win = pick_meal_window(gaps, DINNER_WINDOW, 18 * 60)
            if dinner_win:
                ds, de = dinner_win
                meal_slots.append(ScheduleSlot(
                    day=day, slot=minutes_to_time(ds), title=f"{minutes_to_time(ds)} 晚餐時間",
                    type="dinner_prompt", location_id=dorm_id, location_name=dorm_name,
                    start_time=minutes_to_time(ds), end_time=minutes_to_time(de),
                    display_time=f"{minutes_to_time(ds)} ~ {minutes_to_time(de)}",
                    time_label=f"{day_name} {minutes_to_time(ds)}",
                ))
            day_events.extend(meal_slots)

            # 扣掉餐點提示後，剩下 >= 90 分鐘的空檔各產生一個課餘空閒提示
            taken = sorted((time_to_minutes(m.start_time or "0:00"), time_to_minutes(m.end_time or "0:00")) for m in meal_slots)
            for g_start, g_end in gaps:
                for p_start, p_end in free_gaps(taken, g_start, g_end):
                    if p_end - p_start < LEISURE_MIN_GAP_MINUTES:
                        continue
                    t0, t1 = minutes_to_time(p_start), minutes_to_time(p_end)
                    day_events.append(ScheduleSlot(
                        day=day, slot=t0, title=f"{t0} 課餘空閒時間", type="leisure_prompt",
                        location_id=dorm_id, location_name=dorm_name,
                        start_time=t0, end_time=t1, display_time=f"{t0} ~ {t1}",
                        time_label=f"{day_name} {t0}",
                    ))

            # (5) 每日結束檢查點（週一至週四用於預排明日；週五用於結束這一週）
            end_title = f"{day_name} 夜幕結算 · 結束這一週" if day == 5 else f"{day_name} 夜幕結算 · 明日活動預排"
            day_events.append(ScheduleSlot(
                day=day,
                slot="21:00",
                title=end_title,
                type="day_end",
                location_id=dorm_id,
                location_name=dorm_name,
                start_time="21:00",
                end_time="22:00",
                display_time="21:00",
                time_label=f"{day_name} 21:00"
            ))

            # 嚴格按開始時間排序當日所有行程
            day_events.sort(key=lambda s: s.start_time or "00:00")
            schedule.extend(day_events)

        return schedule

    def evaluate_random_event_trigger(
        self,
        db: Session,
        session: GameSession,
        slot_info: dict[str, Any],
        default_trigger_prob: float
    ) -> RandomEvent | None:
        """
        評估並判定當前時段是否觸發突發事件：
        1. 檢查體力、星期、時段、地點條件
        2. 檢查時間範圍條件 (cond_time_start ~ cond_time_end，如 12:00 ~ 13:30)
        3. 檢查當前活動類型 (cond_activity_type) 與活動名稱關鍵字 (cond_activity_title)
        4. 檢查先前活動/歷史行程條件 (cond_prev_activity，如「體育」)
        5. 檢查先前突發事件前置條件 (cond_prev_event_id)
        6. 依據各事件設定的專屬 trigger_rate 判定是否通過擲骰
        7. 符合且通過擲骰的多個事件依 weight 權重抽出一個
        """
        stamina = session.stats.get("stamina", 80) if session.stats else 80
        turn = session.current_turn
        day_num = slot_info.get("day", 1)
        slot_name = slot_info.get("slot") or "morning"
        start_t = slot_info.get("start_time") or "10:00"
        act_type = str(slot_info.get("type") or "course").lower()
        act_title = str(slot_info.get("title") or "").lower()
        loc_id = slot_info.get("location_id") or ""

        # 收集歷史活動名稱與日誌，供 cond_prev_activity 研判
        past_activities: list[str] = []
        if session.weekly_schedule and isinstance(session.weekly_schedule, list):
            for past_slot in session.weekly_schedule[:turn]:
                if isinstance(past_slot, dict):
                    if past_slot.get("title"):
                        past_activities.append(str(past_slot.get("title")).lower())
                    if past_slot.get("type"):
                        past_activities.append(str(past_slot.get("type")).lower())
        for log in (session.history_logs or []):
            past_activities.append(str(log).lower())

        # 解析當前時段所屬的語意分類集合 (如 morning, afternoon, evening)
        slot_categories = {slot_name.lower()}
        if ":" in start_t:
            try:
                parts = start_t.split(":")
                hour = int(parts[0])
                minute = int(parts[1])
                time_mins = hour * 60 + minute
                if 5 * 60 <= time_mins < 12 * 60:
                    slot_categories.add("morning")
                elif 12 * 60 <= time_mins < 17 * 60:
                    slot_categories.add("afternoon")
                else:
                    slot_categories.add("evening")
            except Exception:
                pass

        s_lower = slot_name.lower()
        if any(k in s_lower for k in ("morning", "breakfast", "alarm", "wake", "早")):
            slot_categories.add("morning")
        if any(k in s_lower for k in ("noon", "lunch", "afternoon", "午")):
            slot_categories.add("afternoon")
        if any(k in s_lower for k in ("night", "dinner", "evening", "dorm", "晚", "宵夜")):
            slot_categories.add("evening")

        candidate_events = db.query(RandomEvent).filter(
            RandomEvent.is_active == True,
            RandomEvent.cond_min_stamina <= stamina,
            RandomEvent.cond_max_stamina >= stamina
        ).all()
        # triggered_evts is kept for cond_prev_event_id chain checks,
        # but no longer permanently excludes events (they can re-trigger each day).

        profile = dict(session.player_profile or {})
        event_history: list[dict[str, Any]] = list(profile.get("event_history") or [])
        if event_history and turn - int(event_history[-1].get("turn", -99)) < EVENT_MIN_GAP_TURNS:
            return None  # 剛發生過突發事件，先喘口氣
        first_start_of_day = min(
            (
                str(p.get("start_time") or "99:99")
                for p in (session.weekly_schedule or [])
                if isinstance(p, dict) and p.get("day") == day_num
                and p.get("type") not in ("day_end", "dorm") and not p.get("is_skipped")
            ),
            default=start_t,
        )

        triggered_candidates: list[RandomEvent] = []
        for ev in candidate_events:
            # 0. 冷卻：同一局最多出現次數、同一天只出現一次
            if (session.triggered_evts or []).count(ev.id) >= MAX_EVENT_OCCURRENCES:
                continue
            if any(h.get("id") == ev.id and h.get("day") == day_num for h in event_history):
                continue
            # 0.1 情境與敘述一致（以事件 id 對應的額外限制）
            if ev.id == "evt_late_wakeup" and not (start_t <= "08:30" and start_t <= first_start_of_day):
                continue
            if ev.id == "evt_squirrel_attack" and start_t >= "11:00":
                continue
            # 1. 星期幾條件
            if ev.cond_days and day_num not in ev.cond_days:
                continue
            # 2. 時段條件 (支援 morning/afternoon/evening 語意判定與具體 slot 鍵名)
            if ev.cond_slots and isinstance(ev.cond_slots, list):
                if not any(str(cs).lower() in slot_categories for cs in ev.cond_slots):
                    continue
            # 3. 特定館舍/地點條件
            if ev.cond_location and ev.cond_location != loc_id:
                continue
            # 4. 特定時間範圍條件 (例如在 OO:XX 時間發生)
            if ev.cond_time_start and start_t < ev.cond_time_start:
                continue
            if ev.cond_time_end and start_t > ev.cond_time_end:
                continue
            # 5. 當前活動類型條件 (course, club, dining, dorm, leisure)
            if ev.cond_activity_type:
                target_type = ev.cond_activity_type.lower()
                matched = False
                if target_type in act_type:
                    matched = True
                elif target_type == "dining" and any(k in act_type for k in ("lunch", "dinner", "dining", "food")):
                    matched = True
                elif target_type == "dorm" and ("dorm" in act_type):
                    matched = True
                elif target_type == "leisure" and any(k in act_type for k in ("leisure", "free", "campus")):
                    matched = True
                elif target_type == "course" and ("course" in act_type):
                    matched = True
                elif target_type == "club" and ("club" in act_type):
                    matched = True
                if not matched:
                    continue
            # 6. 當前活動名稱關鍵字條件 (例如 "微積分", "羽球")
            if ev.cond_activity_title and ev.cond_activity_title.lower() not in act_title:
                continue
            # 7. 先前活動/歷史條件 (例如先發生體育活動、先參加系學會等)
            if ev.cond_prev_activity:
                prev_kw = ev.cond_prev_activity.lower()
                if not any(prev_kw in p for p in past_activities):
                    continue
            # 8. 先前突發事件前置條件 (例如需先觸發特定前置事件)
            if ev.cond_prev_event_id:
                if ev.cond_prev_event_id not in (session.triggered_evts or []):
                    continue

            # 9. 專屬獨立觸發機率判定
            event_prob = ev.trigger_rate if ev.trigger_rate is not None else default_trigger_prob
            if random.random() <= event_prob:
                triggered_candidates.append(ev)

        if triggered_candidates:
            weights = [max(1, e.weight) for e in triggered_candidates]
            chosen = random.choices(triggered_candidates, weights=weights, k=1)[0]
            session.triggered_evts = (session.triggered_evts or []) + [chosen.id]
            profile["event_history"] = event_history + [{"id": chosen.id, "turn": turn, "day": day_num}]
            session.player_profile = profile
            return chosen

        return None

    async def generate_turn_content(
        self,
        db: Session,
        session: GameSession,
        active_model: str,
        trigger_prob: float,
        allow_random_event: bool = True
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
        slot_str = slot_info.get("time_label") or slot_info.get("display_time") or "校園時段"
        when_str = slot_str if slot_str.startswith(day_str) else f"{day_str} {slot_str}"

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

        # 判定突發事件 (支援專屬觸發條件與各別觸發機率)
        chosen_event = None
        if allow_random_event:
            chosen_event = self.evaluate_random_event_trigger(
                db=db,
                session=session,
                slot_info=slot_info,
                default_trigger_prob=trigger_prob
            )

        start_t = slot_info.get("start_time") or "10:00"
        is_night_time = (slot_info.get("type") == "day_end") or (start_t >= "21:00" or start_t < "05:00")
        is_cutoff_reached = start_t == "05:00" or (start_t > "04:30" and start_t < "06:00")

        if chosen_event:
            event_instruction = f"【突發狀況事件：{chosen_event.title}】\n{chosen_event.event_prompt}"
            preset_options: list[dict[str, Any]] = list(chosen_event.preset_options or [])
        elif slot_info.get("type") == "lunch_prompt":
            event_instruction = "中午 12:00 到了，此時段沒有任何排定課程或活動。肚子漸漸餓了，系統詢問你是否要吃午餐？"
            preset_options = [
                {
                    "option_key": "A",
                    "intent_hint": "是，我想吃午餐（挑選想去的餐廳美食）",
                    "effects": {"stamina": 0, "study": 0, "social": 0, "money": 0},
                    "action_type": "open_lunch_menu"
                },
                {
                    "option_key": "B",
                    "intent_hint": "否，暫不吃午餐（留在教室小憩或自習，準備後續行程）",
                    "effects": {"stamina": 5, "study": 10, "social": -5, "money": 0},
                    "action_type": "skip"
                }
            ]
        elif slot_info.get("type") == "dinner_prompt":
            event_instruction = f"晚餐時間到了（{start_t}），肚子餓了嗎？可以去餐廳坐下來吃，或在下一個行程前外帶。"
            preset_options = [
                {
                    "option_key": "A",
                    "intent_hint": "是，我想吃晚餐（挑選想去的餐廳美食）",
                    "effects": {"stamina": 0, "study": 0, "social": 0, "money": 0},
                    "action_type": "open_dinner_menu"
                },
                {
                    "option_key": "B",
                    "intent_hint": "否，先不吃晚餐（繼續準備後續行程）",
                    "effects": {"stamina": -5, "study": 5, "social": 0, "money": 0},
                    "action_type": "skip"
                }
            ]
        elif slot_info.get("type") == "leisure_prompt":
            event_instruction = f"下課或午後空閒時間到了（{start_t}），目前沒有任何課程或活動安排。系統詢問你是否要回宿舍休息，或者前往校園休閒設施？"
            preset_options = [
                {
                    "option_key": "A",
                    "intent_hint": "回宿舍放鬆（宿舍休閒活動，可選1~3小時補眠、打手遊、洗衣追劇）",
                    "effects": {"stamina": 0, "study": 0, "social": 0, "money": 0},
                    "action_type": "open_dorm_menu"
                },
                {
                    "option_key": "B",
                    "intent_hint": "進行校園休閒活動（前往依仁堂健身房、總圖/K書中心自習、百花川散步）",
                    "effects": {"stamina": 0, "study": 0, "social": 0, "money": 0},
                    "action_type": "open_campus_menu"
                },
                {
                    "option_key": "C",
                    "intent_hint": "自由漫步 / 準備下一行程（略過休閒活動）",
                    "effects": {"stamina": 5, "study": 5, "social": 0, "money": 0},
                    "action_type": "skip"
                }
            ]
        elif slot_info.get("type") == "day_end" or is_night_time:
            day_num = slot_info.get("day", 1)
            next_day_str = DAY_NAMES[day_num] if day_num < len(DAY_NAMES) else "週末"
            if is_cutoff_reached:
                event_instruction = f"晨曦微露，已達清晨 05:00 每日換日線！不可再繼續熬夜，請立即就寢入眠並設定鬧鐘進入【{next_day_str}】。"
                preset_options = [
                    {
                        "option_key": "A",
                        "intent_hint": f"🛏️ 去睡覺（設定隔日鬧鐘並預排{next_day_str}行程）",
                        "effects": {"stamina": 10, "study": 0, "social": 0, "money": 0},
                        "action_type": "go_to_sleep"
                    }
                ]
            elif day_num >= len(DAY_NAMES):
                event_instruction = f"週五夜幕低垂（{start_t}），這一週的校園生活就要告一段落了。你可以回宿舍結束這一週，或再進行最後的夜間活動。"
                preset_options = [
                    {
                        "option_key": "A",
                        "intent_hint": "🎓 結束這一週（回宿舍，迎接週末）",
                        "effects": {"stamina": 0, "study": 0, "social": 0, "money": 0},
                        "action_type": "end_week"
                    },
                    {
                        "option_key": "B",
                        "intent_hint": "🌙 進行活動（宿舍休閒或校園活動）",
                        "effects": {"stamina": -5, "study": 0, "social": 5, "money": 0},
                        "action_type": "open_night_activity"
                    }
                ]
            else:
                event_instruction = f"夜幕低垂（{start_t}），中大校園夜色已深。你可以準備就寢（設定明日鬧鐘並預排{next_day_str}行程），或是繼續進行宿舍休閒或校園夜間活動。"
                preset_options = [
                    {
                        "option_key": "A",
                        "intent_hint": f"🛏️ 去睡覺（設定隔日鬧鐘並預排{next_day_str}行程）",
                        "effects": {"stamina": 10, "study": 0, "social": 0, "money": 0},
                        "action_type": "go_to_sleep"
                    },
                    {
                        "option_key": "B",
                        "intent_hint": "🌙 進行活動（宿舍休閒或校園活動）",
                        "effects": {"stamina": -5, "study": 0, "social": 5, "money": 0},
                        "action_type": "open_night_activity"
                    }
                ]
        elif str(slot_info.get("slot") or "").startswith("alarm_"):
            # 起床回合只有敘事差異，不給數值獎勵（睡眠回復已在就寢時結算）
            event_instruction = f"鬧鐘在 {start_t} 響起，新的一天開始了。你要怎麼展開這個早晨？"
            preset_options = [
                {"option_key": "A", "intent_hint": "起身梳洗，從容整理書包準備出門",
                 "effects": {"stamina": 0, "study": 0, "social": 0, "money": 0}},
                {"option_key": "B", "intent_hint": "賴在被窩滑一下手機，再慢慢起床",
                 "effects": {"stamina": 0, "study": 0, "social": 0, "money": 0}},
                {"option_key": "C", "intent_hint": "和室友聊幾句，一起結伴出門",
                 "effects": {"stamina": 0, "study": 0, "social": 0, "money": 0}},
            ]
        elif slot_info.get("type") == "club":
            event_instruction = f"社團活動時段：你在 {loc_name} 參與【{slot_info.get('title')}】。請描述你沉浸於社團練習、交流或例會討論的熱血情境。"
            preset_options = [
                {
                    "option_key": "A",
                    "intent_hint": "全神貫注投入練習與團員切磋交流，精進社團專業技能",
                    "effects": {"stamina": -12, "study": 0, "social": 12, "money": 0}
                },
                {
                    "option_key": "B",
                    "intent_hint": "主動與幹部討論後續活動規劃與年度成發構想，展現責任與領導力",
                    "effects": {"stamina": -8, "study": 0, "social": 15, "money": -50}
                },
                {
                    "option_key": "C",
                    "intent_hint": "社課結束後與社團夥伴揪團直奔宵夜街吃炭烤鹹酥雞暢聊大學生活",
                    "effects": {"stamina": 5, "study": 0, "social": 18, "money": -120}
                }
            ]
        else:
            # 檢查是否有對應的校園動態活動 (早餐、午餐、晚餐、宿舍休閒、校園休閒)
            slot_type = slot_info.get("type", "course")
            start_t = slot_info.get("start_time") or "10:00"

            target_cat = None
            if slot_type == "lunch":
                target_cat = "lunch"
            elif slot_type == "dinner":
                target_cat = "dinner"
            elif slot_type == "breakfast":
                target_cat = "breakfast"
            elif slot_type == "dorm":
                target_cat = "dorm_leisure"
            elif slot_type == "campus_leisure":
                target_cat = "campus_leisure"

            matched_act = None
            if target_cat:
                matched_act = db.query(CampusActivity).filter(
                    CampusActivity.category == target_cat,
                    CampusActivity.is_active == True
                ).first()

            if matched_act:
                event_instruction = f"【校園動態活動：{matched_act.title}】\n{matched_act.event_prompt}"
                preset_options = matched_act.preset_options
            else:
                hint_a, hint_b, hint_c = COURSE_OPTION_VARIANTS[turn % len(COURSE_OPTION_VARIANTS)]
                event_instruction = f"常規校園作息：你在 {loc_name} 進行【{slot_info.get('title', '活動')}】。請描述你沉浸在此時段的心情與學習/活動情境。"
                preset_options = [
                    {
                        "option_key": "A",
                        "intent_hint": hint_a,
                        "effects": {"stamina": -10, "study": 12, "social": 5, "money": 0}
                    },
                    {
                        "option_key": "B",
                        "intent_hint": hint_b,
                        "effects": {"stamina": 10, "study": 0, "social": 0, "money": 0}
                    },
                    {
                        "option_key": "C",
                        "intent_hint": hint_c,
                        "effects": {"stamina": -5, "study": 0, "social": 12, "money": -60}
                    }
                ]

        # Special handling for interactive prompt checkpoints: return crisp predefined narrative & options immediately
        if (slot_info.get("type") in ("lunch_prompt", "dinner_prompt", "leisure_prompt", "day_end") or is_night_time) and not chosen_event:
            story = TurnGenerationSchema(
                narrative=f"【{when_str}】{event_instruction}",
                options=[
                    OptionItem(
                        option_key=opt.get("option_key", chr(65 + i)),
                        display_text=opt.get("intent_hint", "")[:38]
                    )
                    for i, opt in enumerate(preset_options)
                ]
            )
            effects_map = {opt["option_key"]: opt["effects"] for opt in preset_options}
            return story, effects_map, loc_id, loc_name

        # 備援內容
        fallback_options = [
            OptionItem(
                option_key=opt.get("option_key", chr(65 + i)),
                display_text=opt.get("intent_hint", "")[:24]
            )
            for i, opt in enumerate(preset_options)
        ]
        if chosen_event:
            fallback_narrative = f"【突發狀況：{chosen_event.title}】{chosen_event.event_prompt}"
        else:
            fallback_narrative = f"【{when_str}】" + fallback_scene(slot_info, loc_name, turn)
        fallback_story = TurnGenerationSchema(
            narrative=fallback_narrative,
            options=fallback_options,
            is_random_event=bool(chosen_event),
            event_id=chosen_event.id if chosen_event else None,
            event_title=chosen_event.title if chosen_event else None
        )

        recent_hist = "、".join(session.history_logs[-2:]) if session.history_logs else "剛踏入中央大學展開第一週校園生活"
        opt_a_hint = preset_options[0]["intent_hint"] if len(preset_options) > 0 else "專注投入"
        opt_b_hint = preset_options[1]["intent_hint"] if len(preset_options) > 1 else "稍作休息"
        opt_c_hint = preset_options[2]["intent_hint"] if len(preset_options) > 2 else "自由活動"

        prompt = TURN_NARRATIVE_PROMPT_TEMPLATE.format(
            day_name=day_str,
            slot_name=slot_str,
            location_name=loc_name,
            location_short_desc=loc_desc,
            schedule_title=slot_info.get("title", "自習時間"),
            life_snippet=life_snippet,
            recent_history=recent_hist,
            event_instruction=event_instruction,
            opt_a_hint=opt_a_hint,
            opt_b_hint=opt_b_hint,
            opt_c_hint=opt_c_hint,
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

        if chosen_event:
            story.is_random_event = True
            story.event_id = chosen_event.id
            story.event_title = chosen_event.title

        effects_map = {opt["option_key"]: opt.get("effects", {}) for opt in preset_options}
        return story, effects_map, loc_id, loc_name

    def apply_choice_effects(
        self,
        session: GameSession,
        effects_map: dict[str, dict[str, int]],
        choice_key: str
    ) -> dict[str, int]:
        """套用選項效果（數值限制在 0~100，金錢不低於 0），回傳「實際生效」的變化量。"""
        eff = effects_map.get(choice_key, {"stamina": 0, "study": 0, "social": 0, "money": 0})
        before = dict(session.stats)
        stats = dict(session.stats)

        stats["stamina"] = max(0, min(100, stats.get("stamina", 80) + eff.get("stamina", 0)))
        stats["study"] = max(0, min(100, stats.get("study", 50) + eff.get("study", 0)))
        stats["social"] = max(0, min(100, stats.get("social", 50) + eff.get("social", 0)))
        stats["money"] = max(0, stats.get("money", 1500) + eff.get("money", 0))

        session.stats = stats
        defaults = {"stamina": 80, "study": 50, "social": 50, "money": 1500}
        return {k: stats[k] - before.get(k, defaults[k]) for k in defaults}

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
        fainted = (session.player_profile or {}).get("ending") == ENDING_FAINT
        title = pick_title(session)

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
            f"體力見底的你在校園裡當場昏倒，被同學送到保健室，這一週只好提前結束。"
            f"最終體力 {stamina}、學業 {study}、社交 {social}，獲得「{title}」稱號。下次記得多休息！"
            if fainted else
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
