import { QuestionBankItem } from '../types/interview';

export const ROLE_PRESETS = [
  {
    id: 'swe-fullstack',
    title: 'Full Stack Software Engineer',
    category: 'Engineering',
    defaultFocus: 'React, Node.js, distributed databases, REST/GraphQL APIs, microservices, end-to-end performance',
    suggestedSeniority: 'Senior' as const,
  },
  {
    id: 'swe-frontend',
    title: 'Senior Frontend Engineer',
    category: 'Engineering',
    defaultFocus: 'Modern React/Next.js, browser rendering engine, state management, web vitals, accessibility, design systems',
    suggestedSeniority: 'Senior' as const,
  },
  {
    id: 'swe-backend',
    title: 'Backend & Distributed Systems Engineer',
    category: 'Engineering',
    defaultFocus: 'High-throughput APIs, Kafka event streaming, PostgreSQL/Cassandra, caching tiers, concurrency, system resilience',
    suggestedSeniority: 'Senior' as const,
  },
  {
    id: 'swe-system-architect',
    title: 'Staff / Principal Systems Architect',
    category: 'Architecture',
    defaultFocus: 'Multi-region architectures, disaster recovery, consensus protocols, cost optimization, multi-team engineering standards',
    suggestedSeniority: 'Staff/Principal' as const,
  },
  {
    id: 'product-manager',
    title: 'Product Manager (Tech / Platform)',
    category: 'Product',
    defaultFocus: 'Product vision, North Star metrics, customer discovery, technical prioritization, roadmapping, go-to-market',
    suggestedSeniority: 'Senior' as const,
  },
  {
    id: 'ai-ml-engineer',
    title: 'AI / Machine Learning Engineer',
    category: 'AI / ML',
    defaultFocus: 'LLM fine-tuning, RAG pipelines, model inference optimization, vector databases, evaluation benchmarks, MLOps',
    suggestedSeniority: 'Senior' as const,
  },
  {
    id: 'eng-manager',
    title: 'Engineering Manager',
    category: 'Leadership',
    defaultFocus: 'Team scaling, engineering velocity, performance management, conflict resolution, technical debt strategy, hiring bar',
    suggestedSeniority: 'Staff/Principal' as const,
  },
];

export const COMPANY_PRESETS = [
  {
    id: 'google',
    name: 'Google',
    archetype: 'Big Tech / Scale',
    cultureNotes: 'High emphasis on algorithmic depth, scalability, system trade-offs, and "Googliness" (intellectual humility and collaboration).',
  },
  {
    id: 'amazon',
    name: 'Amazon',
    archetype: 'Big Tech / Leadership Principles',
    cultureNotes: 'Heavy focus on 16 Leadership Principles (Customer Obsession, Ownership, Bias for Action, Dive Deep). STAR method expected.',
  },
  {
    id: 'meta',
    name: 'Meta',
    archetype: 'Big Tech / High Velocity',
    cultureNotes: 'Move fast, strong focus on product architecture, quick problem deconstruction, and shipping high-impact code under ambiguity.',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    archetype: 'FinTech / High Bar',
    cultureNotes: 'Extreme precision, API design elegance, financial reliability, rigorous trade-off articulation, and empathy for developers.',
  },
  {
    id: 'ai-startup',
    name: 'Stealth AI Series B Startup',
    archetype: 'Hyper-Growth Startup',
    cultureNotes: 'Fast iteration, ownership, wear multiple hats, scrappy problem solving, pragmatic tech choices over premature optimization.',
  },
  {
    id: 'apple',
    name: 'Apple',
    archetype: 'Hardware / Ecosystem',
    cultureNotes: 'Obsession with user privacy, seamless end-to-end integration, deep hardware-software synergy, and perfectionist polish.',
  },
];

export const SAMPLE_RESUME_SNIPPETS = [
  {
    label: 'Senior Full-Stack Engineer (FinTech / Payments)',
    text: `• Led architectural migration of core checkout service to Go & Kafka, reducing p99 latency from 450ms to 85ms across 12M daily transactions.
• Mentored 6 mid-level and junior engineers; established code review standards that decreased production incident frequency by 34%.
• Designed idempotency and reconciliation engine handling $40M+ in daily settlement flows with zero financial discrepancies.
• Tech Stack: React, TypeScript, Go, PostgreSQL, Kafka, Redis, Kubernetes, AWS, Datadog.`,
  },
  {
    label: 'Staff Distributed Systems Engineer',
    text: `• Principal architect for distributed event ingestion pipeline processing 250,000 events/sec with sub-second end-to-end indexing.
• Implemented multi-region active-active database failover on Aurora PostgreSQL, achieving 99.995% uptime SLA.
• Partnered across 4 platform teams to standardize gRPC protocol definitions and distributed tracing with OpenTelemetry.
• Tech Stack: Java, Go, Kafka, Cassandra, Kubernetes, Terraform, gRPC, DynamoDB.`,
  },
  {
    label: 'Technical Product Manager',
    text: `• Owned Developer Platform APIs used by 45,000+ external developers; drove 48% YoY growth in active API keys.
• Defined product roadmap for real-time analytics dashboard, collaborating with ML and Frontend teams to ship 3 weeks ahead of schedule.
• Conducted 50+ enterprise customer interviews to identify data governance gaps, leading to a new compliance enterprise tier ($3.2M ARR).`,
  },
];

