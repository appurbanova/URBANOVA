import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  ArrowUpRight,
  Building2,
  ChevronDown,
  Compass,
  Layers3,
  MapPin,
  Menu,
  Minus,
  Plus,
  Radio,
  RotateCcw,
  Sparkles,
  TrainFront,
  Trees,
  Waves,
  X,
} from "lucide-react";

type Layer = "district" | "mobility" | "green";

type District = {
  name: string;
  code: string;
  subtitle: string;
  color: string;
  accent: string;
  stat: string;
  detail: string;
};

const districts: District[] = [
  {
    name: "The Canopy",
    code: "CN-04",
    subtitle: "Biophilic living quarter",
    color: "#c8e98b",
    accent: "#536d2e",
    stat: "82% shade cover",
    detail:
      "A terraced neighborhood where every address opens to a shared garden, with evening markets woven into the pedestrian level.",
  },
  {
    name: "Tideworks",
    code: "TW-02",
    subtitle: "Waterfront civic lab",
    color: "#9bdbd5",
    accent: "#216c6e",
    stat: "06 min to water",
    detail:
      "The district's working edge: tidal gardens, a public bathhouse, and small-scale fabrication in the old dock sheds.",
  },
  {
    name: "Foundry Row",
    code: "FR-07",
    subtitle: "Culture + production",
    color: "#f2be73",
    accent: "#92552b",
    stat: "24/7 active",
    detail:
      "A low-rise band of studios, food halls and night schools that keeps the original industrial grain alive.",
  },
];

const buildings = [
  { x: -7.2, z: -1.2, w: 2.3, d: 2.2, h: 4.1, tone: "#d7c8aa", name: "Morrow House", district: "FR-07" },
  { x: -4.8, z: -2.8, w: 1.9, d: 1.8, h: 5.6, tone: "#789196", name: "Lumen Tower", district: "TW-02" },
  { x: -2.2, z: 1.3, w: 2.6, d: 2.3, h: 3.1, tone: "#bf8258", name: "Foundry Hall", district: "FR-07" },
  { x: 0.5, z: -1.6, w: 2.25, d: 2.5, h: 6.9, tone: "#a9c7bd", name: "Canopy Exchange", district: "CN-04" },
  { x: 3.4, z: 0.2, w: 2.1, d: 2.3, h: 4.4, tone: "#d9ad69", name: "Arcade 06", district: "CN-04" },
  { x: 5.9, z: -2.4, w: 2.8, d: 2.2, h: 2.9, tone: "#91a98d", name: "Juniper Court", district: "CN-04" },
  { x: 7.5, z: 1.8, w: 2.1, d: 2.4, h: 5.2, tone: "#b4d7d5", name: "Tide House", district: "TW-02" },
] as const;

type BuildingMesh = THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial> & {
  userData: { buildingName: string; district: string; baseY: number };
};

function createRoad(scene: THREE.Scene, x: number, z: number, width: number, depth: number, rotation = 0) {
  const road = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.08, depth),
    new THREE.MeshStandardMaterial({ color: "#d9c997", roughness: 0.95 }),
  );
  road.position.set(x, 0.08, z);
  road.rotation.y = rotation;
  scene.add(road);
}

function createTree(group: THREE.Group, x: number, z: number, scale = 1) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08 * scale, 0.11 * scale, 0.55 * scale, 8),
    new THREE.MeshStandardMaterial({ color: "#6e563c", roughness: 1 }),
  );
  trunk.position.set(x, 0.35 * scale, z);
  const crown = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.46 * scale, 1),
    new THREE.MeshStandardMaterial({ color: "#78965f", roughness: 0.9 }),
  );
  crown.position.set(x, 0.9 * scale, z);
  group.add(trunk, crown);
}

