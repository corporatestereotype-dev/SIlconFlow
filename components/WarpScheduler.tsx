
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, Activity, Zap, Clock, Play, 
  Pause, RotateCcw, Target, BarChart3, ChevronDown, 
  Settings2, Sliders, ToggleLeft, ToggleRight, BarChart,
  ArrowRightLeft, TrendingUp, Network, Info, Layers, Boxes,
  Database, AlertCircle, RefreshCw, LayoutGrid
} from 'lucide-react';
import { Warp, HardwareStatus, ActionType } from '../types';
import { useChip, KERNEL_PROFILES } from '../ChipContext';
import { 
    BarChart as ReBarChart, Bar, ResponsiveContainer, 
    YAxis, XAxis, Cell, Tooltip, AreaChart, Area
} from 'recharts';

interface WarpWithHistory extends Warp {
  history: HardwareStatus[];
  lastCoreId: number | null;
  coreHistory: number[];
  latencySamples: number[];
  migrationPath?: { from: number; to: number; active: boolean };
  stallReason?: string;
  stallTimer?: number;
  instructionMix: {
    alu: number;
    mem: number;
    ctrl: number;
  };
  divergenceMask: boolean[];
}

interface MigrationEvent {
    id: number;
    warpId: number;
    from: number;
    to: number;
    latency: number;
    cycle: number;
}

interface ThroughputSample {
    cycle: number;
    completed: number;
}

const SM_COLORS = [
    '#6366f1', // SM_00: Indigo
    '#10b981', // SM_01: Emerald
    '#06b6d4', // SM_02: Cyan
    '#f59e0b', // SM_03: Amber
    '#8b5cf6', // SM_04: Violet
    '#f43f5e', // SM_05: Rose
    '#ec4899', // SM_06: Pink
    '#3b82f6'  // SM_07: Blue
];

