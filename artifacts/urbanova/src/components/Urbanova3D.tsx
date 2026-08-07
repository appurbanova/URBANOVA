import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Building2,
  ChevronDown,
  Compass,
  Eye,
  Layers3,
  MapPin,
  Menu,
  Minus,
  Plus,
  Radio,
  Scan,
  Sparkles,
  TrainFront,
  Trees,
  Waves,
  X,
} from "lucide-react";

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
    detail: "A terraced neighborhood where every address opens to a shared garden, with evening markets woven into the pedestrian level.",
  },
  {
    name: "Tideworks",
    code: "TW-02",
    subtitle: "Waterfront civic lab",
    color: "#9bdbd5",
    accent: "#216c6e",
    stat: "06 min to water",
    detail: "The district's working edge: tidal gardens, a public bathhouse, and small-scale fabrication in the old dock sheds.",
  },
  {
    name: "Foundry Row",
    code: "FR-07",
    subtitle: "Culture + production",
    color: "#f2be73",
    accent: "#92552b",
    stat: "24/7 active",
    detail: "A low-rise band of studios, food halls and night schools that keeps the original industrial grain alive.",
  },
];

const buildings = [
  { x: 9, y: 28, w: 49, h: 145, d: 46, tone: "#d7c8aa", name: "Morrow House" },
  { x: 21, y: 22, w: 38, h: 193, d: 42, tone: "#789196", name: "Lumen Tower" },
  { x: 32, y: 34, w: 54, h: 112, d: 53, tone: "#bf8258", name: "Foundry Hall" },
  { x: 47, y: 14, w: 46, h: 246, d: 50, tone: "#a9c7bd", name: "Canopy Exchange" },
  { x: 59, y: 28, w: 42, h: 153, d: 45, tone: "#d9ad69", name: "Arcade 06" },
  { x: 70, y: 40, w: 55, h: 105, d: 52, tone: "#91a98d", name: "Juniper Court" },
  { x: 83, y: 22, w: 39, h: 183, d: 40, tone: "#b4d7d5", name: "Tide House" },
];

function Building({
  building,
  index,
  selected,
}: {
  building: (typeof buildings)[number];
  index: number;
  selected: boolean;
}) {
  const windows = Array.from({ length: 15 }, (_, i) => i);
  return (
    <button
      type="button"
      aria-label={`Select ${building.name}`}
      className="absolute bottom-[19%] transition-transform duration-500 hover:-translate-y-2 focus:outline-none"
      style={{
        left: `${building.x}%`,
        width: `${building.w}px`,
        height: `${building.h}px`,
        zIndex: index + 5,
        transform: selected ? "translateY(-13px) scale(1.04)" : undefined,
        transformStyle: "preserve-3d",
      }}
    >
      <span
        className="absolute inset-0 overflow-hidden rounded-[2px] border border-white/30 shadow-[12px_18px_20px_rgba(40,50,42,.22)]"
        style={{
          background: `linear-gradient(90deg, ${building.tone} 0%, ${building.tone} 78%, #52665f 78%, #465852 100%)`,
          clipPath: "polygon(0 3%, 78% 0, 100% 7%, 100% 100%, 0 100%)",
        }}
      >
        <span className="absolute inset-0 grid grid-cols-3 gap-1.5 p-2 opacity-60">
          {windows.map((window) => (
            <span
              key={window}
              className="rounded-[1px] bg-[#f7edbf]"
              style={{ opacity: window % 4 === 0 ? 0.34 : 0.72 }}
            />
          ))}
        </span>
        <span className="absolute bottom-0 left-0 right-0 h-5 bg-[#3d554c]/50" />
      </span>
      <span
        className="absolute left-full top-[7%] h-[93%] w-[18px] origin-left skew-y-[-28deg] rounded-r-sm"
        style={{ background: "linear-gradient(90deg,#52665f,#33483f)" }}
      />
      {selected && (
        <span className="absolute -inset-2 rounded-sm border border-[#d6f28d] shadow-[0_0_0_3px_rgba(214,242,141,.16)]" />
      )}
    </button>
  );
}

