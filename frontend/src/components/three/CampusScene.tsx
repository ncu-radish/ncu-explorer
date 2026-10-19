"use client";

import React, { useRef, useState, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Text, Float, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useMapStore } from "@/store/useMapStore";

interface BuildingNode {
  id: string;
  name: string;
  category: "academic" | "dorm" | "dining" | "leisure" | "transport";
  pos: [number, number, number];
  size: [number, number, number];
  color: string;
  cameraPos: { pos: [number, number, number]; target: [number, number, number] };
}

// NCU Campus Architectural Clay Nodes
const BUILDINGS: BuildingNode[] = [
  {
    id: "loc_mgt2",
    name: "管理二館",
    category: "academic",
    pos: [12.5, 3.5, -15.2],
    size: [12, 7, 10],
    color: "#F5F2EB", // Warm cream
    cameraPos: { pos: [12.5, 25, -2], target: [12.5, 3.5, -15.2] },
  },
  {
    id: "loc_eng5",
    name: "工程五館",
    category: "academic",
    pos: [-25.0, 4.0, -10.0],
    size: [14, 8, 12],
    color: "#F5F2EB",
    cameraPos: { pos: [-25.0, 25, 5], target: [-25.0, 4.0, -10.0] },
  },
  {
    id: "loc_sci5",
    name: "科學五館",
    category: "academic",
    pos: [-15.0, 3.5, 20.0],
    size: [10, 7, 10],
    color: "#F5F2EB",
    cameraPos: { pos: [-15.0, 22, 35], target: [-15.0, 3.5, 20.0] },
  },
  {
    id: "loc_teaching",
    name: "教研大樓",
    category: "academic",
    pos: [0.0, 3.5, 5.0],
    size: [14, 7, 10],
    color: "#F5F2EB",
    cameraPos: { pos: [0.0, 22, 20], target: [0.0, 3.5, 5.0] },
  },
  {
    id: "loc_lib",
    name: "總圖書館",
    category: "academic",
    pos: [5.0, 5.0, -35.0],
    size: [16, 10, 14],
    color: "#F5F2EB",
    cameraPos: { pos: [5.0, 30, -18], target: [5.0, 5.0, -35.0] },
  },
  {
    id: "loc_yiren",
    name: "依仁堂體育館",
    category: "leisure",
    pos: [35.0, 4.0, 15.0],
    size: [20, 8, 16],
    color: "#E2E8F0",
    cameraPos: { pos: [35.0, 26, 32], target: [35.0, 4.0, 15.0] },
  },
  {
    id: "loc_dorm_boy9",
    name: "男九舍",
    category: "dorm",
    pos: [-40.0, 3.0, 35.0],
    size: [12, 6, 10],
    color: "#D6E4F0", // Mist blue
    cameraPos: { pos: [-40.0, 22, 50], target: [-40.0, 3.0, 35.0] },
  },
  {
    id: "loc_dorm_girl14",
    name: "女十四舍",
    category: "dorm",
    pos: [-30.0, 4.0, 45.0],
    size: [14, 8, 10],
    color: "#D6E4F0",
    cameraPos: { pos: [-30.0, 25, 60], target: [-30.0, 4.0, 45.0] },
  },
  {
    id: "loc_pine_restaurant",
    name: "松果餐廳",
    category: "dining",
    pos: [-10.0, 2.5, 10.0],
    size: [10, 5, 8],
    color: "#FADCD9", // Soft coral
    cameraPos: { pos: [-10.0, 18, 22], target: [-10.0, 2.5, 10.0] },
  },
  {
    id: "loc_park_creek",
    name: "百花川步道",
    category: "leisure",
    pos: [5.0, 0.3, -10.0],
    size: [5, 0.5, 36],
    color: "#A7D7C5", // Stream teal
    cameraPos: { pos: [5.0, 18, 5], target: [5.0, 0.3, -10.0] },
  },
  {
    id: "loc_cathay_tree",
    name: "國泰大榕樹",
    category: "leisure",
    pos: [20.0, 3.0, -5.0],
    size: [6, 6, 6],
    color: "#84B082", // Foliage green
    cameraPos: { pos: [20.0, 20, 10], target: [20.0, 3.0, -5.0] },
  },
];

