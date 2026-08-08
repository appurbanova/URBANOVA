import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Building2, RotateCcw, Trees, TrainFront } from "lucide-react";

type Layer = "district" | "mobility" | "green";

const buildings = [
  { x: -6.4, z: -1.3, w: 2.2, d: 2.1, h: 3.8, tone: "#765146", code: "SQ-01" },
  { x: -4.3, z: -2.6, w: 1.7, d: 1.7, h: 5.5, tone: "#263c58", code: "WR-02" },
  { x: -2.1, z: 1.5, w: 2.4, d: 2.1, h: 3, tone: "#8a662d", code: "CM-03" },
  { x: 0.6, z: -1.6, w: 2, d: 2.3, h: 6.8, tone: "#284d59", code: "AH-04" },
  { x: 3.2, z: 0.3, w: 1.9, d: 2.1, h: 4.2, tone: "#5a4a39", code: "SQ-01" },
  { x: 5.5, z: -2.3, w: 2.5, d: 2, h: 2.8, tone: "#315b62", code: "WR-02" },
  { x: 7.1, z: 1.7, w: 2, d: 2.2, h: 5, tone: "#514766", code: "AH-04" },
] as const;

function addTree(group: THREE.Group, x: number, z: number, scale: number) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08 * scale, 0.11 * scale, 0.5 * scale, 8),
    new THREE.MeshStandardMaterial({ color: "#5a4a39", roughness: 1 }),
  );
  trunk.position.set(x, 0.3 * scale, z);
  const crown = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.44 * scale, 1),
    new THREE.MeshStandardMaterial({ color: "#28707a", roughness: 0.9 }),
  );
  crown.position.set(x, 0.85 * scale, z);
  group.add(trunk, crown);
}

