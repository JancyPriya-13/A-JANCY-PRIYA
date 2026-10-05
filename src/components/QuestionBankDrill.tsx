import React, { useState } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Filter, 
  ArrowRight, 
  Search,
  PlusCircle,
  HelpCircle,
  Layers
} from 'lucide-react';
import { QuestionBankItem } from '../types/interview';
import { DEFAULT_QUESTION_BANK } from '../data/interviewPresets';

interface QuestionBankDrillProps {
  onPracticeQuestion: (question: QuestionBankItem) => void;
}

export const QuestionBankDrill: React.FC<QuestionBankDrillProps> = ({ onPracticeQuestion }) => {
  const [questions, setQuestions] = useState<QuestionBankItem[]>(DEFAULT_QUESTION_BANK);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(questions[0]?.id || null);

  // Dynamic Generator state
  const [isGenerating, setIsGenerating] = useState(false);
  const [genRole, setGenRole] = useState('Senior Distributed Systems Engineer');
  const [genTopic, setGenTopic] = useState('Microservices, Kafka & Caching');

  const filteredQuestions = questions.filter((q) => {
    const matchesCat = selectedCategory === 'all' || q.category === selectedCategory;
    const matchesDiff = selectedDifficulty === 'all' || q.difficulty === selectedDifficulty;
    const matchesSearch =
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.whatInterviewerLooksFor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesDiff && matchesSearch;
  });

  const handleGenerateQuestions = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/prep/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: genRole,
          category: genTopic,
          seniority: 'Senior',
        }),
      });

      if (!res.ok) throw new Error('Generation failed');
      const newQuestions = await res.json();
      if (Array.isArray(newQuestions) && newQuestions.length > 0) {
        setQuestions([...newQuestions, ...questions]);
        setExpandedId(newQuestions[0].id);
      }
    } catch (e: any) {
      alert('Error generating questions: ' + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Curated High-Signal Question Bank</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Deconstruct Top-Tier Interview Questions
        </h2>
        <p className="text-xs sm:text-sm text-slate-300">
          Explore hard-hitting System Design, Behavioral, and Architecture questions with the exact evaluation signals and common rejection pitfalls.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search questions or keywords (e.g. rate limiter, conflict, MVCC)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Tracks</option>
            <option value="system_design">System Design</option>
            <option value="behavioral">Behavioral (STAR)</option>
            <option value="technical">Technical Internals</option>
            <option value="coding_concepts">Debugging & Performance</option>
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Difficulties</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
            <option value="Staff-Level">Staff-Level</option>
          </select>
        </div>
      </div>

      {/* Dynamic Question Generator Accordion */}
      <div className="glass-card p-4 rounded-2xl border border-purple-500/20 bg-purple-950/10 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-purple-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate New Role-Specific Questions with Gemini 3.8</span>
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            value={genRole}
            onChange={(e) => setGenRole(e.target.value)}
            placeholder="Target role..."
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={genTopic}
              onChange={(e) => setGenTopic(e.target.value)}
              placeholder="Focus topic (e.g. Distributed Consensus, Cassandra, Redis)..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            />
            <button
              onClick={handleGenerateQuestions}
              disabled={isGenerating}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shrink-0 flex items-center gap-1 disabled:opacity-40"
            >
              {isGenerating ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>
      </div>

      {/* Question Cards List */}
      <div className="space-y-4">
        {filteredQuestions.map((q) => {
          const isExpanded = expandedId === q.id;
          return (
            <div
              key={q.id}
              className="glass-panel rounded-2xl border border-slate-800 overflow-hidden transition-all"
            >
              {/* Card Header */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : q.id)}
                className="p-5 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-900/60 transition-colors"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        q.difficulty === 'Staff-Level'
                          ? 'text-pink-300 bg-pink-500/20 border-pink-500/30'
                          : q.difficulty === 'Hard'
                          ? 'text-amber-300 bg-amber-500/20 border-amber-500/30'
                          : 'text-indigo-300 bg-indigo-500/20 border-indigo-500/30'
                      }`}
                    >
                      {q.difficulty}
                    </span>
                    {q.category && (
                      <span className="text-[11px] text-slate-400 capitalize">
                        • {q.category.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                    "{q.question}"
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPracticeQuestion(q);
                  }}
                  className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-xs font-semibold text-indigo-200 shrink-0 transition-colors"
                >
                  <span>Practice in AI Mock</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Card Expanded Content */}
              {isExpanded && (
                <div className="p-5 pt-0 border-t border-slate-800/80 space-y-4 text-xs mt-2">
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <span className="font-bold text-indigo-300 text-[11px] uppercase tracking-wider block">
                      What Interviewers Look For:
                    </span>
                    <p className="text-slate-200 leading-relaxed">{q.whatInterviewerLooksFor}</p>
                  </div>

                  {/* Sample Key Takeaways */}
                  <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1.5">
                    <span className="font-bold text-emerald-400 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Winning Answer Core Dimensions</span>
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-slate-300">
                      {q.sampleKeyTakeaways?.map((takeaway, i) => (
                        <li key={i}>{takeaway}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Common Red Flag Pitfall */}
                  <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-1">
                    <span className="font-bold text-rose-400 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Common Rejection Trap</span>
                    </span>
                    <p className="text-slate-300 leading-relaxed">{q.commonPitfall}</p>
                  </div>

                  <div className="pt-2 flex justify-end sm:hidden">
                    <button
                      type="button"
                      onClick={() => onPracticeQuestion(q)}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                    >
                      <span>Practice in AI Mock Session</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
