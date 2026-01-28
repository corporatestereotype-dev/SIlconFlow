
import React from 'react';
import { Cpu, Layers, Activity, LayoutGrid, ToggleLeft, ToggleRight, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useChip } from '../ChipContext';
import { ActionType } from '../types';

const Dispatcher: React.FC = () => {
    const { state, dispatch } = useChip();
    const { globalWorkload, pendingKernels, activeGridBlocks, loadBalancingEnabled } = state;

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                        <Cpu className="text-indigo-400 w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-white uppercase tracking-tighter">Global Dispatcher</h2>
                        <p className="text-[10px] text-slate-500 font-mono">v4.2-X1-STABLE</p>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] text-slate-500 uppercase font-bold text-[8px]">Dynamic Balancing</span>
                    <button 
                        onClick={() => dispatch({ type: ActionType.TOGGLE_BALANCING })}
                        className={`flex items-center gap-1 transition-colors ${loadBalancingEnabled ? 'text-emerald-400' : 'text-slate-600'}`}
                    >
                        {loadBalancingEnabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                        <span className="text-[8px] font-black uppercase">{loadBalancingEnabled ? 'ON' : 'OFF'}</span>
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                <div className="space-y-3">
                    <div className="flex justify-between items-end">
                        <label className="text-[10px] text-slate-400 uppercase font-bold">Inject Workload (Kernels/s)</label>
                        <span className="text-lg font-mono font-bold text-indigo-400">{globalWorkload}</span>
                    </div>
                    <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={globalWorkload}
                        onChange={(e) => dispatch({ type: ActionType.SET_WORKLOAD, payload: parseInt(e.target.value) })}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <MetricCard label="Pending Kernels" value={pendingKernels} icon={<Layers size={14} />} />
                    <MetricCard label="Grid Blocks" value={activeGridBlocks} icon={<LayoutGrid size={14} />} />
                </div>

                <div className="pt-4 border-t border-slate-800">
                    <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-2">
                        <span>BLOCK_DISTRIBUTION_MAP</span>
                        <div className="flex items-center gap-2">
                            <Share2 size={10} className={loadBalancingEnabled ? 'text-emerald-400 animate-pulse' : 'text-slate-700'} />
                            <span>{Math.floor(activeGridBlocks / 4)}% SATURATED</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-10 gap-1">
                        {Array.from({ length: 40 }).map((_, i) => (
                            <div 
                                key={i} 
                                className={`h-1 rounded-full transition-all duration-500 ${
                                    i < activeGridBlocks ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-slate-800'
                                }`} 
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const MetricCard: React.FC<{ label: string, value: number, icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
        <div className="space-y-1">
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tight">{label}</p>
            <p className="text-lg font-mono font-bold text-white">{value}</p>
        </div>
        <div className="p-1.5 bg-slate-800 rounded text-slate-400">
            {icon}
        </div>
    </div>
);

export default Dispatcher;
