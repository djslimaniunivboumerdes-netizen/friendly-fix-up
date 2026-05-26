import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { PID_SECTIONS, CATEGORY_META, type PIDSection, type PIDCategory } from "@/data/pid-sections";

// ─────────────────────────────────────────────────────────────────────────────
// Process steps definition (visual flow nodes)
// ─────────────────────────────────────────────────────────────────────────────

interface FlowStep {
  id: string;
  label: string;
  sublabel: string;
  pidId: string | null;       // links to PID_SECTIONS[].id
  category: PIDCategory | "feed" | "product";
  temp?: string;              // representative operating temperature
  pressure?: string;
  products?: string[];
  icon: "feed" | "tower" | "exchanger" | "column" | "storage" | "utility";
  x: number;                  // SVG grid column (0-based)
  y: number;                  // SVG grid row (0-based)
}

const FLOW_STEPS: FlowStep[] = [
  {
    id: "feed",
    label: "Feed Gas",
    sublabel: "Raw natural gas",
    pidId: null,
    category: "feed",
    temp: "Ambient",
    pressure: "~65 bar",
    icon: "feed",
    x: 0, y: 1,
  },
  {
    id: "co2",
    label: "CO₂ Removal",
    sublabel: "MDEA Absorber (G507)",
    pidId: "co2-removal",
    category: "treatment",
    temp: "45°C",
    pressure: "62 bar",
    products: ["Treated Gas", "Acid Gas"],
    icon: "tower",
    x: 1, y: 1,
  },
  {
    id: "scrub",
    label: "Scrub Tower",
    sublabel: "Heavy HC removal (F711)",
    pidId: "scrub-tower",
    category: "pre-cooling",
    temp: "−30°C",
    pressure: "58 bar",
    products: ["Lean Gas", "NGL liquid"],
    icon: "column",
    x: 2, y: 1,
  },
  {
    id: "main-exchanger",
    label: "Main PFHE",
    sublabel: "Cryogenic exchanger (E520)",
    pidId: "main-exchanger",
    category: "liquefaction",
    temp: "−155°C",
    pressure: "52 bar",
    products: ["LNG"],
    icon: "exchanger",
    x: 3, y: 1,
  },
  {
    id: "mcr",
    label: "MCR Circuit",
    sublabel: "Propane pre-cooling (E524–E526)",
    pidId: "mcr-feed-chilling",
    category: "liquefaction",
    temp: "−40°C",
    pressure: "3–16 bar",
    products: ["MCR refrigerant"],
    icon: "exchanger",
    x: 3, y: 0,
  },
  {
    id: "lng-storage",
    label: "LNG Storage",
    sublabel: "Cryogenic tank",
    pidId: null,
    category: "product" as PIDCategory,
    temp: "−162°C",
    pressure: "1.05 bar",
    icon: "storage",
    x: 4, y: 1,
  },
  {
    id: "demethanizer",
    label: "Demethanizer",
    sublabel: "CH₄ separation (F721/F722)",
    pidId: "demethanizer",
    category: "fractionation",
    temp: "−93°C",
    pressure: "30 bar",
    products: ["Methane", "C₂+ liquid"],
    icon: "column",
    x: 2, y: 3,
  },
  {
    id: "de-ethanizer",
    label: "De-ethanizer",
    sublabel: "Ethane separation (F731)",
    pidId: "de-ethanizer",
    category: "fractionation",
    temp: "15°C",
    pressure: "20 bar",
    products: ["Ethane", "C₃+ liquid"],
    icon: "column",
    x: 3, y: 3,
  },
  {
    id: "depropanizer",
    label: "Depropanizer",
    sublabel: "Propane separation (F741)",
    pidId: "depropanizer",
    category: "fractionation",
    temp: "52°C",
    pressure: "14 bar",
    products: ["Propane", "C₄+ liquid"],
    icon: "column",
    x: 4, y: 3,
  },
  {
    id: "debutanizer",
    label: "Debutanizer",
    sublabel: "Butane separation (F751)",
    pidId: "debutanizer",
    category: "fractionation",
    temp: "105°C",
    pressure: "5 bar",
    products: ["Butane", "Gasoline"],
    icon: "column",
    x: 5, y: 3,
  },
  {
    id: "utilities",
    label: "Utilities",
    sublabel: "Instrument air, utility stations",
    pidId: "utilities",
    category: "utilities",
    icon: "utility",
    x: 5, y: 1,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Color helpers
// ─────────────────────────────────────────────────────────────────────────────

const CAT_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  feed: { bg: "bg-slate-700", border: "border-slate-500", text: "text-slate-200", glow: "" },
  treatment: { bg: "bg-emerald-900", border: "border-emerald-500/70", text: "text-emerald-300", glow: "shadow-emerald-500/20" },
  "pre-cooling": { bg: "bg-sky-900", border: "border-sky-500/70", text: "text-sky-300", glow: "shadow-sky-500/20" },
  liquefaction: { bg: "bg-indigo-900", border: "border-indigo-500/70", text: "text-indigo-300", glow: "shadow-indigo-500/20" },
  fractionation: { bg: "bg-amber-900", border: "border-amber-500/70", text: "text-amber-300", glow: "shadow-amber-500/20" },
  utilities: { bg: "bg-slate-800", border: "border-slate-500/70", text: "text-slate-300", glow: "" },
  product: { bg: "bg-teal-900", border: "border-teal-400/70", text: "text-teal-300", glow: "shadow-teal-500/20" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Process Node card
// ─────────────────────────────────────────────────────────────────────────────

interface NodeProps {
  step: FlowStep;
  selected: boolean;
  hasPID: boolean;
  onSelect: () => void;
}

function ProcessNode({ step, selected, hasPID, onSelect }: NodeProps) {
  const col = CAT_COLORS[step.category] ?? CAT_COLORS.utilities;
  return (
    <button
      onClick={onSelect}
      className={`relative flex flex-col gap-1 rounded-xl border-2 px-4 py-3 text-left transition-all duration-200 w-44
        ${col.bg} ${selected ? `${col.border} shadow-lg ${col.glow}` : "border-slate-700/60 hover:border-slate-500"}
        ${hasPID ? "cursor-pointer" : "cursor-default opacity-80"}
      `}
    >
      <span className={`text-sm font-semibold leading-tight ${col.text}`}>{step.label}</span>
      <span className="text-xs text-slate-400 leading-snug">{step.sublabel}</span>
      {step.temp && (
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-mono text-slate-500">{step.temp}</span>
          {step.pressure && (
            <span className="text-[10px] font-mono text-slate-600">· {step.pressure}</span>
          )}
        </div>
      )}
      {hasPID && (
        <div className="absolute top-2 right-2">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        </div>
      )}
      {selected && (
        <div className="absolute inset-0 rounded-xl ring-2 ring-amber-400/60 pointer-events-none" />
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail panel
// ─────────────────────────────────────────────────────────────────────────────

interface DetailPanelProps {
  step: FlowStep;
  section: PIDSection | null;
  onViewPID: () => void;
  onClose: () => void;
}

function DetailPanel({ step, section, onViewPID, onClose }: DetailPanelProps) {
  const col = CAT_COLORS[step.category] ?? CAT_COLORS.utilities;
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className={`rounded-xl border p-4 ${col.bg} ${col.border}`}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 className={`font-bold text-base ${col.text}`}>{step.label}</h3>
            <p className="text-sm text-slate-400">{step.sublabel}</p>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-400 text-sm">✕</button>
        </div>
        {(step.temp || step.pressure) && (
          <div className="flex gap-4 text-xs font-mono mt-3">
            {step.temp && (
              <div>
                <span className="text-slate-500 block mb-0.5">Temperature</span>
                <span className="text-white">{step.temp}</span>
              </div>
            )}
            {step.pressure && (
              <div>
                <span className="text-slate-500 block mb-0.5">Pressure</span>
                <span className="text-white">{step.pressure}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Outputs */}
      {step.products && step.products.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Stream Outputs</p>
          <div className="flex flex-wrap gap-2">
            {step.products.map((p) => (
              <span
                key={p}
                className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* P&ID section */}
      {section ? (
        <div className="border border-slate-700/60 rounded-xl p-4 bg-slate-900">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-slate-500 uppercase tracking-wider">P&amp;ID Drawing</p>
            <span className="font-mono text-xs text-amber-400 bg-amber-950/50 border border-amber-700/30 rounded px-2 py-0.5">
              {section.drawing}
            </span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed mb-3">{section.description}</p>
          <div className="flex flex-wrap gap-1 mb-4">
            {section.equipment.map((tag) => (
              <span
                key={tag}
                className="font-mono text-[10px] text-amber-300/80 bg-amber-950/50 border border-amber-700/30 rounded px-1.5 py-0.5"
              >
                {tag}
              </span>
            ))}
          </div>
          <button
            onClick={onViewPID}
            className="w-full py-2 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
            </svg>
            Open P&amp;ID Viewer
          </button>
        </div>
      ) : (
        <div className="border border-slate-800 rounded-xl p-4 bg-slate-900/40 text-center text-slate-600 text-sm">
          No P&amp;ID drawing linked to this step.
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Legend
// ─────────────────────────────────────────────────────────────────────────────

function Legend() {
  const cats: Array<[string, string]> = [
    ["feed", "Feed / Product"],
    ["treatment", "Feed Treatment"],
    ["pre-cooling", "Pre-cooling"],
    ["liquefaction", "Liquefaction"],
    ["fractionation", "Fractionation"],
    ["utilities", "Utilities"],
  ];
  return (
    <div className="flex flex-wrap gap-3">
      {cats.map(([cat, label]) => {
        const col = CAT_COLORS[cat];
        return (
          <div key={cat} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded border ${col.bg} ${col.border}`} />
            <span className="text-xs text-slate-400">{label}</span>
          </div>
        );
      })}
      <div className="flex items-center gap-1.5 ml-2">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-xs text-slate-400">Has P&amp;ID</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Process Flow Layout
// Uses a manual flow layout with connector lines drawn as SVG
// ─────────────────────────────────────────────────────────────────────────────

const MAIN_FLOW_IDS = ["feed", "co2", "scrub", "main-exchanger", "lng-storage"];
const MCR_ROW_IDS = ["mcr"];
const FRAC_ROW_IDS = ["demethanizer", "de-ethanizer", "depropanizer", "debutanizer"];

export default function ProcessFlow() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const stepById = Object.fromEntries(FLOW_STEPS.map((s) => [s.id, s]));
  const sectionByPIDId = Object.fromEntries(PID_SECTIONS.map((s) => [s.id, s]));

  const selectedStep = selectedId ? stepById[selectedId] : null;
  const selectedSection = selectedStep?.pidId ? sectionByPIDId[selectedStep.pidId] ?? null : null;

  const handleViewPID = useCallback(() => {
    navigate("/pid-viewer");
  }, [navigate]);

  const renderRow = (ids: string[], label?: string) => (
    <div className="flex flex-col gap-2">
      {label && (
        <span className="text-xs text-slate-600 uppercase tracking-widest pl-1">{label}</span>
      )}
      <div className="flex items-center gap-0">
        {ids.map((id, idx) => {
          const step = stepById[id];
          const isLast = idx === ids.length - 1;
          return (
            <div key={id} className="flex items-center">
              <ProcessNode
                step={step}
                selected={selectedId === id}
                hasPID={!!step.pidId}
                onSelect={() => setSelectedId(selectedId === id ? null : id)}
              />
              {!isLast && (
                <div className="flex items-center w-8 shrink-0">
                  <div className="flex-1 h-0.5 bg-slate-700" />
                  <svg className="w-3 h-3 text-slate-600 shrink-0" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M3 8l5-5v3h6v4H8v3L3 8z" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // Products derived from fractionation
  const PRODUCTS = [
    { label: "CH₄", sublabel: "LNG export", color: "text-teal-300 bg-teal-900 border-teal-600/60" },
    { label: "C₂H₆", sublabel: "Ethane", color: "text-sky-300 bg-sky-900 border-sky-600/60" },
    { label: "C₃H₈", sublabel: "Propane", color: "text-amber-300 bg-amber-900 border-amber-600/60" },
    { label: "C₄H₁₀", sublabel: "Butane", color: "text-orange-300 bg-orange-900 border-orange-600/60" },
    { label: "C₅+", sublabel: "Gasoline", color: "text-pink-300 bg-pink-900 border-pink-600/60" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* ── Header ── */}
      <div className="border-b border-slate-800 bg-slate-900/50 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Process Flow</h1>
            <p className="text-sm text-slate-500">LNG Liquefaction Train — GL1/Z Sonatrach</p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => navigate("/pid-viewer")}
              className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-colors"
            >
              → Open P&amp;ID Browser
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col lg:flex-row gap-8">
        {/* ── Flow diagram ── */}
        <div className="flex-1 flex flex-col gap-8 overflow-x-auto">
          {/* Legend */}
          <Legend />

          {/* MCR row (above main flow) */}
          <div className="flex flex-col gap-1">
            <div className="pl-[calc(3*12rem+3*2rem+0.5rem)]">
              {renderRow(MCR_ROW_IDS, "MCR Refrigerant")}
            </div>
            {/* Connector from MCR down to Main Exchanger position */}
            <div className="pl-[calc(3*12rem+3*2rem+5rem)] h-6 flex items-start">
              <div className="w-0.5 h-6 bg-slate-700" />
            </div>
          </div>

          {/* Main process flow */}
          {renderRow(MAIN_FLOW_IDS, "Main Process Train")}

          {/* Vertical drop from Scrub Tower to Fractionation */}
          <div className="flex items-start">
            <div className="w-[calc(2*12rem+2*2rem+5.5rem)] shrink-0" />
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-0.5 h-6 bg-slate-700" />
              <div className="flex items-center gap-1">
                <div className="h-0.5 w-6 bg-slate-700" />
                <span className="text-[10px] text-slate-600 font-mono whitespace-nowrap">NGL bottoms</span>
              </div>
            </div>
          </div>

          {/* Fractionation row */}
          {renderRow(FRAC_ROW_IDS, "Fractionation Train")}

          {/* Product outputs */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-slate-600 uppercase tracking-widest pl-1">Final Products</span>
            <div className="flex flex-wrap gap-3">
              {PRODUCTS.map((p) => (
                <div
                  key={p.label}
                  className={`flex flex-col items-center rounded-xl border px-4 py-2 ${p.color}`}
                >
                  <span className="font-mono font-bold text-sm">{p.label}</span>
                  <span className="text-[10px] opacity-70">{p.sublabel}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Utility node placed below */}
          <div className="flex flex-col gap-1 border-t border-slate-800 pt-6">
            <span className="text-xs text-slate-600 uppercase tracking-widest pl-1 mb-2">Utilities</span>
            <ProcessNode
              step={stepById["utilities"]}
              selected={selectedId === "utilities"}
              hasPID
              onSelect={() => setSelectedId(selectedId === "utilities" ? null : "utilities")}
            />
          </div>
        </div>

        {/* ── Detail Panel ── */}
        <div className="w-full lg:w-80 shrink-0">
          {selectedStep ? (
            <DetailPanel
              step={selectedStep}
              section={selectedSection}
              onViewPID={handleViewPID}
              onClose={() => setSelectedId(null)}
            />
          ) : (
            <div className="border border-slate-800 rounded-xl p-6 bg-slate-900/40 text-center flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-slate-400 font-medium">Select a process step</p>
                <p className="text-xs text-slate-600 mt-1">
                  Click any node to see operating conditions and linked P&amp;ID drawings.
                  Nodes with a pulsing amber dot have an associated P&amp;ID.
                </p>
              </div>
            </div>
          )}

          {/* Process summary stats */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[
              { label: "Feed Temp", value: "Ambient", unit: "" },
              { label: "LNG Temp", value: "−162", unit: "°C" },
              { label: "Train", value: "200", unit: "" },
              { label: "P&IDs", value: PID_SECTIONS.length.toString(), unit: "sheets" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg bg-slate-900 border border-slate-800 p-3"
              >
                <p className="text-xs text-slate-600 mb-1">{stat.label}</p>
                <p className="text-lg font-bold text-white font-mono">
                  {stat.value}
                  <span className="text-xs text-slate-500 font-sans ml-1">{stat.unit}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
