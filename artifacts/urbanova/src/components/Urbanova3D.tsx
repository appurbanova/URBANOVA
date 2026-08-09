import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  ArrowUpRight,
  ArrowLeft,
  Building2,
  ChevronDown,
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
    name: "Signal Quarter",
    code: "SQ-01",
    subtitle: "Communication",
    color: "#f4b94e",
    accent: "#9b6c18",
    stat: "18 active signals",
    detail:
      "Your public conversations, notes, and open decisions become light along the east edge.",
  },
  {
    name: "Workshop Row",
    code: "WR-02",
    subtitle: "Building",
    color: "#4bb5a9",
    accent: "#1f6f78",
    stat: "42 structures",
    detail:
      "The places where code becomes a product. Repositories, releases, and shipped work shape this district.",
  },
  {
    name: "Commons",
    code: "CM-03",
    subtitle: "Community",
    color: "#e4786d",
    accent: "#8d443d",
    stat: "126 visitors",
    detail:
      "A shared civic layer for the people who use, test, and extend your work in the open.",
  },
  {
    name: "Archive Heights",
    code: "AH-04",
    subtitle: "Memory",
    color: "#9b8ad6",
    accent: "#61519a",
    stat: "37 preserved blocks",
    detail:
      "Past experiments remain visible. A city should remember what it learned, not just what it launched.",
  },
];

const buildings = [
  { x: -7.2, z: -1.2, w: 2.3, d: 2.2, h: 4.1, tone: "#5a4a39", name: "Signal House", district: "SQ-01", roof: "antenna" },
  { x: -4.8, z: -2.8, w: 1.9, d: 1.8, h: 5.6, tone: "#263c58", name: "Workshop Tower", district: "WR-02", roof: "tower" },
  { x: -2.2, z: 1.3, w: 2.6, d: 2.3, h: 3.1, tone: "#765146", name: "Commons Hall", district: "CM-03", roof: "civic" },
  { x: 0.5, z: -1.6, w: 2.25, d: 2.5, h: 6.9, tone: "#284d59", name: "Archive Exchange", district: "AH-04", roof: "exchange" },
  { x: 3.4, z: 0.2, w: 2.1, d: 2.3, h: 4.4, tone: "#8a662d", name: "Signal Arcade", district: "SQ-01", roof: "arcade" },
  { x: 5.9, z: -2.4, w: 2.8, d: 2.2, h: 2.9, tone: "#315b62", name: "Workshop Court", district: "WR-02", roof: "low" },
  { x: 7.5, z: 1.8, w: 2.1, d: 2.4, h: 5.2, tone: "#514766", name: "Archive House", district: "AH-04", roof: "archive" },
] as const;

type BuildingMesh = THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial> & {
  userData: { buildingName: string; district: string; baseY: number };
};

function createRoad(scene: THREE.Scene, x: number, z: number, width: number, depth: number, rotation = 0) {
  const road = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.08, depth),
    new THREE.MeshStandardMaterial({ color: "#26344d", roughness: 0.95 }),
  );
  road.position.set(x, 0.08, z);
  road.rotation.y = rotation;
  scene.add(road);
}

function createRoadMarkings(
  scene: THREE.Scene,
  x: number,
  z: number,
  count: number,
  spacing: number,
  rotation = 0,
  vertical = false,
) {
  const markings = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ color: "#d8c993", transparent: true, opacity: 0.52 });
  for (let index = 0; index < count; index += 1) {
    const offset = (index - (count - 1) / 2) * spacing;
    const mark = new THREE.Mesh(
      new THREE.BoxGeometry(vertical ? 0.06 : 0.62, 0.018, vertical ? 0.62 : 0.06),
      material,
    );
    mark.position.set(vertical ? 0 : offset, 0.13, vertical ? offset : 0);
    markings.add(mark);
  }
  markings.position.set(x, 0, z);
  markings.rotation.y = rotation;
  scene.add(markings);
}

function createSkylineBuilding(
  scene: THREE.Scene,
  x: number,
  z: number,
  width: number,
  depth: number,
  height: number,
  color: string,
) {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.88, metalness: 0.04 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  body.position.set(x, height / 2, z);
  group.add(body);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.86, 0.06, depth * 0.86),
    new THREE.MeshStandardMaterial({ color: "#17253a", roughness: 0.7, metalness: 0.12 }),
  );
  roof.position.set(x, height + 0.04, z);
  group.add(roof);

  const windows = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.56, Math.min(1.2, height * 0.34), 0.025),
    new THREE.MeshBasicMaterial({ color: "#d4ad5d", transparent: true, opacity: 0.18 }),
  );
  windows.position.set(x, Math.max(0.8, height * 0.54), z - depth / 2 - 0.018);
  group.add(windows);
  scene.add(group);
}

