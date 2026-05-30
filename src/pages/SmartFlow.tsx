import React, { useState, useEffect } from 'react';
import { Play, Pause, Zap, AlertTriangle, ThermometerSun, Gauge } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const SmartFlow = () => {
  const [isRunning, setIsRunning] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [kpis, setKpis] = useState({
    feedFlow: 845,
    co2Removal: 98.7,
    lngTemp: -161.5,
    mrPower: 38.4,
    efficiency: 93.2,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (isRunning) {
        setKpis(prev => ({
          ...prev,
          feedFlow: Math.floor(830 + Math.random() * 30),
          co2Removal: Number((97.8 + Math.random() * 1.5).toFixed(1)),
          lngTemp: Number((-162 + Math.random() * 2).toFixed(1)),
        }));
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [isRunning]);

  const equipment = [
    { id: '101-F502', tag: '101-F502', name: 'Feed Gas Inlet', section: 'Pre-Treatment', status: 'normal', temp: 38, press: 65 },
    { id: '101-G507', tag: '101-G507', name: 'Amine Contactor', section: 'MEA CO2 Removal', status: 'normal', temp: 48, press: 62 },
    { id: '104-F07.11', tag: '104-F07.11', name: 'MEA Regenerator', section: 'MEA Regeneration', status: 'normal', temp: 128, press: 1.8 },
    { id: '106-E05.20', tag: '106-E05.20', name: 'Main Cryogenic Exchanger', section: 'Liquefaction', status: 'normal', temp: -148, press: 54 },
    { id: 'K-502', tag: 'K-502', name: 'Mixed Refrigerant Compressor', section: 'Refrigeration', status: 'running', temp: 85, press: 45 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-6">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold text-cyan-400">GNL1Z DIGITAL TWIN</h1>
            <p className="text-slate-400">AP-C3MR™ Liquefaction Process • Live Simulation</p>
          </div>
          <Button onClick={() => setIsRunning(!isRunning)} variant={isRunning ? "destructive" : "default"} className="gap-2">
            {isRunning ? <Pause size={18} /> : <Play size={18} />}
            {isRunning ? "PAUSE" : "START"} SIMULATION
          </Button>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* LEFT: KPIs + Hierarchy */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Zap className="text-amber-400" /> Process KPIs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {Object.entries(kpis).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-slate-400 capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="font-mono text-cyan-400">
                      {v}{k.includes('Temp') ? '°C' : k.includes('Flow') ? ' MMSCFD' : k.includes('Removal') ? '%' : ' MW'}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle>Equipment Hierarchy</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <div className="border-l-2 border-cyan-500 pl-3">1. Pre-Treatment (MEA)</div>
                <div className="pl-6 text-emerald-400">• 101-F502 Feed Gas</div>
                <div className="pl-6 text-emerald-400">• 101-G507 Amine Contactor</div>
                <div className="border-l-2 border-cyan-500 pl-3 mt-4">2. Dehydration & Fractionation</div>
                <div className="border-l-2 border-cyan-500 pl-3 mt-4">3. Liquefaction (MR Cycle)</div>
                <div className="border-l-2 border-cyan-500 pl-3 mt-4">4. LNG Storage & Export</div>
              </CardContent>
            </Card>
          </div>

          {/* CENTER: Interactive PFD */}
          <div className="col-span-12 lg:col-span-6">
            <Card className="bg-[#0a0f1c] border-2 border-slate-700 overflow-hidden h-[680px] relative">
              <img 
                src="/pfd/gnl1z-pfd-labeled.png" 
                alt="GL1Z PFD" 
                className="absolute inset-0 w-full h-full object-contain opacity-90"
              />

              {/* Interactive hotspots */}
              {equipment.map((eq, i) => (
                <div
                  key={i}
                  className="absolute w-6 h-6 rounded-full bg-emerald-500/80 ring-4 ring-emerald-400/30 cursor-pointer hover:scale-125 transition-transform"
                  style={{ top: `${20 + i * 12}%`, left: `${15 + (i % 3) * 22}%` }}
                  onClick={() => setSelected(eq)}
                >
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/90 text-[10px] px-2 py-0.5 rounded whitespace-nowrap">
                    {eq.tag}
                  </div>
                </div>
              ))}

              {/* Refrigeration Loop Animation */}
              <div className="absolute top-[42%] left-[52%] w-64 h-64 border border-dashed border-cyan-400/40 rounded-full animate-[spin_30s_linear_infinite]">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-mono text-cyan-400 tracking-[4px]">MR CYCLE</div>
              </div>
            </Card>
          </div>

          {/* RIGHT: Details + Interlocks */}
          <div className="col-span-12 lg:col-span-3">
            {selected ? (
              <Card className="bg-slate-900 border-slate-700 sticky top-6">
                <CardHeader>
                  <CardTitle>{selected.name}</CardTitle>
                  <Badge variant="outline">{selected.tag}</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Temp: <span className="font-mono">{selected.temp}°C</span></div>
                    <div>Press: <span className="font-mono">{selected.press} bar</span></div>
                  </div>
                  <Separator />
                  <Button className="w-full" onClick={() => window.open(`/equipment/${selected.tag}`, '_blank')}>
                    Open Equipment Detail + P&ID
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-slate-900/50 border-dashed border-slate-700 h-full flex items-center justify-center text-slate-500">
                Click on equipment in the PFD
              </Card>
            )}

            <Card className="mt-6 bg-slate-900 border-rose-900/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-rose-400"><AlertTriangle size={18} /> Active Interlocks</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <div className="flex justify-between"><span>CO₂ Absorber Outlet</span><Badge variant="secondary">OK</Badge></div>
                <div className="flex justify-between"><span>MEA High Temperature</span><Badge variant="outline">MONITOR</Badge></div>
                <div className="flex justify-between"><span>MR Compressor Surge</span><Badge variant="secondary">OK</Badge></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartFlow;
