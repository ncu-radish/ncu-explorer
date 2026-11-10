"use client";

import React, { useRef, useState, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Html, Line } from "@react-three/drei";
import * as THREE from "three";
import {
  useMapStore,
  DEFAULT_CAMERA_POS,
  DEFAULT_CAMERA_TARGET,
  WALK_SPEED,
  WALK_PAUSE_SECONDS,
} from "@/store/useMapStore";
import { Building, RoadNetworkData, exploreApi } from "@/lib/api";

// Campus geometry center offset to bring the model origin to (0, 0, 0)
// Blender ground height Z = 0 corresponds directly to Three.js Y = 0
const CAMPUS_OFFSET: [number, number, number] = [-535.8, 0, 344.54];

// Category color palettes for subtle architectural clay materials
const CATEGORY_MATERIALS: Record<string, { color: string; emissive?: string }> = {
  teaching: { color: "#E8C48A" },   // Sand
  dorm: { color: "#E58FB5" },       // Pink
  function: { color: "#6F9BD9" },   // Blue
  sport: { color: "#6FCF97" },      // Green
  restaurant: { color: "#F28C52" }, // Orange
  youbike: { color: "#D4C27A" },    // Muted yellow
  bus: { color: "#B87671" },        // Muted brick
  view: { color: "#2F8FA8" },       // Teal
  street: { color: "#E0B04A" },     // Amber (food street entrance)
  default: { color: "#B8B4AC" },
};

interface BuildingBounds {
  center: THREE.Vector3;
  size: THREE.Vector3;
  topPoint: THREE.Vector3;
}

interface CampusModelProps {
  buildings: Building[];
  onSelectBuilding: (id: string) => void;
  onBoundsComputed: (boundsMap: Map<string, BuildingBounds>) => void;
  /** Light up buildings of this category and dim the rest. */
  highlightCategory?: string;
  /** Only buildings of this category react to hover / click. */
  selectableCategory?: string;
}

const HIGHLIGHT_STYLE = { color: "#4ADE80", emissive: "#22C55E" };
const DIM_STYLE = { color: "#3A4050" };