export function Urbanova3D() {
  const [selectedCode, setSelectedCode] = useState("CN-04");
  const [activeLayer, setActiveLayer] = useState<"district" | "mobility" | "green">("district");
  const [focusMode, setFocusMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const selectedDistrict = useMemo(
    () => districts.find((district) => district.code === selectedCode) ?? districts[0],
    [selectedCode],
  );

  return (
    <main className="min-h-screen overflow-hidden bg-[#dfe4d7] text-[#26382f] selection:bg-[#d6f28d] selection:text-[#22352c]">
      <style>{`
        @keyframes urbanova-float { 0%,100% { transform: translateY(0px) rotateX(58deg) rotateZ(-19deg); } 50% { transform: translateY(-8px) rotateX(58deg) rotateZ(-19deg); } }
        @keyframes urbanova-pulse { 0%,100% { opacity: .32; transform: scale(.95); } 50% { opacity: .85; transform: scale(1.04); } }
        @keyframes urbanova-scan { from { transform: translateX(-110%); } to { transform: translateX(430%); } }
        .urbanova-grid { background-image: linear-gradient(rgba(61,91,74,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(61,91,74,.16) 1px, transparent 1px); background-size: 34px 34px; }
        .urbanova-noise { position: relative; }
        .urbanova-noise:after { content:""; pointer-events:none; position:absolute; inset:0; opacity:.06; mix-blend-mode:multiply; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.5'/%3E%3C/svg%3E"); }
      `}</style>

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
              Navigate Urbanova, a living prototype for the next generous city. Move through neighborhoods shaped by people, climate, and time.
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

        <div className={`urbanova-noise relative min-h-[520px] overflow-hidden rounded-[28px] border border-[#536b5c]/25 bg-[#b9c8b5] shadow-[0_25px_70px_rgba(60,82,65,.18)] transition-all duration-700 md:min-h-[660px] ${focusMode ? "lg:scale-[1.02]" : ""}`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,#f4e9c2_0%,#c8d8c2_37%,#92ad9c_100%)]" />
          <div className="absolute left-[8%] top-[8%] font-mono text-[9px] uppercase tracking-[.17em] text-[#637a69]">Urbanova / model 04.24</div>
          <div className="absolute right-5 top-5 z-20 flex items-center gap-2 rounded-full border border-[#536b5c]/25 bg-[#eef1e4]/70 px-3 py-2 backdrop-blur-md">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#82a753]" /><span className="font-mono text-[9px] uppercase tracking-[.14em] text-[#53695c]">Simulation live</span>
          </div>
          <div className="absolute inset-x-0 top-[15%] h-20 bg-[#f1d79f]/30 blur-2xl" />
          <div className="absolute inset-x-[-10%] bottom-[8%] top-[32%]" style={{ perspective: "900px" }}>
            <div className="urbanova-grid absolute inset-[-22%] rounded-[40%] border border-[#66816d]/30 bg-[#9db49c]/65" style={{ transform: "rotateX(60deg) rotateZ(-19deg) scale(1.4)", transformOrigin: "center center", boxShadow: "0 -15px 45px rgba(60,89,68,.15) inset" }} />
            <div className="absolute inset-0" style={{ transform: `scale(${zoom})`, transformOrigin: "50% 65%", transition: "transform .5s ease" }}>
              {buildings.map((building, index) => (
                <Building key={building.name} building={building} index={index} selected={building.name === (selectedCode === "CN-04" ? "Canopy Exchange" : selectedCode === "TW-02" ? "Tide House" : "Foundry Hall")} />
              ))}
              <div className="absolute bottom-[17%] left-[13%] h-10 w-[70%] skew-x-[-27deg] border-y-2 border-[#e5d49d]/80 bg-[#e8cf91]/35" />
              <div className="absolute bottom-[22%] left-[26%] h-2 w-[57%] skew-x-[-27deg] bg-[#f4e8b9]/90 shadow-[0_0_14px_rgba(244,232,185,.7)]" />
              <div className="absolute bottom-[12%] left-[26%] flex gap-12 text-[#f6efcb] opacity-75"><TrainFront size={24} /><span className="font-mono text-[9px] tracking-[.16em]">LINE 02</span></div>
              <div className="absolute bottom-[30%] left-[18%] h-5 w-5 rounded-full border-2 border-[#e4f1b5]/80" style={{ animation: "urbanova-pulse 2.6s infinite" }} />
              <div className="absolute bottom-[26%] left-[74%] h-5 w-5 rounded-full border-2 border-[#e4f1b5]/80" style={{ animation: "urbanova-pulse 2.6s 1s infinite" }} />
            </div>
          </div>
          <div className="absolute bottom-5 left-5 z-20 flex items-center gap-2">
            <button type="button" onClick={() => setZoom(Math.min(1.16, zoom + .08))} className="rounded-lg border border-[#536b5c]/25 bg-[#eef1e4]/75 p-2.5 backdrop-blur-md hover:bg-[#f4f5ed]" aria-label="Zoom in"><Plus size={15} /></button>
            <button type="button" onClick={() => setZoom(Math.max(.9, zoom - .08))} className="rounded-lg border border-[#536b5c]/25 bg-[#eef1e4]/75 p-2.5 backdrop-blur-md hover:bg-[#f4f5ed]" aria-label="Zoom out"><Minus size={15} /></button>
            <button type="button" onClick={() => setZoom(1)} className="rounded-lg border border-[#536b5c]/25 bg-[#eef1e4]/75 p-2.5 backdrop-blur-md hover:bg-[#f4f5ed]" aria-label="Reset view"><Scan size={15} /></button>
          </div>
          <div className="absolute bottom-5 right-5 z-20 hidden items-center gap-2 rounded-lg border border-[#536b5c]/25 bg-[#eef1e4]/75 px-3 py-2 font-mono text-[9px] uppercase tracking-[.14em] text-[#62786a] backdrop-blur-md sm:flex"><MapPin size={13} /> Tap a building to inspect</div>
          <div className="absolute left-1/2 top-0 h-full w-1/5 -translate-x-1/2 skew-x-[-15deg] bg-[#f5edc5]/15 blur-2xl" style={{ animation: "urbanova-scan 7s ease-in-out infinite" }} />
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