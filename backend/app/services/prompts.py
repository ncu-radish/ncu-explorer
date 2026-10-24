# 集中管理所有繁體中文 Prompt 模板

ONBOARDING_PROMPT_TEMPLATE = """
請分析以下使用者的入學設定與志向需求，並依照 JSON 格式解析出目標系所、年級、學期、雙主修或輔系目標（若有提及）、想參加的社團活動，以及想修習的課程興趣關鍵字：

使用者輸入：「{user_input}」

【規範】：
- 就讀系所請對應中大常見學系中文名稱（例如：資訊管理學系、資訊工程學系等）。
- 年級（grade）請輸出數字 1、2、3 或 4（例：大一填 1，大二填 2，大三填 3，大四填 4）。若未提及年級，預設為大一（1）。學期（semester_term）預設為上學期（1）。
- 若使用者提及「雙主修」或「雙修」某系（例如：雙主修資工、雙修電機），請將 secondary_type 設為 "雙主修"，secondary_department 設為該目標系所全名（如：資訊工程學系）。
- 若使用者提及「輔系」或「輔修」某系（例如：輔系財金、輔修企管），請將 secondary_type 設為 "輔系"，secondary_department 設為該目標系所全名（如：財務金融學系）。
- 若未提及雙主修或輔系，secondary_type 與 secondary_department 設為 null。
- 社團清單請萃取其中想參加的社團名稱。
- interest_query 請濃縮為 2~10 字的修課興趣關鍵字（例如：人工智慧、前端開發、投資理財）。
"""


TURN_NARRATIVE_PROMPT_TEMPLATE = """
【校園時段與地點背景】：
- 當前進度：{day_name} {slot_name}
- 當前場域：{location_name}（{location_short_desc}）
- 行程性質：{schedule_title}
- 附近生活機能參考：{life_snippet}
- 前情提要：{recent_history}

【情境指令】：
{event_instruction}

【選項意圖提示（請依此潤飾為生動的大學生行動語句，限25字內）】：
- 選項 A：{opt_a_hint}
- 選項 B：{opt_b_hint}
- 選項 C：{opt_c_hint}

請以第二人稱（你）撰寫一段 100~150 字的生動情境故事，自然融入當前館舍氛圍與狀況，並回傳 A、B、C 三個行動選項。
"""

WEEK_SUMMARY_PROMPT_TEMPLATE = """
你是一位資深中大學長姐，請根據這位大一新鮮人在中大一週的生活紀錄，為他寫一篇約 150 字的「一週校園生活總結週記」：

【玩家最終數值】：
體力：{stamina}/100，學業表現：{study}/100，社交活躍度：{social}/100，剩餘生活費：{money} 元。
【榮獲稱號】：{title}
【重要經歷日誌】：
{history_summary}

請用幽默、溫暖且充滿中大特色的語氣進行總結，肯定他的新鮮人嘗試，並鼓勵他繼續探索真實校園。
"""

COURSE_RECOMMEND_PROMPT_TEMPLATE = """
你是一位熟稔中央大學選課秘訣的學長姐選課顧問。使用者提出了以下找課需求：
使用者需求：「{user_query}」

系統為他從課綱資料庫中檢索出以下 Top 相關課程：
{retrieved_courses_summary}

請以熱情親切、實用的口吻寫一段約 150 字的選課推薦導讀，說明這些課程如何契合他的興趣與學習目標，並給予修課建議。
"""

COURSE_COMPARE_PROMPT_TEMPLATE = """
請客觀、深入地比較以下幾門中央大學的課程：
{courses_text}

請針對以下四個維度輸出結構化分析：
1. 核心教學目標與技術範疇差異
2. 理論深度與實作/專案比重評估
3. 先修門檻與修課學習難度評估
4. 適合什麼樣背景、志向或升學就業方向的學生選修
"""

DEPT_COMPARE_PROMPT_TEMPLATE = """
請客觀比較中央大學以下兩大學系的定位與修課脈絡：
系所一：{dept_a_name}
必修與核心課程概況：{dept_a_courses}

系所二：{dept_b_name}
必修與核心課程概況：{dept_b_courses}

請針對以下維度進行結構化對比：
1. 兩系的教育定位與思維差異（例如管院資管著重管理與資訊科技整合 vs. 工學院資工著重底層系統與演算法實作）
2. 大一至大四四年課程重心演進
3. 畢業出路與職涯航道
4. 適合具備何種特質與興趣的學生
"""

ROADMAP_SUMMARY_PROMPT_TEMPLATE = """
以下為中央大學「{dept_name}」大一至大四的必修與選修修課結構：
{courses_by_year_text}

請以專業學術顧問角度，輸出：
1. 四年完整能力養成脈絡的精闢總覽（約 150 字）
2. 各年級（大一至大四）的學習重心與代表性課程關鍵特色摘要
"""
