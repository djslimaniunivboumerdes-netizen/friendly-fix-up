import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Fuse from "fuse.js";
import { format, parseISO } from "date-fns";
import { ArrowLeft, Copy, Check, Download, Wrench, Anchor, Snowflake, Package, Info, Search, FileText, Save, CalendarIcon, ExternalLink, QrCode, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { getEquipmentByTag, isShellAndTube, type SparePart, type Equipment } from "@/data";
import {
  predictWrench, predictToolKit, suggestShackle, safetyLoadKg,
  insulationRecommendation, exportToCsv, defaultBoltForType, recommendCrane,
} from "@/lib/industrial";
import { useI18n } from "@/contexts/I18nContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SvgQr } from "@/components/SvgQr";
import { ImageGallery } from "@/components/ImageGallery";
import { MaintenanceTimeline } from "@/components/MaintenanceTimeline";
import NotFound from "./NotFound";


export default function EquipmentDetail() {
  const { tag = "" } = useParams();
  const { t, lang } = useI18n();
  const eq = getEquipmentByTag(decodeURIComponent(tag));

  // ── All hooks must be called before any conditional return ──────────────
  const [qrOpen, setQrOpen] = useState(false);

  if (!eq) return <NotFound />;

  const boltSize = defaultBoltForType(eq.type.code);
  const wrench = predictWrench(boltSize);
  const tools = predictToolKit(boltSize);
  const shackle = suggestShackle(eq.technical.weight_kg);
  const safety = safetyLoadKg(eq.technical.weight_kg);
  const insulation = insulationRecommendation(eq.type.code, eq.technical.temperature_c);
  const crane = recommendCrane(eq.technical.weight_kg);

  // QR computed values (eq is guaranteed non-null here)
  const pageUrl = `${window.location.origin}/equipment/${encodeURIComponent(eq.tag)}`;

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-7xl mx-auto">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link to="/equipment"><ArrowLeft className="h-4 w-4 mr-1" /> {t("back")}</Link>
      </Button>

      <div className="relative overflow-hidden border border-border rounded-lg bg-gradient-industrial p-6 md:p-8 mb-6 text-white">
        <div className="absolute top-0 right-0 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute top-0 left-0 right-0 h-1 stripe-warning" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-white/60 mb-2">{eq.type.name}</div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight">{eq.tag}</h1>
                {/* QR button inline next to tag */}
                <button
                  onClick={() => setQrOpen(!qrOpen)}
                  title="QR Code"
                  className="shrink-0 h-9 w-9 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-colors"
                >
                  {qrOpen ? <X className="h-4 w-4 text-white" /> : <QrCode className="h-4 w-4 text-accent" />}
                </button>
              </div>
              <p className="text-white/80 mt-2 max-w-2xl">{eq.name}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-white/10 border border-white/20 text-white font-mono">{eq.unit}</Badge>
              <Badge className="bg-white/10 border border-white/20 text-white font-mono">{eq.section}</Badge>
              <Badge className="bg-accent text-accent-foreground font-mono">{eq.testing_status}</Badge>
            </div>
          </div>
          {/* QR panel — slides open below the tag line */}
          {qrOpen && (
            <div className="mt-5 pt-5 border-t border-white/20 flex flex-col sm:flex-row items-start gap-5">
              <div className="bg-white rounded-xl p-2 shadow-lg shrink-0">
                <SvgQr value={pageUrl} size={160} />
              </div>
              <div className="text-white/80 space-y-2 text-sm">
                <div className="font-semibold text-white">{eq.tag} — QR Code</div>
                <p className="text-xs text-white/60 leading-relaxed max-w-xs">
                  Scan with any phone camera to open this page. Print at ≥ 4×4 cm for reliable scanning.
                </p>
                <div className="font-mono text-[10px] text-white/40 break-all max-w-xs">{pageUrl}</div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => navigator.clipboard.writeText(pageUrl)}
                    className="inline-flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-1.5 transition-colors"
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy URL
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-1.5 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" /> Print
                  </button>
                </div>
              </div>
            </div>
          )}
          {eq.notes && <p className="mt-4 text-sm text-white/70 italic">{eq.notes}</p>}
        </div>
      </div>

      <Tabs defaultValue="tech" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto h-auto bg-secondary/60 p-1">
          <TabsTrigger value="tech" className="gap-1.5"><Info className="h-3.5 w-3.5" /> {t("techInfo")}</TabsTrigger>
          <TabsTrigger value="pdr" className="gap-1.5"><Package className="h-3.5 w-3.5" /> {t("pdr")}</TabsTrigger>
          <TabsTrigger value="tools" className="gap-1.5"><Wrench className="h-3.5 w-3.5" /> {t("toolPredictor")}</TabsTrigger>
          <TabsTrigger value="lifting" className="gap-1.5"><Anchor className="h-3.5 w-3.5" /> {t("lifting")}</TabsTrigger>
          <TabsTrigger value="insulation" className="gap-1.5"><Snowflake className="h-3.5 w-3.5" /> {t("insulation")}</TabsTrigger>
        </TabsList>

        <TabsContent value="tech" className="mt-5 space-y-5">
          <TechInfoTab eq={eq} />
        </TabsContent>

        <TabsContent value="pdr" className="mt-5"><PdrTab parts={eq.spare_parts.items ?? []} tag={eq.tag} /></TabsContent>

        <TabsContent value="tools" className="mt-5">
          <ToolsTab boltSize={boltSize} wrench={wrench} tools={tools} liftingMethod={eq.maintenance.lifting_method} extraTools={eq.maintenance.tools} />
        </TabsContent>

        <TabsContent value="lifting" className="mt-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <BigStat label={t("weight")} value={`${eq.technical.weight_kg} kg`} />
            <BigStat label={t("safetyLoad")} value={`${safety} kg`} accent />
            <BigStat label={t("liftingMethod")} value={eq.maintenance.lifting_method.replace(/_/g, " ")} />
          </div>
          <div className="mt-5 border border-border rounded-lg bg-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <Anchor className="h-4 w-4 text-accent" />
              <h3 className="font-display font-semibold">{t("shackle")}</h3>
            </div>
            {shackle ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Size</div>
                  <div className="text-2xl font-display font-bold text-accent">{shackle.size}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">WLL</div>
                  <div className="text-2xl font-display font-bold font-mono">{shackle.wll_t} t</div>
                </div>
                <div className="col-span-2 text-xs text-muted-foreground border-t border-border pt-3">
                  Calculated from {eq.technical.weight_kg} kg × 1.5 safety factor = {(safety / 1000).toFixed(2)} t. Crosby G-209 reference.
                </div>
              </div>
            ) : (
              <EmptyState message="No mass recorded — shackle cannot be sized." />
            )}
          </div>

          <div className="mt-5 border border-border rounded-lg bg-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="h-4 w-4 text-accent" />
              <h3 className="font-display font-semibold">Crane recommendation / Grue recommandée</h3>
            </div>
            {crane ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Capacity</div>
                  <div className="text-2xl font-display font-bold text-accent">{crane.capacity_t}{crane.capacity_t >= 100 ? "+" : ""} T</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Type</div>
                  <div className="text-base font-display font-semibold">{crane.label}</div>
                </div>
                <div className="col-span-2 text-xs text-muted-foreground border-t border-border pt-3">
                  {crane.rationale}
                </div>
                <div className="col-span-2 text-[11px] text-muted-foreground font-mono">
                  GNL1Z fleet: 12 T · 24 T · 35 T · 54 T · 74 T · 100+ T
                </div>
              </div>
            ) : (
              <EmptyState message="No mass recorded — crane cannot be sized." />
            )}
          </div>
        </TabsContent>

        <TabsContent value="insulation" className="mt-5">
          <div className="border border-border rounded-lg bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Snowflake className="h-4 w-4 text-accent" />
              <h3 className="font-display font-semibold">{t("insulationReq")}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <BigStat label="Status" value={insulation.required ? (lang === "en" ? "Required" : "Requis") : (lang === "en" ? "Not required" : "Non requis")} accent={insulation.required} />
              <BigStat label="Thickness" value={insulation.thickness_mm ? `${insulation.thickness_mm} mm` : "—"} />
              <BigStat label="Material" value={insulation.material} />
            </div>
            <div className="mt-4 text-sm text-muted-foreground border-t border-border pt-4">
              <span className="font-semibold text-foreground">Rationale: </span>{insulation.rationale}
            </div>
            <div className="mt-2 text-xs text-muted-foreground font-mono">
              Equipment type: {eq.type.code} ({eq.type.name})
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-end">
        <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
          <Link to={`/equipment/${encodeURIComponent(eq.tag)}/log`}>
            <ShieldCheck className="h-4 w-4" /> Log maintenance test
          </Link>
        </Button>
      </div>

      <div className="mt-6 space-y-5">
        <ImageGallery tag={eq.tag} />
        <MaintenanceTimeline tag={eq.tag} />
      </div>
    </div>
  );
}

