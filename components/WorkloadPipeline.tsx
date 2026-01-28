
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ListChecks, BrainCircuit, Briefcase, Activity, ChevronRight, Zap, Target, Loader2, PlayCircle, Globe, Atom } from 'lucide-react';
import { useChip, ENTERPRISE_TASKS } from '../ChipContext';
import { ActionType, EnterpriseTask } from '../types';

const WorkloadPipeline: React.FC = () => {
    const { state, dispatch } = useChip();
    const { activeTask } = state;

    const handleTaskSelect = (task: EnterpriseTask) => {
        dispatch({ type: ActionType.SET_TASK, payload: task });
        if (!state.isRunning) {
            dispatch({ type: ActionType.START });
        }
    };

    const getTaskIcon = (task: EnterpriseTask) => {
        if (task.category === 'AI') return <BrainCircuit size={16} />;
        if (task.category === 'BUSINESS') return <Briefcase size={16} />;
        if (task.name.includes('Weather') || task.name.includes('Climate')) return <Globe size={16} />;
        return <Atom size={16} />;
    };

    const getCategoryStyles = (category: string) => {
        switch (category) {
            case 'AI': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            case 'BUSINESS': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'SCIENCE': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl flex flex-col h-full shadow-2xl relative overflow-hidden group">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <ListChecks className="text-indigo-400 w-5 h-5" />
                    <h2 className="text-xs font-bold text-white uppercase tracking-[0.2em]">Global Orchestrator</h2>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Active Threads:</span>
                    <span className="text-[10px] text-indigo-400 font-mono font-bold">12,402</span>
                </div>
            </div>

            {/* Pipeline List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Target size={12} /> Enterprise & HPC Use Cases
                </div>
                
                {ENTERPRISE_TASKS.map((task) => {
                    const isActive = activeTask?.id === task.id;
                    
                    return (
                        <motion.button
                            key={task.id}
                            onClick={() => handleTaskSelect(task)}
                            whileHover={{ x: 4 }}
                            className={`w-full text-left p-3 rounded-lg border transition-all relative overflow-hidden group ${
                                isActive 
                                ? 'bg-indigo-500/10 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.15)]' 
                                : 'bg-slate-950/40 border-slate-800 hover:border-slate-600'
                            }`}
                        >
                            {/* Active Scanline Effect */}
                            {isActive && (
                                <motion.div 
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/5 to-transparent pointer-events-none"
                                    animate={{ x: ['-100%', '200%'] }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                                />
                            )}

                            <div className="flex items-start gap-3 relative z-10">
                                <div className={`p-2 rounded-md border ${getCategoryStyles(task.category)}`}>
                                    {getTaskIcon(task)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`text-[10px] font-black uppercase tracking-tighter ${isActive ? 'text-indigo-400' : 'text-slate-300'}`}>
                                            {task.name}
                                        </span>
                                        {isActive && <Activity size={10} className="text-indigo-500 animate-pulse" />}
                                    </div>
                                    <p className="text-[9px] text-slate-500 leading-tight mb-2 line-clamp-1">{task.description}</p>
                                    
                                    {/* Task Telemetry Snapshot */}
                                    <div className="flex gap-4 opacity-70 group-hover:opacity-100 transition-opacity">
                                        <TaskMetric label="Load" value={`${task.loadProfile}%`} />
                                        <TaskMetric label="MEM" value={`${task.targetMemory}/10`} />
                                        <TaskMetric label="RT" value={task.expectedLatency} />
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <ChevronRight size={14} className={`transition-transform ${isActive ? 'translate-x-1 text-indigo-400' : 'text-slate-700'}`} />
                                </div>
                            </div>

                            {/* Completion Progress Bar for Active Task */}
                            {isActive && (
                                <div className="mt-3 h-0.5 bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div 
                                        className="h-full bg-indigo-500"
                                        animate={{ width: ['0%', '100%'] }}
                                        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                                    />
                                </div>
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* Footer Status */}
            <div className="p-4 bg-slate-950/60 border-t border-slate-800">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[9px] text-slate-500 font-bold uppercase">Pipeline Efficiency</span>
                    <span className="text-[10px] text-emerald-400 font-mono">94.8%</span>
                </div>
                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                        className="h-full bg-emerald-500"
                        animate={{ width: '94.8%' }}
                    />
                </div>
                {activeTask && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-3 text-[8px] text-indigo-400 font-bold uppercase flex items-center gap-2"
                    >
                        <Loader2 size={10} className="animate-spin" /> Orchestrating {activeTask.name}...
                    </motion.div>
                )}
            </div>
        </div>
    );
};

const TaskMetric = ({ label, value }: { label: string, value: string }) => (
    <div className="flex flex-col">
        <span className="text-[7px] text-slate-600 font-black uppercase">{label}</span>
        <span className="text-[9px] font-mono font-bold text-slate-400">{value}</span>
    </div>
);

export default WorkloadPipeline;
