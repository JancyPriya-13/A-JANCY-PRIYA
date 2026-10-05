import React from 'react';
import { 
  History, 
  Trash2, 
  ArrowRight, 
  Award, 
  Calendar, 
  Clock, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { FullDiagnosticReport } from '../types/interview';

interface SessionHistoryProps {
  historyItems: FullDiagnosticReport[];
  onSelectReport: (report: FullDiagnosticReport) => void;
  onClearHistory: () => void;
  onStartNew: () => void;
}

export const SessionHistory: React.FC<SessionHistoryProps> = ({
  historyItems,
  onSelectReport,
  onClearHistory,
  onStartNew,
}) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">Interview Session History</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Review past mock interview scorecards and hiring committee decisions
          </p>
        </div>

        {historyItems.length > 0 && (
          <button
            onClick={() => {
              if (confirm('Clear all interview history records?')) {
                onClearHistory();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-800/50 text-xs transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {historyItems.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">No Mock Sessions Recorded Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Complete your first AI mock interview to generate an executive diagnostic scorecard with actionable feedback.
            </p>
          </div>
          <button
            onClick={onStartNew}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors inline-flex items-center gap-1.5"
          >
            <span>Start First Mock Interview</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {historyItems.map((item, idx) => (
            <div
              key={item.id || idx}
              onClick={() => onSelectReport(item)}
              className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      item.hiringDecision === 'Strong Hire'
                        ? 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30'
                        : item.hiringDecision === 'Hire'
                        ? 'text-indigo-300 bg-indigo-500/20 border-indigo-500/30'
                        : item.hiringDecision === 'Leaning Hire'
                        ? 'text-blue-300 bg-blue-500/20 border-blue-500/30'
                        : item.hiringDecision === 'Leaning No Hire'
                        ? 'text-amber-300 bg-amber-500/20 border-amber-500/30'
                        : 'text-rose-300 bg-rose-500/20 border-rose-500/30'
                    }`}
                  >
                    {item.hiringDecision}
                  </span>
                  <span className="text-xs text-slate-400">
                    {item.sessionMetadata?.company || 'Tech Company'}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors">
                  {item.sessionMetadata?.seniority} {item.sessionMetadata?.role || 'Software Engineer'}
                </h4>

                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>{item.sessionMetadata?.date || 'Recent Session'}</span>
                  </span>
                  {item.sessionMetadata?.durationMinutes && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{item.sessionMetadata.durationMinutes} min</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 sm:border-l sm:border-slate-800/80 sm:pl-6">
                <div className="text-right">
                  <div className="text-xl font-black text-white">{item.overallScore}%</div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">Score</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
