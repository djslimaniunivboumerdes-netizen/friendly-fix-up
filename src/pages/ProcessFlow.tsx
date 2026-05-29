import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/contexts/I18nContext";
import { EQUIPMENT, getEquipmentByTag } from "@/data";
import { DCS_PANELS, dcsImageUrl, type DcsPanel } from "@/data/dcs_panels";
import { Layers, ChevronRight, X } from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────────
   EQUIPMENT-TYPE COLOR SYSTEM
   Decoded from the middle segment of the tag (e.g. X01-F-502 → "F").
───────────────────────────────────────────────────────────────────────────── */
type TypeKey = "F" | "E" | "G" | "K" | "P" | "R" | "J" | "T" | "OTHER";

const TYPE_META: Record<TypeKey, { labelEn: string; labelFr: string; dot: string; ring: string; text: string; border: string }> = {
  F: { labelEn: "Vessel / Column",  labelFr: "Capacité / Colonne", dot: "bg-sky-400",     ring: "ring-sky-400/50",     text: "text-sky-300",     border: "border-sky-400/60" },
  E: { labelEn: "Exchanger",        labelFr: "Échangeur",          dot: "bg-teal-400",    ring: "ring-teal-400/50",    text: "text-teal-300",    border: "border-teal-400/60" },
  G: { labelEn: "Drum / Separator", labelFr: "Ballon / Séparateur",dot: "bg-slate-300",   ring: "ring-slate-300/50",   text: "text-slate-200",   border: "border-slate-300/60" },
  K: { labelEn: "Compressor",       labelFr: "Compresseur",        dot: "bg-rose-500",    ring: "ring-rose-500/50",    text: "text-rose-300",    border: "border-rose-500/60" },
  P: { labelEn: "Pump",             labelFr: "Pompe",              dot: "bg-emerald-400", ring: "ring-emerald-400/50", text: "text-emerald-300", border: "border-emerald-400/60" },
  R: { labelEn: "Reactor / Bed",    labelFr: "Réacteur / Lit",     dot: "bg-violet-400",  ring: "ring-violet-400/50",  text: "text-violet-300",  border: "border-violet-400/60" },
  J: { labelEn: "Ejector / Turbine",labelFr: "Éjecteur / Turbine", dot: "bg-amber-400",   ring: "ring-amber-400/50",   text: "text-amber-300",   border: "border-amber-400/60" },
  T: { labelEn: "Tank",             labelFr: "Réservoir",          dot: "bg-orange-400",  ring: "ring-orange-400/50",  text: "text-orange-300",  border: "border-orange-400/60" },
  OTHER:{ labelEn: "Other",         labelFr: "Autre",              dot: "bg-white/40",    ring: "ring-white/30",       text: "text-white/70",    border: "border-white/30" },
};

function typeKeyForTag(tag: string): TypeKey {
  const m = tag.match(/-([A-Z])-/);
  const k = (m?.[1] ?? "") as TypeKey;
  return (k in TYPE_META ? k : "OTHER") as TypeKey;
}

/* ─────────────────────────────────────────────────────────────────────────────
   PANEL ORDER — left-to-right process sequence (Feed → Treatment → Refrig →
   Liquefaction → Fractionation → Recovery → Utilities → Operating Data).
───────────────────────────────────────────────────────────────────────────── */
const SECTION_ORDER = [
  "Process",       // general overview first
  "Treatment",
  "Refrigeration",
  "Liquefaction",
  "Fractionation",
  "Recovery",
  "Utilities",
  "Operating Data",
];

function sortPanels(panels: DcsPanel[]) {
  return [...panels].sort((a, b) => {
    const sa = SECTION_ORDER.indexOf(a.section); const sb = SECTION_ORDER.indexOf(b.section);
    if (sa !== sb) return sa - sb;
    return a.id.localeCompare(b.id);
  });
}