export function Urbanova3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const buildingMeshesRef = useRef<BuildingMesh[]>([]);
  const layerGroupsRef = useRef<Record<Layer, THREE.Group> | null>(null);
  const [selectedCode, setSelectedCode] = useState("CN-04");
  const [activeLayer, setActiveLayer] = useState<Layer>("district");
  const [focusMode, setFocusMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [webglReady, setWebglReady] = useState(true);
  const selectedDistrict = useMemo(
    () => districts.find((district) => district.code === selectedCode) ?? districts[0],
    [selectedCode],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      setWebglReady(false);
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#b6c7b6");
    scene.fog = new THREE.Fog("#b6c7b6", 18, 34);
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(13, 13, 16);
    cameraRef.current = camera;
    sceneRef.current = scene;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.target.set(0, 1.2, 0);
    controls.minDistance = 7;
    controls.maxDistance = 28;
    controls.maxPolarAngle = Math.PI / 2.05;
    controlsRef.current = controls;

    scene.add(new THREE.HemisphereLight("#fff6d8", "#547468", 2.6));
    const sun = new THREE.DirectionalLight("#fff0c7", 3.8);
    sun.position.set(-8, 17, 9);
    sun.castShadow = true;
    scene.add(sun);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 25),
      new THREE.MeshStandardMaterial({ color: "#9eb39e", roughness: 1, metalness: 0 }),
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const grid = new THREE.GridHelper(28, 28, "#68836f", "#8fa795");
    grid.position.y = 0.04;
    (grid.material as THREE.Material).opacity = 0.42;
    (grid.material as THREE.Material).transparent = true;
    scene.add(grid);

    createRoad(scene, 0, -0.6, 25, 0.72, -0.08);
    createRoad(scene, -1.2, 1.9, 0.65, 19, 0.17);
    createRoad(scene, 5.4, -0.4, 0.55, 18, -0.23);

    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 25),
      new THREE.MeshStandardMaterial({ color: "#75aaa7", transparent: true, opacity: 0.82, roughness: 0.35 }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(-11.2, 0.06, 0);
    scene.add(water);

    const buildingsGroup = new THREE.Group();
    const buildingMeshes: BuildingMesh[] = [];
    buildings.forEach((building) => {
      const material = new THREE.MeshStandardMaterial({
        color: building.tone,
        roughness: 0.75,
        metalness: 0.05,
        emissive: "#000000",
      });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(building.w, building.h, building.d), material) as BuildingMesh;
      mesh.position.set(building.x, building.h / 2, building.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { buildingName: building.name, district: building.district, baseY: building.h / 2 };
      buildingMeshes.push(mesh);
      buildingsGroup.add(mesh);

      const roof = new THREE.Mesh(
        new THREE.BoxGeometry(building.w * 0.84, 0.08, building.d * 0.84),
        new THREE.MeshStandardMaterial({ color: "#445b4d", roughness: 0.9 }),
      );
      roof.position.set(building.x, building.h + 0.06, building.z);
      buildingsGroup.add(roof);
    });
    scene.add(buildingsGroup);
    buildingMeshesRef.current = buildingMeshes;

    const mobilityGroup = new THREE.Group();
    const route = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-9, 0.13, 3.4),
        new THREE.Vector3(-4, 0.13, 2.6),
        new THREE.Vector3(0, 0.13, 1.5),
        new THREE.Vector3(4.2, 0.13, 0.5),
        new THREE.Vector3(9.5, 0.13, -1.5),
      ]),
      new THREE.LineDashedMaterial({ color: "#f3e5ae", dashSize: 0.42, gapSize: 0.26, linewidth: 2 }),
    );
    route.computeLineDistances();
    mobilityGroup.add(route);
    [-6.2, -1.1, 4.8].forEach((x) => {
      const station = new THREE.Mesh(
        new THREE.TorusGeometry(0.25, 0.045, 8, 20),
        new THREE.MeshBasicMaterial({ color: "#eff0be" }),
      );
      station.rotation.x = Math.PI / 2;
      station.position.set(x, 0.18, 1.9 - (x + 1.2) * 0.17);
      mobilityGroup.add(station);
    });
    scene.add(mobilityGroup);

    const greenGroup = new THREE.Group();
    [
      [-7.8, 3.1, 1.1],
      [-6.5, 3.5, 0.8],
      [-3.2, -4.1, 0.9],
      [1.9, -3.1, 1.2],
      [4.8, 3.2, 0.85],
      [7.9, 3.5, 1.1],
      [8.8, -3.3, 0.8],
    ].forEach(([x, z, scale]) => createTree(greenGroup, x, z, scale));
    scene.add(greenGroup);
    layerGroupsRef.current = { district: buildingsGroup, mobility: mobilityGroup, green: greenGroup };

    const resize = () => {
      const width = host.clientWidth;
      const height = host.clientHeight;
      if (!width || !height) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downX = 0;
    let downY = 0;
    const onPointerDown = (event: PointerEvent) => {
      downX = event.clientX;
      downY = event.clientY;
    };
    const onPointerUp = (event: PointerEvent) => {
      if (Math.hypot(event.clientX - downX, event.clientY - downY) > 6) return;
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(buildingMeshesRef.current, false)[0]?.object as BuildingMesh | undefined;
      if (hit) setSelectedCode(hit.userData.district);
    };
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      controls.dispose();
      renderer.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const material = object.material;
          if (Array.isArray(material)) material.forEach((item) => item.dispose());
          else material.dispose();
        }
      });
      buildingMeshesRef.current = [];
    };
  }, []);

  useEffect(() => {
    buildingMeshesRef.current.forEach((mesh) => {
      const selected = mesh.userData.district === selectedCode;
      mesh.material.emissive.set(selected ? "#d6f28d" : "#000000");
      mesh.material.emissiveIntensity = selected ? 0.42 : 0;
      mesh.position.y = mesh.userData.baseY + (selected ? 0.18 : 0);
    });
    const groups = layerGroupsRef.current;
    if (groups) {
      groups.mobility.visible = activeLayer === "mobility";
      groups.green.visible = activeLayer === "green";
      groups.district.visible = true;
    }
    const controls = controlsRef.current;
    if (controls && focusMode) {
      const targetBuilding = buildings.find((building) => building.district === selectedCode);
      if (targetBuilding) {
        controls.target.lerp(new THREE.Vector3(targetBuilding.x, 1.5, targetBuilding.z), 0.18);
      }
    }
  }, [activeLayer, focusMode, selectedCode]);

  const zoom = (factor: number) => {
    const controls = controlsRef.current;
    const camera = cameraRef.current;
    if (!controls || !camera) return;
    const offset = camera.position.clone().sub(controls.target).multiplyScalar(factor);
    const distance = offset.length();
    if (distance > 7 && distance < 28) camera.position.copy(controls.target.clone().add(offset));
    controls.update();
  };

  const resetView = () => {
    const controls = controlsRef.current;
    const camera = cameraRef.current;
    if (!controls || !camera) return;
    camera.position.set(13, 13, 16);
    controls.target.set(0, 1.2, 0);
    controls.update();
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#dfe4d7] text-[#26382f] selection:bg-[#d6f28d] selection:text-[#22352c]">
      <header className="relative z-30 flex items-center justify-between border-b border-[#536b5c]/20 bg-[#e6eadf]/80 px-5 py-4 backdrop-blur-md md:px-9">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#273d32] text-[#d6f28d]">
            <Compass size={19} strokeWidth={1.7} />
          </div>
          <div>
            <p className="font-['Space_Grotesk'] text-[16px] font-bold tracking-[.22em] text-[#26382f]">URBANOVA</p>
            <p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#6d8274]">Living district / 04</p>
          </div>
        </div>
        <nav className="hidden items-center gap-7 font-mono text-[10px] uppercase tracking-[.18em] text-[#607469] md:flex">
          <button type="button" className="text-[#26382f] underline decoration-[#b5d77b] decoration-2 underline-offset-8">Explore</button>
          <button type="button" className="hover:text-[#26382f]">Districts</button>
          <button type="button" className="hover:text-[#26382f]">Field notes</button>
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 font-mono text-[9px] uppercase tracking-[.12em] text-[#6d8274] sm:flex">
            <Radio size={12} className="text-[#7b9c4b]" /> Live city model
          </span>
          <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="rounded-full border border-[#536b5c]/30 p-2 md:hidden" aria-label="Open menu">
            {menuOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
        {menuOpen && <div className="absolute right-5 top-16 rounded-xl border border-[#536b5c]/20 bg-[#f0f2e9] p-3 text-xs shadow-xl md:hidden"><button type="button" className="block px-4 py-2">Districts</button><button type="button" className="block px-4 py-2">Field notes</button></div>}
      </header>

      <section className="relative mx-auto grid max-w-[1480px] grid-cols-1 gap-5 px-5 py-7 md:px-9 lg:grid-cols-[minmax(300px,370px)_1fr] lg:gap-8 lg:py-10">
        <aside className="relative z-20 flex flex-col justify-between lg:min-h-[660px]">
          <div>
            <div className="mb-6 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.2em] text-[#6e8475]">
              <span className="h-2 w-2 rounded-full bg-[#9dbd5e] shadow-[0_0_0_4px_rgba(157,189,94,.18)]" /> 37.781 / -122.401
            </div>
            <h1 className="max-w-sm font-['Space_Grotesk'] text-[clamp(42px,5vw,78px)] font-light leading-[.92] tracking-[-.07em] text-[#294034]">
              A city that <em className="font-['DM_Serif_Display'] not-italic text-[#557d50]">listens.</em>
            </h1>
            <p className="mt-7 max-w-[315px] text-[15px] leading-7 text-[#607469]">
              Navigate Urbanova, a living prototype for the next generous city. Orbit through neighborhoods shaped by people, climate, and time.
            </p>
          </div>
          <div className="mt-8 border-t border-[#536b5c]/20 pt-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[.18em] text-[#6e8475]">Now viewing</span>
              <span className="rounded-full bg-[#cfe7a0] px-2 py-1 font-mono text-[9px] text-[#48612c]">{selectedDistrict.code}</span>
            </div>
            <h2 className="font-['Space_Grotesk'] text-2xl font-medium tracking-[-.04em]">{selectedDistrict.name}</h2>
            <p className="mt-1 text-sm text-[#718578]">{selectedDistrict.subtitle}</p>
            <p className="mt-4 max-w-[320px] text-[13px] leading-6 text-[#53695c]">{selectedDistrict.detail}</p>
            <div className="mt-5 flex items-end justify-between">
              <div><span className="block font-['Space_Grotesk'] text-2xl">{selectedDistrict.stat.split(" ")[0]}</span><span className="font-mono text-[9px] uppercase tracking-[.15em] text-[#718578]">{selectedDistrict.stat.substring(selectedDistrict.stat.indexOf(" ") + 1)}</span></div>
              <button type="button" onClick={() => setFocusMode(!focusMode)} className="group flex items-center gap-2 rounded-full bg-[#294034] px-4 py-2.5 font-mono text-[9px] uppercase tracking-[.13em] text-[#e2f3bb] transition hover:bg-[#3d5848]">
                {focusMode ? "Exit focus" : "Enter district"} <ArrowUpRight size={13} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </div>
          </div>
        </aside>

        <div className={`relative min-h-[520px] overflow-hidden rounded-[28px] border border-[#536b5c]/25 bg-[#b9c8b5] shadow-[0_25px_70px_rgba(60,82,65,.18)] transition-all duration-700 md:min-h-[660px] ${focusMode ? "lg:scale-[1.02]" : ""}`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,#f4e9c2_0%,#c8d8c2_37%,#92ad9c_100%)]" />
          <canvas ref={canvasRef} className="absolute inset-0 size-full cursor-grab active:cursor-grabbing" aria-label="Interactive 3D city model" />
          <div className="pointer-events-none absolute left-[8%] top-[8%] z-10 font-mono text-[9px] uppercase tracking-[.17em] text-[#637a69]">Urbanova / model 04.24</div>
          <div className="pointer-events-none absolute right-5 top-5 z-20 flex items-center gap-2 rounded-full border border-[#536b5c]/25 bg-[#eef1e4]/70 px-3 py-2 backdrop-blur-md">
            <span className={`h-1.5 w-1.5 rounded-full ${webglReady ? "animate-pulse bg-[#82a753]" : "bg-[#b86c55]"}`} />
            <span className="font-mono text-[9px] uppercase tracking-[.14em] text-[#53695c]">{webglReady ? "Simulation live" : "WebGL unavailable"}</span>
          </div>
          {!webglReady && <div className="absolute inset-0 z-10 grid place-items-center bg-[#dfe4d7]/80 p-8 text-center"><div><p className="font-['Space_Grotesk'] text-xl font-medium text-[#294034]">This city needs a WebGL-capable browser.</p><p className="mt-2 max-w-sm text-sm text-[#607469]">Try the latest Chrome, Safari, or Firefox to explore the model.</p></div></div>}
          <div className="absolute bottom-5 left-5 z-20 flex items-center gap-2">
            <button type="button" onClick={() => zoom(0.82)} className="rounded-lg border border-[#536b5c]/25 bg-[#eef1e4]/75 p-2.5 backdrop-blur-md hover:bg-[#f4f5ed]" aria-label="Zoom in"><Plus size={15} /></button>
            <button type="button" onClick={() => zoom(1.18)} className="rounded-lg border border-[#536b5c]/25 bg-[#eef1e4]/75 p-2.5 backdrop-blur-md hover:bg-[#f4f5ed]" aria-label="Zoom out"><Minus size={15} /></button>
            <button type="button" onClick={resetView} className="rounded-lg border border-[#536b5c]/25 bg-[#eef1e4]/75 p-2.5 backdrop-blur-md hover:bg-[#f4f5ed]" aria-label="Reset view"><RotateCcw size={15} /></button>
          </div>
          <div className="absolute bottom-5 right-5 z-20 hidden items-center gap-2 rounded-lg border border-[#536b5c]/25 bg-[#eef1e4]/75 px-3 py-2 font-mono text-[9px] uppercase tracking-[.14em] text-[#62786a] backdrop-blur-md sm:flex"><MapPin size={13} /> Drag to orbit · tap a building</div>
        </div>
      </section>

      <section className="relative mx-auto flex max-w-[1480px] flex-col gap-5 border-t border-[#536b5c]/20 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-9">
        <div className="flex items-center gap-4 overflow-x-auto">
          <span className="shrink-0 font-mono text-[9px] uppercase tracking-[.18em] text-[#738779]">Layers</span>
          {[
            { id: "district" as const, label: "Districts", icon: Building2 },
            { id: "mobility" as const, label: "Mobility", icon: TrainFront },
            { id: "green" as const, label: "Green cover", icon: Trees },
          ].map(({ id, label, icon: Icon }) => (
            <button type="button" key={id} onClick={() => setActiveLayer(id)} className={`flex shrink-0 items-center gap-2 border-b-2 px-1 pb-2 font-mono text-[10px] uppercase tracking-[.13em] transition ${activeLayer === id ? "border-[#5d8441] text-[#2e4837]" : "border-transparent text-[#7b8e80] hover:text-[#425b49]"}`}><Icon size={14} />{label}</button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.16em] text-[#718578]"><Waves size={14} /> Air quality <strong className="font-semibold text-[#54783c]">Good</strong></span>
          <span className="h-4 w-px bg-[#536b5c]/20" />
          <button type="button" className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.16em] text-[#718578] hover:text-[#294034]"><Layers3 size={14} /> Compare <ChevronDown size={12} /></button>
        </div>
      </section>
      <div className="mx-auto flex max-w-[1480px] items-center justify-center gap-2 px-5 pb-8 text-center font-mono text-[9px] uppercase tracking-[.18em] text-[#809284] md:px-9"><Sparkles size={12} className="text-[#88a75a]" /> An open invitation to imagine what comes next</div>
    </main>
  );
}