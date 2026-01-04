import React, { useState, useRef } from 'react';
import { Search, Upload, Target, Globe, Briefcase, Zap, Trash2, Microscope, HelpCircle } from 'lucide-react';
import { MarketInput } from '../types';

interface InputSectionProps {
  onSubmit: (data: MarketInput) => void;
  isLoading: boolean;
}

const InputSection: React.FC<InputSectionProps> = ({ onSubmit, isLoading }) => {
  const [industry, setIndustry] = useState('');
  const [geography, setGeography] = useState('');
  const [query, setQuery] = useState('');
  const [researchQuestion, setResearchQuestion] = useState('');
  const [assumptionTested, setAssumptionTested] = useState('');
  const [rawSignals, setRawSignals] = useState('');
  const [useWebSearch, setUseWebSearch] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  
  // Track which mode was triggered for loading state UI
  const [isShortModeTarget, setIsShortModeTarget] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerAnalysis = (isShort: boolean) => {
    // Basic validation
    if (!industry || !query) {
      const form = document.getElementById('market-form') as HTMLFormElement;
      if (form && !form.checkValidity()) {
        form.reportValidity();
        return;
      }
    }

    setIsShortModeTarget(isShort);
    
    onSubmit({ 
      industry, 
      geography, 
      query, 
      researchQuestion,
      assumptionTested,
      rawSignals, 
      files, 
      useWebSearch, 
      isShortResearch: isShort 
    });
  };

  const handleClear = () => {
    setIndustry('');
    setGeography('');
    setQuery('');
    setResearchQuestion('');
    setAssumptionTested('');
    setRawSignals('');
    setUseWebSearch(true);
    setFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  // Modern input styling with soft background, hover effects, and refined focus ring
  const inputClasses = "w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 hover:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all duration-200 placeholder:text-slate-400 text-slate-800 shadow-sm";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Research Parameters</h2>
          <p className="text-slate-500">Define the scope for the intelligence agent.</p>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="flex items-center self-end sm:self-auto text-slate-400 hover:text-red-600 transition-colors text-sm font-medium px-3 py-1.5 rounded-md hover:bg-slate-50"
          title="Reset all fields"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear All
        </button>
      </div>

      <form id="market-form" onSubmit={(e) => e.preventDefault()} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-slate-700">
              <Briefcase className="w-4 h-4 mr-2 text-blue-600" />
              Industry / Sector
            </label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. FinTech, AgriTech, SaaS"
              className={inputClasses}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-slate-700">
              <Globe className="w-4 h-4 mr-2 text-blue-600" />
              Geography
            </label>
            <input
              type="text"
              value={geography}
              onChange={(e) => setGeography(e.target.value)}
              placeholder="e.g. Southeast Asia, UK, Global"
              className={inputClasses}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-slate-700">
            <Target className="w-4 h-4 mr-2 text-blue-600" />
            Problem Signal Focus / Core Query
          </label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Inefficiencies in last-mile delivery for small grocers"
            className={inputClasses}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
            <div className="col-span-full mb-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Advanced Context (Optional)</span>
            </div>
            <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-slate-700">
                <Microscope className="w-4 h-4 mr-2 text-blue-600" />
                Specific Research Question
                </label>
                <input
                type="text"
                value={researchQuestion}
                onChange={(e) => setResearchQuestion(e.target.value)}
                placeholder="e.g. Why is adoption low?"
                className={`${inputClasses} bg-white`}
                />
            </div>
            <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-slate-700">
                <HelpCircle className="w-4 h-4 mr-2 text-blue-600" />
                Assumption to Test
                </label>
                <input
                type="text"
                value={assumptionTested}
                onChange={(e) => setAssumptionTested(e.target.value)}
                placeholder="e.g. Tools are too expensive"
                className={`${inputClasses} bg-white`}
                />
            </div>
        </div>

        <div className="space-y-4">
           <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">Additional Signals (Optional)</label>
              <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="webSearch" 
                    checked={useWebSearch} 
                    onChange={(e) => setUseWebSearch(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-4 focus:ring-blue-500/20 focus:ring-offset-0 bg-slate-50 transition-all cursor-pointer"
                  />
                  <label htmlFor="webSearch" className="text-sm text-slate-600 cursor-pointer select-none">
                    Enable Live Web Search Grounding
                  </label>
              </div>
           </div>
           
           <textarea
            value={rawSignals}
            onChange={(e) => setRawSignals(e.target.value)}
            placeholder="Paste raw text from Reddit, Reviews, Forums, or Job descriptions here..."
            className={`${inputClasses} h-32 resize-none`}
           />

           <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 hover:border-blue-400 transition-all group focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500 outline-none">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-6 h-6 mb-2 text-slate-400 group-hover:text-blue-500 transition-colors" />
                      <p className="text-sm text-slate-500 group-hover:text-slate-600"><span className="font-semibold">Click to upload</span> screenshots or documents</p>
                      <p className="text-xs text-slate-400">PNG, JPG, WEBP</p>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} accept="image/*" />
              </label>
           </div>
           {files.length > 0 && (
             <div className="text-sm text-green-600 font-medium animate-in fade-in">
               {files.length} file(s) selected
             </div>
           )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => triggerAnalysis(false)}
              disabled={isLoading}
              className="flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none focus:ring-4 focus:ring-blue-500/20 outline-none"
            >
              {isLoading && !isShortModeTarget ? (
                <>
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></span>
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Deep Analysis
                </>
              )}
            </button>
            <p className="text-xs text-center text-slate-500">Full Report (Gemini 3 Pro) • ~2 mins</p>
          </div>
          
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => triggerAnalysis(true)}
              disabled={isLoading}
              className="flex items-center justify-center w-full bg-white border border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 font-semibold py-3 px-6 rounded-lg shadow-sm hover:shadow hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none"
            >
              {isLoading && isShortModeTarget ? (
                <>
                   <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-3"></span>
                   Scanning...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Short Research
                </>
              )}
            </button>
            <p className="text-xs text-center text-slate-500">Flash Brief (Gemini Flash) • ~20s</p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default InputSection;