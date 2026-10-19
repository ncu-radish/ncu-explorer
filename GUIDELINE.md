# 專案系統規格書：NCU Life Simulator & Explorer

**（國立中央大學智慧校園生活模擬與 AI 課程探索平台）**

## 1. 專案概述與核心設計原則

### 1.1 系統目標

本平台專為尚未入學的高中生與大一新生設計，結合「**AI 一週校園生活模擬遊戲**」與「**智慧課程與校園百科探索中心**」雙核心模組。使用者可透過自然語言輸入志向與興趣，動態體驗在中央大學的一週生活（含真實課表、社團活動與隨機突發事件），並能隨時切換至「混合式 RAG 課程查詢系統」與「Three.js 純色 3D 互動校園地圖」，全方位探索中大的學術與生活環境。

### 1.2 核心設計原則

1. **校園資安與模型合規（Security & Compliance）**：嚴格遵守校園資安規範，底層 LLM 與 Embedding 模型全面採用**美國（Google、Meta、Microsoft）**、歐洲（Qdrant）**或**台灣本土（聯發科 MediaTek、國科會 TAIDE）研發之開源權重，完全排除任何中國企業背景之模型。
2. **確定性邏輯控制（Deterministic Control）**：針對 4B～8B 本地端輕量模型，所有數值加減、時段推進、課表排程與突發事件機率判定，100% 由後端 Python 狀態機控制；本地 LLM 僅負責「自然語言意圖解析」與「情境文本潤飾」，並透過 JSON Schema 強制約束輸出格式，杜絕模型幻覺與格式崩潰。
3. **雙路混合檢索（Hybrid Search for Chinese）**：針對全中文的課程大綱與校園資訊，採用 **FastEmbed** 同時建立「稠密語意向量（Dense Vector）」與「BM25 稀疏關鍵字向量（Sparse Vector）」，兼顧自然語言模糊探索與中文專有名詞的精準匹配。
4. **單一真實資料源（Single Source of Truth）**：模擬遊戲中觸發的課程、館舍、餐廳、社團，與公開瀏覽頁面的百科資料庫、3D 地圖共用同一套底層資料庫，並透過後台管理系統（Admin CMS）統一維護。

---

## 2. 系統技術架構（Tech Stack）

| 架構層級 | 選用技術 / 框架 | 規格與型號建議 | 用途說明與合規性 |
| --- | --- | --- | --- |
| **前端框架** | **Next.js (App Router)** | v14 / v15 (TypeScript) | 負責前台三大模組（模擬遊戲、課程中心、3D 百科）與後台管理系統（CMS）之介面渲染與路由。 |
| **UI 與樣式** | **Tailwind CSS + shadcn/ui** | Tailwind v3.4+ | 建構遊戲對話視窗、動態課表、課程比較雙欄表與後台 Data Table。 |
| **前端狀態管理** | **Zustand** | v4+ | 管理模擬遊戲當前回合狀態、玩家四維數值、已造訪地點與 3D 鏡頭聚焦目標。 |
| **3D 渲染引擎** | **Three.js + React Three Fiber (R3F) + Drei** | Three.js r160+ | 載入 Blender 匯出之 `.glb` 中大校園白模，實現純色幾何渲染、射線點擊（Raycasting）與鏡頭平滑飛行（Camera Lerp）。 |
| **後端框架** | **FastAPI (Python)** | Python 3.11+ / FastAPI 0.110+ | 提供 RESTful API、SSE 文字串流、遊戲狀態機控制、RAG 檢索路由與後台 CRUD API。 |
| **ORM 與驗證** | **SQLAlchemy 2.0 + Pydantic v2** | SQLAlchemy 2.0+ | 資料庫 ORM 操作，並利用 Pydantic 產生 JSON Schema 強制綁定本地 LLM 輸出。 |
| **關聯式資料庫** | **SQLite** (開發/展示) 或 **PostgreSQL** | SQLite 3.40+ | 儲存結構化歷年課程表、社團、館舍節點、飲食交通、突發事件池、玩家紀錄與管理員帳號。 |
| **向量資料庫** | **Qdrant (Local Persistence Mode)** | `qdrant-client` (德國開源) | 本地持久化向量庫，原生支援 Dense + Sparse 雙向量與 RRF（Reciprocal Rank Fusion）混合排序。 |
| **高速向量化引擎** | **FastEmbed** (`qdrant/fastembed`) | ONNX Runtime 加速 | 無須龐大 PyTorch 依賴即可於 CPU/GPU 極速執行向量化，不與 Ollama 搶奪顯示卡記憶體（VRAM）。 |
| **繁中 Embedding** | **intfloat/multilingual-e5-small** + **Qdrant/bm25** | **美國 Microsoft Research** (384維) | 微軟研發之多語言模型，對台灣繁體中文語意捕捉極準；搭配 BM25 稀疏向量確保中文課名精準命中。 |
| **本地 AI 推論** | **Ollama** | v0.5+ | 本地模型部署與 API 服務，支援 `format` 參數強制輸出結構化 JSON。 |
| **本地語言模型 (4B~8B 合規選型)** | 1. **Gemma-3-4B-It** / **Gemma-2-9B-It**<br>

