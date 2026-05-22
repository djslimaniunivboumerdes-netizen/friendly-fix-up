import type { ReactNode } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { META, EQUIPMENT, SECTIONS } from "@/data";
import { Factory, MapPin, Layers, Activity, Calendar, Gauge, Droplets, Wind } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import sonatrachLogo from "@/assets/sonatrach-logo.png";

export default function About() {
  const { t, lang } = useI18n();

  return (
    <div className="px-4 md:px-10 py-8 md:py-12 max-w-5xl mx-auto">
      <div className="text-[10px] uppercase tracking-widest text-accent font-mono mb-2">/ {t("about")}</div>

      <div className="flex items-start gap-5 mb-6 flex-wrap">
        <div className="bg-white rounded-lg p-3 shadow-card border border-border">
          <img src={sonatrachLogo} alt="Sonatrach" className="h-20 w-auto" />
        </div>
        <div className="flex-1 min-w-[260px]">
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-2">{META.project}</h1>
          <p className="text-base text-muted-foreground font-mono">SONATRACH · GL1Z Bethioua · Arzew, Algeria</p>
        </div>
      </div>

      <p className="text-lg md:text-xl text-foreground/80 font-light leading-relaxed mb-10 border-l-4 border-accent pl-5">
        {lang === "en"
          ? "GNL1Z is a flagship LNG liquefaction complex of Sonatrach, located in Bethioua (Arzew industrial zone), Algeria. The plant employs the Air Products AP-C3MR™ propane-precooled mixed-refrigerant process across six parallel trains, producing liquefied natural gas, liquefied petroleum gas (propane / butane), and natural gasoline."
          : "GNL1Z est un complexe de liquéfaction GNL phare de Sonatrach, situé à Bethioua (zone industrielle d'Arzew), Algérie. L'usine utilise le procédé Air Products AP-C3MR™ à pré-refroidissement propane et réfrigérant mixte sur six trains parallèles, produisant GNL, GPL (propane / butane) et essence naturelle."}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
        <Stat icon={MapPin} label={lang === "en" ? "Location" : "Emplacement"} value={META.location} />
        <Stat icon={Factory} label={t("process")} value={META.process} />
        <Stat icon={Layers} label={t("trains")} value={`${META.trains} × parallel`} />
        <Stat icon={Activity} label={t("equipCount")} value={EQUIPMENT.length} />
        <Stat icon={Calendar} label={lang === "en" ? "Commissioned" : "Mise en service"} value="1978" />
        <Stat icon={Gauge} label={lang === "en" ? "Capacity" : "Capacité"} value="~ 17.6 MTPA" />
        <Stat icon={Droplets} label={lang === "en" ? "LPG" : "GPL"} value="Propane / Butane" />
        <Stat icon={Wind} label={lang === "en" ? "Refrigerant" : "Réfrigérant"} value="C3 + MCR" />
      </div>

      <Section title={t("exec_summary")}>
        {lang === "en"
          ? "GNL1Z is one of the cornerstone LNG production assets of Sonatrach. The facility integrates feed gas decarbonation (MEA), molecular-sieve dehydration, mercury removal, cryogenic liquefaction, and fractionation of heavier hydrocarbons in a tightly coupled process. This asset management workspace consolidates the equipment master file, spare parts inventory (713 references), DCS instrument mapping, and the operational manual library into one searchable, bilingual interface."
          : "GNL1Z est l'un des actifs de production GNL stratégiques de Sonatrach. L'installation intègre la décarbonatation du gaz d'alimentation (MEA), la déshydratation par tamis moléculaires, l'élimination du mercure, la liquéfaction cryogénique et le fractionnement des hydrocarbures lourds dans un procédé étroitement couplé. Cet espace de gestion d'actifs consolide le fichier maître des équipements, l'inventaire des pièces de rechange (713 références), le mapping des instruments DCS et la bibliothèque des manuels opérationnels en une interface unique, recherchable et bilingue."}
      </Section>

      <Section title={lang === "en" ? "Process flow" : "Schéma du procédé"}>
        {lang === "en"
          ? "Feed natural gas from Hassi R'Mel arrives at the inlet scrubber, then passes through MEA decarbonation (X01) to remove CO₂ down to LNG-grade specification. Dehydration (X02) on molecular sieves drops moisture below 1 ppmv. The dry gas is cooled in propane chillers (X05) before entering the main cryogenic exchanger (MCR loop, X04 / X06) where it liquefies at approximately −162 °C. Heavier components are recovered and routed to the demethaniser, deethaniser, depropaniser and debutaniser columns (X07–X10) for LPG and natural gasoline production."
          : "Le gaz naturel d'alimentation provenant de Hassi R'Mel arrive au scrubber d'entrée puis passe par la décarbonatation MEA (X01) pour éliminer le CO₂ aux spécifications GNL. La déshydratation (X02) sur tamis moléculaires abaisse l'humidité sous 1 ppmv. Le gaz sec est refroidi dans les chillers propane (X05) avant d'entrer dans l'échangeur cryogénique principal (boucle MCR, X04 / X06) où il se liquéfie à environ −162 °C. Les composants plus lourds sont récupérés et envoyés vers les colonnes déméthaniseur, déethaniseur, dépropaniseur et débutaniseur (X07–X10) pour la production de GPL et essence naturelle."}
      </Section>

      <Section title={lang === "en" ? "Process sections covered" : "Sections procédé couvertes"}>
        <div className="flex flex-wrap gap-2 mt-2">
          {SECTIONS.map((s) => (
            <span key={s} className="px-3 py-1.5 rounded border border-border bg-secondary/60 text-sm font-mono">{s}</span>
          ))}
        </div>
      </Section>

      <Section title={lang === "en" ? "About this workspace" : "À propos de cet espace"}>
        {lang === "en"
          ? "Built as a personal asset-management cockpit for the GNL1Z plant: a single bilingual interface bringing together the equipment master, spare-parts catalogue, DCS screen library with AI-assisted instrument detection, and the operational manuals — designed to speed up daily reliability and maintenance work in the field."
          : "Conçu comme un cockpit personnel de gestion d'actifs pour l'usine GNL1Z : une interface bilingue unique réunissant le maître équipements, le catalogue PDR, la bibliothèque d'écrans DCS avec détection d'instruments assistée par IA, et les manuels opérationnels — pour accélérer le travail quotidien de fiabilité et de maintenance sur le terrain."}
      </Section>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: {
  icon: LucideIcon;
  label: string;
  value: string | number;
}) {
  return (
    <div className="border border-border rounded-lg bg-card p-4 hover:border-accent/30 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-accent" />
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{label}</span>
      </div>
      <div className="font-mono font-semibold text-sm break-words">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-display font-bold mb-3 border-l-4 border-accent pl-4">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
    </div>
  );
}