function CameraRig({ targetId }: { targetId: string | null }) {
  const controlsRef = useRef<any>(null);

  const activeTarget = useMemo(() => {
    if (!targetId) return null;
    return BUILDINGS.find((b) => b.id === targetId)?.cameraPos;
  }, [targetId]);

  useFrame((state, delta) => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;

    if (activeTarget) {
      const desiredPos = new THREE.Vector3(...activeTarget.pos);
      const desiredTarget = new THREE.Vector3(...activeTarget.target);

      state.camera.position.lerp(desiredPos, delta * 3.5);
      controls.target.lerp(desiredTarget, delta * 3.5);
      controls.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      maxPolarAngle={Math.PI / 2.1}
      minDistance={10}
      maxDistance={140}
    />
  );
}

function BuildingItem({
  building,
  isSelected,
  onSelect,
}: {
  building: BuildingNode;
  isSelected: boolean;
  onSelect: (b: BuildingNode) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const targetY = hovered || isSelected ? building.pos[1] + 1.2 : building.pos[1];
    meshRef.current.position.y = THREE.MathUtils.damp(meshRef.current.position.y, targetY, 8, delta);
  });

  return (
    <group position={[building.pos[0], 0, building.pos[2]]}>
      <mesh
        ref={meshRef}
        position={[0, building.pos[1], 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(building);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        castShadow
        receiveShadow
      >
        <boxGeometry args={building.size} />
        <meshStandardMaterial
          color={isSelected ? "#38bdf8" : hovered ? "#93c5fd" : building.color}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>

      {/* Floating 3D Label */}
      <Float speed={2} rotationIntensity={0} floatIntensity={hovered || isSelected ? 0.3 : 0.1}>
        <Text
          position={[0, building.pos[1] + building.size[1] / 2 + 2, 0]}
          fontSize={1.8}
          color={isSelected ? "#38bdf8" : "#ffffff"}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.15}
          outlineColor="#090d16"
        >
          {building.name}
        </Text>
      </Float>
    </group>
  );
}

const CAMPUS_MODEL_URL = process.env.NEXT_PUBLIC_CAMPUS_MODEL_URL || "/models/ncu_campus.glb";

function ExternalGLBCampus({
  onSelectMesh,
}: {
  onSelectMesh: (meshName: string) => void;
}) {
  const { scene } = useGLTF(CAMPUS_MODEL_URL);

  useEffect(() => {
    scene.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (!child.material || child.material.name !== "clay") {
          child.material = new THREE.MeshStandardMaterial({
            color: child.name.includes("mgt") || child.name.includes("lib") ? "#F5F2EB" : "#D6E4F0",
            roughness: 0.5,
            metalness: 0.1,
          });
        }
      }
    });
  }, [scene]);

  return (
    <primitive
      object={scene}
      onClick={(e: any) => {
        e.stopPropagation();
        if (e.object?.name) {
          onSelectMesh(e.object.name);
        }
      }}
    />
  );
}

export function CampusScene({
  focusedLocationId,
  onSelectBuilding,
  interactive = true,
}: {
  focusedLocationId?: string | null;
  onSelectBuilding?: (locId: string) => void;
  interactive?: boolean;
}) {
  const { selectedBuildingId, selectBuilding, filterCategory } = useMapStore();
  const currentSelectedId = focusedLocationId !== undefined ? focusedLocationId : selectedBuildingId;
  const [hasGLB, setHasGLB] = useState(false);

  useEffect(() => {
    fetch(CAMPUS_MODEL_URL, { method: "HEAD" })
      .then((res) => setHasGLB(res.ok))
      .catch(() => setHasGLB(false));
  }, []);

  const handleSelect = (b: BuildingNode) => {
    if (!interactive) return;
    if (onSelectBuilding) {
      onSelectBuilding(b.id);
    }
    selectBuilding(b.id, b.cameraPos);
  };

  const filteredBuildings = useMemo(() => {
    if (!filterCategory) return BUILDINGS;
    return BUILDINGS.filter((b) => b.category === filterCategory);
  }, [filterCategory]);

  return (
    <Canvas
      shadows
      camera={{ position: [0, 50, 55], fov: 45 }}
      style={{ width: "100%", height: "100%" }}
      onPointerMissed={() => {
        if (interactive) selectBuilding(null);
      }}
    >
      <color attach="background" args={["#0c111d"]} />
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[40, 60, 30]}
        intensity={1.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-70}
        shadow-camera-right={70}
        shadow-camera-top={70}
        shadow-camera-bottom={-70}
      />
      <directionalLight position={[-40, 30, -30]} intensity={0.4} color="#60a5fa" />

      {/* Campus Ground Plane (Pastel Sage Green & Paths) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[160, 160]} />
        <meshStandardMaterial color="#192437" roughness={0.9} />
      </mesh>

      {/* Great Lawn Area (大草坪) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[10, 0.05, -5]} receiveShadow>
        <circleGeometry args={[22, 32]} />
        <meshStandardMaterial color="#2d4a3e" roughness={0.8} />
      </mesh>

      {/* Render external GLB if present, else fallback to procedural buildings */}
      {hasGLB ? (
        <ExternalGLBCampus
          onSelectMesh={(meshName) => {
            const matched = BUILDINGS.find(
              (b) => b.id.toLowerCase().includes(meshName.toLowerCase()) || meshName.toLowerCase().includes(b.id.toLowerCase())
            );
            if (matched) handleSelect(matched);
          }}
        />
      ) : (
        filteredBuildings.map((b) => (
          <BuildingItem
            key={b.id}
            building={b}
            isSelected={currentSelectedId === b.id}
            onSelect={handleSelect}
          />
        ))
      )}

      {/* Soft Contact Shadows */}
      <ContactShadows position={[0, 0, 0]} opacity={0.65} scale={130} blur={2.2} far={25} />

      {/* Camera Rig & Controls */}
      <CameraRig targetId={currentSelectedId} />
    </Canvas>
  );
}
