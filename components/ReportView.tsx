import React, { useState } from 'react'; // Import useState
import ReactMarkdown from 'react-markdown';
import { AnalysisResult, MarketInput } from '../types';
import SignalChart from './SignalChart';
import { ExternalLink, FileText, Download, Bookmark } from 'lucide-react'; // New import for Bookmark icon

interface ReportViewProps {
  result: AnalysisResult;
  onReset: () => void;
  isShortResearch: boolean; // New prop to determine if it's a short research
  onSaveToHistory: (input: MarketInput, result: AnalysisResult) => void; // New prop for saving
  currentMarketInput: MarketInput | null; // New prop to pass the original input for history
}

const ReportView: React.FC<ReportViewProps> = ({ 
  result, 
  onReset, 
  isShortResearch, 
  onSaveToHistory, 
  currentMarketInput 
}) => {
  const [isSavingHistory, setIsSavingHistory] = useState(false); // New state for saving button loading

  const downloadReport = () => {
    const blob = new Blob([result.report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `market-analysis-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveToHistory = async () => {
    if (currentMarketInput && !isShortResearch) { // Only save deep research
      setIsSavingHistory(true);
      await onSaveToHistory(currentMarketInput, result);
      setIsSavingHistory(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800 flex items-center">
             <FileText className="w-6 h-6 mr-2 text-blue-600" />
             Intelligence Report
           </h2>
           <p className="text-sm text-slate-500">Generated using Deep Thinking & Web Grounding</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {!isShortResearch && ( // Only show save to history for deep research
            <button 
              onClick={handleSaveToHistory}
              disabled={isSavingHistory}
              className="flex items-center px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-blue-50 hover:border-blue-300 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSavingHistory ? (
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></span>
              ) : (
                <Bookmark className="w-4 h-4 mr-2" />
              )}
              {isSavingHistory ? 'Saving...' : 'Save to History'}
            </button>
          )}
          <button 
            onClick={downloadReport}
            className="flex items-center px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition text-sm font-medium"
          >
            <Download className="w-4 h-4 mr-2" />
            Export MD
          </button>
          <button 
            onClick={onReset}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            New Search
          </button>
        </div>
      </div>

      {/* Charts */}
      {result.chartData && result.chartData.length > 0 && (
        <SignalChart data={result.chartData} />
      )}

      {/* Main Report Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 prose prose-slate max-w-none prose-headings:font-bold prose-h2:text-blue-900 prose-h2:border-b prose-h2:pb-2 prose-h2:mt-8 prose-li:text-slate-700 prose-strong:text-slate-900">
          <ReactMarkdown>{result.report}</ReactMarkdown>
        </div>
      </div>

      {/* Grounding Sources */}
      {result.groundingMetadata && result.groundingMetadata.web && result.groundingMetadata.web.length > 0 && (
        <div className="bg-slate-100 rounded-xl p-6 border border-slate-200">
          <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Verified Sources</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {result.groundingMetadata.web.map((source, idx) => (
              <a 
                key={idx}
                href={source.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-3 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-sm transition group"
              >
                <ExternalLink className="w-3 h-3 text-slate-400 mr-2 group-hover:text-blue-500" />
                <span className="text-xs text-slate-600 truncate group-hover:text-blue-700">{source.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportView;