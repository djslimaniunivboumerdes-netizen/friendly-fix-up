// ─────────────────────────────────────────────────────────────────────────────
// GNL1Z – P&ID Sections Registry
// All section metadata + Google Drive file IDs for P&ID image embedding
// ─────────────────────────────────────────────────────────────────────────────

export type PIDCategory =
  | "treatment"
  | "pre-cooling"
  | "liquefaction"
  | "fractionation"
  | "utilities";

export interface PIDSection {
  id: string;
  title: string;
  subtitle: string;
  unit: string;
  fileId: string;          // Google Drive file ID
  equipment: string[];     // Equipment tags on this drawing
  description: string;
  drawing: string;         // Bechtel drawing number
  revision?: number;
  category: PIDCategory;
  processOrder: number;    // Position in the overall process flow (1 = first)
}

/** Returns the embeddable thumbnail URL for a Google Drive image.
 *  The Drive file must be shared with "Anyone with the link" or accessed
 *  while the user is authenticated with the owning Google account.
 *  `sz` controls the max dimension: w800 | w1600 | w2000 | w4000 */
export function driveImageUrl(fileId: string, sz = "w2000"): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=${sz}`;
}

export const PID_SECTIONS: PIDSection[] = [
  {
    id: "co2-removal",
    title: "CO₂ Removal",
    subtitle: "Absorber",
    unit: "Feed Gas Treatment",
    fileId: "1XnQlsFf0j5eNlUDr9rKZfZkr3h2tGNDi",
    equipment: ["G507"],
    description:
      "CO₂ removal absorber using MDEA solvent. Feed natural gas is contacted counter-currently to absorb CO₂ before cryogenic processing.",
    drawing: "85-X01-10.3",
    revision: 6,
    category: "treatment",
    processOrder: 1,
  },
  {
    id: "scrub-tower",
    title: "Scrub Tower",
    subtitle: "Section",
    unit: "Pre-cooling",
    fileId: "1aNlMZ1PutUuOBqEh70GRxyyy7RF8wM9w",
    equipment: ["F711", "E713", "E717", "E523"],
    description:
      "Scrub tower with steam/butane vaporiser, tower reboiler (E713), scrub tower condenser (E717) and supplementary chiller (E523). Removes heavy hydrocarbons before liquefaction.",
    drawing: "85-X04-10.1",
    revision: 8,
    category: "pre-cooling",
    processOrder: 2,
  },
  {
    id: "main-exchanger",
    title: "Main Exchanger",
    subtitle: "Liquefaction – Sheet 1",
    unit: "Liquefaction",
    fileId: "1HZw_f38-vQEkcDh5GmrROaYUsv7_Gs-s",
    equipment: ["E520", "R792", "R793"],
    description:
      "Main cryogenic PFHE heat exchanger (E520) for final liquefaction of methane. MCR warm & cold streams, LNG product and MR liquid/vapour streams shown.",
    drawing: "85-X06-10.17",
    revision: 17,
    category: "liquefaction",
    processOrder: 3,
  },
  {
    id: "mcr-feed-chilling",
    title: "MCR & Feed Chilling",
    subtitle: "Refrigerant Circuit",
    unit: "Liquefaction",
    fileId: "1l2sSD2QO7VU29tmAFciLRJKUra7HCUiC",
    equipment: ["E522", "E524", "E525A", "E525B", "E526A", "E526B", "G785", "G790"],
    description:
      "Mixed Coolant Refrigerant (MCR) propane pre-cooling circuit. Includes MP & LP propane chillers (E524/E525/E526), suction drums (G785/G790) and feed propane chiller (E522).",
    drawing: "85-X04-10.25",
    revision: 7,
    category: "liquefaction",
    processOrder: 4,
  },
  {
    id: "demethanizer",
    title: "Demethanizer",
    subtitle: "Fractionation Column",
    unit: "Fractionation Train",
    fileId: "10tqueQZHEfRYAZPEa3XVQLygMibHwkJo",
    equipment: ["F721", "F722", "E723", "G724", "E730"],
    description:
      "Demethanizer column (F721/F722) with overhead condenser (E723), reflux drum (G724), reboiler and bottoms cooler (E730). Separates methane from C₂+ NGL stream.",
    drawing: "85-X07-10",
    revision: 18,
    category: "fractionation",
    processOrder: 5,
  },
  {
    id: "demethanizer-detail",
    title: "Demethanizer",
    subtitle: "Detail – Reflux & Pumps",
    unit: "Fractionation Train",
    fileId: "1BfnfCho8YP4wfevhbZyJWfg23yAtPZkD",
    equipment: ["F721", "F722", "E723", "G724", "E730", "J725", "J727"],
    description:
      "Supplementary detail sheet for the demethanizer reflux pumps (J725/J727) and bottoms section. Includes vertical section piping details.",
    drawing: "85-X07-10 (Detail)",
    revision: 18,
    category: "fractionation",
    processOrder: 5,
  },
  {
    id: "de-ethanizer",
    title: "De-ethanizer",
    subtitle: "Fractionation Column",
    unit: "Fractionation Train",
    fileId: "16JOnZ04Stw9vnQXcSTTreby_gctLwmFb",
    equipment: ["F731", "E732", "E733", "G734", "G736", "J735", "J740"],
    description:
      "De-ethanizer column (F731) with condenser (E732), reboiler (E733), reflux drum (G734), propane separator (G736) and reflux pumps (J735/J740). Separates ethane from C₃+ stream.",
    drawing: "85-X08-10",
    revision: 5,
    category: "fractionation",
    processOrder: 6,
  },
  {
    id: "depropanizer",
    title: "Depropanizer",
    subtitle: "Fractionation Column",
    unit: "Fractionation Train",
    fileId: "1uaKCbX73t0udB6xVd89r_wSHEdGMm61f",
    equipment: ["F741", "E742", "E743", "G744", "J745", "J748"],
    description:
      "Depropanizer column (F741) with overhead condenser (E742), reboiler (E743), reflux drum (G744) and reflux pumps (J745/J748). Separates propane from butanes and heavier NGL.",
    drawing: "85-X09-10",
    revision: 5,
    category: "fractionation",
    processOrder: 7,
  },
  {
    id: "debutanizer",
    title: "Debutanizer",
    subtitle: "Fractionation Column",
    unit: "Fractionation Train",
    fileId: "1YShEFvAQ7uczpYvz0Ek25XsvqVnjo5Lt",
    equipment: ["F751", "E752", "E753", "G754", "J755", "J762"],
    description:
      "Debutanizer column (F751) with condenser (E752), reboiler (E753/rebouilleur), reflux drum (G754), reflux pumps (J755/J762) and gasoline cooler. Produces natural gasoline and C₄ products.",
    drawing: "85-X10-10.1",
    revision: 5,
    category: "fractionation",
    processOrder: 8,
  },
  {
    id: "utilities",
    title: "Utilities",
    subtitle: "Train 200 Distribution",
    unit: "Utilities",
    fileId: "1j6y5B_BvpckdxFoGwvXRA9KULviD9xjx",
    equipment: ["G325", "T200"],
    description:
      "Miscellaneous utilities distribution for liquefaction train 200. Includes instrument air receiver, utility stations, LNG product pumps and associated distribution piping.",
    drawing: "85-X00-23",
    category: "utilities",
    processOrder: 9,
  },
];

export const CATEGORY_META: Record<
  PIDCategory,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  treatment: {
    label: "Feed Treatment",
    color: "text-emerald-400",
    bg: "bg-emerald-950/60",
    border: "border-emerald-700/50",
    dot: "bg-emerald-400",
  },
  "pre-cooling": {
    label: "Pre-cooling",
    color: "text-sky-400",
    bg: "bg-sky-950/60",
    border: "border-sky-700/50",
    dot: "bg-sky-400",
  },
  liquefaction: {
    label: "Liquefaction",
    color: "text-indigo-400",
    bg: "bg-indigo-950/60",
    border: "border-indigo-700/50",
    dot: "bg-indigo-400",
  },
  fractionation: {
    label: "Fractionation",
    color: "text-amber-400",
    bg: "bg-amber-950/60",
    border: "border-amber-700/50",
    dot: "bg-amber-400",
  },
  utilities: {
    label: "Utilities",
    color: "text-slate-400",
    bg: "bg-slate-900/60",
    border: "border-slate-600/50",
    dot: "bg-slate-400",
  },
};

/** Build a flat lookup: equipment tag → section */
export function buildEquipmentIndex(): Map<string, PIDSection> {
  const map = new Map<string, PIDSection>();
  for (const section of PID_SECTIONS) {
    for (const tag of section.equipment) {
      map.set(tag, section);
    }
  }
  return map;
    }