/* ─────────────────────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────────────────────── */
export default function ProcessFlow() {
  const { lang } = useI18n();
  const L = (en: string, fr: string) => (lang === "fr" ? fr : en);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Pre-compute every panel's equipment dots (deduped, type-resolved).
  const panels = useMemo(() => {
    const sorted = sortPanels(DCS_PANELS);
    return sorted.map((p) => {
      const seen = new Set<string>();
      const dots = (p.related_tags ?? [])
        .filter((t) => (seen.has(t) ? false : (seen.add(t), true)))
        .map((tag) => ({
          tag,
          tk: typeKeyForTag(tag),
          eq: getEquipmentByTag(tag),
        }));
      return { ...p, dots };
    });
  }, []);

  // Coverage stats for the legend.
  const stats = useMemo(() => {
    const counts: Record<TypeKey, number> = { F: 0, E: 0, G: 0, K: 0, P: 0, R: 0, J: 0, T: 0, OTHER: 0 };
    EQUIPMENT.forEach((e) => { counts[typeKeyForTag(e.tag)] += 1; });
    return counts;
  }, []);

  const selectedEq = selectedTag ? getEquipmentByTag(selectedTag) : null;
  const selectedTk = selectedTag ? typeKeyForTag(selectedTag) : "OTHER";

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-[#030a14] text-white overflow-hidden">

      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 h-12 border-b border-white/10 bg-[#06121f]/80 backdrop-blur shrink-0 z-20">
        <Layers className="h-4 w-4 text-accent" />
        <span className="font-mono text-xs uppercase tracking-widest text-white/70">
          {L("Process Flow — DCS Composite", "Schéma Procédé — Composite DCS")}
        </span>
        <div className="h-4 w-px bg-white/10" />
        <span className="text-[10px] text-white/40 font-mono">
          GNL1Z · AP-C3MR™ · {panels.length} {L("panels", "panneaux")}
        </span>
      </div>

      {/* Type legend (replaces section sidebar — equipment colored by type, not section) */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-2 border-b border-white/10 bg-[#06121f]/40 shrink-0 z-10">
        <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
          {L("Equipment Type", "Type d'Équipement")}
        </span>
        {(Object.keys(TYPE_META) as TypeKey[]).filter((k) => k !== "OTHER").map((k) => {
          const m = TYPE_META[k];
          return (
            <div key={k} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${m.dot}`} />
              <span className={`text-[11px] font-mono ${m.text}`}>{L(m.labelEn, m.labelFr)}</span>
              <span className="text-[10px] text-white/30 font-mono">({stats[k]})</span>
            </div>
          );
        })}
      </div>

      {/* Main scroll area */}
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 overflow-auto p-4">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {panels.map((p) => (
              <PanelTile
                key={p.id}
                panel={p}
                lang={lang}
                onPickTag={(t) => setSelectedTag(t)}
              />
            ))}
          </div>
          <p className="text-[10px] text-white/30 font-mono mt-6 leading-relaxed max-w-3xl">
            {L(
              "DCS-composite view. Each tile is a real DCS mimic from the train; together they form the full process plan. Equipment dots are colored by type, not section.",
              "Vue composite DCS. Chaque tuile est un synoptique DCS réel du train ; ensemble ils forment le schéma procédé complet. Les pastilles d'équipements sont colorées par type, pas par section."
            )}
          </p>
        </div>

        {/* Detail side panel */}
        {selectedTag && (
          <aside className="w-72 shrink-0 border-l border-white/10 bg-[#06121f]/95 backdrop-blur overflow-y-auto">
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <div className={`text-[10px] font-mono uppercase tracking-wider mb-1 ${TYPE_META[selectedTk].text}`}>
                    {selectedTag}
                  </div>
                  <h2 className="text-base font-bold text-white leading-snug">
                    {selectedEq ? (lang === "fr" ? (selectedEq.name_fr || selectedEq.name) : (selectedEq.name_en || selectedEq.name)) : L("Equipment not in database", "Équipement absent de la base")}
                  </h2>
                </div>
                <button onClick={() => setSelectedTag(null)} className="text-white/30 hover:text-white shrink-0">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 mb-4 text-[11px] font-mono ${TYPE_META[selectedTk].border} ${TYPE_META[selectedTk].text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${TYPE_META[selectedTk].dot}`} />
                {L(TYPE_META[selectedTk].labelEn, TYPE_META[selectedTk].labelFr)}
              </div>

              {selectedEq && (
                <div className="space-y-2 mb-4 text-xs">
                  <Row label={L("Unit", "Unité")} value={selectedEq.unit} mono />
                  <Row label={L("Section", "Section")} value={selectedEq.section} />
                  <Row label={L("Status", "Statut")} value={selectedEq.testing_status}
                    accent={selectedEq.testing_status === "DEROGATION" ? "text-rose-400" : "text-emerald-400"} />
                  {selectedEq.technical.pressure_bar > 0 && (
                    <Row label={L("Design P.", "P. calcul")} value={`${selectedEq.technical.pressure_bar} bar`} mono />
                  )}
                  {selectedEq.technical.weight_kg > 0 && (
                    <Row label={L("Mass", "Masse")} value={`${selectedEq.technical.weight_kg.toLocaleString()} kg`} mono />
                  )}
                  <Row label={L("Spare parts", "PDR")} value={`${selectedEq.spare_parts.count}`} mono />
                </div>
              )}

              <Link
                to={`/equipment/${encodeURIComponent(selectedTag)}`}
                className={`flex items-center justify-between w-full rounded-lg border px-4 py-3 text-sm font-semibold transition-all hover:brightness-110 hover:-translate-y-0.5 ${TYPE_META[selectedTk].border} ${TYPE_META[selectedTk].text}`}
              >
                <span>{L("Open Equipment File", "Ouvrir la Fiche")}</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

/* ───────────── helpers ───────────── */

function PanelTile({
  panel,
  lang,
  onPickTag,
}: {
  panel: DcsPanel & { dots: { tag: string; tk: TypeKey; eq: ReturnType<typeof getEquipmentByTag> }[] };
  lang: string;
  onPickTag: (tag: string) => void;
}) {
  const L = (en: string, fr: string) => (lang === "fr" ? fr : en);
  return (
    <div className="group rounded-lg border border-white/10 bg-[#06121f]/60 overflow-hidden hover:border-white/30 transition-colors">
      <div className="relative aspect-[16/10] bg-black/60 overflow-hidden">
        <img
          src={dcsImageUrl(panel.storage_path)}
          alt={lang === "fr" ? panel.title_fr : panel.title_en}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-2">
          <div>
            <div className="text-[9px] uppercase tracking-widest font-mono text-white/60">{panel.section}{panel.unit ? ` · ${panel.unit}` : ""}</div>
            <div className="text-xs font-semibold text-white leading-tight drop-shadow">
              {lang === "fr" ? panel.title_fr : panel.title_en}
            </div>
          </div>
        </div>
      </div>

      {/* Equipment dots — colored strictly by type, not section */}
      <div className="p-3">
        {panel.dots.length === 0 ? (
          <div className="text-[10px] text-white/30 font-mono italic">
            {L("No tagged equipment", "Aucun équipement balisé")}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {panel.dots.map(({ tag, tk, eq }) => {
              const m = TYPE_META[tk];
              return (
                <button
                  key={tag}
                  onClick={() => onPickTag(tag)}
                  title={`${tag}${eq ? " — " + (lang === "fr" ? (eq.name_fr || eq.name) : (eq.name_en || eq.name)) : ""}`}
                  className={`group/dot flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-mono transition-all hover:scale-105
                    bg-white/5 hover:bg-white/10 ${m.border} ${m.text} ${!eq ? "opacity-60" : ""}`}
                >
                  <span className={`h-2 w-2 rounded-full ${m.dot} ring-2 ring-offset-0 ${m.ring}`} />
                  {tag.replace(/^X\d+-/, "")}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, mono, accent }: { label: string; value: string; mono?: boolean; accent?: string }) {
  return (
    <div className="flex justify-between items-baseline gap-2 border-b border-white/5 pb-1.5">
      <span className="text-[10px] uppercase tracking-wider text-white/40 font-mono">{label}</span>
      <span className={`text-xs ${mono ? "font-mono" : ""} ${accent ?? "text-white/90"} text-right`}>{value}</span>
    </div>
  );
}
