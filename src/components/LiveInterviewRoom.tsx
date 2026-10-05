import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Send, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Clock, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Layers, 
  Code, 
  Compass, 
  RotateCcw,
  StopCircle,
  Award,
  BookOpen,
  MessageSquare
} from 'lucide-react';
import { 
  InterviewConfig, 
  Question, 
  DialogueTurn, 
  TurnRubricEvaluation 
} from '../types/interview';

interface LiveInterviewRoomProps {
  config: InterviewConfig;
  initialQuestion: Question;
  interviewerProfile: { name: string; title: string; greeting: string };
  onFinishSession: (transcript: Array<{ question: string; answer: string; targetCompetency: string; interviewerFeedback?: string }>, durationSeconds: number) => void;
  onAbortSession: () => void;
}

export const LiveInterviewRoom: React.FC<LiveInterviewRoomProps> = ({
  config,
  initialQuestion,
  interviewerProfile,
  onFinishSession,
  onAbortSession,
}) => {
  // Session State
  const [currentQuestion, setCurrentQuestion] = useState<Question>(initialQuestion);
  const [questionIndex, setQuestionIndex] = useState(1);
  const totalQuestions = 5;
  const [history, setHistory] = useState<DialogueTurn[]>([
    {
      id: 'greeting',
      role: 'interviewer',
      text: interviewerProfile.greeting,
      timestamp: Date.now(),
    },
    {
      id: initialQuestion.id,
      role: 'interviewer',
      text: initialQuestion.questionText,
      questionId: initialQuestion.id,
      timestamp: Date.now(),
    },
  ]);

  // Candidate input
  const [candidateDraft, setCandidateDraft] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasFollowedUpThisQuestion, setHasFollowedUpThisQuestion] = useState(false);

  // Rubric & Coach Feedback drawer
  const [latestRubric, setLatestRubric] = useState<TurnRubricEvaluation | null>(null);
  const [showCoachDrawer, setShowCoachDrawer] = useState(false);

  // Scratchpad
  const [scratchpadText, setScratchpadText] = useState('');
  const [showScratchpad, setShowScratchpad] = useState(false);

  // Smart Hint state
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [currentHint, setCurrentHint] = useState<{
    frameworkTip: string;
    suggestedKeywords: string[];
    starterPhrase: string;
    pitfallsToAvoid: string[];
  } | null>(null);
  const [showHintModal, setShowHintModal] = useState(false);

  // STAR Guide Modal
  const [showStarGuide, setShowStarGuide] = useState(false);

  // Transcript drawer
  const [showTranscript, setShowTranscript] = useState(false);

  // Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Agent State: 'idle' | 'speaking' | 'listening' | 'evaluating'
  const [agentState, setAgentState] = useState<'idle' | 'speaking' | 'listening' | 'evaluating'>('speaking');

  // Audio / Speech-to-Text & TTS
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isListeningMic, setIsListeningMic] = useState(false);
  const recognitionRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Video Preview Mirror
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isWebcamActive, setIsWebcamActive] = useState(config.enableWebcam);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format timer
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Setup Webcam if enabled
  useEffect(() => {
    if (isWebcamActive) {
      navigator.mediaDevices?.getUserMedia({ video: true, audio: false })
        .then((stream) => {
          mediaStreamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.warn('Webcam permission not granted or unavailable:', err);
          setIsWebcamActive(false);
        });
    } else {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    }
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isWebcamActive]);

  // Setup Web Speech Recognition for Candidate Mic
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + ' ';
        }
        setCandidateDraft(transcript.trim());
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e);
        setIsListeningMic(false);
      };

      recognition.onend = () => {
        setIsListeningMic(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleMicListening = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported by your current browser. You can type your response directly!');
      return;
    }

    if (isListeningMic) {
      recognitionRef.current.stop();
      setIsListeningMic(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListeningMic(true);
      } catch (err) {
        console.warn('Failed to start speech recognition:', err);
      }
    }
  };

  // Play question with TTS
  const playTextToSpeech = async (text: string) => {
    if (!config.enableVoice) return;
    setAgentState('speaking');
    setIsPlayingAudio(true);

    try {
      const res = await fetch('/api/interview/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          persona: config.interviewerPersona,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const audio = new Audio(`data:${data.format || 'audio/wav'};base64,${data.audioBase64}`);
          audioPlayerRef.current = audio;
          audio.onended = () => {
            setIsPlayingAudio(false);
            setAgentState('listening');
          };
          audio.onerror = () => {
            // Fallback to Web Speech API
            playBrowserTTS(text);
          };
          await audio.play();
          return;
        }
      }
      playBrowserTTS(text);
    } catch (e) {
      playBrowserTTS(text);
    }
  };

  const playBrowserTTS = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = config.interviewerPersona === 'bar_raiser' ? 0.95 : 1.05;
      utterance.onend = () => {
        setIsPlayingAudio(false);
        setAgentState('listening');
      };
      utterance.onerror = () => {
        setIsPlayingAudio(false);
        setAgentState('listening');
      };
      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlayingAudio(false);
      setAgentState('listening');
    }
  };

  const stopAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    setAgentState('listening');
  };

  // Initial speech greeting on mount
  useEffect(() => {
    if (config.enableVoice) {
      playTextToSpeech(`${interviewerProfile.greeting} ${initialQuestion.questionText}`);
    } else {
      setAgentState('listening');
    }
    return () => {
      stopAudio();
    };
  }, []);

  // Request Smart Hint
  const handleRequestHint = async () => {
    setIsLoadingHint(true);
    setShowHintModal(true);
    try {
      const res = await fetch('/api/interview/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentQuestion,
          candidateDraft,
          role: config.role,
          seniority: config.seniority,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentHint(data);
      }
    } catch (e) {
      console.error('Hint error:', e);
    } finally {
      setIsLoadingHint(false);
    }
  };

  // Submit Candidate's Answer
  const handleSubmitAnswer = async () => {
    if (!candidateDraft.trim() || isSubmitting) return;

    if (isListeningMic && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListeningMic(false);
    }

    const answerText = candidateDraft.trim();
    setIsSubmitting(true);
    setAgentState('evaluating');

    // Add candidate turn to history
    const candidateTurn: DialogueTurn = {
      id: `turn-cand-${Date.now()}`,
      role: 'candidate',
      text: answerText,
      questionId: currentQuestion.id,
      timestamp: Date.now(),
    };

    const updatedHistory = [...history, candidateTurn];
    setHistory(updatedHistory);

    try {
      const res = await fetch('/api/interview/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: config.role,
          company: config.company,
          seniority: config.seniority,
          interviewType: config.interviewType,
          interviewerPersona: config.interviewerPersona,
          candidateAnswer: answerText,
          currentQuestion,
          history: updatedHistory.map((h) => ({ role: h.role, text: h.text })),
          questionIndex,
          totalQuestions,
          coachMode: config.enableCoachMode,
          hasFollowedUpThisQuestion,
        }),
      });

      if (!res.ok) throw new Error('Failed to evaluate turn');
      const data = await res.json();

      // Interviewer turn
      const interviewerTurn: DialogueTurn = {
        id: `turn-ai-${Date.now()}`,
        role: 'interviewer',
        text: data.interviewerSpeech,
        timestamp: Date.now(),
        rubric: data.rubricEvaluation,
        isFollowUp: data.isFollowUp,
      };

      setHistory([...updatedHistory, interviewerTurn]);

      if (data.rubricEvaluation) {
        setLatestRubric(data.rubricEvaluation);
        if (config.enableCoachMode) {
          setShowCoachDrawer(true);
        }
      }

      // Read aloud interviewer's response
      if (config.enableVoice) {
        playTextToSpeech(data.interviewerSpeech);
      } else {
        setAgentState('listening');
      }

      // Handle next state
      if (data.action === 'follow_up' && !hasFollowedUpThisQuestion) {
        // Stay on question, note follow-up
        setHasFollowedUpThisQuestion(true);
        setCandidateDraft('');
      } else if (data.action === 'complete_interview' || questionIndex >= totalQuestions) {
        // Complete interview!
        setTimeout(() => {
          handleWrapUp([...updatedHistory, interviewerTurn]);
        }, 1500);
      } else if (data.nextQuestion) {
        // Transition to next question
        setCurrentQuestion(data.nextQuestion);
        setQuestionIndex((prev) => prev + 1);
        setHasFollowedUpThisQuestion(false);
        setCandidateDraft('');
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
      alert('Communication error with AI agent. Please try resubmitting.');
      setAgentState('listening');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Wrap up & generate full scorecard
  const handleWrapUp = (finalHistory = history) => {
    // Collect question & answer pairs
    const transcriptPairs: Array<{
      question: string;
      answer: string;
      targetCompetency: string;
      interviewerFeedback?: string;
    }> = [];

    // Match candidate turns with questions
    for (let i = 0; i < finalHistory.length; i++) {
      if (finalHistory[i].role === 'candidate') {
        const prevQ = finalHistory.slice(0, i).reverse().find((h) => h.role === 'interviewer');
        const nextAIFeedback = finalHistory.slice(i + 1).find((h) => h.role === 'interviewer');

        transcriptPairs.push({
          question: prevQ?.text || currentQuestion.questionText,
          answer: finalHistory[i].text,
          targetCompetency: currentQuestion.targetCompetency,
          interviewerFeedback: nextAIFeedback?.text || '',
        });
      }
    }

    if (transcriptPairs.length === 0) {
      transcriptPairs.push({
        question: currentQuestion.questionText,
        answer: candidateDraft || '(Candidate ended session before completing full answer)',
        targetCompetency: currentQuestion.targetCompetency,
      });
    }

    onFinishSession(transcriptPairs, elapsedSeconds);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6 space-y-4">
      {/* Session Top Bar */}
      <div className="glass-panel px-4 sm:px-6 py-3 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Role and Interviewer Info */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white shadow-md">
              {interviewerProfile.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-950 ${
                agentState === 'speaking'
                  ? 'bg-indigo-400 animate-ping'
                  : agentState === 'listening'
                  ? 'bg-emerald-400'
                  : 'bg-amber-400'
              }`}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">{interviewerProfile.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700 font-medium">
                {config.company}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {config.seniority} {config.role} • {interviewerProfile.title}
            </p>
          </div>
        </div>

        {/* Center: Stage & Progress */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-semibold text-white">
              Question {questionIndex} of {totalQuestions}
            </div>
            <div className="text-[11px] text-indigo-300">{currentQuestion.stageName}</div>
          </div>
          <div className="w-28 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 rounded-full"
              style={{ width: `${(questionIndex / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Right: Controls & Timer */}
        <div className="flex items-center gap-3">
          {/* Timer */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>

          {/* End Interview early button */}
          <button
            onClick={() => {
              if (confirm('Are you ready to conclude this mock interview and generate your full diagnostic scorecard?')) {
                handleWrapUp();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-xs font-semibold text-rose-300 transition-colors"
          >
            <StopCircle className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">End & Evaluate</span>
          </button>
        </div>
      </div>

      {/* Main Interview Stage: Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN: Interviewer Stage & Question (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Interviewer Visual Card */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 relative overflow-hidden flex flex-col items-center text-center">
            {/* Background glowing aura */}
            <div
              className={`absolute inset-0 bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent pointer-events-none transition-opacity duration-700 ${
                agentState === 'speaking' ? 'opacity-100' : 'opacity-30'
              }`}
            />

            {/* Central Animated Agent Visualizer */}
            <div className="relative my-4">
              <div
                className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500 ${
                  agentState === 'speaking'
                    ? 'scale-105 shadow-2xl shadow-indigo-500/30 bg-indigo-900/40 border-2 border-indigo-400'
                    : agentState === 'evaluating'
                    ? 'scale-95 shadow-xl shadow-amber-500/20 bg-amber-900/30 border-2 border-amber-400/60'
                    : 'bg-slate-900 border border-slate-800'
                }`}
              >
                {/* Visualizer rings if speaking */}
                {agentState === 'speaking' && (
                  <>
                    <span className="absolute inset-0 rounded-full border border-indigo-400 animate-ripple" />
                    <span className="absolute -inset-3 rounded-full border border-indigo-500/40 animate-ping" />
                  </>
                )}

                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white shadow-inner">
                    {interviewerProfile.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                </div>
              </div>
            </div>

            {/* Agent State Indicator */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-semibold mb-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  agentState === 'speaking'
                    ? 'bg-indigo-400 animate-pulse'
                    : agentState === 'listening'
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-amber-400 animate-spin'
                }`}
              />
              <span className="text-slate-300">
                {agentState === 'speaking'
                  ? `${interviewerProfile.name} is speaking...`
                  : agentState === 'listening'
                  ? 'Listening to candidate...'
                  : agentState === 'evaluating'
                  ? 'Analyzing response & evaluating rubric...'
                  : 'Ready'}
              </span>
            </div>

            {/* Audio Voice Control */}
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={() => {
                  if (isPlayingAudio) {
                    stopAudio();
                  } else {
                    playTextToSpeech(currentQuestion.questionText);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-colors"
              >
                {isPlayingAudio ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-indigo-300" />
                    <span>Mute Voice</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Replay Question Audio</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Current Question Display Card */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {currentQuestion.stageName}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Target: <strong className="text-slate-200">{currentQuestion.targetCompetency}</strong>
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white leading-snug tracking-tight">
              "{currentQuestion.questionText}"
            </h3>

            {/* Key Expected Dimensions (hints for candidate) */}
            {currentQuestion.expectedPoints && currentQuestion.expectedPoints.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Key Evaluation Dimensions:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentQuestion.expectedPoints.map((pt, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 border border-slate-800"
                    >
                      {pt}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Dialogue History Drawer Toggle */}
          <div className="glass-panel p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold text-slate-200">
                Session Transcript ({history.length} turns)
              </span>
            </div>
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              {showTranscript ? 'Hide' : 'View Dialogue'}
            </button>
          </div>

          {/* Transcript Scroll Area */}
          {showTranscript && (
            <div className="glass-card p-4 rounded-xl border border-slate-800 max-h-60 overflow-y-auto space-y-3 text-xs">
              {history.map((turn, i) => (
                <div
                  key={turn.id || i}
                  className={`p-2.5 rounded-lg ${
                    turn.role === 'interviewer'
                      ? 'bg-slate-900 border border-slate-800 text-slate-200'
                      : 'bg-indigo-950/40 border border-indigo-800/50 text-indigo-100 ml-4'
                  }`}
                >
                  <div className="font-semibold text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                    {turn.role === 'interviewer' ? interviewerProfile.name : 'You (Candidate)'}
                    {turn.isFollowUp && ' • Follow-up Probe'}
                  </div>
                  <p className="leading-relaxed">{turn.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Candidate Workspace & Response (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Candidate Video Preview & Quick Tools Header */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            {/* Left: Video Preview Window (compact) */}
            <div className="flex items-center gap-3">
              <div className="relative w-28 h-20 sm:w-36 sm:h-24 rounded-xl bg-slate-900 border border-slate-700/80 overflow-hidden flex items-center justify-center shadow-md">
                {isWebcamActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-500 text-[10px]">
                    <VideoOff className="w-5 h-5 mb-1" />
                    <span>Camera Off</span>
                  </div>
                )}

                {/* Webcam toggle badge */}
                <button
                  onClick={() => setIsWebcamActive(!isWebcamActive)}
                  className="absolute bottom-1 right-1 p-1 rounded-md bg-slate-950/80 hover:bg-slate-900 text-slate-300 text-[10px] border border-slate-700"
                  title="Toggle Camera"
                >
                  {isWebcamActive ? <Video className="w-3 h-3 text-emerald-400" /> : <VideoOff className="w-3 h-3 text-slate-400" />}
                </button>
              </div>

              <div>
                <span className="font-semibold text-xs text-white block">Candidate Console</span>
                <span className="text-[11px] text-slate-400 block">Speak aloud or type your answer</span>
                {isListeningMic && (
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-400 font-semibold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Microphone is transcribing live...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Helper Tools */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRequestHint}
                disabled={isLoadingHint}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/60 text-xs font-semibold text-purple-300 transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
                <span>Coach Hint</span>
              </button>

              <button
                type="button"
                onClick={() => setShowStarGuide(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-800/60 text-xs font-semibold text-indigo-300 transition-colors"
              >
                <Compass className="w-3.5 h-3.5 text-indigo-400" />
                <span>STAR Guide</span>
              </button>

              <button
                type="button"
                onClick={() => setShowScratchpad(!showScratchpad)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                  showScratchpad
                    ? 'bg-slate-800 text-white border-slate-600'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Scratchpad</span>
              </button>
            </div>
          </div>

          {/* Optional Scratchpad Drawer */}
          {showScratchpad && (
            <div className="glass-card p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5" />
                  <span>Architecture Notes & Scratchpad (Private)</span>
                </span>
                <span className="text-[10px] text-slate-500">Not submitted to interviewer</span>
              </div>
              <textarea
                rows={3}
                value={scratchpadText}
                onChange={(e) => setScratchpadText(e.target.value)}
                placeholder="Jot down quick thoughts: e.g. '1. Redis cache layer (LRU), 2. Kafka consumer groups, 3. Read replication...'"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {/* Candidate Response Editor */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <span>Your Spoken Response</span>
              </label>

              <div className="flex items-center gap-3">
                {/* Word count */}
                <span className="text-[11px] text-slate-400 font-mono">
                  {candidateDraft ? candidateDraft.trim().split(/\s+/).length : 0} words
                </span>

                {/* Speech Dictation Button */}
                <button
                  type="button"
                  onClick={toggleMicListening}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                    isListeningMic
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-500/25 animate-pulse'
                      : 'bg-slate-900 border border-slate-700 text-slate-300 hover:border-slate-600 hover:text-white'
                  }`}
                >
                  {isListeningMic ? (
                    <>
                      <MicOff className="w-3.5 h-3.5 text-white" />
                      <span>Stop Dictation</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Speak to Type</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <textarea
              rows={7}
              value={candidateDraft}
              onChange={(e) => setCandidateDraft(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  handleSubmitAnswer();
                }
              }}
              placeholder="State your answer clearly. Structure with the STAR framework (Situation, Task, Action, Result) or System Design steps. Highlight specific technical decisions, metrics, and tradeoffs..."
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed"
            />

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="text-[11px] text-slate-500 hidden sm:block">
                Press <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono">Ctrl+Enter</kbd> to submit
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                {candidateDraft && (
                  <button
                    type="button"
                    onClick={() => setCandidateDraft('')}
                    className="px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Clear
                  </button>
                )}

                <button
                  type="button"
                  disabled={!candidateDraft.trim() || isSubmitting}
                  onClick={handleSubmitAnswer}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-40 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Interviewer Evaluating...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Spoken Answer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Coach Rubric Immediate Feedback Drawer */}
          {latestRubric && showCoachDrawer && (
            <div className="glass-panel p-5 rounded-2xl border border-indigo-500/30 bg-indigo-950/20 space-y-4 transition-all">
              <div className="flex items-center justify-between pb-3 border-b border-indigo-500/20">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-400" />
                  <span className="font-bold text-sm text-white">Live Answer Evaluation</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Score:</span>
                  <span
                    className={`font-extrabold text-sm px-2.5 py-0.5 rounded-full border ${
                      latestRubric.score >= 80
                        ? 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30'
                        : latestRubric.score >= 65
                        ? 'text-amber-300 bg-amber-500/20 border-amber-500/30'
                        : 'text-rose-300 bg-rose-500/20 border-rose-500/30'
                    }`}
                  >
                    {latestRubric.score} / 100
                  </span>
                  <button
                    onClick={() => setShowCoachDrawer(false)}
                    className="text-xs text-slate-400 hover:text-slate-200 ml-2"
                  >
                    Dismiss
                  </button>
                </div>
              </div>

              {/* STAR Adherence badges */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  STAR Method Alignment:
                </span>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  {[
                    { label: 'Situation', val: latestRubric.starAdherence?.hasSituation },
                    { label: 'Task', val: latestRubric.starAdherence?.hasTask },
                    { label: 'Action', val: latestRubric.starAdherence?.hasAction },
                    { label: 'Result', val: latestRubric.starAdherence?.hasResult },
                  ].map((s, idx) => (
                    <div
                      key={idx}
                      className={`p-1.5 rounded-lg border font-medium text-[11px] flex items-center justify-center gap-1 ${
                        s.val
                          ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}
                    >
                      {s.val ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <AlertCircle className="w-3 h-3" />}
                      <span>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths & Missed Opportunities */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Strong Signals Observed</span>
                  </span>
                  <ul className="space-y-1 text-slate-300 list-disc list-inside">
                    {latestRubric.strengths?.map((st, i) => (
                      <li key={i}>{st}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <span className="font-semibold text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Areas to Sharpen</span>
                  </span>
                  <ul className="space-y-1 text-slate-300 list-disc list-inside">
                    {latestRubric.missedOpportunities?.map((mo, i) => (
                      <li key={i}>{mo}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Pro Tip */}
              {latestRubric.coachTip && (
                <div className="p-3 rounded-xl bg-indigo-950/60 border border-indigo-800/40 text-xs text-indigo-200 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block mb-0.5">Coach's Pro Tip:</strong>
                    <span>{latestRubric.coachTip}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Smart Hint Drawer */}
      {showHintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border border-purple-500/30 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-base text-white">Interviewer Smart Hint</h3>
              </div>
              <button
                onClick={() => setShowHintModal(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>

            {isLoadingHint ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400">Crafting personalized coaching nudge...</p>
              </div>
            ) : currentHint ? (
              <div className="space-y-4 text-xs">
                <div>
                  <span className="font-semibold text-slate-300 block mb-1 text-[11px] uppercase tracking-wider">
                    Recommended Answer Framework:
                  </span>
                  <p className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200">
                    {currentHint.frameworkTip}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-slate-300 block mb-1 text-[11px] uppercase tracking-wider">
                    High-Signal Keywords to Mention:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentHint.suggestedKeywords?.map((kw, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-purple-950/60 border border-purple-800/60 text-purple-300 font-medium"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-slate-300 block mb-1 text-[11px] uppercase tracking-wider">
                    Strong Starter Sentence:
                  </span>
                  <p className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-indigo-200 italic">
                    "{currentHint.starterPhrase}"
                  </p>
                </div>

                {currentHint.pitfallsToAvoid && (
                  <div>
                    <span className="font-semibold text-rose-300 block mb-1 text-[11px] uppercase tracking-wider">
                      Red Flag Pitfalls to Avoid:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                      {currentHint.pitfallsToAvoid.map((pitfall, i) => (
                        <li key={i}>{pitfall}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No hint available for this question.</p>
            )}

            <button
              onClick={() => setShowHintModal(false)}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs"
            >
              Got it, let's answer!
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: STAR Framework Reference Guide */}
      {showStarGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border border-indigo-500/30 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base text-white">The STAR Interview Framework</h3>
              </div>
              <button
                onClick={() => setShowStarGuide(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="font-bold text-indigo-300 mb-0.5">S • Situation (15% of time)</div>
                <p className="text-slate-400">
                  Set the scene and provide context. What was the company scale, user impact, or technical challenge? Avoid over-explaining background.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="font-bold text-purple-300 mb-0.5">T • Task (10% of time)</div>
                <p className="text-slate-400">
                  Define your specific responsibility and the core problem statement. What was your clear objective vs the broader team?
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="font-bold text-pink-300 mb-0.5">A • Action (50% of time - The Meat)</div>
                <p className="text-slate-400">
                  Detail what YOU personally decided and implemented. Speak in "I" rather than "We". Explain technical choices, trade-offs, and obstacles overcome.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="font-bold text-emerald-300 mb-0.5">R • Result (25% of time)</div>
                <p className="text-slate-400">
                  Quantify the outcome with concrete metrics (% latency reduction, error rates, revenue generated, team hours saved). Tie back to business value.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowStarGuide(false)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs"
            >
              Return to Interview
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
