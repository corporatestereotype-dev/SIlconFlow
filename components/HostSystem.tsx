
import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Database, HardDrive, Thermometer, Activity, Server, Share2 } from 'lucide-react';
import { useChip } from '../ChipContext';

const HostSystem: React.FC = () => {
    const { state } = useChip();
    const { host, pcie } = state;

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative group">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <Server className="text-emerald-400 w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-white uppercase tracking-tighter">System Host Complex</h2>
                        <p className="text-[10px] text-slate-500 font-mono italic">Workstation Node_01</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <span className="text-[9px] text-slate-500 uppercase font-bold block">Bus Link</span>
                        <div className="flex items-center gap-1.5 justify-end">
                            <Share2 size={10} className="text-indigo-400" />
                            <span className="text-[10px] text-indigo-300 font-mono">ACTIVE</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* CPU Fabric */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase font-bold">
                        <span className="flex items-center gap-1"><Cpu size={12} className="text-emerald-400" /> Host Processor (Octa-Core)</span>
                        <div className="flex items-center gap-2">
                             <span className="text-[8px] text-slate-600 font-black">IO_ACTIVITY:</span>
                             <div className={`w-1.5 h-1.5 rounded-full ${pcie.sourceThroughput.cpu > 1 ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-slate-800'}`} />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {host.cpuCores.map((usage, i) => (
                            <div key={i} className="bg-slate-950/50 p-2 rounded border border-slate-800 space-y-2">
                                <div className="flex justify-between text-[7px] text-slate-500 font-black">
                                    <span>CORE_{i}</span>
                                    <span>{usage.toFixed(0)}%</span>
                                </div>
                                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div 
                                        className="h-full bg-emerald-500"
                                        animate={{ width: `${usage}%` }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* System RAM & Storage */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase font-bold">
                            <span className="flex items-center gap-1"><Database size={12} className="text-cyan-400" /> DDR5 Bank Cluster</span>
                        </div>
                        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-4 relative overflow-hidden">
                            <div className="flex justify-between items-end">
                                <span className="text-xl font-mono font-bold text-white">{host.ramUsage.toFixed(1)} <span className="text-[10px] text-slate-500">GB</span></span>
                                <div className={`w-2 h-2 rounded-full mb-1 ${pcie.sourceThroughput.ram > 2 ? 'bg-cyan-400 animate-ping' : 'bg-slate-800'}`} />
                            </div>
                            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                                    animate={{ width: `${(host.ramUsage / 64) * 100}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-[7px] text-slate-600 font-black uppercase">
                                <span>MEM_CLOCK: 6400MT/s</span>
                                <span>ECC_ENABLED</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase font-bold">
                            <span className="flex items-center gap-1"><HardDrive size={12} className="text-amber-400" /> Storage Fabric</span>
                        </div>
                        <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 grid grid-cols-2 gap-2 h-full relative">
                            <div className="flex flex-col justify-center">
                                <div className="text-[7px] text-slate-500 uppercase font-bold">Read IOPS</div>
                                <div className="text-xs font-mono font-bold text-amber-500">{(host.ssdReadIOPS / 1000).toFixed(1)}k</div>
                            </div>
                            <div className="flex flex-col justify-center">
                                <div className="text-[7px] text-slate-500 uppercase font-bold">Write IOPS</div>
                                <div className="text-xs font-mono font-bold text-rose-400">{(host.ssdWriteIOPS / 1000).toFixed(1)}k</div>
                            </div>
                            <div className="col-span-2 flex items-center justify-between border-t border-slate-800 pt-2 mt-1">
                                <div className="flex items-center gap-1">
                                    <Thermometer size={10} className="text-rose-400" />
                                    <span className="text-[8px] text-slate-400 font-mono">{host.ssdTemp.toFixed(1)}°C</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Activity size={10} className="text-emerald-400" />
                                    <span className="text-[8px] text-emerald-500 uppercase font-black">Healthy</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HostSystem;
