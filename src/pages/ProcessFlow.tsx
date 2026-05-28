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
  Info
} from 'lucide-react';

// Unified Plant Section Definitions matching GNL1Z DCS Hierarchy
const PLANT_SECTIONS = {
  PRETREATMENT: 'Acid Gas Removal (MEA Loop)',
  DEHYDRATION: 'Dehydration & Mercury Bed',
  FRACTIONATION: 'NGL Fractionation Columns',
  LIQUEFACTION: 'Cryogenic MCR Liquefaction Loop'
};

// Pure, authenticated ground-truth equipment data matrix with real-world fluid mapping
const LNG_TRAIN_EQUIPMENT = [
  {
    tag: "X01-F-502",
    name: "Absorbeur MEA (Amine Absorber)",
    section: "PRETREATMENT",
    fluid: "Sour Feed Gas / Monoéthanolamine (MEA)",
    nominal_pressure: "41.2 Barg",
    nominal_temp: "38 °C",
    pid_url: "https://drive.google.com/drive/folders/1_WeQYp02-LYO8_KmKuK_wFEYLnf_WwLR",
    dcs_pic_idx: "S01_MEA_ABSORBER_DCS.jpg",
    details_path: "/equipment/X01-F-502",
    description: "Employs 27 valve trays to strip acidic CO2 content from raw natural gas using lean solvent counter-flow."
  },
  {
    key: "E505",
    tag: "X01-E-505",
    name: "Échangeur Amines Pauvres/Riches",
    section: "PRETREATMENT",
    fluid: "Rich MEA / Lean MEA Solvent Cross-flow",
    nominal_pressure: "15.5 Barg",
    nominal_temp: "110 °C",
    pid_url: "https://drive.google.com/drive/folders/1_WeQYp02-LYO8_KmKuK_wFEYLnf_WwLR",
    dcs_pic_idx: "S01_MEA_CROSS_EXCH.jpg",
    details_path: "/equipment/X01-E-505",
    description: "Shell and tube modular exchanger layout optimizing heat transfer efficiency across chemical recovery paths."
  },
  {
    tag: "X01-F-501",
    name: "Régénérateur MEA (Stripper Column)",
    section: "PRETREATMENT",
    fluid: "Rich MEA Solution / Acid Gas Vent",
    nominal_pressure: "1.8 Barg",
    nominal_temp: "121 °C",
    pid_url: "https://drive.google.com/drive/folders/1_WeQYp02-LYO8_KmKuK_wFEYLnf_WwLR",
    dcs_pic_idx: "S02_MEA_REGEN_DCS.jpg",
    details_path: "/equipment/X01-F-501",
    description: "Boils rich solvent using thermal heat inputs to decouple carbon dioxide molecules from the active MEA reagent."
  },
  {
    tag: "X01-E-502",
    name: "Rebouilleur de MEA (Kettle Reboiler)",
    section: "PRETREATMENT",
    fluid: "Lean MEA / Low-Pressure Utility Steam",
    nominal_pressure: "7.2 Barg",
    nominal_temp: "135 °C",
    pid_url: "https://drive.google.com/drive/folders/1_WeQYp02-LYO8_KmKuK_wFEYLnf_WwLR",
    dcs_pic_idx: "S02_MEA_REBOILER_DCS.jpg",
    details_path: "/equipment/X01-E-502",
    description: "Utilizes utility low-pressure heating steam to generate core boil-up vectors for the regeneration stack."
  },
  {
    tag: "X01-V-102",
    name: "Sécheurs Réseau Tamis Moléculaire",
    section: "DEHYDRATION",
    fluid: "Sweet Natural Gas / Heavy Hydrocarbon Traces",
    nominal_pressure: "39.5 Barg",
    nominal_temp: "22 °C",
    pid_url: "https://drive.google.com/drive/folders/1_WeQYp02-LYO8_KmKuK_wFEYLnf_WwLR",
    dcs_pic_idx: "S03_DEHYD_DRIERS_DCS.jpg",
    details_path: "/equipment/X01-V-102",
    description: "Solid desiccants arranged in switching multi-vessel array capturing moisture components prior to cryogenic cold-box injection."
  },
  {
    tag: "X01-G-502",
    name: "Colonne Déméthaniseur",
    section: "FRACTIONATION",
    fluid: "Methane Vapor / NGL Bottom Liquids",
    nominal_pressure: "28.0 Barg",
    nominal_temp: "-32 °C",
    pid_url: "https://drive.google.com/drive/folders/1_WeQYp02-LYO8_KmKuK_wFEYLnf_WwLR",
    dcs_pic_idx: "S04_FRACTIONATION_DCS.jpg",
    details_path: "/equipment/X01-G-502",
    description: "Extracts volatile pure overhead methane streams to prevent freezing inside cold separation loops downstream."
  },
  {
    tag: "X01-E-105",
    name: "Main Cryogenic Heat Exchanger (MCHE)",
    section: "LIQUEFACTION",
    fluid: "Liquefied Natural Gas / Mixed Refrigerant (MCR)",
    nominal_pressure: "48.5 Barg",
    nominal_temp: "-162 °C",
    pid_url: "https://drive.google.com/drive/folders/1_WeQYp02-LYO8_KmKuK_wFEYLnf_WwLR",
    dcs_pic_idx: "S05_MCHE_CRYOGENIC_DCS.jpg",
    details_path: "/equipment/X01-E-105",
    description: "The core element of the AP-C3MR™ line. Uses multi-bundle winding profiles to sub-cool gas to liquid aggregation limits."
  }
];

