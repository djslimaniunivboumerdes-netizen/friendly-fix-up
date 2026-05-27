import React, { useState } from 'react';

// Exact equipment names as per official plans
const processSections = {
  decarbonatation: {
    title: "Décarbonatation (Absorber)",
    equipments: ["X01-F-502", "X01-E-506"]
  },
  regenerationMea: {
    title: "Régénération MEA",
    equipments: ["X01-F-501", "X01-E-502", "X01-G-507", "X01-E-505"]
  },
  deshydratation: {
    title: "Déshydratation",
    equipments: ["X01-E-521"]
  },
  demercurisation: {
    title: "Démercurisation",
    equipments: ["X01-F-503"]
  },
  refroidissement: {
    title: "Système de Refroidissement",
    equipments: ["X01-E-504"]
  },
  fractionnement: {
    title: "Fractionnement",
    equipments: ["X01-G-502"]
  }
};

// Hardcoded matching fallback lookup array using your Drive URLs
// Replace the placeholder URLs below with the real links from your Google Drive folder
const driveFilesRegistry = [
  { name: "X01-E-505.pdf", webViewLink: "https://drive.google.com/open?id=YOUR_LINK_HERE" },
  { name: "X01-F-501.pdf", webViewLink: "https://drive.google.com/open?id=YOUR_LINK_HERE" },
  { name: "X01-G-507.pdf", webViewLink: "https://drive.google.com/open?id=YOUR_LINK_HERE" },
  { name: "X01-F-502.pdf", webViewLink: "https://drive.google.com/open?id=YOUR_LINK_HERE" },
  { name: "X01-E-506.pdf", webViewLink: "https://drive.google.com/open?id=YOUR_LINK_HERE" },
  { name: "X01-E-521.pdf", webViewLink: "https://drive.google.com/open?id=YOUR_LINK_HERE" }
];

export default function ProcessFlow() {
  const [activeSection, setActiveSection] = useState<keyof typeof processSections>('regenerationMea');
  const [selectedEquipment, setSelectedEquipment] = useState('X01-E-505');

  // Looser string matching function to handle typos or spaces in filename vs layout tags
  const normalize = (str: string) => str ? str.toUpperCase().replace(/X01/g, '').replace(/[\s-_]/g, '') : '';

  const openIsolationPlan = (tag: string) => {
    const target = normalize(tag);
    const matchedFile = driveFilesRegistry.find(f => normalize(f.name).includes(target));

    if (matchedFile) {
      window.open(matchedFile.webViewLink, '_blank');
    } else {
      // Fallback redirect directly to the parent folder link if individual item matching misses
      window.open("https://drive.google.com/drive/folders/1_WeQYp02-LYO8_KmKuK_wFEYLnf_WwLR", '_blank');
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto bg-white rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">Interactive GNL1Z Process Flow</h2>
      
      {/* 1. Mobile-Friendly Image viewport frame with horizontal scroll support */}
      <div className="w-full overflow-x-auto border border-gray-200 rounded-lg relative bg-gray-50">
        <img 
          src="/assets/schema_procede_gl1z.png" 
          alt="Process Flow Diagram" 
          className="h-44 w-auto max-w-none block mx-auto"
        />
        <div className="text-center text-[10px] text-gray-400 py-1 border-t border-gray-100 bg-gray-50">
          ↔ Swipe to view diagram sections ↔
        </div>
      </div>

      {/* 2. Responsive UI Grid blocks for thumb tapping */}
      <div className="grid grid-cols-2 gap-2 my-4">
        {Object.keys(processSections).map((key) => (
          <button
            key={key}
            type="button"
            className={`p-3 text-xs font-semibold rounded-lg border transition-colors ${
              activeSection === key 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-white text-gray-700 border-gray-200'
            }`}
            onClick={() => {
              const selectedKey = key as keyof typeof processSections;
              setActiveSection(selectedKey);
              setSelectedEquipment(processSections[selectedKey].equipments[0]);
            }}
          >
            {processSections[key as keyof typeof processSections].title}
          </button>
        ))}
      </div>

      {/* 3. Dropdown Selection and Primary Isolation Action Control */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-bold text-gray-800 mb-2">
          {processSections[activeSection].title} Units
        </h4>
        
        <div className="flex flex-col gap-2 my-3">
          {processSections[activeSection].equipments.map((eq) => (
            <label 
              key={eq} 
              className={`flex items-center p-3 border rounded-lg cursor-pointer text-sm transition-colors ${
                selectedEquipment === eq 
                  ? 'border-green-500 bg-green-50/50 font-medium text-green-900' 
                  : 'border-gray-200 bg-white text-gray-700'
              }`}
            >
              <input
                type="radio"
                name="mobile-eq-selector"
                value={eq}
                checked={selectedEquipment === eq}
                onChange={() => setSelectedEquipment(eq)}
                className="mr-3 h-4 w-4 text-green-600 focus:ring-green-500"
              />
              <span>{eq}</span>
            </label>
          ))}
        </div>

        <button 
          type="button"
          className="w-full min-h-[48px] bg-red-600 text-white border-none rounded-lg text-sm font-bold shadow-sm active:bg-red-700 transition-colors"
          onClick={() => openIsolationPlan(selectedEquipment)}
        >
          📂 Open Isolation Plan for {selectedEquipment}
        </button>
      </div>
    </div>
  );
}
