import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper to extract JSON safely from Gemini output
function extractJsonFromText(text: string): any {
  if (!text) return null;
  let clean = text.trim();
  if (clean.startsWith('```json')) {
    clean = clean.replace(/^```json\s*/, '').replace(/```\s*$/, '');
  } else if (clean.startsWith('```')) {
    clean = clean.replace(/^```\s*/, '').replace(/```\s*$/, '');
  }
  try {
    return JSON.parse(clean);
  } catch (err) {
    // Attempt to extract the first balanced JSON object or array
    const jsonMatch = clean.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        // fallback
      }
    }
    throw new Error('Failed to parse model JSON: ' + clean.substring(0, 150));
  }
}

// 1. START INTERVIEW SESSION
app.post('/api/interview/start', async (req: Request, res: Response) => {
  try {
    const {
      role = 'Full Stack Software Engineer',
      company = 'Top Tech Company',
      seniority = 'Senior',
      interviewType = 'full', // 'full' | 'behavioral' | 'system_design' | 'technical' | 'rapid_fire'
      interviewerPersona = 'bar_raiser', // 'friendly' | 'bar_raiser' | 'direct' | 'executive'
      candidateContext = '',
      customNotes = '',
    } = req.body;

    const personaDescriptions: Record<string, { name: string; title: string; style: string; tone: string }> = {
      friendly: {
        name: 'Sarah Chen',
        title: `Staff Lead & Engineering Mentor at ${company}`,
        style: 'Warm, collaborative, encouraging candidate to elaborate on thought processes',
        tone: 'Supportive, conversational, constructive',
      },
      bar_raiser: {
        name: 'David Vance',
        title: `Principal Bar Raiser & Technical Director at ${company}`,
        style: 'Highly analytical, challenges architectural assumptions, presses for measurable metrics and edge-cases',
        tone: 'Rigorous, piercing, professional, objective',
      },
      direct: {
        name: 'Elena Rostova',
        title: `Engineering Hiring Manager at ${company}`,
        style: 'Fast-paced, focused on trade-offs, production reliability, and operational execution',
        tone: 'Direct, focused, zero-fluff, pragmatic',
      },
      executive: {
        name: 'Marcus Brody',
        title: `VP of Technology & Systems at ${company}`,
        style: 'High-level business impact, strategic architectural vision, team leadership, and cross-functional alignment',
        tone: 'Strategic, visionary, probing on ROI and team scale',
      },
    };

    const persona = personaDescriptions[interviewerPersona] || personaDescriptions.bar_raiser;

    const prompt = `You are designing a high-fidelity, adaptive job interview for a ${seniority} ${role} role at ${company}.
Interviewer Persona: ${persona.name} (${persona.title}).
Interviewer Style: ${persona.style}. Tone: ${persona.tone}.
Interview Type: ${interviewType}.
Candidate Resume/Context: ${candidateContext ? candidateContext : 'Standard industry experience for this level'}.
Special Focus/Notes: ${customNotes || 'Thorough evaluation across competence and communication'}.

Generate the interview session plan and the first opening question.
The interview should comprise 4-5 core progressive stages (e.g. Warmup/Role Fit, Technical Depth/Architecture, Behavioral/STAR Leadership, Problem Solving & Tradeoffs, Closing).
The first question should be tailored, thoughtful, and immediately set the tone. If the candidate provided resume context, reference a relevant theme or project from it.

Return ONLY a valid JSON object matching this exact schema:
{
  "interviewer": {
    "name": "${persona.name}",
    "title": "${persona.title}",
    "greeting": "A realistic, spoken welcoming greeting from the interviewer introducing themselves and setting expectations for today's session (2-3 sentences)."
  },
  "stages": [
    { "id": 1, "name": "Stage Name", "description": "Short description of focus" }
  ],
  "firstQuestion": {
    "id": "q1",
    "stageNumber": 1,
    "stageName": "Introduction & Architectural Context",
    "questionText": "The actual question the interviewer speaks aloud to the candidate.",
    "targetCompetency": "Core skill being evaluated (e.g., System Architecture, STAR Leadership, Concurrency, etc.)",
    "expectedPoints": [
      "Key point or nuance a top candidate should mention",
      "Another key signal"
    ],
    "starGuidance": {
      "situation": "Brief prompt for Situation",
      "task": "Brief prompt for Task",
      "action": "Brief prompt for Action",
      "result": "Brief prompt for Measurable Result"
    }
  }
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const parsed = extractJsonFromText(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error starting interview:', error);
    res.status(500).json({ error: error.message || 'Failed to start interview session' });
  }
});

// 2. TURN EVALUATION & ADAPTIVE FOLLOW-UP OR PROGRESSION
app.post('/api/interview/turn', async (req: Request, res: Response) => {
  try {
    const {
      role,
      company,
      seniority,
      interviewType,
      interviewerPersona,
      candidateAnswer,
      currentQuestion,
      history = [],
      questionIndex = 1,
      totalQuestions = 5,
      coachMode = true,
      hasFollowedUpThisQuestion = false,
    } = req.body;

    const prompt = `You are acting as the AI Interviewer (${interviewerPersona || 'Bar Raiser'}) conducting an interview for a ${seniority} ${role} at ${company}.
Interview Type: ${interviewType}.
Current Question (Question #${questionIndex} of ${totalQuestions}):
"${currentQuestion?.questionText}"
Target Competency: "${currentQuestion?.targetCompetency}".
Expected Key Points: ${JSON.stringify(currentQuestion?.expectedPoints || [])}.

Candidate's Answer:
"""
${candidateAnswer}
"""

Previous Dialogue History:
${history.map((h: any) => `${h.role.toUpperCase()}: ${h.text}`).slice(-4).join('\n')}

Already Followed Up on this question? ${hasFollowedUpThisQuestion ? 'YES (Advance to next question unless candidate gave an empty or evasive response)' : 'NO (You may probe if answer lacked depth, specificity, metrics, or trade-offs)'}.

Evaluate the candidate's answer and decide the next step:
1. DECISION:
   - Should you ask an ADAPTIVE FOLLOW-UP PROBE (if they mentioned a technology/decision without justifying tradeoffs, or gave high-level claims without concrete metrics or personal contribution, and hasFollowedUpThisQuestion is false)?
   - OR should you ADVANCE to the NEXT interview stage/question (or COMPLETE the interview if questionIndex >= totalQuestions)?
2. INTERVIEWER SPEECH:
   - Craft the exact words the interviewer will say aloud.
   - Start with a natural, professional conversational reaction acknowledging their point (1 sentence), then deliver either the follow-up probe OR transition to the new question. Keep it sounding like a real senior human interviewer.
3. IMMEDIATE FEEDBACK & RUBRIC (for candidate learning):
   - Score (0 to 100)
   - Strengths (2-3 bullet items)
   - Areas for Improvement / Missed Nuances (2-3 bullet items)
   - STAR adherence: check if they demonstrated Situation, Task, Action, Result
   - Quick Coach Tip: 1 actionable sentence on how to make this answer significantly stronger.

Return ONLY a valid JSON object matching this exact schema:
{
  "action": "follow_up" | "next_question" | "complete_interview",
  "interviewerSpeech": "The exact spoken words of the interviewer to the candidate.",
  "isFollowUp": true | false,
  "nextQuestion": {
    "id": "q${questionIndex + 1}",
    "stageNumber": ${questionIndex + 1},
    "stageName": "Title of next topic or stage",
    "questionText": "The new question if action is next_question, else null",
    "targetCompetency": "Competency name",
    "expectedPoints": ["point 1", "point 2"],
    "starGuidance": {
      "situation": "Brief guidance",
      "task": "Brief guidance",
      "action": "Brief guidance",
      "result": "Brief guidance"
    }
  },
  "rubricEvaluation": {
    "score": 82,
    "strengths": ["Clear architectural articulation", "Mentioned latency SLAs"],
    "missedOpportunities": ["Did not quantify data volume or concurrency", "Lacked details on failure recovery"],
    "starAdherence": {
      "hasSituation": true,
      "hasTask": true,
      "hasAction": true,
      "hasResult": false
    },
    "coachTip": "Always quantify the business impact (e.g. '% reduction in p99 latency' or 'dollar savings') at the conclusion."
  }
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.6,
      },
    });

    const parsed = extractJsonFromText(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error processing interview turn:', error);
    res.status(500).json({ error: error.message || 'Failed to process turn' });
  }
});

