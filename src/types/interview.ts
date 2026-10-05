export type SeniorityLevel = 'Junior' | 'Mid-Level' | 'Senior' | 'Staff/Principal' | 'Engineering Lead';

export type InterviewType = 'full' | 'behavioral' | 'system_design' | 'technical' | 'rapid_fire';

export type InterviewerPersona = 'friendly' | 'bar_raiser' | 'direct' | 'executive';

export interface InterviewConfig {
  role: string;
  company: string;
  seniority: SeniorityLevel;
  interviewType: InterviewType;
  interviewerPersona: InterviewerPersona;
  candidateContext: string;
  customNotes: string;
  enableCoachMode: boolean;
  enableVoice: boolean;
  enableWebcam: boolean;
}

export interface QuestionGuidance {
  situation?: string;
  task?: string;
  action?: string;
  result?: string;
}

export interface Question {
  id: string;
  stageNumber: number;
  stageName: string;
  questionText: string;
  targetCompetency: string;
  expectedPoints: string[];
  starGuidance?: QuestionGuidance;
}

export interface StarAdherence {
  hasSituation: boolean;
  hasTask: boolean;
  hasAction: boolean;
  hasResult: boolean;
}

export interface TurnRubricEvaluation {
  score: number;
  strengths: string[];
  missedOpportunities: string[];
  starAdherence: StarAdherence;
  coachTip: string;
}

export interface DialogueTurn {
  id: string;
  role: 'interviewer' | 'candidate';
  text: string;
  questionId?: string;
  timestamp: number;
  rubric?: TurnRubricEvaluation;
  isFollowUp?: boolean;
}

export interface QuestionBreakdown {
  questionText: string;
  targetCompetency: string;
  candidateScore: number;
  candidateStrengths: string[];
  candidateGaps: string[];
  exemplarAnswer: string;
}

export interface ActionPlanDay {
  day: number;
  focus: string;
  task: string;
  keyTakeaway: string;
}

export interface FullDiagnosticReport {
  id?: string;
  date?: string;
  overallScore: number;
  hiringDecision: 'Strong Hire' | 'Hire' | 'Leaning Hire' | 'Leaning No Hire' | 'Strong No Hire';
  decisionSummary: string;
  topSuperpower: string;
  criticalBlindspot: string;
  competencyScores: {
    technicalDepth: { score: number; summary: string };
    communicationStructure: { score: number; summary: string };
    problemSolvingTradeoffs: { score: number; summary: string };
    impactAndExecution: { score: number; summary: string };
    leadershipAndFit: { score: number; summary: string };
  };
  questionBreakdowns: QuestionBreakdown[];
  actionPlan: ActionPlanDay[];
  sessionMetadata?: {
    date: string;
    role: string;
    company: string;
    seniority: string;
    interviewType: string;
    durationMinutes: number;
    questionCount: number;
  };
}

export interface ElevatorPitchAnalysis {
  hookScore: number;
  structureScore: number;
  impactScore: number;
  overallScore: number;
  critique: string;
  strengths: string[];
  clichesToRemove: string[];
  improvedPitchVersion: string;
  memorableTaglines: string[];
}

export interface StarStory {
  title: string;
  situation: string;
  task: string;
  action: string[];
  result: string;
  anticipatedProbes: string[];
  metricsAdvice: string;
}

export interface QuestionBankItem {
  id: string;
  question: string;
  difficulty: 'Medium' | 'Hard' | 'Staff-Level';
  category?: string;
  whatInterviewerLooksFor: string;
  sampleKeyTakeaways: string[];
  commonPitfall: string;
}
