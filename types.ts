
export type HardwareStatus = 'IDLE' | 'BUSY' | 'STALLED' | 'FETCHING' | 'COMPUTING' | 'COMMITTING' | 'READY' | 'MIGRATING';
export type DataFlowPhase = 'ORCHESTRATING' | 'FETCHING' | 'EXECUTING' | 'COMMITTING' | 'IDLE';

export interface KernelProfile {
    id: string;
    name: string;
    description: string;
    stallProbability: number;
    computeIntensity: number;
    memoryPressure: number;
    registerRequirement: number;
}

export interface EnterpriseTask {
    id: string;
    category: 'AI' | 'BUSINESS' | 'SCIENCE';
    name: string;
    description: string;
    loadProfile: number;
    targetCompute: number;
    targetMemory: number;
    targetPCIe: number;
    expectedLatency: string;
}

export interface ComputeCoreState {
    id: number;
    status: HardwareStatus;
    utilization: number;
    activeWarps: number;
    tensorUnitLoad: number;
    registerUsage: number;
    temp: number; // Individual core temperature
    isThrottled: boolean;
    balancingStatus: 'DONOR' | 'RECEIVER' | null;
}

export interface PCIeState {
    lanes: number;
    bandwidthGBs: number;
    utilization: number;
    status: 'LINK_UP' | 'TRAINING' | 'DOWN';
    h2dRate: number;
    d2hRate: number;
    latencyNs: { cpu: number; ram: number; ssd: number; };
    sourceThroughput: { cpu: number; ram: number; ssd: number; };
}

// Added Warp interface to resolve "Module '../types' has no exported member 'Warp'" error
export interface Warp {
    id: number;
    status: HardwareStatus;
    progress: number;
    stallCycles: number;
    instructionsExecuted: number;
    currentCoreId: number;
    migrationLatency: number;
    startCycle?: number;
    endCycle?: number;
}

export interface ChipState {
    cycle: number;
    isRunning: boolean;
    simulationSpeed: number;
    globalWorkload: number;
    computeCores: ComputeCoreState[];
    memoryChannels: any[];
    pcie: PCIeState;
    host: any;
    telemetry: any;
    pendingKernels: number;
    activeGridBlocks: number;
    activeKernel: KernelProfile;
    activeTask: EnterpriseTask | null;
    loadBalancingEnabled: boolean;
    flowPhase: DataFlowPhase;
    advisorMessage: string | null;
}

export enum ActionType {
    START = 'START',
    STOP = 'STOP',
    TICK = 'TICK',
    RESET = 'RESET',
    SET_SPEED = 'SET_SPEED',
    SET_WORKLOAD = 'SET_WORKLOAD',
    SET_KERNEL = 'SET_KERNEL',
    SET_TASK = 'SET_TASK',
    TOGGLE_BALANCING = 'TOGGLE_BALANCING',
    UPDATE_KERNEL_PARAMS = 'UPDATE_KERNEL_PARAMS',
    SET_ADVISOR_MSG = 'SET_ADVISOR_MSG'
}

export type ChipAction =
    | { type: ActionType.START }
    | { type: ActionType.STOP }
    | { type: ActionType.TICK }
    | { type: ActionType.RESET }
    | { type: ActionType.SET_SPEED; payload: number }
    | { type: ActionType.SET_WORKLOAD; payload: number }
    | { type: ActionType.SET_KERNEL; payload: KernelProfile }
    | { type: ActionType.SET_TASK; payload: EnterpriseTask }
    | { type: ActionType.TOGGLE_BALANCING }
    | { type: ActionType.SET_ADVISOR_MSG; payload: string | null }
    | { type: ActionType.UPDATE_KERNEL_PARAMS; payload: Partial<KernelProfile> };
