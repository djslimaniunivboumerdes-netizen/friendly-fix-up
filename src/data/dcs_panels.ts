// src/data/dcs_panels.ts

export interface DCSPanel {
  id: string;
  title: string;
  section: string;
  description: string;
  imageUrl: string;           // Path to image in public/ or Supabase bucket
  tags: string[];             // Equipment tags shown on this panel
  status: 'normal' | 'alarm' | 'trip';
  lastUpdated: string;
  kpis: {
    [key: string]: string | number;
  };
}
export const DCS_PANELS: DCSPanel[] = [
  // 1. PRETREATMENT / MEA CO2 REMOVAL
  {
    id: 'dcs-101',
    title: '101 - MEA CO₂ Removal & Amine Contactor',
    section: 'Pretreatment',
    description: 'Feed Gas CO2 Removal using MEA Solution',
    imageUrl: '/images/dcs/101-mea-contactor.png', // Update with actual path from your Google Drive
    tags: ['101-F501', '101-F502', 'X01-J-503', 'X01-J-504', 'X01-E-502'],
    status: 'normal',
    lastUpdated: 'Just now',
    kpis: {
      'Feed Gas Flow': '1,850 MMSCFD',
      'CO₂ Inlet': '3.2 mol%',
      'CO₂ Outlet': '< 50 ppm',
      'MEA Circulation': '1,240 m³/h',
      'Regenerator Temp': '118°C',
    }
  },

  // 2. DEHYDRATION & MOLECULAR SIEVES
  {
    id: 'dcs-102',
    title: '102 - Dehydration & Mercury Removal',
    section: 'Dehydration',
    description: 'Molecular Sieve Dryers and Mercury Guard Beds',
    imageUrl: '/images/dcs/102-dehydration.png',
    tags: ['102-R03.10', '102-R03.11', '102-R03.12'],
    status: 'normal',
    lastUpdated: '2 min ago',
    kpis: {
      'Water Dew Point': '-85°C',
      'Mercury Removal': '99.9%',
      'Dryer A Status': 'Online',
      'Dryer B Status': 'Regenerating',
    }
  },

  // 3. FRACTIONATION
  {
    id: 'dcs-107',
    title: '107-110 - Fractionation Columns',
    section: 'Fractionation',
    description: 'Demethanizer, Deethanizer, Depropanizer, Debutanizer',
    imageUrl: '/images/dcs/fractionation.png',
    tags: ['107-F07.21', '108-F07.31', '109-F07.41', '110-F07.51'],
    status: 'normal',
    lastUpdated: 'Just now',
    kpis: {
      'LPG Production': '185 t/h',
      'Naphtha Production': '92 t/h',
      'Demethanizer Top': '-28°C',
      'Depropanizer Bottom': '68°C',
    }
  },

  // 4. LIQUEFACTION - MCR SYSTEM
  {
    id: 'dcs-106',
    title: '106 - Main Cryogenic Heat Exchanger & Liquefaction',
    section: 'Liquefaction',
    description: 'C3MR Refrigeration Cycle',
    imageUrl: '/images/dcs/106-mcr-liquefaction.png',
    tags: ['106-E05.20', 'K-503', 'K-502', 'K-503 MR HP'],
    status: 'normal',
    lastUpdated: '1 min ago',
    kpis: {
      'LNG Temperature': '-162°C',
      'MR Flow': '2,450 t/h',
      'Propane Flow': '1,180 t/h',
      'Liquefaction Efficiency': '94.8%',
    }
  },

  // 5. LNG STORAGE & LOADING
  {
    id: 'dcs-105',
    title: '105 - LNG Storage Tanks & Export',
    section: 'Storage & Export',
    description: 'LNG Tanks, In-tank Pumps and Loading System',
    imageUrl: '/images/dcs/105-lng-storage.png',
    tags: ['105-K01.20', '105-K01.21', '105-K01.22'],
    status: 'normal',
    lastUpdated: 'Just now',
    kpis: {
      'Tank A Level': '78%',
      'Tank B Level': '65%',
      'Export Rate': '1,200 t/h',
      'Flare Flow': '0.8 t/h',
    }
  },

  // 6. FUEL GAS & UTILITIES
  {
    id: 'dcs-util',
    title: 'Utilities - Fuel Gas & Flare System',
    section: 'Utilities',
    description: 'Fuel Gas Distribution and Flare Management',
    imageUrl: '/images/dcs/fuel-gas-flare.png',
    tags: ['Flare Stack', 'Fuel Gas Header'],
    status: 'normal',
    lastUpdated: '3 min ago',
    kpis: {
      'Fuel Gas Pressure': '42 bar',
      'Flare Status': 'Ready',
    }
  },

  // 7. OVERALL PLANT OVERVIEW (from uploaded PDF)
  {
    id: 'dcs-overall',
    title: 'GL1Z Overall Process Flow',
    section: 'Overview',
    description: 'Complete LNG Train Overview (85-X00-1)',
    imageUrl: '/images/dcs/overall-plot-plan.png', // Use the uploaded 85-X00-1 image
    tags: ['All Sections'],
    status: 'normal',
    lastUpdated: 'Live',
    kpis: {
      'Train Production': '1,280 t/h LNG',
      'Overall Availability': '98.7%',
      'CO₂ Removal Efficiency': '99.92%',
    }
  }
];

// Explicitly extract unique section names for the filter UI
export const DCS_SECTIONS = Array.from(
  new Set(DCS_PANELS.map(panel => panel.section))
);

// Helper function to find a single panel by its unique ID
export const getDcsPanel = (id: string) => {
  return DCS_PANELS.find(panel => panel.id === id);
};

export default DCS_PANELS;
