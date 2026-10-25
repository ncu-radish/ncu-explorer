const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const headers: Record<string, string> = {};
  
  // Only set Content-Type to application/json if body is not FormData
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // Attach stored JWT admin token if available
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("ncu_admin_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const errorText = await res.text();
    // If unauthorized, clear invalid token
    if (res.status === 401 && typeof window !== "undefined" && endpoint.startsWith("/admin")) {
      localStorage.removeItem("ncu_admin_token");
    }
    throw new Error(`API Error [${res.status}]: ${errorText || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// Simulator API
export const simApi = {
  start: (userInput: string, department?: string, grade?: number) =>
    fetchApi<any>("/sim/start", {
      method: "POST",
      body: JSON.stringify({
        user_input: userInput,
        department: department || undefined,
        grade: grade || undefined,
      }),
    }),
  nextTurn: (sessionId: string, optionKey: string) =>
    fetchApi<any>("/sim/next-turn", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, option_key: optionKey }),
    }),
  getSummary: (sessionId: string) =>
    fetchApi<any>("/sim/summary", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId }),
    }),
  triggerActivity: (
    sessionId: string,
    activityId: string,
    optionKey: string = "A",
    durationHours: number = 1,
    customTitle?: string
  ) =>
    fetchApi<{
      session_id: string;
      message: string;
      marked_slot: any;
      weekly_schedule: any[];
      stats: any;
      delta_stats: any;
      current_location_id?: string;
      current_location_name?: string;
    }>("/sim/trigger-activity", {
      method: "POST",
      body: JSON.stringify({
        session_id: sessionId,
        activity_id: activityId,
        option_key: optionKey,
        duration_hours: durationHours,
        custom_title: customTitle || undefined,
      }),
    }),
  prePlanTomorrow: (sessionId: string, targetDay: number, slots: any[]) =>
    fetchApi<{
      session_id: string;
      message: string;
      current_turn: number;
      weekly_schedule: any[];
      stats: any;
      story?: any;
      current_location_id?: string;
      current_location_name?: string;
    }>("/sim/pre-plan-tomorrow", {
      method: "POST",
      body: JSON.stringify({
        session_id: sessionId,
        target_day: targetDay,
        slots,
      }),
    }),
};

// Course Explorer API
export const courseApi = {
  getMeta: () =>
    fetchApi<{
      departments: string[];
      semesters: Array<{ id: string; name: string; short: string; count: number }>;
      degrees: string[];
      total_courses: number;
    }>("/courses/meta"),

  search: (params: {
    semester?: string;
    dept?: string;
    degree?: string;
    grade?: number;
    credits?: number;
    day?: number;
    keyword?: string;
    required_or_elective?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const query = new URLSearchParams();
    if (params.semester) query.append("semester", params.semester);
    if (params.dept) query.append("dept", params.dept);
    if (params.degree) query.append("degree", params.degree);
    if (params.grade !== undefined && params.grade !== null) query.append("grade", params.grade.toString());
    if (params.credits !== undefined && params.credits !== null) query.append("credits", params.credits.toString());
    if (params.day) query.append("day", params.day.toString());
    if (params.keyword) query.append("keyword", params.keyword);
    if (params.required_or_elective) query.append("required_or_elective", params.required_or_elective);
    if (params.page) query.append("page", params.page.toString());
    if (params.pageSize) query.append("page_size", params.pageSize.toString());
    return fetchApi<{
      total: number;
      page: number;
      page_size: number;
      items: any[];
    }>(`/courses/search?${query.toString()}`);
  },

  getDetail: (semester: string, serialNo: string) =>
    fetchApi<{
      id: string;
      semester: string;
      serial_no: string;
      course_code: string;
      department: string;
      teacher: string;
      course_name_zh: string;
      course_name_en: string;
      degree: string;
      credits: number;
      required_or_elective?: string;
      objectives?: string;
      content?: string;
      textbooks?: string;
      fields?: string;
      schedules: Array<{ time: string; location: string }>;
      core_skills: Array<{ ability: string; strength: string; assessment_method: string }>;
      distribution_conditions: Array<{ priority: number; condition: string }>;
    }>(`/courses/detail/${encodeURIComponent(semester)}/${encodeURIComponent(serialNo)}`),

  semanticSearch: (data: {
    query: string;
    semester?: string;
    department?: string;
    degree?: string;
    top_k?: number;
  }) =>
    fetchApi<{
      query: string;
      total: number;
      items: Array<{
        id: string;
        semester: string;
        serial_no: string;
        course_code: string;
        course_name_zh: string;
        course_name_en: string;
        department: string;
        teacher: string;
        credits: number;
        degree: string;
        similarity: number;
        distance: number;
        preview: string;
        schedules: Array<{ time: string; location: string }>;
        objectives?: string;
        content?: string;
        fields?: string;
      }>;
    }>("/courses/semantic-search", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  recommendDepartments: (data: {
    interest_query: string;
    semester?: string;
    top_departments_count?: number;
    courses_per_dept?: number;
  }) =>
    fetchApi<{
      query: string;
      departments: Array<{
        department: string;
        match_score: number;
        avg_score: number;
        course_count: number;
        featured_courses: any[];
      }>;
      top_courses: any[];
      consultant_advice: string;
    }>("/courses/department-recommend", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  aiQuery: (query: string, deptFilter?: string, gradeFilter?: number) =>
    fetchApi<any>("/courses/ai-query", {
      method: "POST",
      body: JSON.stringify({
        query,
        dept_filter: deptFilter || null,
        grade_filter: gradeFilter || null,
      }),
    }),
  getRoadmap: (dept: string) => fetchApi<any>(`/courses/roadmap/${encodeURIComponent(dept)}`),
  compareCourses: (courseIds: string[]) =>
    fetchApi<any>("/courses/compare", {
      method: "POST",
      body: JSON.stringify({ course_ids: courseIds }),
    }),
  compareDepts: (deptNames: string[]) =>
    fetchApi<any>("/courses/compare-depts", {
      method: "POST",
      body: JSON.stringify({ dept_names: deptNames }),
    }),
};

export interface Building {
  id: string;
  name_zh: string;
  name_en?: string | null;
  category?: string | null;
  classroom_code?: string | null;
  departments?: string[];
  alias?: string | null;
  description?: string | null;
}

export interface ClubItem {
  id: string;
  name: string;
  english_name?: string | null;
  type: string;
  category?: string | null;
  day_of_week: number;
  period_slot: string;
  location_id?: string | null;
  location_name?: string | null;
  location_text?: string | null;
  website_url?: string | null;
  image_url?: string | null;
  prompt_context?: string | null;
  full_intro: string;
  english_intro?: string | null;
}

export interface ClubCategorySummary {
  category: string;
  count: number;
}

export interface CampusActivityOption {
  option_key: string;
  intent_hint: string;
  effects: {
    stamina?: number;
    study?: number;
    social?: number;
    money?: number;
  };
  marks_activity?: boolean;
}

export interface CampusActivity {
  id: string;
  title: string;
  category: "breakfast" | "lunch" | "dinner" | "dorm_leisure" | "campus_leisure" | string;
  trigger_type: string;
  trigger_timing: string;
  trigger_mode: string;
  location_id?: string | null;
  location_name?: string | null;
  is_active: boolean;
  weight: number;
  event_prompt: string;
  preset_options: CampusActivityOption[];
}

// Explore & 3D Map API
export const exploreApi = {
  getBuildings: (params?: { q?: string; category?: string }) => {
    const query = new URLSearchParams();
    if (params?.q) query.append("q", params.q);
    if (params?.category) query.append("category", params.category);
    const qs = query.toString();
    return fetchApi<Building[]>(`/explore/buildings${qs ? `?${qs}` : ""}`);
  },
  getBuildingDetail: (id: string) => fetchApi<Building>(`/explore/buildings/${id}`),
  getLocations: (category?: string) => {
    const query = category ? `?category=${category}` : "";
    return fetchApi<any[]>(`/explore/locations${query}`);
  },
  getLocationDetail: (id: string) => fetchApi<any>(`/explore/locations/${id}`),
  getLifeInfo: (infoType?: string, tag?: string) => {
    const query = new URLSearchParams();
    if (infoType) query.append("info_type", infoType);
    if (tag) query.append("tag", tag);
    return fetchApi<any[]>(`/explore/life-info?${query.toString()}`);
  },
  getClubs: (params?: { category?: string; clubType?: string; keyword?: string } | string) => {
    if (typeof params === "string") {
      const query = params ? `?club_type=${encodeURIComponent(params)}` : "";
      return fetchApi<ClubItem[]>(`/explore/clubs${query}`);
    }
    const query = new URLSearchParams();
    if (params?.category) query.append("category", params.category);
    if (params?.clubType) query.append("club_type", params.clubType);
    if (params?.keyword) query.append("keyword", params.keyword);
    const qs = query.toString();
    return fetchApi<ClubItem[]>(`/explore/clubs${qs ? `?${qs}` : ""}`);
  },
  getClubCategories: () => fetchApi<ClubCategorySummary[]>("/explore/clubs/categories"),
  getClubDetail: (id: string) => fetchApi<ClubItem>(`/explore/clubs/${encodeURIComponent(id)}`),
};

// Admin API
export const adminApi = {
  login: async (username: string, password: string) => {
    const res = await fetchApi<{ access_token: string; token_type: string; username: string; role: string }>(
      "/admin/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }
    );
    if (typeof window !== "undefined" && res.access_token) {
      localStorage.setItem("ncu_admin_token", res.access_token);
    }
    return res;
  },
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("ncu_admin_token");
    }
  },
  getMe: () =>
    fetchApi<{ username: string; role: string; is_authenticated: boolean }>("/admin/auth/me"),
  getDashboard: () => fetchApi<any>("/admin/dashboard"),
  getConfig: () => fetchApi<any>("/admin/config"),
  updateConfig: (data: any) =>
    fetchApi<any>("/admin/config", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  getEvents: () => fetchApi<any[]>("/admin/events"),
  createEvent: (eventData: any) =>
    fetchApi<any>("/admin/events", {
      method: "POST",
      body: JSON.stringify(eventData),
    }),
  updateEvent: (id: string, eventData: any) =>
    fetchApi<any>(`/admin/events/${id}`, {
      method: "PUT",
      body: JSON.stringify(eventData),
    }),
  deleteEvent: (id: string) =>
    fetchApi<any>(`/admin/events/${id}`, {
      method: "DELETE",
    }),
  testSandbox: (data: { event_prompt: string; preset_options: any[]; location_id?: string }) =>
    fetchApi<any>("/admin/events/sandbox", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getActivities: () => fetchApi<CampusActivity[]>("/admin/activities"),
  createActivity: (activityData: Partial<CampusActivity>) =>
    fetchApi<CampusActivity>("/admin/activities", {
      method: "POST",
      body: JSON.stringify(activityData),
    }),
  updateActivity: (id: string, activityData: Partial<CampusActivity>) =>
    fetchApi<CampusActivity>(`/admin/activities/${id}`, {
      method: "PUT",
      body: JSON.stringify(activityData),
    }),
  deleteActivity: (id: string) =>
    fetchApi<any>(`/admin/activities/${id}`, {
      method: "DELETE",
    }),
  seedDefaultActivities: () =>
    fetchApi<CampusActivity[]>("/admin/activities/seed-defaults", {
      method: "POST",
    }),
  testActivitySandbox: (data: {
    event_prompt: string;
    preset_options: any[];
    location_id?: string;
    slot?: string;
  }) =>
    fetchApi<any>("/admin/activities/sandbox", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  syncVectors: () =>
    fetchApi<any>("/admin/courses/sync", {
      method: "POST",
    }),
  getModelInfo: () =>
    fetchApi<{
      exists: boolean;
      filename: string;
      file_size_bytes: number;
      file_size_formatted: string;
      last_modified: string | null;
      has_backup: boolean;
      backup_size_formatted: string;
      backup_last_modified: string | null;
    }>("/admin/model/info"),
  uploadModel: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return fetchApi<{
      status: string;
      message: string;
      filename: string;
      size_bytes: number;
      size_formatted: string;
      backup_created: boolean;
      updated_at: string;
    }>("/admin/model/upload", {
      method: "POST",
      body: formData,
    });
  },
  getVectorSpaceStats: () => fetchApi<any>("/admin/vector-space/stats"),
  getVectorSpaceData: () => fetchApi<any>("/admin/vector-space/data"),
  projectVectorQuery: (data: {
    query: string;
    top_k?: number;
    semester?: string;
    department?: string;
  }) =>
    fetchApi<{
      query: string;
      coord: [number, number, number];
      nearest_courses: Array<{
        id: string;
        name: string;
        dept: string;
        teacher: string;
        similarity: number;
        distance: number;
        x: number;
        y: number;
        z: number;
      }>;
    }>("/admin/vector-space/project", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
