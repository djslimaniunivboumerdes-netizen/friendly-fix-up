import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  PID_SECTIONS,
  CATEGORY_META,
  driveImageUrl,
  buildEquipmentIndex,
  type PIDSection,
  type PIDCategory,
} from "@/data/pid-sections";

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

interface BadgeProps {
  category: PIDCategory;
}
function CategoryBadge({ category }: BadgeProps) {
  const meta = CATEGORY_META[category];
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${meta.bg} ${meta.color} ${meta.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

interface PIDCardProps {
  section: PIDSection;
  onClick: (section: PIDSection) => void;
}
function PIDCard({ section, onClick }: PIDCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <button
      onClick={() => onClick(section)}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900 hover:border-amber-500/60 hover:bg-slate-800/80 transition-all duration-200 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
    >
      {/* Thumbnail */}
      <div className="relative h-44 bg-slate-800 overflow-hidden">
        {!imgError ? (
          <>
            {!imgLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-slate-600 border-t-amber-400 rounded-full animate-spin" />
                  <span className="text-xs text-slate-500">Loading P&amp;ID…</span>
                </div>
              </div>
            )}
            <img
              src={driveImageUrl(section.fileId, "w800")}
              alt={`P&ID – ${section.title}`}
              className={`w-full h-full object-cover object-top transition-all duration-300 group-hover:scale-105 ${
                imgLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent pointer-events-none" />
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-500">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
            </svg>
            <span className="text-xs">Enable Drive sharing to preview</span>
            <span className="text-xs font-mono text-slate-600">{section.drawing}</span>
          </div>
        )}

        {/* Drawing number badge */}
        <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-sm border border-slate-600/50 rounded-md px-2 py-0.5">
          <span className="text-xs font-mono text-slate-300">{section.drawing}</span>
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-white leading-tight">{section.title}</h3>
            <p className="text-sm text-slate-400">{section.subtitle}</p>
          </div>
          <CategoryBadge category={section.category} />
        </div>

        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{section.description}</p>

        {/* Equipment tags */}
        <div className="flex flex-wrap gap-1 mt-1">
          {section.equipment.slice(0, 6).map((tag) => (
            <span
              key={tag}
              className="font-mono text-[10px] text-amber-300/80 bg-amber-950/50 border border-amber-700/30 rounded px-1.5 py-0.5"
            >
              {tag}
            </span>
          ))}
          {section.equipment.length > 6 && (
            <span className="text-[10px] text-slate-500 self-center">
              +{section.equipment.length - 6} more
            </span>
          )}
        </div>
      </div>

      {/* Hover cue */}
      <div className="absolute inset-0 ring-1 ring-inset ring-amber-400/0 group-hover:ring-amber-400/20 rounded-xl pointer-events-none transition-all" />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Full-screen Lightbox Viewer
// ─────────────────────────────────────────────────────────────────────────────

interface LightboxProps {
  sections: PIDSection[];
  initialIndex: number;
  onClose: () => void;
}

function Lightbox({ sections, initialIndex, onClose }: LightboxProps) {
  const [idx, setIdx] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const section = sections[idx];

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const navigate = useCallback(
    (dir: number) => {
      setIdx((i) => Math.max(0, Math.min(sections.length - 1, i + dir)));
      resetView();
    },
    [sections.length, resetView]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") navigate(-1);
      if (e.key === "ArrowRight") navigate(1);
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(z + 0.25, 4));
      if (e.key === "-") setZoom((z) => Math.max(z - 0.25, 0.5));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, navigate]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom === 1) return;
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setPan({
      x: dragStart.current.panX + (e.clientX - dragStart.current.x),
      y: dragStart.current.panY + (e.clientY - dragStart.current.y),
    });
  };
  const handleMouseUp = () => setDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.max(0.5, Math.min(4, z + (e.deltaY < 0 ? 0.15 : -0.15))));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-sm"
      role="dialog"
      aria-modal
      aria-label={`P&ID Viewer – ${section.title}`}
    >
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/80 shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-slate-500">{section.drawing}</span>
          <span className="text-slate-600">|</span>
          <h2 className="font-semibold text-white text-sm">
            {section.title} — {section.subtitle}
          </h2>
          <CategoryBadge category={section.category} />
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg px-2 py-1 border border-slate-700">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
              className="text-slate-400 hover:text-white w-5 h-5 flex items-center justify-center text-base leading-none"
              aria-label="Zoom out"
            >−</button>
            <span className="text-xs text-slate-300 font-mono w-10 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
              className="text-slate-400 hover:text-white w-5 h-5 flex items-center justify-center text-base leading-none"
              aria-label="Zoom in"
            >+</button>
          </div>
          <button
            onClick={resetView}
            className="text-xs text-slate-400 hover:text-white bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1"
          >
            Reset
          </button>

          {/* Navigation */}
          <span className="text-xs text-slate-500 ml-2 font-mono">
            {idx + 1} / {sections.length}
          </span>
          <button
            onClick={() => navigate(-1)}
            disabled={idx === 0}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-30 transition-colors"
            aria-label="Previous"
          >
            ‹
          </button>
          <button
            onClick={() => navigate(1)}
            disabled={idx === sections.length - 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-30 transition-colors"
            aria-label="Next"
          >
            ›
          </button>

          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-700/50 transition-colors ml-1"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── Main canvas ── */}
      <div
        className="flex-1 overflow-hidden flex items-center justify-center relative"
        style={{ cursor: zoom > 1 ? (dragging ? "grabbing" : "grab") : "default" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <img
          src={driveImageUrl(section.fileId, "w4000")}
          alt={`P&ID – ${section.title}`}
          draggable={false}
          className="max-w-none select-none transition-transform duration-100"
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: "center center",
            maxHeight: "100%",
            userSelect: "none",
          }}
        />
      </div>

      {/* ── Bottom info strip ── */}
      <div className="shrink-0 border-t border-slate-800 bg-slate-900/80 px-4 py-2 flex items-center gap-4 overflow-x-auto">
        <span className="text-xs text-slate-500 whitespace-nowrap">Equipment on this drawing:</span>
        {section.equipment.map((tag) => (
          <span
            key={tag}
            className="font-mono text-[11px] text-amber-300 bg-amber-950/60 border border-amber-700/40 rounded px-2 py-0.5 whitespace-nowrap"
          >
            {tag}
          </span>
        ))}
        <span className="ml-auto text-xs text-slate-600 whitespace-nowrap">
          Use ← → to navigate · Scroll or +/− to zoom
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_FILTERS: Array<{ id: PIDCategory | "all"; label: string }> = [
  { id: "all", label: "All Sections" },
  { id: "treatment", label: "Feed Treatment" },
  { id: "pre-cooling", label: "Pre-cooling" },
  { id: "liquefaction", label: "Liquefaction" },
  { id: "fractionation", label: "Fractionation" },
  { id: "utilities", label: "Utilities" },
];

export default function PIDViewer() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<PIDCategory | "all">("all");
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const equipmentIndex = useMemo(() => buildEquipmentIndex(), []);

  // Filtered & sorted sections
  const filtered = useMemo(() => {
    const q = search.trim().toUpperCase();
    return PID_SECTIONS.filter((s) => {
      const matchCat = categoryFilter === "all" || s.category === categoryFilter;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        s.title.toUpperCase().includes(q) ||
        s.subtitle.toUpperCase().includes(q) ||
        s.drawing.toUpperCase().includes(q) ||
        s.equipment.some((tag) => tag.toUpperCase().includes(q)) ||
        s.description.toUpperCase().includes(q)
      );
    }).sort((a, b) => a.processOrder - b.processOrder);
  }, [search, categoryFilter]);

  const handleCardClick = useCallback(
    (section: PIDSection) => {
      const idx = filtered.findIndex((s) => s.id === section.id);
      if (idx !== -1) setLightboxIdx(idx);
    },
    [filtered]
  );

  // Stats
  const totalTags = useMemo(() => new Set(PID_SECTIONS.flatMap((s) => s.equipment)).size, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* ── Header ── */}
      <div className="border-b border-slate-800 bg-slate-900/50 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {/* Process icon */}
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                </svg>
              </div>
              <h1 className="text-lg font-bold text-white tracking-tight">P&amp;ID Browser</h1>
              <span className="text-xs font-mono text-slate-500 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5">
                GL1/Z — BECHTEL
              </span>
            </div>
            <p className="text-sm text-slate-500">
              {PID_SECTIONS.length} drawings · {totalTags} equipment tags
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Search tag, title or drawing…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400 w-72 transition-all"
            />
          </div>
        </div>

        {/* Category filter tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-3 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {CATEGORY_FILTERS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setCategoryFilter(id as PIDCategory | "all")}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border whitespace-nowrap transition-all ${
                categoryFilter === id
                  ? "bg-amber-500 border-amber-500 text-slate-900"
                  : "bg-transparent border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
              }`}
            >
              {label}
            </button>
          ))}
          {search && (
            <span className="text-xs text-slate-500 ml-2">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {filtered.length === 0 ? (
          <div className="text-center py-24 text-slate-600">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <p className="text-sm">No P&amp;ID sections match your search.</p>
          </div>
        ) : (
          <>
            {/* Group by unit when showing "All" */}
            {categoryFilter === "all" && !search ? (
              <div className="space-y-10">
                {["Feed Gas Treatment", "Pre-cooling", "Liquefaction", "Fractionation Train", "Utilities"].map(
                  (unit) => {
                    const unitSections = filtered.filter((s) => s.unit === unit);
                    if (unitSections.length === 0) return null;
                    return (
                      <div key={unit}>
                        <div className="flex items-center gap-3 mb-4">
                          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-widest">
                            {unit}
                          </h2>
                          <div className="flex-1 h-px bg-slate-800" />
                          <span className="text-xs text-slate-600">{unitSections.length} drawing{unitSections.length > 1 ? "s" : ""}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {unitSections.map((s) => (
                            <PIDCard key={s.id} section={s} onClick={handleCardClick} />
                          ))}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((s) => (
                  <PIDCard key={s.id} section={s} onClick={handleCardClick} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightboxIdx !== null && (
        <Lightbox
          sections={filtered}
          initialIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </div>
  );
}
