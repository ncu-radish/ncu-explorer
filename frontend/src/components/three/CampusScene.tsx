"use client";

import React, { useRef, useState, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Html } from "@react-three/drei";
import * as THREE from "three";
import { useMapStore, DEFAULT_CAMERA_POS, DEFAULT_CAMERA_TARGET } from "@/store/useMapStore";
import { Building, exploreApi } from "@/lib/api";

// Campus geometry center offset to bring the model origin to (0, 0, 0)
// Blender ground height Z = 0 corresponds directly to Three.js Y = 0
const CAMPUS_OFFSET: [number, number, number] = [-535.8, 0, 344.54];

// Category color palettes for subtle architectural clay materials
const CATEGORY_MATERIALS: Record<string, { color: string; emissive?: string }> = {
  teaching: { color: "#EDE7DE" },   // Warm architectural stone
  dorm: { color: "#E5E7EE" },       // Soft mist slate
  function: { color: "#ECE6DB" },   // Warm ivory sandstone
  sport: { color: "#E0EAE2" },      // Soft sage
  restaurant: { color: "#EFE5E0" }, // Terracotta cream
  default: { color: "#EAE6DE" },
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
}

function CampusModel({ buildings, onSelectBuilding, onBoundsComputed }: CampusModelProps) {
  const { scene } = useGLTF("/models/campus_buildings.glb");
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
      color: "#2563EB",
      roughness: 0.35,
      metalness: 0.1,
      emissive: "#1D4ED8",
      emissiveIntensity: 0.35,
    });

    const hoveredMat = new THREE.MeshStandardMaterial({
      color: "#60A5FA",
      roughness: 0.4,
      metalness: 0.05,
      emissive: "#3B82F6",
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
        const isSelected = bldgId === selectedBuildingId;
        const isHovered = bldgId === hoveredBuildingId;

        if (isSelected) {
          mesh.material = materials.selectedMat;
        } else if (isHovered) {
          mesh.material = materials.hoveredMat;
        } else {
          // Base material based on building category
          const bldg = buildingMap.get(bldgId);
          const cat = bldg?.category || "default";
          const config = CATEGORY_MATERIALS[cat] || CATEGORY_MATERIALS.default;

          if (!materials.cache.has(cat)) {
            materials.cache.set(
              cat,
              new THREE.MeshStandardMaterial({
                color: config.color,
                roughness: 0.6,
                metalness: 0.05,
              })
            );
          }
          mesh.material = materials.cache.get(cat)!;
        }

        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
  }, [scene, selectedBuildingId, hoveredBuildingId, buildingMap, materials]);

  return (
    <group
      ref={groupRef}
      position={CAMPUS_OFFSET}
      onPointerOver={(e) => {
        e.stopPropagation();
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
}: {
  bounds?: BuildingBounds;
  building?: Building;
}) {
  const pinRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (pinRef.current) {
      const t = state.clock.getElapsedTime();
      pinRef.current.position.y = (bounds?.topPoint.y || 15) + 6 + Math.sin(t * 3) * 1.5;
      pinRef.current.rotation.y = t * 1.5;
    }
  });

  if (!bounds || !building) return null;

  return (
    <group position={[bounds.center.x, 0, bounds.center.z]}>
      <group ref={pinRef}>
        {/* Diamond beacon */}
        <mesh>
          <octahedronGeometry args={[2.5, 0]} />
          <meshStandardMaterial
            color="#2563EB"
            emissive="#3B82F6"
            emissiveIntensity={0.6}
            roughness={0.2}
          />
        </mesh>

        {/* Floating HTML Tag */}
        <Html position={[0, 4.5, 0]} center distanceFactor={140} zIndexRange={[100, 0]}>
          <div className="pointer-events-none select-none flex flex-col items-center">
            <div className="bg-stone-900/90 text-white px-3 py-1 rounded-lg text-xs font-semibold shadow-lg backdrop-blur-xs flex items-center gap-1.5 whitespace-nowrap border border-stone-700">
              {building.classroom_code && (
                <span className="bg-blue-600 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                  {building.classroom_code}
                </span>
              )}
              <span>{building.name_zh}</span>
            </div>
            <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-stone-900/90" />
          </div>
        </Html>
      </group>
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
              <span className="bg-stone-100 text-stone-700 text-[10px] font-mono px-1 rounded border border-stone-200">
                {building.classroom_code}
              </span>
            )}
            <span>{building.name_zh}</span>
            {building.alias && (
              <span className="text-[10px] text-stone-600">({building.alias})</span>
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
}: {
  targetPos: THREE.Vector3 | null;
  targetLookAt: THREE.Vector3 | null;
}) {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  const isFlying = useRef(false);

  useEffect(() => {
    if (targetPos && targetLookAt) {
      isFlying.current = true;
    }
  }, [targetPos, targetLookAt]);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;

    if (isFlying.current && targetPos && targetLookAt) {
      const step = Math.min(delta * 4, 0.2);
      camera.position.lerp(targetPos, step);
      controls.target.lerp(targetLookAt, step);
      controls.update();

      if (
        camera.position.distanceTo(targetPos) < 1.0 &&
        controls.target.distanceTo(targetLookAt) < 1.0
      ) {
        isFlying.current = false;
      }
    }
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
}

