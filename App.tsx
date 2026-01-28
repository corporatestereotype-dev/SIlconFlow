
import React from 'react';
import { Cpu, Zap, Activity, Database, LayoutGrid, Terminal, Radio } from 'lucide-react';
import { ChipProvider, useChip } from './ChipContext';
import Dispatcher from './components/Dispatcher';
import MemoryController from './components/MemoryController';
import ComputeCluster from './components/ComputeCluster';
import SystemTelemetry from './components/SystemTelemetry';
import WarpScheduler from './components/WarpScheduler';
import HostSystem from './components/HostSystem';
import PCIeInterconnect from './components/PCIeInterconnect';
import WorkloadPipeline from './components/WorkloadPipeline';
import SystemBusTrace from './components/SystemBusTrace';
import ArchitectAdvisor from './components/ArchitectAdvisor';

const AppContent: React.FC = () => {
    const { state } = useChip();
    const { flowPhase, activeTask } = state;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-mono p-4 lg:p-8 relative overflow-hidden">
            <SystemBusTrace />
            <ArchitectAdvisor />

            <div className="fixed inset-0 pointer-events-none opacity-20 z-[-1]">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-cyan-900 rounded-full blur-[100px]"></div>
            </div>

            <header className="max-w-[1600px] mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-6 border-b border-slate-800 pb-6 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-600 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.4)]">
                        <Cpu size={32} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tighter uppercase italic text-white">SiliconFlow X1</h1>
                        <p className="text-xs text-slate-500 uppercase tracking-[0.3em]">Hardware Architect Dashboard</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-8">
                    <div className="hidden xl:flex items-center gap-4 px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-lg">
                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest border-r border-slate-700 pr-4 mr-2">System Phase</div>
                        <div className="flex gap-4 items-center">
                            <PhaseIndicator label="Orch" active={flowPhase === 'ORCHESTRATING'} color="text-indigo-400" />
                            <PhaseIndicator label="Fetch" active={flowPhase === 'FETCHING'} color="text-emerald-400" />
                            <PhaseIndicator label="Exec" active={flowPhase === 'EXECUTING'} color="text-amber-400" />
                            <PhaseIndicator label="Commit" active={flowPhase === 'COMMITTING'} color="text-cyan-400" />
                        </div>
                    </div>
                    <Dispatcher />
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto grid grid-cols-12 gap-6 relative z-10">
                <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
                    <WorkloadPipeline />
                    <HostSystem />
                </div>

                <div className="col-span-12 lg:col-span-6 flex flex-col gap-6">
                    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                <Zap size={14} /> Accelerator Compute Fabric
                            </h2>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 italic">
                                <Terminal size={12} /> SM Trace Active
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-4">
                            {state.computeCores.map((core: any, i: number) => (
                                <ComputeCluster key={i} clusterId={i} intensity={state.globalWorkload} />
                            ))}
                        </div>

                        <div className="mt-8">
                            <WarpScheduler />
                        </div>
                    </div>
                    <PCIeInterconnect />
                </div>

                <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
                    <SystemTelemetry />
                    <div className="flex flex-col gap-4">
                        <MemoryController bankId="HBM_CONTROLLER_0" load={state.globalWorkload * 0.8} />
                        <MemoryController bankId="L3_CACHE_SLICER" load={state.globalWorkload * 0.4} />
                    </div>
                </div>
            </main>
        </div>
    );
};

const PhaseIndicator = ({ label, active, color }: any) => (
    <div className={`flex flex-col items-center transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-20'}`}>
        <span className={`text-[8px] font-black uppercase mb-1 ${active ? color : 'text-slate-500'}`}>{label}</span>
        <div className={`w-12 h-1 rounded-full ${active ? `bg-current ${color}` : 'bg-slate-800'}`} />
    </div>
);

const App: React.FC = () => (
    <ChipProvider>
        <AppContent />
    </ChipProvider>
);

export default App;
