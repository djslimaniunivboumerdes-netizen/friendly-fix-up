import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";                                 // ← NEW
import { useI18n } from "@/contexts/I18nContext";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { X, ZoomIn, ZoomOut, Maximize2, Minimize2, FileText, ExternalLink } from "lucide-react"; // ← FileText, ExternalLink added
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PID_SECTIONS, driveImageUrl } from "@/data/pid-sections";             // ← NEW

const ACCENT = "#f97316";

type Category =
  | "absorber" | "exchanger" | "compressor" | "column" | "drum"
  | "turbine" | "pump" | "reactor" | "storage";

interface Node {
  id: string;
  x: number; y: number;
  label: string;
  category: Category;
  section: "decarb" | "dehydr" | "demerc" | "cooling" | "liquef" | "fract" | "fuel" | "storage";
  name: { en: string; fr: string };
  description: { en: string; fr: string };
  specs: { label: string; value: string }[];
}

const CAT: Record<Category, { en: string; fr: string; color: string }> = {
  absorber:   { en: "Absorber (LNG svc)",   fr: "Absorbeur (svc GNL)", color: "#10b981" },
  exchanger:  { en: "Heat Exchanger",       fr: "Échangeur",           color: "#06b6d4" },
  compressor: { en: "Compressor",           fr: "Compresseur",         color: "#a855f7" },
  column:     { en: "Fractionation Column", fr: "Colonne",             color: "#22c55e" },
  drum:       { en: "Drum / Vessel",        fr: "Capacité",            color: "#eab308" },
  turbine:    { en: "Gas Turbine",          fr: "Turbine",             color: "#ef4444" },
  pump:       { en: "Pump",                 fr: "Pompe",               color: "#ec4899" },
  reactor:    { en: "Reactor (N₂ purge)",   fr: "Réacteur (purge N₂)", color: "#a855f7" },
  storage:    { en: "Storage",              fr: "Stockage",            color: "#94a3b8" },
};

const SECTION: Record<Node["section"], { en: string; fr: string }> = {
  decarb:  { en: "Decarbonation (MEA)",      fr: "Décarbonatation (MEA)" },
  dehydr:  { en: "Dehydration",              fr: "Déshydratation" },
  demerc:  { en: "Mercury Removal",          fr: "Démercurisation" },
  cooling: { en: "Propane Pre-Cooling",      fr: "Pré-refroidissement Propane" },
  liquef:  { en: "Liquefaction (MCR)",       fr: "Liquéfaction (MCR)" },
  fract:   { en: "Fractionation",            fr: "Fractionnement" },
  fuel:    { en: "Fuel Gas",                 fr: "Gaz Combustible" },
  storage: { en: "LNG Storage & Loading",    fr: "Stockage & Chargement GNL" },
};