<br>2. **Llama-3.1-8B-Instruct**<br>

<br>3. **Llama-3.1-TAIDE-LX-8B-Chat** / **Breeze-7B** | **美國 Google**<br>

<br>**美國 Meta**<br>

<br>**台灣國科會 / 聯發科** | 依硬體配置於後台動態切換：Gemma-3-4B 極速輕量適合遊戲回合生成；TAIDE / Breeze 具備純正台灣繁中語感；Llama / Gemma-2 適合課程深度比較。 |

---

## 3. 系統全域架構與使用者流程（User Flow）

```text
                     [ 進入網站首頁 (Landing Page) ]
                                   │
                 ┌─────────────────┴─────────────────┐
                 ▼                                   ▼
      【路徑 A：開始校園生活模擬】           【路徑 B：直接瀏覽校園與課程】
                 │                                   │
     1. 玩家輸入自然語言設定                         ├── 模組 1：AI 課程探索中心
        (例：資管系大一、參加熱舞社)                 │    ├─ 一般 SQL 選課條件搜尋
                 │                                   │    ├─ AI 自然語言找課 (FastEmbed RAG)
     2. LLM 解析意圖 ➔ 產生專屬一週課表              │    ├─ 系所四年必選修課程地圖
        (SQL 撈必修 + Vector DB 撈興趣選修)          │    └─ 課程 vs. 課程 / 系所 vs. 系所比較
                 │                                   │
     3. 進入一週回合制循環 (週一早 ~ 週日晚，共21回合)├── 模組 2：校園生活百科
        ├─ 後端依時段讀取「固定課程/社團/自由時間」  │    ├─ 社團與系學會圖鑑
        ├─ 條件過濾並依權重隨機抽取「預設突發事件」  │    ├─ 宿舍生活指南
        ├─ 撈取該館舍之「飲食/交通/環境背景碎片」    │    └─ 飲食(後門/宵夜街/學餐)與交通指南
        ├─ 本地 4B~8B 模型生成「情境 + 3個選項文字」 │
        └─ 玩家點擊選項 ➔ Python 更新數值 ➔ 下一時段 └── 模組 3：純色 3D 互動式校園地圖
                 │                                             ▲
     4. 模擬結束：產出「新鮮人一週結算報告與稱號」             │
                 │                                             │
                 ├──► [ 再玩一次 (重置 Session) ]              │
                 └──► [ 探索剛才經歷的真實中大課程與3D館舍 ] ──┘

```

---

## 4. 資料庫結構設計（Database Schema）

### 4.1 關聯式資料庫（RDBMS Tables）

#### 表 1：`campus_locations`（校園建築與 3D 地圖節點表）

| 欄位名稱 | 型別 | 鍵值/約束 | 說明 |
| --- | --- | --- | --- |
| `id` | VARCHAR(50) | PK | 場域唯一代碼（例：`loc_mgt2`, `loc_boy9`, `loc_backgate`, `loc_yiren`） |
| `name` | VARCHAR(100) | NOT NULL | 中文名稱（例：管理二館、男九舍、後門宵夜街、依仁堂） |
| `category` | VARCHAR(30) | INDEX | 類別：`academic`(教學), `dorm`(宿舍), `dining`(餐飲), `leisure`(休閒), `transport`(交通) |
| `three_mesh_name` | VARCHAR(100) | UNIQUE, NULLABLE | 對應 `.glb` 3D 模型內的 Mesh 物件名稱（供射線點擊高亮與定位使用） |
| `camera_pos` | JSON | NULLABLE | 3D 鏡頭聚焦座標與視角 `{"pos": [12.5, 30.0, -15.2], "target": [0, 0, 0]}` |
| `short_desc` | VARCHAR(255) | NOT NULL | 簡短環境特色描述（供塞入模擬遊戲 Prompt 做 Grounding，控制於 50 字內） |
| `full_content` | TEXT | NOT NULL | 詳細百科介紹（供前台資訊頁與 3D 側邊欄閱讀，支援 Markdown） |
| `image_url` | VARCHAR(255) | NULLABLE | 館舍實景照片路徑 |

#### 表 2：`courses`（歷年課程結構化主表）