function TechInfoTab({ eq }: { eq: Equipment }) {
  const { t, lang } = useI18n();
  const tp = eq.technical.test_pressure;
  const isExch = isShellAndTube(eq);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <Field label={t("serial")} value={eq.technical.serial_no || "—"} mono />
        <Field label={t("testType")} value={eq.testing_status} />
        <Field label={t("pressure")} value={eq.technical.pressure_bar || "—"} mono accent />
        <Field label={t("volume")} value={eq.technical.volume_m3 || "—"} mono />
        <Field label={t("weight")} value={eq.technical.weight_kg} mono accent />
        {eq.technical.temperature_c != null && <Field label="Temp (°C)" value={eq.technical.temperature_c} mono />}
      </div>

      {/* Test Pressure block */}
      <div className="border border-border rounded-lg bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Info className="h-4 w-4 text-accent" />
          <h3 className="font-display font-semibold">{t("testPressure")}</h3>
          {isExch && <Badge variant="outline" className="font-mono text-[10px] ml-1">{lang === "en" ? "Shell & Tube" : "Calandre & Faisceau"}</Badge>}
        </div>
        {isExch ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <PressureCell label={`${t("designPressure")} — ${t("shellSide")}`} value={tp?.shell_design_bar} />
            <PressureCell label={`${t("designPressure")} — ${t("tubeSide")}`} value={tp?.tube_design_bar} />
            <PressureCell label={`${t("testPressure")} — ${t("shellSide")}`} value={tp?.shell_test_bar} accent />
            <PressureCell label={`${t("testPressure")} — ${t("tubeSide")} / ${t("faciauxSide")}`} value={tp?.tube_test_bar} accent />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <PressureCell label={t("designPressure")} value={tp?.design_bar} />
            <PressureCell label={t("testPressure")} value={tp?.test_bar} accent />
          </div>
        )}
        <div className="text-xs text-muted-foreground mt-3 border-t border-border pt-3">
          {lang === "en"
            ? "Test pressures derived per ASME VIII (1.43× MAWP design × 1.3 hydrotest)."
            : "Pressions d'épreuve calculées selon ASME VIII (1.43× pression de calcul × 1.3 hydrotest)."}
        </div>
      </div>

      {/* P&ID button */}
      <div className="border border-border rounded-lg bg-card p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-accent" />
            <h3 className="font-display font-semibold">P&ID</h3>
          </div>
          {eq.pid_drive_id ? (
            <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
              <a href={`https://drive.google.com/file/d/${eq.pid_drive_id}/preview`} target="_blank" rel="noopener noreferrer">
                <FileText className="h-4 w-4" /> {t("openPid")}
                <ExternalLink className="h-3.5 w-3.5 ml-1" />
              </a>
            </Button>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">{t("noPid")}</Badge>
          )}
        </div>
      </div>

      {/* Editable test dates */}
      <TestDatesEditor tag={eq.tag} initialLast={eq.maintenance.last_tested} initialNext={eq.maintenance.next_test_due} />
    </>
  );
}

