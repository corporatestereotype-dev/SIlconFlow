
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDownUp, Zap, Radio, Network, Cpu, Database, HardDrive, Share2, Activity, Clock } from 'lucide-react';
import { useChip } from '../ChipContext';

const PCIeInterconnect: React.FC = () => {
    const { state } = useChip();
    const { pcie } = state;

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl relative overflow-hidden group">
            {/* Background PCB Grid Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                style={{ backgroundImage: 'radial-gradient(#818cf8 1px, transparent 1px)', backgroundSize: '16px 16px' }} />

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Share2 size={16} className="text-indigo-400" /> PCIe 5.0 System Fabric
                    </h3>
                    <div className="flex gap-3 mt-1">
                        <span className="text-[9px] text-slate-500 font-mono">Link State: <span className="text-emerald-400">Gen5 x16</span></span>
                        <span className="text-[9px] text-slate-500 font-mono">Max BW: <span className="text-slate-300">64.0 GB/s</span></span>
                    </div>
                </div>
                <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-md">
                    <div className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Active Traffic</div>
                    <div className="text-sm font-mono font-bold text-white">{pcie.utilization.toFixed(1)}%</div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-10">
                {/* Latency Matrix */}
                <div className="grid grid-cols-3 gap-4">
                    <LatencyCard label="Host CPU" value={pcie.latencyNs.cpu} color="emerald" icon={<Cpu size={12} />} />
                    <LatencyCard label="System RAM" value={pcie.latencyNs.ram} color="cyan" icon={<Database size={12} />} />
                    <LatencyCard label="NVMe Storage" value={pcie.latencyNs.ssd} color="amber" icon={<HardDrive size={12} />} isMicro />
                </div>

                {/* High-Fidelity Interconnect Schematic */}
                <div className="relative h-48 bg-slate-950/80 rounded-xl border border-slate-800 p-6 overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-indigo-500/5 to-transparent" />
                    
                    {/* Bus Visualization */}
                    <div className="relative z-10 h-full flex items-center justify-between">
                        {/* Sources */}
                        <div className="flex flex-col justify-around h-full w-24">
                            <SourcePort id="CPU" color="emerald" active={state.globalWorkload > 0} throughput={pcie.sourceThroughput.cpu} />
                            <SourcePort id="RAM" color="cyan" active={state.globalWorkload > 0} throughput={pcie.sourceThroughput.ram} />
                            <SourcePort id="SSD" color="amber" active={state.globalWorkload > 20} throughput={pcie.sourceThroughput.ssd} />
                        </div>

                        {/* Bridge / Backbone */}
                        <div className="flex-1 h-32 relative mx-4">
                            {/* Horizontal Highway */}
                            <div className="absolute top-1/2 left-0 right-0 h-4 -translate-y-1/2 bg-slate-900 border-y border-slate-800 flex items-center">
                                <div className="w-full h-px bg-slate-700/30" />
                            </div>

                            {/* Data Pulses from Sources */}
                            <DataPulse color="#10b981" y="15%" active={state.globalWorkload > 0} delay={0} />
                            <DataPulse color="#06b6d4" y="50%" active={state.globalWorkload > 0} delay={0.2} />
                            <DataPulse color="#f59e0b" y="85%" active={state.globalWorkload > 20} delay={0.4} />
                            
                            {/* Vertical Connectors */}
                            <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-800" />
                            <div className="absolute right-0 top-0 bottom-0 w-px bg-slate-800" />
                        </div>

                        {/* Sink (GPU) */}
                        <div className="flex flex-col justify-center h-full w-24 items-end">
                            <div className="text-center p-3 rounded-lg border border-indigo-500/30 bg-indigo-500/5">
                                <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Target</div>
                                <Activity size={24} className="mx-auto text-indigo-400 animate-pulse" />
                                <div className="text-[8px] text-slate-500 font-mono mt-1">Accelerator_X1</div>
                            </div>
                        </div>
                    </div>

                    <div className="absolute bottom-2 left-6 text-[7px] text-slate-600 font-black uppercase tracking-[0.3em]">
                        High Fidelity Interconnect Routing (DMA-MODE)
                    </div>
                </div>

                {/* Performance Dashboard */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[8px] text-slate-500 uppercase font-black">H2D Throughput</span>
                            <Zap size={10} className="text-indigo-400" />
                        </div>
                        <div className="text-xl font-mono font-bold text-white">{pcie.h2dRate.toFixed(2)} <span className="text-xs text-slate-500">GB/s</span></div>
                        <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div className="h-full bg-indigo-500" animate={{ width: `${(pcie.h2dRate/32)*100}%` }} />
                        </div>
                    </div>
                    <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[8px] text-slate-500 uppercase font-black">Link Stability</span>
                            <Activity size={10} className="text-emerald-400" />
                        </div>
                        <div className="text-xl font-mono font-bold text-emerald-400">99.998%</div>
                        <div className="text-[8px] text-slate-500 mt-1 uppercase">BER: 10^-12 (Target Met)</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const LatencyCard = ({ label, value, color, icon, isMicro }: any) => {
    const colorMap: any = {
        emerald: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5',
        cyan: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5',
        amber: 'text-amber-400 border-amber-500/30 bg-amber-500/5',
    };
    return (
        <div className={`p-3 rounded-xl border ${colorMap[color]} transition-all hover:scale-[1.02]`}>
            <div className="flex items-center gap-2 text-[8px] uppercase font-black mb-1 opacity-70">
                {icon} {label}
            </div>
            <div className="flex items-baseline gap-1">
                <div className="text-lg font-mono font-bold">{isMicro ? (value/1000).toFixed(2) : Math.round(value)}</div>
                <div className="text-[10px] opacity-50 font-black">{isMicro ? 'μs' : 'ns'}</div>
            </div>
            <div className="mt-1 flex items-center gap-1">
                <Clock size={8} className="opacity-40" />
                <span className="text-[7px] uppercase font-bold opacity-40">Wire Latency</span>
            </div>
        </div>
    );
};

const SourcePort = ({ id, color, active, throughput }: any) => {
    const colorClasses: any = {
        emerald: 'text-emerald-400 border-emerald-500/30',
        cyan: 'text-cyan-400 border-cyan-500/30',
        amber: 'text-amber-400 border-amber-500/30',
    };
    return (
        <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg border ${colorClasses[color]} bg-slate-900 flex items-center justify-center relative`}>
                <span className="text-[8px] font-black">{id}</span>
                {active && <motion.div className={`absolute -inset-1 rounded-lg border-2 border-current opacity-20`} animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }} transition={{ repeat: Infinity, duration: 2 }} />}
            </div>
            <div className="flex-1">
                <div className="text-[7px] text-slate-500 font-bold uppercase">Rate</div>
                <div className="text-[10px] font-mono font-bold text-slate-300">{throughput.toFixed(1)} GB/s</div>
            </div>
        </div>
    );
};

const DataPulse = ({ color, y, active, delay }: any) => (
    <div className="absolute left-0 right-0 h-px pointer-events-none" style={{ top: y }}>
        {active && (
            <motion.div 
                className="absolute w-12 h-[2px] rounded-full blur-[1px]" 
                style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
                initial={{ left: '-10%' }}
                animate={{ left: '110%' }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear", delay }}
            />
        )}
    </div>
);

export default PCIeInterconnect;