| 欄位名稱 | 型別 | 鍵值/約束 | 說明 |
| --- | --- | --- | --- |
| `id` | VARCHAR(50) | PK | 學期+課號+班別（例：`1141_IM1001_A`） |
| `semester` | VARCHAR(10) | INDEX | 學期代碼（例：`114-1`） |
| `department` | VARCHAR(50) | INDEX | 開課系所（例：`資訊管理學系`、`資訊工程學系`、`通識教育中心`） |
| `grade` | INT | INDEX | 適合年級（`1`, `2`, `3`, `4`，`0` 代表不限年級） |
| `semester_term` | INT | INDEX | 上或下學期（`1` 代表上學期，`2` 代表下學期，供系所課程地圖排列使用） |
| `course_name` | VARCHAR(100) | INDEX | 課程名稱（例：`企業資料通訊`、`微積分`） |
| `instructor` | VARCHAR(50) | NOT NULL | 授課教師 |
| `category` | VARCHAR(20) | INDEX | 必選修類別：`required`(必修), `elective`(選修), `general`(通識) |
| `credits` | INT | NOT NULL | 學分數 |
| `day_of_week` | INT | INDEX | 主要上課星期（`1`~`5`） |
| `period_slot` | VARCHAR(20) | INDEX | 對應模擬遊戲之簡化時段：`morning`(早), `afternoon`(午), `evening`(晚) |
| `raw_schedule` | VARCHAR(50) | NOT NULL | 原始節次字串（例：`二234`，供課程查詢頁面精確顯示） |
| `location_id` | VARCHAR(50) | FK | 關聯 `campus_locations.id`（上課館舍） |
| `syllabus_summary` | TEXT | NOT NULL | 課程目標與濃縮大綱（供模擬遊戲及課程比較 Prompt 使用，150 字內） |
| `full_syllabus` | TEXT | NULLABLE | 完整教學大綱、評分標準與每週進度 |
| `is_synced_vec` | BOOLEAN | DEFAULT FALSE | 是否已透過 FastEmbed 同步寫入 Qdrant 向量資料庫 |

#### 表 3：`clubs_and_activities`（社團、系學會與校內打工表）

| 欄位名稱 | 型別 | 鍵值/約束 | 說明 |
| --- | --- | --- | --- |
| `id` | VARCHAR(50) | PK | 活動代碼（例：`club_hotdance`, `org_im_sa`, `job_library`） |
| `name` | VARCHAR(100) | NOT NULL | 名稱（例：熱舞社、資管系學會、圖書館服務學習工讀） |
| `type` | VARCHAR(30) | INDEX | 類型：`academic_club`(學術), `recreation_club`(康樂), `student_org`(系學會/自治), `part_time`(打工) |
| `day_of_week` | INT | NOT NULL | 常態活動星期（`1`~`7`） |
| `period_slot` | VARCHAR(20) | NOT NULL | 常態活動時段：`morning`, `afternoon`, `evening` |
| `location_id` | VARCHAR(50) | FK | 關聯 `campus_locations.id`（例：依仁堂、管理二館） |
| `prompt_context` | TEXT | NOT NULL | 供 AI 生成社課劇情之背景描述（例：「在依仁堂落地窗前練習排舞，學長姐氣氛熱絡...」） |
| `full_intro` | TEXT | NOT NULL | 供校園百科頁面展示之完整介紹（含社課時間、招新資訊） |

#### 表 4：`campus_life_info`（飲食、宿舍細節與交通百科表）

| 欄位名稱 | 型別 | 鍵值/約束 | 說明 |
| --- | --- | --- | --- |
| `id` | INTEGER | PK, AUTO_INC | 自動遞增 ID |
| `info_type` | VARCHAR(30) | INDEX | 類別：`food`(飲食), `dorm_detail`(宿舍生活), `transport`(交通指南) |
| `title` | VARCHAR(100) | NOT NULL | 標題（例：後門早餐一條街、松果餐廳、YouBike 2.0 租借攻略、男九舍環境介紹） |
| `location_id` | VARCHAR(50) | FK, NULLABLE | 關聯 `campus_locations.id` |
| `tags` | JSON | NOT NULL | 標籤陣列（例：`["早餐", "平價", "後門"]`） |
| `game_snippet` | VARCHAR(255) | NOT NULL | 供遊戲回合抽籤塞入 Prompt 的一句話背景知識（50 字內） |
| `content_md` | TEXT | NOT NULL | 供百科資訊頁展示之完整 Markdown 圖文內容 |

#### 表 5：`random_events`（模擬遊戲突發事件池——管理端核心控制表）

| 欄位名稱 | 型別 | 鍵值/約束 | 說明 |
| --- | --- | --- | --- |
| `id` | VARCHAR(50) | PK | 事件代碼（例：`evt_squirrel_attack`, `evt_rain_ubike`, `evt_night_market`） |
| `title` | VARCHAR(100) | NOT NULL | 事件標題（例：百花川松鼠劫食、中大連日大雨 YouBike 危機） |
| `is_active` | BOOLEAN | DEFAULT TRUE | 是否啟用（管理員可於後台隨時開關） |
| `weight` | INT | DEFAULT 10 | 抽籤權重（`1`~`100`，數值越高越容易抽中） |
| `cond_days` | JSON | NULLABLE | 限定觸發星期陣列（例：`[1,2,3,4,5]`，NULL 代表不限） |
| `cond_slots` | JSON | NULLABLE | 限定觸發時段陣列（例：`["morning"]`，NULL 代表不限） |
| `cond_location` | VARCHAR(50) | FK, NULLABLE | 限定發生地點（NULL 代表全校皆可觸發） |
| `cond_min_stamina` | INT | DEFAULT 0 | 玩家體力高於此值才可觸發 |
| `cond_max_stamina` | INT | DEFAULT 100 | 玩家體力低於此值才可觸發（例：體力低於 30 觸發「早八睡過頭危機」） |
| `event_prompt` | TEXT | NOT NULL | 餵給本地 LLM 的事件強制指令（例：「突發狀況：出門下起滂沱大雨且借不到 YouBike...」） |
| `preset_options` | JSON | NOT NULL | 預設選項意圖與固定數值增減（見下方 JSON 結構） |

