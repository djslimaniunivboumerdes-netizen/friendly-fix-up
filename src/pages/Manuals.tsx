import { useState } from "react";
import { BookOpen, FileText, ExternalLink, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/contexts/I18nContext";
import { MANUALS, driveDocViewUrl } from "@/data/manuals";

const categoryColors: Record<string, string> = {
  Process: "border-accent/40 text-accent",
  Refrigeration: "border-primary/40 text-primary",
  Storage: "border-success/40 text-success",
  Utilities: "border-muted-foreground/30 text-muted-foreground",
  Safety: "border-destructive/40 text-destructive",
  Operations: "border-accent/40 text-accent",
  Treatment: "border-warning/40 text-warning-foreground",
  Fractionation: "border-primary/40 text-primary",
};

export default function Manuals() {
  const { t, lang } = useI18n();
  const [q, setQ] = useState("");
  const list = MANUALS.filter((m) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return m.id.toLowerCase().includes(s)
      || m.title_en.toLowerCase().includes(s)
      || m.title_fr.toLowerCase().includes(s)
      || m.category.toLowerCase().includes(s);
  });

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-7xl mx-auto">
      <div className="text-[10px] uppercase tracking-widest text-accent font-mono mb-1">/ {t("manuals")}</div>
      <div className="flex items-center gap-3 mb-2">
        <BookOpen className="h-7 w-7 text-accent" />
        <h1 className="text-3xl md:text-4xl font-display font-bold">{t("manuals")}</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        {MANUALS.length} {lang === "en" ? "documents" : "documents"} · S01 → S15
      </p>

      <div className="relative mb-5 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} className="pl-9 h-11" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {list.map((m) => (
          <a
            key={m.id}
            href={driveDocViewUrl(m.drive_id)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-left group border border-border rounded-lg bg-card p-5 hover:border-accent/50 hover:shadow-card transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <FileText className="h-5 w-5 text-accent" />
              <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
            </div>
            <div className="font-mono text-xs font-bold text-accent mb-1">{m.id}</div>
            <div className="font-display font-semibold leading-tight mb-3">
              {lang === "en" ? m.title_en : m.title_fr}
            </div>
            <Badge variant="outline" className={`font-mono text-[10px] ${categoryColors[m.category] ?? ""}`}>
              {m.category}
            </Badge>
          </a>
        ))}
        {list.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-12">{t("noResults")}</div>
        )}
      </div>
    </div>
  );
}
