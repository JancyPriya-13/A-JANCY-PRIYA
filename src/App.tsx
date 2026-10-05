import React, { useState, useEffect } from 'react';
import { Header, ActiveTab } from './components/Header';
import { InterviewSetup } from './components/InterviewSetup';
import { LiveInterviewRoom } from './components/LiveInterviewRoom';
import { DiagnosticScorecard } from './components/DiagnosticScorecard';
import { ElevatorPitchCoach } from './components/ElevatorPitchCoach';
import { StarStoryArchitect } from './components/StarStoryArchitect';
import { QuestionBankDrill } from './components/QuestionBankDrill';
import { SessionHistory } from './components/SessionHistory';
import { 
  InterviewConfig, 
  Question, 
  FullDiagnosticReport, 
  QuestionBankItem 
} from './types/interview';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('mock');

  // Mock Session States
  const [sessionStage, setSessionStage] = useState<'setup' | 'active' | 'evaluating'>('setup');
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [activeConfig, setActiveConfig] = useState<InterviewConfig | null>(null);
  const [initialQuestion, setInitialQuestion] = useState<Question | null>(null);
  const [interviewerProfile, setInterviewerProfile] = useState<{
    name: string;
    title: string;
    greeting: string;
  } | null>(null);

  // Diagnostic Report
  const [currentReport, setCurrentReport] = useState<FullDiagnosticReport | null>(null);

  // Stored History
  const [sessionHistory, setSessionHistory] = useState<FullDiagnosticReport[]>(() => {
    try {
      const stored = localStorage.getItem('prepgenius_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('prepgenius_history', JSON.stringify(sessionHistory));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }, [sessionHistory]);

  // Start new mock interview
  const handleStartSession = async (config: InterviewConfig) => {
    setIsStartingSession(true);
    setActiveConfig(config);

    try {
      const res = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!res.ok) {
        throw new Error('Failed to start session');
      }

      const data = await res.json();
      setInterviewerProfile(data.interviewer);
      setInitialQuestion(data.firstQuestion);
      setSessionStage('active');
    } catch (err: any) {
      console.error('Start interview error:', err);
      alert('Could not start interview session: ' + err.message);
    } finally {
      setIsStartingSession(false);
    }
  };

  // Complete session & evaluate
  const handleFinishSession = async (
    transcript: Array<{ question: string; answer: string; targetCompetency: string; interviewerFeedback?: string }>,
    durationSeconds: number
  ) => {
    setSessionStage('evaluating');

    try {
      const res = await fetch('/api/interview/evaluate-full', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: activeConfig?.role,
          company: activeConfig?.company,
          seniority: activeConfig?.seniority,
          interviewType: activeConfig?.interviewType,
          interviewerPersona: activeConfig?.interviewerPersona,
          transcript,
          durationSeconds,
        }),
      });

      if (!res.ok) {
        throw new Error('Diagnostic evaluation failed');
      }

      const reportData: FullDiagnosticReport = await res.json();

      // Attach metadata
      const enrichedReport: FullDiagnosticReport = {
        ...reportData,
        id: `session-${Date.now()}`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        sessionMetadata: {
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          role: activeConfig?.role || 'Software Engineer',
          company: activeConfig?.company || 'Tech Company',
          seniority: activeConfig?.seniority || 'Senior',
          interviewType: activeConfig?.interviewType || 'full',
          durationMinutes: Math.round(durationSeconds / 60) || 1,
          questionCount: transcript.length,
        },
      };

      setCurrentReport(enrichedReport);
      setSessionHistory((prev) => [enrichedReport, ...prev]);
      setSessionStage('setup');
      setActiveTab('report');
    } catch (e: any) {
      console.error('Evaluation error:', e);
      alert('Error generating diagnostic report: ' + e.message);
      setSessionStage('setup');
    }
  };

  const handlePracticeQuestion = (item: QuestionBankItem) => {
    setActiveTab('mock');
    setSessionStage('setup');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasActiveReport={!!currentReport}
        isSessionInProgress={sessionStage === 'active'}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {/* TAB 1: MOCK INTERVIEW MODULE */}
        {activeTab === 'mock' && (
          <>
            {sessionStage === 'setup' && (
              <InterviewSetup
                onStartSession={handleStartSession}
                isLoading={isStartingSession}
              />
            )}

            {sessionStage === 'active' && activeConfig && initialQuestion && interviewerProfile && (
              <LiveInterviewRoom
                config={activeConfig}
                initialQuestion={initialQuestion}
                interviewerProfile={interviewerProfile}
                onFinishSession={handleFinishSession}
                onAbortSession={() => setSessionStage('setup')}
              />
            )}

            {sessionStage === 'evaluating' && (
              <div className="max-w-md mx-auto my-24 p-8 glass-panel rounded-3xl border border-indigo-500/30 text-center space-y-4 shadow-2xl">
                <div className="w-12 h-12 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <h3 className="text-lg font-bold text-white">Synthesizing Diagnostic Scorecard</h3>
                <p className="text-xs text-slate-400">
                  The Hiring Committee & Bar Raiser are evaluating your communication clarity, technical depth, and tradeoff decisions across all interview stages...
                </p>
              </div>
            )}
          </>
        )}

        {/* TAB 2: SCORECARD / DIAGNOSTIC REPORT */}
        {activeTab === 'report' && currentReport && (
          <DiagnosticScorecard
            report={currentReport}
            onRetake={() => {
              setSessionStage('setup');
              setActiveTab('mock');
            }}
            onOpenQuestionBank={() => setActiveTab('questions')}
          />
        )}

        {/* TAB 3: ELEVATOR PITCH COACH */}
        {activeTab === 'pitch' && <ElevatorPitchCoach />}

        {/* TAB 4: STAR STORY ARCHITECT */}
        {activeTab === 'star' && <StarStoryArchitect />}

        {/* TAB 5: QUESTION BANK & DRILLS */}
        {activeTab === 'questions' && (
          <QuestionBankDrill onPracticeQuestion={handlePracticeQuestion} />
        )}

        {/* TAB 6: HISTORY */}
        {activeTab === 'history' && (
          <SessionHistory
            historyItems={sessionHistory}
            onSelectReport={(report) => {
              setCurrentReport(report);
              setActiveTab('report');
            }}
            onClearHistory={() => setSessionHistory([])}
            onStartNew={() => {
              setSessionStage('setup');
              setActiveTab('mock');
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">PrepGenius AI</span>
            <span>•</span>
            <span>Empowering candidates with adaptive AI mock interviews & real-time rubric coaching</span>
          </div>
          <div className="text-[11px] text-slate-600">
            Powered by Google Gemini 3.8 Flash Intelligence
          </div>
        </div>
      </footer>
    </div>
  );
}
