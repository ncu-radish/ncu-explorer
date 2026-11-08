"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  Sparkles,
  Search,
  RotateCcw,
  Sliders,
  Database,
  Layers,
  Info,
  Compass,
  CheckCircle2,
  X,
  Target,
  Maximize2,
  Eye,
  Radio,
} from "lucide-react";
import { adminApi } from "@/lib/api";

interface PointData {
  id: string;
  x: number;
  y: number;
  z: number;
  name: string;
  name_en?: string;
  dept: string;
  teacher?: string;
  credits?: number;
  semester: string;
  serial_no: string;
  degree?: string;
  preview?: string;
}

export function VectorUniverseViewer() {
  const mountRef = useRef<HTMLDivElement>(null);

  // States
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<any | null>(null);
  const [pointsData, setPointsData] = useState<PointData[]>([]);
  const [colorMode, setColorMode] = useState<"department" | "semester" | "credits">("department");
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [pointSize, setPointSize] = useState<number>(3.5);

  // Projection / Search State
  const [queryInput, setQueryInput] = useState<string>("");
  const [isProjecting, setIsProjecting] = useState<boolean>(false);
  const [projectResult, setProjectResult] = useState<any | null>(null);

  // Hover & Select State
  const [hoveredCourse, setHoveredCourse] = useState<PointData | null>(null);
  const [pinnedCourse, setPinnedCourse] = useState<PointData | null>(null);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const pointsMeshRef = useRef<THREE.Points | null>(null);
  const queryGroupRef = useRef<THREE.Group | null>(null);
  const linesGroupRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Normalized coordinate bounds
  const coordBoundsRef = useRef<{ min: number[]; max: number[]; center: number[]; scale: number }>({
    min: [0, 0, 0],
    max: [0, 0, 0],
    center: [0, 0, 0],
    scale: 1,
  });

  // Department color palette generator
  const getDeptColor = (dept: string) => {
    let hash = 0;
    for (let i = 0; i < dept.length; i++) {
      hash = (hash << 5) - hash + dept.charCodeAt(i);
      hash |= 0;
    }
    const hue = Math.abs(hash) % 360;
    const color = new THREE.Color();
    color.setHSL(hue / 360, 0.85, 0.6);
    return color;
  };

  const getSemesterColor = (sem: string) => {
    return sem === "1151" ? new THREE.Color("#06b6d4") : new THREE.Color("#10b981");
  };

  const getCreditsColor = (credits?: number) => {
    const c = credits || 0;
    if (c <= 1) return new THREE.Color("#3b82f6");
    if (c === 2) return new THREE.Color("#8b5cf6");
    if (c === 3) return new THREE.Color("#ec4899");
    return new THREE.Color("#f59e0b");
  };

  // Convert raw 3D coords to normalized space [-25, 25]
  const toNormalized = (x: number, y: number, z: number): [number, number, number] => {
    const { center, scale } = coordBoundsRef.current;
    return [
      (x - center[0]) * scale,
      (y - center[1]) * scale,
      (z - center[2]) * scale,
    ];
  };

  // 1. Load Data
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [statsData, universeData] = await Promise.all([
          adminApi.getVectorSpaceStats().catch(() => null),
          adminApi.getVectorSpaceData(),
        ]);

        if (!isMounted) return;
        setStats(statsData);

        const pts: PointData[] = universeData.points || [];
        setPointsData(pts);

        if (pts.length > 0) {
          // Calculate bounds
          let minX = pts[0].x, maxX = pts[0].x;
          let minY = pts[0].y, maxY = pts[0].y;
          let minZ = pts[0].z, maxZ = pts[0].z;

          for (const p of pts) {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
            if (p.z < minZ) minZ = p.z;
            if (p.z > maxZ) maxZ = p.z;
          }

          const centerX = (minX + maxX) / 2;
          const centerY = (minY + maxY) / 2;
          const centerZ = (minZ + maxZ) / 2;
          const maxSpan = Math.max(maxX - minX, maxY - minY, maxZ - minZ) || 1;
          const scale = 50 / maxSpan; // target radius ~25

          coordBoundsRef.current = {
            min: [minX, minY, minZ],
            max: [maxX, maxY, maxZ],
            center: [centerX, centerY, centerZ],
            scale,
          };
        }
      } catch (err) {
        console.error("載入 3D 向量星系資料失敗:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Setup Three.js Scene
  useEffect(() => {
    if (!mountRef.current || pointsData.length === 0) return;

    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 560;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#020617"); // slate-950
    scene.fog = new THREE.FogExp2("#020617", 0.012);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 20, 48);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.6;
    controls.maxDistance = 140;
    controls.minDistance = 5;
    controlsRef.current = controls;

    // Ambient & Point Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight.position.set(20, 40, 30);
    scene.add(dirLight);

    // Groups for query & lines
    const queryGroup = new THREE.Group();
    scene.add(queryGroup);
    queryGroupRef.current = queryGroup;

    const linesGroup = new THREE.Group();
    scene.add(linesGroup);
    linesGroupRef.current = linesGroup;

    // Build Circular Glow Point Texture
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
      gradient.addColorStop(0.2, "rgba(255, 255, 255, 0.85)");
      gradient.addColorStop(0.6, "rgba(255, 255, 255, 0.35)");
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
    }
    const pointTexture = new THREE.CanvasTexture(canvas);

    // Geometry & Attributes
    const count = pointsData.length;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const p = pointsData[i];
      const [nx, ny, nz] = toNormalized(p.x, p.y, p.z);
      positions[i * 3] = nx;
      positions[i * 3 + 1] = ny;
      positions[i * 3 + 2] = nz;

      let c = new THREE.Color("#38bdf8");
      if (colorMode === "department") c = getDeptColor(p.dept);
      else if (colorMode === "semester") c = getSemesterColor(p.semester);
      else if (colorMode === "credits") c = getCreditsColor(p.credits);

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: pointSize,
      map: pointTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const pointsMesh = new THREE.Points(geometry, material);
    scene.add(pointsMesh);
    pointsMeshRef.current = pointsMesh;

    // Raycasting for hover & click
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = 1.0;
    const mouse = new THREE.Vector2(-999, -999);

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      if (pointsMeshRef.current) {
        const intersects = raycaster.intersectObject(pointsMeshRef.current);
        if (intersects.length > 0) {
          const index = intersects[0].index;
          if (index !== undefined && pointsData[index]) {
            setHoveredCourse(pointsData[index]);
            container.style.cursor = "pointer";
            return;
          }
        }
      }
      setHoveredCourse(null);
      container.style.cursor = "default";
    };

    const onClick = () => {
      raycaster.setFromCamera(mouse, camera);
      if (pointsMeshRef.current) {
        const intersects = raycaster.intersectObject(pointsMeshRef.current);
        if (intersects.length > 0) {
          const index = intersects[0].index;
          if (index !== undefined && pointsData[index]) {
            setPinnedCourse(pointsData[index]);
          }
        }
      }
    };

    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("click", onClick);

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 560;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // Animation Loop
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      controls.update();

      // Query Beacon pulsing animation
      if (queryGroupRef.current && queryGroupRef.current.children.length > 0) {
        const time = Date.now() * 0.003;
        queryGroupRef.current.children.forEach((child: any) => {
          if (child.isRing) {
            const scale = 1 + Math.sin(time) * 0.25;
            child.scale.set(scale, scale, scale);
          }
        });
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("click", onClick);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      pointTexture.dispose();
    };
  }, [pointsData]);

  // 3. Update Colors & Filters
  useEffect(() => {
    if (!pointsMeshRef.current || pointsData.length === 0) return;
    const geom = pointsMeshRef.current.geometry;
    const colors = geom.getAttribute("color") as THREE.BufferAttribute;
    if (!colors) return;

    for (let i = 0; i < pointsData.length; i++) {
      const p = pointsData[i];

      // Check if hidden by filter
      let isVisible = true;
      if (selectedSemester && p.semester !== selectedSemester) isVisible = false;
      if (selectedDept && p.dept !== selectedDept) isVisible = false;

      let c = new THREE.Color();
      if (!isVisible) {
        c.setRGB(0.06, 0.08, 0.12); // dimmed
      } else if (colorMode === "department") {
        c = getDeptColor(p.dept);
      } else if (colorMode === "semester") {
        c = getSemesterColor(p.semester);
      } else if (colorMode === "credits") {
        c = getCreditsColor(p.credits);
      }

      colors.setXYZ(i, c.r, c.g, c.b);
    }
    colors.needsUpdate = true;
  }, [colorMode, selectedSemester, selectedDept, pointsData]);

  // 4. Update Point Size
  useEffect(() => {
    if (pointsMeshRef.current) {
      (pointsMeshRef.current.material as THREE.PointsMaterial).size = pointSize;
    }
  }, [pointSize]);

  // 5. Update Auto Rotate
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // 6. Handle 3D Query Projection
  const handleProjectQuery = async () => {
    if (!queryInput.trim() || isProjecting) return;
    setIsProjecting(true);
    try {
      const res = await adminApi.projectVectorQuery({
        query: queryInput.trim(),
        top_k: 5,
        semester: selectedSemester || undefined,
        department: selectedDept || undefined,
      });
      setProjectResult(res);

      if (queryGroupRef.current && linesGroupRef.current && sceneRef.current) {
        // Clear previous
        while (queryGroupRef.current.children.length > 0) {
          queryGroupRef.current.remove(queryGroupRef.current.children[0]);
        }
        while (linesGroupRef.current.children.length > 0) {
          linesGroupRef.current.remove(linesGroupRef.current.children[0]);
        }

        // Add query glowing beacon
        const [qx, qy, qz] = toNormalized(res.coord[0], res.coord[1], res.coord[2]);

        const sphereGeom = new THREE.SphereGeometry(1.2, 24, 24);
        const sphereMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 }); // Gold
        const queryMesh = new THREE.Mesh(sphereGeom, sphereMat);
        queryMesh.position.set(qx, qy, qz);
        queryGroupRef.current.add(queryMesh);

        // Pulsing Ring
        const ringGeom = new THREE.RingGeometry(1.5, 1.8, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xfef08a,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85,
        });
        const ringMesh = new THREE.Mesh(ringGeom, ringMat) as any;
        ringMesh.position.set(qx, qy, qz);
        ringMesh.rotation.x = Math.PI / 2;
        ringMesh.isRing = true;
        queryGroupRef.current.add(ringMesh);

        // Laser connection lines to Top-K nearest courses
        const linePositions: number[] = [];
        const lineColors: number[] = [];

        for (const nc of res.nearest_courses) {
          const [cx, cy, cz] = toNormalized(nc.x, nc.y, nc.z);
          linePositions.push(qx, qy, qz);
          linePositions.push(cx, cy, cz);

          // Gold to Cyan gradient
          lineColors.push(0.98, 0.8, 0.08);
          lineColors.push(0.02, 0.71, 0.83);
        }

        const linesGeom = new THREE.BufferGeometry();
        linesGeom.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
        linesGeom.setAttribute("color", new THREE.Float32BufferAttribute(lineColors, 3));

        const linesMat = new THREE.LineBasicMaterial({
          vertexColors: true,
          transparent: true,
          opacity: 0.8,
          linewidth: 2,
        });

        const lines = new THREE.LineSegments(linesGeom, linesMat);
        linesGroupRef.current.add(lines);

        // Smoothly focus camera towards query coordinates
        if (cameraRef.current && controlsRef.current) {
          controlsRef.current.target.set(qx, qy, qz);
        }
      }
    } catch (err) {
      console.error("3D 投影計算失敗:", err);
    } finally {
      setIsProjecting(false);
    }
  };

  const handleResetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 20, 48);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 flex flex-col gap-5 relative overflow-hidden">
      {/* 頂部控制面板 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-800/80 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-violet-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Radio className="w-4 h-4 animate-pulse text-violet-400" />
            <span>3D 向量星系投影 (3D Vector Universe)</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>全校課程語意向量宇宙</span>
            {stats && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-950 text-violet-300 border border-violet-800 font-mono font-normal">
                {stats.total_courses.toLocaleString()} 節點 (512D → 3D UMAP)
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            流形降維演算法呈現語意空間分佈，支援即時自然語言查詢之 3D 向量定位與鄰近課程雷射連線。
          </p>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {/* 色彩維度選擇 */}
          <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
            <span className="text-slate-400 px-2">色彩聚類：</span>
            <button
              onClick={() => setColorMode("department")}
              className={`px-2.5 py-1 rounded-lg transition font-medium ${
                colorMode === "department" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              開課系所
            </button>
            <button
              onClick={() => setColorMode("semester")}
              className={`px-2.5 py-1 rounded-lg transition font-medium ${
                colorMode === "semester" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              學期 (1151 / 1142)
            </button>
            <button
              onClick={() => setColorMode("credits")}
              className={`px-2.5 py-1 rounded-lg transition font-medium ${
                colorMode === "credits" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              學分數
            </button>
          </div>

          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition flex items-center space-x-1 ${
              autoRotate
                ? "bg-violet-950 text-violet-300 border-violet-800"
                : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            <span>自動旋轉</span>
          </button>

          <button
            onClick={handleResetCamera}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-medium border border-slate-800 transition flex items-center space-x-1"
            title="重設視角"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>重設視角</span>
          </button>
        </div>
      </div>

      {/* 3D 查詢投影列 */}
      <div className="flex flex-col sm:flex-row gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800/80">
        <div className="relative flex-1">
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleProjectQuery()}
            placeholder="輸入即時選課需求，在 3D 空間定位查詢向量並拉出雷射連線（例如：機器學習與深度神經網路、日語會話、半導體材料）..."
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 text-xs"
          />
        </div>
        <button
          onClick={handleProjectQuery}
          disabled={isProjecting || !queryInput.trim()}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-600 hover:from-violet-500 hover:to-violet-500 text-white font-semibold text-xs transition shadow-md shadow-violet-600/30 disabled:opacity-50 whitespace-nowrap flex items-center justify-center space-x-1.5"
        >
          {isProjecting ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Target className="w-3.5 h-3.5" />
          )}
          <span>3D 定位投影</span>
        </button>
      </div>

      {/* 畫布與側欄 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 relative min-h-[560px]">
        {/* 3D WebGL Canvas */}
        <div className="lg:col-span-3 rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-950 relative">
          <div ref={mountRef} className="w-full h-[560px] cursor-grab active:cursor-grabbing" />

          {/* 載入中指示 */}
          {loading && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center space-y-3 z-10">
              <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-300 font-mono">載入 4,399 門課程 3D UMAP 向量幾何星系中...</p>
            </div>
          )}

          {/* 懸停 HUD 資訊卡 (Hovered Tooltip) */}
          {hoveredCourse && !pinnedCourse && (
            <div className="absolute top-4 left-4 z-20 bg-slate-900/90 border border-violet-500/40 backdrop-blur-md p-3.5 rounded-xl max-w-sm pointer-events-none shadow-xl text-xs space-y-1">
              <div className="flex items-center justify-between text-[11px] text-violet-400 font-mono mb-0.5">
                <span>{hoveredCourse.semester === "1151" ? "1151 上學期" : "1142 下學期"}</span>
                <span>流水號: {hoveredCourse.serial_no}</span>
              </div>
              <div className="text-sm font-bold text-white line-clamp-1">
                {hoveredCourse.name}
              </div>
              <div className="text-slate-300">
                {hoveredCourse.dept} | 教師：{hoveredCourse.teacher || "未定"} | {hoveredCourse.credits} 學分
              </div>
              {hoveredCourse.preview && (
                <div className="text-[11px] text-slate-400 line-clamp-2 mt-1 italic">
                  {hoveredCourse.preview}
                </div>
              )}
              <div className="text-[10px] text-violet-500 pt-1">點擊可釘選詳情</div>
            </div>
          )}

          {/* 畫布左下角指標說明 */}
          <div className="absolute bottom-4 left-4 z-10 bg-slate-900/70 border border-slate-800/80 backdrop-blur-md px-3 py-2 rounded-xl text-[11px] text-slate-400 flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-violet-400"></span>
              <span>1151 上學期 (2,251門)</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>1142 下學期 (2,149門)</span>
            </span>
            {projectResult && (
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                <span className="text-amber-300 font-semibold">查詢向量定位點</span>
              </span>
            )}
          </div>
        </div>

        {/* 右側資訊與 Top-K 投影結果面板 */}
        <div className="lg:col-span-1 flex flex-col gap-3 max-h-[560px] overflow-y-auto pr-1">
          {/* 即時查詢投影結果 */}
          {projectResult ? (
            <div className="bg-slate-900/90 border border-amber-600/40 rounded-2xl p-4 space-y-3 shadow-lg">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-amber-300 flex items-center space-x-1">
                  <Target className="w-3.5 h-3.5" />
                  <span>3D 鄰近雷射連線</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  [{projectResult.coord[0]}, {projectResult.coord[1]}, {projectResult.coord[2]}]
                </span>
              </div>
              <p className="text-xs text-white font-medium italic">
                「{projectResult.query}」
              </p>

              <div className="space-y-2">
                {projectResult.nearest_courses.map((nc: any, idx: number) => (
                  <div
                    key={nc.id}
                    onClick={() => {
                      const found = pointsData.find((p) => p.id === nc.id);
                      if (found) setPinnedCourse(found);
                    }}
                    className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-amber-500/50 cursor-pointer transition text-xs space-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white truncate max-w-[120px]">{nc.name}</span>
                      <span className="font-mono text-amber-400 font-bold">{nc.similarity}%</span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {nc.dept} | {nc.teacher || "教師未定"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 space-y-2">
              <div className="font-bold text-slate-300 flex items-center space-x-1.5">
                <Info className="w-3.5 h-3.5 text-violet-400" />
                <span>3D 向量宇宙操作指南</span>
              </div>
              <ul className="space-y-1 text-[11px] text-slate-400 leading-relaxed list-disc list-inside">
                <li>滑鼠左鍵拖曳：360° 自由旋轉視角</li>
                <li>滑鼠右鍵拖曳：平移視角中心</li>
                <li>滾輪滑動：縮放拉近拉遠</li>
                <li>游標懸停節點：即時 HUD 課名資訊卡</li>
                <li>點擊節點：釘選查看完整課程簡介</li>
                <li>輸入關鍵字投影：即時雷射連線與 Top-K 聚類</li>
              </ul>
            </div>
          )}

          {/* 釘選課程資訊卡 (Pinned Card) */}
          {pinnedCourse && (
            <div className="bg-slate-900/90 border border-violet-500/50 rounded-2xl p-4 space-y-2 shadow-xl relative">
              <button
                onClick={() => setPinnedCourse(null)}
                className="absolute top-3 right-3 text-slate-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="text-[11px] text-violet-400 font-mono">
                {pinnedCourse.semester === "1151" ? "1151 上學期" : "1142 下學期"} | 流水號: {pinnedCourse.serial_no}
              </div>
              <h4 className="text-sm font-bold text-white">{pinnedCourse.name}</h4>
              <div className="text-xs text-slate-300">
                {pinnedCourse.dept} | {pinnedCourse.teacher || "教師未定"} | {pinnedCourse.credits} 學分
              </div>
              {pinnedCourse.preview && (
                <p className="text-[11px] text-slate-400 leading-relaxed max-h-32 overflow-y-auto bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  {pinnedCourse.preview}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