export const DEFAULT_QUESTION_BANK: QuestionBankItem[] = [
  {
    id: 'qb-1',
    category: 'system_design',
    difficulty: 'Hard',
    question: 'How would you design a distributed, real-time notification service supporting 50 million concurrent users across Push, SMS, and Email?',
    whatInterviewerLooksFor: 'Deconstructs scale (50M users, varying latencies, retry queues, idempotency, rate limiting, provider failover). Separates priority queues (OTP vs marketing).',
    sampleKeyTakeaways: [
      'Token bucket or Redis sliding-window rate limiters per user and per carrier',
      'Kafka priority queues separating critical transaction alerts from bulk notifications',
      'Idempotency key per notification to guarantee at-most-once or exactly-once delivery semantics',
    ],
    commonPitfall: 'Directly calling 3rd-party notification APIs synchronously inside the request loop without worker queues or backpressure handling.',
  },
  {
    id: 'qb-2',
    category: 'behavioral',
    difficulty: 'Medium',
    question: 'Tell me about a time you strongly disagreed with a senior engineer or manager on an architectural decision. How did you resolve it?',
    whatInterviewerLooksFor: 'Shows intellectual maturity, focuses on objective data & proof-of-concept benchmarks rather than ego, and demonstrates disagree-and-commit if consensus is reached.',
    sampleKeyTakeaways: [
      'Framed the disagreement around business metrics and customer impact, not personal preference',
      'Built a quick isolated benchmark prototype to collect hard latency and throughput numbers',
      'Demonstrated collaborative consensus building and committed 100% once the decision was finalized',
    ],
    commonPitfall: 'Blaming the colleague, sounding combative, or harboring passive-aggressive resentment rather than showing teamwork.',
  },
  {
    id: 'qb-3',
    category: 'system_design',
    difficulty: 'Staff-Level',
    question: 'Design a distributed rate limiter that works across a multi-region cluster with minimal cross-region latency overhead.',
    whatInterviewerLooksFor: 'Understands CAP theorem tradeoffs: centralized Redis incurs cross-region network latency (100ms+), whereas local token buckets with asynchronous synchronization can provide sub-millisecond local checks with acceptable loose drift.',
    sampleKeyTakeaways: [
      'Local in-memory token buckets at edge gateway (Envoy/Nginx) with periodic batch synchronization',
      'Redis cluster per region with gossip protocol or CRDTs for global quotas',
      'Graceful degradation mode (fail-open vs fail-closed) when inter-region links suffer partition',
    ],
    commonPitfall: 'Making synchronous inter-region RPCs on every incoming request, which destroys API latency and causes cascading failures.',
  },
  {
    id: 'qb-4',
    category: 'technical',
    difficulty: 'Hard',
    question: 'Explain what happens under the hood when a database executes a transaction under "Read Committed" vs "Repeatable Read" isolation levels. What is MVCC?',
    whatInterviewerLooksFor: 'Deep understanding of Multi-Version Concurrency Control (MVCC), transaction snapshots, undo logs, phantom reads vs non-repeatable reads, and lock overhead.',
    sampleKeyTakeaways: [
      'Read Committed generates a fresh snapshot at each query; Repeatable Read holds a consistent snapshot created at transaction start',
      'MVCC uses row version tuples (e.g. xmin/xmax in Postgres) to allow readers to never block writers and writers to never block readers',
      'Write skew and phantom reads nuances and how serialization graphs detect conflicts in Serializable isolation',
    ],
    commonPitfall: 'Confusing isolation levels with durability, or thinking databases use table-wide locks for all transaction reads.',
  },
  {
    id: 'qb-5',
    category: 'behavioral',
    difficulty: 'Hard',
    question: 'Describe a project where you took on calculated technical risk that failed or caused an outage. What happened and what did you learn?',
    whatInterviewerLooksFor: 'Radical ownership, root cause analysis (RCA), blameless post-mortem culture, and systematic prevention mechanisms created afterward.',
    sampleKeyTakeaways: [
      'Clear context on why the calculated risk was undertaken and what assumptions broke',
      'Immediate incident mitigation steps taken to restore service for users',
      'Long-term systemic fixes (circuit breakers, canary deployments, automated rollback alerts)',
    ],
    commonPitfall: 'Claiming "I have never failed", or passing blame onto juniors, third-party libraries, or management.',
  },
  {
    id: 'qb-6',
    category: 'coding_concepts',
    difficulty: 'Medium',
    question: 'How would you diagnose and resolve a memory leak in a production Node.js or browser application with high CPU usage?',
    whatInterviewerLooksFor: 'Systematic debugging process: heap snapshots, allocation instrumentation, identifying uncollected closures, detached DOM trees, or lingering event listeners.',
    sampleKeyTakeaways: [
      'Compare consecutive heap dumps in Chrome DevTools or Node --inspect using delta allocation view',
      'Check for unbounded in-memory cache objects without TTL/LRU eviction',
      'Inspect uncleaned global event listeners, unresolved Promises, or closures capturing heavy scope variables',
    ],
    commonPitfall: 'Blindly restarting the server with PM2 or blindly increasing memory limits without finding the root cause.',
  },
];
