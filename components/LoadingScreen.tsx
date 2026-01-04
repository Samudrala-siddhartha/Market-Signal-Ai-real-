import React, { useEffect, useState } from 'react';
import { LogEntry } from '../types';
import { BrainCircuit, Search, Loader2, Zap } from 'lucide-react';

interface LoadingScreenProps {
  logs: LogEntry[];
  isShortResearch: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ logs, isShortResearch }) => {
  const [currentTip, setCurrentTip] = useState(0);

  const deepTips = [
    "Gemini 3 Pro is using its thinking budget to analyze complexity...",
    "Rejecting generic marketing fluff...",
    "Cross-referencing solution weaknesses...",
    "Synthesizing market gap hypotheses...",
    "Conducting risk & uncertainty check...",
  ];

  const shortTips = [
    "Gemini Flash is quickly scanning top signals...",
    "Extracting critical market blockers...",
    "Generating executive flash brief...",
    "Prioritizing speed and clarity...",
  ];

  const tips = isShortResearch ? shortTips : deepTips;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [tips.length]);

  // Auto-scroll to bottom of logs
  const logsEndRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 max-w-2xl mx-auto mt-12 text-center animate-in fade-in zoom-in-95 duration-500">
      
      <div className="relative mb-8">
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
           {isShortResearch ? (
             <Zap className="w-32 h-32 animate-pulse text-amber-500" />
           ) : (
             <BrainCircuit className="w-32 h-32 animate-pulse text-blue-600" />
           )}
        </div>
        <div className="relative z-10 flex flex-col items-center">
            <Loader2 className={`w-12 h-12 animate-spin mb-4 ${isShortResearch ? 'text-amber-500' : 'text-blue-600'}`} />
            <h3 className="text-xl font-bold text-slate-800">
              {isShortResearch ? 'Scanning Market Signals' : 'Deep Market Analysis'}
            </h3>
            <p className="text-slate-500 mt-2 h-6 transition-all duration-500">{tips[currentTip]}</p>
        </div>
      </div>

      <div className="bg-slate-900 rounded-lg p-4 text-left font-mono text-xs text-green-400 h-48 overflow-y-auto custom-scrollbar shadow-inner">
        {logs.map((log, index) => (
          <div key={index} className={`mb-1 ${log.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
            <span className="opacity-50 mr-2">[{log.timestamp.toLocaleTimeString().split(' ')[0]}]</span>
            {index === logs.length - 1 && log.type !== 'error' ? (
                 <span className="typing-effect">{log.message}</span>
            ) : (
                <span>{log.message}</span>
            )}
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
};

export default LoadingScreen;