const NODES: Node[] = [
  // --- Decarbonation
  { id: "101-F501", x: 6, y: 38, label: "F501", category: "absorber", section: "decarb",
    name: { en: "MEA CO₂ Absorber", fr: "Absorbeur CO₂ MEA" },
    description: { en: "Counter-current MEA absorber removing CO₂ from feed gas to <50 ppmv before cryogenic stages.", fr: "Absorbeur MEA contre-courant éliminant le CO₂ du gaz d'alimentation à <50 ppmv avant les étages cryogéniques." },
    specs: [{ label: "Service", value: "Amine treating" }, { label: "Pressure", value: "48 bar" }, { label: "Diameter", value: '120"' }, { label: "Height", value: "32 m" }],
  },
  { id: "101-F502", x: 14, y: 18, label: "F502", category: "column", section: "decarb",
    name: { en: "MEA Regenerator", fr: "Régénérateur MEA" },
    description: { en: "Steam-stripped regenerator returning lean amine to the absorber.", fr: "Régénérateur stripé vapeur renvoyant l'amine pauvre vers l'absorbeur." },
    specs: [{ label: "Reboiler duty", value: "18 MW" }, { label: "Top T", value: "100 °C" }],
  },
  { id: "101-G-507", x: 6, y: 64, label: "G507", category: "drum", section: "decarb",
    name: { en: "Rich Amine Flash Drum", fr: "Ballon de Détente Amine Riche" },
    description: { en: "Flashes dissolved hydrocarbons from rich MEA before regeneration.", fr: "Détend les hydrocarbures dissous de la MEA riche avant régénération." },
    specs: [{ label: "Pressure", value: "5 bar" }],
  },
  // --- Dehydration
  { id: "102-G07.87", x: 22, y: 14, label: "G07.87", category: "drum", section: "dehydr",
    name: { en: "Dehydration Inlet KO Drum", fr: "Ballon Séparateur Déshydratation" },
    description: { en: "Removes free liquids upstream of mol-sieve beds.", fr: "Élimine les liquides libres en amont des tamis moléculaires." },
    specs: [{ label: "Pressure", value: "47 bar" }],
  },
  { id: "102-R03.10", x: 22, y: 32, label: "R03.10", category: "reactor", section: "dehydr",
    name: { en: "Mol-Sieve Bed A", fr: "Tamis Moléculaire A" },
    description: { en: "Adsorption of water on 4Å molecular sieves to <1 ppmv H₂O.", fr: "Adsorption d'eau sur tamis 4Å (<1 ppmv H₂O)." },
    specs: [{ label: "Cycle", value: "8 h" }, { label: "Regen T", value: "280 °C" }],
  },
  { id: "102-R03.11", x: 30, y: 32, label: "R03.11", category: "reactor", section: "dehydr",
    name: { en: "Mol-Sieve Bed B", fr: "Tamis Moléculaire B" },
    description: { en: "Parallel adsorber bed (rotating cycle: ads / regen / cool).", fr: "Lit adsorbeur parallèle (cycle: ads / régén / refroidissement)." },
    specs: [{ label: "Cycle", value: "8 h" }],
  },
  // --- Mercury removal
  { id: "102-R03.12", x: 38, y: 28, label: "R03.12", category: "reactor", section: "demerc",
    name: { en: "Mercury Guard Bed", fr: "Lit de Démercurisation" },
    description: { en: "Sulphur-impregnated activated-carbon bed removing Hg to <0.01 µg/Nm³.", fr: "Lit charbon actif soufré éliminant le Hg à <0,01 µg/Nm³." },
    specs: [{ label: "Outlet Hg", value: "<0.01 µg/Nm³" }],
  },
  // --- Propane pre-cooling
  { id: "104-E05.20", x: 46, y: 22, label: "E05.20", category: "exchanger", section: "cooling",
    name: { en: "Feed Gas / Propane Chiller", fr: "Chiller Gaz / Propane" },
    description: { en: "Kettle-type chiller cools dry feed gas with propane refrigerant.", fr: "Chiller type kettle refroidissant le gaz sec via propane." },
    specs: [{ label: "Outlet T", value: "−35 °C" }, { label: "Duty", value: "85 MW" }],
  },
  { id: "104-E07.11", x: 52, y: 14, label: "E07.11", category: "exchanger", section: "cooling",
    name: { en: "Propane Aftercooler (CW)", fr: "Aéroréfrigérant Propane (Eau)" },
    description: { en: "Cooling-water aftercooler condensing HP propane discharge before the accumulator.", fr: "Aéroréfrigérant à eau condensant le refoulement HP propane avant l'accumulateur." },
    specs: [{ label: "Service", value: "CW G1" }, { label: "Duty", value: "60 MW" }, { label: "Outlet T", value: "38 °C" }],
  },
  { id: "104-F07.11", x: 38, y: 52, label: "F07.11", category: "drum", section: "cooling",
    name: { en: "Scrub Column", fr: "Colonne de Lavage" },
    description: { en: "Removes heavy hydrocarbons (C5+) before MCHE to prevent freeze-out.", fr: "Élimine les hydrocarbures lourds (C5+) avant le MCHE pour éviter le gel." },
    specs: [{ label: "Trays", value: "20" }, { label: "Bottom T", value: "−25 °C" }],
  },
  { id: "103-K01.10", x: 46, y: 70, label: "K01.10", category: "compressor", section: "cooling",
    name: { en: "Propane Compressor (C3)", fr: "Compresseur Propane (C3)" },
    description: { en: "4-stage centrifugal compressor driving the propane pre-cooling loop.", fr: "Compresseur centrifuge 4 étages, boucle propane." },
    specs: [{ label: "Stages", value: "4" }, { label: "Power", value: "32 MW" }, { label: "Driver", value: "GE Frame 5" }],
  },
  { id: "103-G07.86", x: 56, y: 76, label: "G07.86", category: "drum", section: "cooling",
    name: { en: "Propane Suction Drum", fr: "Ballon d'Aspiration Propane" },
    description: { en: "K.O. drum protecting propane compressor suction stages.", fr: "Ballon K.O. protégeant l'aspiration du compresseur propane." },
    specs: [{ label: "Pressure", value: "1.4 bar" }],
  },
  { id: "104-G07.85", x: 38, y: 78, label: "G07.85", category: "drum", section: "cooling",
    name: { en: "Propane Accumulator (HP)", fr: "Accumulateur Propane (HP)" },
    description: { en: "High-pressure propane condensate receiver.", fr: "Accumulateur HP condensat propane." },
    specs: [{ label: "Pressure", value: "16 bar" }],
  },
  { id: "104-G07.90", x: 30, y: 78, label: "G07.90", category: "drum", section: "cooling",
    name: { en: "Propane Economizer (MP)", fr: "Économiseur Propane (MP)" },
    description: { en: "Mid-pressure flash stage of propane refrigeration.", fr: "Étage de détente moyenne pression propane." },
    specs: [{ label: "Pressure", value: "5 bar" }],
  },
  { id: "104-G07.91", x: 30, y: 88, label: "G07.91", category: "drum", section: "cooling",
    name: { en: "Propane Economizer (LP)", fr: "Économiseur Propane (BP)" },
    description: { en: "Low-pressure flash drum producing coldest propane stream.", fr: "Ballon BP produisant le propane le plus froid." },
    specs: [{ label: "Pressure", value: "1.4 bar" }],
  },
  // --- Liquefaction
  { id: "106-E05.20", x: 58, y: 28, label: "MCHE", category: "exchanger", section: "liquef",
    name: { en: "Main Cryogenic Heat Exchanger", fr: "Échangeur Cryogénique Principal" },
    description: { en: "Air Products coil-wound exchanger liquefying treated gas to −162 °C using mixed-component refrigerant.", fr: "Échangeur bobiné Air Products liquéfiant le gaz traité à −162 °C via réfrigérant mixte (MCR)." },
    specs: [{ label: "Type", value: "Coil-wound" }, { label: "Outlet T", value: "−162 °C" }, { label: "Height", value: "55 m" }, { label: "Duty", value: "180 MW" }],
  },
  { id: "106-G07.83", x: 70, y: 22, label: "G07.83", category: "drum", section: "liquef",
    name: { en: "MCR HP Separator", fr: "Séparateur MCR HP" },
    description: { en: "Splits MCR into liquid (MR-L) and vapour (MR-V) streams feeding MCHE.", fr: "Sépare le MCR en liquide (MR-L) et vapeur (MR-V) alimentant le MCHE." },
    specs: [{ label: "Pressure", value: "44 bar" }],
  },
  { id: "105-K01.20", x: 78, y: 38, label: "K01.20", category: "compressor", section: "liquef",
    name: { en: "MCR Compressor LP/MP", fr: "Compresseur MCR BP/MP" },
    description: { en: "Low/medium-pressure body of the mixed-refrigerant compressor train.", fr: "Corps BP/MP du train compresseur réfrigérant mixte." },
    specs: [{ label: "Stages", value: "3" }, { label: "Power", value: "40 MW" }],
  },
  { id: "105-K01.21", x: 86, y: 38, label: "K01.21", category: "compressor", section: "liquef",
    name: { en: "MCR Compressor HP", fr: "Compresseur MCR HP" },
    description: { en: "High-pressure body — final stage of the MCR loop.", fr: "Corps HP — étage final boucle MCR." },
    specs: [{ label: "Stages", value: "2" }, { label: "Power", value: "55 MW" }, { label: "Driver", value: "GE Frame 6" }],
  },
  { id: "105-G07.88", x: 72, y: 50, label: "G07.88", category: "drum", section: "liquef",
    name: { en: "MCR Suction Drum", fr: "Ballon Aspiration MCR" },
    description: { en: "Knock-out drum upstream of MCR compressor LP suction.", fr: "Ballon K.O. en amont aspiration BP compresseur MCR." },
    specs: [{ label: "Pressure", value: "3.5 bar" }],
  },
  { id: "K05-G07.89", x: 86, y: 56, label: "G07.89", category: "drum", section: "liquef",
    name: { en: "MCR Discharge Drum", fr: "Ballon Refoulement MCR" },
    description: { en: "Inter-stage K.O. between MCR HP discharge and aftercooler.", fr: "Ballon K.O. inter-étage refoulement HP MCR / aéroréfrigérant." },
    specs: [{ label: "Pressure", value: "44 bar" }],
  },
  // --- Fractionation
  { id: "107-F07.21", x: 8, y: 86, label: "F07.21", category: "column", section: "fract",
    name: { en: "Demethaniser", fr: "Déméthaniseur" },
    description: { en: "Strips methane overhead from C2+ liquids recovered in scrub column.", fr: "Strippe le méthane en tête des liquides C2+ du scrub." },
    specs: [{ label: "Trays", value: "32" }, { label: "Top T", value: "−95 °C" }],
  },
  { id: "108-F07.31", x: 18, y: 86, label: "F07.31", category: "column", section: "fract",
    name: { en: "Deethaniser", fr: "Déethaniseur" },
    description: { en: "Recovers ethane overhead, sends C3+ to depropaniser.", fr: "Récupère l'éthane en tête, envoie C3+ au dépropaniseur." },
    specs: [{ label: "Trays", value: "40" }, { label: "Pressure", value: "28 bar" }],
  },
  { id: "109-F07.41", x: 28, y: 86, label: "F07.41", category: "column", section: "fract",
    name: { en: "Depropaniser", fr: "Dépropaniseur" },
    description: { en: "Produces commercial propane overhead (LPG cut).", fr: "Produit du propane commercial en tête (coupe LPG)." },
    specs: [{ label: "Trays", value: "45" }, { label: "Pressure", value: "18 bar" }],
  },
  { id: "110-F07.51", x: 38, y: 86, label: "F07.51", category: "column", section: "fract",
    name: { en: "Debutaniser", fr: "Débutaniseur" },
    description: { en: "Separates butane (top) from natural gasoline (bottom).", fr: "Sépare le butane (tête) de l'essence naturelle (fond)." },
    specs: [{ label: "Trays", value: "38" }, { label: "Pressure", value: "8 bar" }],
  },
  { id: "7E2-G07.65", x: 60, y: 92, label: "G07.65", category: "drum", section: "fract",
    name: { en: "Gasoline Run-Down Drum", fr: "Ballon de Soutirage Essence" },
    description: { en: "Collects natural gasoline before storage / export.", fr: "Reçoit l'essence naturelle avant stockage / export." },
    specs: [{ label: "Service", value: "Gasoline export" }],
  },
  // --- Fuel gas + LNG storage
  { id: "102-K01.30", x: 92, y: 14, label: "K01.30", category: "compressor", section: "fuel",
    name: { en: "Fuel Gas Compressor", fr: "Compresseur Gaz Combustible" },
    description: { en: "Boosts BOG / fuel gas to plant fuel header (turbines, boilers).", fr: "Comprime le BOG / gaz combustible vers le collecteur (turbines, chaudières)." },
    specs: [{ label: "Discharge P", value: "28 bar" }],
  },
  { id: "LNG-TK", x: 92, y: 30, label: "LNG", category: "storage", section: "storage",
    name: { en: "LNG Storage Tank", fr: "Bac de Stockage GNL" },
    description: { en: "Full-containment cryogenic tank feeding the methaniers loading jetty.", fr: "Bac cryogénique full-containment alimentant le quai méthaniers." },
    specs: [{ label: "Capacity", value: "100 000 m³" }, { label: "Temp", value: "−162 °C" }],
  },
];

