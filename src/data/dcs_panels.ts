// DCS panels — real Sonatrach GNL1Z DCS screenshots stored on Drive.
// Each card opens a detail page at /dcs/:id

export interface DcsPanel {
  id: string;
  title_en: string;
  title_fr: string;
  section: string;
  unit?: string;
  drive_id: string;
  related_tags?: string[];
  description_en?: string;
  description_fr?: string;
}

export const DCS_PANELS: DcsPanel[] = [
  { id: "general-train", title_en: "General Train Overview", title_fr: "Vue Générale Train", section: "Process", unit: "Liquefaction", drive_id: "1iQjxrGDQmNsaBiEYa-p4Eka6o91jc4V3", related_tags: ["X05-E-05.11", "X05-E-05.12"], description_en: "Master overview of the LNG production train including feed, treatment, refrigeration and liquefaction stages.", description_fr: "Vue maîtresse du train de production GNL incluant alimentation, traitement, réfrigération et liquéfaction." },
  { id: "liquefaction-1", title_en: "Liquefaction Section 1", title_fr: "Liquéfaction Section 1", section: "Liquefaction", unit: "X06", drive_id: "1S5Kz4g-u_JmUqedZUwhMZ3AFUcZsq5Wb", related_tags: ["X06-E-05.30"] },
  { id: "liquefaction-2", title_en: "Liquefaction Section 2", title_fr: "Liquéfaction Section 2", section: "Liquefaction", unit: "X06", drive_id: "1gqGGdfzg4nP3cAHvatgpHkbvmeLIS66s" },
  { id: "mcr-1", title_en: "MCR Refrigeration 1", title_fr: "Réfrigération MCR 1", section: "Refrigeration", unit: "X04", drive_id: "1MqVEqPzgwnFnAWixcB9dQJYqsBBoMezw", related_tags: ["X04-G-07.85", "X04-G-07.90", "X04-G-07.91"] },
  { id: "mcr-2", title_en: "MCR Refrigeration 2", title_fr: "Réfrigération MCR 2", section: "Refrigeration", unit: "X04", drive_id: "16-jYR0A_cEiTrIMyj7FxWY3bgM7-G3r2" },
  { id: "mcr-3", title_en: "MCR Refrigeration 3", title_fr: "Réfrigération MCR 3", section: "Refrigeration", unit: "X04", drive_id: "1L70xNsbAwdVEtxuSSu-26qc8LNMlb8da" },
  { id: "propane-1", title_en: "Propane Loop 1", title_fr: "Boucle Propane 1", section: "Refrigeration", unit: "X05", drive_id: "1VDBIAuIPFMpJciRysH3mHQgI4ekXAUcL", related_tags: ["X05-G-07.88", "X05-G-07.89"] },
  { id: "propane-2", title_en: "Propane Loop 2", title_fr: "Boucle Propane 2", section: "Refrigeration", unit: "X05", drive_id: "1Mfn71tgKTWKDes60E9K9gIKHNp8fWnko" },
  { id: "propane-3", title_en: "Propane Loop 3", title_fr: "Boucle Propane 3", section: "Refrigeration", unit: "X05", drive_id: "1llBWUC6JRbuyX-NaH4g5UueDMI0JmhPh" },
  { id: "decarbonation-01", title_en: "Decarbonation MEA 1", title_fr: "Décarbonatation MEA 1", section: "Treatment", unit: "X01", drive_id: "1yGjd33Gw6lkS8wEzbYWu4AgZBCsAxdc1", related_tags: ["X01-F-05.01", "X01-F-05.02", "X01-E-501", "X01-E-502"] },
  { id: "decarbonation-2", title_en: "Decarbonation MEA 2", title_fr: "Décarbonatation MEA 2", section: "Treatment", unit: "X01", drive_id: "1pf4_y7xQNPidT4UO8OTOZ2rj9lTzupbj" },
  { id: "dehydration-1", title_en: "Dehydration 1", title_fr: "Déshydratation 1", section: "Treatment", unit: "X02", drive_id: "1IYkhzaRS5hIGR-GYA8zAqjO-AHJSMwMt" },
  { id: "dehydration-2", title_en: "Dehydration 2", title_fr: "Déshydratation 2", section: "Treatment", unit: "X02", drive_id: "1yh5gAQtX71wMFonj1CRH-UfSQZixsAI6" },
  { id: "dehydration-3", title_en: "Dehydration 3", title_fr: "Déshydratation 3", section: "Treatment", unit: "X02", drive_id: "15D4V5VjmszC3loQuCxftM4jjSThHoqAY" },
  { id: "scrubber", title_en: "Inlet Scrubber", title_fr: "Scrubber d'entrée", section: "Treatment", unit: "X01", drive_id: "1jGcSbG_6Lz7NJHufcTt8Q1QwQtJWU2SD" },
  { id: "demethanisation", title_en: "Demethaniser", title_fr: "Déméthaniseur", section: "Fractionation", unit: "X07", drive_id: "1Vf7j0oErkiyuj7CqVbDVdDKL0zevAr8k", related_tags: ["X07-F-07.21"] },
  { id: "demethanisation-2", title_en: "Demethaniser 2", title_fr: "Déméthaniseur 2", section: "Fractionation", unit: "X07", drive_id: "1ujoMROHAIoNA9pN_si3EA5LHBxJmx2su" },
  { id: "deethanisation", title_en: "Deethaniser", title_fr: "Déethaniseur", section: "Fractionation", unit: "X08", drive_id: "1EY1EJOXvnXaL-jxMGwVBdiRWdp0rNil-", related_tags: ["X08-F-07.31"] },
  { id: "depropanisation", title_en: "Depropaniser", title_fr: "Dépropaniseur", section: "Fractionation", unit: "X09", drive_id: "1HQIPVBNXgo2tYyeRnYYvEtSEJWTbX00c", related_tags: ["X09-F-07.41"] },
  { id: "debutanisation", title_en: "Debutaniser", title_fr: "Débutaniseur", section: "Fractionation", unit: "X10", drive_id: "1PB1heADPteg5HzX24AdYatd-OXbRM98f", related_tags: ["X10-F-07.51"] },
  { id: "fuel-gas", title_en: "Fuel Gas System", title_fr: "Système Fuel Gas", section: "Utilities", drive_id: "1VS_X-cX_hLuxXhQKMEMbxKL1r3nFroeE" },
  { id: "fuel-gas-1", title_en: "Fuel Gas System 2", title_fr: "Système Fuel Gas 2", section: "Utilities", drive_id: "1AT09E3Ms6t0mIDp1h7h4Gv3x7d3lyBGu" },
  { id: "fuel-gas-oil-console", title_en: "Fuel Gas / Oil Console", title_fr: "Console Fuel Gas / Huile", section: "Utilities", drive_id: "1pdCPONMVJBMS102khxB6SrkHSwMjAPt3" },
  { id: "echangeur-recup-gpl", title_en: "GPL Recovery Exchanger", title_fr: "Échangeur récup. GPL", section: "Recovery", drive_id: "15nKWgoHdmbHC8VIU6EkggaQrmOhvWOdE" },
  { id: "retour-condensat", title_en: "Condensate Return Train", title_fr: "Retour Condensat Train", section: "Process", drive_id: "10PSTETdaNSFXqNpRVh_h19-w9ol99nxu" },
  { id: "op-data-t100", title_en: "Operation Data T100", title_fr: "Données opération T100", section: "Operating Data", drive_id: "1iujC-rgEHaVOikAnFnNDQkaY78pFyRVg" },
  { id: "op-data-t200", title_en: "Operation Data T200", title_fr: "Données opération T200", section: "Operating Data", drive_id: "14fc85LCC1CIo5a4_an6XGvFd_4EDEbc-" },
  { id: "op-data-t300", title_en: "Operation Data T300", title_fr: "Données opération T300", section: "Operating Data", drive_id: "18CcolGOL-ZEqkUdj-PDE6fP0wewZGNMi" },
  { id: "op-data-t500", title_en: "Operation Data T500", title_fr: "Données opération T500", section: "Operating Data", drive_id: "1nINTgtgIwfob--3n77jDVY4Y8AySSnkA" },
  { id: "op-data-t600", title_en: "Operation Data T600", title_fr: "Données opération T600", section: "Operating Data", drive_id: "1Gdd6MKtg8tiPvin8bqkCc3GzEq9AyyE2" },
];

export const DCS_SECTIONS = Array.from(new Set(DCS_PANELS.map((p) => p.section))).sort();

export function getDcsPanel(id: string) {
  return DCS_PANELS.find((p) => p.id === id);
}

// Drive direct image URL (works for image/jpeg files in publicly viewable Drive folder).
export function driveImageUrl(driveId: string) {
  return `https://drive.google.com/thumbnail?id=${driveId}&sz=w1600`;
}

export function driveViewUrl(driveId: string) {
  return `https://drive.google.com/file/d/${driveId}/view`;
}
