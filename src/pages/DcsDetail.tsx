import { useEffect, useState, useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Cpu, ExternalLink, Sparkles, RefreshCw, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/contexts/I18nContext";
import { getDcsPanel, driveViewUrl } from "@/data/dcs_panels";
import { getEquipmentByTag } from "@/data";
import { getTagsForPanel } from "@/data/dcs_tags";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { DriveImg } from "@/components/DriveImg";
import NotFound from "./NotFound";

export default function DcsDetail() {
  const { id = "" } = useParams();
  const [searchParams] = useSearchParams();
  const highlightTag = searchParams.get("tag")?.toUpperCase() ?? null;
  const { t, lang } = useI18n();
  const panel = getDcsPanel(id);

  const [tags, setTags] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [imgErr, setImgErr] = useState(false);

  useEffect(() => {
    if (!panel) return;
    let active = true;
    const cached = getTagsForPanel(panel.id);
    if (cached.length) setTags(cached);
    (async () => {
      const { data } = await supabase
        .from("dcs_detected_instruments")
        .select("tags")
        .eq("panel_id", panel.id)
        .maybeSingle();
      if (active && Array.isArray(data?.tags) && (data!.tags as string[]).length) {
        setTags(data!.tags as string[]);
      } else if (active && !cached.length) {
        setTags([]);
      }
    })();
    return () => { active = false; };
  }, [panel]);

  if (!panel) return <NotFound />;

  const detect = async (force = false) => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("detect-dcs-instruments", {
      body: { panel_id: panel.id, image_url: driveImageUrl(panel.drive_id), force },
    });
    setLoading(false);
    if (error) {
      toast({ title: lang === "en" ? "Detection failed" : "Échec de détection", description: error.message, variant: "destructive" });
      return;
    }
    if ((data as { error?: string })?.error) {
      toast({ title: lang === "en" ? "Detection failed" : "Échec de détection", description: (data as { error: string }).error, variant: "destructive" });
      return;
    }
    const t = (data as { tags?: string[] }).tags ?? [];
    setTags(t);
    toast({ title: lang === "en" ? `Found ${t.length} instrument tag(s)` : `${t.length} tag(s) détecté(s)` });
  };

  /* FIX: Merge AI-detected tags with static related_tags so all related equipment shows up */
  const related = useMemo(() => {
    const allTags = new Set([
      ...(panel.related_tags ?? []),
      ...(tags ?? []),
    ]);
    return Array.from(allTags)
      .map((tag) => getEquipmentByTag(tag))
      .filter((e): e is NonNullable<typeof e> => !!e);
  }, [panel, tags]);

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-7xl mx-auto">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link to="/dcs"><ArrowLeft className="h-4 w-4 mr-1" /> {t("back")}</Link>
      </Button>

      <div className="relative overflow-hidden border border-border rounded-lg bg-gradient-industrial p-6 md:p-8 mb-6 text-white">
        <div className="absolute top-0 right-0 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute top-0 left-0 right-0 h-1 stripe-warning" />
        <div className="relative">
          <div className="flex items-center gap-2 text-xs text-white/60 font-mono uppercase tracking-widest mb-2">
            <Cpu className="h-3.5 w-3.5" /> {t("panelDetail")}
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight">
            {lang === "en" ? panel.title_en : panel.title_fr}
          </h1>
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge className="bg-white/10 border border-white/20 text-white font-mono">{panel.section}</Badge>
            {panel.unit && <Badge className="bg-white/10 border border-white/20 text-white font-mono">{panel.unit}</Badge>}
          </div>
          {(panel.description_en || panel.description_fr) && (
            <p className="mt-4 text-sm text-white/80 max-w-3xl">
              {lang === "en" ? panel.description_en : panel.description_fr}
            </p>
          )}
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-hidden bg-card mb-6 shadow-card">
        <div className="bg-secondary/60 px-4 py-2 flex items-center justify-between">
          <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono">DCS Screen</span>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <a href={driveViewUrl(panel.drive_id)} target="_blank" rel="noopener noreferrer">
              {t("openInDrive")} <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
        <div className="bg-black flex items-center justify-center min-h-[240px]">
          {imgErr ? (
            <div className="flex flex-col items-center gap-3 text-white/30 py-16">
              <Cpu className="h-12 w-12" />
              <span className="text-xs font-mono uppercase tracking-widest">DCS Screen Unavailable</span>
              <a href={driveViewUrl(panel.drive_id)} target="_blank" rel="noopener noreferrer"
                 className="text-xs text-accent/70 hover:text-accent underline font-mono">
                Open in Google Drive ↗
              </a>
            </div>
          ) : (
            <img
              src={driveImageUrl(panel.drive_id)}
              alt={lang === "en" ? panel.title_en : panel.title_fr}
              className="w-full h-auto max-h-[72vh] object-contain"
              onError={() => setImgErr(true)}
            />
          )}
        </div>
      </div>

      <div className="border border-border rounded-lg bg-card p-5 mb-6">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-accent" />
            <h2 className="font-display font-semibold text-sm uppercase tracking-wider">
              {lang === "en" ? "Detected Instrument Tags" : "Tags d'instruments détectés"}
            </h2>
            {tags && <Badge variant="outline" className="font-mono">{tags.length}</Badge>}
          </div>
          <div className="flex gap-2">
            {(!tags || tags.length === 0) && (
              <Button onClick={() => detect(false)} disabled={loading} size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
                <Sparkles className="h-4 w-4" /> {loading ? "…" : (lang === "en" ? "Detect with AI" : "Détecter avec IA")}
              </Button>
            )}
            {tags && tags.length > 0 && (
              <Button onClick={() => detect(true)} disabled={loading} size="sm" variant="outline" className="gap-2">
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> {lang === "en" ? "Re-scan" : "Re-scanner"}
              </Button>
            )}
          </div>
        </div>
        {tags === null ? (
          <p className="text-sm text-muted-foreground">…</p>
        ) : tags.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {lang === "en"
              ? "No tags detected yet. Click 'Detect with AI' to scan this DCS screen with vision AI."
              : "Aucun tag détecté. Cliquez 'Détecter avec IA' pour scanner cet écran DCS."}
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tg) => {
              const isHi = highlightTag && tg.toUpperCase() === highlightTag;
              return (
                <span
                  key={tg}
                  className={`px-2 py-1 rounded border font-mono text-xs ${
                    isHi
                      ? "border-accent bg-accent text-accent-foreground ring-2 ring-accent/40 animate-pulse"
                      : "border-accent/30 bg-accent/10 text-accent"
                  }`}
                >
                  {tg}
                </span>
              );
            })}
          </div>
        )}
      </div>

      <div className="border border-border rounded-lg bg-card p-5 mb-6">
        <h2 className="font-display font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">
          {t("related")}
        </h2>
        {related.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {lang === "en" ? "No equipment linked yet to this panel." : "Aucun équipement libé à ce panneau."}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {related.map((eq) => (
              <Link
                key={eq.tag}
                to={`/equipment/${encodeURIComponent(eq.tag)}`}
                className="group flex items-center justify-between border border-border rounded p-3 hover:border-accent/50 hover:bow-secondary/30 transition-all"
              >
                <div>
                  <div className="font-mono text-xs text-accent font-semibold">{eq.tag}</div>
                  <div className="text-sm font-medium line-clamp-1">{ eq.name }</div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
        )}
      </div>
      <Button asChild variant="ghost" size="sm">
        <Link to="/dcs"><ArrowLeft className="h-4 w-4 mr-1" /> {t("back")}</Link>
      </Button>
    </div>
  );
                  }