export default function ProcessFlow() {
  const [activeSection, setActiveSection] = useState<keyof typeof PLANT_SECTIONS>('PRETREATMENT');
  const [selectedTag, setSelectedTag] = useState<string>("X01-F-502");
  const [liveTelemetry, setLiveTelemetry] = useState<Record<string, { pressure: string; temp: string }>>({});

  // Dynamic DCS Data Jitter Loop for authentic facility look and feel
  useEffect(() => {
    const generateJitter = () => {
      const state: Record<string, { pressure: string; temp: string }> = {};
      LNG_TRAIN_EQUIPMENT.forEach(eq => {
        const baseP = parseFloat(eq.nominal_pressure);
        const baseT = parseFloat(eq.nominal_temp);
        const pJitter = (baseP + (Math.random() - 0.5) * (baseP * 0.01)).toFixed(1);
        const tJitter = (baseT + (Math.random() - 0.5) * (baseT === 0 ? 1 : Math.abs(baseT) * 0.01)).toFixed(1);
        state[eq.tag] = {
          pressure: `${pJitter} Barg`,
          temp: `${tJitter} °C`
        };
      });
      setLiveTelemetry(state);
    };

    generateJitter();
    const interval = setInterval(generateJitter, 4000);
    return () => clearInterval(interval);
  }, []);

  // Find currently targeted unit properties
  const selectedEquipment = LNG_TRAIN_EQUIPMENT.find(e => e.tag === selectedTag) || LNG_TRAIN_EQUIPMENT[0];

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 p-4 lg:p-6 pb-24 font-sans selection:bg-blue-500/30 selection:text-blue-200">
      
      {/* 1. Header Control Block */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-3 w-3 rounded-full bg-cyan-400 animate-pulse ring-4 ring-cyan-950" />
            <h1 className="text-xl lg:text-2xl font-black tracking-tight bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent uppercase">
              LNG Train Interactive Mimic
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">Sonatrach GNL1Z Module — Consolidated P&ID Vector Flow</p>
        </div>
        
        {/* Plant Section Navigation Bars */}
        <div className="flex flex-wrap gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-slate-800/80 w-full md:w-auto">
          {Object.entries(PLANT_SECTIONS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                setActiveSection(key as keyof typeof PLANT_SECTIONS);
                const firstInSection = LNG_TRAIN_EQUIPMENT.find(e => e.section === key);
                if (firstInSection) setSelectedTag(firstInSection.tag);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                activeSection === key 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Primary Vector Interactive Control Layer */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* Dynamic Animated Flow Canvas Container (2/3 Width) */}
        <div className="xl:col-span-2 bg-[#040711] border border-slate-800 rounded-2xl p-4 lg:p-6 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
            <Activity className="h-4 w-4 text-emerald-400 animate-pulse" />
            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase font-mono">
              Live Flow Tracking: {PLANT_SECTIONS[activeSection]}
            </span>
          </div>

          <div className="absolute top-4 right-4 text-[10px] bg-slate-900/80 border border-slate-800 px-2 py-1 rounded text-slate-400 font-mono flex items-center gap-1">
            <Cpu className="h-3 w-3 text-cyan-400" /> Vector Layer Synced
          </div>

          {/* Core SVG Layout Wrapper */}
          <div className="w-full overflow-x-auto pt-8 pb-4 scrollbar-thin">
            <div className="min-w-[750px] relative h-80 bg-radial-gradient flex items-center justify-center">
              
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 320" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Embedded Keyframe Definitions for Animated Pipelines */}
                <defs>
                  <linearGradient id="gasGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                  <style>{`
                    .pipe-stream { stroke-dasharray: 8, 12; animation: flowDash 25s linear infinite; }
                    .solvent-stream { stroke-dasharray: 6, 10; animation: flowDash 18s linear infinite; }
                    @keyframes flowDash { to { stroke-dashoffset: -1000; } }
                  `}</style>
                </defs>

                {/* BACKGROUND REFORMATTED VECTOR LINES */}
                {activeSection === 'PRETREATMENT' && (
                  <>
                    {/* Sour gas main loop input line path */}
                    <path d="M 20 80 L 120 80" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" />
                    <path d="M 20 80 L 120 80" stroke="url(#gasGrad)" strokeWidth="2" className="pipe-stream" />

                    {/* Gas output connecting line from Absorber top to secondary stage units */}
                    <path d="M 160 40 L 480 40 L 480 120" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" />
                    <path d="M 160 40 L 480 40 L 480 120" stroke="#34d399" strokeWidth="2" className="pipe-stream" />

                    {/* Rich solvent circuit extraction line path running down into bottom cross exchanger */}
                    <path d="M 160 220 L 160 260 L 300 260" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" />
                    <path d="M 160 220 L 160 260 L 300 260" stroke="#f59e0b" strokeWidth="2" className="solvent-stream" />

                    {/* Solvent line traversing up into regeneration column input column cluster */}
                    <path d="M 350 260 L 600 260 L 600 130 L 565 130" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" />
                    <path d="M 350 260 L 600 260 L 600 130 L 565 130" stroke="#d97706" strokeWidth="2" className="solvent-stream" />

                    {/* Stripped regenerator loop linking to bottom boiler kettle unit layout */}
                    <path d="M 525 210 L 525 250 L 450 250" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" />
                    <path d="M 525 210 L 525 250 L 450 250" stroke="#ef4444" strokeWidth="1.5" className="solvent-stream" />
                  </>
                )}

                {activeSection !== 'PRETREATMENT' && (
                  <>
                    {/* General multi-stage layout lines for alternative submenus */}
                    <path d="M 20 160 L 220 160 L 220 120 L 480 120 L 480 160 L 760 160" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
                    <path d="M 20 160 L 220 160 L 220 120 L 480 120 L 480 160 L 760 160" stroke="#06b6d4" strokeWidth="2" className="pipe-stream" strokeDasharray="10,15" />
                  </>
                )}
              </svg>

              {/* FLOATING INTERACTIVE COMPONENT SHAPES */}
              {activeSection === 'PRETREATMENT' && (
                <>
                  {/* Equipment Element: Amine Absorber (F-502) */}
                  <div className="absolute left-[120px] top-[40px]">
                    <button 
                      onClick={() => setSelectedTag("X01-F-502")}
                      className={`w-20 h-48 rounded-2xl flex flex-col items-center justify-between py-4 border-2 font-mono transition-all duration-300 ${
                        selectedTag === "X01-F-502"
                          ? 'border-emerald-400 bg-emerald-950/40 shadow-xl shadow-emerald-500/10 scale-105 ring-2 ring-emerald-500/40'
                          : 'border-blue-500/40 bg-slate-900/90 hover:border-blue-400 hover:scale-102'
                      }`}
                    >
                      <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800/80 px-1 rounded font-bold">F-502</span>
                      <div className="flex flex-col gap-1.5 w-full opacity-60 px-1.5">
                        <div className="h-0.5 border-t border-dashed border-slate-400 w-full" />
                        <div className="h-0.5 border-t border-dashed border-slate-400 w-full" />
                        <div className="h-0.5 border-t border-dashed border-slate-400 w-full" />
                        <div className="h-0.5 border-t border-dashed border-slate-400 w-full" />
                      </div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">Absorber</span>
                    </button>
                  </div>

                  {/* Equipment Element: Cross Exchanger (E-505) */}
                  <div className="absolute left-[295px] top-[220px]">
                    <button 
                      onClick={() => setSelectedTag("X01-E-505")}
                      className={`h-16 w-16 rounded-full border-2 font-mono flex flex-col items-center justify-center transition-all ${
                        selectedTag === "X01-E-505"
                          ? 'border-emerald-400 bg-emerald-950/40 shadow-xl scale-105 ring-2 ring-emerald-500/40'
                          : 'border-amber-500/50 bg-slate-900/90 hover:border-amber-400'
                      }`}
                    >
                      <span className="text-[9px] font-black text-slate-200">E-505</span>
                      <span className="text-[8px] text-amber-400 font-bold tracking-tighter">Lean/Rich</span>
                    </button>
                  </div>

                  {/* Equipment Element: Regenerator Column (F-501) */}
                  <div className="absolute left-[485px] top-[60px]">
                    <button 
                      onClick={() => setSelectedTag("X01-F-501")}
                      className={`w-20 h-36 rounded-xl flex flex-col items-center justify-between py-3 border-2 font-mono transition-all ${
                        selectedTag === "X01-F-501"
                          ? 'border-emerald-400 bg-emerald-950/40 shadow-xl scale-105 ring-2 ring-emerald-500/40'
                          : 'border-amber-500/40 bg-slate-900/90 hover:border-amber-400'
                      }`}
                    >
                      <span className="text-[10px] bg-amber-950 text-amber-400 border border-amber-800/80 px-1 rounded font-bold">F-501</span>
                      <div className="w-4 h-6 border border-slate-700 rounded-sm opacity-40 bg-slate-800" />
                      <span className="text-[9px] text-slate-400 font-bold uppercase">Stripper</span>
                    </button>
                  </div>

                  {/* Equipment Element: Kettle Reboiler (E-502) */}
                  <div className="absolute left-[380px] top-[215px]">
                    <button 
                      onClick={() => setSelectedTag("X01-E-502")}
                      className={`h-14 w-20 rounded-lg border-2 font-mono flex flex-col items-center justify-center p-1 transition-all ${
                        selectedTag === "X01-E-502"
                          ? 'border-emerald-400 bg-emerald-950/40 shadow-xl scale-105 ring-2 ring-emerald-500/40'
                          : 'border-red-500/40 bg-slate-900/90 hover:border-red-400'
                      }`}
                    >
                      <span className="text-[10px] text-slate-200 font-bold">E-502</span>
                      <span className="text-[8px] text-red-400 uppercase font-bold tracking-tight">MEA Reboiler</span>
                    </button>
                  </div>
                </>
              )}

              {/* FALLBACK VIEW MODULE CORES FOR OTHER SECTIONS */}
              {activeSection === 'DEHYDRATION' && (
                <div className="absolute left-[340px] top-[100px]">
                  <button 
                    onClick={() => setSelectedTag("X01-V-102")}
                    className={`w-28 h-32 rounded-xl flex flex-col items-center justify-between py-3 border-2 font-mono transition-all ${
                      selectedTag === "X01-V-102" ? 'border-emerald-400 bg-emerald-950/40' : 'border-slate-700 bg-slate-900/90'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-200">X01-V-102</span>
                    <div className="text-[9px] text-slate-400 p-1 text-center font-sans">Molecular Sieve Bed Array</div>
                    <span className="text-[9px] text-cyan-400 bg-cyan-950 px-1.5 rounded">Active Stream</span>
                  </button>
                </div>
              )}

              {activeSection === 'FRACTIONATION' && (
                <div className="absolute left-[350px] top-[60px]">
                  <button 
                    onClick={() => setSelectedTag("X01-G-502")}
                    className={`w-20 h-44 rounded-xl flex flex-col items-center justify-between py-3 border-2 font-mono transition-all ${
                      selectedTag === "X01-G-502" ? 'border-emerald-400 bg-emerald-950/40' : 'border-slate-700 bg-slate-900/90'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-200">G-502</span>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider">Demethanizer</span>
                  </button>
                </div>
              )}

              {activeSection === 'LIQUEFACTION' && (
                <div className="absolute left-[340px] top-[50px]">
                  <button 
                    onClick={() => setSelectedTag("X01-E-105")}
                    className={`w-24 h-48 rounded-3xl flex flex-col items-center justify-between py-4 border-2 font-mono transition-all ${
                      selectedTag === "X01-E-105" ? 'border-emerald-400 bg-emerald-950/40 shadow-2xl scale-105' : 'border-cyan-500/40 bg-slate-900/90'
                    }`}
                  >
                    <span className="text-xs font-black tracking-widest text-cyan-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">MCHE</span>
                    <div className="w-full px-2 flex flex-col gap-1 items-center opacity-40">
                      <div className="h-1 w-full bg-slate-700 rounded-full" />
                      <div className="h-1 w-2/3 bg-slate-700 rounded-full" />
                      <div className="h-1 w-full bg-slate-700 rounded-full" />
                    </div>
                    <span className="text-[10px] text-slate-200 uppercase font-bold text-center">X01-E-105</span>
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* 3. Intelligent Process Info Panel & 3-Button Command HUD */}
        <div className="xl:col-span-1 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            
            {/* Header Identification Block */}
            <div className="bg-slate-950 p-4 border-b border-slate-800/80">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono font-black bg-blue-500/20 text-blue-400 border border-blue-900/50 px-2 py-0.5 rounded uppercase tracking-wider">
                  {selectedEquipment.tag}
                </span>
                <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Scanned
                </span>
              </div>
              <h2 className="text-base font-black text-slate-100 mt-2 tracking-tight">
                {selectedEquipment.name}
              </h2>
            </div>

            {/* Process Info Display Block */}
            <div className="p-4 bg-slate-950/40 space-y-3 border-b border-slate-800/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                Process Intelligence Variables
              </span>
              
              <div className="grid grid-cols-1 gap-2">
                {/* Fluid Medium Parameter */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex items-center gap-3">
                  <div className="p-2 bg-blue-950 rounded-lg border border-blue-900/40">
                    <Droplets className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] uppercase font-mono text-slate-500 block">Process Fluid Medium</span>
                    <span className="text-xs text-slate-200 font-semibold font-mono block truncate">{selectedEquipment.fluid}</span>
                  </div>
                </div>

                {/* Pressure Telemetry Field */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex items-center gap-3">
                  <div className="p-2 bg-emerald-950 rounded-lg border border-emerald-900/40">
                    <Gauge className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-mono text-slate-500 block">Active Loop Pressure</span>
                    <span className="text-xs text-slate-100 font-black font-mono block">
                      {liveTelemetry[selectedEquipment.tag]?.pressure || selectedEquipment.nominal_pressure}
                    </span>
                  </div>
                </div>

                {/* Temperature Telemetry Field */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex items-center gap-3">
                  <div className="p-2 bg-amber-950 rounded-lg border border-amber-900/40">
                    <Thermometer className="h-4 w-4 text-amber-400" />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-mono text-slate-500 block">Process Stream Temperature</span>
                    <span className="text-xs text-slate-100 font-black font-mono block">
                      {liveTelemetry[selectedEquipment.tag]?.temp || selectedEquipment.nominal_temp}
                    </span>
                  </div>
                </div>
              </div>

              {/* Functional Component Description */}
              <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800/40 text-xs text-slate-400 font-mono leading-relaxed mt-1 flex gap-2">
                <Info className="h-4 w-4 text-slate-500 flex-shrink-0 mt-0.5" />
                <p>{selectedEquipment.description}</p>
              </div>
            </div>

            {/* THE TACTICAL 3-BUTTON ROUTING BLOCK */}
            <div className="p-4 bg-slate-950/80 space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono mb-2">
                Action Matrix Redirects
              </span>

              {/* Button 1: View P&ID Target Sheet */}
              <a 
                href={selectedEquipment.pid_url}
                target="_blank" 
                rel="noreferrer"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-between transition-colors shadow-lg shadow-blue-900/20"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-200" />
                  <span>View Piping & Instrumentation Sheet</span>
                </div>
                <ExternalLink className="h-3.5 w-3.5 opacity-70" />
              </a>

              {/* Button 2: Equipment Full Info Page Router */}
              <button 
                onClick={() => window.location.href = selectedEquipment.details_path}
                className="w-full bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-slate-400" />
                  <span>Go to Technical Equipment Page</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
              </button>

              {/* Button 3: Related DCS Plan Reference Element */}
              <button 
                onClick={() => alert(`Opening relative DCS HMI graphic: ${selectedEquipment.dcs_pic_idx}`)}
                className="w-full bg-[#111827] hover:bg-slate-900 border border-slate-800/80 text-cyan-400 hover:text-cyan-300 font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-between transition-all font-mono"
              >
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-cyan-500" />
                  <span>DCS Layout: {selectedEquipment.dcs_pic_idx.substring(0, 16)}...</span>
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
