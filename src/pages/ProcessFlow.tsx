import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Layers, 
  ExternalLink, 
  FileText, 
  Cpu, 
  Maximize2, 
  Gauge, 
  Thermometer, 
  Droplets,
  ChevronRight,
  Info,
  Sliders
} from 'lucide-react';

type SectionKey = 'PRETREATMENT' | 'DEHYDRATION' | 'FRACTIONATION' | 'LIQUEFACTION';

interface EquipmentItem {
  tag: string;
  name: string;
  section: SectionKey;
  fluid: string;
  nominal_pressure: string;
  nominal_temp: string;
  pid_url: string;
  dcs_pic_idx: string;
  details_path: string;
  description: string;
  x_pos: number;
  y_pos: number;
}

const PLANT_SECTIONS: Record<SectionKey, string> = {
  PRETREATMENT: 'Acid Gas Removal (MEA Loop)',
  DEHYDRATION: 'Dehydration & Mercury Bed Removal',
  FRACTIONATION: 'NGL Fractionation Columns',
  LIQUEFACTION: 'Cryogenic MCR Liquefaction Loop'
};

const LNG_TRAIN_EQUIPMENT: EquipmentItem[] = [
  // SECTION 1: PRETREATMENT
  {
    tag: "10-F-502",
    name: "Absorbeur MEA (Amine Absorber Column)",
    section: "PRETREATMENT",
    fluid: "Sour Feed Gas / Monoéthanolamine Solvent",
    nominal_pressure: "41.2 Barg",
    nominal_temp: "38 °C",
    pid_url: "https://drive.google.com/drive/folders/1_WeQYp02-LYO8_KmKuK_wFEYLnf_WwLR",
    dcs_pic_idx: "S01_MEA_ABSORBER_DCS.jpg",
    details_path: "/equipment/10-F-502",
    description: "Employs counter-current lean solvent wash loops to strip incoming carbon dioxide from gas molecules.",
    x_pos: 120, y_pos: 40
  },
  {
    tag: "10-E-505",
    name: "Échangeur Amines Pauvres/Riches (Cross Exchanger)",
    section: "PRETREATMENT",
    fluid: "Rich MEA / Lean MEA Cross-Flow Stream",
    nominal_pressure: "15.5 Barg",
    nominal_temp: "110 °C",
    pid_url: "https://drive.google.com/drive/folders/1_WeQYp02-LYO8_KmKuK_wFEYLnf_WwLR",
    dcs_pic_idx: "S01_MEA_CROSS_EXCH.jpg",
    details_path: "/equipment/10-E-505",
    description: "Maximizes thermal recovery by pre-heating rich amine solvent utilizing hot lean amine bottom runs.",
    x_pos: 295, y_pos: 220
  },
  {
    tag: "10-F-501",
    name: "Régénérateur MEA (Stripper Column)",
    section: "PRETREATMENT",
    fluid: "Rich MEA Reagent / Acid Gas Vent",
    nominal_pressure: "1.8 Barg",
    nominal_temp: "121 °C",
    pid_url: "https://drive.google.com/drive/folders/1_WeQYp02-LYO8_KmKuK_wFEYLnf_WwLR",
    dcs_pic_idx: "S02_MEA_REGEN_DCS.jpg",
    details_path: "/equipment/10-F-501",
    description: "Thermally strips absorbed carbon dioxide and hydrogen sulfide from the chemical solution matrix.",
    x_pos: 485, y_pos: 60
  },

  // SECTION 2: DEHYDRATION (Drive Ref: 1DxRXgW2-O9_z3RVvJO1xdbrXChZZspGL)
  {
    tag: "10-V-102",
    name: "Sécheurs à Tamis Moléculaire (Dehydration Beds)",
    section: "DEHYDRATION",
    fluid: "Sweet Gas / Water Vapor Bound Residues",
    nominal_pressure: "39.5 Barg",
    nominal_temp: "22 °C",
    pid_url: "https://drive.google.com/drive/folders/1DxRXgW2-O9_z3RVvJO1xdbrXChZZspGL",
    dcs_pic_idx: "S03_DEHYD_DRIERS_DCS.jpg",
    details_path: "/equipment/10-V-102",
    description: "Multi-vessel zeolitic adsorption process to capture trace water down below 0.1 ppmv before cold-box tracking.",
    x_pos: 150, y_pos: 80
  },
  {
    tag: "10-V-103",
    name: "Lit de Garde Élimination du Mercure (Hg Guard Bed)",
    section: "DEHYDRATION",
    fluid: "Dry Sweet Natural Gas / Mercury Content",
    nominal_pressure: "38.9 Barg",
    nominal_temp: "24 °C",
    pid_url: "https://drive.google.com/drive/folders/1DxRXgW2-O9_z3RVvJO1xdbrXChZZspGL",
    dcs_pic_idx: "S03_MERCURY_GUARD_DCS.jpg",
    details_path: "/equipment/10-V-103",
    description: "Sulfur-impregnated active carbon matrix safely removes trace element heavy mercury to protect cryogenic aluminum units.",
    x_pos: 450, y_pos: 110
  },

  // SECTION 3: FRACTIONATION (Drive Ref: 1W_31LRK19Tz1-5CwM-_u0hjnybMMEeTu)
  {
    tag: "10-G-502",
    name: "Colonne Déméthaniseur (Demethanizer Column)",
    section: "FRACTIONATION",
    fluid: "Methane Vapor Overheads / Ethane+ NGL Bottoms",
    nominal_pressure: "28.0 Barg",
    nominal_temp: "-32 °C",
    pid_url: "https://drive.google.com/drive/folders/1W_31LRK19Tz1-5CwM-_u0hjnybMMEeTu",
    dcs_pic_idx: "S04_DEMETHANIZER_DCS.jpg",
    details_path: "/equipment/10-G-502",
    description: "Separates volatile light methane molecules from heavy hydrocarbon chains using cryogenic extraction strategies.",
    x_pos: 120, y_pos: 50
  },
  {
    tag: "10-G-503",
    name: "Colonne Dééthaniseur (Deethanizer Column)",
    section: "FRACTIONATION",
    fluid: "Ethane Overhead Reflux / Propane+ Heavy Elements",
    nominal_pressure: "19.2 Barg",
    nominal_temp: "78 °C",
    pid_url: "https://drive.google.com/drive/folders/1W_31LRK19Tz1-5CwM-_u0hjnybMMEeTu",
    dcs_pic_idx: "S04_DEETHANIZER_DCS.jpg",
    details_path: "/equipment/10-G-503",
    description: "Fractionates ethane from NGL bottoms to feed dedicated mixed refrigerant component replenishment lines.",
    x_pos: 340, y_pos: 70
  },
  {
    tag: "10-G-504",
    name: "Colonne Dépropaniseur (Depropanizer Column)",
    section: "FRACTIONATION",
    fluid: "Pure Propane Gas / Butane+ Heavy Stabilized Component",
    nominal_pressure: "14.1 Barg",
    nominal_temp: "94 °C",
    pid_url: "https://drive.google.com/drive/folders/1W_31LRK19Tz1-5CwM-_u0hjnybMMEeTu",
    dcs_pic_idx: "S04_DEPROPANIZER_DCS.jpg",
    details_path: "/equipment/10-G-504",
    description: "Extracts high-purity propane profiles for dynamic utility refrigeration loops and commercial distribution layouts.",
    x_pos: 550, y_pos: 90
  },

  // SECTION 4: LIQUEFACTION (Drive Ref: 1LB35_eT9YsONVsPudIL1Ddh6SxdBD-Fw)
  {
    tag: "10-E-105",
    name: "Main Cryogenic Heat Exchanger (MCHE Cold-Box)",
    section: "LIQUEFACTION",
    fluid: "Subcooled Liquefied Natural Gas / Mixed Refrigerant",
    nominal_pressure: "48.5 Barg",
    nominal_temp: "-162 °C",
    pid_url: "https://drive.google.com/drive/folders/1LB35_eT9YsONVsPudIL1Ddh6SxdBD-Fw",
    dcs_pic_idx: "S05_MCHE_CRYOGENIC_DCS.jpg",
    details_path: "/equipment/10-E-105",
    description: "The core element of the APCI line. Uses wound spool arrangements to condense methane to liquid aggregate targets.",
    x_pos: 180, y_pos: 40
  },
  {
    tag: "10-K-102",
    name: "Compresseur du Réfrigérant Mixte (MCR Compressor)",
    section: "LIQUEFACTION",
    fluid: "Low Pressure MCR Vapor / High Pressure Gas Return",
    nominal_pressure: "44.0 Barg",
    nominal_temp: "98 °C",
    pid_url: "https://drive.google.com/drive/folders/1LB35_eT9YsONVsPudIL1Ddh6SxdBD-Fw",
    dcs_pic_idx: "S05_MCR_COMPRESSOR_DCS.jpg",
    details_path: "/equipment/10-K-102",
    description: "High-capacity multi-stage centrifugal compressor running refrigeration gas loops for thermal transfer operations.",
    x_pos: 460, y_pos: 140
  }
];

