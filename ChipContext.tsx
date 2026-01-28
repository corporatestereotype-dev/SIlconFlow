
import React, { createContext, useContext, useReducer, useEffect, useRef, ReactNode } from 'react';
import { ChipState, ChipAction, ActionType, ComputeCoreState, KernelProfile, EnterpriseTask, DataFlowPhase } from './types';

export const KERNEL_PROFILES: KernelProfile[] = [
    { id: 'gemm', name: 'Tensor GEMM (FP16)', description: 'Large Matrix Multiplication.', stallProbability: 0.02, computeIntensity: 9, memoryPressure: 4, registerRequirement: 8 },
    { id: 'fft', name: 'FFT (Radix-4)', description: 'Fast Fourier Transform.', stallProbability: 0.08, computeIntensity: 5, memoryPressure: 9, registerRequirement: 5 },
    { id: 'raytrace', name: 'BVH Traversal', description: 'Ray-Box intersection testing.', stallProbability: 0.25, computeIntensity: 4, memoryPressure: 6, registerRequirement: 4 }
];

export const ENTERPRISE_TASKS: EnterpriseTask[] = [
    { id: 'sci-nwp', category: 'SCIENCE', name: 'Weather NWP', description: 'Global grid Numerical Weather Prediction.', loadProfile: 92, targetCompute: 9, targetMemory: 8, targetPCIe: 4, expectedLatency: 'High' },
    { id: 'sci-drug', category: 'SCIENCE', name: 'In Silico Discovery', description: 'VHTS Ligand Docking simulation.', loadProfile: 82, targetCompute: 7, targetMemory: 5, targetPCIe: 9, expectedLatency: 'Medium' },
    { id: 'ai-train', category: 'AI', name: 'LLM Training', description: 'Parameter gradient updates.', loadProfile: 95, targetCompute: 10, targetMemory: 8, targetPCIe: 5, expectedLatency: 'High' },
    { id: 'bus-stock', category: 'BUSINESS', name: 'HFT Trading', description: 'Ultra-low latency limit order execution.', loadProfile: 40, targetCompute: 4, targetMemory: 3, targetPCIe: 10, expectedLatency: 'Ultra' },
];

const INITIAL_CORE_COUNT = 8;
const INITIAL_STATE: ChipState = {
    cycle: 0,
    isRunning: false,
    simulationSpeed: 500,
    globalWorkload: 0,
    computeCores: Array.from({ length: INITIAL_CORE_COUNT }, (_, i) => ({
        id: i,
        status: 'IDLE',
        utilization: 0,
        activeWarps: 0,
        tensorUnitLoad: 0,
        registerUsage: 0,
        temp: 35,
        isThrottled: false,
        balancingStatus: null
    })),
    memoryChannels: Array.from({ length: 6 }, (_, i) => ({ id: i, status: 'IDLE', load: 0 })),
    pcie: {
        lanes: 16, bandwidthGBs: 64, utilization: 0, status: 'LINK_UP', h2dRate: 0, d2hRate: 0,
        latencyNs: { cpu: 120, ram: 145, ssd: 4500 },
        sourceThroughput: { cpu: 0, ram: 0, ssd: 0 }
    },
    host: { cpuCores: Array(8).fill(0), ramUsage: 12.5, ramLatency: 45, ssdReadIOPS: 0, ssdWriteIOPS: 0, ssdTemp: 38 },
    telemetry: { temperature: 42, clockSpeed: 2.5, vramUsage: 12.4, instructionsPerCycle: 0, balancingEvents: 0 },
    pendingKernels: 0, activeGridBlocks: 0, activeKernel: KERNEL_PROFILES[0], activeTask: null, loadBalancingEnabled: true, flowPhase: 'IDLE', advisorMessage: null
};

