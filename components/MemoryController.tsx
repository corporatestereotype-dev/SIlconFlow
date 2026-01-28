
import React from 'react';
import { Database, Activity, AlertCircle } from 'lucide-react';
import { useChip } from '../ChipContext';

interface Props {
    bankId: string;
    load: number;
}

const MemoryController: React.FC<Props> = ({ bankId, load }) => {
    const { state } = useChip();
    const channels = state.memoryChannels.slice(0, 3); // Showing subset per controller

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-full shadow-lg">
            <div className="bg-slate-800/50 p-3 border-b border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-2 text-cyan-400">
                    <Database size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{bankId}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Activity size={12} className={`${load > 70 ? 'text-amber-400 animate-pulse' : 'text-emerald-500'}`} />
                    <span className="text-[9px] font-mono text-slate-400">{load.toFixed(1)}%</span>
                </div>
            </div>

            <div className="p-4 space-y-4 flex-1">
                <div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase mb-2">Interface Channels</div>
                    <div className="space-y-2">
                        {channels.map((ch, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-3">
                                <span className="text-[9px] font-mono text-slate-500 w-8">CH_{idx}</span>
                                <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-300 ${ch.status === 'BUSY' ? 'bg-cyan-500' : 'bg-slate-700'}`}
                                        style={{ width: `${Math.max(10, ch.load)}%` }}
                                    />
                                </div>
                                <div className={`w-1.5 h-1.5 rounded-full ${ch.status === 'BUSY' ? 'bg-cyan-400 animate-ping' : 'bg-slate-700'}`} />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-2 border-t border-slate-800">
                    <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase mb-2">
                        <span>Transaction Queue</span>
                        <span>LEN: {Math.floor(load / 10)}</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div 
                                key={i} 
                                className={`h-1.5 rounded-sm transition-opacity duration-300 ${
                                    i < Math.floor(load / 25) ? 'bg-indigo-500/50' : 'bg-slate-800'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {load > 85 && (
                <div className="bg-rose-500/20 p-2 flex items-center justify-center gap-2 border-t border-rose-500/30">
                    <AlertCircle size={12} className="text-rose-400 animate-bounce" />
                    <span className="text-[8px] font-black text-rose-400 uppercase tracking-tighter">Congestion Throttling</span>
                </div>
            )}
        </div>
    );
};

export default MemoryController;
