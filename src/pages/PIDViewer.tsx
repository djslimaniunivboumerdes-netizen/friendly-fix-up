import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/contexts/I18nContext";
import {
  PID_SECTIONS,
  PIDSection,
  CATEGORY_META,
  getUnits,
  getSectionsByUnit,
  driveImageUrl,
  driveViewerUrl,
  buildEquipmentIndex,
} from "@/data/pid-sections";
import {
  Search,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronRight,
  ChevronLeft,
  FileText,
  ExternalLink,
  Layers,
  Tag,
  Info,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Sub-components ───

function SectionCard({
  section,
  isActive,
  onClick,
}: {
  section: PIDSection;
  isActive: boolean;
  onClick: () => void;
}) {
  const meta = CATEGORY_META[section.category];
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-lg border px-3 py-2.5 transition-all duration-150",
        isActive
          ? "bg-white/10 border-teal-500/40 shadow-[0_0_12px_rgba(20,184,166,0.1)]"
          : "bg-white/5 border-white/5 hover:bg-white/8 hover:border-white/15"
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn("w-2 h-2 rounded-full shrink-0", meta.dot)} />
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-200 truncate">{section.title}</div>
          <div className="text-[11px] text-slate-500 truncate">{section.subtitle} · {section.drawing}</div>
        </div>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {section.equipment.slice(0, 4).map((tag) => (
          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5">
            {tag}
          </span>
        ))}
        {section.equipment.length > 4 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-500 border border-white/5">
            +{section.equipment.length - 4}
          </span>
        )}
      </div>
    </button>
  );
}

function ImageViewer({
  section,
  zoom,
  onZoomIn,
  onZoomOut,
}: {
  section: PIDSection;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const meta = CATEGORY_META[section.category];

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-slate-900/50">
        <div className="flex items-center gap-3 min-w-0">
          <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", meta.dot)} />
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white truncate">{section.title}</h2>
            <p className="text-[11px] text-slate-400 truncate">
              {section.drawing} {section.revision && `· Rev ${section.revision}`} · {section.unit}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onZoomOut}
            className="p-1.5 rounded-md bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ZoomOut size={14} />
          </button>
          <span className="text-xs text-slate-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={onZoomIn}
            className="p-1.5 rounded-md bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ZoomIn size={14} />
          </button>
          <a
            href={driveViewerUrl(section.fileId)}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-md bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-1"
            title="Open in Google Drive"
          >
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* Image canvas */}
      <div className="flex-1 overflow-auto bg-slate-950 flex items-start justify-center p-4">
        {section.fileId === "YOUR_FILE_ID_HERE" ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
            <FileText size={48} className="opacity-30" />
            <p className="text-sm">P&ID file not yet linked</p>
            <p className="text-xs text-slate-600">Add the Google Drive file ID in pid-sections.ts</p>
          </div>
        ) : (
          <div
            className="relative transition-transform duration-150 ease-out"
            style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
          >
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
              </div>
            )}
            {error ? (
              <div className="flex flex-col items-center justify-center p-8 text-slate-500 gap-2">
                <Info size={24} />
                <p className="text-sm">Failed to load image</p>
                <p className="text-xs text-slate-600">Check Google Drive sharing permissions</p>
              </div>
            ) : (
              <img
                src={driveImageUrl(section.fileId, "w2000")}
                alt={`${section.title} — ${section.drawing}`}
                className="max-w-none rounded-lg border border-white/10 shadow-xl"
                onLoad={() => setLoading(false)}
                onError={() => { setLoading(false); setError(true); }}
                draggable={false}
              />
            )}
          </div>
        )}
      </div>

      {/* Info bar */}
      <div className="px-4 py-2 border-t border-white/10 bg-slate-900/50 text-xs text-slate-400">
        {section.description}
      </div>
    </div>
  );
}