const WarpScheduler: React.FC = () => {
    const { state, dispatch } = useChip();
    const [isPlaying, setIsPlaying] = useState(false);
    const [cycle, setCycle] = useState(0);
    const [activeWarpId, setActiveWarpId] = useState(0);
    const [isKernelOpen, setIsKernelOpen] = useState(false);
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [isMigrationEnabled, setIsMigrationEnabled] = useState(true);
    const [selectedWarpId, setSelectedWarpId] = useState<number | null>(null);
    const [migrationEvents, setMigrationEvents] = useState<MigrationEvent[]>([]);
    const [completedLatencies, setCompletedLatencies] = useState<number[]>([]);
    const [throughputHistory, setThroughputHistory] = useState<ThroughputSample[]>([]);
    
    const [warps, setWarps] = useState<WarpWithHistory[]>(
        Array.from({ length: 12 }, (_, i) => ({
            id: i,
            status: 'READY',
            progress: 0,
            stallCycles: 0,
            instructionsExecuted: 0,
            currentCoreId: i % 8,
            lastCoreId: null,
            coreHistory: [i % 8],
            migrationLatency: 0,
            history: Array(24).fill('IDLE'),
            latencySamples: [],
            instructionMix: { alu: 0, mem: 0, ctrl: 0 },
            divergenceMask: Array(32).fill(true)
        }))
    );

    const STALL_PROBABILITY = state.activeKernel.stallProbability;
    const MIGRATION_PROBABILITY = 0.008;
    const MIGRATION_COST = 12;
    const MEMORY_LATENCY = 15;
    const computeStep = state.activeKernel.computeIntensity / 2;

    const addMigrationEvent = (warpId: number, from: number, to: number) => {
      const event: MigrationEvent = {
        id: Date.now(),
        warpId,
        from,
        to,
        latency: MIGRATION_COST,
        cycle
      };
      setMigrationEvents(prev => [event, ...prev].slice(0, 5));
    };

    const tick = useCallback(() => {
        let completedInThisTick = 0;

        setWarps(prev => {
            const next = prev.map(w => ({ ...w }));
            
            next.forEach(w => {
                if (w.status === 'READY' && w.progress === 0 && !w.startCycle) {
                  w.startCycle = cycle;
                }

                if (w.status === 'MIGRATING') {
                  w.migrationLatency--;
                  if (w.migrationLatency <= 0) {
                    w.status = 'READY';
                    w.migrationLatency = 0;
                  }
                }

                if (w.status === 'STALLED') {
                    w.stallCycles++;
                    if ((w.stallTimer || 0) > 0) {
                        w.stallTimer = (w.stallTimer || 0) - 1;
                        if (w.stallTimer === 0) {
                          w.status = 'READY';
                          w.stallReason = undefined;
                        }
                    }
                }

                // Warp Migration Logic
                if (isMigrationEnabled && w.status === 'READY' && Math.random() < MIGRATION_PROBABILITY) {
                  const newCore = Math.floor(Math.random() * 8);
                  if (newCore !== w.currentCoreId) {
                    w.lastCoreId = w.currentCoreId;
                    w.currentCoreId = newCore;
                    w.coreHistory = [...w.coreHistory.slice(-5), newCore];
                    w.status = 'MIGRATING';
                    w.migrationLatency = MIGRATION_COST;
                    addMigrationEvent(w.id, w.lastCoreId, newCore);
                  }
                }
                
                const newHistory = [...w.history.slice(1), w.status];
                w.history = newHistory as HardwareStatus[];
            });

            let current = next[activeWarpId];
            if (current && (current.status === 'COMPUTING' || current.status === 'READY')) {
                if (Math.random() < STALL_PROBABILITY && current.progress < 90 && current.progress > 0) {
                    current.status = 'STALLED';
                    current.stallTimer = MEMORY_LATENCY;
                    current.stallReason = "Cache Miss";
                    const nextReadyId = next.findIndex(w => w.status === 'READY');
                    if (nextReadyId !== -1) setActiveWarpId(nextReadyId);
                } else {
                    current.status = 'COMPUTING';
                    current.progress += computeStep;
                    current.instructionsExecuted++;

                    const roll = Math.random() * 100;
                    if (roll < 70) current.instructionMix.alu++;
                    else if (roll < 90) current.instructionMix.mem++;
                    else current.instructionMix.ctrl++;

                    const maskChance = (10 - state.activeKernel.computeIntensity) / 20;
                    current.divergenceMask = current.divergenceMask.map(() => Math.random() > maskChance);
                    
                    if (current.progress >= 100) {
                        current.status = 'COMMITTING';
                        current.progress = 100;
                        current.endCycle = cycle;
                        const latency = current.endCycle - (current.startCycle || 0);
                        setCompletedLatencies(prev => [...prev, latency].slice(-100));
                        completedInThisTick++;
                        
                        const nextId = next.findIndex(w => w.status === 'READY');
                        if (nextId !== -1) setActiveWarpId(nextId);
                        
                        setTimeout(() => {
                            setWarps(ws => ws.map(w => w.id === current.id ? { 
                                ...w, 
                                status: 'READY', 
                                progress: 0, 
                                startCycle: undefined, 
                                divergenceMask: Array(32).fill(true) 
                            } : w));
                        }, 400);
                    }
                }
            } else {
                const nextId = next.findIndex(w => w.status === 'READY');
                if (nextId !== -1) setActiveWarpId(nextId);
            }
            return next;
        });

        if (cycle % 10 === 0) {
            setThroughputHistory(prev => [...prev, { cycle, completed: completedInThisTick }].slice(-30));
        }

        setCycle(c => c + 1);
    }, [activeWarpId, STALL_PROBABILITY, computeStep, cycle, isMigrationEnabled, state.activeKernel.id, state.activeKernel.computeIntensity]);

    useEffect(() => {
        if (isPlaying) {
            const timer = setInterval(tick, 100);
            return () => clearInterval(timer);
        }
    }, [isPlaying, tick]);

    const warpUtilizationData = useMemo(() => {
        return warps.map(w => ({
            name: `W${w.id.toString().padStart(2, '0')}`,
            utilization: w.progress,
            coreId: w.currentCoreId,
            status: w.status
        }));
    }, [warps]);

    const resetSimulation = () => {
        setCycle(0);
        setMigrationEvents([]);
        setCompletedLatencies([]);
        setThroughputHistory([]);
        setWarps(Array.from({ length: 12 }, (_, i) => ({
            id: i,
            status: 'READY',
            progress: 0,
            stallCycles: 0,
            instructionsExecuted: 0,
            currentCoreId: i % 8,
            lastCoreId: null,
            coreHistory: [i % 8],
            migrationLatency: 0,
            history: Array(24).fill('IDLE'),
            latencySamples: [],
            instructionMix: { alu: 0, mem: 0, ctrl: 0 },
            divergenceMask: Array(32).fill(true)
        })));
        setActiveWarpId(0);
    };

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 font-mono h-full shadow-2xl relative">
            {/* Header Section */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                        <Cpu className="text-indigo-400" /> Warp Profiler
                    </h2>
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest">Execution Trace & Thread Divergence</p>
                </div>

                <div className="flex gap-2 w-full xl:w-auto">
                    <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={`flex-1 xl:flex-none p-2 rounded-lg border flex items-center justify-center gap-2 px-6 text-xs font-bold transition-all ${
                            isPlaying ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        }`}
                    >
                        {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                        {isPlaying ? 'PAUSE' : 'PROFILE'}
                    </button>
                    <button 
                        onClick={() => setIsConfigOpen(!isConfigOpen)}
                        className={`p-2 rounded-lg border transition-all ${isConfigOpen ? 'bg-indigo-500 text-white border-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}
                        title="Configure Simulation Parameters"
                    >
                        <Settings2 size={16} />
                    </button>
                    <button 
                        onClick={resetSimulation}
                        className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white transition-all bg-slate-800"
                        title="Reset Simulation"
                    >
                        <RotateCcw size={16} />
                    </button>
                </div>
            </div>

            {/* Configuration Panel */}
            <AnimatePresence>
                {isConfigOpen && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }} 
                        className="mb-6 overflow-hidden bg-slate-950/80 border border-indigo-500/20 rounded-xl p-6"
                    >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Sliders size={14} /> Hardware Micro-Parameters
                            </h3>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => {
                                        const original = KERNEL_PROFILES.find(p => p.id === state.activeKernel.id);
                                        if (original) dispatch({ type: ActionType.SET_KERNEL, payload: original });
                                    }}
                                    className="text-[8px] font-bold text-slate-500 hover:text-indigo-400 uppercase tracking-widest flex items-center gap-1 border border-slate-800 px-2 py-1 rounded"
                                >
                                    <RefreshCw size={10} /> Restore Profile
                                </button>
                                <button 
                                    onClick={() => setIsMigrationEnabled(!isMigrationEnabled)} 
                                    className={`flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded text-[9px] font-bold transition-colors ${isMigrationEnabled ? 'text-indigo-400 border-indigo-500/50' : 'text-slate-600'}`}
                                >
                                    {isMigrationEnabled ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                                    PREEMPTION
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Stall Probability */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                        <AlertCircle size={12} className="text-rose-500" /> Stall Latency
                                    </label>
                                    <span className="text-[10px] font-mono text-rose-400">{(state.activeKernel.stallProbability * 100).toFixed(0)}%</span>
                                </div>
                                <input 
                                    type="range" min="0" max="1" step="0.01"
                                    value={state.activeKernel.stallProbability}
                                    onChange={(e) => dispatch({ type: ActionType.UPDATE_KERNEL_PARAMS, payload: { stallProbability: parseFloat(e.target.value) }})}
                                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                                />
                            </div>

                            {/* Compute Intensity */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                        <Zap size={12} className="text-amber-400" /> ALU Density
                                    </label>
                                    <span className="text-[10px] font-mono text-amber-400">{state.activeKernel.computeIntensity.toFixed(1)}/10</span>
                                </div>
                                <input 
                                    type="range" min="1" max="15" step="0.5"
                                    value={state.activeKernel.computeIntensity}
                                    onChange={(e) => dispatch({ type: ActionType.UPDATE_KERNEL_PARAMS, payload: { computeIntensity: parseFloat(e.target.value) }})}
                                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                />
                            </div>

                            {/* Memory Pressure */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                        <Database size={12} className="text-cyan-400" /> VRAM Pressure
                                    </label>
                                    <span className="text-[10px] font-mono text-cyan-400">{state.activeKernel.memoryPressure}/10</span>
                                </div>
                                <input 
                                    type="range" min="1" max="10" step="1"
                                    value={state.activeKernel.memoryPressure}
                                    onChange={(e) => dispatch({ type: ActionType.UPDATE_KERNEL_PARAMS, payload: { memoryPressure: parseInt(e.target.value) }})}
                                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Simulation Viewports */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 min-h-[400px]">
                {/* Left Sidebar: Telemetry Charts */}
                <div className="xl:col-span-3 space-y-4">
                    <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                        <h3 className="text-[9px] font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                            <Network size={12} className="text-indigo-400" /> SM Affinity
                        </h3>
                        <div className="h-40">
                            <ResponsiveContainer width="100%" height="100%">
                                <ReBarChart data={warpUtilizationData}>
                                    <XAxis dataKey="name" hide />
                                    <YAxis hide domain={[0, 100]} />
                                    <Bar dataKey="utilization">
                                        {warpUtilizationData.map((entry, index) => (
                                            <Cell key={index} fill={SM_COLORS[entry.coreId % SM_COLORS.length]} fillOpacity={entry.status === 'READY' ? 0.2 : 1} />
                                        ))}
                                    </Bar>
                                </ReBarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                        <h3 className="text-[9px] font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                            <TrendingUp size={12} /> Throughput Pulse
                        </h3>
                        <div className="h-24">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={throughputHistory}>
                                    <Area type="monotone" dataKey="completed" stroke="#8b5cf6" fill="#8b5cf622" strokeWidth={2} isAnimationActive={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                        <h3 className="text-[9px] font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                            <ArrowRightLeft size={12} /> Migration Log
                        </h3>
                        <div className="h-24 overflow-y-auto text-[8px] font-mono space-y-1 custom-scrollbar pr-2">
                            {migrationEvents.length === 0 ? (
                                <div className="text-slate-700 italic">No migrations...</div>
                            ) : (
                                migrationEvents.map(ev => (
                                    <div key={ev.id} className="text-violet-400">
                                        [{ev.cycle}] W_{ev.warpId} &rarr; SM_{ev.to}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content: Warp Cards and Details */}
                <div className="xl:col-span-9 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {warps.map(w => (
                            <WarpCard 
                                key={w.id} 
                                warp={w} 
                                isActive={activeWarpId === w.id} 
                                isSelected={selectedWarpId === w.id}
                                onSelect={() => setSelectedWarpId(selectedWarpId === w.id ? null : w.id)}
                            />
                        ))}
                    </div>

                    <AnimatePresence>
                        {selectedWarpId !== null && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                exit={{ opacity: 0, scale: 0.98 }} 
                                className="bg-slate-950 border border-indigo-500/30 rounded-xl p-5 shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl pointer-events-none" />
                                
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h4 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-widest">
                                            <Activity size={16} className="text-indigo-400" /> Warp Detail: W_{selectedWarpId.toString().padStart(2, '0')}
                                        </h4>
                                        <div className="flex flex-wrap gap-4 mt-2">
                                            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter flex items-center gap-1">
                                                <Boxes size={10} /> Active Lanes: {warps[selectedWarpId].divergenceMask.filter(Boolean).length}/32
                                            </span>
                                            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter flex items-center gap-1">
                                                <Layers size={10} /> SM Affinity: Core_{warps[selectedWarpId].currentCoreId}
                                            </span>
                                            {warps[selectedWarpId].status === 'STALLED' && (
                                                <span className="text-[8px] text-rose-500 font-bold uppercase tracking-tighter flex items-center gap-1 animate-pulse">
                                                    <AlertCircle size={10} /> Stalled: {warps[selectedWarpId].stallReason}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedWarpId(null)} 
                                        className="text-[10px] text-slate-500 hover:text-white bg-slate-800 px-3 py-1 rounded border border-slate-700 transition-colors"
                                    >
                                        DISMISS
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* SIMT Lane Grid */}
                                    <div className="space-y-3">
                                        <div className="text-[8px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                                            <LayoutGrid size={10} /> SIMT Occupancy Grid
                                        </div>
                                        <div className="grid grid-cols-8 gap-1 p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                                            {warps[selectedWarpId].divergenceMask.map((active, i) => (
                                                <motion.div 
                                                    key={i} 
                                                    className={`aspect-square rounded-[1px] ${active ? 'bg-indigo-500 shadow-[0_0_5px_rgba(99,102,241,0.5)]' : 'bg-slate-800/50'}`} 
                                                    animate={{ opacity: active ? [0.6, 1, 0.6] : 0.2 }}
                                                    transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.02 }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Core Affinity History */}
                                    <div className="space-y-3">
                                        <div className="text-[8px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                                            <ArrowRightLeft size={10} /> Migration History
                                        </div>
                                        <div className="flex items-center gap-2 h-10 bg-slate-900/50 rounded-lg border border-slate-800 p-2 overflow-x-auto no-scrollbar">
                                            {warps[selectedWarpId].coreHistory.map((core, i) => (
                                                <React.Fragment key={i}>
                                                    <div 
                                                        className="px-2 py-1 rounded text-[9px] font-bold border"
                                                        style={{ 
                                                            borderColor: SM_COLORS[core % SM_COLORS.length] + '44', 
                                                            color: SM_COLORS[core % SM_COLORS.length],
                                                            backgroundColor: SM_COLORS[core % SM_COLORS.length] + '11'
                                                        }}
                                                    >
                                                        SM_{core}
                                                    </div>
                                                    {i < warps[selectedWarpId].coreHistory.length - 1 && <span className="text-slate-700 text-[8px]">&rarr;</span>}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Pipeline Mix Statistics */}
                                    <div className="space-y-3">
                                        <div className="text-[8px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                                            <BarChart size={10} /> Pipeline Mix
                                        </div>
                                        <div className="flex items-end gap-2 h-12 px-3 bg-slate-900/50 rounded-lg border border-slate-800 pb-2">
                                            <MixBar label="ALU" value={warps[selectedWarpId].instructionMix.alu} color="bg-emerald-500" />
                                            <MixBar label="MEM" value={warps[selectedWarpId].instructionMix.mem} color="bg-cyan-500" />
                                            <MixBar label="CTRL" value={warps[selectedWarpId].instructionMix.ctrl} color="bg-amber-500" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

const MixBar = ({ label, value, color }: { label: string, value: number, color: string }) => {
    const height = Math.min(100, (value / (Math.max(1, value + 10))) * 100);
    return (
        <div className="flex-1 flex flex-col items-center gap-1 group">
            <div className="w-full bg-slate-800/50 rounded-t-[1px] relative overflow-hidden h-6">
                <motion.div className={`absolute bottom-0 left-0 right-0 ${color}`} initial={{ height: 0 }} animate={{ height: `${height}%` }} />
            </div>
            <span className="text-[6px] font-black text-slate-500">{label}</span>
        </div>
    );
};

const WarpCard: React.FC<{ warp: WarpWithHistory, isActive: boolean, isSelected: boolean, onSelect: () => void }> = ({ warp, isActive, isSelected, onSelect }) => {
    const colors: Record<HardwareStatus, string> = {
        READY: 'border-slate-800 text-slate-500 hover:border-slate-600',
        COMPUTING: 'border-emerald-500/50 bg-emerald-500/5 text-emerald-400 ring-1 ring-emerald-500/20',
        STALLED: 'border-rose-500 bg-rose-500/10 text-rose-400',
        MIGRATING: 'border-violet-500 bg-violet-500/20 text-violet-400',
        COMMITTING: 'border-cyan-500/50 bg-cyan-500/5 text-cyan-400',
        IDLE: 'border-slate-800 text-slate-700',
        FETCHING: 'border-slate-800 text-slate-400',
        BUSY: 'border-indigo-500 text-indigo-400'
    };

    return (
        <div 
            onClick={onSelect}
            className={`p-3 rounded border cursor-pointer transition-all duration-300 relative overflow-hidden ${
                colors[warp.status] || colors.READY
            } ${isActive ? 'scale-[1.03] border-indigo-500 bg-indigo-500/5 shadow-lg z-10' : ''} ${
                isSelected ? 'ring-1 ring-indigo-500 bg-slate-900 shadow-xl' : ''
            }`}
        >
            <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold">W_{warp.id.toString().padStart(2, '0')}</span>
                <span className="text-[8px] font-black uppercase tracking-tighter">{warp.status}</span>
            </div>
            <div className="h-1 bg-slate-950 rounded-full overflow-hidden mb-2">
                <motion.div 
                    className="h-full bg-current" 
                    animate={{ width: `${warp.progress}%` }} 
                    transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                />
            </div>
            <div className="flex justify-between text-[8px] opacity-70 font-mono">
                <span className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: SM_COLORS[warp.currentCoreId % SM_COLORS.length] }} />
                    SM_{warp.currentCoreId}
                </span>
                <span>{warp.progress.toFixed(0)}%</span>
            </div>
        </div>
    );
};

export default WarpScheduler;
