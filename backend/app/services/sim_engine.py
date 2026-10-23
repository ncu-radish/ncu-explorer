import logging
import random
from typing import Any

from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.llm_client import call_ollama_structured
from app.models.tables import (
    CampusLifeInfo,
    CampusLocation,
    ClubAndActivity,
    Course,
    GameSession,
    RandomEvent,
)
from app.schemas.llm import (
    OnboardingParseSchema,
    OptionItem,
    TurnGenerationSchema,
)
from app.schemas.sim import ScheduleSlot
from app.services.prompts import (
    ONBOARDING_PROMPT_TEMPLATE,
    TURN_NARRATIVE_PROMPT_TEMPLATE,
    WEEK_SUMMARY_PROMPT_TEMPLATE,
)
from app.services.rag_service import course_rag_service

logger = logging.getLogger(__name__)

DAY_NAMES = ["週一", "週二", "週三", "週四", "週五", "週六", "週日"]
SLOT_NAMES = {"morning": "上午 (早八/早十)", "afternoon": "下午 (午後)", "evening": "晚間 (社課/夜間)"}

class SimEngine:
    async def parse_onboarding(self, user_input: str, model_name: str) -> OnboardingParseSchema:
        prompt = ONBOARDING_PROMPT_TEMPLATE.format(user_input=user_input)
        fallback = OnboardingParseSchema(
            department="資訊管理學系",
            grade=1,
            semester_term=1,
            clubs=["熱舞社", "資管系學會"],
            interest_query="人工智慧"
        )
        try:
            return await call_ollama_structured(
                user_prompt=prompt,
                response_schema=OnboardingParseSchema,
                model_name=model_name,
                fallback_instance=fallback,
                timeout=25.0
            )
        except Exception as e:
            logger.warning(f"Onboarding parse failed, using fallback: {e}")
            return fallback

    def build_weekly_schedule(
        self,
        db: Session,
        profile: OnboardingParseSchema
    ) -> list[ScheduleSlot]:
        """
        排定週一至週日共 21 個時段 (7天 x 3時段)
        1. 撈出所屬系所大一上必修課排入對應時段
        2. 撈出所選社團排入對應 evening 時段
        3. 若有興趣 query，以 FastEmbed 混合檢索不衝堂課程填入
        4. 其餘時段標記為「校園自由時間」
        """
        schedule: list[ScheduleSlot] = []

        # 預先填滿 21 個空時段
        slot_keys = ["morning", "afternoon", "evening"]
        for day in range(1, 8):
            for slot in slot_keys:
                schedule.append(ScheduleSlot(
                    day=day,
                    slot=slot,
                    title="自由探索時間",
                    type="free",
                    location_id="loc_park_creek" if day <= 5 else "loc_night_street",
                    location_name="百花川步道" if day <= 5 else "中大宵夜街"
                ))

        # 1. 排入必修課
        req_courses = db.query(Course).filter(
            Course.department == profile.department,
            Course.grade == profile.grade,
            Course.semester_term == profile.semester_term,
            Course.category == "required"
        ).all()

        for c in req_courses:
            day_idx = c.day_of_week - 1
            if 0 <= day_idx < 7:
                slot_idx = slot_keys.index(c.period_slot) if c.period_slot in slot_keys else 0
                target_idx = day_idx * 3 + slot_idx
                if 0 <= target_idx < 21:
                    schedule[target_idx] = ScheduleSlot(
                        day=c.day_of_week,
                        slot=c.period_slot,
                        title=f"{c.course_name} (必修)",
                        type="course",
                        course_id=c.id,
                        location_id=c.location_id,
                        location_name=c.location.name if c.location else "教學大樓"
                    )

        # 2. 排入社團
        for club_name in profile.clubs:
            club = db.query(ClubAndActivity).filter(
                ClubAndActivity.name.ilike(f"%{club_name.strip()}%")
            ).first()
            if club:
                day_idx = club.day_of_week - 1
                slot_idx = slot_keys.index(club.period_slot) if club.period_slot in slot_keys else 2
                target_idx = day_idx * 3 + slot_idx
                if 0 <= target_idx < 21 and schedule[target_idx].type == "free":
                    schedule[target_idx] = ScheduleSlot(
                        day=club.day_of_week,
                        slot=club.period_slot,
                        title=f"{club.name} (社團活動)",
                        type="club",
                        club_id=club.id,
                        location_id=club.location_id,
                        location_name=club.location.name if club.location else "活動中心"
                    )

        # 3. FastEmbed 檢索興趣選修課排入空堂
        if profile.interest_query:
            matched_courses = course_rag_service.hybrid_search_courses(
                query=profile.interest_query,
                limit=3
            )
            for mc in matched_courses:
                day_idx = mc["day_of_week"] - 1
                slot = mc["period_slot"]
                if 0 <= day_idx < 7 and slot in slot_keys:
                    slot_idx = slot_keys.index(slot)
                    target_idx = day_idx * 3 + slot_idx
                    if 0 <= target_idx < 21 and schedule[target_idx].type == "free":
                        loc = db.query(CampusLocation).filter(CampusLocation.id == mc.get("location_id")).first()
                        schedule[target_idx] = ScheduleSlot(
                            day=mc["day_of_week"],
                            slot=slot,
                            title=f"{mc['course_name']} (選修)",
                            type="course",
                            course_id=mc["course_id"],
                            location_id=mc.get("location_id"),
                            location_name=loc.name if loc else "綜合館舍"
                        )
                        break

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
        slot_name = slot_info.get("slot", "morning")
        day_str = DAY_NAMES[(day_num - 1) % 7]
        slot_str = SLOT_NAMES.get(slot_name, "上午")

        loc_id = slot_info.get("location_id") or "loc_park_creek"
        loc = db.query(CampusLocation).filter(CampusLocation.id == loc_id).first()
        loc_name = loc.name if loc else "中大校園"
        loc_desc = loc.short_desc if loc else "綠意盎然的中央大學校園"

        # 撈取該館舍生活背景碎片
        life_info = db.query(CampusLifeInfo).filter(CampusLifeInfo.location_id == loc_id).first()
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