const EDGES: [string, string, ("feed" | "amine" | "c3" | "mcr" | "lng" | "fuel" | "lpg" | "cw")?][] = [
  ["101-F501", "101-F502", "amine"],
  ["101-F502", "101-F501", "amine"],
  ["101-F501", "101-G-507", "amine"],
  ["101-F501", "102-G07.87", "feed"],
  ["102-G07.87", "102-R03.10", "feed"],
  ["102-R03.10", "102-R03.11", "feed"],
  ["102-R03.11", "102-R03.12", "feed"],
  ["102-R03.12", "104-F07.11", "feed"],
  ["102-R03.12", "104-E05.20", "feed"],
  ["104-E05.20", "106-E05.20", "feed"],
  ["104-F07.11", "106-E05.20", "feed"],
  ["104-G07.85", "104-G07.90", "c3"],
  ["104-G07.90", "104-G07.91", "c3"],
  ["104-G07.91", "103-G07.86", "c3"],
  ["103-G07.86", "103-K01.10", "c3"],
  ["103-K01.10", "104-E07.11", "c3"],
  ["104-E07.11", "104-G07.85", "c3"],
  ["103-K01.10", "104-E05.20", "c3"],
  ["104-E07.11", "104-E05.20", "cw"],
  ["K05-G07.89", "104-E07.11", "cw"],
  ["106-E05.20", "106-G07.83", "mcr"],
  ["106-G07.83", "105-G07.88", "mcr"],
  ["105-G07.88", "105-K01.20", "mcr"],
  ["105-K01.20", "105-K01.21", "mcr"],
  ["105-K01.21", "K05-G07.89", "mcr"],
  ["K05-G07.89", "106-E05.20", "mcr"],
  ["106-E05.20", "LNG-TK", "lng"],
  ["106-E05.20", "102-K01.30", "fuel"],
  ["104-F07.11", "107-F07.21", "lpg"],
  ["107-F07.21", "108-F07.31", "lpg"],
  ["108-F07.31", "109-F07.41", "lpg"],
  ["109-F07.41", "110-F07.51", "lpg"],
  ["110-F07.51", "7E2-G07.65", "lpg"],
];

