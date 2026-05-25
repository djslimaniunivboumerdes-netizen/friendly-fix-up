// DCS panels — using Supabase Storage instead of Google Drive
// Public URL: https://gdkqetzkhgllwbpmqmux.supabase.co/storage/v1/object/public/equipment-images/dcs/[filename]

export interface DcsPanel {
  id: string;
  title_en: string;
  title_fr: string;
  section: string;
  unit?: string;
  storage_path: string; // path in Supabase Storage bucket
  related_tags?: string[];
  description_en?: string;
  description_fr?: string;
}

export const DCS_PANELS: DcsPanel[] = [
  { id: "general-train", title_en: "General Train Overview", title_fr: "Vue Générale Train", section: "Process", unit: "Liquefaction", storage_path: "dcs/general-train.jpg", related_tags: ["X05-E-05.11", "X05-E-05.12"], description_en: "Master overview of the LNG production train including feed, treatment, refrigeration and liquefaction stages.", description_fr: "Vue maîtresse du train de production GNL incluant alimentation, traitement, réfrigération et liquéfaction." },
  { id: "liquefaction-1", title_en: "Liquefaction Section 1", title_fr: "Liquéfaction Section 1", section: "Liquefaction", unit: "X06", storage_path: "dcs/liquefaction-1.jpg", related_tags: ["X06-E-05.30"] },
  { id: "liquefaction-2", title_en: "Liquefaction Section 2", title_fr: "Liquéfaction Section 2", section: "Liquefaction", unit: "X06", storage_path: "dcs/liquefaction-2.jpg" },
  { id: "mcr-1", title_en: "MCR Refrigeration 1", title_fr: "Réfrigération MCR 1", section: "Refrigeration", unit: "X04", storage_path: "dcs/mcr-1.jpg", related_tags: ["X04-G-07.85", "X04-G-07.90", "X04-G-07.91"] },
  { id: "mcr-2", title_en: "MCR Refrigeration 2", title_fr: "Réfrigération MCR 2", section: "Refrigeration", unit: "X04", storage_path: "dcs/mcr-2.jpg", related_tags: ["X04-E-05.21", "X04-E-05.22", "X04-E-05.23", "X04-E-05.24"] },
  { id: "mcr-3", title_en: "MCR Refrigeration 3", title_fr: "Réfrigération MCR 3", section: "Refrigeration", unit: "X04", storage_path: "dcs/mcr-3.jpg", related_tags: ["X04-E-05.25A", "X04-E-05.25B", "X04-E-05.26A", "X04-E-05.26B", "X04-E-05.40"] },
  { id: "propane-1", title_en: "Propane Loop 1", title_fr: "Boucle Propane 1", section: "Refrigeration", unit: "X05", storage_path: "dcs/propane-1.jpg", related_tags: ["X05-G-07.88", "X05-G-07.89"] },
  { id: "propane-2", title_en: "Propane Loop 2", title_fr: "Boucle Propane 2", section: "Refrigeration", unit: "X05", storage_path: "dcs/propane-2.jpg", related_tags: ["X04-G-07.85", "X04-G-07.90", "X04-G-07.91", "X04-F-07.11"] },
  { id: "propane-3", title_en: "Propane Loop 3", title_fr: "Boucle Propane 3", section: "Refrigeration", unit: "X05", storage_path: "dcs/propane-3.jpg", related_tags: ["X03-G-07.86", "X03-F-05.16", "X03-E-05.13", "X03-E-05.14A", "X03-E-05.14B"] },
  { id: "decarbonation-01", title_en: "Decarbonation MEA 1", title_fr: "Décarbonatation MEA 1", section: "Treatment", unit: "X01", storage_path: "dcs/decarbonation-01.jpg", related_tags: ["X01-F-501", "X01-F-502", "X01-E-501", "X01-E-502", "X01-G-502", "X01-G-507"] },
  { id: "decarbonation-2", title_en: "Decarbonation MEA 2", title_fr: "Décarbonatation MEA 2", section: "Treatment", unit: "X01", storage_path: "dcs/decarbonation-2.jpg", related_tags: ["X01-E-504", "X01-E-505", "X01-E-506", "X01-P-501", "X01-P-502"] },
  { id: "dehydration-1", title_en: "Dehydration 1", title_fr: "Déshydratation 1", section: "Treatment", unit: "X02", storage_path: "dcs/dehydration-1.jpg", related_tags: ["X02-R-03.12", "X02-G-07.87", "X02-G-03.14"] },
  { id: "dehydration-2", title_en: "Dehydration 2", title_fr: "Déshydratation 2", section: "Treatment", unit: "X02", storage_path: "dcs/dehydration-2.jpg", related_tags: ["X02-E-03.15", "X02-E-03.16", "X02-P-03.14A", "X02-P-03.14B"] },
  { id: "dehydration-3", title_en: "Dehydration 3", title_fr: "Déshydratation 3", section: "Treatment", unit: "X02", storage_path: "dcs/dehydration-3.jpg", related_tags: ["X02-E-15.50", "X02-E-15.51", "X02-P-03.12A", "X02-P-03.12B"] },
  { id: "scrubber", title_en: "Inlet Scrubber", title_fr: "Scrubber d'entrée", section: "Treatment", unit: "X01", storage_path: "dcs/scrubber.jpg", related_tags: ["X01-G-502", "X01-P-501", "X01-P-502", "X01-E-503A", "X01-E-503B"] },
  { id: "demethanisation", title_en: "Demethaniser", title_fr: "Déméthaniseur", section: "Fractionation", unit: "X07", storage_path: "dcs/demethanisation.jpg", related_tags: ["X07-F-07.21"] },
  { id: "demethanisation-2", title_en: "Demethaniser 2", title_fr: "Déméthaniseur 2", section: "Fractionation", unit: "X07", storage_path: "dcs/demethanisation-2.jpg", related_tags: ["X07-E-07.22", "X07-E-07.23", "X07-E-07.30", "X07-G-07.24"] },
  { id: "deethanisation", title_en: "Deethaniser", title_fr: "Dééthaniseur", section: "Fractionation", unit: "X08", storage_path: "dcs/deethanisation.jpg", related_tags: ["X08-F-07.31"] },
  { id: "depropanisation", title_en: "Depropaniser", title_fr: "Dépropaniseur", section: "Fractionation", unit: "X09", storage_path: "dcs/depropanisation.jpg", related_tags: ["X09-F-07.41"] },
  { id: "debutanisation", title_en: "Debutaniser", title_fr: "Débutaniseur", section: "Fractionation", unit: "X10", storage_path: "dcs/debutanisation.jpg", related_tags: ["X10-F-07.51"] },
  { id: "fuel-gas", title_en: "Fuel Gas System", title_fr: "Système Fuel Gas", section: "Utilities", storage_path: "dcs/fuel-gas.jpg" },
  { id: "fuel-gas-1", title_en: "Fuel Gas System 2", title_fr: "Système Fuel Gas 2", section: "Utilities", storage_path: "dcs/fuel-gas-1.jpg" },
  { id: "fuel-gas-oil-console", title_en: "Fuel Gas / Oil Console", title_fr: "Console Fuel Gas / Huile", section: "Utilities", storage_path: "dcs/fuel-gas-oil-console.jpg" },
  { id: "echangeur-recup-gpl", title_en: "GPL Recovery Exchanger", title_fr: "Échangeur récup. GPL", section: "Recovery", storage_path: "dcs/echangeur-recup-gpl.jpg" },
  { id: "retour-condensat", title_en: "Condensate Return Train", title_fr: "Retour Condensat Train", section: "Process", storage_path: "dcs/retour-condensat.jpg" },
  { id: "op-data-t100", title_en: "Operation Data T100", title_fr: "Données opération T100", section: "Operating Data", storage_path: "dcs/op-data-t100.jpg" },
  { id: "op-data-t200", title_en: "Operation Data T200", title_fr: "Données opération T200", section: "Operating Data", storage_path: "dcs/op-data-t200.jpg" },
  { id: "op-data-t300", title_en: "Operation Data T300", title_fr: "Données opération T300", section: "Operating Data", storage_path: "dcs/op-data-t300.jpg" },
  { id: "op-data-t500", title_en: "Operation Data T500", title_fr: "Données opération T500", section: "Operating Data", storage_path: "dcs/op-data-t500.jpg" },
  { id: "op-data-t600", title_en: "Operation Data T600", title_fr: "Données opération T600", section: "Operating Data", storage_path: "dcs/op-data-t600.jpg" },
];

export const DCS_SECTIONS = Array.from(new Set(DCS_PANELS.map((p) => p.section))).sort();

export function getDcsPanel(id: string) {
  return DCS_PANELS.find((p) => p.id === id);
}

// Supabase Storage public URL
// Format: https://[project_id].supabase.co/storage/v1/object/public/[bucket]/[path]
const SUPABASE_URL = "https://gdkqetzkhgllwbpmqmux.supabase.co";
const BUCKET_NAME = "equipment-images";

export function dcsImageUrl(storage_path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${storage_path}`;
}

export function dcsImageViewUrl(storage_path: string): string {
  // For viewing in Supabase dashboard or direct download
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${storage_path}`;
}

// Fallback chain for resilience (all point to same Supabase URL, but with different transforms if needed)
export function dcsImageFallbacks(storage_path: string): string[] {
  return [
    dcsImageUrl(storage_path),
    // Could add transformed versions here if using Supabase Image Transformations
    // `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${storage_path}?width=800`,
  ];
}
