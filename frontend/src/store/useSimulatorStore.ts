import { create } from "zustand";
import { simApi } from "@/lib/api";

export interface ScheduleSlot {
  day: number;
  slot: string;
  title: string;
  type: "course" | "club" | "lunch" | "dorm" | "free" | "breakfast" | "dinner" | "campus_leisure" | string;
  location_id?: string;
  location_name?: string;
  course_id?: string;
  course_code?: string;
  course_category?: string;
  credits?: number;
  instructor?: string;
  raw_schedule?: string;
  time_label?: string;
  periods?: string[];
  club_id?: string;
  start_time?: string;
  end_time?: string;
  display_time?: string;
}

export interface OptionItem {
  option_key: string;
  display_text: string;
}

export interface StoryState {
  narrative: string;
  options: OptionItem[];
}

export interface Stats {
  stamina: number;
  study: number;
  social: number;
  money: number;
}

interface SimulatorState {
  sessionId: string | null;
  playerProfile: any | null;
  weeklySchedule: ScheduleSlot[];
  currentTurn: number;
  currentTime: string;
  currentDay: number;
  stats: Stats;
  story: StoryState | null;
  currentLocationId: string | null;
  currentLocationName: string | null;
  isGameOver: boolean;
  summary: any | null;
  isLoading: boolean;
  historyLogs: string[];
  error: string | null;

  startSimulation: (userInput: string, department?: string, grade?: number) => Promise<void>;
  chooseOption: (optionKey: string) => Promise<void>;
  triggerDynamicActivity: (
    activityId: string,
    optionKey?: string,
    durationHours?: number,
    customTitle?: string,
    durationMinutes?: number,
    customEndTime?: string
  ) => Promise<any>;
  prePlanTomorrow: (
    targetDay: number,
    slots: any[],
    sleepTime?: string,
    alarmTime?: string
  ) => Promise<any>;
  fetchSummary: () => Promise<void>;
  resetSimulation: () => void;
}

export const useSimulatorStore = create<SimulatorState>((set, get) => ({
  sessionId: null,
  playerProfile: null,
  weeklySchedule: [],
  currentTurn: 0,
  currentTime: "08:00",
  currentDay: 1,
  stats: { stamina: 80, study: 50, social: 50, money: 1500 },
  story: null,
  currentLocationId: null,
  currentLocationName: null,
  isGameOver: false,
  summary: null,
  isLoading: false,
  historyLogs: [],
  error: null,

  startSimulation: async (userInput: string, department?: string, grade?: number) => {
    set({ isLoading: true, error: null });
    try {
      const data = await simApi.start(userInput, department, grade);
      set({
        sessionId: data.session_id,
        playerProfile: data.player_profile,
        weeklySchedule: data.weekly_schedule,
        currentTurn: data.current_turn,
        currentTime: data.current_time || "08:00",
        currentDay: data.current_day || 1,
        stats: data.stats,
        story: data.current_story,
        currentLocationId: data.current_location_id,
        currentLocationName: data.current_location_name,
        isGameOver: false,
        summary: null,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message || "啟動模擬遊戲失敗", isLoading: false });
    }
  },

  chooseOption: async (optionKey: string) => {
    const { sessionId } = get();
    if (!sessionId) return;

    set({ isLoading: true, error: null });
    try {
      const data = await simApi.nextTurn(sessionId, optionKey);
      if (data.is_game_over) {
        set({
          isGameOver: true,
          currentTime: data.current_time || "22:00",
          currentDay: data.current_day || 5,
          stats: data.stats,
          weeklySchedule: data.weekly_schedule || get().weeklySchedule,
          isLoading: false,
        });
        await get().fetchSummary();
      } else {
        set({
          currentTurn: data.current_turn,
          currentTime: data.current_time || get().currentTime,
          currentDay: data.current_day || get().currentDay,
          stats: data.stats,
          story: data.story,
          currentLocationId: data.current_location_id,
          currentLocationName: data.current_location_name,
          weeklySchedule: data.weekly_schedule || get().weeklySchedule,
          isLoading: false,
        });
      }
    } catch (err: any) {
      set({ error: err.message || "選擇行動時發生錯誤", isLoading: false });
    }
  },

  triggerDynamicActivity: async (
    activityId: string,
    optionKey: string = "A",
    durationHours: number = 1,
    customTitle?: string,
    durationMinutes?: number,
    customEndTime?: string
  ) => {
    const { sessionId } = get();
    if (!sessionId) return;

    set({ isLoading: true, error: null });
    try {
      const res = await simApi.triggerActivity(
        sessionId,
        activityId,
        optionKey,
        durationHours,
        customTitle,
        durationMinutes,
        customEndTime
      );
      if ((res as any).is_game_over) {
        set({
          isGameOver: true,
          weeklySchedule: res.weekly_schedule,
          stats: res.stats,
          isLoading: false,
        });
        await get().fetchSummary();
      } else {
        set({
          currentTurn: (res as any).current_turn !== undefined ? (res as any).current_turn : get().currentTurn,
          currentTime: (res as any).current_time || get().currentTime,
          currentDay: (res as any).current_day || get().currentDay,
          weeklySchedule: res.weekly_schedule,
          stats: res.stats,
          story: (res as any).story || get().story,
          currentLocationId: res.current_location_id || get().currentLocationId,
          currentLocationName: res.current_location_name || get().currentLocationName,
          isLoading: false,
        });
      }
      return res;
    } catch (err: any) {
      set({ error: err.message || "觸發活動失敗", isLoading: false });
      throw err;
    }
  },

  prePlanTomorrow: async (
    targetDay: number,
    slots: any[],
    sleepTime?: string,
    alarmTime?: string
  ) => {
    const { sessionId } = get();
    if (!sessionId) return;

    set({ isLoading: true, error: null });
    try {
      const res = await simApi.prePlanTomorrow(sessionId, targetDay, slots, sleepTime, alarmTime);
      const currSlot = res.weekly_schedule?.[res.current_turn];
      set({
        currentTurn: res.current_turn,
        weeklySchedule: res.weekly_schedule,
        stats: res.stats,
        story: res.story,
        currentTime: res.current_time || currSlot?.start_time || alarmTime || "07:30",
        currentDay: res.current_day || currSlot?.day || targetDay,
        currentLocationId: res.current_location_id || get().currentLocationId,
        currentLocationName: res.current_location_name || get().currentLocationName,
        isLoading: false,
      });
      return res;
    } catch (err: any) {
      set({ error: err.message || "預排明日活動失敗", isLoading: false });
      throw err;
    }
  },

  fetchSummary: async () => {
    const { sessionId } = get();
    if (!sessionId) return;
    set({ isLoading: true });
    try {
      const data = await simApi.getSummary(sessionId);
      set({ summary: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || "讀取結算報告失敗", isLoading: false });
    }
  },

  resetSimulation: () => {
    set({
      sessionId: null,
      playerProfile: null,
      weeklySchedule: [],
      currentTurn: 0,
      currentTime: "08:00",
      currentDay: 1,
      stats: { stamina: 80, study: 50, social: 50, money: 1500 },
      story: null,
      currentLocationId: null,
      currentLocationName: null,
      isGameOver: false,
      summary: null,
      isLoading: false,
      historyLogs: [],
      error: null,
    });
  },
}));