// 3. REAL-TIME SMART HINT / COACH NUDGE
app.post('/api/interview/hint', async (req: Request, res: Response) => {
  try {
    const { currentQuestion, candidateDraft = '', role, seniority } = req.body;

    const prompt = `The candidate is currently in a ${seniority} ${role} interview answering this question:
"${currentQuestion?.questionText}"
Target Competency: "${currentQuestion?.targetCompetency}".
Candidate's current draft or thought so far: "${candidateDraft || '(Candidate has not started typing or is feeling stuck)'}".

Provide a smart, structured coaching hint to help the candidate frame their response effectively without giving away a generic cookie-cutter answer.
Return ONLY a valid JSON object:
{
  "frameworkTip": "Recommended structure to anchor the answer (e.g. STAR, CAR, or System Design Scope->API->Data->Scale).",
  "suggestedKeywords": ["3-5 high-signal technical or leadership keywords relevant here"],
  "starterPhrase": "A strong, confident opening phrase the candidate can use to begin their answer.",
  "pitfallsToAvoid": ["1-2 common mistakes interviewers hate for this specific question"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.5,
      },
    });

    const parsed = extractJsonFromText(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error generating hint:', error);
    res.status(500).json({ error: error.message || 'Failed to generate hint' });
  }
});

// 4. FULL POST-INTERVIEW DIAGNOSTIC REPORT & HIRING DECISION
app.post('/api/interview/evaluate-full', async (req: Request, res: Response) => {
  try {
    const {
      role,
      company,
      seniority,
      interviewType,
      interviewerPersona,
      transcript = [],
      durationSeconds = 600,
    } = req.body;

    const prompt = `You are the Lead Hiring Committee Chair and Bar Raiser reviewing the complete interview session for a ${seniority} ${role} candidate at ${company}.
Interview Type: ${interviewType}.
Duration: ${Math.round(durationSeconds / 60)} minutes.

Full Interview Transcript:
${transcript
  .map(
    (t: any, idx: number) =>
      `[Item ${idx + 1}]
Question (${t.targetCompetency || 'Competency'}): "${t.question}"
Candidate Answer: "${t.answer || '(No answer provided)'}"
Interviewer Probe / Response: "${t.interviewerFeedback || ''}"
`
  )
  .join('\n\n')}

Conduct a deep, rigorous hiring evaluation.
Score the candidate on a 0-100 scale across 5 distinct dimensions:
1. Technical Depth & Domain Mastery
2. Communication Clarity & Structured Thinking (STAR Framework)
3. Problem Solving, Edge Cases & Tradeoff Analysis
4. Measurable Impact & Execution Ownership
5. Cultural Alignment, Leadership & Executive Presence

Select a Hiring Decision:
- 'Strong Hire' (90-100)
- 'Hire' (80-89)
- 'Leaning Hire' (70-79)
- 'Leaning No Hire' (60-69)
- 'Strong No Hire' (<60)

For each question in the transcript, evaluate their actual answer and provide:
- Score (0-100)
- Strengths
- Critical Gaps
- An "Exemplar Rewrite": How a Staff/Principal-level candidate would have answered this exact question powerfully in 3-4 sentences.

Also generate a concrete 7-Day Interview Readiness Action Plan tailored to their specific weaknesses.

Return ONLY a valid JSON object matching this schema:
{
  "overallScore": 84,
  "hiringDecision": "Hire",
  "decisionSummary": "2-3 sentences summarizing the hiring committee consensus.",
  "topSuperpower": "The candidate's standout strength observed in this session.",
  "criticalBlindspot": "The single biggest area that could hold the candidate back in final rounds.",
  "competencyScores": {
    "technicalDepth": { "score": 85, "summary": "Feedback on technical depth" },
    "communicationStructure": { "score": 80, "summary": "Feedback on communication" },
    "problemSolvingTradeoffs": { "score": 82, "summary": "Feedback on tradeoffs" },
    "impactAndExecution": { "score": 88, "summary": "Feedback on metrics and results" },
    "leadershipAndFit": { "score": 85, "summary": "Feedback on team/culture fit" }
  },
  "questionBreakdowns": [
    {
      "questionText": "Question string",
      "targetCompetency": "Competency",
      "candidateScore": 82,
      "candidateStrengths": ["bullet 1"],
      "candidateGaps": ["bullet 1"],
      "exemplarAnswer": "Polished, elite exemplar response showing ideal structure and metrics."
    }
  ],
  "actionPlan": [
    {
      "day": 1,
      "focus": "Focus Title (e.g. Distributed System Tradeoffs)",
      "task": "Concrete 30-min exercise to do",
      "keyTakeaway": "What skill this solidifies"
    },
    { "day": 2, "focus": "...", "task": "...", "keyTakeaway": "..." },
    { "day": 3, "focus": "...", "task": "...", "keyTakeaway": "..." },
    { "day": 4, "focus": "...", "task": "...", "keyTakeaway": "..." },
    { "day": 5, "focus": "...", "task": "...", "keyTakeaway": "..." },
    { "day": 6, "focus": "...", "task": "...", "keyTakeaway": "..." },
    { "day": 7, "focus": "...", "task": "...", "keyTakeaway": "..." }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.5,
      },
    });

    const parsed = extractJsonFromText(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error generating diagnostic report:', error);
    res.status(500).json({ error: error.message || 'Failed to generate report' });
  }
});

