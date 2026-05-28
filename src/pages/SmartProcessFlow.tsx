import { useMemo, useState } from "react";
import {
  ArrowRight,
  ExternalLink,
  Filter,
  FolderOpen,
  Layers3,
  Search,
  Sparkles,
  Target,
} from "lucide-react";

type SectionId = "pretreatment" | "dehydration" | "fractionation" | "liquefaction";

type NodeKind = "tower" | "drum" | "compressor" | "heat-exchanger" | "export";

interface FlowNode {
  tag: string;
  title: string;
  section: SectionId;
  kind: NodeKind;
  driveUrl: string;
  summary: string;
  temperature: string;
  pressure: string;
  x: number;
  y: number;
}

const SECTIONS: Record<SectionId, { label: string; accent: string }> = {
  pretreatment: { label: "Pretreatment", accent: "from-cyan-400 to-blue-500" },
  dehydration: { label: "Dehydration", accent: "from-emerald-400 to-teal-500" },
  fractionation: { label: "Fractionation", accent: "from-amber-400 to-orange-500" },
  liquefaction: { label: "Liquefaction", accent: "from-violet-400 to-fuchsia-500" },
};

const FLOW_NODES: FlowNode[] = [
  {
    tag: "101-F502",
    title: "Feed Gas Absorber",
    section: "pretreatment",
    kind: "tower",
    driveUrl: "https://drive.google.com/drive/folders/1_WeQYp02-LYO8_KmKuK_wFEYLnf_WwLR",
    summary: "Removes acid gas from inlet feed before downstream cryogenic service.",
    temperature: "38 °C",
    pressure: "41.2 barg",
    x: 4,
    y: 20,
  },
  {
    tag: "101-G507",
    title: "MEA Flash Drum",
    section: "pretreatment",
    kind: "drum",
    driveUrl: "https://drive.google.com/drive/folders/1_WeQYp02-LYO8_KmKuK_wFEYLnf_WwLR",
    summary: "Separates flashed hydrocarbons from rich amine circulation.",
    temperature: "45 °C",
    pressure: "8.0 barg",
    x: 18,
    y: 43,
  },
  {
    tag: "101-F501",
    title: "MEA Regenerator",
    section: "pretreatment",
    kind: "tower",
    driveUrl: "https://drive.google.com/drive/folders/1_WeQYp02-LYO8_KmKuK_wFEYLnf_WwLR",
    summary: "Strips absorbed gases and returns lean solvent to the absorber.",
    temperature: "121 °C",
    pressure: "1.8 barg",
    x: 24,
    y: 18,
  },
  {
    tag: "102-R03.10",
    title: "Molecular Sieve Bed A",
    section: "dehydration",
    kind: "tower",
    driveUrl: "https://drive.google.com/drive/folders/1DxRXgW2-O9_z3RVvJO1xdbrXChZZspGL",
    summary: "Adsorbs trace water before the cold box.",
    temperature: "22 °C",
    pressure: "39.5 barg",
    x: 38,
    y: 63,
  },
  {
    tag: "103-R03.12",
    title: "Molecular Sieve Bed B",
    section: "dehydration",
    kind: "tower",
    driveUrl: "https://drive.google.com/drive/folders/1DxRXgW2-O9_z3RVvJO1xdbrXChZZspGL",
    summary: "Provides swing adsorption while the other bed is in regeneration.",
    temperature: "24 °C",
    pressure: "38.9 barg",
    x: 54,
    y: 63,
  },
  {
    tag: "104-F07.11",
    title: "Feed Separator",
    section: "fractionation",
    kind: "drum",
    driveUrl: "https://drive.google.com/drive/folders/1W_31LRK19Tz1-5CwM-_u0hjnybMMEeTu",
    summary: "Stabilizes vapor/liquid split before the fractionation train.",
    temperature: "-32 °C",
    pressure: "28.0 barg",
    x: 50,
    y: 29,
  },
  {
    tag: "105-K01.20",
    title: "MCR Compressor Train 1",
    section: "liquefaction",
    kind: "compressor",
    driveUrl: "https://drive.google.com/drive/folders/1LB35_eT9YsONVsPudIL1Ddh6SxdBD-Fw",
    summary: "Compresses mixed refrigerant for the liquefaction loop.",
    temperature: "98 °C",
    pressure: "44.0 barg",
    x: 71,
    y: 41,
  },
  {
    tag: "105-K01.21",
    title: "MCR Compressor Train 2",
    section: "liquefaction",
    kind: "compressor",
    driveUrl: "https://drive.google.com/drive/folders/1LB35_eT9YsONVsPudIL1Ddh6SxdBD-Fw",
    summary: "Parallel compressor line for refrigerant circulation reliability.",
    temperature: "96 °C",
    pressure: "43.4 barg",
    x: 82,
    y: 41,
  },
  {
    tag: "106-E05.20",
    title: "Main Cryogenic Heat Exchanger",
    section: "liquefaction",
    kind: "heat-exchanger",
    driveUrl: "https://drive.google.com/drive/folders/1LB35_eT9YsONVsPudIL1Ddh6SxdBD-Fw",
    summary: "Core cold-box element that drives LNG subcooling.",
    temperature: "-162 °C",
    pressure: "48.5 barg",
    x: 79,
    y: 16,
  },
  {
    tag: "106-G07.83",
    title: "LNG Storage / Export",
    section: "liquefaction",
    kind: "export",
    driveUrl: "https://drive.google.com/drive/folders/1LB35_eT9YsONVsPudIL1Ddh6SxdBD-Fw",
    summary: "Sends liquefied product to storage and export headers.",
    temperature: "-160 °C",
    pressure: "2.5 barg",
    x: 92,
    y: 24,
  },
];