function PressureCell({ label, value, accent }: { label: string; value: number | null | undefined; accent?: boolean }) {
  return (
    <div className="border border-border rounded bg-secondary/40 p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 leading-tight">{label}</div>
      <div className={`font-mono font-bold ${accent ? "text-accent text-xl" : "text-foreground text-lg"}`}>
        {value != null ? `${value} bar` : "—"}
      </div>
    </div>
  );
}

function TestDatesEditor({ tag, initialLast, initialNext }: { tag: string; initialLast: string; initialNext: string }) {
  const { t, lang } = useI18n();
  const [last, setLast] = useState<Date | undefined>(initialLast ? safeParse(initialLast) : undefined);
  const [next, setNext] = useState<Date | undefined>(initialNext ? safeParse(initialNext) : undefined);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("equipment_test_dates")
        .select("last_tested, next_test_due")
        .eq("tag", tag)
        .maybeSingle();
      if (active && data) {
        if (data.last_tested) setLast(parseISO(data.last_tested));
        if (data.next_test_due) setNext(parseISO(data.next_test_due));
      }
      if (active) setLoaded(true);
    })();
    return () => { active = false; };
  }, [tag]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("equipment_test_dates").upsert({
      tag,
      last_tested: last ? format(last, "yyyy-MM-dd") : null,
      next_test_due: next ? format(next, "yyyy-MM-dd") : null,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) {
      toast({ title: lang === "en" ? "Save failed" : "Échec d'enregistrement", description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("saved") });
    }
  };

  return (
    <div className="border border-border rounded-lg bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <CalendarIcon className="h-4 w-4 text-accent" />
        <h3 className="font-display font-semibold">{t("lastTested")} / {t("nextDue")}</h3>
        {!loaded && <span className="text-xs text-muted-foreground ml-2">…</span>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
        <DatePickerField label={t("lastTested")} date={last} onChange={setLast} />
        <DatePickerField label={t("nextDue")} date={next} onChange={setNext} />
        <Button onClick={save} disabled={saving} className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 h-11">
          <Save className="h-4 w-4" /> {saving ? "…" : t("saveDates")}
        </Button>
      </div>
    </div>
  );
}

