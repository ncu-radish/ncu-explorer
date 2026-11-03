# NCU Explorer 本地啟動指南

本文件說明如何在本地環境安裝依賴並啟動後端與前端服務。

## 環境需求

- Python 3.10 或以上版本
- Node.js 18 或以上版本（含 npm）
- Ollama（選用，若需本地 LLM 功能，預設連接埠為 11434）

---

## 資料庫與模型檔案位置

- 課程資料庫：
  - 課程資料庫 (SQLite)：`backend/data/courses.db`
  - 模擬系統資料庫 (SQLite)：`backend/data/ncu_sim.sqlite`
- 課程向量資料庫：
  - ChromaDB 向量資料庫：`backend/data/chroma_db/`
  - Qdrant 向量資料庫：`backend/data/qdrant_storage/`
- 地圖 3D 模型：
  - 校園建築模型 (.glb)：`frontend/public/models/campus_buildings.glb`

---

## 後端啟動步驟 (FastAPI)

1. 進入後端目錄：
   ```bash
   cd backend
   ```

2. 建立並啟用 Python 虛擬環境：
   - Windows (PowerShell):
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   - Linux / macOS:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. 安裝 Python 依賴套件：
   ```bash
   pip install -r requirements.txt
   ```

4. （選用）設定環境變數：
   若需自訂設定，可複製範本檔案：
   ```bash
   cp .env.example .env
   ```

5. 初始化資料庫與向量索引（首次執行或需重置資料時）：
   ```bash
   python scripts/seed_db.py
   ```

6. 啟動後端開發伺服器：
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

- 後端服務位址：`http://localhost:8000`
- API 文件 (Swagger UI)：`http://localhost:8000/docs`
- 健康檢查端點：`http://localhost:8000/api/health`

---

## 前端啟動步驟 (Next.js)

開啟另一個終端機視窗，執行以下步驟：

1. 進入前端目錄：
   ```bash
   cd frontend
   ```

2. 安裝 Node.js 依賴套件：
   ```bash
   npm install
   ```

3. 啟動前端開發伺服器：
   ```bash
   npm run dev
   ```

- 前端服務位址：`http://localhost:3000`