export function UrbanovaCityPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const buildingMeshesRef = useRef<THREE.Mesh[]>([]);
  const layerGroupsRef = useRef<Record<Layer, THREE.Group> | null>(null);
  const [activeLayer, setActiveLayer] = useState<Layer>("district");
  const [selectedCode, setSelectedCode] = useState("SQ-01");
  const [webglReady, setWebglReady] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      setWebglReady(false);
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#11172a");
    scene.fog = new THREE.Fog("#11172a", 17, 31);
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(12.5, 11.5, 15);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.target.set(0, 1.1, 0);
    controls.minDistance = 7;
    controls.maxDistance = 25;
    controls.maxPolarAngle = Math.PI / 2.05;
    controlsRef.current = controls;

    scene.add(new THREE.HemisphereLight("#f8e8c4", "#16283d", 2.6));
    const sun = new THREE.DirectionalLight("#f4b94e", 3.6);
    sun.position.set(-8, 17, 9);
    scene.add(sun);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(29, 23),
      new THREE.MeshStandardMaterial({ color: "#182237", roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const grid = new THREE.GridHelper(27, 27, "#28556a", "#1d3047");
    grid.position.y = 0.04;
    (grid.material as THREE.Material).opacity = 0.42;
    (grid.material as THREE.Material).transparent = true;
    scene.add(grid);

    const roadMaterial = new THREE.MeshStandardMaterial({
      color: "#26344d",
      roughness: 0.95,
    });
    const road = new THREE.Mesh(new THREE.BoxGeometry(25, 0.08, 0.72), roadMaterial);
    road.position.set(0, 0.08, -0.6);
    road.rotation.y = -0.08;
    scene.add(road);
    const crossRoad = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.08, 19), roadMaterial);
    crossRoad.position.set(-1.1, 0.08, 1.9);
    crossRoad.rotation.y = 0.17;
    scene.add(crossRoad);

    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(7.5, 24),
      new THREE.MeshStandardMaterial({
        color: "#174b62",
        transparent: true,
        opacity: 0.82,
        roughness: 0.35,
      }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(-11.1, 0.06, 0);
    scene.add(water);

    const districtGroup = new THREE.Group();
    const buildingMeshes: THREE.Mesh[] = [];
    buildings.forEach((building) => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(building.w, building.h, building.d),
        new THREE.MeshStandardMaterial({
          color: building.tone,
          roughness: 0.75,
          metalness: 0.05,
          emissive: "#000000",
        }),
      );
      mesh.position.set(building.x, building.h / 2, building.z);
      mesh.userData = { code: building.code, baseY: building.h / 2 };
      buildingMeshes.push(mesh);
      districtGroup.add(mesh);

      const roof = new THREE.Mesh(
        new THREE.BoxGeometry(building.w * 0.84, 0.08, building.d * 0.84),
        new THREE.MeshStandardMaterial({ color: "#101a2b", roughness: 0.9 }),
      );
      roof.position.set(building.x, building.h + 0.06, building.z);
      districtGroup.add(roof);
    });
    scene.add(districtGroup);
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
      new THREE.LineDashedMaterial({ color: "#f3e5ae", dashSize: 0.42, gapSize: 0.26 }),
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
    ].forEach(([x, z, scale]) => addTree(greenGroup, x, z, scale));
    scene.add(greenGroup);
    layerGroupsRef.current = {
      district: districtGroup,
      mobility: mobilityGroup,
      green: greenGroup,
    };

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
    const onPointerUp = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(buildingMeshes, false)[0]?.object;
      if (hit) setSelectedCode(String(hit.userData.code));
    };
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
      layerGroupsRef.current = null;
    };
  }, []);

  useEffect(() => {
    buildingMeshesRef.current.forEach((mesh) => {
      const selected = mesh.userData.code === selectedCode;
      const material = mesh.material as THREE.MeshStandardMaterial;
      material.emissive.set(selected ? "#f4b94e" : "#000000");
      material.emissiveIntensity = selected ? 0.42 : 0;
      mesh.position.y = Number(mesh.userData.baseY) + (selected ? 0.18 : 0);
    });
    const groups = layerGroupsRef.current;
    if (groups) {
      groups.district.visible = true;
      groups.mobility.visible = activeLayer === "mobility";
      groups.green.visible = activeLayer === "green";
    }
  }, [activeLayer, selectedCode]);

  const resetView = () => {
    const controls = controlsRef.current;
    const camera = cameraRef.current;
    if (!controls || !camera) return;
    camera.position.set(12.5, 11.5, 15);
    controls.target.set(0, 1.1, 0);
    controls.update();
  };

  return (
    <div className="relative h-full min-h-[390px] overflow-hidden border border-border bg-[#11172a] shadow-[0_25px_70px_rgba(0,0,0,.3)] sm:min-h-[510px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,#263044_0%,#131b30_48%,#0d1221_100%)]" />
      <canvas ref={canvasRef} className="absolute inset-0 size-full cursor-grab active:cursor-grabbing" aria-label="Interactive 3D city model" />
      <div className="pointer-events-none absolute left-5 top-5 z-10 font-mono text-[9px] uppercase tracking-[.17em] text-[#8891a7]">
        URBANOVA / live city model
      </div>
      <div className="absolute right-5 top-5 z-10 flex items-center gap-2 border border-[#2b344b] bg-[#11182b]/80 px-3 py-2 backdrop-blur-md">
        <span className={`h-1.5 w-1.5 ${webglReady ? "animate-pulse bg-[#4bb5a9]" : "bg-[#e4786d]"}`} />
        <span className="font-mono text-[9px] uppercase tracking-[.14em] text-[#c0c4cf]">
          {webglReady ? "Simulation live" : "WebGL unavailable"}
        </span>
      </div>
      {!webglReady && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-[#0f1324]/85 p-8 text-center">
          <div>
            <p className="font-display text-xl font-medium text-[#f2eee4]">This city needs a WebGL-capable browser.</p>
            <p className="mt-2 max-w-sm text-sm text-[#9aa1b3]">Try the latest Chrome, Safari, or Firefox to explore the model.</p>
          </div>
        </div>
      )}
      <div className="absolute bottom-5 left-5 z-10 flex items-center gap-2">
        {[
          { id: "district" as const, label: "Districts", icon: Building2 },
          { id: "mobility" as const, label: "Mobility", icon: TrainFront },
          { id: "green" as const, label: "Green", icon: Trees },
        ].map(({ id, label, icon: Icon }) => (
          <button
            type="button"
            key={id}
            onClick={() => setActiveLayer(id)}
            className={`flex items-center gap-1.5 border px-2.5 py-2 font-mono text-[9px] uppercase tracking-[.1em] backdrop-blur-md transition ${
              activeLayer === id
                ? "border-[#f4b94e] bg-[#f4b94e]/15 text-[#f4b94e]"
                : "border-[#2b344b] bg-[#11182b]/80 text-[#9aa1b3] hover:border-[#f4b94e]"
            }`}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={resetView}
        className="absolute bottom-5 right-5 z-10 border border-[#2b344b] bg-[#11182b]/80 p-2.5 text-[#c0c4cf] backdrop-blur-md hover:border-[#f4b94e] hover:text-[#f4b94e]"
        aria-label="Reset 3D city view"
      >
        <RotateCcw size={14} />
      </button>
      <div className="pointer-events-none absolute bottom-20 right-5 z-10 hidden border border-[#2b344b] bg-[#11182b]/80 px-3 py-2 font-mono text-[9px] uppercase tracking-[.14em] text-[#9aa1b3] sm:block">
        Drag to orbit · tap a building · {selectedCode}
      </div>
    </div>
  );
}