import React from 'react';
import { HistoryRecord, AppView } from '../types';
import { ChevronLeft, Info, CheckCircle, XCircle, Clock, TrendingUp, ShieldOff, Lightbulb, Zap, BrainCircuit } from 'lucide-react';

interface HistoryPageProps {
  records: HistoryRecord[];
  onViewAnalysis: () => void;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ records, onViewAnalysis }) => {

  const getStatusColor = (status: HistoryRecord['opportunityStatus']) => {
    switch (status) {
      case 'PROCEED': return 'bg-green-100 text-green-800';
      case 'PAUSE': return 'bg-yellow-100 text-yellow-800';
      case 'DROP': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getConfidenceColor = (confidence: HistoryRecord['overallConfidence']) => {
    switch (confidence) {
      case 'HIGH': return 'text-green-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'LOW': return 'text-red-600';
      default: return 'text-slate-600';
    }
  };

  const getStatusIcon = (status: HistoryRecord['opportunityStatus']) => {
    switch (status) {
      case 'PROCEED': return <CheckCircle className="w-4 h-4 mr-1.5" />;
      case 'PAUSE': return <Info className="w-4 h-4 mr-1.5" />;
      case 'DROP': return <XCircle className="w-4 h-4 mr-1.5" />;
      default: return null;
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Research History</h2>
        <button
          onClick={onViewAnalysis}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium shadow-md"
        >
          <ChevronLeft className="w-4 h-4 mr-2" /> Back to Analysis
        </button>
      </div>

      {records.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-600">
          <p className="text-lg font-medium mb-2">No research records yet.</p>
          <p className="text-sm">Run a Deep Analysis to save it to your history.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {records.map((record) => (
            <div key={record.researchId} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.opportunityStatus)}`}>
                    {getStatusIcon(record.opportunityStatus)}
                    {record.opportunityStatus}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center">
                    <Clock className="w-3 h-3 mr-1" /> {record.date}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-800 mb-2 leading-tight">{record.problemFocus}</h3>
                <p className="text-sm text-slate-600 mb-4">{record.industry} &bull; {record.geography}</p>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center">
                    <TrendingUp className={`w-4 h-4 mr-2 ${getConfidenceColor(record.overallConfidence)}`} />
                    <span className="font-medium text-slate-700">Confidence:</span>
                    <span className={`${getConfidenceColor(record.overallConfidence)} ml-2`}>{record.overallConfidence}</span>
                  </div>
                  <div className="flex items-center">
                    <ShieldOff className="w-4 h-4 mr-2 text-red-500" />
                    <span className="font-medium text-slate-700">Primary Risk:</span>
                    <span className="text-slate-600 ml-2 truncate">{record.primaryRisk}</span>
                  </div>
                  <div className="flex items-center">
                    <Lightbulb className="w-4 h-4 mr-2 text-amber-500" />
                    <span className="font-medium text-slate-700">Next Step:</span>
                    <span className="text-slate-600 ml-2 truncate">{record.recommendedNextStep}</span>
                  </div>
                  <div className="flex items-center">
                    {record.researchStage === 'SCAN' ? (
                      <Zap className="w-4 h-4 mr-2 text-amber-500" />
                    ) : (
                      <BrainCircuit className="w-4 h-4 mr-2 text-blue-600" />
                    )}
                    <span className="font-medium text-slate-700">Stage:</span>
                    <span className="text-slate-600 ml-2">{record.researchStage}</span>
                  </div>
                </div>

                {record.keyProblems.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Key Problems:</p>
                    <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                      {record.keyProblems.map((p, i) => (
                        <li key={i} className="truncate">{p}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;