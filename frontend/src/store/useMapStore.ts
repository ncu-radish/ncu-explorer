import { create } from "zustand";

export interface BuildingData {
  id: string;
  name_zh: string;
  name_en?: string | null;
  category?: string | null;
  classroom_code?: string | null;
  departments?: string[];
  alias?: string | null;
  description?: string | null;
}

interface MapState {
  selectedBuildingId: string | null;
  hoveredBuildingId: string | null;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  isDrawerOpen: boolean;
  filterCategory: string | null;
  searchQuery: string;
  resetTrigger: number;

  selectBuilding: (id: string | null) => void;
  setHoveredBuilding: (id: string | null) => void;
  setCameraTarget: (target: [number, number, number], pos?: [number, number, number]) => void;
  closeDrawer: () => void;
  openDrawer: () => void;
  setFilterCategory: (category: string | null) => void;
  setSearchQuery: (query: string) => void;
  resetCamera: () => void;
}

export const DEFAULT_CAMERA_POS: [number, number, number] = [0, 480, 520];
export const DEFAULT_CAMERA_TARGET: [number, number, number] = [0, 0, 0];

export const useMapStore = create<MapState>((set) => ({
  selectedBuildingId: null,
  hoveredBuildingId: null,
  cameraPosition: DEFAULT_CAMERA_POS,
  cameraTarget: DEFAULT_CAMERA_TARGET,
  isDrawerOpen: false,
  filterCategory: null,
  searchQuery: "",
  resetTrigger: 0,

  selectBuilding: (id) => {
    if (!id) {
      set({ selectedBuildingId: null, isDrawerOpen: false });
    } else {
      set({ selectedBuildingId: id, isDrawerOpen: true });
    }
  },

  setHoveredBuilding: (id) => set({ hoveredBuildingId: id }),

  setCameraTarget: (target, pos) => {
    set((state) => ({
      cameraTarget: target,
      cameraPosition: pos || state.cameraPosition,
    }));
  },

  closeDrawer: () => set({ isDrawerOpen: false }),
  openDrawer: () => set({ isDrawerOpen: true }),

  setFilterCategory: (category) => set({ filterCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  resetCamera: () =>
    set((state) => ({
      selectedBuildingId: null,
      cameraPosition: DEFAULT_CAMERA_POS,
      cameraTarget: DEFAULT_CAMERA_TARGET,
      isDrawerOpen: false,
      resetTrigger: state.resetTrigger + 1,
    })),
}));