*`preset_options` 欄位結構規範（數值由後端鎖定，LLM 僅根據 `intent_hint` 潤飾表面文字）：*

```json
[
  {
    "option_key": "A",
    "intent_hint": "撐傘淋雨狂奔去教室，雖然狼狽但準時抵達",
    "effects": {"stamina": -15, "study": 10, "social": 0, "money": 0}
  },
  {
    "option_key": "B",
    "intent_hint": "聯絡室友求救或共乘計程車，花點小錢解決",
    "effects": {"stamina": -5, "study": 10, "social": 5, "money": -100}
  },
  {
    "option_key": "C",
    "intent_hint": "放棄掙扎直接回宿舍補眠，自主放假一節課",
    "effects": {"stamina": 20, "study": -15, "social": -5, "money": 0}
  }
]

```

#### 表 6：`game_sessions`（玩家模擬工作階段狀態表）

| 欄位名稱 | 型別 | 鍵值/約束 | 說明 |
| --- | --- | --- | --- |
| `session_id` | VARCHAR(36) | PK | UUID 字串 |
| `player_profile` | JSON | NOT NULL | 解析後之玩家設定 `{"department": "資訊管理學系", "grade": 1, "clubs": ["熱舞社"], "interests": ["電影"]}` |
| `weekly_schedule` | JSON | NOT NULL | 排定之一週 21 個時段行程表（綁定 `course_id`、`club_id` 或 `"free"`） |
| `current_turn` | INT | DEFAULT 0 | 當前進度索引（`0` ~ `20`，對應週一早至週日晚） |
| `stats` | JSON | NOT NULL | 玩家四維數值 `{"stamina": 80, "study": 50, "social": 50, "money": 1500}` |
| `visited_locs` | JSON | NOT NULL | 累積造訪過的 `location_id` 陣列（供結算時連動 3D 地圖） |
| `triggered_evts` | JSON | NOT NULL | 本局已觸發過的 `event_id` 陣列（避免同一週重複抽中相同突發事件） |
| `history_logs` | JSON | NOT NULL | 最近 3 回合之簡短行動摘要（供塞入 Prompt 維持前後文連貫） |
| `created_at` | DATETIME | DEFAULT NOW | 建立時間（供後台統計分析使用） |

#### 表 7：`admin_users` & `system_configs`（管理員與系統模型設定表）

| 資料表 | 關鍵欄位 | 說明 |
| --- | --- | --- |
| `admin_users` | `id`, `username`, `password_hash`, `role` | 後台管理員帳號（支援 JWT 登入驗證）。 |
| `system_configs` | `active_llm_model`, `event_trigger_prob`, `system_prompt_override` | 動態儲存當前啟用的合規 Ollama 模型名稱（如 `gemma3:4b` 或 `taide:8b`）與全域突發事件觸發機率（預設 `0.35`）。 |

---

### 4.2 向量資料庫設計（Qdrant + FastEmbed 雙向量規格）

* **Collection 名稱**：`ncu_courses_hybrid`
* **向量配置（雙路並行）**：
1. **Dense Vector (`dense`)**：使用 `intfloat/multilingual-e5-small`（384 維度，Cosine 距離）。
* **重要規則**：遵循微軟 E5 模型規範，寫入課程時文本前綴必加 `"passage: "`，使用者查詢時前綴必加 `"query: "`。


2. **Sparse Vector (`bm25`)**：使用 `Qdrant/bm25`（IDF 權重修飾），專門捕捉繁體中文精準字詞（如課名、特定技術名詞）。


* **向量化文本格式（Document Template）**：
```text
passage: 【開課系所】{department} 【課程名稱】{course_name} 【必選修】{grade}年級{category} 【課程大綱与目標】{syllabus_summary}

```


* **Payload (Metadata 過濾欄位)**：
`course_id`, `course_name`, `department`, `grade`, `semester_term`, `category`, `day_of_week`, `period_slot`, `location_id`, `syllabus_summary`。

---

## 5. 前台三大核心模組詳細功能規格

### 5.1 模組一：AI 一週校園生活模擬器 (`/simulator`)

#### (1) 自然語言開局與智慧排課（Onboarding）