function DatePickerField({ label, date, onChange }: { label: string; date: Date | undefined; onChange: (d: Date | undefined) => void }) {
  const { t } = useI18n();
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">{label}</div>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-full justify-start text-left font-mono h-11", !date && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "yyyy-MM-dd") : t("pickDate")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={date} onSelect={onChange} initialFocus className={cn("p-3 pointer-events-auto")} />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function safeParse(s: string): Date | undefined {
  try { return parseISO(s); } catch { return undefined; }
}

function Field({ label, value, mono, accent }: { label: string; value: string | number; mono?: boolean; accent?: boolean }) {
  return (
    <div className="border border-border rounded-lg bg-card p-4 shadow-card">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">{label}</div>
      <div className={`text-lg font-semibold ${mono ? "font-mono" : "font-display"} ${accent ? "text-accent" : "text-foreground"}`}>
        {value || "—"}
      </div>
    </div>
  );
}

function BigStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`border rounded-lg p-5 ${accent ? "border-accent/40 bg-accent/5" : "border-border bg-card"}`}>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{label}</div>
      <div className={`text-2xl font-display font-bold ${accent ? "text-accent" : "text-foreground"}`}>{value}</div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="border border-dashed border-border rounded-lg p-10 text-center text-muted-foreground bg-card/50">
      {message}
    </div>
  );
}

function PdrTab({ parts, tag }: { parts: SparePart[]; tag: string }) {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const fuse = useMemo(() => new Fuse(parts, { threshold: 0.35, keys: ["code", "description", "category", "reference", "material"] }), [parts]);
  const list = q.trim() ? fuse.search(q).map((r) => r.item) : parts;

  if (!parts.length) return <EmptyState message="No spare parts recorded for this equipment." />;

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} className="pl-9 h-10" />
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => exportToCsv(`${tag}_parts.csv`, list.map((p) => ({
            code: p.code, description: p.description, category: p.category ?? "", qty: p.qty_installed,
            location: p.stock_location ?? "", material: p.material ?? "", size: p.size_nominal ?? "",
          })))}
        >
          <Download className="h-4 w-4" /> {t("exportCsv")}
        </Button>
      </div>

      <div className="border border-border rounded-lg overflow-hidden bg-card shadow-card">
        <div className="hidden md:grid grid-cols-[120px_1fr_140px_60px_100px] bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 font-semibold">
          <div>{t("code")}</div><div>{t("description")}</div><div>{t("category")}</div><div className="text-right">{t("qty")}</div><div>{t("location")}</div>
        </div>
        <div className="divide-y divide-border">
          {list.map((p, i) => (
            <div key={`${p.code}-${i}`} className="grid grid-cols-1 md:grid-cols-[120px_1fr_140px_60px_100px] gap-1 md:gap-0 px-4 py-3 text-sm hover:bg-secondary/30">
              <div className="font-mono text-xs text-accent font-semibold">{p.code}</div>
              <div className="text-sm">{p.description}</div>
              <div className="text-xs text-muted-foreground">{p.category || "—"}</div>
              <div className="md:text-right font-mono">{p.qty_installed}</div>
              <div className="text-xs font-mono text-muted-foreground">{p.stock_location || "—"}</div>
            </div>
          ))}
          {list.length === 0 && <div className="px-4 py-10 text-center text-muted-foreground">{t("noResults")}</div>}
        </div>
      </div>
    </div>
  );
}

function ToolsTab({ boltSize, wrench, tools, liftingMethod, extraTools }: { boltSize: string; wrench: string | null; tools: string[]; liftingMethod: string; extraTools: string[] }) {
  const { t, lang } = useI18n();
  const [copied, setCopied] = useState(false);
  const allTools = [...tools, ...extraTools];

  const copy = async () => {
    await navigator.clipboard.writeText(allTools.map((tool, i) => `${i + 1}. ${tool}`).join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BigStat label={`${t("bolt")} (${lang === "en" ? "default" : "défaut"})`} value={boltSize} />
        <BigStat label="Wrench / Clé" value={wrench ?? "—"} accent={!!wrench} />
        <BigStat label={t("liftingMethod")} value={liftingMethod.replace(/_/g, " ")} />
      </div>

      <div className="border border-border rounded-lg bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-accent" />
            <h3 className="font-display font-semibold">{t("recommendedTools")}</h3>
          </div>
          <Button onClick={copy} variant="outline" size="sm" className="gap-2">
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            {copied ? t("copied") : t("copyToolList")}
          </Button>
        </div>
        <ol className="space-y-2">
          {allTools.map((tool, i) => (
            <li key={i} className="flex items-start gap-3 text-sm border-b border-border last:border-0 pb-2 last:pb-0">
              <span className="font-mono text-xs text-accent w-6 shrink-0">{String(i + 1).padStart(2, "0")}</span>
              <span>{tool}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
                                                                                                 }