const STREAM_COLOR: Record<string, string> = {
  feed:  "#fbbf24",
  amine: "#22c55e",
  c3:    "#60a5fa",
  mcr:   "#a78bfa",
  lng:   "#22d3ee",
  fuel:  "#f97316",
  lpg:   "#84cc16",
  cw:    "#3b82f6",
};

const RADIUS_BY_CAT: Record<Category, number> = {
  absorber: 2.6, exchanger: 2.6, compressor: 2.4, column: 2.4,
  drum: 1.8, turbine: 2.2, pump: 1.8, reactor: 2.2, storage: 2.8,
};

// ─── NEW: maps each node ID → PID section ID from pid-sections.ts ────────────
const NODE_TO_PID: Record<string, string> = {
  // CO₂ removal absorber drawing covers F501, F502, G507
  "101-F501":   "co2-removal",
  "101-F502":   "co2-removal",
  "101-G-507":  "co2-removal",
  // Scrub tower drawing
  "104-F07.11": "scrub-tower",
  // Main exchanger drawing (MCHE)
  "106-E05.20": "main-exchanger",
  // MCR & feed chilling drawing covers propane circuit + MCR compressors
  "104-E05.20": "mcr-feed-chilling",
  "104-E07.11": "mcr-feed-chilling",
  "104-G07.85": "mcr-feed-chilling",
  "104-G07.90": "mcr-feed-chilling",
  "104-G07.91": "mcr-feed-chilling",
  "103-K01.10": "mcr-feed-chilling",
  "103-G07.86": "mcr-feed-chilling",
  "106-G07.83": "mcr-feed-chilling",
  "105-K01.20": "mcr-feed-chilling",
  "105-K01.21": "mcr-feed-chilling",
  "105-G07.88": "mcr-feed-chilling",
  "K05-G07.89": "mcr-feed-chilling",
  // Fractionation drawings (one per column)
  "107-F07.21": "demethanizer",
  "108-F07.31": "de-ethanizer",
  "109-F07.41": "depropanizer",
  "110-F07.51": "debutanizer",
  "7E2-G07.65": "debutanizer",
};

// Lookup PID_SECTIONS by id for O(1) access
const PID_BY_ID = Object.fromEntries(PID_SECTIONS.map((s) => [s.id, s]));
// ─────────────────────────────────────────────────────────────────────────────

