import React, { useState, useEffect, useCallback } from 'react';
import InputSection from './components/InputSection';
import ReportView from './components/ReportView';
import LoadingScreen from './components/LoadingScreen';
import HistoryPage from './components/HistoryPage'; // New import
import { performMarketAnalysis, extractHistoryRecordData } from './services/geminiService'; // Updated import
import { AnalysisResult, MarketInput, AnalysisStep, LogEntry, AppView, HistoryRecord } from './types'; // Updated import
import { Sparkles, History } from 'lucide-react'; // New import for History icon

const App: React.FC = () => {
  const [step, setStep] = useState<AnalysisStep>(AnalysisStep.IDLE);
  const [appView, setAppView] = useState<AppView>(AppView.ANALYSIS); // New state for view management
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [currentMarketInput, setCurrentMarketInput] = useState<MarketInput | null>(null); // To pass to ReportView for history saving
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isShortResearch, setIsShortResearch] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>(() => {
    // Initialize history from localStorage
    try {
      const saved = localStorage.getItem('marketSignalHistory');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load history from localStorage", e);
      return [];
    }
  });

  // Save history records to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('marketSignalHistory', JSON.stringify(historyRecords));
  }, [historyRecords]);


  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setLogs((prev) => [...prev, { timestamp: new Date(), message, type }]);
  };

  const saveHistoryRecord = useCallback(async (input: MarketInput, analysisResult: AnalysisResult) => {
    addLog("Saving research to history...", 'info');
    try {
      const extractedData = await extractHistoryRecordData(analysisResult.report, addLog);
      
      // Fix: Helper function to convert 'PROCEED' -> 'Proceed', 'PAUSE' -> 'Pause', 'DROP' -> 'Drop'
      const toPascalCaseDecision = (status: 'PROCEED' | 'PAUSE' | 'DROP'): 'Proceed' | 'Pause' | 'Drop' => {
        return (status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()) as 'Proceed' | 'Pause' | 'Drop';
      };

      const newHistoryRecord: HistoryRecord = {
        researchId: `research-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
        industry: input.industry,
        geography: input.geography,
        problemFocus: input.query,
        assumptionTested: input.assumptionTested || 'N/A',
        opportunityStatus: extractedData.opportunityStatus,
        overallConfidence: extractedData.overallConfidence,
        // Fix: Convert the opportunityStatus to the required PascalCase for the decision field.
        decision: toPascalCaseDecision(extractedData.opportunityStatus), 
        stopRuleOutcome: extractedData.stopRuleOutcome,
        keyProblems: extractedData.keyProblems,
        primaryRisk: extractedData.primaryRisk,
        recommendedNextStep: extractedData.recommendedNextStep,
        tags: [], // Could be expanded later from the report metadata
        researchStage: input.isShortResearch ? 'SCAN' : 'DEEP',
        fullReportSnippet: analysisResult.report.substring(0, 500) + '...', // Store a snippet
      };

      setHistoryRecords((prev) => [newHistoryRecord, ...prev]);
      addLog("Research saved successfully!", 'success');
    } catch (error) {
      console.error("Failed to save history record", error);
      addLog(`Failed to save history: ${(error as Error).message}`, 'error');
    }
  }, [addLog]);


  const handleAnalysisStart = async (data: MarketInput) => {
    setIsShortResearch(data.isShortResearch);
    setCurrentMarketInput(data); // Save current input for history
    setStep(AnalysisStep.SEARCHING);
    setLogs([]);
    addLog(`Initializing MarketSignal AI...`);
    addLog(`Target: ${data.industry} in ${data.geography}`);
    if (data.isShortResearch) {
      addLog("Mode: Quick Scan (Fast Response)");
    } else {
      addLog("Mode: Deep Analysis (Thinking Model)");
    }

    try {
      const analysisResult = await performMarketAnalysis(data, addLog);
      
      setResult(analysisResult);
      setStep(AnalysisStep.COMPLETE);
      addLog("Analysis complete.", 'success');
    } catch (error) {
      console.error(error);
      addLog("Critical Error: Failed to complete analysis.", 'error');
      setStep(AnalysisStep.ERROR);
    }
  };

  const handleReset = () => {
    setStep(AnalysisStep.IDLE);
    setResult(null);
    setLogs([]);
    setCurrentMarketInput(null);
    setAppView(AppView.ANALYSIS); // Ensure we go back to analysis view
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">MarketSignal AI</h1>
          </div>
          <nav className="flex items-center space-x-4">
            <button
              onClick={() => setAppView(AppView.ANALYSIS)}
              className={`text-sm font-medium ${appView === AppView.ANALYSIS ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'} px-3 py-2 -mb-2 transition-colors`}
            >
              Analysis
            </button>
            <button
              onClick={() => setAppView(AppView.HISTORY)}
              className={`text-sm font-medium flex items-center ${appView === AppView.HISTORY ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'} px-3 py-2 -mb-2 transition-colors`}
            >
              <History className="w-4 h-4 mr-1" /> History
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          
          {appView === AppView.ANALYSIS && (
            <>
              {step === AnalysisStep.IDLE && (
                <div className="max-w-3xl mx-auto">
                  <div className="text-center mb-10">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
                      Validate Market Gaps with Precision
                    </h2>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                      An AI research agent that scours the web, analyzes signals, and thinks deeply to find real problems—not just startup ideas.
                    </p>
                  </div>
                  <InputSection onSubmit={handleAnalysisStart} isLoading={false} />
                </div>
              )}

              {(step === AnalysisStep.SEARCHING || step === AnalysisStep.ANALYZING) && (
                <LoadingScreen logs={logs} isShortResearch={isShortResearch} />
              )}

              {step === AnalysisStep.COMPLETE && result && (
                <ReportView 
                  result={result} 
                  onReset={handleReset} 
                  isShortResearch={isShortResearch}
                  onSaveToHistory={saveHistoryRecord}
                  currentMarketInput={currentMarketInput}
                />
              )}

              {step === AnalysisStep.ERROR && (
                <div className="max-w-2xl mx-auto mt-12 p-6 bg-red-50 border border-red-200 rounded-xl text-center">
                  <h3 className="text-red-800 font-bold text-lg mb-2">Analysis Failed</h3>
                  <p className="text-red-600 mb-4">An unexpected error occurred during the research process.</p>
                  <div className="bg-white p-4 rounded border border-red-100 text-left font-mono text-xs text-red-500 h-32 overflow-y-auto mb-4">
                    {logs.map((l, i) => <div key={i}>{l.message}</div>)}
                  </div>
                  <button 
                    onClick={handleReset}
                    className="px-4 py-2 bg-white border border-red-300 text-red-700 font-medium rounded hover:bg-red-50"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </>
          )}

          {appView === AppView.HISTORY && (
            <HistoryPage records={historyRecords} onViewAnalysis={handleReset} />
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-5xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>&copy; {new Date().getFullYear()} MarketSignal AI. Research amplifier only. Verify all data independently.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;