export function CampusScene({
  buildings: propBuildings,
  onSelectBuilding,
  focusedLocationId,
}: CampusSceneProps) {
  const { selectedBuildingId, selectBuilding, hoveredBuildingId, resetTrigger } = useMapStore();
  const [internalBuildings, setInternalBuildings] = useState<Building[]>([]);
  const [boundsMap, setBoundsMap] = useState<Map<string, BuildingBounds>>(new Map());

  // If buildings not passed, fetch them automatically
  useEffect(() => {
    if (!propBuildings || propBuildings.length === 0) {
      exploreApi.getBuildings().then(setInternalBuildings).catch(console.error);
    }
  }, [propBuildings]);

  const buildings = propBuildings && propBuildings.length > 0 ? propBuildings : internalBuildings;

  // Sync focusedLocationId if provided by external caller (e.g. simulator)
  useEffect(() => {
    if (focusedLocationId !== undefined) {
      selectBuilding(focusedLocationId);
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

  // Determine desired camera target and position
  const { targetPos, targetLookAt } = useMemo(() => {
    void resetTrigger;
    if (!selectedBuildingId || !boundsMap.has(selectedBuildingId)) {
      return {
        targetPos: new THREE.Vector3(...DEFAULT_CAMERA_POS),
        targetLookAt: new THREE.Vector3(...DEFAULT_CAMERA_TARGET),
      };
    }

    const bounds = boundsMap.get(selectedBuildingId)!;
    const { center, size } = bounds;
    const radius = Math.max(size.x, size.z, 35);

    const pos = new THREE.Vector3(
      center.x + radius * 1.3,
      center.y + Math.max(size.y * 1.4, 45),
      center.z + radius * 1.3
    );
    const lookAt = new THREE.Vector3(center.x, center.y + 4, center.z);

    return { targetPos: pos, targetLookAt: lookAt };
  }, [selectedBuildingId, boundsMap, resetTrigger]);

  const selectedBuilding = selectedBuildingId ? buildingMap.get(selectedBuildingId) : undefined;
  const selectedBounds = selectedBuildingId ? boundsMap.get(selectedBuildingId) : undefined;

  const hoveredBuilding = hoveredBuildingId ? buildingMap.get(hoveredBuildingId) : undefined;
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
        style={{ background: "#FAF8F5" }}
      >
        {/* Warm Natural Lighting Setup */}
        <ambientLight intensity={0.75} color="#FFFDF7" />
        <hemisphereLight
          args={["#F6F3EE", "#DFDACF", 0.65]}
        />
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
          <meshStandardMaterial color="#EFECE5" roughness={0.9} metalness={0.0} />
        </mesh>

        {/* Subtle grid lines for depth perception */}
        <gridHelper
          args={[1400, 70, "#D5CFC5", "#E8E3DA"]}
          position={[0, -0.02, 0]}
        />

        {/* Campus 3D Model */}
        <CampusModel
          buildings={buildings}
          onSelectBuilding={handleSelect}
          onBoundsComputed={setBoundsMap}
        />

        {/* Selected Beacon & Hover Tooltip */}
        {selectedBuilding && (
          <SelectedBuildingBeacon bounds={selectedBounds} building={selectedBuilding} />
        )}

        {hoveredBuilding && hoveredBuildingId !== selectedBuildingId && (
          <HoverTooltip bounds={hoveredBounds} building={hoveredBuilding} />
        )}

        {/* Camera Navigation Rig */}
        <CameraController targetPos={targetPos} targetLookAt={targetLookAt} />
      </Canvas>
    </div>
  );
}

useGLTF.preload("/models/campus_buildings.glb");