function CampusModel({
  buildings,
  onSelectBuilding,
  onBoundsComputed,
  highlightCategory,
  selectableCategory,
}: CampusModelProps) {
  const { scene: sharedScene } = useGLTF("/models/campus_buildings.glb");
  // useGLTF caches one scene graph for the whole app. An Object3D can only have one parent,
  // so every <CampusScene> (map page, simulator PiP, activity modal) needs its own copy;
  // otherwise mounting a second scene steals the model from the first one.
  const scene = useMemo(() => sharedScene.clone(true), [sharedScene]);
  const { selectedBuildingId, hoveredBuildingId, setHoveredBuilding } = useMapStore();
  const groupRef = useRef<THREE.Group>(null);

  // Map building ID to metadata for fast lookup
  const buildingMap = useMemo(() => {
    const map = new Map<string, Building>();
    buildings.forEach((b) => map.set(b.id, b));
    return map;
  }, [buildings]);

  // Compute world bounds for every building mesh once the model is loaded
  const boundsMap = useMemo(() => {
    const map = new Map<string, BuildingBounds>();
    if (!scene) return map;

    // Apply offset group transform temporarily to compute real world bounds
    const tempGroup = new THREE.Group();
    tempGroup.position.set(...CAMPUS_OFFSET);
    tempGroup.add(scene.clone());
    tempGroup.updateMatrixWorld(true);

    tempGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && child.name) {
        const box = new THREE.Box3().setFromObject(child);
        const center = new THREE.Vector3();
        box.getCenter(center);
        const size = new THREE.Vector3();
        box.getSize(size);
        const topPoint = new THREE.Vector3(center.x, box.max.y, center.z);
        map.set(child.name, { center, size, topPoint });
      }
    });

    return map;
  }, [scene]);

  useEffect(() => {
    if (boundsMap.size > 0) {
      onBoundsComputed(boundsMap);
    }
  }, [boundsMap, onBoundsComputed]);

  // Cache materials to avoid continuous re-instantiation
  const materials = useMemo(() => {
    const cache = new Map<string, THREE.MeshStandardMaterial>();

    // Pre-create highlight materials
    const selectedMat = new THREE.MeshStandardMaterial({
      color: "#7C3AED",
      roughness: 0.35,
      metalness: 0.1,
      emissive: "#6D28D9",
      emissiveIntensity: 0.35,
    });

    const hoveredMat = new THREE.MeshStandardMaterial({
      color: "#A78BFA",
      roughness: 0.4,
      metalness: 0.05,
      emissive: "#8B5CF6",
      emissiveIntensity: 0.2,
    });

    return { cache, selectedMat, hoveredMat };
  }, []);

  // Update materials when selection or hover changes
  useEffect(() => {
    if (!scene) return;

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && child.name) {
        const mesh = child as THREE.Mesh;
        const bldgId = mesh.name;
        const inScope =
          !selectableCategory || buildingMap.get(bldgId)?.category === selectableCategory;
        const isSelected = inScope && bldgId === selectedBuildingId;
        const isHovered = inScope && bldgId === hoveredBuildingId;

        if (isSelected) {
          mesh.material = materials.selectedMat;
        } else if (isHovered) {
          mesh.material = materials.hoveredMat;
        } else {
          // Base material based on building category
          const bldg = buildingMap.get(bldgId);
          const baseCat = bldg?.category || "default";
          // In highlight mode every building is either lit or dimmed
          const cat = highlightCategory
            ? baseCat === highlightCategory
              ? "__highlight"
              : "__dim"
            : baseCat;
          const config: { color: string; emissive?: string } =
            cat === "__highlight"
              ? HIGHLIGHT_STYLE
              : cat === "__dim"
                ? DIM_STYLE
                : CATEGORY_MATERIALS[cat] || CATEGORY_MATERIALS.default;

          if (!materials.cache.has(cat)) {
            materials.cache.set(
              cat,
              new THREE.MeshStandardMaterial({
                color: config.color,
                roughness: 0.6,
                metalness: 0.05,
                ...(config.emissive
                  ? { emissive: config.emissive, emissiveIntensity: 0.45 }
                  : {}),
              })
            );
          }
          mesh.material = materials.cache.get(cat)!;
        }

        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
  }, [scene, selectedBuildingId, hoveredBuildingId, buildingMap, materials, highlightCategory, selectableCategory]);

  const isSelectable = (name?: string) =>
    !selectableCategory || (!!name && buildingMap.get(name)?.category === selectableCategory);

  return (
    <group
      ref={groupRef}
      position={CAMPUS_OFFSET}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (!isSelectable(e.object?.name)) return;
        if (e.object && e.object.name) {
          document.body.style.cursor = "pointer";
          setHoveredBuilding(e.object.name);
        }
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "auto";
        setHoveredBuilding(null);
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (!isSelectable(e.object?.name)) return;
        if (e.object && e.object.name) {
          onSelectBuilding(e.object.name);
        }
      }}
    >
      <primitive object={scene} />
    </group>
  );
}

// 3D Floating Beacon / Pin above selected building
function SelectedBuildingBeacon({
  bounds,
  building,
  showLabel = true,
}: {
  bounds?: BuildingBounds;
  building?: Building;
  showLabel?: boolean;
}) {
  const pinRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (pinRef.current) {
      const t = state.clock.getElapsedTime();
      pinRef.current.position.y = (bounds?.topPoint.y || 15) + 6 + Math.sin(t * 3) * 1.5;
      pinRef.current.rotation.y = t * 1.5;
    }
  });

  if (!building) return null;
  const posX = bounds?.center.x ?? 0;
  const posZ = bounds?.center.z ?? 0;

  return (
    <group position={[posX, 0, posZ]}>
      <group ref={pinRef}>
        {/* Diamond beacon */}
        <mesh>
          <octahedronGeometry args={[2.5, 0]} />
          <meshStandardMaterial
            color="#7C3AED"
            emissive="#8B5CF6"
            emissiveIntensity={0.6}
            roughness={0.2}
          />
        </mesh>

        {/* Floating HTML Tag */}
        {showLabel && (
        <Html position={[0, 4.5, 0]} center distanceFactor={140} zIndexRange={[100, 0]}>
          <div className="pointer-events-none select-none flex flex-col items-center">
            <div className="bg-stone-900/90 text-white px-3 py-1 rounded-lg text-xs font-semibold shadow-lg backdrop-blur-xs flex items-center gap-1.5 whitespace-nowrap border border-stone-700">
              {building.classroom_code && (
                <span className="bg-violet-600 text-white text-xs font-mono px-1.5 py-0.5 rounded">
                  {building.classroom_code}
                </span>
              )}
              <span>{building.name_zh}</span>
            </div>
            <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-stone-900/90" />
          </div>
        </Html>
        )}
      </group>
    </group>
  );
}

