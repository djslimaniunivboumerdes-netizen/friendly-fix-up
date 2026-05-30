import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Node, Edge, Connection, useNodesState, useEdgesState,
  Controls, MiniMap, Background, BackgroundVariant, Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Play, Pause, Zap, AlertTriangle, Thermometer, Gauge, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const initialNodes: Node[] = [
  { id: 'feed', position: { x: 120, y: 180 }, data: { label: '101-F502\nFEED GAS', tag: '101-F502' }, style: { background: '#0f766e', color: '#fff', width: 130, border: '2px solid #67e8f9' } },
  { id: 'contactor', position: { x: 380, y: 140 }, data: { label: '101-G507\nAMINE CONTACTOR', tag: '101-G507' }, style: { background: '#166534', color: '#fff', width: 155 } },
  { id: 'regenerator', position: { x: 680, y: 210 }, data: { label: '104-F07.11\nMEA REGENERATOR', tag: '104-F07.11' }, style: { background: '#854d0e', color: '#fff', width: 150 } },
  { id: 'cryo', position: { x: 1020, y: 150 }, data: { label: '106-E05.20\nMAIN CRYOGENIC HX', tag: '106-E05.20' }, style: { background: '#1e40af', color: '#fff', width: 170 } },
  { id: 'mr-comp', position: { x: 850, y: 380 }, data: { label: 'K-502/K-503\nMR COMPRESSORS', tag: 'K-502' }, style: { background: '#7c3aed', color: '#fff', width: 160 } },
  { id: 'lng', type: 'output', position: { x: 1350, y: 160 }, data: { label: 'LNG STORAGE\n& EXPORT', tag: '105-K01' }, style: { background: '#0f766e', color: '#fff', width: 140 } },
];

const initialEdges: Edge[] = [
  { id: 'e1', source: 'feed', target: 'contactor', animated: true, style: { stroke: '#67e8f9', strokeWidth: 3 } },
  { id: 'e2', source: 'contactor', target: 'regenerator', animated: true, style: { stroke: '#86efac', strokeWidth: 3 } },
  { id: 'e3', source: 'regenerator', target: 'cryo', animated: true, style: { stroke: '#60a5fa', strokeWidth: 3 } },
  { id: 'e4', source: 'cryo', target: 'lng', animated: true, style: { stroke: '#a5f3fc', strokeWidth: 4 } },
  { id: 'e5', source: 'mr-comp', target: 'cryo', animated: true, style: { stroke: '#c4b5fd', strokeWidth: 3 }, type: 'smoothstep' },
];

export default function SmartFlow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isRunning, setIsRunning] = useState(true);
  const [selected, setSelected] = useState<Node | null>(null);

  const [kpis, setKpis] = useState({
    feedFlow: 852, co2Removal: 98.6, lngTemp: -161.4, power: 40.8, efficiency: 93.5
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (isRunning) {
        setKpis(prev => ({
          feedFlow: Math.floor(830 + Math.random() * 45),
          co2Removal: Number((97.5 + Math.random() * 1.8).toFixed(1)),
          lngTemp: Number((-163 + Math.random() * 3.5).toFixed(1)),
          power: Number((37 + Math.random() * 9).toFixed(1)),
          efficiency: Number((91 + Math.random() * 5).toFixed(1)),
        }));
      }
    }, 1600);
    return () => clearInterval(interval);
  }, [isRunning]);

  const onConnect = useCallback((params: Connection) => setEdges(eds => addEdge(params, eds)), [setEdges]);

  const onNodeClick = (_: any, node: Node) => setSelected(node);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4">
      <div className="max-w-[1950px] mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-5xl font-bold text-cyan-400 tracking-tight">GNL1Z DIGITAL TWIN</h1>
            <p className="text-slate-400 text-xl">AP-C3MR™ Liquefaction Process • Real-time Interactive PFD</p>
          </div>
          <Button onClick={() => setIsRunning(!isRunning)} size="lg" variant={isRunning ? "destructive" : "default"} className="gap-3">
            {isRunning ? <Pause size={24} /> : <Play size={24} />}
            {isRunning ? "PAUSE LIVE SIM" : "START LIVE SIM"}
          </Button>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* KPIs */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Zap className="text-amber-400" /> LIVE PROCESS KPIs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 text-lg">
                {Object.entries(kpis).map(([key, val]) => (
                  <div key={key} className="flex justify-between border-b border-slate-800 pb-3 last:border-0">
                    <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="font-mono font-semibold text-cyan-400">
                      {val}{key.includes('Temp') ? '°C' : key.includes('Flow') ? ' MMSCFD' : key.includes('Power') ? ' MW' : '%'}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Interactive PFD */}
          <div className="col-span-12 lg:col-span-6">
            <div className="relative h-[720px] border-2 border-slate-700 rounded-3xl overflow-hidden bg-[#02050f]">
              <img
                src="/pfd/gnl1z-pfd-labeled.png"
                alt="GL1Z PFD Background"
                className="absolute inset-0 w-full h-full object-contain opacity-70 z-0 pointer-events-none"
              />
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                fitView
                snapToGrid
                className="z-10"
              >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#334155" />
                <Controls />
                <MiniMap position="bottom-right" />
                <Panel position="top-left" className="bg-black/70 px-4 py-2 rounded text-xs font-mono text-cyan-400">
                  SONATRACH GL1Z • ARZEW
                </Panel>
              </ReactFlow>
            </div>
          </div>

          {/* Details + Safety */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            {selected ? (
              <Card className="bg-slate-900 border-cyan-500 sticky top-6">
                <CardHeader>
                  <CardTitle>{selected.data.label}</CardTitle>
                  <Badge variant="outline">{selected.data.tag}</Badge>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Temperature<br /><span className="text-2xl font-mono text-emerald-400">42.3°C</span></div>
                    <div>Pressure<br /><span className="text-2xl font-mono text-emerald-400">61 bar</span></div>
                  </div>
                  <Separator />
                  <Button className="w-full" onClick={() => window.open(`/equipment/${selected.data.tag}`, '_blank')}>
                    OPEN EQUIPMENT DETAIL + P&ID
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-80 flex items-center justify-center text-slate-500 border-dashed border-slate-700">
                Click any equipment node
              </Card>
            )}

            <Card className="bg-slate-900 border-rose-900/50">
              <CardHeader>
                <CardTitle className="text-rose-400 flex items-center gap-2"><AlertTriangle size={20} /> SAFETY INTERLOCKS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between"><span>CO₂ in Sweet Gas</span><Badge>OK</Badge></div>
                <div className="flex justify-between"><span>MEA High Temp</span><Badge variant="outline">MONITOR</Badge></div>
                <div className="flex justify-between"><span>Compressor Surge</span><Badge>OK</Badge></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
