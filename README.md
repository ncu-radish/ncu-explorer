# 國立中央大學智慧校園生活模擬與 AI 課程探索平台
**NCU Life Simulator & Explorer**

本平台專為尚未入學的高中生與大一新生設計，結合「**AI 一週校園生活模擬遊戲**」、「**雙路混合 RAG 課程探索中心**」與「**Three.js 純色 3D 互動校園地圖**」三大核心模組。

---

## 🌟 系統特色與架構亮點

1. **零 Docker 本地原生極速架構**：
   * **關聯式資料庫**：SQLite 3.40+（`./backend/data/ncu_sim.sqlite`）
   * **向量資料庫**：`qdrant-client` 本地持久化模式（Local Persistence Mode，`./backend/data/qdrant_storage`），不需啟動外部 Docker 容器。
   * **高速向量化**：FastEmbed（ONNX Runtime 加速），搭配微軟多語言稠密向量（384維）與 BM25 稀疏向量。
2. **校園資安與合規 LLM（無中國背景模型）**：
   * 預設支援本機 Ollama 歐美及台灣本土研發之開源權重：
     * `Gemma-3-4B-It` / `Gemma-2-9B-It`（美國 Google）
     * `Llama-3.1-8B-Instruct`（美國 Meta）
     * `Llama-3.1-TAIDE-LX-8B`（台灣 國科會）
     * `Breeze-7B-Instruct`（台灣 聯發科 MediaTek）
   * 後端狀態機 100% 掌握數值加減與進度推進，杜絕數值幻覺；Ollama API 使用 Pydantic JSON Schema 強制約束輸出格式。
3. **Three.js 純色 3D 校園沙盤**：
   * 柔和純色 Clay/Pastel 美學風格，內建中大代表性建築節點（管二、工五、科五、總圖、教研、依仁堂、男九舍、女十四舍、松果餐廳、百花川、國泰樹）。
   * 支援射線點擊（Raycasting）、平滑鏡頭飛行（Camera Lerp）與建築側邊欄百科連動。

---

## 🚀 快速啟動指南

### 1. 後端啟動（FastAPI）

開啟 PowerShell 終端機：
```powershell
# 1. 啟動 FastAPI 伺服器 (連接埠 8000)
.\backend\.venv\Scripts\uvicorn app.main:app --reload --port 8000
```
> 後端健康檢查端點：`http://localhost:8000/api/health`  
> Swagger API 互動式文件：`http://localhost:8000/docs`

*(若需重新初始化 SQLite 資料庫與重新建立 Qdrant 雙向量索引，可執行：)*
```powershell
.\backend\.venv\Scripts\python backend/scripts/seed_db.py
```

---

### 2. 前端啟動（Next.js）

開啟另一個終端機視窗，進入 `frontend` 目錄：
```powershell
# 進入前端目錄並啟動開發伺服器
npm --prefix frontend run dev
```
瀏覽器造訪：`http://localhost:3000`

---

## 🧭 系統主要路由導覽

| 路由路徑 | 模組名稱 | 核心功能介紹 |
| --- | --- | --- |
| `/` | **首頁 (Landing Page)** | 雙核心分流入口、資安合規標章、三大功能特色卡片 |
| `/simulator` | **生活模擬器** | 自然語言入學設定、21時段動態課表、3D子母畫面、加權突發事件、四維數值與稱號結算 |
| `/courses` | **課程探索中心** | SQL多維度檢索、FastEmbed雙向量顧問找課、八學期課程地圖、課程與系所AI深入對照 |
| `/map` | **3D 校園地圖** | 全螢幕純色沙盤、分類切換、射線點擊平滑飛行、側邊欄館舍開課與社團百科 |
| `/explore` | **校園生活百科** | 社團組織、後門/宵夜街美食、宿舍開箱指南、YouBike與公車交通攻略（含標籤快篩） |
| `/admin/dashboard` | **管理後台儀表板** | 體驗數據統計、合規LLM動態切換、突發事件機率滑桿、FastEmbed雙向量重新同步 |
| `/admin/events` | **事件管理與沙盒** | 突發事件清單CRUD、★ AI即時預覽沙盒測試 |

---

## 🛡️ Ollama 部署與降級防護機制

* 系統依指示**預設所有模型均已於本地端 Ollama 安裝完成**，絕不執行任何自動拉取動作。
* 若 Ollama 服務處於離線或逾時狀態，後端內建**平滑降級（Graceful Fallback）**，保證課表排程、回合故事、數值增減與結算報告 100% 順暢推進不中斷。