* **輸入範例**：「*我是資訊管理學系，想體驗大一上，我想參加系學會和熱舞社，另外想修一點跟人工智慧有關的課*」
* **後端處理流程**：
1. 呼叫本地合規 LLM（搭配 Pydantic Schema）將輸入解析為結構化 JSON：
`{"department": "資訊管理學系", "grade": 1, "semester_term": 1, "clubs": ["資管系學會", "熱舞社"], "interest_query": "人工智慧"}`
2. **SQL 排入必修**：從 `courses` 撈出「資訊管理學系 + 大一上 + 必修」課程，填入週一至週五對應的 `morning` / `afternoon` 時段。
3. **SQL 排入社團**：從 `clubs_and_activities` 比對出「資管系學會」與「熱舞社」，填入對應的 `evening` 時段。
4. **FastEmbed 混合檢索排入興趣課**：若玩家有提及額外興趣（如「人工智慧」），以 `hybrid_search` 檢索出 Top 3 相關選修/通識課，挑選一門與目前課表**不衝堂**的課程排入空堂。
5. 回傳完整一週 21 時段課表與初始數值（體力 80、學業 50、社交 50、金錢 1500）。



#### (2) 回合制推進引擎（Turn-by-Turn Engine）

* **UI 介面**：
* **左側面板**：顯示「中大一週動態行事曆」（高亮當前所在時段）與四維數值進度條。
* **右上子母畫面**：Three.js 3D 校園地圖小視窗，鏡頭自動平滑移動（Lerp）至當前時段所在的館舍（如：管理二館、依仁堂、男九舍）。
* **中央主視窗**：顯示當前時段標題、所在館舍標籤、100~150 字的第二人稱情境故事，以及下方 A / B / C 三個行動選項按鈕。


* **後端單回合生成演算法**：
1. **定位時段與行程**：根據 `current_turn` 取得當前星期與時段（早/午/晚），讀取 `weekly_schedule` 中的課程或社團；若為空堂則標記為「自由探索時間」。
2. **抽取環境背景（Grounding）**：根據行程所在的 `location_id`，從 `campus_locations` 與 `campus_life_info` 抽取該館舍描述與鄰近飲食/交通資訊（例如：中午時段自動帶入「松果餐廳」或「後門美食」資訊碎片）。
3. **判定突發事件**：
* 產生 `0.0 ~ 1.0` 亂數，若小於 `event_trigger_prob`（預設 35%），則查詢 `random_events` 表。
* 過濾條件：`is_active == True`、未曾於本局 `triggered_evts` 出現過、且符合當前星期/時段/地點/體力門檻。
* 依 `weight` 進行加權隨機抽籤。若抽中，提取該事件的 `event_prompt` 與 `preset_options`；若未觸發，則使用系統預設的「常規上課/社團/自由活動選項骨架」。


4. **本地 LLM 極簡 Prompt 生成**：將組裝好的原料送入 Ollama（強制指定台灣繁體中文與 Pydantic JSON Schema），生成生動的劇情與選項文字。
5. **數值結算**：玩家點選 A/B/C 後，後端直接讀取對應選項的 `effects` 更新 `stats`（確保體力介於 0~100），寫入 `history_logs` 並推進至下一回合。



#### (3) 週末總結與探索導流（Summary & Handoff）

* 當 `current_turn` 達 21 時，觸發結算：
* 後端依最終數值組合頒發專屬稱號（例：`study > 85` 獲頒「書卷獎候選人」；`social > 85` 獲頒「中大交際花/系核」；常去宵夜街獲頒「宵夜街守護神」）。
* LLM 根據 `history_logs` 生成 150 字的「你的一週中大新鮮人週記」。
* 頁面下方列出玩家本週實際走訪的館舍卡片與修習課程，點擊可**直接跳轉至「3D 校園地圖」或「課程探索中心」對應項目**，也可點擊「重新模擬」體驗其他學系。



---

### 5.2 模組二：AI 課程探索中心 (`/courses`)

專為尚未熟悉學校選課系統的高中生與新生設計，分為四大功能子頁面：

1. **一般課程搜尋（SQL Filter）**：
* 提供系所、年級、必選修、學期、上課星期與課名關鍵字篩選。
* 純 SQL 查詢，毫秒級回應。每張課程卡片皆標註上課館舍（點擊可開啟 3D 地圖定位）與完整大綱彈窗。


2. **AI 自然語言課程查詢（FastEmbed Hybrid RAG）**：
* **使用情境**：使用者輸入自然語言，例如「*我對寫網頁和手機 App 有興趣，或是想學一點 UI 設計，有哪些推薦的課？*」
* **運作邏輯**：
1. 本地 LLM 將使用者句子拆解為 `grade_filter`（選填）與 `search_query`。
2. 呼叫 `CourseRAGService.hybrid_search_courses()`，透過 `multilingual-e5-small`（語意）+ `BM25`（關鍵字）從 Qdrant 檢索出最相關的 Top 6 門課程。
3. 將這 6 門課的 `syllabus_summary` 塞入 Prompt，請本地 LLM 以「選課顧問學長姐」的口吻撰寫 150 字的推薦導讀（說明為何這些課符合其興趣），並在下方渲染出這 6 門課的互動卡片。




