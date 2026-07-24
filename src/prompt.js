// CORS FIX: Direct browser → Gemini API calls are blocked by CORS policy.
// Solution: run the included Express proxy server (proxy.cjs) on localhost:3001
// in dev, or the Vercel serverless function (api/gemini.js) in production.
// The proxy forwards requests server-side where CORS does not apply.
export const GEMINI_MODEL = "gemini-2.5-flash";
export const PROXY_URL = "/api/gemini"; // proxy server endpoint

export const EXAMPLES = [
  "A hospital management system that tracks patients, doctors, appointments, prescriptions and billing. Must comply with HIPAA regulations and keep full audit trails of all record changes.",
  "A social media platform where users post short videos, follow each other, like and comment. Expecting rapid growth to millions of users across multiple countries.",
  "An e-commerce platform selling electronics. Needs product catalog with varied specs, cart management, order processing, payments, and sales analytics dashboard.",
  "An IoT platform that collects real-time sensor data from 50,000 factory machines — temperature, pressure, vibration readings every 5 seconds.",
  "A ride-hailing app like Uber — driver and passenger matching, real-time GPS tracking, trip history, payments, and surge pricing analytics.",
];

// Phase 1 (fast): everything the Overview tab needs. Kept small and focused so
// this call returns quickly and the user sees a result almost immediately.
export const buildOverviewPrompt = (description) => `
You are the Schema Pattern Comparison System (SPCS) — an expert database architect AI grounded in 33 peer-reviewed studies (2018–2026) on relational and document-based schema design patterns.

A user has described their project. Analyse it and respond ONLY with a valid JSON object — no markdown fences, no explanation outside the JSON.

User's project description:
"""
${description}
"""

Respond with this exact JSON structure:
{
  "projectName": "short name for this project (3-5 words)",
  "projectType": "category e.g. E-commerce, Healthcare, IoT, Banking, Social Media, Analytics, etc.",
  "recommendation": "relational" | "document" | "polyglot",
  "confidence": number between 60 and 99,
  "primaryDatabase": "e.g. PostgreSQL, MongoDB, MySQL, etc.",
  "secondaryDatabase": "only if polyglot, else null",
  "warehouseDatabase": "only if analytics needed, else null",
  "whyBestFit": "3-4 sentence explanation of why this paradigm fits this specific project.",
  "dimensionScores": {
    "structuredData": number 0-100,
    "semiStructuredData": number 0-100,
    "consistencyRequirement": number 0-100,
    "scalabilityRequirement": number 0-100,
    "governanceRequirement": number 0-100,
    "relationshipComplexity": number 0-100,
    "evolutionRequirement": number 0-100
  },
  "keyFactors": ["factor 1","factor 2","factor 3","factor 4"],
  "realWorldComparison": { "similarSystem": "e.g. Airbnb", "howSimilar": "one sentence", "theirApproach": "one sentence" },
  "polyglotArchitecture": null or { "layers": [{ "layer": "layer name", "database": "db", "stores": "what", "pattern": "pattern", "reason": "why" }] }
}

Be very specific to the user's project. Do not give generic answers.
`;

// Phase 2 (background): schema/patterns/assessment/roadmap + the side-by-side
// comparison. Receives the phase-1 result as context so this call stays
// consistent with the recommendation/paradigm already committed to.
export const buildDetailsPrompt = (description, overview) => `
You are the Schema Pattern Comparison System (SPCS) — an expert database architect AI grounded in 33 peer-reviewed studies (2018–2026) on relational and document-based schema design patterns.

You already analysed this project and produced an initial verdict:
"""
${JSON.stringify({
  projectName: overview.projectName,
  projectType: overview.projectType,
  recommendation: overview.recommendation,
  primaryDatabase: overview.primaryDatabase,
  secondaryDatabase: overview.secondaryDatabase,
  whyBestFit: overview.whyBestFit,
})}
"""

User's project description (for reference):
"""
${description}
"""

Now produce the detailed design that stays fully consistent with the verdict above — same
recommendation and databases. Respond ONLY with a valid JSON object — no markdown fences, no
explanation outside the JSON. Respond with this exact JSON structure:
{
  "recommendedPatterns": [
    { "name": "pattern name", "paradigm": "Relational"|"Document"|"Warehouse", "reason": "one sentence", "appliesTo": "which part" }
  ],
  "schemaStructure": {
    "description": "1-2 sentence overview",
    "entities": [
      { "name": "EntityName", "type": "table"|"collection"|"view", "paradigm": "Relational"|"Document", "database": "e.g. PostgreSQL", "fields": [{ "name": "field_name", "type": "data type", "note": "e.g. PRIMARY KEY" }], "patternApplied": "pattern name or null" }
    ]
  },
  "schemaComparison": {
    "description": "1-2 sentences on what's being compared and why these entities were picked",
    "entities": [
      {
        "name": "EntityName (pick the 2-3 most structurally interesting entities from schemaStructure above — ones with a real relational-vs-document tradeoff)",
        "relational": { "database": "e.g. PostgreSQL", "fields": [{ "name": "field_name", "type": "data type", "note": "e.g. PRIMARY KEY / FOREIGN KEY" }] },
        "document": { "database": "e.g. MongoDB", "fields": [{ "name": "field_name", "type": "data type", "note": "e.g. embedded array" }] },
        "divergencePoints": [
          { "aspect": "short label e.g. Relationships", "relationalApproach": "one sentence", "documentApproach": "one sentence" }
        ]
      }
    ]
  },
  "riskAssessment": { "level": "Low"|"Medium"|"High", "reason": "specific reason", "mitigations": ["m1","m2"] },
  "governanceAssessment": { "auditability": "Low"|"Medium"|"High", "complianceReadiness": "Low"|"Medium"|"High", "dataLineage": "Low"|"Medium"|"High", "notes": "specific notes" },
  "futureReadiness": { "aiReadiness": "Low"|"Medium"|"High", "cloudReadiness": "Low"|"Medium"|"High", "scalabilityReadiness": "Low"|"Medium"|"High", "notes": "specific notes" },
  "implementationRoadmap": [
    { "phase": 1, "title": "Phase title", "tasks": ["task 1","task 2","task 3"] },
    { "phase": 2, "title": "Phase title", "tasks": ["task 1","task 2","task 3"] },
    { "phase": 3, "title": "Phase title", "tasks": ["task 1","task 2"] }
  ]
}

Be very specific to the user's project. Do not give generic answers.
`;
