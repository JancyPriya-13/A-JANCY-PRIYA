import React, { useState } from 'react';
import { 
  Briefcase, 
  Building2, 
  GraduationCap, 
  Layers, 
  UserCheck, 
  Sparkles, 
  FileText, 
  Video, 
  Volume2, 
  HelpCircle,
  Flame,
  ArrowRight,
  Shield,
  Zap,
  Info
} from 'lucide-react';
import { InterviewConfig, SeniorityLevel, InterviewType, InterviewerPersona } from '../types/interview';
import { ROLE_PRESETS, COMPANY_PRESETS, SAMPLE_RESUME_SNIPPETS } from '../data/interviewPresets';

interface InterviewSetupProps {
  onStartSession: (config: InterviewConfig) => void;
  isLoading: boolean;
}

export const InterviewSetup: React.FC<InterviewSetupProps> = ({ onStartSession, isLoading }) => {
  const [role, setRole] = useState('Full Stack Software Engineer');
  const [customRole, setCustomRole] = useState('');
  const [company, setCompany] = useState('Google');
  const [customCompany, setCustomCompany] = useState('');
  const [seniority, setSeniority] = useState<SeniorityLevel>('Senior');
  const [interviewType, setInterviewType] = useState<InterviewType>('full');
  const [interviewerPersona, setInterviewerPersona] = useState<InterviewerPersona>('bar_raiser');
  const [candidateContext, setCandidateContext] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [enableCoachMode, setEnableCoachMode] = useState(true);
  const [enableVoice, setEnableVoice] = useState(true);
  const [enableWebcam, setEnableWebcam] = useState(true);

  const selectedCompanyObj = COMPANY_PRESETS.find((c) => c.name === company);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalRole = role === 'custom' ? customRole.trim() || 'Software Engineer' : role;
    const finalCompany = company === 'custom' ? customCompany.trim() || 'Tech Enterprise' : company;

    onStartSession({
      role: finalRole,
      company: finalCompany,
      seniority,
      interviewType,
      interviewerPersona,
      candidateContext,
      customNotes,
      enableCoachMode,
      enableVoice,
      enableWebcam,
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Hero Banner */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interactive AI Interviewer & Evaluator Module</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Master Your Next Tech Interview with an <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">Adaptive AI Agent</span>
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-300">
          Realistic multi-stage mock interviews tailored to your exact role, target company culture, and seniority. Featuring real-time voice speech, video preview, adaptive follow-up probing, and executive rubric scorecards.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Role & Seniority */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Target Position & Seniority</h2>
              <p className="text-xs text-slate-400">Select the exact role profile the AI agent will assess you for</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Role picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                <span>Job Role</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {ROLE_PRESETS.map((p) => (
                  <option key={p.id} value={p.title}>
                    {p.title} ({p.category})
                  </option>
                ))}
                <option value="custom">-- Custom / Other Role --</option>
              </select>

              {role === 'custom' && (
                <input
                  type="text"
                  placeholder="e.g. Cloud Security Architect, DevOps SRE, iOS Engineer..."
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  className="mt-2.5 w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              )}
            </div>

            {/* Seniority Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
                <span>Seniority Level</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {(['Junior', 'Mid-Level', 'Senior', 'Staff/Principal', 'Engineering Lead'] as SeniorityLevel[]).map(
                  (lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSeniority(lvl)}
                      className={`px-2 py-2 rounded-xl text-xs font-medium border text-center transition-all ${
                        seniority === lvl
                          ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 shadow-sm'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                      }`}
                    >
                      {lvl}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Company & Interview Track */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Target Company & Interview Track</h2>
              <p className="text-xs text-slate-400">Calibrates the evaluation criteria to the company's culture and interview format</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-pink-400" />
                <span>Target Company</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {COMPANY_PRESETS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCompany(c.name)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border text-center transition-all ${
                      company === c.name
                        ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {selectedCompanyObj && (
                <div className="mt-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
                  <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span>{selectedCompanyObj.cultureNotes}</span>
                </div>
              )}
            </div>

            {/* Interview Track */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Interview Focus Track</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  {
                    id: 'full' as InterviewType,
                    title: 'Full Mock Interview',
                    desc: 'End-to-end: Tech, Architecture & STAR',
                  },
                  {
                    id: 'behavioral' as InterviewType,
                    title: 'Behavioral & Leadership',
                    desc: 'STAR framework, conflict & impact',
                  },
                  {
                    id: 'system_design' as InterviewType,
                    title: 'System Design & Arch',
                    desc: 'Scalability, microservices & tradeoffs',
                  },
                  {
                    id: 'technical' as InterviewType,
                    title: 'Technical Conceptual',
                    desc: 'Concurrency, internals & performance',
                  },
                  {
                    id: 'rapid_fire' as InterviewType,
                    title: 'Rapid-Fire Drills',
                    desc: 'Quick conceptual and situational queries',
                  },
                ].map((track) => (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => setInterviewType(track.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      interviewType === track.id
                        ? 'bg-indigo-600/25 border-indigo-500 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-xs text-white">{track.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{track.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Interviewer Persona */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">AI Interviewer Persona & Rigor</h2>
              <p className="text-xs text-slate-400">Choose the questioning personality and pressure level</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                id: 'bar_raiser' as InterviewerPersona,
                name: 'David Vance',
                role: 'Bar Raiser / Principal',
                badge: 'High Rigor',
                badgeColor: 'text-amber-300 bg-amber-500/20 border-amber-500/30',
                desc: 'Deep follow-up probes. Challenges assumptions, asks for edge cases and hard metrics.',
              },
              {
                id: 'friendly' as InterviewerPersona,
                name: 'Sarah Chen',
                role: 'Staff Lead & Mentor',
                badge: 'Collaborative',
                badgeColor: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30',
                desc: 'Supportive and conversational. Helps you draw out your thought process and teamwork.',
              },
              {
                id: 'direct' as InterviewerPersona,
                name: 'Elena Rostova',
                role: 'Hiring Manager',
                badge: 'Pragmatic',
                badgeColor: 'text-blue-300 bg-blue-500/20 border-blue-500/30',
                desc: 'Fast-paced, zero-fluff. Tests real production battle-scars and operational reliability.',
              },
              {
                id: 'executive' as InterviewerPersona,
                name: 'Marcus Brody',
                role: 'VP of Technology',
                badge: 'Executive',
                badgeColor: 'text-purple-300 bg-purple-500/20 border-purple-500/30',
                desc: 'Strategic business impact, engineering ROI, cross-functional vision, and leadership.',
              },
            ].map((persona) => (
              <button
                key={persona.id}
                type="button"
                onClick={() => setInterviewerPersona(persona.id)}
                className={`p-4 rounded-xl border text-left transition-all relative ${
                  interviewerPersona === persona.id
                    ? 'bg-indigo-600/20 border-indigo-500 shadow-md shadow-indigo-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-sm text-white">{persona.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${persona.badgeColor}`}>
                    {persona.badge}
                  </span>
                </div>
                <div className="text-xs text-indigo-300 mb-2 font-medium">{persona.role}</div>
                <p className="text-xs text-slate-400 leading-relaxed">{persona.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Step 4: Resume / Candidate Context */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                4
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Your Background & Resume Notes (Optional)</h2>
                <p className="text-xs text-slate-400">The AI agent will reference your actual projects and ask personalized questions</p>
              </div>
            </div>

            {/* Quick sample buttons */}
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">Insert Sample:</span>
              {SAMPLE_RESUME_SNIPPETS.map((snippet, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCandidateContext(snippet.text)}
                  className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[11px] text-indigo-300 border border-slate-700"
                >
                  {snippet.label.split(' ')[1]}
                </button>
              ))}
            </div>
          </div>

          <textarea
            rows={3}
            value={candidateContext}
            onChange={(e) => setCandidateContext(e.target.value)}
            placeholder="Paste 3-5 bullet points of your key projects, tech stack (e.g., React, Go, Kafka, AWS), latency wins, or leadership highlights..."
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />

          <input
            type="text"
            value={customNotes}
            onChange={(e) => setCustomNotes(e.target.value)}
            placeholder="Specific focus areas (e.g. 'Press heavily on distributed cache invalidation and team conflict')"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Step 5: Practice Controls & Launch Button */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-5">
            {/* Coach Mode Toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={enableCoachMode}
                onChange={(e) => setEnableCoachMode(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-0"
              />
              <div className="text-xs">
                <span className="font-semibold text-white block">Coach Mode</span>
                <span className="text-slate-400 text-[11px]">Instant rubric feedback per question</span>
              </div>
            </label>

            {/* Voice Toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={enableVoice}
                onChange={(e) => setEnableVoice(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-0"
              />
              <div className="text-xs flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                <div>
                  <span className="font-semibold text-white block">Voice Synthesizer</span>
                  <span className="text-slate-400 text-[11px]">Speaks questions aloud</span>
                </div>
              </div>
            </label>

            {/* Video Mirror Toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={enableWebcam}
                onChange={(e) => setEnableWebcam(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-0"
              />
              <div className="text-xs flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-purple-400" />
                <div>
                  <span className="font-semibold text-white block">Video Preview Mirror</span>
                  <span className="text-slate-400 text-[11px]">Simulates remote interview</span>
                </div>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full md:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Preparing Session with AI Interviewer...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Enter AI Interview Room</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