// 5. TEXT-TO-SPEECH (TTS) FOR REALISTIC INTERVIEWER VOICE
app.post('/api/interview/tts', async (req: Request, res: Response) => {
  try {
    const { text, persona = 'bar_raiser' } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required for TTS' });
    }

    // Voice mapping for personas
    // Available voices: 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
    const voiceMapping: Record<string, string> = {
      friendly: 'Kore',
      bar_raiser: 'Fenrir',
      direct: 'Charon',
      executive: 'Zephyr',
    };
    const voiceName = voiceMapping[persona] || 'Fenrir';

    // Limit text length for TTS to prevent excessive latency (first 2 sentences or max 300 chars)
    const sanitizedText = text.length > 350 ? text.substring(0, 350) + '...' : text;

    const ttsResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: sanitizedText,
              speechMetadata: {
                style: persona === 'friendly' ? 'Warm, encouraging, engaging' : 'Professional, articulate, authoritative',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res.status(500).json({ error: 'No audio generated by TTS model' });
    }

    res.json({ audioBase64: base64Audio, format: 'audio/wav' });
  } catch (error: any) {
    console.warn('TTS model call error (fallback to client synthesis):', error.message);
    res.status(500).json({ error: error.message || 'TTS generation unavailable' });
  }
});

// 6. ELEVATOR PITCH & "TELL ME ABOUT YOURSELF" COACH
app.post('/api/prep/elevator-pitch', async (req: Request, res: Response) => {
  try {
    const { pitch, targetRole = 'Software Engineer', targetCompany = 'Tech Company' } = req.body;

    const prompt = `You are an executive career coach preparing a candidate for a ${targetRole} role at ${targetCompany}.
Candidate's "Tell Me About Yourself" / Elevator Pitch:
"""
${pitch}
"""

Evaluate this pitch on:
1. Hook & Opening Confidence (Does it grab attention immediately?)
2. Trajectory & Narrative Arc (Does it logically lead to why this role/company is their next milestone?)
3. Measurable Impact & Specificity (Does it avoid generic clichés like "I'm a passionate problem solver"?)
4. Conciseness & Time Efficiency (Ideal spoken length: 60-90 seconds)

Return ONLY a valid JSON object:
{
  "hookScore": 7,
  "structureScore": 8,
  "impactScore": 6,
  "overallScore": 75,
  "critique": "2-3 sentences of honest, constructive coaching feedback.",
  "strengths": ["bullet 1", "bullet 2"],
  "clichesToRemove": ["phrase 1 to cut", "phrase 2 to cut"],
  "improvedPitchVersion": "A polished, charismatic, high-impact version of their pitch that sounds natural to speak aloud in ~60 seconds.",
  "memorableTaglines": ["A snappy 1-line self-branding statement"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.6,
      },
    });

    const parsed = extractJsonFromText(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error analyzing elevator pitch:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze pitch' });
  }
});

// 7. STAR STORY ARCHITECT
app.post('/api/prep/star-story', async (req: Request, res: Response) => {
  try {
    const { rawExperience, targetCompetency = 'Technical Leadership & Problem Solving' } = req.body;

    const prompt = `Turn this raw experience or project notes into an elite, interview-ready STAR method story:
Target Competency: "${targetCompetency}"
Raw Notes / Experience:
"""
${rawExperience}
"""

Structure it into crisp, high-impact STAR sections:
- Situation (1-2 sentences setting stakes, scale, and problem)
- Task (The candidate's specific ownership and objective)
- Action (3-4 bullet points detailing technical or strategic steps the candidate directly executed, decisions made, and obstacles surmounted)
- Result (Quantified business and engineering metrics, latency, revenue, team velocity, or user adoption)

Also provide:
- Anticipated Follow-up Probes: 3 sharp questions interviewers will ask about this story.
- Metrics Enhancer: Suggestions for numbers or metrics to attach if not already present.

Return ONLY a valid JSON object:
{
  "title": "Snappy title for this story",
  "situation": "...",
  "task": "...",
  "action": ["bullet 1", "bullet 2", "bullet 3"],
  "result": "...",
  "anticipatedProbes": ["probe 1", "probe 2", "probe 3"],
  "metricsAdvice": "How to make the results even more compelling with real data points."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.6,
      },
    });

    const parsed = extractJsonFromText(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error generating STAR story:', error);
    res.status(500).json({ error: error.message || 'Failed to generate STAR story' });
  }
});

// 8. CURATED QUESTION BANK GENERATOR
app.post('/api/prep/generate-questions', async (req: Request, res: Response) => {
  try {
    const { role = 'Software Engineer', category = 'system_design', seniority = 'Senior' } = req.body;

    const prompt = `Generate 6 high-yield interview questions for a ${seniority} ${role} focusing on ${category}.
For each question, provide:
- question: The realistic interview question
- difficulty: 'Medium' | 'Hard' | 'Staff-Level'
- whatInterviewerLooksFor: Key signals and rubric expectations
- sampleKeyTakeaways: 3 key bullet points of a winning response
- commonPitfall: Red flag that leads to rejection

Return ONLY a valid JSON array:
[
  {
    "id": "q1",
    "question": "...",
    "difficulty": "Hard",
    "whatInterviewerLooksFor": "...",
    "sampleKeyTakeaways": ["...", "..."],
    "commonPitfall": "..."
  }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const parsed = extractJsonFromText(response.text || '[]');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error generating questions:', error);
    res.status(500).json({ error: error.message || 'Failed to generate questions' });
  }
});

// Server configuration & Vite middleware
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Interview Preparation Agent Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
