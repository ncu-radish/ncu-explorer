# NCU Life Simulator & Explorer：AI 協作指南

本文件是 AI 助手在 `ncu-explorer` 專案中工作的主要參考。細節規格請見 `GUIDELINE.md`，安裝步驟請見 `README.md`。開始修改前，請先閱讀這兩份文件中與任務相關的部分。

---

## 1. 專案概覽

國立中央大學（NCU）智慧校園生活模擬與 AI 課程探索平台，主要面向新生與有意就讀的學生，包含兩大功能：

1. **AI 校園生活模擬器**：為期一週、共 21 回合（週一早上到週日晚上）的回合制 RPG 模擬。使用者可自訂角色，體驗課表安排、社團活動、隨機校園事件，以及四項數值變化：體力（Energy）、學業（Academic）、壓力（Stress）、社交（Social）。
2. **校園百科與 AI 課程探索**：
   - **混合式 RAG 課程搜尋**：結合 dense 語意搜尋與 BM25 關鍵字搜尋。
   - **課程與系所比較**：多欄位比較課綱與畢業要求。
   - **3D 互動校園地圖**：以 Three.js / React Three Fiber 呈現 Blender 建模的 `.glb` 校園模型。
   - **管理後台（CMS）**：以 JWT 驗證，用於管理課程、校園事件與向量索引狀態。

### 核心架構原則

- **確定性邏輯**：所有數值更新、回合推進、課表分配與隨機事件觸發，皆由後端狀態機 `backend/app/services/sim_engine.py` 決定。本地 LLM 僅負責敘事與意圖解析，輸出需符合 Pydantic JSON schema。
- **單一資料來源**：模擬遊戲、3D 地圖與搜尋引擎共用同一組關聯式資料表（SQLite / PostgreSQL）與 Qdrant 向量資料庫。
- **模型合規**：僅使用來自美國、歐盟或台灣的開放權重模型（例如 Gemma、Llama、Breeze、TAIDE），不得引入受限模型。

---

## 2. 技術棧

**後端**：Python 3.11+、FastAPI、Uvicorn、SQLAlchemy 2.0（開發用 SQLite，正式用 PostgreSQL）、Pydantic v2、Qdrant（本地持久化）與 ChromaDB、FastEmbed（`multilingual-e5-small` + BM25）、Ollama（`gemma3:4b`、`llama3.1`、`taide`）、JWT（`python-jose`）、`passlib[bcrypt]`、Ruff、MyPy、Pytest。

**前端**：Next.js 16（App Router）、React 19、TypeScript 5、Tailwind CSS v4、Three.js、React Three Fiber、`@react-three/drei`、Zustand v5、ESLint 9、`tsc`。

---

## 3. 主要目錄結構

```text
ncu-explorer/
├── .github/workflows/        # CI/CD：backend-deploy.yml、frontend-deploy.yml
├── backend/
│   ├── app/
│   │   ├── api/              # 路由：admin.py、courses.py、explore.py、sim.py
│   │   ├── core/             # 設定、資料庫、LLM client、安全性（JWT）
│   │   ├── models/           # SQLAlchemy ORM 模型
│   │   ├── schemas/          # Pydantic 請求／回應模型
│   │   ├── services/         # 業務邏輯：sim_engine.py、rag_service.py 等
│   │   └── main.py           # FastAPI 進入點
│   ├── data/                 # SQLite 資料庫與向量索引（courses.db 為唯讀課程資料）
│   ├── scripts/seed_db.py    # 初始化資料庫與向量索引
│   └── tests/                # Pytest 測試
├── frontend/
│   ├── public/models/        # 3D 模型（如 campus_buildings.glb）
│   └── src/
│       ├── app/              # 頁面（admin、courses、explore、map、simulator 等）
│       ├── components/       # 依功能分組的 UI 元件，three/ 為 3D 相關元件
│       ├── lib/              # API client（api.ts）與工具函式
│       └── store/            # Zustand stores（useSimulatorStore、useMapStore）
├── GUIDELINE.md              # 完整技術規格
└── README.md                 # 本機安裝與啟動說明
```

