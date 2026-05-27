import React, { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/contexts/I18nContext";
import { X, ZoomIn, ZoomOut, Minimize2, Maximize2, ExternalLink, FileText, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ACCENT = "#f97316";

type Category = "absorber" | "exchanger" | "compressor" | "column" | "drum" | "pump" | "reactor" | "storage";

interface PIDLink {
  driveId: string;
  drawing: string;
  title: { en: string; fr: string };
}

interface Node {
  id: string;
  x: number; y: number;
  label: string;
  category: Category;
  section: "decarb" | "dehydr" | "demerc" | "cooling" | "liquef" | "fract" | "fuel" | "storage";
  name: { en: string; fr: string };
  description: { en: string; fr: string };
  specs: { label: string; value: string }[];
  pids?: PIDLink[];   // P&ID PDFs from Google Drive
}

const CAT: Record<Category, { en: string; fr: string; color: string }> = {
  absorber:   { en: "Absorber",             fr: "Absorbeur",      color: "#10b981" },
  exchanger:  { en: "Heat Exchanger",       fr: "Échangeur",      color: "#06b6d4" },
  compressor: { en: "Compressor",           fr: "Compresseur",    color: "#a855f7" },
  column:     { en: "Column",               fr: "Colonne",        color: "#22c55e" },
  drum:       { en: "Drum / Vessel",        fr: "Capacité",       color: "#eab308" },
  pump:       { en: "Pump",                 fr: "Pompe",          color: "#ec4899" },
  reactor:    { en: "Reactor / Bed",        fr: "Réacteur / Lit", color: "#a78bfa" },
  storage:    { en: "Storage",              fr: "Stockage",       color: "#94a3b8" },
};

const SECTION: Record<Node["section"], { en: string; fr: string; color: string }> = {
  decarb:  { en: "Decarbonation (MEA)",   fr: "Décarbonatation (MEA)",    color: "#10b981" },
  dehydr:  { en: "Dehydration",           fr: "Déshydratation",            color: "#a78bfa" },
  demerc:  { en: "Mercury Removal",       fr: "Démercurisation",           color: "#a78bfa" },
  cooling: { en: "Propane Pre-Cooling",   fr: "Pré-refroid. Propane",      color: "#60a5fa" },
  liquef:  { en: "Liquefaction (MCR)",    fr: "Liquéfaction (MCR)",        color: "#c084fc" },
  fract:   { en: "Fractionation",         fr: "Fractionnement",            color: "#22c55e" },
  fuel:    { en: "Fuel Gas",              fr: "Gaz Combustible",           color: "#f97316" },
  storage: { en: "LNG Storage",           fr: "Stockage GNL",              color: "#94a3b8" },
};

const NODES: Node[] = [
  // Decarbonation
  { id: "101-F501", x: 6,  y: 35, label: "F501", category: "absorber", section: "decarb",
    name: { en: "MEA CO₂ Absorber", fr: "Absorbeur CO₂ MEA" },
    description: { en: "Counter-current MEA absorber removing CO₂ from feed gas to <50 ppmv before cryogenic stages.", fr: "Absorbeur MEA contre-courant éliminant le CO₂ du gaz d'alimentation à <50 ppmv avant les étages cryogéniques." },
    specs: [{ label: "Service", value: "Amine treating" }, { label: "Pressure", value: "48 bar" }, { label: "Diameter", value: '120"' }, { label: "Height", value: "32 m" }],
    pids: [
      { driveId: "1XnQlsFf0j5eNlUDr9rKZfZkr3h2tGNDi", drawing: "85-X01-10.3",  title: { en: "MEA CO₂ Absorber",               fr: "Absorbeur CO₂ MEA" } },
      { driveId: "1DRydZxIMQCB7dy5I5C_nnVdQyjEzV4mn", drawing: "85-X01-10.15", title: { en: "MEA Absorber System",             fr: "Système Absorbeur MEA" } },
    ],
  },
  { id: "101-F502", x: 14, y: 16, label: "F502", category: "column", section: "decarb",
    name: { en: "MEA Regenerator", fr: "Régénérateur MEA" },
    description: { en: "Steam-stripped regenerator returning lean amine to the absorber.", fr: "Régénérateur stripé vapeur renvoyant l'amine pauvre vers l'absorbeur." },
    specs: [{ label: "Reboiler duty", value: "18 MW" }, { label: "Top T", value: "100 °C" }],
    pids: [{ driveId: "1DRydZxIMQCB7dy5I5C_nnVdQyjEzV4mn", drawing: "85-X01-10.15", title: { en: "MEA Absorber System", fr: "Système Absorbeur MEA" } }],
  },
  { id: "101-G507", x: 6, y: 60, label: "G507", category: "drum", section: "decarb",
    name: { en: "Rich Amine Flash Drum", fr: "Ballon Détente Amine Riche" },
    description: { en: "Flashes dissolved hydrocarbons from rich MEA before regeneration.", fr: "Détend les hydrocarbures dissous de la MEA riche avant régénération." },
    specs: [{ label: "Pressure", value: "5 bar" }],
    pids: [{ driveId: "1XnQlsFf0j5eNlUDr9rKZfZkr3h2tGNDi", drawing: "85-X01-10.3", title: { en: "MEA CO₂ Absorber", fr: "Absorbeur CO₂ MEA" } }],
  },

  // Dehydration
  { id: "102-G787", x: 22, y: 12, label: "G787", category: "drum", section: "dehydr",
    name: { en: "Dehydration Inlet KO Drum", fr: "Ballon Séparateur Déshydratation" },
    description: { en: "Removes free liquids upstream of mol-sieve beds.", fr: "Élimine les liquides libres en amont des tamis moléculaires." },
    specs: [{ label: "Pressure", value: "47 bar" }],
    pids: [{ driveId: "1s-HhZ9SDd9IrC54FoJgW3qgctdfKyBR4", drawing: "85-X02-10.1", title: { en: "Dryer Section — Sheet 1", fr: "Section Sécheur — Feuille 1" } }],
  },
  { id: "102-R310", x: 22, y: 28, label: "R310", category: "reactor", section: "dehydr",
    name: { en: "Mol-Sieve Bed A", fr: "Tamis Moléculaire A" },
    description: { en: "Adsorption of water on 4Å molecular sieves to <1 ppmv H₂O.", fr: "Adsorption d'eau sur tamis 4Å (<1 ppmv H₂O)." },
    specs: [{ label: "Cycle", value: "8 h" }, { label: "Regen T", value: "280 °C" }],
    pids: [
      { driveId: "1s-HhZ9SDd9IrC54FoJgW3qgctdfKyBR4", drawing: "85-X02-10.1", title: { en: "Dryer Section — Sheet 1", fr: "Section Sécheur — Feuille 1" } },
      { driveId: "1iBYssKKcfcQFf28qmZqLcuhhpY3n6c43", drawing: "85-X02-10.4", title: { en: "Dryer Reactivation",   fr: "Réactivation Sécheur"      } },
    ],
  },
  { id: "102-R311", x: 30, y: 28, label: "R311", category: "reactor", section: "dehydr",
    name: { en: "Mol-Sieve Bed B", fr: "Tamis Moléculaire B" },
    description: { en: "Parallel adsorber bed (rotating cycle: adsorb / regen / cool).", fr: "Lit adsorbeur parallèle (cycle: ads / régén / refroidissement)." },
    specs: [{ label: "Cycle", value: "8 h" }],
    pids: [{ driveId: "1s-HhZ9SDd9IrC54FoJgW3qgctdfKyBR4", drawing: "85-X02-10.1", title: { en: "Dryer Section — Sheet 1", fr: "Section Sécheur — Feuille 1" } }],
  },

  // Mercury removal
  { id: "102-R312", x: 38, y: 24, label: "R312", category: "reactor", section: "demerc",
    name: { en: "Mercury Guard Bed", fr: "Lit de Démercurisation" },
    description: { en: "Sulphur-impregnated activated-carbon bed removing Hg to <0.01 µg/Nm³.", fr: "Lit charbon actif soufré éliminant le Hg à <0,01 µg/Nm³." },
    specs: [{ label: "Outlet Hg", value: "<0.01 µg/Nm³" }],
    pids: [{ driveId: "17Ixt5YVT0PCuNO0tQdt__ruax58T3o8x", drawing: "85-X02-10.2", title: { en: "Dryer — Mercury Removal", fr: "Sécheur — Démercurisation" } }],
  },

  // Pre-cooling
  { id: "104-E520", x: 46, y: 20, label: "E520", category: "exchanger", section: "cooling",
    name: { en: "Feed Gas / Propane Chiller", fr: "Chiller Gaz / Propane" },
    description: { en: "Kettle-type chiller cools dry feed gas with propane refrigerant.", fr: "Chiller type kettle refroidissant le gaz sec via propane." },
    specs: [{ label: "Outlet T", value: "−35 °C" }, { label: "Duty", value: "85 MW" }],
    pids: [{ driveId: "1aNlMZ1PutUuOBqEh70GRxyyy7RF8wM9w", drawing: "85-X04-10.1", title: { en: "Scrub Tower Section",   fr: "Section Tour de Lavage" } }],
  },
  { id: "104-F711", x: 38, y: 48, label: "F711", category: "drum", section: "cooling",
    name: { en: "Scrub Column", fr: "Colonne de Lavage" },
    description: { en: "Removes heavy hydrocarbons (C5+) before MCHE to prevent freeze-out.", fr: "Élimine les hydrocarbures lourds (C5+) avant le MCHE pour éviter le gel." },
    specs: [{ label: "Trays", value: "20" }, { label: "Bottom T", value: "−25 °C" }],
    pids: [{ driveId: "1aNlMZ1PutUuOBqEh70GRxyyy7RF8wM9w", drawing: "85-X04-10.1", title: { en: "Scrub Tower Section", fr: "Section Tour de Lavage" } }],
  },
  { id: "103-K110", x: 46, y: 68, label: "K110", category: "compressor", section: "cooling",
    name: { en: "Propane Compressor (C3)", fr: "Compresseur Propane (C3)" },
    description: { en: "4-stage centrifugal compressor driving the propane pre-cooling loop.", fr: "Compresseur centrifuge 4 étages, boucle propane." },
    specs: [{ label: "Stages", value: "4" }, { label: "Power", value: "32 MW" }, { label: "Driver", value: "GE Frame 5" }],
    pids: [
      { driveId: "1ptzlIPKMw4oC6aT5tbhw--LcivaqSt6c", drawing: "85-X03-10.1", title: { en: "Propane Compression",   fr: "Compression Propane"    } },
      { driveId: "1li0MiuwYTB0l1J6r5J7jz9RPV0XBTe4I", drawing: "85-X03-10.4", title: { en: "Propane — Oil Flow",    fr: "Propane — Flux Huile"   } },
    ],
  },
  { id: "104-G785", x: 36, y: 75, label: "G785", category: "drum", section: "cooling",
    name: { en: "Propane Accumulator (HP)", fr: "Accumulateur Propane (HP)" },
    description: { en: "High-pressure propane condensate receiver.", fr: "Accumulateur HP condensat propane." },
    specs: [{ label: "Pressure", value: "16 bar" }],
    pids: [{ driveId: "1UX683Oz0fNogWftWMBUUtitF7ye8VB2s", drawing: "85-X03-10.2", title: { en: "Propane Condensers", fr: "Condenseurs Propane" } }],
  },
  { id: "104-G790", x: 28, y: 75, label: "G790", category: "drum", section: "cooling",
    name: { en: "Propane Economizer (MP)", fr: "Économiseur Propane (MP)" },
    description: { en: "Mid-pressure flash stage of propane refrigeration.", fr: "Étage de détente moyenne pression propane." },
    specs: [{ label: "Pressure", value: "5 bar" }],
    pids: [{ driveId: "1l2sSD2QO7VU29tmAFciLRJKUra7HCUiC", drawing: "85-X04-10.25", title: { en: "MCR & Feed Chilling", fr: "Refroidissement MCR & Alim." } }],
  },

  // Liquefaction
  { id: "MCHE", x: 58, y: 26, label: "MCHE", category: "exchanger", section: "liquef",
    name: { en: "Main Cryogenic Heat Exchanger", fr: "Échangeur Cryogénique Principal" },
    description: { en: "Air Products coil-wound exchanger liquefying treated gas to −162 °C using mixed-component refrigerant (MCR).", fr: "Échangeur bobiné Air Products liquéfiant le gaz traité à −162 °C via réfrigérant mixte (MCR)." },
    specs: [{ label: "Type", value: "Coil-wound" }, { label: "Outlet T", value: "−162 °C" }, { label: "Height", value: "55 m" }, { label: "Duty", value: "180 MW" }],
    pids: [
      { driveId: "1HZw_f38-vQEkcDh5GmrROaYUsv7_Gs-s", drawing: "85-X06-10.1", title: { en: "MCHE — Sheet 1",             fr: "MCHE — Feuille 1"               } },
      { driveId: "1Sn9BM5N_0EbgZE1AlFhNGlgFG_yDOMx4", drawing: "85-X06-10.2", title: { en: "MCHE — HP Separator",        fr: "MCHE — Séparateur HP"           } },
      { driveId: "1hKdpV7rH_te70GxsECbuKJsDZQ38lhBi", drawing: "85-X06-10.3", title: { en: "Flash Drum & LNG Pumps",    fr: "Ballon Flash & Pompes GNL"      } },
    ],
  },
  { id: "106-G783", x: 68, y: 18, label: "G783", category: "drum", section: "liquef",
    name: { en: "MCR HP Separator", fr: "Séparateur MCR HP" },
    description: { en: "Splits MCR into liquid (MR-L) and vapour (MR-V) streams feeding MCHE.", fr: "Sépare le MCR en liquide (MR-L) et vapeur (MR-V) alimentant le MCHE." },
    specs: [{ label: "Pressure", value: "44 bar" }],
    pids: [{ driveId: "1Sn9BM5N_0EbgZE1AlFhNGlgFG_yDOMx4", drawing: "85-X06-10.2", title: { en: "MCHE — HP Separator", fr: "MCHE — Séparateur HP" } }],
  },
  { id: "105-K120", x: 76, y: 36, label: "K120", category: "compressor", section: "liquef",
    name: { en: "MCR Compressor LP/MP", fr: "Compresseur MCR BP/MP" },
    description: { en: "Low/medium-pressure body of the mixed-refrigerant compressor train.", fr: "Corps BP/MP du train compresseur réfrigérant mixte." },
    specs: [{ label: "Stages", value: "3" }, { label: "Power", value: "40 MW" }],
    pids: [{ driveId: "1JL1cUAjnwklIzAgssF8Lfjpyxy46Znvs", drawing: "85-X05-10.1", title: { en: "MCR Compression — 1st Stage", fr: "Compression MCR — 1er Étage" } }],
  },
  { id: "105-K121", x: 84, y: 36, label: "K121", category: "compressor", section: "liquef",
    name: { en: "MCR Compressor HP", fr: "Compresseur MCR HP" },
    description: { en: "High-pressure body — final stage of the MCR loop.", fr: "Corps HP — étage final boucle MCR." },
    specs: [{ label: "Stages", value: "2" }, { label: "Power", value: "55 MW" }, { label: "Driver", value: "GE Frame 6" }],
    pids: [{ driveId: "12zjL0ltBTQyidegHSUYcbNioA3RLIXEB", drawing: "85-X05-10.2", title: { en: "MCR Compression — 2nd Stage", fr: "Compression MCR — 2ème Étage" } }],
  },
  { id: "105-G788", x: 70, y: 48, label: "G788", category: "drum", section: "liquef",
    name: { en: "MCR Suction Drum", fr: "Ballon Aspiration MCR" },
    description: { en: "Knock-out drum upstream of MCR compressor LP suction.", fr: "Ballon K.O. en amont aspiration BP compresseur MCR." },
    specs: [{ label: "Pressure", value: "3.5 bar" }],
    pids: [{ driveId: "1JL1cUAjnwklIzAgssF8Lfjpyxy46Znvs", drawing: "85-X05-10.1", title: { en: "MCR Compression — 1st Stage", fr: "Compression MCR — 1er Étage" } }],
  },

  // Fractionation
  { id: "107-F721", x: 8,  y: 85, label: "F721", category: "column", section: "fract",
    name: { en: "Demethaniser", fr: "Déméthaniseur" },
    description: { en: "Strips methane overhead from C2+ liquids recovered in scrub column.", fr: "Strippe le méthane en tête des liquides C2+ du scrub." },
    specs: [{ label: "Trays", value: "32" }, { label: "Top T", value: "−95 °C" }],
    pids: [{ driveId: "10tqueQZHEfRYAZPEa3XVQLygMibHwkJo", drawing: "85-X07-10", title: { en: "Demethaniser", fr: "Déméthaniseur" } }],
  },
  { id: "108-F731", x: 18, y: 85, label: "F731", category: "column", section: "fract",
    name: { en: "De-ethaniser", fr: "Dééthaniseur" },
    description: { en: "Recovers ethane overhead, sends C3+ to depropaniser.", fr: "Récupère l'éthane en tête, envoie C3+ au dépropaniseur." },
    specs: [{ label: "Trays", value: "40" }, { label: "Pressure", value: "28 bar" }],
    pids: [{ driveId: "16JOnZ04Stw9vnQXcSTTreby_gctLwmFb", drawing: "85-X08-10", title: { en: "De-ethaniser", fr: "Dééthaniseur" } }],
  },
  { id: "109-F741", x: 28, y: 85, label: "F741", category: "column", section: "fract",
    name: { en: "Depropaniser", fr: "Dépropaniseur" },
    description: { en: "Produces commercial propane overhead (LPG cut).", fr: "Produit du propane commercial en tête (coupe LPG)." },
    specs: [{ label: "Trays", value: "45" }, { label: "Pressure", value: "18 bar" }],
    pids: [{ driveId: "1uaKCbX73t0udB6xVd89r_wSHEdGMm61f", drawing: "85-X09-10", title: { en: "Depropaniser", fr: "Dépropaniseur" } }],
  },
  { id: "110-F751", x: 38, y: 85, label: "F751", category: "column", section: "fract",
    name: { en: "Debutaniser", fr: "Débutaniseur" },
    description: { en: "Separates butane (top) from natural gasoline (bottom).", fr: "Sépare le butane (tête) de l'essence naturelle (fond)." },
    specs: [{ label: "Trays", value: "38" }, { label: "Pressure", value: "8 bar" }],
    pids: [
      { driveId: "1YShEFvAQ7uczpYvz0Ek25XsvqVnjo5Lt", drawing: "85-X10-10.1", title: { en: "Debutaniser",         fr: "Débutaniseur"     } },
      { driveId: "1bFhEhleLR12lnd5t17D1XTU6-cmuNbtC", drawing: "85-X10-10.2", title: { en: "Debutaniser Reflux", fr: "Reflux Débutaniseur" } },
    ],
  },

  // Fuel & LNG
  { id: "102-K130", x: 90, y: 12, label: "K130", category: "compressor", section: "fuel",
    name: { en: "Fuel Gas Compressor", fr: "Compresseur Gaz Combustible" },
    description: { en: "Boosts BOG / fuel gas to plant fuel header (turbines, boilers).", fr: "Comprime le BOG / gaz combustible vers le collecteur (turbines, chaudières)." },
    specs: [{ label: "Discharge P", value: "28 bar" }],
    pids: [
      { driveId: "1OwWhnqMPPY4-v3SAuWclv_IKurN5ntdO", drawing: "85-X02-10.3", title: { en: "Fuel Gas Compressor & Dryer", fr: "Compresseur GC & Sécheur"    } },
      { driveId: "1hcKllyNgpLX48WcBPRpg7GkWY0ZrPhc1", drawing: "85-X02-10.5", title: { en: "Fuel Gas Comp. — Oil Flow",  fr: "Comp. GC — Flux d'Huile"    } },
    ],
  },
  { id: "LNG-TK", x: 90, y: 28, label: "LNG", category: "storage", section: "storage",
    name: { en: "LNG Storage Tank", fr: "Bac de Stockage GNL" },
    description: { en: "Full-containment cryogenic tank feeding the methaniers loading jetty.", fr: "Bac cryogénique full-containment alimentant le quai méthaniers." },
    specs: [{ label: "Capacity", value: "100 000 m³" }, { label: "Temp", value: "−162 °C" }],
    pids: [{ driveId: "1hKdpV7rH_te70GxsECbuKJsDZQ38lhBi", drawing: "85-X06-10.3", title: { en: "Flash Drum & LNG Pumps", fr: "Ballon Flash & Pompes GNL" } }],
  },
];

const EDGES: [string, string, ("feed" | "amine" | "c3" | "mcr" | "lng" | "fuel" | "lpg" | "cw")?][] = [
  ["101-F501", "101-F502", "amine"], ["101-F502", "101-F501", "amine"],
  ["101-F501", "101-G507", "amine"], ["101-F501", "102-G787", "feed"],
  ["102-G787", "102-R310", "feed"], ["102-R310", "102-R311", "feed"],
  ["102-R311", "102-R312", "feed"], ["102-R312", "104-F711", "feed"],
  ["102-R312", "104-E520", "feed"],
  ["104-E520", "MCHE", "feed"],     ["104-F711", "MCHE", "feed"],
  ["104-G785", "104-G790", "c3"],   ["104-G790", "103-K110", "c3"],
  ["103-K110", "104-G785", "c3"],   ["103-K110", "104-E520", "c3"],
  ["MCHE", "106-G783", "mcr"],      ["106-G783", "105-G788", "mcr"],
  ["105-G788", "105-K120", "mcr"],  ["105-K120", "105-K121", "mcr"],
  ["105-K121", "MCHE", "mcr"],
  ["MCHE", "LNG-TK", "lng"],        ["MCHE", "102-K130", "fuel"],
  ["104-F711", "107-F721", "lpg"],  ["107-F721", "108-F731", "lpg"],
  ["108-F731", "109-F741", "lpg"],  ["109-F741", "110-F751", "lpg"],
];

const STREAM_COLOR: Record<string, string> = {
  feed: "#fbbf24", amine: "#22c55e", c3: "#60a5fa",
  mcr: "#a78bfa",  lng: "#22d3ee",  fuel: "#f97316",
  lpg: "#84cc16",  cw: "#3b82f6",
};

const RADIUS_BY_CAT: Record<Category, number> = {
  absorber: 2.5, exchanger: 2.8, compressor: 2.4, column: 2.3,
  drum: 1.8, pump: 1.6, reactor: 2.0, storage: 2.8,
};

function drivePreviewUrl(id: string) { return `https://drive.google.com/file/d/${id}/preview`; }
function driveViewUrl(id: string)    { return `https://drive.google.com/file/d/${id}/view`; }

export default function ProcessFlow() {
  const { lang } = useI18n();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverId, setHoverId]       = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<Node["section"] | "all">("all");
  const [zoom, setZoom]             = useState(1);
  const [panX, setPanX]             = useState(0);
  const [panY, setPanY]             = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [activePidIdx, setActivePidIdx] = useState(0);

  const dragRef = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null);
  const nodeMap = useMemo(() => Object.fromEntries(NODES.map((n) => [n.id, n])), []);
  const selected = NODES.find((n) => n.id === selectedId) ?? null;

  const isDimmed = (n: Node) => activeSection !== "all" && n.section !== activeSection;
  const sectionList: (Node["section"] | "all")[] = ["all", "decarb", "dehydr", "demerc", "cooling", "liquef", "fract", "fuel", "storage"];

  const vbW = 100 / zoom, vbH = 62.5 / zoom;
  const vbX = (100 - vbW) / 2 - panX / zoom;
  const vbY = (62.5 - vbH) / 2 - panY / zoom;

  const onMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if ((e.target as Element).closest("[data-node]")) return;
    dragRef.current = { sx: e.clientX, sy: e.clientY, px: panX, py: panY };
  }, [panX, panY]);

  const onMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragRef.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const dx = (e.clientX - dragRef.current.sx) * (100 / r.width) * 0.5;
    const dy = (e.clientY - dragRef.current.sy) * (62.5 / r.height) * 0.5;
    setPanX(dragRef.current.px + dx);
    setPanY(dragRef.current.py + dy);
  }, []);

  const onMouseUp = useCallback(() => { dragRef.current = null; }, []);

  const onWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    setZoom((z) => Math.min(Math.max(z * (e.deltaY < 0 ? 1.15 : 1 / 1.15), 0.7), 5));
  }, []);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFullscreen(false); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [fullscreen]);

  // Reset P&ID index when selection changes
  useEffect(() => { setActivePidIdx(0); }, [selectedId]);

  const T = (en: string, fr: string) => lang === "fr" ? fr : en;

  return (
    <div className={fullscreen ? "fixed inset-0 z-50 bg-black flex flex-col" : "px-4 md:px-10 py-8 md:py-10 max-w-7xl mx-auto"}>
      {/* Header — hidden in fullscreen */}
      {!fullscreen && (
        <>
          <div className="text-[10px] uppercase tracking-widest font-mono mb-2" style={{ color: ACCENT }}>
            / {T("Process Flow · GNL1Z Train", "Schéma Procédé · Train GNL1Z")}
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight mb-2">
            {T("LNG Liquefaction Train", "Train de Liquéfaction GNL")}
            <span style={{ color: ACCENT }}>.</span>
          </h1>
          <p className="text-muted-foreground mb-5 max-w-3xl text-sm">
            {T(
              "Interactive AP-C3MR™ process mimic with the real train as background. Click any node to read specs and open the P&ID drawing directly from Google Drive. Scroll to zoom · drag to pan.",
              "Mimic procédé AP-C3MR™ interactif sur fond du train réel. Cliquez un équipement pour ses spécifications et ouvrir le plan P&ID depuis Google Drive. Molette pour zoomer · glisser pour panoramique."
            )}
          </p>

          {/* Section filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            {sectionList.map((s) => {
              const active = activeSection === s;
              const color = s === "all" ? ACCENT : SECTION[s as Node["section"]].color;
              const label = s === "all" ? T("All sections", "Toutes sections") : T(SECTION[s as Node["section"]].en, SECTION[s as Node["section"]].fr);
              return (
                <button key={s} onClick={() => setActiveSection(s)}
                  className="px-3 py-1.5 rounded text-xs font-mono border transition-all"
                  style={{ borderColor: active ? color : "hsl(var(--border))", background: active ? `${color}20` : "transparent", color: active ? color : "hsl(var(--muted-foreground))" }}>
                  {label}
                </button>
              );
            })}
          </div>

          {/* Stream legend */}
          <div className="flex flex-wrap gap-4 mb-4 text-[10px] font-mono text-muted-foreground">
            {[["feed", T("Feed gas","Gaz alim.")], ["amine","MEA"], ["c3",T("Propane","Propane")], ["mcr","MCR"], ["lng","LNG"], ["lpg","LPG/NGL"], ["fuel",T("Fuel gas","Gaz comb.")]].map(([k,lbl]) => (
              <span key={k} className="flex items-center gap-1.5">
                <span className="w-5 h-0.5 inline-block" style={{ background: STREAM_COLOR[k] }} />
                {lbl}
              </span>
            ))}
          </div>
        </>
      )}

      {/* Main diagram container */}
      <div className={`relative overflow-hidden ${fullscreen ? "flex-1" : "rounded-2xl border border-border shadow-2xl"}`}
           style={{ background: "#050a0f" }}>

        {/* Zoom / fullscreen controls */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5">
          {[
            { icon: ZoomIn,    onClick: () => setZoom((z) => Math.min(z * 1.25, 5))    },
            { icon: ZoomOut,   onClick: () => setZoom((z) => Math.max(z / 1.25, 0.7))  },
            { icon: Maximize2, onClick: () => { setZoom(1); setPanX(0); setPanY(0); }  },
            { icon: fullscreen ? Minimize2 : Maximize2, onClick: () => setFullscreen((f) => !f) },
          ].map(({ icon: Icon, onClick }, i) => (
            <button key={i} onClick={onClick}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-white/10 bg-black/60 text-white/70 hover:text-white hover:bg-white/10 transition-all backdrop-blur-sm">
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>

        {/* Hint */}
        <div className="absolute bottom-2 left-3 z-10 text-[9px] font-mono text-white/25 pointer-events-none select-none">
          {T("scroll · drag · click to inspect", "molette · glisser · cliquer pour inspecter")}
          {fullscreen ? " · Esc" : ""}
        </div>

        {/* SVG diagram */}
        <svg
          viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full block select-none"
          style={{ aspectRatio: fullscreen ? undefined : "16 / 10", height: fullscreen ? "100%" : undefined, cursor: dragRef.current ? "grabbing" : "grab" }}
          onMouseDown={onMouseDown} onMouseMove={onMouseMove}
          onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
          onWheel={onWheel}
        >
          <defs>
            {/* ── Background train image ──────────────────────── */}
            {/* Dark vignette gradient on top of photo */}
            <linearGradient id="bg-darken-h" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="#050a0f" stopOpacity="0.55" />
              <stop offset="40%"  stopColor="#050a0f" stopOpacity="0.25" />
              <stop offset="60%"  stopColor="#050a0f" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#050a0f" stopOpacity="0.55" />
            </linearGradient>
            <linearGradient id="bg-darken-v" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#050a0f" stopOpacity="0.45" />
              <stop offset="30%"  stopColor="#050a0f" stopOpacity="0.05" />
              <stop offset="70%"  stopColor="#050a0f" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#050a0f" stopOpacity="0.65" />
            </linearGradient>
            {/* Subtle grid */}
            <pattern id="pf-grid" width="5" height="5" patternUnits="userSpaceOnUse">
              <path d="M 5 0 L 0 0 0 5" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.1" />
            </pattern>
            {/* Flow arrow markers */}
            {Object.entries(STREAM_COLOR).map(([k, c]) => (
              <marker key={k} id={`arr-${k}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill={c} />
              </marker>
            ))}
          </defs>

          {/* ── Background photo ─────────────────────────────── */}
          <image
            href="/general train.jpg"
            x="0" y="0" width="100" height="62.5"
            preserveAspectRatio="xMidYMid slice"
            style={{ filter: "saturate(0.5) brightness(0.55)" }}
          />
          {/* Horizontal darkening gradient */}
          <rect x="0" y="0" width="100" height="62.5" fill="url(#bg-darken-h)" />
          {/* Vertical darkening gradient */}
          <rect x="0" y="0" width="100" height="62.5" fill="url(#bg-darken-v)" />
          {/* Grid overlay */}
          <rect x="0" y="0" width="100" height="62.5" fill="url(#pf-grid)" />

          {/* ── Title ─────────────────────────────────────────── */}
          <text x="50" y="4" textAnchor="middle" fontSize="2" fontFamily="monospace"
            fill="rgba(255,255,255,0.3)" letterSpacing="0.5">
            VUE GÉNÉRALE DU PROCÉDÉ — GNL1Z  ·  AP-C3MR™
          </text>

          {/* ── Section bands ─────────────────────────────────── */}
          {activeSection === "all" && [
            { x: 0,  y: 0,  w: 19, h: 70, s: "decarb" as const },
            { x: 19, y: 0,  w: 22, h: 45, s: "dehydr" as const },
            { x: 41, y: 0,  w: 20, h: 60, s: "cooling" as const },
            { x: 55, y: 0,  w: 35, h: 60, s: "liquef"  as const },
            { x: 0,  y: 78, w: 55, h: 22, s: "fract"   as const },
            { x: 86, y: 0,  w: 14, h: 40, s: "fuel"    as const },
          ].map(({ x, y, w, h, s }) => (
            <g key={s}>
              <rect x={x} y={y} width={w} height={h} rx="0.5"
                fill={SECTION[s].color} fillOpacity="0.05"
                stroke={SECTION[s].color} strokeOpacity="0.12" strokeWidth="0.15" />
              <text x={x + 0.8} y={y + 5} fontSize="1.2" fontFamily="monospace"
                fill={SECTION[s].color} fillOpacity="0.5" letterSpacing="0.1">
                {lang === "fr" ? SECTION[s].fr : SECTION[s].en}
              </text>
            </g>
          ))}

          {/* ── Animated flow CSS ─────────────────────────────── */}
          <style>{`
            @keyframes pf-dash { to { stroke-dashoffset: -6; } }
            .pf-flow { animation: pf-dash 1.2s linear infinite; }
            @keyframes pf-pulse { 0%,100%{opacity:.3} 50%{opacity:1} }
            .pf-glow { animation: pf-pulse 1.8s ease-in-out infinite; }
          `}</style>

          {/* ── Edges ─────────────────────────────────────────── */}
          {EDGES.map(([a, b, kind = "feed"], i) => {
            const na = nodeMap[a], nb = nodeMap[b];
            if (!na || !nb) return null;
            const dimmed = isDimmed(na) && isDimmed(nb);
            const active = selectedId === a || selectedId === b || hoverId === a || hoverId === b;
            const color  = STREAM_COLOR[kind];
            const delay  = `${(i % 6) * -0.2}s`;
            return (
              <g key={i} style={{ opacity: dimmed ? 0.12 : 1, transition: "opacity 0.2s" }}>
                <line x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
                  stroke={color} strokeOpacity={active ? 0.85 : 0.35}
                  strokeWidth={active ? 0.5 : 0.28} markerEnd={`url(#arr-${kind})`} />
                <line x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
                  stroke={color} strokeOpacity={active ? 1 : 0.7}
                  strokeWidth={active ? 0.55 : 0.38}
                  strokeLinecap="round" strokeDasharray="0.8 5.2"
                  className="pf-flow" style={{ animationDelay: delay }} />
                {active && (
                  <line x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
                    stroke={color} strokeOpacity={0.35} strokeWidth={1.5}
                    strokeLinecap="round" className="pf-glow" />
                )}
              </g>
            );
          })}

          {/* ── Nodes ─────────────────────────────────────────── */}
          {NODES.map((n) => {
            const isSel   = selectedId === n.id;
            const isHover = hoverId === n.id;
            const dimmed  = isDimmed(n);
            const r       = RADIUS_BY_CAT[n.category];
            const color   = CAT[n.category].color;
            const hasPids = (n.pids?.length ?? 0) > 0;

            const shapeProps = {
              fill: isSel ? ACCENT : `${color}cc`,
              stroke: isSel ? ACCENT : "rgba(255,255,255,0.6)",
              strokeWidth: "0.2",
            };

            return (
              <g key={n.id} data-node="1"
                style={{ cursor: "pointer", opacity: dimmed ? 0.12 : 1, transition: "opacity 0.2s" }}
                onClick={() => setSelectedId(n.id)}
                onMouseEnter={() => setHoverId(n.id)}
                onMouseLeave={() => setHoverId(null)}>
                {/* Pulse ring when selected */}
                {isSel && (
                  <circle cx={n.x} cy={n.y} r={r + 1.8} fill="none" stroke={ACCENT} strokeWidth="0.3" opacity="0.7">
                    <animate attributeName="r" values={`${r + 1.4};${r + 2.6};${r + 1.4}`} dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                {/* Glow */}
                {(isSel || isHover) && (
                  <circle cx={n.x} cy={n.y} r={r + 1} fill={color} fillOpacity={isSel ? 0.3 : 0.15} />
                )}

                {/* Shape */}
                {n.category === "column" || n.category === "absorber" ? (
                  <ellipse cx={n.x} cy={n.y} rx={r * 0.7} ry={r * 1.3} {...shapeProps} />
                ) : n.category === "drum" ? (
                  <ellipse cx={n.x} cy={n.y} rx={r * 1.3} ry={r * 0.7} {...shapeProps} />
                ) : n.category === "compressor" ? (
                  <polygon points={`${n.x},${n.y - r * 1.1} ${n.x + r},${n.y} ${n.x},${n.y + r * 1.1} ${n.x - r},${n.y}`} {...shapeProps} />
                ) : n.category === "exchanger" ? (
                  <rect x={n.x - r} y={n.y - r * 0.7} width={r * 2} height={r * 1.4} rx="0.4" {...shapeProps} />
                ) : n.category === "storage" ? (
                  <rect x={n.x - r} y={n.y - r * 0.8} width={r * 2} height={r * 1.6} rx="0.6" {...shapeProps} />
                ) : (
                  <circle cx={n.x} cy={n.y} r={r} {...shapeProps} />
                )}

                {/* Exchanger tube lines */}
                {n.category === "exchanger" && (
                  <>
                    <line x1={n.x - r + 0.4} y1={n.y - 0.35} x2={n.x + r - 0.4} y2={n.y - 0.35} stroke="rgba(255,255,255,0.3)" strokeWidth="0.12" />
                    <line x1={n.x - r + 0.4} y1={n.y + 0.35} x2={n.x + r - 0.4} y2={n.y + 0.35} stroke="rgba(255,255,255,0.3)" strokeWidth="0.12" />
                  </>
                )}

                {/* P&ID indicator dot (top-right corner) */}
                {hasPids && !dimmed && (
                  <circle cx={n.x + r * 0.8} cy={n.y - r * 0.8} r="0.5"
                    fill={isSel ? "white" : ACCENT} fillOpacity="0.9" />
                )}

                {/* Label */}
                <text x={n.x} y={n.y + 0.5} textAnchor="middle" fontSize="1.1"
                  fontFamily="monospace" fontWeight="700" fill="white" pointerEvents="none">
                  {n.label}
                </text>
                {/* Tag */}
                <text x={n.x} y={n.y + r + 2} textAnchor="middle" fontSize="0.9"
                  fontFamily="monospace" pointerEvents="none"
                  fill={isSel ? ACCENT : isHover ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.45)"}>
                  {n.id}
                </text>
              </g>
            );
          })}
        </svg>

        {/* ── Right-side Equipment + P&ID Panel ──────────────── */}
        {selected && (
          <div
            className="absolute top-0 right-0 h-full flex flex-col bg-black/90 backdrop-blur-md border-l border-white/10 overflow-y-auto"
            style={{ width: "min(400px, 45%)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Panel header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/80 backdrop-blur-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: CAT[selected.category].color }} />
                <div className="min-w-0">
                  <div className="text-[9px] font-mono uppercase tracking-widest text-white/40 truncate">{selected.id}</div>
                  <div className="text-sm font-semibold text-white leading-tight truncate">
                    {lang === "fr" ? selected.name.fr : selected.name.en}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedId(null)}
                className="h-7 w-7 flex items-center justify-center rounded text-white/50 hover:text-white hover:bg-white/10 shrink-0 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-5">
              {/* Badges */}
              <div className="flex gap-2 flex-wrap">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded"
                  style={{ background: `${CAT[selected.category].color}20`, color: CAT[selected.category].color }}>
                  {lang === "fr" ? CAT[selected.category].fr : CAT[selected.category].en}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded"
                  style={{ background: `${SECTION[selected.section].color}15`, color: SECTION[selected.section].color }}>
                  {lang === "fr" ? SECTION[selected.section].fr : SECTION[selected.section].en}
                </span>
              </div>

              {/* Description */}
              <p className="text-sm text-white/70 leading-relaxed">
                {lang === "fr" ? selected.description.fr : selected.description.en}
              </p>

              {/* Specs grid */}
              <div>
                <div className="text-[10px] uppercase tracking-widest font-mono mb-2" style={{ color: ACCENT }}>
                  {T("Technical Specs", "Spécifications")}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {selected.specs.map((s) => (
                    <div key={s.label} className="rounded-lg border border-white/8 bg-white/5 p-2.5">
                      <div className="text-[9px] uppercase tracking-wider text-white/40 font-mono">{s.label}</div>
                      <div className="text-sm font-bold text-white mt-0.5">{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* P&ID Section */}
              {selected.pids && selected.pids.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-widest font-mono mb-2 flex items-center gap-2" style={{ color: ACCENT }}>
                    <FileText className="h-3 w-3" />
                    {T("P&ID Drawings", "Plans P&ID")}
                    <span className="text-white/30">({selected.pids.length})</span>
                  </div>

                  {/* Drawing tabs */}
                  {selected.pids.length > 1 && (
                    <div className="flex gap-1.5 flex-wrap mb-2">
                      {selected.pids.map((pid, idx) => (
                        <button key={pid.driveId} onClick={() => setActivePidIdx(idx)}
                          className="text-[9px] font-mono px-2 py-1 rounded border transition-all"
                          style={{
                            borderColor: idx === activePidIdx ? ACCENT : "rgba(255,255,255,0.12)",
                            background: idx === activePidIdx ? `${ACCENT}20` : "transparent",
                            color: idx === activePidIdx ? ACCENT : "rgba(255,255,255,0.5)",
                          }}>
                          {pid.drawing}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Active PID title */}
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-[10px] font-mono text-white/40">{selected.pids[activePidIdx].drawing}</div>
                      <div className="text-xs text-white/80 font-medium">
                        {lang === "fr" ? selected.pids[activePidIdx].title.fr : selected.pids[activePidIdx].title.en}
                      </div>
                    </div>
                    <a href={driveViewUrl(selected.pids[activePidIdx].driveId)}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[9px] font-mono text-white/40 hover:text-white transition-colors">
                      <ExternalLink className="h-3 w-3" />
                      {T("Full res.", "Pleine rés.")}
                    </a>
                  </div>

                  {/* PDF iframe */}
                  <div className="rounded-lg overflow-hidden border border-white/10 bg-black"
                       style={{ aspectRatio: "4/3" }}>
                    <iframe
                      key={selected.pids[activePidIdx].driveId}
                      src={drivePreviewUrl(selected.pids[activePidIdx].driveId)}
                      title={selected.pids[activePidIdx].drawing}
                      className="w-full h-full border-0"
                      allow="autoplay"
                    />
                  </div>
                  <p className="text-[9px] font-mono text-white/25 mt-1.5 text-center">
                    {T("Google Drive preview — open for full resolution →", "Aperçu Google Drive — ouvrir pour pleine résolution →")}
                  </p>
                </div>
              )}

              {/* Footer links */}
              <div className="flex flex-col gap-2 pt-2 border-t border-white/8">
                <Link to="/pid"
                  className="flex items-center gap-2 text-[10px] font-mono text-white/40 hover:text-white transition-colors">
                  <ChevronRight className="h-3 w-3" />
                  {T("Browse full P&ID library →", "Bibliothèque P&ID complète →")}
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {!fullscreen && (
        <div className="text-xs text-muted-foreground mt-3 font-mono">
          {NODES.length} {T("equipment items", "équipements")} · {EDGES.length} {T("process streams", "flux procédé")} ·{" "}
          <span style={{ color: ACCENT }}>●</span> {T("orange dot = P&ID drawing linked", "point orange = plan P&ID lié")}
        </div>
      )}
    </div>
  );
  }
