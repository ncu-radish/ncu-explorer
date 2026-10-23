"""
NCU Course Database Service
===========================
負責讀取全校課程關聯式資料庫 (courses.db)，支援 1151 (上學期) 與 1142 (下學期) 全量課程、
上課時間教室 (schedules)、核心能力指標 (core_skills) 與分發限制條件 (distribution_conditions)。
本模組以唯讀模式優先載入 backend/data/courses.db，若未複製則自動由 tmp/data/courses.db 讀取，
絕不修改 tmp 目錄。
"""

import sqlite3
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
BACKEND_DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
TMP_DATA_DIR = PROJECT_ROOT / "tmp" / "data"


def resolve_courses_db_path() -> Optional[Path]:
    """優先尋找 backend/data/courses.db，若無則回退至 tmp/data/courses.db"""
    backend_db = BACKEND_DATA_DIR / "courses.db"
    if backend_db.exists():
        return backend_db
    tmp_db = TMP_DATA_DIR / "courses.db"
    if tmp_db.exists():
        return tmp_db
    return None


class CourseDatabaseService:
    def __init__(self):
        self._cached_meta: Optional[Dict[str, Any]] = None

    def get_connection(self) -> sqlite3.Connection:
        db_path = resolve_courses_db_path()
        if not db_path:
            raise FileNotFoundError(
                "找不到 courses.db 資料庫檔案！請確認 backend/data/courses.db 或 tmp/data/courses.db 是否存在。"
            )
        # 以 URI 模式唯讀連線，確保安全
        conn = sqlite3.connect(f"file:{db_path.as_posix()}?mode=ro", uri=True)
        conn.row_factory = sqlite3.Row
        return conn

    def get_meta(self) -> Dict[str, Any]:
        """取得系所清單、學期清單、學制清單與總課數"""
        if self._cached_meta is not None:
            return self._cached_meta

        conn = self.get_connection()
        cursor = conn.cursor()

        # 1. 系所清單
        cursor.execute(
            "SELECT DISTINCT department FROM courses WHERE department IS NOT NULL AND department != '' ORDER BY department"
        )
        departments = [row[0] for row in cursor.fetchall()]

        # 2. 學期分佈與標籤
        cursor.execute("SELECT semester, count(*) FROM courses GROUP BY semester ORDER BY semester DESC")
        sem_rows = cursor.fetchall()
        sem_labels = {
            "1151": {"name": "115 學年度第 1 學期（上學期）", "short": "1151 上學期", "term": 1},
            "1142": {"name": "114 學年度第 2 學期（下學期）", "short": "1142 下學期", "term": 2},
        }
        semesters = []
        for sem, count in sem_rows:
            info = sem_labels.get(sem, {"name": f"{sem} 學期", "short": sem, "term": 1})
            semesters.append({
                "id": sem,
                "name": info["name"],
                "short": info["short"],
                "count": count,
            })

        # 3. 學制清單
        cursor.execute(
            "SELECT DISTINCT degree FROM courses WHERE degree IS NOT NULL AND degree != '' ORDER BY degree"
        )
        degrees = [row[0] for row in cursor.fetchall()]

        cursor.execute("SELECT count(*) FROM courses")
        total_courses = cursor.fetchone()[0]

        conn.close()

        self._cached_meta = {
            "departments": departments,
            "semesters": semesters,
            "degrees": degrees,
            "total_courses": total_courses,
        }
        return self._cached_meta

    def search_courses(
        self,
        semester: Optional[str] = None,
        department: Optional[str] = None,
        degree: Optional[str] = None,
        grade: Optional[int] = None,
        credits: Optional[float] = None,
        day: Optional[int] = None,
        keyword: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Dict[str, Any]:
        """精準關鍵字與多維度欄位篩選搜尋"""
        conn = self.get_connection()
        cursor = conn.cursor()

        where_clauses: List[str] = []
        params: List[Any] = []

        if semester:
            where_clauses.append("c.semester = ?")
            params.append(semester.strip())

        if department:
            where_clauses.append("c.department = ?")
            params.append(department.strip())

        if degree:
            where_clauses.append("c.degree = ?")
            params.append(degree.strip())

        if grade is not None and grade > 0:
            # 課號或名稱判斷年級，或分發條件中的年級限制
            where_clauses.append("(c.objectives LIKE ? OR c.content LIKE ? OR c.course_code LIKE ?)")
            g_str = f"%大{grade}%"
            c_str = f"%{grade}%"
            params.extend([g_str, g_str, c_str])

        if credits is not None and credits > 0:
            where_clauses.append("c.credits = ?")
            params.append(credits)

        if day is not None and 1 <= day <= 7:
            # 星期篩選 (Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6, Sun=7)
            day_map = {1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 7: "Sun"}
            day_code = day_map.get(day, "")
            where_clauses.append(
                "EXISTS (SELECT 1 FROM schedules s WHERE s.semester = c.semester AND s.serial_no = c.serial_no AND s.time LIKE ?)"
            )
            params.append(f"%{day_code}%")

        if keyword and keyword.strip():
            kw = f"%{keyword.strip()}%"
            where_clauses.append(
                """(
                    c.course_name_zh LIKE ? OR
                    c.course_name_en LIKE ? OR
                    c.course_code LIKE ? OR
                    c.teacher LIKE ? OR
                    c.department LIKE ? OR
                    c.objectives LIKE ? OR
                    c.content LIKE ? OR
                    c.fields LIKE ?
                )"""
            )
            params.extend([kw, kw, kw, kw, kw, kw, kw, kw])

        where_sql = (" WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

        # 統計總數
        count_sql = f"SELECT count(*) FROM courses c {where_sql}"
        cursor.execute(count_sql, params)
        total = cursor.fetchone()[0]

        # 分頁查詢
        offset = (max(1, page) - 1) * page_size
        query_sql = f"""
            SELECT c.semester, c.serial_no, c.course_code, c.department, c.teacher,
                   c.course_name_zh, c.course_name_en, c.degree, c.credits,
                   c.objectives, c.content, c.textbooks, c.fields
            FROM courses c
            {where_sql}
            ORDER BY c.semester DESC, c.department ASC, c.serial_no ASC
            LIMIT ? OFFSET ?
        """
        cursor.execute(query_sql, params + [page_size, offset])
        rows = cursor.fetchall()

        # 批次取得上課時間與地點
        course_items: List[Dict[str, Any]] = []
        if rows:
            sem_serials = [(r["semester"], r["serial_no"]) for r in rows]
            # 抓取對應 schedules
            placeholders = ",".join(["(?, ?)"] * len(sem_serials))
            flat_params: List[Any] = []
            for s, sn in sem_serials:
                flat_params.extend([s, sn])

            sched_sql = f"""
                SELECT semester, serial_no, time, location
                FROM schedules
                WHERE (semester, serial_no) IN (VALUES {placeholders})
            """
            try:
                cursor.execute(sched_sql, flat_params)
                sched_rows = cursor.fetchall()
            except Exception:
                # 若 SQLite 版本不支援 VALUES，以 UNION 或單純查詢
                sched_rows = []
                for s, sn in sem_serials:
                    cursor.execute(
                        "SELECT semester, serial_no, time, location FROM schedules WHERE semester = ? AND serial_no = ?",
                        [s, sn],
                    )
                    sched_rows.extend(cursor.fetchall())

            schedules_map: Dict[Tuple[str, str], List[Dict[str, str]]] = {}
            for sr in sched_rows:
                key = (sr["semester"], sr["serial_no"])
                if key not in schedules_map:
                    schedules_map[key] = []
                schedules_map[key].append({"time": sr["time"] or "", "location": sr["location"] or ""})

            for r in rows:
                k = (r["semester"], r["serial_no"])
                item = dict(r)
                item["id"] = f"{r['semester']}_{r['serial_no']}"
                item["schedules"] = schedules_map.get(k, [])
                course_items.append(item)

        conn.close()

        return {
            "total": total,
            "page": page,
            "page_size": page_size,
            "items": course_items,
        }

    def get_course_detail(self, semester: str, serial_no: str) -> Optional[Dict[str, Any]]:
        """取得單一課程的完整課綱、上課教室、核心能力與分發順位限制"""
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT semester, serial_no, course_code, department, teacher,
                   course_name_zh, course_name_en, degree, credits,
                   objectives, content, textbooks, fields, embedding_text
            FROM courses
            WHERE semester = ? AND serial_no = ?
            """,
            [semester.strip(), serial_no.strip()],
        )
        row = cursor.fetchone()
        if not row:
            conn.close()
            return None

        course_detail = dict(row)
        course_detail["id"] = f"{semester}_{serial_no}"

        # 1. 課表時段與教室
        cursor.execute(
            "SELECT time, location FROM schedules WHERE semester = ? AND serial_no = ? ORDER BY id",
            [semester, serial_no],
        )
        course_detail["schedules"] = [dict(r) for r in cursor.fetchall()]

        # 2. 核心能力指標
        cursor.execute(
            "SELECT ability, strength, assessment_method FROM core_skills WHERE semester = ? AND serial_no = ? ORDER BY id",
            [semester, serial_no],
        )
        course_detail["core_skills"] = [dict(r) for r in cursor.fetchall()]

        # 3. 分發限制條件 (各順位)
        cursor.execute(
            "SELECT priority, condition FROM distribution_conditions WHERE semester = ? AND serial_no = ? ORDER BY priority ASC",
            [semester, serial_no],
        )
        course_detail["distribution_conditions"] = [dict(r) for r in cursor.fetchall()]

        conn.close()
        return course_detail


course_db_service = CourseDatabaseService()