function createTree(group: THREE.Group, x: number, z: number, scale = 1) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08 * scale, 0.11 * scale, 0.55 * scale, 8),
    new THREE.MeshStandardMaterial({ color: "#5a4a39", roughness: 1 }),
  );
  trunk.position.set(x, 0.35 * scale, z);
  const crown = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.46 * scale, 1),
    new THREE.MeshStandardMaterial({ color: "#28707a", roughness: 0.9 }),
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
  const interactiveMeshesRef = useRef<THREE.Object3D[]>([]);
  const vehiclesRef = useRef<THREE.Object3D[]>([]);
  const waterRef = useRef<THREE.Mesh | null>(null);
  const sunRef = useRef<THREE.DirectionalLight | null>(null);
  const hemisphereRef = useRef<THREE.HemisphereLight | null>(null);
  const nightLightsRef = useRef<THREE.Group | null>(null);
  const windowMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const layerGroupsRef = useRef<(Record<Layer, THREE.Group> & { park: THREE.Group }) | null>(null);
  const [selectedCode, setSelectedCode] = useState("SQ-01");
  const [selectedLandmark, setSelectedLandmark] = useState("district");
  const [activeLayer, setActiveLayer] = useState<Layer>("district");
  const [nightMode, setNightMode] = useState(false);
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
    scene.background = new THREE.Color("#10172a");
    scene.fog = new THREE.Fog("#10172a", 18, 34);
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(13, 13, 16);
    cameraRef.current = camera;
    sceneRef.current = scene;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.enablePan = false;
    controls.rotateSpeed = 0.58;
    controls.target.set(0, 1.2, 0);
    controls.minDistance = 7;
    controls.maxDistance = 28;
    controls.maxPolarAngle = Math.PI / 2.05;
    controlsRef.current = controls;

    const hemisphere = new THREE.HemisphereLight("#f8e8c4", "#16283d", 2.6);
    hemisphereRef.current = hemisphere;
    scene.add(hemisphere);
    const sun = new THREE.DirectionalLight("#f4b94e", 3.8);
    sun.position.set(-8, 17, 9);
    sun.castShadow = true;
    sunRef.current = sun;
    scene.add(sun);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 25),
      new THREE.MeshStandardMaterial({ color: "#182237", roughness: 1, metalness: 0 }),
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const grid = new THREE.GridHelper(28, 28, "#5a7691", "#263b56");
    grid.position.y = 0.04;
    (grid.material as THREE.Material).opacity = 0.42;
    (grid.material as THREE.Material).transparent = true;
    scene.add(grid);

    createRoad(scene, 0, -0.6, 25, 0.72, -0.08);
    createRoad(scene, -1.2, 1.9, 0.65, 19, 0.17);
    createRoad(scene, 5.4, -0.4, 0.55, 18, -0.23);
    createRoadMarkings(scene, 0, -0.6, 15, 1.45, -0.08);
    createRoadMarkings(scene, -1.2, 1.9, 11, 1.55, 0.17, true);
    createRoadMarkings(scene, 5.4, -0.4, 10, 1.65, -0.23, true);

    const skylineBuildings: Array<[number, number, number, number, number, string]> = [
      [-10.2, -5.1, 2.2, 2.1, 3.8, "#1d3347"],
      [-7.4, -5.3, 1.8, 1.8, 5.2, "#223b52"],
      [-4.7, -5.5, 2.4, 1.9, 3.4, "#25334a"],
      [0.4, -5.3, 2.2, 2, 4.6, "#1c3047"],
      [4.5, -5.2, 2.6, 2.1, 3.1, "#27384d"],
      [8.1, -5, 1.9, 1.8, 5.6, "#21364d"],
      [10.4, 4.4, 2.4, 2.2, 4.4, "#1c3147"],
      [6.8, 4.6, 1.7, 1.8, 3.5, "#25364c"],
      [-4.8, 5.1, 2.2, 1.8, 4.9, "#1f354b"],
      [-8.1, 4.6, 1.8, 1.6, 3.2, "#29384c"],
    ];
    skylineBuildings.forEach(([x, z, width, depth, height, color]) => {
      createSkylineBuilding(scene, x, z, width, depth, height, color);
    });

    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 25),
      new THREE.MeshStandardMaterial({ color: "#205c6c", transparent: true, opacity: 0.82, roughness: 0.35 }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(-11.2, 0.06, 0);
    scene.add(water);
    waterRef.current = water;

    const buildingsGroup = new THREE.Group();
    const buildingMeshes: BuildingMesh[] = [];
    const windowMaterial = new THREE.MeshStandardMaterial({
      color: "#162c40",
      roughness: 0.26,
      metalness: 0.3,
      emissive: "#f4b94e",
      emissiveIntensity: 0.1,
    });
    windowMaterialRef.current = windowMaterial;
    buildings.forEach((building) => {
      const districtAccent = districts.find((district) => district.code === building.district)?.color ?? "#f4b94e";
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

      const podium = new THREE.Mesh(
        new THREE.BoxGeometry(building.w + 0.28, 0.28, building.d + 0.28),
        new THREE.MeshStandardMaterial({ color: "#17253a", roughness: 0.88, metalness: 0.08 }),
      );
      podium.position.set(building.x, 0.14, building.z);
      podium.castShadow = true;
      buildingsGroup.add(podium);

      const accentStrip = new THREE.Mesh(
        new THREE.BoxGeometry(0.07, building.h * 0.72, 0.045),
        new THREE.MeshStandardMaterial({ color: districtAccent, roughness: 0.45, metalness: 0.3 }),
      );
      accentStrip.position.set(building.x - building.w * 0.28, building.h * 0.54, building.z - building.d / 2 - 0.035);
      buildingsGroup.add(accentStrip);

      const rows = Math.max(2, Math.floor(building.h / 1.15));
      const columns = Math.max(2, Math.floor(building.w / 0.7));
      for (let row = 0; row < rows; row += 1) {
        const y = 0.72 + row * 1.02;
        if (y > building.h - 0.3) continue;
        for (let column = 0; column < columns; column += 1) {
          const x = -building.w / 2 + 0.36 + column * (building.w / columns);
          const frontWindow = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.3, 0.045), windowMaterial);
          frontWindow.position.set(building.x + x, y, building.z - building.d / 2 - 0.025);
          buildingsGroup.add(frontWindow);
          if (column < Math.max(1, columns - 1)) {
            const sideWindow = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.3, 0.22), windowMaterial);
            sideWindow.position.set(building.x + building.w / 2 + 0.025, y, building.z + x * 0.72);
            buildingsGroup.add(sideWindow);
          }
        }
      }

      const roof = new THREE.Mesh(
        new THREE.BoxGeometry(building.w * 0.84, 0.08, building.d * 0.84),
        new THREE.MeshStandardMaterial({ color: districtAccent, roughness: 0.72, metalness: 0.25 }),
      );
      roof.position.set(building.x, building.h + 0.06, building.z);
      buildingsGroup.add(roof);

      if (building.roof === "antenna" || building.roof === "tower") {
        const mast = new THREE.Mesh(
          new THREE.CylinderGeometry(0.035, 0.05, building.roof === "tower" ? 1.2 : 0.85, 8),
          new THREE.MeshStandardMaterial({ color: "#aeb9c1", roughness: 0.45, metalness: 0.65 }),
        );
        mast.position.set(building.x, building.h + (building.roof === "tower" ? 0.7 : 0.52), building.z);
        buildingsGroup.add(mast);
        const beacon = new THREE.Mesh(
          new THREE.SphereGeometry(0.09, 10, 8),
          new THREE.MeshBasicMaterial({ color: districtAccent }),
        );
        beacon.position.set(mast.position.x, mast.position.y + (building.roof === "tower" ? 0.63 : 0.46), mast.position.z);
        buildingsGroup.add(beacon);
      } else if (building.roof === "exchange") {
        const crown = new THREE.Mesh(
          new THREE.BoxGeometry(building.w * 0.48, 0.38, building.d * 0.48),
          new THREE.MeshStandardMaterial({ color: "#18263d", roughness: 0.5, metalness: 0.35 }),
        );
        crown.position.set(building.x, building.h + 0.28, building.z);
        buildingsGroup.add(crown);
        const crownLight = new THREE.Mesh(
          new THREE.BoxGeometry(building.w * 0.3, 0.045, building.d * 0.3),
          new THREE.MeshBasicMaterial({ color: districtAccent }),
        );
        crownLight.position.set(building.x, building.h + 0.49, building.z);
        buildingsGroup.add(crownLight);
      } else if (building.roof === "civic" || building.roof === "arcade") {
        const canopy = new THREE.Mesh(
          new THREE.BoxGeometry(building.w * 0.68, 0.1, building.d * 0.68),
          new THREE.MeshStandardMaterial({ color: "#b17c48", roughness: 0.8, metalness: 0.1 }),
        );
        canopy.position.set(building.x, building.h + 0.25, building.z);
        buildingsGroup.add(canopy);
        [-0.32, 0.32].forEach((offset) => {
          const column = new THREE.Mesh(
            new THREE.CylinderGeometry(0.035, 0.045, 0.34, 8),
            new THREE.MeshStandardMaterial({ color: "#b17c48", roughness: 0.8 }),
          );
          column.position.set(building.x + offset * building.w, building.h + 0.13, building.z);
          buildingsGroup.add(column);
        });
      } else {
        [-0.3, 0.3].forEach((offset) => {
          const vent = new THREE.Mesh(
            new THREE.BoxGeometry(0.24, 0.14, 0.24),
            new THREE.MeshStandardMaterial({ color: "#657486", roughness: 0.72, metalness: 0.35 }),
          );
          vent.position.set(building.x + offset * building.w, building.h + 0.17, building.z);
          buildingsGroup.add(vent);
        });
      }
    });
    scene.add(buildingsGroup);
    buildingMeshesRef.current = buildingMeshes;
    interactiveMeshesRef.current = [...buildingMeshes];

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
    const vehicleMaterials = {
      body: new THREE.MeshStandardMaterial({ color: "#f4b94e", roughness: 0.5, metalness: 0.15 }),
      glass: new THREE.MeshStandardMaterial({ color: "#172b42", roughness: 0.2, metalness: 0.35 }),
      light: new THREE.MeshBasicMaterial({ color: "#fff1b8" }),
    };
    const vehicles: THREE.Group[] = [];
    for (let index = 0; index < 3; index += 1) {
      const vehicle = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.18, 0.34), vehicleMaterials.body);
      body.position.y = 0.18;
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.27), vehicleMaterials.glass);
      cabin.position.set(-0.04, 0.33, 0);
      const headlight = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.08), vehicleMaterials.light);
      headlight.position.set(0.37, 0.21, -0.1);
      vehicle.add(body, cabin, headlight);
      vehicle.position.set(-9 + index * 6.2, 0, 3.4 - index * 1.6);
      mobilityGroup.add(vehicle);
      vehicles.push(vehicle);
    }
    vehiclesRef.current = vehicles;
    scene.add(mobilityGroup);

    const parkGroup = new THREE.Group();
    const parkBase = new THREE.Mesh(
      new THREE.BoxGeometry(5.4, 0.12, 4.2),
      new THREE.MeshStandardMaterial({ color: "#245148", roughness: 1 }),
    );
    parkBase.position.set(1.4, 0.11, 3.45);
    parkBase.userData = { district: "CM-03", landmark: "Civic Canopy" };
    parkGroup.add(parkBase);
    const lawn = new THREE.Mesh(
      new THREE.BoxGeometry(4.85, 0.05, 3.65),
      new THREE.MeshStandardMaterial({ color: "#2f7b67", roughness: 1 }),
    );
    lawn.position.set(1.4, 0.2, 3.45);
    lawn.userData = { district: "CM-03", landmark: "Civic Canopy" };
    parkGroup.add(lawn);
    const paths = new THREE.Mesh(
      new THREE.BoxGeometry(4.9, 0.035, 0.22),
      new THREE.MeshStandardMaterial({ color: "#c7a979", roughness: 1 }),
    );
    paths.position.set(1.4, 0.24, 3.45);
    parkGroup.add(paths);
    const crossPath = paths.clone();
    crossPath.rotation.y = Math.PI / 2;
    crossPath.scale.x = 0.74;
    crossPath.position.set(1.4, 0.245, 3.45);
    parkGroup.add(crossPath);
    const fountain = new THREE.Mesh(
      new THREE.CylinderGeometry(0.52, 0.62, 0.1, 24),
      new THREE.MeshStandardMaterial({ color: "#4a9aaa", roughness: 0.22, metalness: 0.25 }),
    );
    fountain.position.set(1.4, 0.3, 3.45);
    fountain.userData = { district: "CM-03", landmark: "Civic Canopy" };
    parkGroup.add(fountain);
    const fountainLight = new THREE.PointLight("#78e3d3", 0.6, 3.2);
    fountainLight.position.set(1.4, 0.7, 3.45);
    parkGroup.add(fountainLight);
    [
      [-0.45, 2.35, 0.9],
      [3.15, 2.35, 0.82],
      [-0.45, 4.55, 0.78],
      [3.25, 4.55, 0.9],
    ].forEach(([x, z, scale]) => createTree(parkGroup, x, z, scale));
    [
      [-0.15, 3.05, 0.65],
      [2.95, 3.05, 0.65],
      [-0.15, 3.85, 0.65],
      [2.95, 3.85, 0.65],
    ].forEach(([x, z, scale]) => {
      const bench = new THREE.Group();
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.72 * scale, 0.09, 0.18), new THREE.MeshStandardMaterial({ color: "#9a7147", roughness: 0.9 }));
      seat.position.set(x, 0.42, z);
      const legA = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.06), seat.material);
      legA.position.set(x - 0.24 * scale, 0.28, z);
      const legB = legA.clone();
      legB.position.x = x + 0.24 * scale;
      bench.add(seat, legA, legB);
      parkGroup.add(bench);
    });
    const parkHit = new THREE.Mesh(
      new THREE.BoxGeometry(5.4, 0.08, 4.2),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.01, depthWrite: false }),
    );
    parkHit.position.set(1.4, 0.35, 3.45);
    parkHit.userData = { district: "CM-03", landmark: "Civic Canopy" };
    parkGroup.add(parkHit);
    interactiveMeshesRef.current.push(parkHit);
    scene.add(parkGroup);

    const nightLights = new THREE.Group();
    [
      [-8.8, -0.05],
      [-5.6, -0.4],
      [-2.5, -0.75],
      [0.7, -1.1],
      [3.8, -1.45],
      [7.1, -1.8],
      [-1.7, 2.5],
      [4.8, 1.7],
    ].forEach(([x, z]) => {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.035, 0.85, 8),
        new THREE.MeshStandardMaterial({ color: "#7e8795", roughness: 0.6, metalness: 0.65 }),
      );
      pole.position.set(x, 0.5, z);
      const lamp = new THREE.Mesh(
        new THREE.SphereGeometry(0.105, 12, 8),
        new THREE.MeshBasicMaterial({ color: "#ffe4a1" }),
      );
      lamp.position.set(x, 0.96, z);
      const glow = new THREE.PointLight("#ffc86e", 0.9, 2.7, 2);
      glow.position.set(x, 0.95, z);
      nightLights.add(pole, lamp, glow);
    });
    nightLights.visible = false;
    nightLightsRef.current = nightLights;
    scene.add(nightLights);

    const signalNodes: THREE.Mesh[] = [];
    const signalGroup = new THREE.Group();
    [
      [-7.2, 2.5, "#f4b94e"],
      [-4.5, -1.2, "#4bb5a9"],
      [-1.2, 2.1, "#e4786d"],
      [2.8, -0.5, "#f4b94e"],
      [6.7, 2.6, "#9b8ad6"],
      [8.1, -1.1, "#4bb5a9"],
    ].forEach(([x, z, color]) => {
      const node = new THREE.Mesh(
        new THREE.RingGeometry(0.16, 0.2, 20),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.72, side: THREE.DoubleSide }),
      );
      node.rotation.x = -Math.PI / 2;
      node.position.set(Number(x), 0.18, Number(z));
      signalGroup.add(node);
      signalNodes.push(node);
    });
    scene.add(signalGroup);

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
    layerGroupsRef.current = { district: buildingsGroup, mobility: mobilityGroup, green: greenGroup, park: parkGroup };

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
      const hit = raycaster.intersectObjects(interactiveMeshesRef.current, true)[0]?.object as (THREE.Object3D & { userData: { district?: string; landmark?: string } }) | undefined;
      if (hit?.userData.district) {
        setSelectedCode(hit.userData.district);
        setSelectedLandmark(hit.userData.landmark ? "park" : "district");
      }
    };
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);

    let frame = 0;
    const animate = (time = 0) => {
      frame = requestAnimationFrame(animate);
      controls.update();
      water.rotation.z = Math.sin(time * 0.00035) * 0.006;
      vehicles.forEach((vehicle, index) => {
        const progress = (time * 0.000035 + index * 0.31) % 1;
        vehicle.position.x = -9 + progress * 18.5;
        vehicle.position.z = 3.4 - progress * 4.9 + Math.sin(progress * Math.PI) * 0.5;
        vehicle.rotation.y = -0.25;
      });
      signalNodes.forEach((node, index) => {
        const pulse = (Math.sin(time * 0.0015 + index * 1.7) + 1) / 2;
        const scale = 0.86 + pulse * 0.48;
        node.scale.setScalar(scale);
        (node.material as THREE.MeshBasicMaterial).opacity = 0.22 + pulse * 0.62;
      });
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
      interactiveMeshesRef.current = [];
      vehiclesRef.current = [];
      waterRef.current = null;
      sunRef.current = null;
      hemisphereRef.current = null;
      nightLightsRef.current = null;
      windowMaterialRef.current = null;
    };
  }, []);

  useEffect(() => {
    buildingMeshesRef.current.forEach((mesh) => {
      const selected = mesh.userData.district === selectedCode;
      mesh.material.emissive.set(selected ? "#f4b94e" : "#000000");
      mesh.material.emissiveIntensity = selected ? 0.42 : 0;
      mesh.position.y = mesh.userData.baseY + (selected ? 0.18 : 0);
    });
    const groups = layerGroupsRef.current;
    if (groups) {
      groups.mobility.visible = activeLayer === "mobility";
      groups.green.visible = activeLayer === "green";
      groups.district.visible = true;
      groups.park.visible = true;
    }
    const controls = controlsRef.current;
    if (controls && focusMode) {
      const targetBuilding = buildings.find((building) => building.district === selectedCode);
      if (targetBuilding) {
        controls.target.lerp(new THREE.Vector3(targetBuilding.x, 1.5, targetBuilding.z), 0.18);
      }
    }
  }, [activeLayer, focusMode, selectedCode]);

  useEffect(() => {
    const scene = sceneRef.current;
    const sun = sunRef.current;
    const hemisphere = hemisphereRef.current;
    const nightLights = nightLightsRef.current;
    if (!scene || !sun || !hemisphere || !nightLights) return;
    const sky = nightMode ? "#080d1b" : "#11172a";
    scene.background = new THREE.Color(sky);
    scene.fog = new THREE.Fog(sky, 18, 34);
    sun.intensity = nightMode ? 0.42 : 3.8;
    hemisphere.intensity = nightMode ? 0.85 : 2.6;
    nightLights.visible = nightMode;
    if (windowMaterialRef.current) {
      windowMaterialRef.current.emissiveIntensity = nightMode ? 1.15 : 0.1;
    }
    buildingMeshesRef.current.forEach((mesh) => {
      const selected = mesh.userData.district === selectedCode;
      mesh.material.emissive.set(nightMode ? "#b36a2e" : selected ? "#f4b94e" : "#000000");
      mesh.material.emissiveIntensity = nightMode ? 0.12 : selected ? 0.42 : 0;
    });
  }, [nightMode, selectedCode]);

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
    <main className="min-h-screen overflow-hidden bg-[#0b1020] text-[#eae6d5] selection:bg-[#f4b94e] selection:text-[#0b1020]">
      <header className="relative z-30 flex items-center justify-between border-b border-[#34415b] bg-[#0b1020]/90 px-5 py-4 backdrop-blur-md md:px-9">
        <a href="/" aria-label="Back to URBANOVA home" className="group flex items-center gap-3">
          <div className="brand-mark relative grid h-9 w-9 place-items-center border">
            <span className="brand-mark-core h-3 w-3 transition-transform group-hover:scale-75" />
            <span className="brand-mark-frame absolute inset-1.5 border" />
          </div>
          <div>
            <p className="brand-wordmark font-['Space_Grotesk'] text-[16px] font-bold tracking-[.22em]">URBANOVA</p>
            <p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#8891a7]">Living city / 04 districts</p>
          </div>
        </a>
        <nav className="hidden items-center gap-7 font-mono text-[10px] uppercase tracking-[.18em] text-[#8891a7] md:flex">
          <a href="/" className="flex items-center gap-2 border border-[#f4b94e]/60 px-3 py-2 text-[#f4b94e] transition hover:bg-[#f4b94e]/10" aria-label="Back to home">
            <ArrowLeft size={13} /> Back to home
          </a>
          <button type="button" className="text-[#f4b94e] underline decoration-[#f4b94e] decoration-2 underline-offset-8">Explore</button>
          <button type="button" className="hover:text-[#f4b94e]">Districts</button>
          <button type="button" className="hover:text-[#f4b94e]">Field notes</button>
        </nav>
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-1.5 border border-[#f4b94e]/60 px-2.5 py-2 font-mono text-[9px] uppercase tracking-[.11em] text-[#f4b94e] transition hover:bg-[#f4b94e]/10 md:hidden" aria-label="Back to home">
            <ArrowLeft size={13} /> Home
          </a>
          <span className="hidden items-center gap-2 font-mono text-[9px] uppercase tracking-[.12em] text-[#8891a7] sm:flex">
            <Radio size={12} className="text-[#4bb5a9]" /> Live city model
          </span>
          <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="border border-[#2b344b] p-2 md:hidden" aria-label="Open menu">
            {menuOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
        {menuOpen && <div className="absolute right-5 top-16 border border-[#2b344b] bg-[#141a2d] p-3 text-xs shadow-xl md:hidden"><button type="button" className="block px-4 py-2 text-[#c0c4cf]">Districts</button><button type="button" className="block px-4 py-2 text-[#c0c4cf]">Field notes</button></div>}
      </header>

      <section className="relative mx-auto grid max-w-[1480px] grid-cols-1 gap-5 px-5 py-7 md:px-9 lg:grid-cols-[minmax(300px,370px)_1fr] lg:gap-8 lg:py-10">
        <aside className="relative z-20 flex flex-col justify-between lg:min-h-[660px]">
          <div>
            <div className="mb-6 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.2em] text-[#a7afc0]">
              <span className="h-2 w-2 rounded-full bg-[#e4786d] shadow-[0_0_0_4px_rgba(228,120,109,.16)]" /> 37.781 / -122.401
            </div>
            <h1 className="max-w-sm font-['Space_Grotesk'] text-[clamp(42px,5vw,78px)] font-semibold leading-[.92] tracking-[-.07em] text-[#f2eee4]">
              Your work is already a <em className="not-italic text-[#f4b94e]">city.</em>
            </h1>
            <p className="mt-7 max-w-[315px] text-[15px] leading-7 text-[#9aa1b3]">
              URBANOVA turns the things you build in public into a living, explorable world. Orbit through districts shaped by signal, structure, and time.
            </p>
          </div>
          <div className="mt-8 border-t border-[#2b344b] pt-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[.18em] text-[#8891a7]">Now viewing</span>
              <span className="border border-[#f4b94e]/50 bg-[#f4b94e]/10 px-2 py-1 font-mono text-[9px] text-[#f4b94e]">{selectedDistrict.code}</span>
            </div>
            <h2 className="font-['Space_Grotesk'] text-2xl font-semibold tracking-[-.04em]">{selectedLandmark === "park" ? "Civic Canopy" : selectedDistrict.name}</h2>
            <p className="mt-1 text-sm text-[#9aa1b3]">{selectedLandmark === "park" ? "Urban green room" : selectedDistrict.subtitle}</p>
            <p className="mt-4 max-w-[320px] text-[13px] leading-6 text-[#8891a7]">{selectedLandmark === "park" ? "A shaded civic park where public activity slows down: four tree groves, a reflective fountain, and room for neighbors to meet." : selectedDistrict.detail}</p>
            <div className="mt-5 flex items-end justify-between">
              <div><span className="block font-['Space_Grotesk'] text-2xl text-[#f2eee4]">{selectedDistrict.stat.split(" ")[0]}</span><span className="font-mono text-[9px] uppercase tracking-[.15em] text-[#8891a7]">{selectedDistrict.stat.substring(selectedDistrict.stat.indexOf(" ") + 1)}</span></div>
              <button type="button" onClick={() => setFocusMode(!focusMode)} className="group flex items-center gap-2 bg-[#f4b94e] px-4 py-2.5 font-mono text-[9px] uppercase tracking-[.13em] text-[#101526] transition hover:bg-[#ffd06f]">
                {focusMode ? "Exit focus" : "Enter district"} <ArrowUpRight size={13} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </div>
          </div>
        </aside>

        <div className={`relative min-h-[520px] overflow-hidden border border-[#2b344b] bg-[#11172a] shadow-[0_25px_70px_rgba(0,0,0,.32)] transition-all duration-700 md:min-h-[660px] ${focusMode ? "lg:scale-[1.02]" : ""}`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,#263044_0%,#131b30_48%,#0d1221_100%)]" />
          <canvas ref={canvasRef} className="absolute inset-0 size-full cursor-grab active:cursor-grabbing" aria-label="Interactive 3D city model" />
          <div className="pointer-events-none absolute left-[8%] top-[8%] z-10 font-mono text-[9px] uppercase tracking-[.17em] text-[#8891a7]">URBANOVA / live city model</div>
          <div className="pointer-events-none absolute right-5 top-5 z-20 flex items-center gap-2 border border-[#2b344b] bg-[#11182b]/80 px-3 py-2 backdrop-blur-md">
            <span className={`h-1.5 w-1.5 ${webglReady ? "animate-pulse bg-[#4bb5a9]" : "bg-[#e4786d]"}`} />
            <span className="font-mono text-[9px] uppercase tracking-[.14em] text-[#c0c4cf]">{webglReady ? "Simulation live" : "WebGL unavailable"}</span>
          </div>
          <button type="button" onClick={() => setNightMode((current) => !current)} className="absolute left-5 top-5 z-20 flex items-center gap-2 border border-[#2b344b] bg-[#11182b]/80 px-3 py-2 font-mono text-[9px] uppercase tracking-[.14em] text-[#c0c4cf] backdrop-blur-md transition hover:border-[#f4b94e] hover:text-[#f4b94e]" aria-pressed={nightMode}>
            <span className={`h-1.5 w-1.5 rounded-full ${nightMode ? "bg-[#f4b94e]" : "bg-[#4bb5a9]"}`} />
            {nightMode ? "Night city" : "Day city"}
          </button>
          {!webglReady && <div className="absolute inset-0 z-10 grid place-items-center bg-[#0f1324]/85 p-8 text-center"><div><p className="font-['Space_Grotesk'] text-xl font-medium text-[#f2eee4]">This city needs a WebGL-capable browser.</p><p className="mt-2 max-w-sm text-sm text-[#9aa1b3]">Try the latest Chrome, Safari, or Firefox to explore the model.</p></div></div>}
          <div className="absolute bottom-5 left-5 z-20 flex items-center gap-2">
            <button type="button" onClick={() => zoom(0.82)} className="border border-[#2b344b] bg-[#11182b]/80 p-2.5 text-[#c0c4cf] backdrop-blur-md hover:border-[#f4b94e] hover:text-[#f4b94e]" aria-label="Zoom in"><Plus size={15} /></button>
            <button type="button" onClick={() => zoom(1.18)} className="border border-[#2b344b] bg-[#11182b]/80 p-2.5 text-[#c0c4cf] backdrop-blur-md hover:border-[#f4b94e] hover:text-[#f4b94e]" aria-label="Zoom out"><Minus size={15} /></button>
            <button type="button" onClick={resetView} className="border border-[#2b344b] bg-[#11182b]/80 p-2.5 text-[#c0c4cf] backdrop-blur-md hover:border-[#f4b94e] hover:text-[#f4b94e]" aria-label="Reset view"><RotateCcw size={15} /></button>
          </div>
          <div className="absolute bottom-5 right-5 z-20 hidden items-center gap-2 border border-[#2b344b] bg-[#11182b]/80 px-3 py-2 font-mono text-[9px] uppercase tracking-[.14em] text-[#9aa1b3] backdrop-blur-md sm:flex"><MapPin size={13} /> Drag to orbit · tap a building or park</div>
        </div>
      </section>

      <section className="relative mx-auto flex max-w-[1480px] flex-col gap-5 border-t border-[#2b344b] px-5 py-5 md:flex-row md:items-center md:justify-between md:px-9">
        <div className="flex items-center gap-4 overflow-x-auto">
          <span className="shrink-0 font-mono text-[9px] uppercase tracking-[.18em] text-[#8891a7]">Layers</span>
          {[
            { id: "district" as const, label: "Districts", icon: Building2 },
            { id: "mobility" as const, label: "Mobility", icon: TrainFront },
            { id: "green" as const, label: "Green cover", icon: Trees },
          ].map(({ id, label, icon: Icon }) => (
            <button type="button" key={id} onClick={() => setActiveLayer(id)} className={`flex shrink-0 items-center gap-2 border-b-2 px-1 pb-2 font-mono text-[10px] uppercase tracking-[.13em] transition ${activeLayer === id ? "border-[#f4b94e] text-[#f4b94e]" : "border-transparent text-[#8891a7] hover:text-[#f2eee4]"}`}><Icon size={14} />{label}</button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.16em] text-[#8891a7]"><Waves size={14} /> City health <strong className="font-semibold text-[#4bb5a9]">86.4</strong></span>
          <span className="h-4 w-px bg-[#2b344b]" />
          <div className="hidden items-center gap-3 font-mono text-[9px] uppercase tracking-[.12em] text-[#8891a7] sm:flex" aria-label="Map legend">
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#2f7b67]" /> Park</span>
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#f4b94e]" /> Signals</span>
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#4bb5a9]" /> Mobility</span>
          </div>
          <button type="button" onClick={() => setNightMode((current) => !current)} className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.16em] text-[#8891a7] hover:text-[#f4b94e]"><Layers3 size={14} /> {nightMode ? "Daylight" : "Night view"} <ChevronDown size={12} /></button>
        </div>
      </section>
      <div className="mx-auto flex max-w-[1480px] items-center justify-center gap-2 px-5 pb-8 text-center font-mono text-[9px] uppercase tracking-[.18em] text-[#8891a7] md:px-9"><Sparkles size={12} className="text-[#f4b94e]" /> Public activity, made legible</div>
    </main>
  );
}