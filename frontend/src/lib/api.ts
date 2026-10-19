const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API Error [${res.status}]: ${errorText || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// Simulator API
export const simApi = {
  start: (userInput: string) =>
    fetchApi<any>("/sim/start", {
      method: "POST",
      body: JSON.stringify({ user_input: userInput }),
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
};

// Course Explorer API
export const courseApi = {
  search: (params: {
    dept?: string;
    grade?: number;
    category?: string;
    day?: number;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const query = new URLSearchParams();
    if (params.dept) query.append("dept", params.dept);
    if (params.grade !== undefined && params.grade !== null) query.append("grade", params.grade.toString());
    if (params.category) query.append("category", params.category);
    if (params.day) query.append("day", params.day.toString());
    if (params.keyword) query.append("keyword", params.keyword);
    if (params.page) query.append("page", params.page.toString());
    if (params.pageSize) query.append("page_size", params.pageSize.toString());
    return fetchApi<any>(`/courses/search?${query.toString()}`);
  },
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

// Explore & 3D Map API
export const exploreApi = {
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
  getClubs: (clubType?: string) => {
    const query = clubType ? `?club_type=${clubType}` : "";
    return fetchApi<any[]>(`/explore/clubs${query}`);
  },
};

// Admin API
export const adminApi = {
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
  syncVectors: () =>
    fetchApi<any>("/admin/courses/sync", {
      method: "POST",
    }),
};
