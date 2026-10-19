import { create } from "zustand";

export interface BuildingData {
  id: string;
  name: string;
  category: string;
  three_mesh_name?: string;
  camera_pos?: { pos: [number, number, number]; target: [number, number, number] };
  short_desc: string;
  full_content?: string;
  image_url?: string;
}

interface MapState {
  selectedBuildingId: string | null;
  cameraTarget: [number, number, number];
  cameraPosition: [number, number, number];
  isDrawerOpen: boolean;
  filterCategory: string | null;

  selectBuilding: (id: string | null, cameraPos?: { pos: [number, number, number]; target: [number, number, number] }) => void;
  closeDrawer: () => void;
  setFilterCategory: (category: string | null) => void;
  resetCamera: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  selectedBuildingId: null,
  cameraPosition: [0, 60, 60],
  cameraTarget: [0, 0, 0],
  isDrawerOpen: false,
  filterCategory: null,

  selectBuilding: (id, cameraPos) => {
    if (!id) {
      set({ selectedBuildingId: null, isDrawerOpen: false });
      return;
    }
    if (cameraPos) {
      set({
        selectedBuildingId: id,
        cameraPosition: cameraPos.pos,
        cameraTarget: cameraPos.target,
        isDrawerOpen: true,
      });
    } else {
      set({ selectedBuildingId: id, isDrawerOpen: true });
    }
  },

  closeDrawer: () => set({ isDrawerOpen: false }),

  setFilterCategory: (category) => set({ filterCategory: category }),

  resetCamera: () =>
    set({
      selectedBuildingId: null,
      cameraPosition: [0, 60, 60],
      cameraTarget: [0, 0, 0],
      isDrawerOpen: false,
    }),
}));