function chipReducer(state: ChipState, action: ChipAction): ChipState {
    switch (action.type) {
        case ActionType.START: return { ...state, isRunning: true };
        case ActionType.STOP: return { ...state, isRunning: false, flowPhase: 'IDLE' };
        case ActionType.SET_ADVISOR_MSG: return { ...state, advisorMessage: action.payload };
        case ActionType.TICK: {
            const workload = state.globalWorkload;
            const phaseCycle = state.cycle % 16;
            
            // Phase Logic
            let currentPhase: DataFlowPhase = 'IDLE';
            if (workload > 0) {
                if (phaseCycle < 4) currentPhase = 'ORCHESTRATING';
                else if (phaseCycle < 8) currentPhase = 'FETCHING';
                else if (phaseCycle < 12) currentPhase = 'EXECUTING';
                else currentPhase = 'COMMITTING';
            }

            // Global Dispatcher Updates
            const pendingKernels = workload > 0 ? Math.floor(workload * 0.8 + Math.random() * 5) : 0;
            const activeGridBlocks = (currentPhase === 'EXECUTING' || currentPhase === 'FETCHING') 
                ? Math.floor(workload / 2.5 + Math.random() * 3) 
                : 0;

            // Compute Core Updates
            const updatedCores = state.computeCores.map(core => {
                const isBusy = (workload > 5 && currentPhase === 'EXECUTING');
                const nextUtilization = isBusy 
                    ? Math.min(100, (workload * 0.9) + Math.random() * 10) 
                    : Math.max(0, core.utilization - 15);
                
                let nextTemp = core.temp + (nextUtilization / 100) * 1.5 - 0.5;
                nextTemp = Math.max(30, Math.min(110, nextTemp));
                
                const isThrottled = nextTemp > 95;
                const effectiveUtil = isThrottled ? nextUtilization * 0.4 : nextUtilization;

                return {
                    ...core,
                    status: effectiveUtil > 10 ? 'BUSY' : 'IDLE',
                    utilization: effectiveUtil,
                    activeWarps: effectiveUtil > 0 ? Math.floor(effectiveUtil / 4) + 1 : 0,
                    temp: nextTemp,
                    isThrottled,
                    balancingStatus: null
                } as ComputeCoreState;
            });

            // PCIe Metric Updates
            const pcieUtil = workload > 0 
                ? (currentPhase === 'FETCHING' || currentPhase === 'COMMITTING' ? workload * 0.7 : workload * 0.2)
                : 0;
            const h2dRate = currentPhase === 'FETCHING' ? (workload / 100) * 58 : 0;
            const d2hRate = currentPhase === 'COMMITTING' ? (workload / 100) * 42 : 0;

            // Host Metric Updates
            const cpuLoadBase = (workload > 0) ? workload * 0.4 : 5;
            const cpuCores = state.host.cpuCores.map(() => 
                Math.max(2, Math.min(100, cpuLoadBase + Math.random() * 15))
            );
            const ramUsage = 12.5 + (workload / 100) * 32 + Math.random();
            const ssdIOPS = currentPhase === 'FETCHING' ? workload * 50 : 0;

            return {
                ...state,
                cycle: state.cycle + 1,
                flowPhase: currentPhase,
                pendingKernels,
                activeGridBlocks,
                computeCores: updatedCores,
                pcie: {
                    ...state.pcie,
                    utilization: pcieUtil,
                    h2dRate,
                    d2hRate,
                    sourceThroughput: {
                        cpu: currentPhase === 'FETCHING' ? h2dRate * 0.8 : 0,
                        ram: currentPhase === 'FETCHING' ? h2dRate * 1.0 : 0,
                        ssd: currentPhase === 'FETCHING' ? h2dRate * 0.3 : 0
                    }
                },
                host: {
                    ...state.host,
                    cpuCores,
                    ramUsage,
                    ssdReadIOPS: ssdIOPS,
                    ssdWriteIOPS: currentPhase === 'COMMITTING' ? ssdIOPS * 0.2 : 0
                },
                telemetry: {
                    ...state.telemetry,
                    temperature: updatedCores.reduce((a, b) => a + b.temp, 0) / updatedCores.length,
                    instructionsPerCycle: currentPhase === 'EXECUTING' ? (workload * 2.5) : 0
                }
            };
        }
        case ActionType.SET_TASK:
            return { ...state, activeTask: action.payload, globalWorkload: action.payload.loadProfile };
        case ActionType.SET_WORKLOAD:
            return { ...state, globalWorkload: action.payload };
        case ActionType.SET_KERNEL:
            return { ...state, activeKernel: action.payload };
        case ActionType.UPDATE_KERNEL_PARAMS:
            return {
                ...state,
                activeKernel: {
                    ...state.activeKernel,
                    ...action.payload
                }
            };
        case ActionType.TOGGLE_BALANCING:
            return { ...state, loadBalancingEnabled: !state.loadBalancingEnabled };
        case ActionType.RESET: return INITIAL_STATE;
        default: return state;
    }
}

const ChipContext = createContext<any>(undefined);
export const ChipProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(chipReducer, INITIAL_STATE);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        if (state.isRunning) {
            timerRef.current = window.setInterval(() => dispatch({ type: ActionType.TICK }), state.simulationSpeed);
        } else if (timerRef.current) clearInterval(timerRef.current);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [state.isRunning, state.simulationSpeed]);

    return <ChipContext.Provider value={{ state, dispatch }}>{children}</ChipContext.Provider>;
};
export const useChip = () => useContext(ChipContext);
