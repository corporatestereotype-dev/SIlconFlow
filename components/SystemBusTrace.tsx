
import React from 'react';
import { motion } from 'framer-motion';
import { useChip } from '../ChipContext';

const SystemBusTrace: React.FC = () => {
    const { state } = useChip();
    const { flowPhase, globalWorkload, isRunning } = state;

    if (!isRunning) return null;

    // Pulse settings based on phase
    const isOrch = flowPhase === 'ORCHESTRATING';
    const isFetch = flowPhase === 'FETCHING';
    const isExec = flowPhase === 'EXECUTING';
    const isCommit = flowPhase === 'COMMITTING';

    return (
        <svg className="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-40 overflow-visible" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>

            {/* Path 1: Workload -> Host (Control Flow) */}
            <BusPath 
                id="w2h" 
                active={isOrch || isFetch} 
                color="#818cf8" 
                path="M 28% 30% L 20% 40% L 20% 60%" 
            />

            {/* Path 2: Host -> PCIe (IO Request) */}
            <BusPath 
                id="h2p" 
                active={isFetch} 
                color="#10b981" 
                path="M 20% 70% L 25% 85% L 40% 85%" 
            />

            {/* Path 3: PCIe -> Compute (Data Feed) */}
            <BusPath 
                id="p2c" 
                active={isFetch || isExec} 
                color="#6366f1" 
                path="M 50% 85% L 60% 70% L 60% 50%" 
            />

            {/* Path 4: Compute -> Memory (Commits) */}
            <BusPath 
                id="c2m" 
                active={isCommit} 
                color="#06b6d4" 
                path="M 70% 30% L 80% 30% L 85% 50%" 
            />

            {/* Path 5: Memory -> Telemetry (Monitoring feedback) */}
            <BusPath 
                id="m2t" 
                active={isRunning} 
                color="#f43f5e" 
                path="M 85% 70% L 80% 85% L 70% 85%" 
            />
        </svg>
    );
};

// Fixed: Destructured 'id' from props and added it to the type definition to match usages above
const BusPath = ({ path, active, color, id }: { path: string, active: boolean, color: string, id: string }) => {
    return (
        <g filter="url(#glow)">
            {/* Background trace line */}
            <path d={path} fill="none" stroke={color} strokeWidth="1" strokeDasharray="4 4" opacity="0.1" />
            
            {/* Animated data pulses */}
            {active && (
                <motion.path
                    d={path}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    initial={{ strokeDasharray: "0 100", strokeDashoffset: 0 }}
                    animate={{ 
                        strokeDasharray: "20 80",
                        strokeDashoffset: [0, -100]
                    }}
                    transition={{ 
                        duration: 1.5, 
                        repeat: Infinity, 
                        ease: "linear" 
                    }}
                />
            )}
        </g>
    );
};

export default SystemBusTrace;
