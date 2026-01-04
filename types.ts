

export interface MarketInput {
  industry: string;
  geography: string;
  query: string;
  researchQuestion?: string;
  assumptionTested?: string;
  rawSignals: string; // User pasted text
  files: File[];
  useWebSearch: boolean;
  isShortResearch: boolean;
}

export enum AnalysisStep {
  IDLE = 'IDLE',
  SEARCHING = 'SEARCHING',
  ANALYZING = 'ANALYZING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export enum AppView {
  ANALYSIS = 'ANALYSIS',
  HISTORY = 'HISTORY',
}

export interface AnalysisResult {
  report: string; // The markdown report
  groundingMetadata?: {
    web?: { uri: string; title: string }[];
  };
  chartData: FrequencyData[];
}

export interface FrequencyData {
  problem: string;
  frequency: number; // 1-10 scale derived from Low/Medium/High
  segment: string;
}

export interface LogEntry {
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'error';
}

export interface HistoryRecord {
  researchId: string; // timestamp-based
  date: string; // YYYY-MM-DD
  industry: string;
  geography: string;
  problemFocus: string;
  assumptionTested: string;
  opportunityStatus: 'PROCEED' | 'PAUSE' | 'DROP';
  overallConfidence: 'LOW' | 'MEDIUM' | 'HIGH';
  decision: 'Proceed' | 'Pause' | 'Drop'; // Redundant with OpportunityStatus, but matches prompt.
  stopRuleOutcome: 'CONTINUE RESEARCH' | 'STOP & MOVE ON';
  keyProblems: string[]; // short
  primaryRisk: string;
  recommendedNextStep: string;
  tags: string[];
  researchStage: string;
  fullReportSnippet: string; // A short snippet of the full report for context in history view
}