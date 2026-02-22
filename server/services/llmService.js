const { GoogleGenAI } = require("@google/genai");

let ai = null;

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in server/.env");
  }

  if (!ai) {
    ai = new GoogleGenAI({ apiKey });
  }

  return ai;
}

async function generateBrdWithGemini(payload) {
  const client = getClient();
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const mode = normalizeMode(payload.mode);
  const modeInstruction = getModeInstruction(mode);
  const options = normalizeOptions(payload.options);

  const prompt = `You are an enterprise business analyst creating a production-quality Business Requirements Document (BRD).

Return only markdown.
Hard requirements:
- Write complete professional sentences.
- Use sections in this exact order:
  1. Executive Summary
  2. Business Objectives
  3. Scope (In Scope / Out of Scope)
  4. Stakeholders and Roles
  5. Functional Requirements
  6. Non-Functional Requirements
  7. Timeline and Milestones
  8. Risks and Mitigations
  9. Conflict Resolution Notes
  10. Acceptance Criteria
  11. Open Questions
- Remove ambiguity and rewrite vague input into explicit requirements.
- Separate Functional, Non-Functional, Timeline, and Risks clearly.
- Use concise bullets where appropriate but keep quality enterprise-grade.
- Output mode: ${mode.toUpperCase()}
- Length control: ${modeInstruction}

Customization options:
- Audience: ${options.audience}
- Industry: ${options.industry}
- Tone: ${options.tone}
- Compliance Focus: ${options.compliance}
- Include Traceability Matrix: ${options.includeTraceability ? "Yes" : "No"}
- Include RACI: ${options.includeRaci ? "Yes" : "No"}
- Include Success Metrics section: ${options.includeSuccessMetrics ? "Yes" : "No"}
${options.scenario ? `- Scenario Control Inputs: ${JSON.stringify(options.scenario, null, 2)}` : "- Scenario Control Inputs: none"}

Input Classification:
${(payload.classifications || []).join(", ") || "Unknown"}

Normalized Signals:
${JSON.stringify(payload.normalized, null, 2)}

Detected Conflicts:
${JSON.stringify(payload.conflicts, null, 2)}

Source Content:
${payload.combinedText}
`;

  const response = await client.models.generateContent({
    model,
    contents: prompt
  });

  const initialText = response?.text || "";
  if (!initialText.trim()) {
    throw new Error("Gemini returned an empty BRD response");
  }

  const shouldRefine = String(process.env.BRD_ENABLE_REFINEMENT || "true").toLowerCase() !== "false";
  if (!shouldRefine) return initialText;

  return await refineBrdWithGemini({
    model,
    draftBrd: initialText,
    mode,
    options,
    conflicts: payload.conflicts || []
  });
}

async function refineBrdWithGemini({ model, draftBrd, mode, options, conflicts }) {
  const client = getClient();

  const prompt = `You are a senior BRD quality reviewer.
Improve the BRD below without changing its factual meaning.

Rules:
- Return only markdown.
- Preserve section order and headings.
- Tighten unclear language and remove duplication.
- Ensure requirements are testable where possible.
- Ensure risks include practical mitigation direction.
- Keep the target mode style: ${mode}.
- Audience: ${options.audience}; Industry: ${options.industry}; Tone: ${options.tone}; Compliance: ${options.compliance}.
- Consider conflicts: ${JSON.stringify(conflicts)}
${options.scenario ? `- Maintain consistency with scenario controls: ${JSON.stringify(options.scenario)}` : ""}

BRD Draft:
${draftBrd}`;

  const response = await client.models.generateContent({ model, contents: prompt });
  const revised = response?.text?.trim();
  return revised || draftBrd;
}

