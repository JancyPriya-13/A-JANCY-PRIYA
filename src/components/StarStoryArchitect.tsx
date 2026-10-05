import React, { useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  Send, 
  CheckCircle2, 
  HelpCircle, 
  TrendingUp, 
  Copy, 
  Check,
  Compass,
  ArrowRight
} from 'lucide-react';
import { StarStory } from '../types/interview';

export const StarStoryArchitect: React.FC = () => {
  const [rawExperience, setRawExperience] = useState('');
  const [competency, setCompetency] = useState('Technical Leadership & Scaling Bottlenecks');
  const [isLoading, setIsLoading] = useState(false);
  const [starStory, setStarStory] = useState<StarStory | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const sampleSnippets = [
    {
      label: 'Database Bottleneck Outage',
      text: 'Last quarter our checkout service crashed during Black Friday because Postgres maxed out connection pool. I had to quickly diagnose the deadlock, implement Redis connection pooling with PgBouncer, and rebuild the query caching layer. Latency dropped by 60% and no transactions failed afterward.',
    },
    {
      label: 'Cross-Team Disagreement',
      text: 'Product manager wanted to launch a new ML search feature immediately without load testing. I was concerned about latency SLAs and cache hit rates. I built a lightweight canary shadow-proxy to benchmark real traffic, proved the latency jumped by 400ms, and we agreed on a 2-week optimization sprint first.',
    },
    {
      label: 'Mentoring & Team Velocity',
      text: 'Joined a team where PR review times averaged 4.5 days and juniors felt blocked. I set up automated linting/CI checks, held weekly architecture office hours, and paired with junior devs on complex distributed traces. PR cycle dropped to 14 hours and zero regressions made it to prod for 6 months.',
    },
  ];

  const handleGenerate = async () => {
    if (!rawExperience.trim() || isLoading) return;
    setIsLoading(true);
    setStarStory(null);

    try {
      const res = await fetch('/api/prep/star-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawExperience: rawExperience.trim(),
          targetCompetency: competency,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate STAR story');
      const data = await res.json();
      setStarStory(data);
    } catch (e: any) {
      alert('Error building STAR story: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyStory = () => {
    if (!starStory) return;
    const formatted = `TITLE: ${starStory.title}
COMPETENCY: ${competency}

SITUATION:
${starStory.situation}

TASK:
${starStory.task}

ACTION:
${starStory.action.map((a) => `• ${a}`).join('\n')}

RESULT:
${starStory.result}

ANTICIPATED PROBES:
${starStory.anticipatedProbes?.map((p) => `? ${p}`).join('\n')}
`;
    navigator.clipboard.writeText(formatted);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
          <Compass className="w-3.5 h-3.5" />
          <span>Behavioral & Leadership Architect</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          The STAR Story Architect
        </h2>
        <p className="text-xs sm:text-sm text-slate-300">
          Transform messy project notes or resume bullet points into airtight, memorable STAR narratives with quantified impact metrics and anticipated interview probes.
        </p>
      </div>

      {/* Input Console */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Target Behavioral Competency
          </label>
          <select
            value={competency}
            onChange={(e) => setCompetency(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="Technical Leadership & Scaling Bottlenecks">
              Technical Leadership & Scaling Bottlenecks
            </option>
            <option value="Cross-Functional Conflict & Disagree and Commit">
              Cross-Functional Conflict & Disagree and Commit
            </option>
            <option value="Production Outage, Root Cause Analysis & Accountability">
              Production Outage, Root Cause Analysis & Accountability
            </option>
            <option value="Delivering Under Ambiguity & Tight Deadlines">
              Delivering Under Ambiguity & Tight Deadlines
            </option>
            <option value="Mentorship, Culture & Raising the Engineering Bar">
              Mentorship, Culture & Raising the Engineering Bar
            </option>
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Raw Experience / Project Notes
            </label>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500">Insert Sample:</span>
              {sampleSnippets.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRawExperience(s.text)}
                  className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-[10px] text-indigo-300 border border-slate-700"
                >
                  {s.label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
          <textarea
            rows={5}
            value={rawExperience}
            onChange={(e) => setRawExperience(e.target.value)}
            placeholder="Describe what happened: What broke? What was the context? What did you personally do? What was the outcome? Don't worry about clean formatting—the AI agent will structure it..."
            className="w-full bg-slate-900/90 border border-slate-700 rounded-xl p-3.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={!rawExperience.trim() || isLoading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-40 transition-all cursor-pointer"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Structuring into STAR Framework...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Architect Structured STAR Story</span>
            </>
          )}
        </button>
      </div>

      {/* Generated STAR Story Card */}
      {starStory && (
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-indigo-500/30 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {competency}
              </span>
              <h3 className="text-lg font-bold text-white mt-1.5">{starStory.title}</h3>
            </div>
            <button
              onClick={handleCopyStory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 transition-colors"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Copied' : 'Copy Story'}</span>
            </button>
          </div>

          {/* 4 STAR Columns / Cards */}
          <div className="space-y-3 text-xs">
            {/* Situation */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="font-bold text-indigo-400 uppercase tracking-wider text-[11px] block">
                S • Situation (Context & Stakes)
              </span>
              <p className="text-slate-200 leading-relaxed">{starStory.situation}</p>
            </div>

            {/* Task */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="font-bold text-purple-400 uppercase tracking-wider text-[11px] block">
                T • Task (Your Specific Ownership)
              </span>
              <p className="text-slate-200 leading-relaxed">{starStory.task}</p>
            </div>

            {/* Action */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
              <span className="font-bold text-pink-400 uppercase tracking-wider text-[11px] block">
                A • Action (Your Personal Steps & Decisions)
              </span>
              <ul className="space-y-1 text-slate-200 list-disc list-inside">
                {starStory.action?.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>

            {/* Result */}
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
              <span className="font-bold text-emerald-400 uppercase tracking-wider text-[11px] block">
                R • Result (Quantified Business & Tech Impact)
              </span>
              <p className="text-slate-200 leading-relaxed font-semibold">{starStory.result}</p>
            </div>
          </div>

          {/* Metrics advice */}
          {starStory.metricsAdvice && (
            <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-200 flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-0.5">Metrics Booster:</strong>
                <span>{starStory.metricsAdvice}</span>
              </div>
            </div>
          )}

          {/* Anticipated Probes */}
          {starStory.anticipatedProbes && (
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Anticipated Interviewer Follow-Up Probes:
              </span>
              <div className="space-y-1.5">
                {starStory.anticipatedProbes.map((probe, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 flex items-start gap-2"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                    <span>"{probe}"</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