export default function ProcessFlow() {
  const { lang } = useI18n();
  const navigate = useNavigate();                                               // ← NEW
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<Node["section"] | "all">("all");
  const [zoom, setZoom] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const dragRef = useRef<{ startX: number; startY: number; px: number; py: number } | null>(null);

  const selected = NODES.find((n) => n.id === selectedId) ?? null;
  const nodeMap = useMemo(() => Object.fromEntries(NODES.map((n) => [n.id, n])), []);

  // ← NEW: derive linked PID section whenever selection changes
  const linkedPID = useMemo(
    () => (selectedId ? PID_BY_ID[NODE_TO_PID[selectedId]] ?? null : null),
    [selectedId]
  );
  // Set of node IDs that have a linked P&ID (used for the amber dot indicators)
  const nodesWithPID = useMemo(() => new Set(Object.keys(NODE_TO_PID)), []);

  const isDimmed = (n: Node) => activeSection !== "all" && n.section !== activeSection;

  const sectionList: (Node["section"] | "all")[] = ["all", "decarb", "dehydr", "demerc", "cooling", "liquef", "fract", "fuel", "storage"];

  const vbW = 100 / zoom;
  const vbH = 62.5 / zoom;
  const vbX = (100 - vbW) / 2 - panX / zoom;
  const vbY = (62.5 - vbH) / 2 - panY / zoom;

  const onMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if ((e.target as Element).closest("[data-node]")) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, px: panX, py: panY };
  }, [panX, panY]);

  const onMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragRef.current) return;
    const svgEl = e.currentTarget;
    const rect = svgEl.getBoundingClientRect();
    const scaleX = 100 / rect.width;
    const scaleY = 62.5 / rect.height;
    const dx = (e.clientX - dragRef.current.startX) * scaleX * 0.5;
    const dy = (e.clientY - dragRef.current.startY) * scaleY * 0.5;
    setPanX(dragRef.current.px + dx);
    setPanY(dragRef.current.py + dy);
  }, []);

  const onMouseUp = useCallback(() => { dragRef.current = null; }, []);

  const onWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    setZoom((z) => Math.min(Math.max(z * factor, 0.8), 4));
  }, []);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFullscreen(false); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [fullscreen]);

  return (
    <div className="px-4 md:px-10 py-8 md:py-12 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
        <div>
          <div className="text-[10px] uppercase tracking-widest font-mono mb-2" style={{ color: ACCENT }}>
            / {lang === "en" ? "Process Flow · GNL1Z Train" : "Schéma Procédé · Train GNL1Z"}
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight">
            {lang === "en" ? "LNG Liquefaction Train" : "Train de Liquéfaction GNL"}
          </h1>
        </div>

        {/* ← NEW: P&ID Browser shortcut */}
        <Button
          variant="outline"
          size="sm"
          className="mt-1 gap-2 font-mono text-xs border-orange-500/40 text-orange-400 hover:bg-orange-500/10 hover:border-orange-400"
          onClick={() => navigate("/pid-viewer")}
        >
          <FileText className="h-3.5 w-3.5" />
          {lang === "en" ? "P&ID Browser" : "Navigateur P&ID"}
          <ExternalLink className="h-3 w-3 opacity-60" />
        </Button>
      </div>

      <p className="text-muted-foreground mb-6 max-w-3xl">
        {lang === "en"
          ? "Interactive mimic of the Sonatrach GNL1Z general process view (AP-C3MR™). Tap any equipment to read its description and technical specs. Filter by section to isolate a sub-system."
          : "Mimic interactif de la vue générale du procédé GNL1Z (AP-C3MR™). Cliquez un équipement pour sa description et ses spécifications. Filtrez par section pour isoler un sous-système."}
        {/* ← NEW: PID indicator note */}
        {" "}<span className="inline-flex items-center gap-1 text-orange-400/80">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
          {lang === "en"
            ? "Pulsing dot = linked P&ID drawing available."
            : "Point clignotant = plan P&ID lié disponible."}
        </span>
      </p>

      {/* Section filters — unchanged */}
      <div className="flex flex-wrap gap-2 mb-3">
        {sectionList.map((s) => {
          const active = activeSection === s;
          const label = s === "all"
            ? (lang === "en" ? "All sections" : "Toutes sections")
            : (lang === "en" ? SECTION[s].en : SECTION[s].fr);
          return (
            <button key={s} onClick={() => setActiveSection(s)}
              className="px-3 py-1.5 rounded text-xs font-mono border transition-colors"
              style={{
                borderColor: active ? ACCENT : "hsl(var(--border))",
                background: active ? `${ACCENT}20` : "hsl(var(--card))",
                color: active ? ACCENT : "hsl(var(--foreground))",
              }}>
              {label}
            </button>
          );
        })}
      </div>

      {/* Stream legend — unchanged */}
      <div className="flex flex-wrap gap-3 mb-4 text-[11px] font-mono text-muted-foreground">
        {[
          ["feed", lang === "en" ? "Feed gas" : "Gaz d'alim."],
          ["amine", "MEA"],
          ["c3", "Propane (C3)"],
          ["mcr", "MCR"],
          ["lng", "LNG"],
          ["lpg", "LPG / NGL"],
          ["fuel", lang === "en" ? "Fuel gas" : "Gaz comb."],
          ["cw", lang === "en" ? "Cooling water (G1)" : "Eau de refroidissement (G1)"],
        ].map(([k, label]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-0.5" style={{ background: STREAM_COLOR[k as string] }} />
            {label}
          </span>
        ))}
      </div>

      {/* ── SVG canvas — mostly unchanged; PID dot added per node ── */}
      <div className={
        fullscreen
          ? "fixed inset-0 z-50 bg-[hsl(220_25%_8%)] overflow-hidden shadow-2xl"
          : "rounded-xl border border-border bg-[hsl(220_25%_8%)] overflow-hidden shadow-card relative"
      }>
        {/* Zoom controls — unchanged */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
          <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => setZoom((z) => Math.min(z * 1.25, 4))}><ZoomIn className="h-4 w-4" /></Button>
          <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => setZoom((z) => Math.max(z / 1.25, 0.8))}><ZoomOut className="h-4 w-4" /></Button>
          <Button size="icon" variant="secondary" className="h-8 w-8" title="Reset view" onClick={() => { setZoom(1); setPanX(0); setPanY(0); }}>
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" className="h-8 w-8" title={fullscreen ? "Exit fullscreen" : "Fullscreen"} onClick={() => setFullscreen((f) => !f)}>
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
        <div className="absolute bottom-3 left-3 z-10 text-[9px] font-mono text-white/30 pointer-events-none">
          Scroll to zoom · drag to pan · click to inspect{fullscreen ? " · press Esc to exit" : ""}
        </div>

        <svg viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`} preserveAspectRatio="xMidYMid meet"
             className={fullscreen ? "w-full h-full block select-none" : "w-full h-auto block select-none"}
             style={{ aspectRatio: fullscreen ? undefined : "16 / 10", cursor: dragRef.current ? "grabbing" : "grab" }}
             onMouseDown={onMouseDown} onMouseMove={onMouseMove}
             onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
             onWheel={onWheel}>
          <defs>
            <pattern id="pf-grid" width="5" height="5" patternUnits="userSpaceOnUse">
              <path d="M 5 0 L 0 0 0 5" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.1" />
            </pattern>
            {Object.entries(STREAM_COLOR).map(([k, c]) => (
              <marker key={k} id={`arr-${k}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill={c} />
              </marker>
            ))}
          </defs>
          <rect x="0" y="0" width="100" height="62.5" fill="url(#pf-grid)" />

          {/* Section tinted background bands — unchanged */}
          {activeSection === "all" ? (
            <>
              <rect x="0" y="0" width="20" height="78" rx="1" fill="#10b981" fillOpacity="0.04" />
              <text x="1" y="6" fontSize="1.4" fontFamily="monospace" fill="#10b981" fillOpacity="0.4" letterSpacing="0.15">DECARB</text>
              <rect x="20" y="0" width="22" height="50" rx="1" fill="#a78bfa" fillOpacity="0.04" />
              <text x="21" y="6" fontSize="1.4" fontFamily="monospace" fill="#a78bfa" fillOpacity="0.4" letterSpacing="0.15">DEHYDR/DEMERC</text>
              <rect x="42" y="0" width="20" height="82" rx="1" fill="#60a5fa" fillOpacity="0.04" />
              <text x="43" y="6" fontSize="1.4" fontFamily="monospace" fill="#60a5fa" fillOpacity="0.4" letterSpacing="0.15">PRE-COOL</text>
              <rect x="55" y="0" width="38" height="66" rx="1" fill="#a78bfa" fillOpacity="0.04" />
              <text x="56" y="6" fontSize="1.4" fontFamily="monospace" fill="#a78bfa" fillOpacity="0.4" letterSpacing="0.15">LIQUEFACTION (MCR)</text>
              <rect x="0" y="82" width="65" height="18" rx="1" fill="#22c55e" fillOpacity="0.04" />
              <text x="1" y="88" fontSize="1.4" fontFamily="monospace" fill="#22c55e" fillOpacity="0.35" letterSpacing="0.15">FRACTIONATION</text>
              <rect x="88" y="0" width="12" height="40" rx="1" fill="#f97316" fillOpacity="0.05" />
              <text x="89" y="6" fontSize="1.4" fontFamily="monospace" fill="#f97316" fillOpacity="0.4" letterSpacing="0.15">FUEL / LNG</text>
            </>
          ) : (
            <rect x="0" y="0" width="100" height="100" rx="1"
              fill={CAT[NODES.find(n => n.section === activeSection)?.category ?? "drum"]?.color ?? "#fff"}
              fillOpacity="0.03" />
          )}

          <style>{`
            @keyframes pf-flow-dash { to { stroke-dashoffset: -6; } }
            .pf-flow { animation: pf-flow-dash 1.2s linear infinite; }
            .pf-edges:hover .pf-flow { animation-play-state: paused; }
            @keyframes pf-flow-pulse { 0%,100% { opacity: 0.35 } 50% { opacity: 1 } }
            .pf-glow { animation: pf-flow-pulse 1.6s ease-in-out infinite; }
            .pf-edges:hover .pf-glow { animation-play-state: paused; }
            @keyframes pf-pid-dot { 0%,100% { opacity: 0.7; r: 0.55; } 50% { opacity: 1; r: 0.85; } }
            .pf-pid-dot { animation: pf-pid-dot 2s ease-in-out infinite; }
          `}</style>

          <text x="50" y="3.5" textAnchor="middle" fontSize="2.2" fontFamily="monospace" fill="rgba(255,255,255,0.4)" letterSpacing="0.4">
            VUE GÉNÉRALE DU PROCÉDÉ — GNL1Z
          </text>

          {/* Edges — unchanged */}
          <g className="pf-edges">
            {EDGES.map(([a, b, kind = "feed"], i) => {
              const na = nodeMap[a]; const nb = nodeMap[b];
              if (!na || !nb) return null;
              const dimmed = isDimmed(na) && isDimmed(nb);
              const active = selectedId === a || selectedId === b || hoverId === a || hoverId === b;
              const color = STREAM_COLOR[kind];
              const delay = `${(i % 6) * -0.2}s`;
              return (
                <g key={i} style={{ opacity: dimmed ? 0.15 : 1, transition: "opacity 200ms" }}>
                  <line x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
                    stroke={color} strokeOpacity={active ? 0.9 : 0.45}
                    strokeWidth={active ? 0.5 : 0.3} markerEnd={`url(#arr-${kind})`} />
                  <line x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
                    stroke={color} strokeOpacity={active ? 1 : 0.85}
                    strokeWidth={active ? 0.55 : 0.4} strokeLinecap="round"
                    strokeDasharray="0.9 5.1" className="pf-flow" style={{ animationDelay: delay }} />
                  {active && (
                    <line x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
                      stroke={color} strokeOpacity={0.4} strokeWidth={1.4}
                      strokeLinecap="round" className="pf-glow" />
                  )}
                </g>
              );
            })}
          </g>

          {/* Nodes — shapes unchanged; PID dot added */}
          {NODES.map((n) => {
            const isSel = selectedId === n.id;
            const isHover = hoverId === n.id;
            const dimmed = isDimmed(n);
            const r = RADIUS_BY_CAT[n.category];
            const color = CAT[n.category].color;
            const hasPID = nodesWithPID.has(n.id);               // ← NEW

            return (
              <g key={n.id} data-node="1"
                style={{ cursor: "pointer", opacity: dimmed ? 0.15 : 1, transition: "opacity 200ms" }}
                onClick={() => setSelectedId(n.id)}
                onMouseEnter={() => setHoverId(n.id)}
                onMouseLeave={() => setHoverId(null)}
              >
                {(isSel || isHover) && (
                  <circle cx={n.x} cy={n.y} r={r + 1.6}
                    fill="none" stroke={ACCENT} strokeWidth={isSel ? 0.4 : 0.25} opacity={isSel ? 0.9 : 0.5}>
                    {isSel && <animate attributeName="r" values={`${r + 1.4};${r + 2.4};${r + 1.4}`} dur="2.2s" repeatCount="indefinite" />}
                  </circle>
                )}
                {(isSel || isHover) && (
                  <circle cx={n.x} cy={n.y} r={r + 0.6} fill={color} fillOpacity={isSel ? 0.25 : 0.12} />
                )}

                {/* Shapes — unchanged */}
                {n.category === "column" || n.category === "absorber" ? (
                  <ellipse cx={n.x} cy={n.y} rx={r * 0.75} ry={r * 1.25}
                    fill={isSel ? ACCENT : `${color}dd`}
                    stroke={isSel ? ACCENT : "rgba(255,255,255,0.7)"} strokeWidth="0.18" />
                ) : n.category === "drum" ? (
                  <ellipse cx={n.x} cy={n.y} rx={r * 1.25} ry={r * 0.75}
                    fill={isSel ? ACCENT : `${color}dd`}
                    stroke={isSel ? ACCENT : "rgba(255,255,255,0.7)"} strokeWidth="0.18" />
                ) : n.category === "compressor" || n.category === "turbine" ? (
                  <polygon
                    points={`${n.x},${n.y - r * 1.1} ${n.x + r},${n.y} ${n.x},${n.y + r * 1.1} ${n.x - r},${n.y}`}
                    fill={isSel ? ACCENT : `${color}dd`}
                    stroke={isSel ? ACCENT : "rgba(255,255,255,0.7)"} strokeWidth="0.18" />
                ) : n.category === "exchanger" ? (
                  <rect x={n.x - r} y={n.y - r * 0.75} width={r * 2} height={r * 1.5} rx="0.5"
                    fill={isSel ? ACCENT : `${color}dd`}
                    stroke={isSel ? ACCENT : "rgba(255,255,255,0.7)"} strokeWidth="0.18" />
                ) : (
                  <circle cx={n.x} cy={n.y} r={r}
                    fill={isSel ? ACCENT : `${color}dd`}
                    stroke={isSel ? ACCENT : "rgba(255,255,255,0.7)"} strokeWidth="0.18" />
                )}

                {n.category === "exchanger" && !isSel && (
                  <>
                    <line x1={n.x - r + 0.3} y1={n.y - 0.3} x2={n.x + r - 0.3} y2={n.y - 0.3} stroke="rgba(255,255,255,0.35)" strokeWidth="0.12" />
                    <line x1={n.x - r + 0.3} y1={n.y + 0.3} x2={n.x + r - 0.3} y2={n.y + 0.3} stroke="rgba(255,255,255,0.35)" strokeWidth="0.12" />
                  </>
                )}

                <text x={n.x} y={n.y + 0.5} textAnchor="middle" fontSize="1.2" fontFamily="monospace" fontWeight="700"
                  fill="white" fillOpacity={dimmed ? 0.4 : 1} pointerEvents="none">
                  {n.label}
                </text>
                <text x={n.x} y={n.y + r + 1.8} textAnchor="middle" fontSize="0.95" fontFamily="monospace"
                  fill={isSel ? ACCENT : (isHover ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.5)")} pointerEvents="none">
                  {n.id}
                </text>

                {/* ← NEW: amber pulsing dot for nodes with a linked P&ID */}
                {hasPID && !isSel && (
                  <circle cx={n.x + r * 0.72} cy={n.y - r * 0.72}
                    r="0.65" fill={ACCENT} className="pf-pid-dot" pointerEvents="none" />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="text-xs text-muted-foreground mt-3 font-mono">
        {NODES.length} {lang === "en" ? "equipment items · click to inspect" : "équipements · cliquez pour inspecter"}
        {" · "}{nodesWithPID.size} {lang === "en" ? "linked to P&ID drawings" : "liés à des plans P&ID"}
      </div>

      {/* ── Sheet panel — original structure + NEW P&ID section injected after specs ── */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: CAT[selected.category].color }} />
                  <span className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">
                    {lang === "en" ? CAT[selected.category].en : CAT[selected.category].fr}
                  </span>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {lang === "en" ? SECTION[selected.section].en : SECTION[selected.section].fr}
                  </Badge>
                  {/* ← NEW: PID badge when available */}
                  {linkedPID && (
                    <Badge className="font-mono text-[10px] bg-orange-500/15 text-orange-400 border-orange-500/30">
                      <FileText className="h-2.5 w-2.5 mr-1" />
                      P&amp;ID {linkedPID.drawing}
                    </Badge>
                  )}
                </div>
                <div className="text-xs font-mono text-muted-foreground">{selected.id}</div>
                <SheetTitle className="text-2xl font-display">
                  {lang === "en" ? selected.name.en : selected.name.fr}
                </SheetTitle>
                <SheetDescription className="text-base text-foreground/80 leading-relaxed pt-2">
                  {lang === "en" ? selected.description.en : selected.description.fr}
                </SheetDescription>
              </SheetHeader>

              {/* Technical specs — unchanged */}
              <div className="mt-6">
                <div className="text-[10px] uppercase tracking-widest font-mono mb-3" style={{ color: ACCENT }}>
                  {lang === "en" ? "Technical Specifications" : "Spécifications Techniques"}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {selected.specs.map((s) => (
                    <div key={s.label} className="border border-border rounded-lg bg-card p-3">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</div>
                      <div className="font-display font-bold text-base mt-1">{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ─── NEW: P&ID drawing section ───────────────────────────────── */}
              {linkedPID && (
                <div className="mt-6">
                  <div className="text-[10px] uppercase tracking-widest font-mono mb-3" style={{ color: ACCENT }}>
                    {lang === "en" ? "P&ID Drawing" : "Plan P&ID Lié"}
                  </div>

                  {/* Thumbnail */}
                  <div className="relative rounded-lg overflow-hidden border border-border bg-muted mb-3 aspect-video">
                    <img
                      src={driveImageUrl(linkedPID.fileId, "w800")}
                      alt={`P&ID ${linkedPID.drawing}`}
                      className="w-full h-full object-cover object-top"
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                        (e.currentTarget.nextElementSibling as HTMLElement).style.display = "flex";
                      }}
                    />
                    {/* Fallback */}
                    <div className="absolute inset-0 hidden flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
                      <FileText className="h-6 w-6 opacity-40" />
                      <span>{lang === "en" ? "Share Drive file to preview" : "Partagez le fichier Drive pour prévisualiser"}</span>
                    </div>
                    {/* Drawing number overlay */}
                    <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm rounded px-2 py-0.5 font-mono text-[10px] text-orange-300">
                      {linkedPID.drawing}
                    </div>
                  </div>

                  {/* Equipment tags on this drawing */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {linkedPID.equipment.map((tag) => (
                      <span key={tag}
                        className="font-mono text-[10px] text-orange-300/80 bg-orange-950/50 border border-orange-700/30 rounded px-1.5 py-0.5">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Open full viewer button */}
                  <Button
                    className="w-full gap-2 bg-orange-500 hover:bg-orange-400 text-slate-900 font-semibold"
                    onClick={() => { setSelectedId(null); navigate("/pid-viewer"); }}
                  >
                    <FileText className="h-4 w-4" />
                    {lang === "en" ? "Open in P&ID Viewer" : "Ouvrir dans le visualiseur P&ID"}
                    <ExternalLink className="h-3.5 w-3.5 ml-auto opacity-70" />
                  </Button>
                </div>
              )}
              {/* ──────────────────────────────────────────────────────────────── */}

              <Button variant="outline" className="mt-4 w-full" onClick={() => setSelectedId(null)}>
                <X className="h-4 w-4 mr-2" /> {lang === "en" ? "Close" : "Fermer"}
              </Button>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
  }
