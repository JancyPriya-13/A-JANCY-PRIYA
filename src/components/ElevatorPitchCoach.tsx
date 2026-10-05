import React, { useState, useRef } from 'react';
import { 
  Mic2, 
  Sparkles, 
  Send, 
  Award, 
  AlertTriangle, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff,
  Copy,
  Check,
  Briefcase
} from 'lucide-react';
import { ElevatorPitchAnalysis } from '../types/interview';

export const ElevatorPitchCoach: React.FC = () => {
  const [pitch, setPitch] = useState('');
  const [role, setRole] = useState('Senior Full Stack Engineer');
  const [company, setCompany] = useState('Google');
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ElevatorPitchAnalysis | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Dictation
  const [isDictating, setIsDictating] = useState(false);
  const recognitionRef = useRef<any>(null);

  // TTS audio playback
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleDictation = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your pitch.');
      return;
    }

    if (isDictating) {
      recognitionRef.current?.stop();
      setIsDictating(false);
    } else {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (e: any) => {
        let text = '';
        for (let i = 0; i < e.results.length; i++) {
          text += e.results[i][0].transcript + ' ';
        }
        setPitch(text.trim());
      };
      rec.onend = () => setIsDictating(false);
      recognitionRef.current = rec;
      rec.start();
      setIsDictating(true);
    }
  };

  const handleAnalyze = async () => {
    if (!pitch.trim() || isLoading) return;
    setIsLoading(true);
    setAnalysis(null);

    try {
      const res = await fetch('/api/prep/elevator-pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pitch: pitch.trim(),
          targetRole: role,
          targetCompany: company,
        }),
      });

      if (!res.ok) throw new Error('Analysis failed');
      const data = await res.json();
      setAnalysis(data);
    } catch (e: any) {
      alert('Error analyzing pitch: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePlayTTS = async (textToPlay: string) => {
    if (isPlayingAudio) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      window.speechSynthesis?.cancel();
      setIsPlayingAudio(false);
      return;
    }

    setIsPlayingAudio(true);
    try {
      const res = await fetch('/api/interview/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToPlay, persona: 'friendly' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
          audioRef.current = audio;
          audio.onended = () => setIsPlayingAudio(false);
          await audio.play();
          return;
        }
      }
      // Fallback
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(textToPlay);
        u.onend = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(u);
      } else {
        setIsPlayingAudio(false);
      }
    } catch (e) {
      setIsPlayingAudio(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
          <Mic2 className="w-3.5 h-3.5" />
          <span>60-Second Self-Introduction Coach</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Nail "Tell Me About Yourself"
        </h2>
        <p className="text-xs sm:text-sm text-slate-300">
          The opening 90 seconds set the anchor bias for the entire interview. Craft a magnetic, high-impact elevator pitch that highlights trajectory and measurable wins.
        </p>
      </div>

      {/* Inputs */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Role</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Company</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300">Your Current Pitch</label>
            <button
              type="button"
              onClick={toggleDictation}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                isDictating ? 'bg-rose-600 text-white' : 'bg-slate-900 text-indigo-300 border border-slate-800'
              }`}
            >
              {isDictating ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
              <span>{isDictating ? 'Recording...' : 'Dictate Spoken Pitch'}</span>
            </button>
          </div>
          <textarea
            rows={5}
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
            placeholder="e.g. 'I'm a full-stack engineer with 6 years of experience building high-throughput payment systems at FinTech scale. Most recently, I led the migration of our transaction ledger to Go and Kafka, cutting p99 latency by 75% while maintaining zero reconciliation discrepancies. I'm excited about Google's Cloud Spanner team because...'"
            className="w-full bg-slate-900/90 border border-slate-700 rounded-xl p-3.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed"
          />
        </div>

        <button
          onClick={handleAnalyze}
          disabled={!pitch.trim() || isLoading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-40 transition-all cursor-pointer"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing Pitch Mechanics...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Critique & Polish Pitch with AI</span>
            </>
          )}
        </button>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-indigo-500/30 space-y-6">
          {/* Scores Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">Overall</span>
              <span className="text-xl font-black text-indigo-400">{analysis.overallScore}%</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">Hook Grab</span>
              <span className="text-xl font-black text-emerald-400">{analysis.hookScore} / 10</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">Narrative Arc</span>
              <span className="text-xl font-black text-purple-400">{analysis.structureScore} / 10</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">Measurable Impact</span>
              <span className="text-xl font-black text-pink-400">{analysis.impactScore} / 10</span>
            </div>
          </div>

          {/* Coach Critique */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 block">
              Coach Assessment
            </span>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{analysis.critique}</p>
          </div>

          {/* Cliches & Strengths */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {analysis.strengths && (
              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1.5">
                <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Winning Elements Observed</span>
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  {analysis.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.clichesToRemove && analysis.clichesToRemove.length > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1.5">
                <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Generic Clichés to Cut</span>
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  {analysis.clichesToRemove.map((c, i) => (
                    <li key={i}>"{c}"</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Improved Version */}
          <div className="p-5 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-xs uppercase tracking-wider text-indigo-200">
                  AI Charismatic Rewrite (60-90s Delivery)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePlayTTS(analysis.improvedPitchVersion)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-300 text-xs transition-colors"
                >
                  {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{isPlayingAudio ? 'Stop Voice' : 'Listen'}</span>
                </button>
                <button
                  onClick={() => handleCopy(analysis.improvedPitchVersion)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs transition-colors"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-mono bg-slate-950/80 p-4 rounded-xl border border-slate-800/80">
              "{analysis.improvedPitchVersion}"
            </p>
          </div>

          {/* Memorable Taglines */}
          {analysis.memorableTaglines && analysis.memorableTaglines.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                Punchy 1-Sentence Self-Branding Hooks:
              </span>
              <div className="flex flex-wrap gap-2">
                {analysis.memorableTaglines.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-800/60 text-purple-200 font-medium"
                  >
                    "{tag}"
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
