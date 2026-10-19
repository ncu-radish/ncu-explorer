import { create } from "zustand";
import { simApi } from "@/lib/api";

export interface ScheduleSlot {
  day: number;
  slot: "morning" | "afternoon" | "evening";
  title: string;
  type: "course" | "club" | "free";
  location_id?: string;
  location_name?: string;
  course_id?: string;
  club_id?: string;
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
  stats: Stats;
  story: StoryState | null;
  currentLocationId: string | null;
  currentLocationName: string | null;
  isGameOver: boolean;
  summary: any | null;
  isLoading: boolean;
  historyLogs: string[];
  error: string | null;

  startSimulation: (userInput: string) => Promise<void>;
  chooseOption: (optionKey: string) => Promise<void>;
  fetchSummary: () => Promise<void>;
  resetSimulation: () => void;
}

export const useSimulatorStore = create<SimulatorState>((set, get) => ({
  sessionId: null,
  playerProfile: null,
  weeklySchedule: [],
  currentTurn: 0,
  stats: { stamina: 80, study: 50, social: 50, money: 1500 },
  story: null,
  currentLocationId: null,
  currentLocationName: null,
  isGameOver: false,
  summary: null,
  isLoading: false,
  historyLogs: [],
  error: null,

  startSimulation: async (userInput: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await simApi.start(userInput);
      set({
        sessionId: data.session_id,
        playerProfile: data.player_profile,
        weeklySchedule: data.weekly_schedule,
        currentTurn: data.current_turn,
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
          stats: data.stats,
          isLoading: false,
        });
        await get().fetchSummary();
      } else {
        set({
          currentTurn: data.current_turn,
          stats: data.stats,
          story: data.story,
          currentLocationId: data.current_location_id,
          currentLocationName: data.current_location_name,
          isLoading: false,
        });
      }
    } catch (err: any) {
      set({ error: err.message || "選擇行動時發生錯誤", isLoading: false });
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
