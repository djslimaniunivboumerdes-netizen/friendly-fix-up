import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/contexts/I18nContext";
import { getEquipmentByTag } from "@/data";
import {
  ArrowRight, X, ZoomIn, ZoomOut, Maximize2,
  RotateCcw, Info, Layers, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION DEFINITIONS
   Color coding by process section, matching the app's design tokens.
───────────────────────────────────────────────────────────────────────────── */
type Section = "treatment" | "dehydration" | "propane" | "liquefaction" | "fractionation" | "compressor";

const SECTION_META: Record<Section, { labelEn: string; labelFr: string; color: string; bg: string; border: string; dot: string }> = {
  treatment:     { labelEn: "Feed Treatment",      labelFr: "Traitement Gaz",       color: "text-emerald-400",  bg: "bg-emerald-500/20",  border: "border-emerald-500/60",  dot: "bg-emerald-400" },
  dehydration:   { labelEn: "Dehydration",         labelFr: "Déshydratation",        color: "text-sky-400",      bg: "bg-sky-500/20",      border: "border-sky-500/60",      dot: "bg-sky-400" },
  propane:       { labelEn: "Propane / Pre-cool",  labelFr: "Propane / Pré-refr.",   color: "text-orange-400",   bg: "bg-orange-500/20",   border: "border-orange-500/60",   dot: "bg-orange-400" },
  liquefaction:  { labelEn: "Liquefaction",        labelFr: "Liquéfaction",          color: "text-violet-400",   bg: "bg-violet-500/20",   border: "border-violet-500/60",   dot: "bg-violet-400" },
  fractionation: { labelEn: "Fractionation",       labelFr: "Fractionnement",        color: "text-amber-400",    bg: "bg-amber-500/20",    border: "border-amber-500/60",    dot: "bg-amber-400" },
  compressor:    { labelEn: "Compression",         labelFr: "Compression",           color: "text-rose-400",     bg: "bg-rose-500/20",     border: "border-rose-500/60",     dot: "bg-rose-400" },
};

/* ─────────────────────────────────────────────────────────────────────────────
   HOTSPOT DATA
   Positions (x, y) are percentage offsets from the top-left of the PFD image.
   Calibrated against Image 2 (Vue Générale du Procédé) / Image 3 layout.
   dbTag: the equipment tag in gnl1z_database.json (null = no detail page).
───────────────────────────────────────────────────────────────────────────── */
interface Hotspot {
  id: string;
  diagramLabel: string;
  dbTag: string | null;
  x: number;
  y: number;
  nameEn: string;
  nameFr: string;
  section: Section;
}

const HOTSPOTS: Hotspot[] = [
  // ── FEED TREATMENT (X01) ─────────────────────────────────────────
  { id: "F502",    diagramLabel: "101-F502",    dbTag: "X01-F-502", x: 9.2,  y: 32.0, nameEn: "MEA Absorber",             nameFr: "Absorbeur MEA",                section: "treatment"     },
  { id: "F501",    diagramLabel: "101-F501",    dbTag: "X01-F-501", x: 16.0, y: 48.5, nameEn: "MEA Regenerator",          nameFr: "Régénérateur MEA",              section: "treatment"     },
  { id: "G507",    diagramLabel: "101-G-507",   dbTag: "X01-G-507", x: 7.8,  y: 71.0, nameEn: "MEA Flash Drum",           nameFr: "Ballon Flash MEA",              section: "treatment"     },
  { id: "G502",    diagramLabel: "X01-G-502",   dbTag: "X01-G-502", x: 20.5, y: 60.0, nameEn: "MEA Separator Drum",       nameFr: "Ballon Séparateur MEA",         section: "treatment"     },
  // ── DEHYDRATION (X02) ────────────────────────────────────────────
  { id: "R0310",   diagramLabel: "102-R03.10",  dbTag: "X02-R-03.12", x: 21.5, y: 17.5, nameEn: "Mol-Sieve Bed A",      nameFr: "Lit Tamis Mol. A",              section: "dehydration"   },
  { id: "R0311",   diagramLabel: "102-R03.11",  dbTag: "X02-R-03.12", x: 27.0, y: 17.5, nameEn: "Mol-Sieve Bed B",      nameFr: "Lit Tamis Mol. B",              section: "dehydration"   },
  { id: "R0312",   diagramLabel: "102-R03.12",  dbTag: "X02-R-03.12", x: 32.5, y: 23.0, nameEn: "Mol-Sieve Bed C",      nameFr: "Lit Tamis Mol. C",              section: "dehydration"   },
  { id: "G0787",   diagramLabel: "102-G07.87",  dbTag: "X02-G-07.87", x: 24.5, y: 35.5, nameEn: "Feed Gas Separator",   nameFr: "Séparateur Gaz Alim.",          section: "dehydration"   },
  { id: "G304",    diagramLabel: "X02-G-304",   dbTag: "X02-G-304",   x: 29.0, y: 48.0, nameEn: "Glycol Separator",     nameFr: "Séparateur Glycol",             section: "dehydration"   },
  // ── PROPANE / SCRUBBING (X03, X04) ───────────────────────────────
  { id: "F0711",   diagramLabel: "104-F07.11",  dbTag: "X04-F-07.11", x: 41.0, y: 36.0, nameEn: "Scrub Column",         nameFr: "Colonne de Lavage",             section: "propane"       },
  { id: "E0540",   diagramLabel: "104-E05.40",  dbTag: "X04-E-05.40", x: 47.5, y: 16.5, nameEn: "MCR/Feed Chiller",     nameFr: "Refroidisseur MCR/Alim.",       section: "propane"       },
  { id: "G0785",   diagramLabel: "104-G07.85",  dbTag: "X04-G-07.85", x: 47.0, y: 57.0, nameEn: "Propane Accumulator",  nameFr: "Accumulateur Propane HP",       section: "propane"       },
  { id: "G0790",   diagramLabel: "104-G07.90",  dbTag: "X04-G-07.90", x: 57.5, y: 52.5, nameEn: "Propane Flash Drum",   nameFr: "Ballon Flash Propane MP",       section: "propane"       },
  { id: "G0791",   diagramLabel: "104-G07.91",  dbTag: "X04-G-07.91", x: 53.5, y: 57.0, nameEn: "Propane Suction Drum", nameFr: "Ballon d'Aspiration Propane",   section: "propane"       },
  { id: "G0786",   diagramLabel: "103-G07.86",  dbTag: "X03-G-07.86", x: 65.0, y: 60.0, nameEn: "Propane LP Drum",      nameFr: "Ballon Propane BP",             section: "propane"       },
  { id: "K110",    diagramLabel: "103-K01.10",  dbTag: null,           x: 63.5, y: 43.5, nameEn: "Propane Compressor",   nameFr: "Compresseur Propane",           section: "compressor"    },
  { id: "K130",    diagramLabel: "102-K01.30",  dbTag: null,           x: 68.5, y: 38.5, nameEn: "Booster Compressor",   nameFr: "Compresseur de Refoulement",    section: "compressor"    },
  // ── LIQUEFACTION / MCR (X05, X06) ────────────────────────────────
  { id: "E0520",   diagramLabel: "106-E05.20",  dbTag: "X06-E-05.30", x: 57.5, y: 28.0, nameEn: "Main Cryogenic Exch.", nameFr: "Échangeur Cryogénique Princ.", section: "liquefaction"  },
  { id: "G0783",   diagramLabel: "106-G07.83",  dbTag: "X06-G-07.83", x: 72.0, y: 21.5, nameEn: "MCR HP Separator",     nameFr: "Séparateur MCR HP",             section: "liquefaction"  },
  { id: "K120",    diagramLabel: "105-K01.20",  dbTag: null,           x: 79.5, y: 41.0, nameEn: "MCR Compressor LP/MP", nameFr: "Compresseur MCR BP/MP",         section: "compressor"    },
  { id: "K121",    diagramLabel: "105-K01.21",  dbTag: null,           x: 87.5, y: 27.0, nameEn: "MCR Compressor HP",    nameFr: "Compresseur MCR HP",            section: "compressor"    },
  { id: "G0788",   diagramLabel: "105-G07.88",  dbTag: "X05-G-07.88", x: 83.5, y: 52.5, nameEn: "MCR LP Suction Drum",  nameFr: "Ballon Aspiration MCR BP",      section: "liquefaction"  },
  { id: "G0789",   diagramLabel: "K05-G07.89",  dbTag: "X05-G-07.89", x: 91.5, y: 55.5, nameEn: "MCR HP Suction Drum",  nameFr: "Ballon Aspiration MCR HP",      section: "liquefaction"  },
  // ── FRACTIONATION (X07–X10) ───────────────────────────────────────
  { id: "F0721",   diagramLabel: "107-F07.21",  dbTag: "X07-F-07.21", x: 11.5, y: 80.0, nameEn: "Demethaniser",         nameFr: "Déméthaniseur",                 section: "fractionation" },
  { id: "F0731",   diagramLabel: "108-F07.31",  dbTag: "X08-F-07.31", x: 23.5, y: 80.0, nameEn: "De-ethaniser",         nameFr: "Dééthaniseur",                  section: "fractionation" },
  { id: "F0741",   diagramLabel: "109-F07.41",  dbTag: "X09-F-07.41", x: 35.5, y: 80.0, nameEn: "Depropaniser",         nameFr: "Dépropaniseur",                 section: "fractionation" },
  { id: "F0751",   diagramLabel: "110-F07.51",  dbTag: "X10-F-07.51", x: 50.5, y: 80.0, nameEn: "Debutaniser",          nameFr: "Débutaniseur",                  section: "fractionation" },
];

/* ─────────────────────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────────────────────── */
export default function SmartProcessFlow() {
  const { lang } = useI18n();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<Section | "all">("all");
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const selectedHotspot = HOTSPOTS.find((h) => h.id === selectedId) ?? null;
  const hoveredHotspot  = HOTSPOTS.find((h) => h.id === hoveredId)  ?? null;
  const eq = selectedHotspot?.dbTag ? getEquipmentByTag(selectedHotspot.dbTag) : null;

  // ── Pan & Zoom ────────────────────────────────────────────────────
  const clampOffset = useCallback((ox: number, oy: number, s: number) => {
    const el = containerRef.current;
    if (!el) return { x: ox, y: oy };
    const cw = el.clientWidth;
    const ch = el.clientHeight;
    const imgW = cw * s;
    const imgH = ch * s;
    const maxX = Math.max(0, (imgW - cw) / 2);
    const maxY = Math.max(0, (imgH - ch) / 2);
    return { x: Math.max(-maxX, Math.min(maxX, ox)), y: Math.max(-maxY, Math.min(maxY, oy)) };
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale((s) => {
      const next = Math.min(4, Math.max(0.5, s - e.deltaY * 0.001));
      setOffset((o) => clampOffset(o.x, o.y, next));
      return next;
    });
  }, [clampOffset]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    setIsDragging(false);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    (e.target as Element).setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) setIsDragging(true);
    setOffset(clampOffset(dragStart.current.ox + dx, dragStart.current.oy + dy, scale));
  };
  const handlePointerUp = () => { dragStart.current = null; };

  const zoom = (delta: number) => setScale((s) => {
    const next = Math.min(4, Math.max(0.5, s + delta));
    setOffset((o) => clampOffset(o.x, o.y, next));
    return next;
  });
  const reset = () => { setScale(1); setOffset({ x: 0, y: 0 }); };

  // Close panel on Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") setSelectedId(null); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  const L = (en: string, fr: string) => lang === "fr" ? fr : en;

  const visibleHotspots = activeSection === "all"
    ? HOTSPOTS
    : HOTSPOTS.filter((h) => h.section === activeSection);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-[#030a14] text-white overflow-hidden">

      {/* ── Top Bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 h-12 border-b border-white/10 bg-[#06121f]/80 backdrop-blur shrink-0 z-20">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-accent" />
          <span className="font-mono text-xs uppercase tracking-widest text-white/70">
            {L("Process Flow Diagram", "Schéma de Procédé")}
          </span>
        </div>
        <div className="h-4 w-px bg-white/10" />
        <span className="text-[10px] text-white/40 font-mono">GNL1Z · AP-C3MR™</span>
        <div className="ml-auto flex items-center gap-1">
          <span className="text-[10px] text-white/30 font-mono mr-2">
            {visibleHotspots.length} {L("hotspots", "points")}
          </span>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10" onClick={() => zoom(0.3)}><ZoomIn className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10" onClick={() => zoom(-0.3)}><ZoomOut className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10" onClick={reset}><RotateCcw className="h-3.5 w-3.5" /></Button>
          <span className="text-[10px] font-mono text-white/40 w-10 text-center">{Math.round(scale * 100)}%</span>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">

        {/* ── Section Filter Sidebar ───────────────────────────────── */}
        <aside className="w-44 shrink-0 border-r border-white/10 bg-[#06121f]/60 flex flex-col gap-1 p-2 overflow-y-auto">
          <div className="text-[9px] uppercase tracking-widest text-white/30 font-mono px-2 pt-1 pb-2">
            {L("Filter", "Filtrer")}
          </div>
          <FilterBtn
            active={activeSection === "all"}
            color="text-white/70"
            dot="bg-white/30"
            label={L("All Sections", "Toutes les Sections")}
            count={HOTSPOTS.length}
            onClick={() => setActiveSection("all")}
          />
          {(Object.keys(SECTION_META) as Section[]).map((s) => {
            const m = SECTION_META[s];
            const count = HOTSPOTS.filter((h) => h.section === s).length;
            return (
              <FilterBtn
                key={s}
                active={activeSection === s}
                color={m.color}
                dot={m.dot}
                label={L(m.labelEn, m.labelFr)}
                count={count}
                onClick={() => setActiveSection(activeSection === s ? "all" : s)}
              />
            );
          })}
          <div className="mt-auto border-t border-white/10 pt-2 px-2">
            <div className="text-[9px] uppercase tracking-widest text-white/30 font-mono mb-1">
              {L("Controls", "Contrôles")}
            </div>
            <div className="text-[9px] text-white/30 leading-relaxed">
              {L("Scroll to zoom · Drag to pan · Click equipment to inspect",
                 "Molette = zoom · Glisser = déplacer · Clic = inspecter")}
            </div>
          </div>
        </aside>

        {/* ── Main PFD Canvas ─────────────────────────────────────── */}
        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* Transformable inner container */}
          <div
            className="absolute inset-0"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transformOrigin: "center center",
              transition: isDragging ? "none" : "transform 0.1s ease-out",
            }}
          >
            {/* PFD Image
                ── Place Image 3 (clean transparent background) at:
                   public/pfd/gnl1z-pfd.jpg
                   Then this src will resolve correctly.
                ── Using Image 2 (with labels) is also fine:
                   public/pfd/gnl1z-pfd-labeled.png ── */}
            <img
              ref={imageRef}
              src="/pfd/gnl1z-pfd.jpg"
              alt="GNL1Z Process Flow Diagram"
              className="w-full h-full object-contain block"
              draggable={false}
              style={{ filter: "brightness(0.88) contrast(1.05)" }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/pfd/gnl1z-pfd-labeled.png";
              }}
            />

            {/* ── Hotspot Overlay ─────────────────────────────────── */}
            {visibleHotspots.map((h) => {
              const meta  = SECTION_META[h.section];
              const isHov = hoveredId  === h.id;
              const isSel = selectedId === h.id;
              const hasDb = h.dbTag !== null;
              return (
                <div
                  key={h.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group"
                  style={{ left: `${h.x}%`, top: `${h.y}%` }}
                  onPointerEnter={() => !isDragging && setHoveredId(h.id)}
                  onPointerLeave={() => setHoveredId(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isDragging) setSelectedId(isSel ? null : h.id);
                  }}
                >
                  {/* Pulse ring */}
                  {!isSel && !isHov && (
                    <span className={`absolute inset-0 rounded-full animate-ping opacity-40 ${meta.dot}`}
                      style={{ animationDuration: "2.4s" }} />
                  )}
                  {/* Dot */}
                  <div
                    className={`relative w-4 h-4 rounded-full border-2 transition-all duration-150 cursor-pointer
                      ${isSel
                        ? `${meta.dot} border-white scale-150 shadow-lg`
                        : isHov
                          ? `${meta.dot} border-white/80 scale-125`
                          : `${meta.dot} border-white/30 hover:scale-125`}
                      ${!hasDb ? "opacity-70" : ""}`}
                  />
                  {/* Hover tooltip — only show when zoomed or on hover */}
                  {isHov && !isSel && (
                    <div
                      className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none z-30"
                      style={{ minWidth: "160px" }}
                    >
                      <div className={`rounded-lg border px-3 py-2 shadow-2xl text-left
                        bg-[#06121f]/95 backdrop-blur ${meta.border}`}>
                        <div className={`text-[10px] font-mono uppercase tracking-wider mb-0.5 ${meta.color}`}>
                          {h.diagramLabel}
                        </div>
                        <div className="text-xs font-semibold text-white leading-tight">
                          {L(h.nameEn, h.nameFr)}
                        </div>
                        <div className={`text-[10px] mt-1 ${meta.color}`}>
                          {L(SECTION_META[h.section].labelEn, SECTION_META[h.section].labelFr)}
                        </div>
                        {!hasDb && (
                          <div className="text-[9px] text-white/30 mt-1">
                            {L("No detail page", "Pas de fiche détail")}
                          </div>
                        )}
                        {/* Arrow */}
                        <div className={`absolute top-full left-1/2 -translate-x-1/2 -mt-px
                          border-4 border-transparent border-t-[#06121f]`} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Click outside to deselect */}
          {selectedId && (
            <div
              className="absolute inset-0 z-0"
              onClick={() => setSelectedId(null)}
            />
          )}
        </div>

        {/* ── Equipment Detail Panel ───────────────────────────────── */}
        <aside
          className={`shrink-0 border-l border-white/10 bg-[#06121f]/90 backdrop-blur transition-all duration-300 overflow-y-auto
            ${selectedHotspot ? "w-72" : "w-0"}`}
        >
          {selectedHotspot && (
            <div className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-4">
                <div className="flex-1 min-w-0">
                  <div className={`text-[10px] font-mono uppercase tracking-wider mb-1 ${SECTION_META[selectedHotspot.section].color}`}>
                    {selectedHotspot.diagramLabel}
                  </div>
                  <h2 className="text-base font-bold text-white leading-snug">
                    {L(selectedHotspot.nameEn, selectedHotspot.nameFr)}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedId(null)}
                  className="text-white/30 hover:text-white transition-colors mt-0.5 shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Section badge */}
              <div className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 mb-5 text-[11px] font-mono
                ${SECTION_META[selectedHotspot.section].bg} ${SECTION_META[selectedHotspot.section].border} ${SECTION_META[selectedHotspot.section].color}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${SECTION_META[selectedHotspot.section].dot}`} />
                {L(SECTION_META[selectedHotspot.section].labelEn, SECTION_META[selectedHotspot.section].labelFr)}
              </div>

              {/* Equipment data from DB */}
              {eq ? (
                <>
                  <div className="space-y-3 mb-5">
                    <InfoRow label="Tag" value={eq.tag} mono />
                    <InfoRow label={L("Type", "Type")} value={eq.type.name} />
                    <InfoRow label={L("Unit", "Unité")} value={eq.unit} mono />
                    <InfoRow label={L("Section", "Section")} value={eq.section} />
                    <InfoRow label={L("Status", "Statut")} value={eq.testing_status}
                      accent={eq.testing_status === "DEROGATION" ? "text-rose-400" : "text-emerald-400"} />
                    {eq.technical.pressure_bar > 0 && (
                      <InfoRow label={L("Design Pressure", "Pression Calcul")} value={`${eq.technical.pressure_bar} bar`} mono />
                    )}
                    {eq.technical.weight_kg > 0 && (
                      <InfoRow label={L("Mass", "Masse")} value={`${eq.technical.weight_kg.toLocaleString()} kg`} mono />
                    )}
                    <InfoRow label={L("Spare parts", "Pièces PDR")} value={`${eq.spare_parts.count}`} mono />
                  </div>

                  {eq.notes && (
                    <div className="border border-white/10 rounded p-3 mb-5 bg-white/5">
                      <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono mb-1">
                        {L("Notes", "Remarques")}
                      </div>
                      <p className="text-xs text-white/70 leading-relaxed">{eq.notes}</p>
                    </div>
                  )}

                  <Link
                    to={`/equipment/${encodeURIComponent(selectedHotspot.dbTag!)}`}
                    className={`flex items-center justify-between w-full rounded-lg border px-4 py-3 text-sm font-semibold transition-all
                      hover:brightness-110 hover:-translate-y-0.5
                      ${SECTION_META[selectedHotspot.section].bg} ${SECTION_META[selectedHotspot.section].border} ${SECTION_META[selectedHotspot.section].color}`}
                  >
                    <span>{L("View Equipment File", "Ouvrir la Fiche")}</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </>
              ) : selectedHotspot.dbTag ? (
                <div className="text-sm text-white/40 italic">
                  {L("Equipment record not found in database.", "Fiche équipement introuvable.")}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="border border-white/10 rounded p-3 bg-white/5">
                    <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono mb-1">
                      {L("Status", "Statut")}
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">
                      {L(
                        "This equipment (compressor/turbine) does not have a dedicated detail page in the current database. Refer to operational manuals for specifications.",
                        "Cet équipement (compresseur/turbine) n'a pas de fiche dédiée dans la base actuelle. Consulter les manuels opérationnels pour les spécifications."
                      )}
                    </p>
                  </div>
                  <Link
                    to="/manuals"
                    className="flex items-center justify-between w-full rounded-lg border border-white/20 px-4 py-3 text-sm font-semibold text-white/60 hover:text-white hover:border-white/40 transition-all"
                  >
                    <span>{L("Operational Manuals", "Manuels Opérationnels")}</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              )}

              {/* Navigate between hotspots */}
              <div className="mt-6 border-t border-white/10 pt-4">
                <div className="text-[10px] uppercase tracking-widest text-white/30 font-mono mb-3">
                  {L("Same section", "Même section")}
                </div>
                <div className="space-y-1">
                  {HOTSPOTS
                    .filter((h) => h.section === selectedHotspot.section && h.id !== selectedHotspot.id)
                    .slice(0, 5)
                    .map((h) => (
                      <button
                        key={h.id}
                        onClick={() => setSelectedId(h.id)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${SECTION_META[h.section].dot}`} />
                        <span className="font-mono truncate">{h.diagramLabel}</span>
                        <span className="text-white/30 truncate flex-1">{L(h.nameEn, h.nameFr)}</span>
                        <ArrowRight className="h-3 w-3 shrink-0" />
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ── Bottom status bar ───────────────────────────────────────── */}
      <div className="h-8 border-t border-white/10 bg-[#06121f]/60 flex items-center px-4 gap-4 text-[10px] font-mono text-white/30 shrink-0">
        <span>AP-C3MR™ · {L("Propane Pre-cooled Mixed Refrigerant", "Réfrigérant Mixte Pré-refroidi Propane")}</span>
        <div className="ml-auto flex items-center gap-4">
          {hoveredHotspot && (
            <span className="text-white/60">
              {hoveredHotspot.diagramLabel} — {L(hoveredHotspot.nameEn, hoveredHotspot.nameFr)}
            </span>
          )}
          <span>{L("Scroll to zoom · Drag to pan", "Molette = zoom · Glisser = déplacer")}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────────── */
function FilterBtn({
  active, color, dot, label, count, onClick,
}: {
  active: boolean; color: string; dot: string; label: string; count: number; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs transition-all
        ${active ? "bg-white/10" : "hover:bg-white/5"}`}
    >
      <span className={`h-2 w-2 rounded-full shrink-0 ${dot} ${active ? "" : "opacity-50"}`} />
      <span className={`flex-1 truncate ${active ? color : "text-white/40"} text-[11px]`}>{label}</span>
      <span className="text-white/20 text-[10px] font-mono">{count}</span>
    </button>
  );
}

function InfoRow({
  label, value, mono, accent,
}: {
  label: string; value: string; mono?: boolean; accent?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-[10px] uppercase tracking-wider text-white/30 font-mono shrink-0">{label}</span>
      <span className={`text-xs text-right ${mono ? "font-mono" : ""} ${accent ?? "text-white/80"}`}>
        {value}
      </span>
    </div>
  );
  }