// The whole road network drawn as flat ribbons with a real width.
// (The planned route is drawn separately as a thin line.)
const ROAD_WIDTH = 6; // scene units (~meters)
const ROAD_LIFT = 0.15; // above the ground plane, below the route line
const ROAD_COLOR = "#5A6378";
const JOINT_SEGMENTS = 12;

function RoadNetworkLayer() {
  const [network, setNetwork] = useState<RoadNetworkData | null>(null);

  useEffect(() => {
    exploreApi.getRoadNetwork().then(setNetwork).catch(console.error);
  }, []);

  const geometry = useMemo(() => {
    if (!network || network.segments.length === 0) return null;
    const half = ROAD_WIDTH / 2;
    const pos: number[] = [];
    const joints = new Map<string, [number, number, number]>();

    for (const [a, b] of network.segments) {
      const dx = b[0] - a[0];
      const dz = b[2] - a[2];
      const len = Math.hypot(dx, dz);
      if (len < 1e-6) continue;
      const nx = (-dz / len) * half;
      const nz = (dx / len) * half;
      const y = a[1] + ROAD_LIFT;
      const y2 = b[1] + ROAD_LIFT;
      // two triangles forming the ribbon quad
      pos.push(a[0] + nx, y, a[2] + nz, a[0] - nx, y, a[2] - nz, b[0] + nx, y2, b[2] + nz);
      pos.push(a[0] - nx, y, a[2] - nz, b[0] - nx, y2, b[2] - nz, b[0] + nx, y2, b[2] + nz);
      for (const p of [a, b]) joints.set(`${p[0].toFixed(2)},${p[2].toFixed(2)}`, p);
    }

    // round joints so bends and junctions have no gaps
    joints.forEach((p) => {
      const y = p[1] + ROAD_LIFT;
      for (let i = 0; i < JOINT_SEGMENTS; i++) {
        const t0 = (i / JOINT_SEGMENTS) * Math.PI * 2;
        const t1 = ((i + 1) / JOINT_SEGMENTS) * Math.PI * 2;
        pos.push(
          p[0], y, p[2],
          p[0] + Math.cos(t0) * half, y, p[2] + Math.sin(t0) * half,
          p[0] + Math.cos(t1) * half, y, p[2] + Math.sin(t1) * half
        );
      }
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    return geo;
  }, [network]);

  useEffect(() => () => geometry?.dispose(), [geometry]);

  if (!geometry) return null;
  return (
    <mesh geometry={geometry} raycast={() => null} renderOrder={1}>
      <meshBasicMaterial color={ROAD_COLOR} side={THREE.DoubleSide} />
    </mesh>
  );
}

// Route line along the road network with a marker walking along it
const ROUTE_LIFT = 0.8; // keep the line above the ground plane

function RouteLayer() {
  const route = useMapStore((s) => s.route);
  const markerRef = useRef<THREE.Mesh>(null);

  const { points, cumulative, total } = useMemo(() => {
    const pts = (route?.path ?? []).map(([x, y, z]) => new THREE.Vector3(x, y + ROUTE_LIFT, z));
    const cum = [0];
    for (let i = 1; i < pts.length; i++) {
      cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
    }
    return { points: pts, cumulative: cum, total: cum[cum.length - 1] ?? 0 };
  }, [route]);

  // One-shot routes (simulator commute) start from zero and remove themselves on arrival
  const startRef = useRef<number | null>(null);
  useEffect(() => {
    startRef.current = null;
  }, [route]);

  useFrame((state) => {
    const marker = markerRef.current;
    if (!marker || points.length < 2 || total <= 0) return;
    const pause = WALK_PAUSE_SECONDS; // seconds to rest at the destination
    const duration = total / WALK_SPEED;
    const now = state.clock.getElapsedTime();
    let t: number;
    if (route?.once) {
      if (startRef.current === null) startRef.current = now;
      t = now - startRef.current;
      if (t >= duration + pause) {
        useMapStore.getState().setRoute(null);
        return;
      }
    } else {
      t = now % (duration + pause);
    }
    const dist = Math.min(t / duration, 1) * total;
    let i = 1;
    while (i < cumulative.length - 1 && cumulative[i] < dist) i++;
    const segLen = cumulative[i] - cumulative[i - 1] || 1;
    const k = (dist - cumulative[i - 1]) / segLen;
    marker.position.lerpVectors(points[i - 1], points[i], Math.min(Math.max(k, 0), 1));
    marker.position.y += 2.2;
  });

  if (!route || points.length < 2) return null;

  return (
    <group>
      <Line points={points} color="#7C3AED" lineWidth={5} />
      <mesh ref={markerRef}>
        <sphereGeometry args={[2.2, 16, 16]} />
        <meshStandardMaterial color="#F5F3FF" emissive="#8B5CF6" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

// Hover Tooltip Tag
function HoverTooltip({
  bounds,
  building,
}: {
  bounds?: BuildingBounds;
  building?: Building;
}) {
  if (!bounds || !building) return null;

  return (
    <group position={[bounds.center.x, bounds.topPoint.y + 4, bounds.center.z]}>
      <Html center distanceFactor={140} zIndexRange={[50, 0]}>
        <div className="pointer-events-none select-none flex flex-col items-center animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-white/95 text-stone-900 px-2.5 py-1 rounded-md text-xs font-medium shadow-md border border-stone-300 flex items-center gap-1.5 whitespace-nowrap">
            {building.classroom_code && (
              <span className="bg-stone-100 text-stone-700 text-xs font-mono px-1 rounded border border-stone-200">
                {building.classroom_code}
              </span>
            )}
            <span>{building.name_zh}</span>
            {building.alias && (
              <span className="text-xs text-stone-600">({building.alias})</span>
            )}
          </div>
        </div>
      </Html>
    </group>
  );
}

// Camera Rig for smooth interpolation and OrbitControls
function CameraController({
  targetPos,
  targetLookAt,
  animationKey,
}: {
  targetPos: THREE.Vector3;
  targetLookAt: THREE.Vector3;
  animationKey: string;
}) {
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const { camera } = useThree();

  const animRef = useRef({
    startPos: new THREE.Vector3(),
    endPos: new THREE.Vector3(),
    startTarget: new THREE.Vector3(),
    endTarget: new THREE.Vector3(),
    duration: 0.75,
    elapsed: 0,
    active: false,
  });

  const lastKeyRef = useRef<string>("");

  useEffect(() => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;

    // Avoid duplicate triggers for the exact same animation key
    if (animationKey === lastKeyRef.current) return;
    lastKeyRef.current = animationKey;

    animRef.current = {
      startPos: camera.position.clone(),
      endPos: targetPos.clone(),
      startTarget: controls.target.clone(),
      endTarget: targetLookAt.clone(),
      duration: 0.75,
      elapsed: 0,
      active: true,
    };
  }, [animationKey, targetPos, targetLookAt, camera]);

  // Cancel flight on any user interaction so the user has immediate, full control
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const handleUserInteraction = () => {
      if (animRef.current.active) {
        animRef.current.active = false;
      }
    };

    controls.addEventListener("start", handleUserInteraction);
    return () => {
      controls.removeEventListener("start", handleUserInteraction);
    };
  }, []);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;
    const anim = animRef.current;

    if (anim.active) {
      anim.elapsed += delta;
      const t = Math.min(anim.elapsed / anim.duration, 1);
      // Smooth cubic ease-out
      const ease = 1 - Math.pow(1 - t, 3);

      camera.position.lerpVectors(anim.startPos, anim.endPos, ease);
      controls.target.lerpVectors(anim.startTarget, anim.endTarget, ease);

      if (t >= 1) {
        camera.position.copy(anim.endPos);
        controls.target.copy(anim.endTarget);
        anim.active = false;
      }
    }

    // Always update controls on frame so damping and user gestures work smoothly
    controls.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      maxPolarAngle={Math.PI / 2.05} // Don't allow camera under ground
      minDistance={15}
      maxDistance={1400}
    />
  );
}

