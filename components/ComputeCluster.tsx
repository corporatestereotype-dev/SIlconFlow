
import React from 'react';
import { Zap, MoveUp, MoveDown, Thermometer, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChip } from '../ChipContext';

interface Props {
    clusterId: number;
    intensity: number;
}

const ComputeCluster: React.FC<Props> = ({ clusterId }) => {
    const { state } = useChip();
    const core = state.computeCores[clusterId];
    
    // Thermal color calculation
    const getThermalColor = (temp: number) => {
        if (temp > 90) return 'text-rose-500';
        if (temp > 70) return 'text-orange-400';
        if (temp > 50) return 'text-amber-400';
        return 'text-indigo-400';
    };

    const getHeatBG = (temp: number) => {
        const intensity = Math.max(0, (temp - 40) / 60);
        return `rgba(244, 63, 94, ${intensity * 0.15})`;
    };

    return (
        <div className={`bg-slate-900/40 border rounded-xl p-4 flex flex-col gap-4 relative overflow-hidden group transition-all duration-500 ${
            core.isThrottled ? 'border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'border-slate-800 hover:border-indigo-500/50'
        }`} style={{ backgroundColor: getHeatBG(core.temp) }}>
            
            {core.isThrottled && (
                <div className="absolute top-0 right-0 bg-rose-500 text-[7px] px-1.5 py-0.5 font-black uppercase text-white animate-pulse">
                    Thermal Throttle Active
                </div>
            )}

            <div className="flex justify-between items-start z-10">
                <div className="space-y-1">
                    <div className={`text-[10px] font-bold uppercase flex items-center gap-1 ${getThermalColor(core.temp)}`}>
                        <Zap size={10} /> SM_{clusterId.toString().padStart(2, '0')}
                    </div>
                    <div className="text-xs font-mono font-bold text-slate-300">STREAMING_MP</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500">
                        <Thermometer size={10} className={getThermalColor(core.temp)} />
                        {core.temp.toFixed(1)}°C
                    </div>
                    {core.isThrottled && <AlertTriangle size={12} className="text-rose-500" />}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 relative z-10">
                <div className="space-y-2">
                    <label className="text-[8px] text-slate-500 font-bold uppercase tracking-widest flex justify-between">
                        <span>ALU Fabric</span>
                        <span className="text-slate-400">{(core.utilization).toFixed(0)}%</span>
                    </label>
                    <div className="grid grid-cols-4 gap-1">
                        {Array.from({ length: 16 }).map((_, i) => (
                            <div 
                                key={i} 
                                className={`aspect-square rounded-[1px] transition-all duration-300 ${
                                    core.status === 'BUSY' && Math.random() * 100 < core.utilization
                                    ? (core.temp > 80 ? 'bg-orange-500' : 'bg-indigo-500') 
                                    : 'bg-slate-800'
                                }`} 
                            />
                        ))}
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Register File</label>
                    <div className="flex flex-col gap-1">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="flex gap-1">
                                {Array.from({ length: 2 }).map((_, j) => (
                                    <div 
                                        key={j} 
                                        className={`h-1.5 flex-1 rounded-[1px] ${
                                            core.status === 'BUSY' && Math.random() * 100 < core.utilization ? 'bg-indigo-500/30' : 'bg-slate-800'
                                        }`} 
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center relative z-10">
                <div className="text-[9px] text-slate-500">Warps: {core.activeWarps}</div>
                <div className="h-1 w-12 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-emerald-500" animate={{ width: `${core.utilization}%` }} />
                </div>
            </div>
        </div>
    );
};

export default ComputeCluster;
