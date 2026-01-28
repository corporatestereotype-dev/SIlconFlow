
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Sparkles, Terminal, X } from 'lucide-react';
import { useChip } from '../ChipContext';
import { GoogleGenAI } from "@google/genai";
import { ActionType } from '../types';

const ArchitectAdvisor: React.FC = () => {
    const { state, dispatch } = useChip();
    const [isExplaining, setIsExplaining] = useState(false);

    useEffect(() => {
        if (!state.isRunning) return;

        // Simulate AI analysis every 100 cycles
        if (state.cycle % 100 === 0 && state.cycle > 0) {
            triggerAIAnalysis();
        }
    }, [state.cycle, state.isRunning]);

    const triggerAIAnalysis = async () => {
        setIsExplaining(true);
        
        try {
            // Fix: Initializing GoogleGenAI with the required configuration as per documentation
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            // Fix: Constructing a professional prompt for Gemini based on current telemetry
            const prompt = `Perform an architectural audit of the SiliconFlow X1 Accelerator:
            - Cycle: ${state.cycle}
            - Global Workload: ${state.globalWorkload}%
            - Current Task: ${state.activeTask?.name || 'Idle'}
            - Data Phase: ${state.flowPhase}
            - System Temp: ${state.telemetry.temperature.toFixed(1)}°C
            - Throttled SMs: ${state.computeCores.filter(c => c.isThrottled).length}
            
            Identify one critical hardware bottleneck or optimization strategy. Provide exactly one sentence of advice (max 15 words).`;

            // Fix: Using generateContent with gemini-3-flash-preview as recommended for text analysis tasks
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: {
                    systemInstruction: "You are the SiliconFlow X1 AI Architect. You provide elite, technical, and concise hardware performance advice.",
                    temperature: 0.7,
                }
            });

            // Fix: Accessing response.text directly as a property, not a method
            const insight = response.text || "Nominal state operation confirmed.";
            dispatch({ type: ActionType.SET_ADVISOR_MSG, payload: insight.trim() });
        } catch (error) {
            console.error("Architect AI Analysis failed:", error);
            // Fallback to static insights if API fails
            const fallbackInsights = [
                "L1 Cache pressure is high. Consider increasing warp occupancy.",
                "Thermal throttling on SM_04 detected. Migration suggested.",
                "H2D Bandwidth bottlenecked by PCIe latency. Batch small kernels."
            ];
            dispatch({ type: ActionType.SET_ADVISOR_MSG, payload: fallbackInsights[Math.floor(Math.random() * fallbackInsights.length)] });
        } finally {
            setIsExplaining(false);
        }
    };

    return (
        <AnimatePresence>
            {state.advisorMessage && (
                <motion.div 
                    initial={{ opacity: 0, y: 20, x: 20 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="fixed bottom-8 right-8 z-[100] w-80 bg-slate-900 border border-indigo-500/50 rounded-2xl shadow-[0_0_40px_rgba(99,102,241,0.2)] overflow-hidden"
                >
                    <div className="p-4 bg-indigo-500/10 border-b border-indigo-500/20 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <BrainCircuit className="text-indigo-400 w-4 h-4 animate-pulse" />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Architect Advisor</span>
                        </div>
                        <button onClick={() => dispatch({ type: ActionType.SET_ADVISOR_MSG, payload: null })}>
                            <X size={14} className="text-slate-500 hover:text-white" />
                        </button>
                    </div>
                    
                    <div className="p-4 space-y-3">
                        <div className="flex items-start gap-3">
                            <Sparkles size={16} className="text-amber-400 shrink-0 mt-1" />
                            <p className="text-xs text-slate-300 font-mono leading-relaxed">
                                {state.advisorMessage}
                            </p>
                        </div>
                        
                        <div className="pt-2 flex justify-between items-center text-[8px] text-slate-500 font-black uppercase tracking-tighter">
                            <span className="flex items-center gap-1"><Terminal size={10} /> Analysis: Cycle {state.cycle}</span>
                            <span className="text-indigo-400">Confidence: 94%</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ArchitectAdvisor;