// ─── Main component ───
export default function PIDViewer() {
  const navigate = useNavigate();
  const { lang: rawLang } = useI18n();
  const lang = rawLang?.startsWith("fr") ? "fr" : "en";

  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [unitFilter, setUnitFilter] = useState<string>("all");

  const equipmentIndex = useMemo(() => buildEquipmentIndex(), []);

  const activeSection = useMemo(
    () => PID_SECTIONS.find((s) => s.id === activeId) ?? null,
    [activeId]
  );

  const units = useMemo(() => getUnits(), []);

  const filtered = useMemo(() => {
    const q = search.trim().toUpperCase();
    return PID_SECTIONS.filter((s) => {
      const matchUnit = unitFilter === "all" || s.unit === unitFilter;
      if (!matchUnit) return false;
      if (!q) return true;
      return (
        s.title.toUpperCase().includes(q) ||
        s.subtitle.toUpperCase().includes(q) ||
        s.drawing.toUpperCase().includes(q) ||
        s.equipment.some((tag) => tag.toUpperCase().includes(q)) ||
        s.description.toUpperCase().includes(q)
      );
    }).sort((a, b) => a.processOrder - b.processOrder);
  }, [search, unitFilter]);

  const handlePrev = useCallback(() => {
    if (!activeId) return;
    const idx = filtered.findIndex((s) => s.id === activeId);
    if (idx > 0) setActiveId(filtered[idx - 1].id);
  }, [activeId, filtered]);

  const handleNext = useCallback(() => {
    if (!activeId) return;
    const idx = filtered.findIndex((s) => s.id === activeId);
    if (idx < filtered.length - 1) setActiveId(filtered[idx + 1].id);
  }, [activeId, filtered]);

  // Keyboard nav
  useMemo(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "Escape") setActiveId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handlePrev, handleNext]);

  const totalTags = useMemo(
    () => new Set(PID_SECTIONS.flatMap((s) => s.equipment)).size,
    []
  );

  const linkedCount = PID_SECTIONS.filter((s) => s.fileId !== "YOUR_FILE_ID_HERE").length;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers size={20} className="text-amber-400" />
            {lang === "en" ? "P&ID Browser" : "Navigateur P&ID"}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {PID_SECTIONS.length} {lang === "en" ? "drawings" : "dessins"} · {totalTags} {lang === "en" ? "equipment tags" : "tags équipement"} · {linkedCount} {lang === "en" ? "linked" : "liés"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === "en" ? "Search drawing, tag, or number…" : "Rechercher dessin, tag, ou numéro…"}
              className="pl-8 pr-8 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 w-56"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Unit filter */}
      <div className="flex flex-wrap gap-1.5 shrink-0">
        <button
          onClick={() => setUnitFilter("all")}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium border transition-all",
            unitFilter === "all"
              ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
              : "bg-white/5 border-white/10 text-slate-400 hover:text-slate-200"
          )}
        >
          {lang === "en" ? "All units" : "Toutes unités"}
        </button>
        {units.map((u) => (
          <button
            key={u}
            onClick={() => setUnitFilter(unitFilter === u ? "all" : u)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium border transition-all",
              unitFilter === u
                ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                : "bg-white/5 border-white/10 text-slate-400 hover:text-slate-200"
            )}
          >
            {u}
          </button>
        ))}
      </div>

      {/* Main layout: sidebar + viewer */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Sidebar list */}
        <div className="w-72 shrink-0 flex flex-col gap-3 overflow-hidden">
          <div className="text-xs text-slate-500 uppercase tracking-wider font-medium px-1">
            {filtered.length} {lang === "en" ? "drawings" : "dessins"}
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filtered.map((section) => (
              <SectionCard
                key={section.id}
                section={section}
                isActive={activeId === section.id}
                onClick={() => {
                  setActiveId(section.id);
                  setZoom(1);
                }}
              />
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm">
                {lang === "en" ? "No P&IDs match your search." : "Aucun P&ID ne correspond."}
              </div>
            )}
          </div>
        </div>

        {/* Viewer */}
        <div className="flex-1 min-w-0 rounded-xl border border-white/10 bg-slate-900/40 overflow-hidden flex">
          {activeSection ? (
            <ImageViewer
              section={activeSection}
              zoom={zoom}
              onZoomIn={() => setZoom((z) => Math.min(z * 1.2, 4))}
              onZoomOut={() => setZoom((z) => Math.max(z / 1.2, 0.5))}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4">
              <Layers size={64} className="opacity-20" />
              <p className="text-lg font-medium">
                {lang === "en" ? "Select a P&ID from the sidebar" : "Sélectionnez un P&ID dans la liste"}
              </p>
              <p className="text-sm text-slate-600 max-w-md text-center">
                {lang === "en"
                  ? "Browse 44 process drawings organized by unit. Search by drawing number, equipment tag, or description."
                  : "Parcourez 44 dessins de procédé organisés par unité. Recherchez par numéro de dessin, tag équipement, ou description."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation footer */}
      {activeSection && (
        <div className="flex items-center justify-between shrink-0 px-1">
          <button
            onClick={handlePrev}
            disabled={filtered.findIndex((s) => s.id === activeId) <= 0}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={14} /> {lang === "en" ? "Previous" : "Précédent"}
          </button>
          <span className="text-xs text-slate-500">
            {filtered.findIndex((s) => s.id === activeId) + 1} / {filtered.length}
          </span>
          <button
            onClick={handleNext}
            disabled={filtered.findIndex((s) => s.id === activeId) >= filtered.length - 1}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {lang === "en" ? "Next" : "Suivant"} <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
                              }