3. **系所課程地圖（Department Roadmap）**：
* 使用者選擇任一學系（如：資訊管理學系），後端透過 SQL `WHERE department = ? ORDER BY grade, semester_term` 撈出大一上至大四下共 8 個學期的必選修結構。
* 前端以八宮格時間軸看板（Kanban）視覺化呈現，以不同顏色標籤區分「系必修」、「系選修」。
* **AI 系所生涯導覽**：點擊按鈕後，將該系大一至大四的必修課名清單餵給 LLM，生成「四年能力養成脈絡摘要」（例如：大一打底程式與管理基礎 $\rightarrow$ 大二深入系統分析與資料庫 $\rightarrow$ 大三實作專題...）。


4. **比較課程 / 比較系所（AI Comparator）**：
* **課程比較模式**：使用者挑選 2～3 門課（例如：資管系《資料庫管理》vs. 資工系《資料庫系統》）。後端從 SQL 調出這幾門課的大綱，要求 LLM 依 JSON Schema 輸出四個維度：`核心教學目標差異`、`理論與實作比重`、`先修與難度評估`、`適合什麼樣的學生`，前端渲染為並排對照表。
* **系所比較模式**：使用者挑選 2 個學系（例如：資訊管理學系 vs. 資訊工程學系）。為避免超出 4B~8B 模型的 Context 負荷，後端 Python 先用 SQL 萃取出兩系的「完整必修課名清單」與「選修課領域關鍵字」，再交由 LLM 產出結構化的雙系定位差異報告。



---

### 5.3 模組三：純色 3D 互動校園地圖與百科 (`/map` & `/explore`)

1. **3D 模型建置與渲染規格**：
* **建模流程**：利用 Blender 搭配 Blosm 外掛匯入中央大學 OpenStreetMap 建築與道路輪廓，將主要建築物獨立命名（如 `mesh_mgt2`、`mesh_library`、`mesh_yiren`），匯出為壓縮 `.glb` 格式。
* **純色美學風格（Minimalist Clay/Pastel Style）**：前端使用 React Three Fiber 載入後，透過程式統一覆寫材質為柔和純色（教學大樓：暖米白 `#F5F2EB`、學生宿舍：霧霾藍 `#D6E4F0`、餐飲生活區：柔珊瑚橘 `#FADCD9`、草地與百花川：鼠尾草綠 `#D8E2DC`），並啟用 `ContactShadows` 與環境光遮蔽，呈現乾淨現代的互動沙盤質感。


2. **互動與資料連動**：
* **射線檢測（Raycasting）**：滑鼠移過建築時，建築微幅上浮並顯示名稱 Tooltip；點擊建築時，觸發鏡頭平滑飛行聚焦該建築，右側滑出詳細資訊面板。
* **面板整合內容**：顯示該建築的 `full_content` 介紹、在此開課的本學期課程列表、駐點於此的社團，以及鄰近的飲食與 YouBike 站點。


3. **分類校園百科頁 (`/explore`)**：
* 提供「社團組織」、「宿舍開箱」、「中大美食（後門/宵夜街/學餐）」、「校內外交通」四大分類瀑布流卡片，支援標籤過濾，且每張卡片皆可一鍵切換至 3D 地圖視角。



---

## 6. 後台管理系統規格（Admin CMS：`/admin`）

後台提供直覺的視覺化管理介面，讓管理員無須修改程式碼即可維護所有校園資料、調整突發事件機率並管理本地 AI 模型。

### 6.1 營運數據與合規模型控制台 (`/admin/dashboard`)

* **數據統計卡片**：顯示模擬器總遊玩人次、最熱門體驗系所排行、最常被選擇的社團排行、AI 找課熱門查詢詞。
* **合規 AI 模型動態切換器**：
* 顯示本地 Ollama 連線狀態與目前載入的模型清單。
* 提供下拉選單讓管理員即時切換推論模型（例如在 `gemma3:4b`、`gemma2:9b`、`llama3.1:8b`、`taide-lx:8b`、`breeze:7b` 之間一鍵切換），並明確標示各模型之研發機構與國家，方便於競賽展示時直接向評審證明資安合規性。



### 6.2 突發事件與遊戲平衡管理 (`/admin/events`)

* **事件列表（Data Table）**：檢視所有突發事件的標題、觸發時段/地點標籤、權重（Weight）、啟用狀態（Switch 開關）與快速編輯/刪除按鈕。
* **事件規則與選項編輯器**：
* 表單設定：事件標題、抽籤權重滑桿（1~100）、觸發條件選擇器（星期多選、時段多選、綁定館舍下拉選單、體力上下限設定）。
* Prompt 腳本區：編寫 `event_prompt`。
* 選項與數值配置器：設定 A、B、C 三個選項的 `intent_hint`，並透過滑桿設定 `stamina`, `study`, `social`, `money` 的增減數值。


* **★ AI 即時預覽沙盒（Live Prompt Sandbox）**：在編輯介面右側提供「測試生成」按鈕。管理員修改完事件 Prompt 後點擊，後端立即呼叫當前設定的本地模型試跑一次，即時在右側顯示生成的 150 字故事與選項文字，確認語氣與邏輯無誤後即可儲存上線。

### 6.3 社團、飲食、宿舍與交通百科管理 (`/admin/campus-data`)