const NODE_STYLE: Record<NodeKind, string> = {
  tower: "rounded-2xl bg-slate-900/95 border-slate-700",
  drum: "rounded-full bg-slate-900/95 border-slate-700",
  compressor: "rounded-[1.75rem] bg-slate-900/95 border-slate-700",
  "heat-exchanger": "rounded-2xl bg-slate-900/95 border-slate-700",
  export: "rounded-full bg-emerald-950/90 border-emerald-500/70",
};

export default function SmartProcessFlow() {
  const [section, setSection] = useState<SectionId>("pretreatment");
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState(FLOW_NODES[0].tag);

  const filteredNodes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return FLOW_NODES.filter((node) => {
      const matchesSection = node.section === section;
      const matchesSearch =
        !q ||
        node.tag.toLowerCase().includes(q) ||
        node.title.toLowerCase().includes(q) ||
        node.summary.toLowerCase().includes(q);
      return matchesSection && matchesSearch;
    });
  }, [search, section]);

  const selectedNode = FLOW_NODES.find((node) => node.tag === selectedTag) ?? FLOW_NODES[0];

  const displayedNodeTags = new Set(filteredNodes.map((node) => node.tag));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-[1600px] px-4 py-4 lg:px-6 lg:py-6">
        <div className="mb-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl shadow-slate-950/40 backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" /> Smart Interactive Process Flow
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white lg:text-5xl">
                GNL1Z process flow, as a live page.
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-300 lg:text-base">
                Click any equipment tag to open details, follow the Google Drive source folders,
                and switch between sections without leaving the diagram.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                ["Sections", "4"],
                ["Visible nodes", String(filteredNodes.length)],
                ["Selected", selectedNode.tag],
                ["Mode", "Interactive"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{label}</div>
                  <div className="mt-1 text-sm font-semibold text-slate-100">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <Filter className="h-4 w-4 text-cyan-300" /> Filter by section
              </div>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(SECTIONS) as SectionId[]).map((key) => {
                  const active = section === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSection(key)}
                      className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                        active
                          ? "border-transparent bg-cyan-500 text-slate-950"
                          : "border-slate-700 bg-slate-950/40 text-slate-300 hover:border-slate-500 hover:text-white"
                      }`}
                    >
                      {SECTIONS[key].label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-3xl border border-slate-800 bg-slate-900/60 px-4 py-4">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search equipment tag or name"
              className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
            />
          </label>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <section className="rounded-3xl border border-slate-800 bg-[#07111d] p-4 shadow-2xl shadow-slate-950/30">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">Interactive diagram</h2>
                <p className="text-xs text-slate-400">Pan-ready canvas, clickable hotspots, and linked source folders.</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-slate-300">
                <Target className="h-3.5 w-3.5 text-emerald-300" /> Focused on {SECTIONS[section].label}
              </div>
            </div>

            <div className="relative aspect-[16/9] overflow-hidden rounded-3xl border border-slate-800 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.14),transparent_38%),linear-gradient(to_bottom,#05101c,#02050b)]">
              <svg
                viewBox="0 0 100 56"
                className="absolute inset-0 h-full w-full"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(125,211,252,0.9)" />
                  </marker>
                  <linearGradient id="pipe" x1="0" x2="1">
                    <stop offset="0%" stopColor="rgba(59,130,246,0.95)" />
                    <stop offset="100%" stopColor="rgba(45,212,191,0.95)" />
                  </linearGradient>
                </defs>
                <g fill="none" stroke="url(#pipe)" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" markerEnd="url(#arrow)">
                  <path d="M 3 28 H 10" />
                  <path d="M 10 28 V 18 H 22" />
                  <path d="M 22 18 H 31" />
                  <path d="M 31 18 V 32 H 38" />
                  <path d="M 38 32 H 49" />
                  <path d="M 49 32 V 28 H 60" />
                  <path d="M 60 28 H 69" />
                  <path d="M 69 28 V 20 H 78" />
                  <path d="M 78 20 H 90" />
                  <path d="M 90 20 V 30 H 97" />
                </g>
              </svg>

              <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.07)_1px,transparent_1px)] bg-[size:48px_48px] opacity-40" />

              {filteredNodes.map((node) => {
                const active = node.tag === selectedTag;
                return (
                  <button
                    key={node.tag}
                    type="button"
                    onClick={() => setSelectedTag(node.tag)}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 border px-3 py-2 text-left shadow-2xl transition duration-200 hover:scale-[1.02] ${
                      active ? "border-cyan-300 ring-2 ring-cyan-300/40" : "border-slate-600 hover:border-slate-400"
                    } ${NODE_STYLE[node.kind]}`}
                    style={{ left: `${node.x}%`, top: `${node.y}%`, minWidth: node.kind === "compressor" ? 150 : 126 }}
                    title={node.title}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200">{node.tag}</div>
                        <div className="mt-1 text-xs font-semibold text-slate-100">{node.title}</div>
                      </div>
                      <div className={`mt-0.5 h-2.5 w-2.5 rounded-full bg-gradient-to-r ${SECTIONS[node.section].accent}`} />
                    </div>
                    <div className="mt-2 text-[10px] text-slate-400">{node.temperature} · {node.pressure}</div>
                  </button>
                );
              })}

              <div className="absolute left-4 top-4 rounded-2xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-[11px] text-slate-300">
                FEED INLET
              </div>
              <div className="absolute right-4 top-4 rounded-2xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-[11px] text-slate-300">
                LNG EXPORT
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {filteredNodes.map((node) => (
                <button
                  key={`${node.tag}-mini`}
                  type="button"
                  onClick={() => setSelectedTag(node.tag)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    selectedTag === node.tag
                      ? "border-cyan-400 bg-cyan-500/10"
                      : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                  }`}
                >
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{node.tag}</div>
                  <div className="mt-1 text-sm font-semibold text-white">{node.title}</div>
                  <div className="mt-1 text-xs text-slate-400">{node.summary}</div>
                </button>
              ))}
            </div>
          </section>

          <aside className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
            <div>
              <div className={`inline-flex rounded-full bg-gradient-to-r ${SECTIONS[selectedNode.section].accent} px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-slate-950`}>
                {SECTIONS[selectedNode.section].label}
              </div>
              <h3 className="mt-3 text-2xl font-bold text-white">{selectedNode.tag}</h3>
              <p className="mt-1 text-sm text-slate-300">{selectedNode.title}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Temperature</div>
                <div className="mt-2 text-lg font-bold text-white">{selectedNode.temperature}</div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Pressure</div>
                <div className="mt-2 text-lg font-bold text-white">{selectedNode.pressure}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <Layers3 className="h-4 w-4 text-emerald-300" /> Process note
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">{selectedNode.summary}</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <FolderOpen className="h-4 w-4 text-amber-300" /> Source folder
              </div>
              <a
                href={selectedNode.driveUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:border-cyan-400 hover:bg-cyan-500/10"
              >
                Open Google Drive folder <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <ArrowRight className="h-4 w-4 text-cyan-300" /> Next actions
              </div>
              <div className="mt-3 space-y-2 text-sm text-slate-300">
                <p>• Add equipment popovers with PDF links and datasheets.</p>
                <p>• Add zoom, search, and alarm overlays later.</p>
                <p>• Connect each hotspot to your existing equipment pages.</p>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-300">
          <span className="font-semibold text-slate-100">Tip:</span> add this page to the sidebar and keep the old /flow page as the engineering-heavy version,
          while this one stays the operator-friendly visual overview.
        </div>
      </div>
    </div>
  );
}