---

## 4. 本機啟動

- **後端**：在 `backend/` 建立虛擬環境、安裝 `requirements.txt`，首次執行需先 `python scripts/seed_db.py`，再以 `uvicorn app.main:app --reload --port 8000` 啟動。
  - Swagger：`http://localhost:8000/docs`
  - 健康檢查：`http://localhost:8000/api/health`
- **前端**：在 `frontend/` 執行 `npm install` 後以 `npm run dev` 啟動，網址為 `http://localhost:3000`。
- **Ollama**（選用）：預設埠號 `11434`，僅在需要本地 AI 敘事時必要。

---

## 5. 提交前的檢查（每次修改後必須執行）

修改程式碼後，必須依序通過以下檢查，全部通過才能回報完成。

**後端**（於 `backend/` 目錄執行）：
```bash
ruff check .
mypy . --ignore-missing-imports
ENVIRONMENT=test pytest -v
```

**前端**（於 `frontend/` 目錄執行）：
```bash
npm run lint
npx tsc --noEmit
npm run build
```

若檢查失敗，請修正後重新執行，不要略過或跳過任何步驟。

---

## 6. 編碼規範

1. **狀態機完整性**
   - 絕不允許 LLM 輸出直接修改使用者屬性（`energy`、`stress`、`academics`、`social`）或回合計數。
   - 所有狀態轉換必須經過 `sim_engine.py`，數值需限制在 `[0, 100]` 範圍內。
2. **FastAPI 與 schema**
   - 請求與回應模型一律定義於 `app/schemas/`。
   - 路由維持模組化於 `app/api/`，並於 `app/main.py` 以 `settings.API_V1_STR` 掛載。
3. **資料庫**
   - 使用 SQLAlchemy 2.0 語法，例如 `select(Model).where(...)`。
   - `data/courses.db` 為唯讀課程資料；模擬狀態與紀錄只寫入 `ncu_sim.sqlite`。
4. **Next.js 與 React Three Fiber**
   - 任何引入 Three.js、R3F 或 OrbitControls 的元件，檔案頂端必須有 `'use client';`。
   - 3D 畫布與一般 DOM 覆蓋層需隔離，以維持 WebGL 效能。
   - 跨元件與 3D 事件通訊使用 Zustand stores（`useSimulatorStore`、`useMapStore`）。
5. **機密與設定**
   - 所有環境變數一律透過 `app/core/config.py` 的 `settings` 讀取。
   - 不得提交金鑰、密碼或 `.env` 檔案。

---

## 7. 禁止事項

- 未經要求，不得修改 `data/courses.db`。
- 不得在 `sim_engine.py` 以外的地方實作數值計算或回合邏輯。
- 不得新增受限或不在合規清單內的模型。
- 不得將機密資訊寫入程式碼、文件或測試。

---

## 8. Git 操作規範

- **預設只做唯讀操作**：可使用 `git status`、`git diff`、`git log` 等查看狀態。
- **未經明確要求，不得自行執行以下操作**：
  - 建立、切換、刪除或重新命名分支（`git checkout -b`、`git switch`、`git branch -d` 等）
  - 推送（`git push`，包含 `--force`）
  - 合併、變基或拉取（`git merge`、`git rebase`、`git pull`）
  - 重設或還原（`git reset`、`git revert`、`git checkout -- <file>`、`git stash`）
  - 提交（`git commit`）
- **例外情況**：僅在使用者明確要求時才執行上述操作，例如「請幫我解 conflict」或「請推送到某分支」。
- **解 conflict 時**：先說明衝突的檔案與雙方改動的差異，等使用者確認要保留哪一方後再處理。
- 若任務完成後認為需要提交或推送，請先詢問，不要直接執行。

---

## 9. 參考文件

- `GUIDELINE.md`：最初技術規格與設計決策。
- `README.md`：本機安裝與環境設定。