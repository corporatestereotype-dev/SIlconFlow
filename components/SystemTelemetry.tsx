
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Thermometer, Zap, Activity, Database, Power, ArrowRightLeft } from 'lucide-react';
import { useChip } from '../ChipContext';
import { ActionType } from '../types';

const SystemTelemetry: React.FC = () => {
    const { state, dispatch } = useChip();
    const { telemetry, isRunning, loadBalancingEnabled } = state;

    const chartData = useMemo(() => {
        return Array.from({ length: 20 }, (_, i) => ({
            name: i,
            temp: telemetry.temperature + Math.sin(i) * 2,
            clock: telemetry.clockSpeed + Math.cos(i) * 0.1,
        }));
    }, [state.cycle]);

    return (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Activity size={14} className="text-indigo-400" /> System Telemetry
                    </h3>
                    {loadBalancingEnabled && isRunning && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                            <ArrowRightLeft size={10} className="text-emerald-400 animate-pulse" />
                            <span className="text-[8px] font-black text-emerald-400 uppercase">Balancer Active</span>
                        </div>
                    )}
                </div>
                <button 
                    onClick={() => dispatch({ type: isRunning ? ActionType.STOP : ActionType.START })}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${
                        isRunning 
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50 hover:bg-rose-500/30' 
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30'
                    }`}
                >
                    <Power size={14} />
                    {isRunning ? 'HALT SYSTEM' : 'BOOT ENGINE'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Metric 
                    label="Core Temp" 
                    value={`${telemetry.temperature.toFixed(1)}°C`} 
                    icon={<Thermometer size={18} className="text-rose-500" />} 
                    sub="Thermal Limit: 105°C"
                />
                <Metric 
                    label="Clock Frequency" 
                    value={`${telemetry.clockSpeed.toFixed(2)} GHz`} 
                    icon={<Zap size={18} className="text-amber-400" />} 
                    sub="Voltage: 1.15V"
                />
                <Metric 
                    label="VRAM Allocation" 
                    value={`${telemetry.vramUsage.toFixed(1)} GB`} 
                    icon={<Database size={18} className="text-cyan-400" />} 
                    sub="HBM3 Bandwidth: 3.2TB/s"
                />
                <Metric 
                    label="Migration Events" 
                    value={telemetry.balancingEvents.toString()} 
                    icon={<ArrowRightLeft size={18} className="text-emerald-400" />} 
                    sub="Balancing Overhead: 0.2%"
                />
            </div>

            <div className="h-40 w-full opacity-60">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <XAxis dataKey="name" hide />
                        <YAxis hide domain={['auto', 'auto']} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
                            itemStyle={{ color: '#818cf8', fontSize: '10px' }}
                        />
                        <Line type="monotone" dataKey="temp" stroke="#f43f5e" strokeWidth={2} dot={false} isAnimationActive={false} />
                        <Line type="monotone" dataKey="clock" stroke="#fbbf24" strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const Metric: React.FC<{ label: string, value: string, icon: React.ReactNode, sub: string }> = ({ label, value, icon, sub }) => (
    <div className="space-y-1">
        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            {icon} {label}
        </div>
        <div className="text-2xl font-bold font-mono text-slate-100">{value}</div>
        <div className="text-[10px] text-slate-600 italic">{sub}</div>
    </div>
);

export default SystemTelemetry;