interface CampusSceneProps {
  buildings?: Building[];
  onSelectBuilding?: (id: string) => void;
  focusedLocationId?: string | null;
  interactive?: boolean;
  /** Light up this category and dim everything else (e.g. "sport"). */
  highlightCategory?: string;
  /** Only this category can be hovered / clicked. */
  selectableCategory?: string;
  /** false = always show the whole campus instead of zooming to the selection. */
  fitSelection?: boolean;
  /** false = hide the planned route overlay. */
  showRoute?: boolean;
  /** false = no floating HTML name tags (used in the modal map). */
  showLabels?: boolean;
  /** Look straight down at the highlighted buildings (used for picking a venue). */
  topDown?: boolean;
}

export function CampusScene({
  buildings: propBuildings,
  onSelectBuilding,
  focusedLocationId,
  highlightCategory,
  selectableCategory,
  fitSelection = true,
  showRoute = true,
  showLabels = true,
  topDown = false,
}: CampusSceneProps) {
  const {
    selectedBuildingId,
    selectBuilding,
    hoveredBuildingId,
    resetTrigger,
    focusTrigger,
    route,
  } = useMapStore();
  const [internalBuildings, setInternalBuildings] = useState<Building[]>([]);
  const [extraBuilding, setExtraBuilding] = useState<Building | null>(null);
  const [boundsMap, setBoundsMap] = useState<Map<string, BuildingBounds>>(new Map());

  // If buildings not passed, fetch them automatically
  useEffect(() => {
    if (!propBuildings || propBuildings.length === 0) {
      exploreApi.getBuildings().then(setInternalBuildings).catch(console.error);
    }
  }, [propBuildings]);

  const buildings = propBuildings && propBuildings.length > 0 ? propBuildings : internalBuildings;

const LEGACY_OR_CODE_TO_BLDG: Record<string, string> = {
  loc_mgt2: "bldg_mgmt_2",
  loc_eng5: "bldg_eng_5",
  loc_sci5: "bldg_science_5",
  loc_teaching: "bldg_tr",
  loc_lib: "bldg_lib_main",
  loc_yiren: "bldg_yireng",
  loc_dorm_boy9: "bldg_dorm_b9a",
  loc_dorm_girl14: "bldg_dorm_g14",
  loc_pine_restaurant: "bldg_res_core",
  loc_bus_station: "bldg_bus_guard",
  loc_night_street: "bldg_street_night",
  loc_backgate: "bldg_street_back",
  I1: "bldg_mgmt_2",
  I: "bldg_mgmt_1",
  E6: "bldg_eng_5",
  E1: "bldg_eng_2",
  E2: "bldg_eng_m",
  E3: "bldg_eng_env",
  E: "bldg_eng_1",
  O: "bldg_general_edu",
  TR: "bldg_tr",
  M: "bldg_hong_jing",
  S4: "bldg_science_4",
  S5: "bldg_science_5",
  S1: "bldg_science_2",
  S: "bldg_science_1",
  A: "bldg_art_1",
  C2: "bldg_art_2",
  LS: "bldg_art_3",
  HK: "bldg_hk",
  YH: "bldg_yireng",
};

  // Sync focusedLocationId if provided by external caller (e.g. simulator)
  useEffect(() => {
    if (focusedLocationId !== undefined) {
      const resolved = (focusedLocationId && LEGACY_OR_CODE_TO_BLDG[focusedLocationId]) || focusedLocationId;
      selectBuilding(resolved);
    }
  }, [focusedLocationId, selectBuilding]);


  const handleSelect = (id: string) => {
    selectBuilding(id);
    if (onSelectBuilding) {
      onSelectBuilding(id);
    }
  };

  // Building metadata lookup
  const buildingMap = useMemo(() => {
    const map = new Map<string, Building>();
    buildings.forEach((b) => map.set(b.id, b));
    return map;
  }, [buildings]);

  // If selected building isn't in buildingMap (e.g. initial load before list loaded), fetch detail
  useEffect(() => {
    if (selectedBuildingId && !buildingMap.has(selectedBuildingId)) {
      exploreApi
        .getBuildingDetail(selectedBuildingId)
        .then(setExtraBuilding)
        .catch(() => setExtraBuilding(null));
    }
  }, [selectedBuildingId, buildingMap]);

  // Determine desired camera target and position
  const { targetPos, targetLookAt } = useMemo(() => {
    void resetTrigger;
    void focusTrigger;

    // Bird's-eye view framing every highlighted building
    if (topDown && highlightCategory) {
      let minX = Infinity;
      let maxX = -Infinity;
      let minZ = Infinity;
      let maxZ = -Infinity;
      boundsMap.forEach((b, id) => {
        if (buildingMap.get(id)?.category !== highlightCategory) return;
        minX = Math.min(minX, b.center.x - b.size.x / 2);
        maxX = Math.max(maxX, b.center.x + b.size.x / 2);
        minZ = Math.min(minZ, b.center.z - b.size.z / 2);
        maxZ = Math.max(maxZ, b.center.z + b.size.z / 2);
      });
      if (Number.isFinite(minX)) {
        const cx = (minX + maxX) / 2;
        const cz = (minZ + maxZ) / 2;
        // fov 45 => visible height = 0.83 * distance; assume a ~2:1 viewport for the width
        const fitH = (maxZ - minZ) / 0.83;
        const fitW = (maxX - minX) / (0.83 * 2);
        const height = Math.max(Math.max(fitH, fitW) * 1.25, 120);
        // tiny z offset keeps OrbitControls away from the exact pole
        return {
          targetPos: new THREE.Vector3(cx, height, cz + 0.5),
          targetLookAt: new THREE.Vector3(cx, 0, cz),
        };
      }
      return {
        targetPos: new THREE.Vector3(0, 800, 0.5),
        targetLookAt: new THREE.Vector3(0, 0, 0),
      };
    }

    if (!fitSelection) {
      return {
        targetPos: new THREE.Vector3(...DEFAULT_CAMERA_POS),
        targetLookAt: new THREE.Vector3(...DEFAULT_CAMERA_TARGET),
      };
    }

    // Fit the whole planned route in view (while its destination is the selected building)
    if (route && route.path.length >= 2 && selectedBuildingId === route.toId) {
      const xs = route.path.map((p) => p[0]);
      const zs = route.path.map((p) => p[2]);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minZ = Math.min(...zs);
      const maxZ = Math.max(...zs);
      const cx = (minX + maxX) / 2;
      const cz = (minZ + maxZ) / 2;
      const span = Math.max(maxX - minX, maxZ - minZ, 80);
      return {
        targetPos: new THREE.Vector3(cx + span * 0.25, span * 1.15 + 40, cz + span * 0.6),
        targetLookAt: new THREE.Vector3(cx, 0, cz),
      };
    }

    if (!selectedBuildingId || !boundsMap.has(selectedBuildingId)) {
      return {
        targetPos: new THREE.Vector3(...DEFAULT_CAMERA_POS),
        targetLookAt: new THREE.Vector3(...DEFAULT_CAMERA_TARGET),
      };
    }

    const bounds = boundsMap.get(selectedBuildingId)!;
    const { center, size } = bounds;
    const radius = Math.max(size.x, size.z, 35);

    // Flat objects (track, courts, lake...) get a steeper, near top-down view
    // instead of the default oblique one, which looks too horizontal for them.
    const isFlat = size.y < 3;
    const offset = isFlat ? radius * 0.9 : radius * 1.3;
    const height = isFlat
      ? Math.max(offset * Math.SQRT2 * 1.7, 60)
      : Math.max(size.y * 1.4, 45);

    const pos = new THREE.Vector3(
      center.x + offset,
      center.y + height,
      center.z + offset
    );
    const lookAt = new THREE.Vector3(center.x, center.y + 4, center.z);

    return { targetPos: pos, targetLookAt: lookAt };
  }, [selectedBuildingId, boundsMap, resetTrigger, focusTrigger, route, fitSelection, topDown, highlightCategory, buildingMap]);

  const animationKey = `${resetTrigger}-${focusTrigger}-${selectedBuildingId || "none"}-${route ? `${route.fromId}>${route.toId}` : "noroute"}-${
    boundsMap.size > 0 ? 1 : 0
  }`;

  const selectedBuilding = selectedBuildingId
    ? buildingMap.get(selectedBuildingId) || extraBuilding || undefined
    : undefined;
  const selectedBounds = selectedBuildingId ? boundsMap.get(selectedBuildingId) : undefined;

  const hoveredBuilding = hoveredBuildingId ? buildingMap.get(hoveredBuildingId) : undefined;
  const inScope = (b?: Building) => !selectableCategory || b?.category === selectableCategory;
  const hoveredBounds = hoveredBuildingId ? boundsMap.get(hoveredBuildingId) : undefined;

  return (
    <div className="w-full h-full relative select-none">
      <Canvas
        shadows
        camera={{
          position: DEFAULT_CAMERA_POS,
          fov: 45,
          near: 1,
          far: 3500,
        }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        style={{ background: "#1c2029" }}
      >
        {/* Warm Natural Lighting Setup */}
        <ambientLight intensity={0.75} color="#FFFDF7" />
        <hemisphereLight args={["#F6F3EE", "#DFDACF", 0.65]} />
        <directionalLight
          position={[350, 500, 250]}
          intensity={1.4}
          color="#FFFBF0"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={100}
          shadow-camera-far={1400}
          shadow-camera-left={-600}
          shadow-camera-right={600}
          shadow-camera-top={600}
          shadow-camera-bottom={-600}
          shadow-bias={-0.0005}
        />
        <directionalLight position={[-300, 200, -300]} intensity={0.3} color="#E8EEF5" />

        {/* Flat Warm Architectural Ground Plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
          <planeGeometry args={[2400, 2400]} />
          <meshStandardMaterial color="#262b36" roughness={0.95} metalness={0.0} />
        </mesh>

        {/* Subtle grid lines for depth perception */}
        <gridHelper args={[1400, 70, "#3a4150", "#2f3542"]} position={[0, -0.02, 0]} />

        {/* Campus 3D Model */}
        <CampusModel
          buildings={buildings}
          onSelectBuilding={handleSelect}
          onBoundsComputed={setBoundsMap}
          highlightCategory={highlightCategory}
          selectableCategory={selectableCategory}
        />

        <RoadNetworkLayer />
        {showRoute && <RouteLayer />}

        {/* Selected Beacon & Hover Tooltip */}
        {selectedBuilding && inScope(selectedBuilding) && (
          <SelectedBuildingBeacon
            bounds={selectedBounds}
            building={selectedBuilding}
            showLabel={showLabels}
          />
        )}

        {showLabels && hoveredBuilding && inScope(hoveredBuilding) && hoveredBuildingId !== selectedBuildingId && (
          <HoverTooltip bounds={hoveredBounds} building={hoveredBuilding} />
        )}

        {/* Camera Navigation Rig */}
        <CameraController
          targetPos={targetPos}
          targetLookAt={targetLookAt}
          animationKey={animationKey}
        />
      </Canvas>
    </div>
  );
}

useGLTF.preload("/models/campus_buildings.glb");