* **社團管理 (`clubs_and_activities`)**：完整 CRUD 介面，管理社團名稱、類別、常態社課時段、活動地點與 AI 劇情提示詞。
* **飲食/住宿/交通管理 (`campus_life_info`)**：支援 Markdown 即時預覽編輯器、標籤（Tags）管理，以及供遊戲抽籤使用的 `game_snippet` 短句編輯。

### 6.4 3D 地圖節點視覺化綁定器 (`/admin/locations`)

* 畫面左側內嵌 Three.js 3D 校園場景，右側為館舍表單。
* 管理員直接在左側 3D 畫面點擊任意建築並調整好滿意的鏡頭角度，系統即自動擷取該 Mesh 的名稱（`three_mesh_name`）與當前攝影機座標（`camera_pos`）填入右側表單，輕鬆完成 3D 模型與資料庫館舍的綁定。

### 6.5 課程批次匯入與 FastEmbed 向量同步中心 (`/admin/courses`)

* **課程 CRUD 與批次上傳**：支援單筆新增修改，或上傳 CSV / JSON 學期課程檔批次寫入 SQLite。
* **Qdrant + FastEmbed 向量同步面板**：
* 顯示目前 SQLite 總課程數、已同步向量數、未同步數量（`is_synced_vec == False`）。
* 提供「執行 FastEmbed 雙向量同步」按鈕，點擊後於背景將新課程轉換為 `multilingual-e5-small` 稠密向量與 `BM25` 稀疏向量寫入 Qdrant，並於前端顯示即時進度條。



---

## 7. 後端 API 端點規格總覽（FastAPI Endpoints）

| 模組分類 | HTTP 方法與路徑 | 功能說明 |
| --- | --- | --- |
| **模擬遊戲** | `POST /api/sim/start` | 接收玩家自然語言志向，由 LLM 解析並結合 SQL + RAG 排定一週 21 時段課表，建立 Session。 |
| **模擬遊戲** | `POST /api/sim/next-turn` | 傳入 `session_id` 與上一回合選項 `A/B/C`，結算數值、判定突發事件，回傳下一時段劇情與選項 JSON。 |
| **模擬遊戲** | `POST /api/sim/summary` | 第 21 回合結束後呼叫，計算新鮮人稱號並生成一週回顧週記與推薦課程/館舍連結。 |
| **課程探索** | `GET /api/courses/search` | 一般 SQL 多條件篩選查詢（支援系所、年級、必選修、星期節次、關鍵字與分頁）。 |
| **課程探索** | `POST /api/courses/ai-query` | 接收自然語言找課需求，執行 FastEmbed + Qdrant 混合檢索，回傳 AI 顧問導讀與推薦課程列表。 |
| **課程探索** | `GET /api/courses/roadmap/{dept}` | 取得指定系所大一上至大四下共 8 學期必選修課程地圖，以及 AI 系所學習脈絡摘要。 |
| **課程探索** | `POST /api/courses/compare` | 傳入 2~3 個 `course_id` 或 `department` 名稱，回傳結構化多維度對比分析 JSON。 |
| **地圖百科** | `GET /api/explore/locations` | 取得所有 3D 地圖館舍節點、分類、鏡頭座標與關聯之課程/社團/生活資訊。 |
| **地圖百科** | `GET /api/explore/life-info` | 依分類（社團、飲食、宿舍、交通）與標籤查詢校園百科文章。 |
| **後台管理** | `POST /api/admin/auth/login` | 管理員登入，核發 JWT Token。 |
| **後台管理** | `GET/PUT /api/admin/config` | 取得統計儀表板數據、切換本地合規 Ollama 模型、調整全域突發事件觸發機率。 |
| **後台管理** | `CRUD /api/admin/events` | 突發事件新增、讀取、修改、刪除與啟用狀態切換。 |
| **後台管理** | `POST /api/admin/events/sandbox` | 後台即時沙盒測試：傳入編輯中的事件資料，預覽本地 LLM 生成之劇情與選項結果。 |
| **後台管理** | `CRUD /api/admin/clubs` | 社團、系學會與打工資料管理。 |
| **後台管理** | `CRUD /api/admin/life-info` | 飲食、宿舍細節、交通百科資料管理。 |
| **後台管理** | `CRUD /api/admin/locations` | 校園館舍與 3D 模型節點對應管理。 |
| **後台管理** | `POST /api/admin/courses/import` | 批次匯入課程 CSV/JSON 並觸發 FastEmbed + Qdrant 向量同步作業。 |

---

## 8. 針對歐美/台灣 4B~8B 模型的防幻覺與繁中強制約束規範

為確保 `Gemma-3-4B / Gemma-2-9B`、`Llama-3.1-8B` 或 `TAIDE / Breeze` 在本地端輸出穩定、道地的台灣繁體中文與 100% 合法的 JSON，後端 `core/llm_client.py` 實作規範如下：