async function generateStrategicAssessment({ brd, analysis, options }) {
  const client = getClient();
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";

  const prompt = `You are generating a concise executive BRD assessment from real analysis data.
Return strict JSON object only with this schema:
{
  "summary": "string",
  "strengths": ["string", ...],
  "gaps": ["string", ...],
  "recommendations": ["string", ...],
  "quality_score": 0-100,
  "delivery_confidence": 0-100
}

Constraints:
- Keep each list to 3-5 bullets.
- Base everything on provided BRD + analysis metrics.
- Avoid speculation outside inputs.

Options:
${JSON.stringify(options, null, 2)}

Analysis:
${JSON.stringify(analysis, null, 2)}

BRD:
${brd}`;

  const response = await client.models.generateContent({ model, contents: prompt });
  const text = response?.text?.trim() || "";
  const parsed = parseJsonObject(text);
  if (!parsed) {
    return {
      summary: "Assessment currently unavailable. Please review core metrics.",
      strengths: [],
      gaps: [],
      recommendations: [],
      quality_score: heuristicQualityScore(analysis),
      delivery_confidence: heuristicConfidence(analysis)
    };
  }

  return {
    summary: String(parsed.summary || ""),
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String).slice(0, 5) : [],
    gaps: Array.isArray(parsed.gaps) ? parsed.gaps.map(String).slice(0, 5) : [],
    recommendations: Array.isArray(parsed.recommendations)
      ? parsed.recommendations.map(String).slice(0, 5)
      : [],
    quality_score: clamp(Number(parsed.quality_score) || heuristicQualityScore(analysis), 0, 100),
    delivery_confidence: clamp(Number(parsed.delivery_confidence) || heuristicConfidence(analysis), 0, 100)
  };
}

function normalizeMode(mode) {
  const allowed = new Set(["concise", "standard", "detailed"]);
  const normalized = String(mode || "standard").toLowerCase();
  return allowed.has(normalized) ? normalized : "standard";
}

function normalizeOptions(options = {}) {
  return {
    audience: String(options.audience || "Product and Engineering Leadership"),
    industry: String(options.industry || "General Technology"),
    tone: String(options.tone || "Executive and precise"),
    compliance: String(options.compliance || "Standard enterprise controls"),
    includeTraceability: Boolean(options.includeTraceability),
    includeRaci: Boolean(options.includeRaci),
    includeSuccessMetrics: options.includeSuccessMetrics !== false,
    scenario: options.scenario && typeof options.scenario === "object" ? options.scenario : null
  };
}

function getModeInstruction(mode) {
  if (mode === "concise") {
    return "Keep the BRD tight and executive-friendly: target 450-700 words, 3-6 bullets per major section, avoid repetition.";
  }
  if (mode === "detailed") {
    return "Produce a deep implementation-ready BRD: target 1200-1800 words, richer requirement detail, explicit dependencies and acceptance depth.";
  }
  return "Balanced detail: target 800-1200 words with clear section coverage and practical actionability.";
}

function parseJsonObject(text) {
  if (!text) return null;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

function heuristicQualityScore(analysis = {}) {
  const functional = Number(analysis.functional_count || 0);
  const timeline = Number(analysis.timeline_count || 0);
  const risks = Number(analysis.risk_count || 0);
  const conflicts = Number(analysis.conflict_count || 0);
  return clamp(Math.round(58 + functional * 2 + timeline * 1.5 - risks * 1.3 - conflicts * 2.2), 0, 100);
}

function heuristicConfidence(analysis = {}) {
  const risks = Number(analysis.risk_count || 0);
  const conflicts = Number(analysis.conflict_count || 0);
  const functional = Number(analysis.functional_count || 0);
  return clamp(Math.round(72 + functional * 1.2 - risks * 2 - conflicts * 2.5), 0, 100);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

async function chatWithBrd({ brd, message }) {
  const client = getClient();
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";

  const prompt = `You are an enterprise BRD assistant.
Use only the BRD context below to answer the user.
If answer is unavailable, say what is missing.

BRD Context:
${brd}

User Question:
${message}`;

  const response = await client.models.generateContent({
    model,
    contents: prompt
  });

  return response?.text?.trim() || "I could not derive an answer from the BRD context.";
}

module.exports = {
  generateBrdWithGemini,
  generateStrategicAssessment,
  chatWithBrd
};
