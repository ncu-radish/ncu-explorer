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

export interface MapRoute {
  fromId: string;
  toId: string;
  distance: number;
  path: [number, number, number][];
  /** true = walk the route once, then remove it (simulator commute). */
  once?: boolean;
}

/** 3D 場景裡標記沿路線行走的速度（場景單位／秒）。 */
export const WALK_SPEED = 60;
/** 抵達目的地後標記停留的秒數。 */
export const WALK_PAUSE_SECONDS = 0.8;
/** 後端 walking_minutes 使用的步行速度（公尺／分鐘）。 */
export const WALK_METERS_PER_MIN = 80;

/** 標記走完整條路線（含停留）實際花的真實秒數。 */
export function routeWalkSeconds(path: [number, number, number][]): number {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const [x0, y0, z0] = path[i - 1];
    const [x1, y1, z1] = path[i];
    total += Math.hypot(x1 - x0, y1 - y0, z1 - z0);
  }
  return total / WALK_SPEED + WALK_PAUSE_SECONDS;
}

interface MapState {
  routeOriginId: string | null;
  route: MapRoute | null;
  setRouteOrigin: (id: string | null) => void;
  setRoute: (route: MapRoute | null) => void;

  selectedBuildingId: string | null;
  hoveredBuildingId: string | null;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  isDrawerOpen: boolean;
  filterCategory: string | null;
  searchQuery: string;
  resetTrigger: number;
  focusTrigger: number;

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
  routeOriginId: null,
  route: null,
  setRouteOrigin: (id) => set({ routeOriginId: id }),
  setRoute: (route) => set({ route }),
  selectedBuildingId: null,
  hoveredBuildingId: null,
  cameraPosition: DEFAULT_CAMERA_POS,
  cameraTarget: DEFAULT_CAMERA_TARGET,
  isDrawerOpen: false,
  filterCategory: null,
  searchQuery: "",
  resetTrigger: 0,
  focusTrigger: 0,

  selectBuilding: (id) => {
    if (!id) {
      set({ selectedBuildingId: null, isDrawerOpen: false });
    } else {
      set((state) => ({
        selectedBuildingId: id,
        isDrawerOpen: true,
        focusTrigger: state.focusTrigger + 1,
      }));
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