export default function ProcessFlow() {
  const [activeSection, setActiveSection] = useState<SectionKey>('PRETREATMENT');
  const [selectedTag, setSelectedTag] = useState<string>("10-F-502");
  const [telemetry, setTelemetry] = useState<Record<string, { pressure: string; temp: string }>>({});

  // Dynamic telemetry loop simulation
  useEffect(() => {
    const runJitter = () => {
      const updated: Record<string, { pressure: string; temp: string }> = {};
      LNG_TRAIN_EQUIPMENT.forEach(eq => {
        const baseP = parseFloat(eq.nominal_pressure);
        const baseT = parseFloat(eq.nominal_temp);
        const pJitter = (baseP + (Math.random() - 0.5) * (baseP * 0.015)).toFixed(1);
        const tJitter = (baseT + (Math.random() - 0.5) * (baseT === 0 ? 1 : Math.abs(baseT) * 0.015)).toFixed(1);
        updated[eq.tag] = {
          pressure: `${pJitter} Barg`,
          temp: `${tJitter} °C`
        };
      });
      setTelemetry(updated);
    };
    runJitter();
    const timer = setInterval(runJitter, 3500);
    return () => clearInterval(timer);
  }, []);

  const selectedEquipment = LNG_TRAIN_EQUIPMENT.find(e => e.tag === selectedTag) || LNG_TRAIN_EQUIPMENT[0];

  return (
    <div className="min-h-screen bg-[#060a12] text-slate-100 p-4 lg:p-6 font-sans">
      
      {/* Upper Control Bar Block */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 border-b border-slate-800/80 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
            <h1 className="text-xl lg:text-2xl font-black tracking-tight bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent uppercase">
              LNG Train Plant Mimic Console
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">Sonatrach Operational Framework / Live Flow Tracking</p>
        </div>
        
        {/* Plant System Tab Selectors */}
        <div className="flex flex-wrap gap-1.5 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 w-full xl:w-auto">
          {Object.entries(PLANT_SECTIONS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                setActiveSection(key as SectionKey);
                const firstItem = LNG_TRAIN_EQUIPMENT.find(e => e.section === key);
                if (firstItem) setSelectedTag(firstItem.tag);
              }}
              className={`px-3 py-2 rounded-lg text-xs font-bold font-mono transition-all duration-200 ${
                activeSection === key 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-900/40' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* Dynamic Vector Animated Pipeline Field Layout */}
        <div className="xl:col-span-2 bg-[#03060f] border border-slate-800 rounded-2xl p-4 lg:p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-4 left-4 flex items-center gap-2 z-10 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-lg">
            <Sliders className="h-3.5 w-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="text-[10px] font-black tracking-wider text-slate-300 uppercase font-mono">
              Process Domain: {PLANT_SECTIONS[activeSection]}
            </span>
          </div>

          {/* SVG Pipelines Drawing Canvas */}
          <div className="w-full overflow-x-auto pt-12 pb-4 scrollbar-thin">
            <div className="min-w-[760px] relative h-96 flex items-center justify-center bg-radial-pattern">
              
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 360" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="gasFlow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                  <style>{`
                    .pipeline-core { stroke-dasharray: 10, 15; animation: dashMove 20s linear infinite; }
                    @keyframes dashMove { to { stroke-dashoffset: -1000; } }
                  `}</style>
                </defs>

                {/* Draw dynamically driven pipeline layouts based on section selection */}
                {activeSection === 'PRETREATMENT' && (
                  <>
                    <path d="M 20 120 L 120 120 M 200 80 L 485 80 M 160 240 L 160 280 L 295 280 M 360 260 L 485 260" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" />
                    <path d="M 20 120 L 120 120 M 200 80 L 485 80 M 160 240 L 160 280 L 295 280 M 360 260 L 485 260" stroke="url(#gasFlow)" strokeWidth="2.5" className="pipeline-core" />
                  </>
                )}
                {activeSection === 'DEHYDRATION' && (
                  <>
                    <path d="M 20 140 L 150 140 M 260 140 L 450 140 M 560 140 L 780 140" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" />
                    <path d="M 20 140 L 150 140 M 260 140 L 450 140 M 560 140 L 780 140" stroke="#06b6d4" strokeWidth="2.5" className="pipeline-core" />
                  </>
                )}
                {activeSection === 'FRACTIONATION' && (
                  <>
                    <path d="M 20 160 L 120 160 M 200 160 L 340 160 M 420 160 L 550 160 M 630 160 L 780 160" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" />
                    <path d="M 20 160 L 120 160 M 200 160 L 340 160 M 420 160 L 550 160 M 630 160 L 780 160" stroke="#a855f7" strokeWidth="2.5" className="pipeline-core" />
                  </>
                )}
                {activeSection === 'LIQUEFACTION' && (
                  <>
                    <path d="M 20 130 L 180 130 M 276 130 L 460 130 M 556 200 L 780 200" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" />
                    <path d="M 20 130 L 180 130 M 276 130 L 460 130 M 556 200 L 780 200" stroke="#3b82f6" strokeWidth="2.5" className="pipeline-core" />
                  </>
                )}
              </svg>

              {/* Loop and render equipment node frames dynamically */}
              {LNG_TRAIN_EQUIPMENT.filter(e => e.section === activeSection).map((eq) => (
                <div 
                  key={eq.tag} 
                  className="absolute transition-transform duration-300"
                  style={{ left: `${eq.x_pos}px`, top: `${eq.y_pos}px` }}
                >
                  <button
                    onClick={() => setSelectedTag(eq.tag)}
                    className={`p-3 min-w-[96px] rounded-xl border-2 font-mono text-center flex flex-col justify-between items-center bg-slate-950/90 transition-all shadow-md ${
                      selectedTag === eq.tag
                        ? 'border-emerald-400 ring-4 ring-emerald-500/20 scale-105 shadow-emerald-950'
                        : 'border-slate-800 hover:border-blue-500/60'
                    }`}
                  >
                    <span className="text-[11px] font-black tracking-tight text-slate-200 block bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {eq.tag}
                    </span>
                    <div className="h-6 flex items-center justify-center my-3">
                      <div className="w-1.5 h-6 bg-slate-800 border border-slate-700 rounded-sm opacity-60" />
                    </div>
                    <span className="text-[9px] text-slate-400 uppercase font-bold tracking-tight truncate max-w-[90px]">
                      {eq.tag.includes('F') ? 'Tower' : eq.tag.includes('E') ? 'Exchanger' : eq.tag.includes('K') ? 'Compressor' : 'Vessel'}
                    </span>
                  </button>
                </div>
              ))}

            </div>
          </div>
        </div>

        {/* Technical Process Intelligence HUD Grid */}
        <div className="xl:col-span-1">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden sticky top-6">
            
            {/* Header Block Identifier */}
            <div className="bg-slate-950 p-4 border-b border-slate-800/80">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-black bg-blue-500/10 text-blue-400 border border-blue-900/60 px-2 py-0.5 rounded">
                  TAG ID: {selectedEquipment.tag}
                </span>
                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Telemetry
                </span>
              </div>
              <h2 className="text-base font-black text-slate-100 mt-2 tracking-tight">
                {selectedEquipment.name}
              </h2>
            </div>

            {/* Core Values Matrix */}
            <div className="p-4 bg-slate-950/40 space-y-3.5 border-b border-slate-800/60">
              
              {/* Fluid Row */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex items-center gap-3">
                <div className="p-2 bg-blue-950 rounded-lg border border-blue-900/40">
                  <Droplets className="h-4 w-4 text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] uppercase font-mono text-slate-500 block">Process Stream Fluid</span>
                  <span className="text-xs text-slate-300 font-semibold font-mono block truncate">{selectedEquipment.fluid}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Pressure Box */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex items-center gap-3">
                  <div className="p-2 bg-emerald-950 rounded-lg border border-emerald-900/40">
                    <Gauge className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-mono text-slate-500 block">Pressure Loop</span>
                    <span className="text-xs text-slate-100 font-black font-mono block">
                      {telemetry[selectedEquipment.tag]?.pressure || selectedEquipment.nominal_pressure}
                    </span>
                  </div>
                </div>

                {/* Temperature Box */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex items-center gap-3">
                  <div className="p-2 bg-amber-950 rounded-lg border border-amber-900/40">
                    <Thermometer className="h-4 w-4 text-amber-400" />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-mono text-slate-500 block">Temperature</span>
                    <span className="text-xs text-slate-100 font-black font-mono block">
                      {telemetry[selectedEquipment.tag]?.temp || selectedEquipment.nominal_temp}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 font-mono leading-relaxed flex gap-2">
                <Info className="h-4 w-4 text-slate-500 flex-shrink-0 mt-0.5" />
                <p>{selectedEquipment.description}</p>
              </div>
            </div>

            {/* Tactical Redirect Action Matrix */}
            <div className="p-4 bg-slate-950/80 space-y-2.5">
              
              {/* Button 1: Open Target P&ID Index */}
              <a 
                href={selectedEquipment.pid_url}
                target="_blank" 
                rel="noreferrer"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 px-3 rounded-xl flex items-center justify-between transition-colors shadow-md shadow-blue-900/20"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-200" />
                  <span>View Piping & Instrumentation Sheet</span>
                </div>
                <ExternalLink className="h-3.5 w-3.5 opacity-80" />
              </a>

              {/* Button 2: Equipment Full Info Router */}
              <button 
                onClick={() => window.location.href = selectedEquipment.details_path}
                className="w-full bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-bold text-xs py-3 px-3 rounded-xl flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-slate-400" />
                  <span>Go to Technical Equipment Page</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
              </button>

              {/* Button 3: Related DCS Reference Layout Pop */}
              <button 
                onClick={() => alert(`Opening relative DCS HMI graphic panel: ${selectedEquipment.dcs_pic_idx}`)}
                className="w-full bg-[#0c101b] hover:bg-slate-900 border border-slate-800/80 text-cyan-400 hover:text-cyan-300 font-bold text-xs py-3 px-3 rounded-xl flex items-center justify-between transition-all font-mono"
              >
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-cyan-500" />
                  <span>DCS Graphic: {selectedEquipment.dcs_pic_idx}</span>
                </div>
                <Maximize2 className="h-3.5 w-3.5 text-cyan-500" />
              </button>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
              }