```python
from pydantic import BaseModel, Field
from typing import List
import httpx

# 1. 全域 System Prompt：強制台灣繁體中文與校園防幻覺約束
NCU_SYSTEM_PROMPT = """
你是一個專屬於「國立中央大學（NCU）」的智慧校園模擬器與選課顧問 AI。
【嚴格輸出規範】
1. 語言要求：必須全程使用「台灣繁體中文（zh-TW）」與台灣大學生自然口語（如：早八、學餐、宵夜街、系學會、通識課、衝堂、報告）。嚴禁出現任何簡體字、中國大陸用語或無故夾雜英文段落。
2. 事實依據：只能根據系統提供的【校園背景知識】、【課程大綱】與【突發事件指令】進行描寫，嚴禁自行捏造不存在的館舍或課程。
3. 格式要求：必須嚴格遵循指定的 JSON Schema 結構輸出。
"""

# 2. 定義單回合劇情生成的 Pydantic Schema
class OptionItem(BaseModel):
    option_key: str = Field(description="固定對應輸入的 A, B 或 C")
    display_text: str = Field(description="根據選項提示潤飾出的生動行動文字，限 25 字以內")

class TurnGenerationSchema(BaseModel):
    narrative: str = Field(description="100至150字的第二人稱（你）校園情境描述，需自然融入當前時段、地點特色、課程與突發狀況")
    options: List[OptionItem] = Field(description="固定包含 A, B, C 三個選項")

# 3. 呼叫本地 Ollama API (使用 Structured Outputs)
async def generate_turn_story(model_name: str, user_prompt: str) -> TurnGenerationSchema:
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            "http://localhost:11434/api/chat",
            json={
                "model": model_name, # 例: "gemma3:4b" 或 "llama3.1:8b"
                "messages": [
                    {"role": "system", "content": NCU_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ],
                "format": TurnGenerationSchema.model_json_schema(),
                "stream": False,
                "options": {
                    "temperature": 0.6,
                    "num_ctx": 4096
                }
            }
        )
        result_json = response.json()["message"]["content"]
        return TurnGenerationSchema.model_validate_json(result_json)

```

---

## 9. 專案標準目錄結構（Project Directory Structure）

```text
ncu-life-simulator/
├── frontend/                        # Next.js (TypeScript + Tailwind + R3F)
│   ├── public/
│   │   └── models/ncu_campus.glb    # Blender 匯出之純色 3D 校園白模
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx             # 系統首頁 (雙核心分流入口)
│   │   │   ├── simulator/page.tsx   # 一週校園生活模擬器主介面
│   │   │   ├── courses/page.tsx     # AI 課程探索中心 (搜尋/RAG/地圖/比較)
│   │   │   ├── map/page.tsx         # 全螢幕 3D 互動校園地圖與側邊欄百科
│   │   │   ├── explore/page.tsx     # 社團、宿舍、飲食、交通分類百科
│   │   │   └── admin/               # 後台管理系統 (CMS)
│   │   │       ├── dashboard/       # 數據統計與合規模型切換器
│   │   │       ├── events/          # 突發事件 CRUD 與 AI 即時預覽沙盒
│   │   │       ├── campus-data/     # 社團、飲食、交通、宿舍管理
│   │   │       ├── locations/       # 3D 模型節點視覺化綁定器
│   │   │       └── courses/         # 課程匯入與 FastEmbed 向量同步面板
│   │   ├── components/
│   │   │   ├── three/               # CampusScene.tsx, BuildingMesh.tsx, CameraController.tsx
│   │   │   ├── simulator/           # WeeklySchedule.tsx, StatsBar.tsx, StoryDialog.tsx
│   │   │   └── courses/             # CourseCard.tsx, DeptRoadmap.tsx, CompareTable.tsx
│   │   └── store/
│   │       └── useSimulatorStore.ts # Zustand 遊戲與地圖聯動狀態管理
└── backend/                         # FastAPI (Python 3.11+)
    ├── app/
    │   ├── main.py                  # FastAPI 應用程式入口與 CORS 設定
    │   ├── api/                     # 路由模組 (sim.py, courses.py, explore.py, admin.py)
    │   ├── core/
    │   │   ├── database.py          # SQLite SQLAlchemy 連線設定
    │   │   ├── security.py          # 後台 JWT 驗證機制
    │   │   └── llm_client.py        # Ollama 結構化輸出封裝與合規模型管理
    │   ├── models/                  # SQLAlchemy 7 張資料表定義 (tables.py)
    │   ├── schemas/                 # Pydantic API 與 LLM 輸出驗證模型
    │   └── services/
    │       ├── sim_engine.py        # 開局排課、回合狀態機、加權突發事件抽籤
    │       ├── rag_service.py       # FastEmbed (e5 + BM25) 與 Qdrant 混合檢索服務
    │       ├── compare_service.py   # 課程與系所結構化比較邏輯
    │       └── prompts.py           # 集中管理所有台灣繁體中文 Prompt 模板
    └── data/
        ├── ncu_sim.sqlite           # SQLite 關聯式資料庫檔案
        ├── qdrant_storage/          # Qdrant 本地持久化向量資料夾
        └── seed_data.json           # 中大初始課程、館舍、社團與突發事件種子資料

```