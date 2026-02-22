const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs/promises");
const {
  createSession,
  requireSession,
  appendContent,
  setProgress,
  resetGenerationArtifacts
} = require("../services/sessionStore");
const {
  cleanText,
  splitIntoChunks,
  classifyContent,
  extractStructuredSignals,
  normalizeSignals
} = require("../services/ingestionService");
const { detectConflicts } = require("../services/conflictDetector");
const { generateBrdWithGemini, generateStrategicAssessment, chatWithBrd } = require("../services/llmService");
const { buildFallbackBrd } = require("../services/brdBuilder");

const router = express.Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: (_, __, cb) => cb(null, path.join(__dirname, "..", "uploads")),
    filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`)
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if ([".txt", ".csv", ".md"].includes(ext)) return cb(null, true);
    cb(new Error("Unsupported file type. Use txt, csv, or md."));
  }
});

const inFlight = new Set();

router.post("/session", (_, res) => {
  const session = createSession();
  res.json({ session_id: session.id });
});

router.post("/paste", (req, res, next) => {
  try {
    const { session_id: sessionId, content } = req.body || {};
    if (!sessionId || typeof content !== "string") {
      return res.status(400).json({ error: "session_id and content are required" });
    }

    appendContent(sessionId, "paste", content);
    res.json({ characters: content.length });
  } catch (error) {
    next(error);
  }
});

router.post("/upload", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "file is required" });

    const session = createSession();
    const fileContent = await fs.readFile(req.file.path, "utf-8");
    appendContent(session.id, "upload", fileContent, { filename: req.file.originalname });

    res.json({ session_id: session.id, filename: req.file.originalname });
  } catch (error) {
    next(error);
  }
});

router.post("/generate", async (req, res, next) => {
  try {
    const { session_id: sessionId, mode, options } = req.body || {};
    if (!sessionId) return res.status(400).json({ error: "session_id is required" });
    const generationMode = normalizeMode(mode);
    const generationOptions = normalizeGenerationOptions(options);

    const session = requireSession(sessionId);
    if (!session.combinedText.trim()) {
      return res.status(400).json({ error: "No input content available for this session" });
    }

    if (inFlight.has(sessionId)) {
      return res.json({ message: "BRD generation already running" });
    }

    resetGenerationArtifacts(sessionId);
    setProgress(sessionId, { stage: "Ingestion", percent: 5, status: "running", error: null });
    inFlight.add(sessionId);

    void runPipeline(sessionId, generationMode, generationOptions).finally(() => {
      inFlight.delete(sessionId);
    });

    res.json({ message: "BRD generation started" });
  } catch (error) {
    next(error);
  }
});

router.get("/progress", (req, res, next) => {
  try {
    const { session_id: sessionId } = req.query;
    if (!sessionId) return res.status(400).json({ error: "session_id is required" });

    const session = requireSession(sessionId);
    res.json({
      stage: session.progress.stage,
      percent: session.progress.percent,
      status: session.progress.status,
      ...(session.progress.error ? { error: session.progress.error } : {})
    });
  } catch (error) {
    next(error);
  }
});

router.get("/brd", (req, res, next) => {
  try {
    const { session_id: sessionId } = req.query;
    if (!sessionId) return res.status(400).json({ error: "session_id is required" });

    const session = requireSession(sessionId);
    if (!session.brd) {
      return res.status(404).json({ error: "BRD not ready" });
    }

    res.json({ brd: session.brd });
  } catch (error) {
    next(error);
  }
});

router.get("/insights", (req, res, next) => {
  try {
    const { session_id: sessionId } = req.query;
    if (!sessionId) return res.status(400).json({ error: "session_id is required" });

    const session = requireSession(sessionId);
    const extracted = session.extracted || {
      functionalRequirements: [],
      timelineMilestones: [],
      risks: []
    };

    const severities = session.conflicts.reduce(
      (acc, item) => {
        const level = String(item?.severity || "").toLowerCase();
        if (level === "high") acc.high += 1;
        else if (level === "medium") acc.medium += 1;
        else acc.low += 1;
        return acc;
      },
      { high: 0, medium: 0, low: 0 }
    );

    res.json({
      session_id: session.id,
      generated_at: session.generatedAt,
      status: session.progress.status,
      mode: session.mode || "standard",
      generation_options: session.generationOptions || null,
      input: {
        characters: session.combinedText.length,
        items: session.rawItems.length,
        chunks: session.cleanedChunks.length,
        classifications: session.classifications || []
      },
      analysis: {
        functional_count: extracted.functionalRequirements.length,
        timeline_count: extracted.timelineMilestones.length,
        risk_count: extracted.risks.length,
        conflict_count: session.conflicts.length,
        conflict_severity: severities
      },
      brd_assessment: session.brdAssessment || null,
      executive_brief: buildExecutiveBrief({
        mode: session.mode || "standard",
        analysis: {
          functional_count: extracted.functionalRequirements.length,
          timeline_count: extracted.timelineMilestones.length,
          risk_count: extracted.risks.length,
          conflict_count: session.conflicts.length
        },
        assessment: session.brdAssessment,
        options: session.generationOptions,
        generatedAt: session.generatedAt
      }),
      functional_requirements: extracted.functionalRequirements,
      timeline_milestones: extracted.timelineMilestones,
      risks: extracted.risks,
      conflicts: session.conflicts,
      evidence: buildEvidenceMap(session)
    });
  } catch (error) {
    next(error);
  }
});

router.post("/chat", async (req, res, next) => {
  try {
    const { session_id: sessionId, message } = req.body || {};
    if (!sessionId || !message) {
      return res.status(400).json({ error: "session_id and message are required" });
    }

    const session = requireSession(sessionId);
    if (!session.brd) {
      return res.status(400).json({ error: "Generate BRD before starting chat" });
    }

    const reply = await chatWithBrd({ brd: session.brd, message: String(message) });
    res.json({ reply });
  } catch (error) {
    next(error);
  }
});

async function runPipeline(sessionId, mode = "standard", options = null) {
  try {
    const session = requireSession(sessionId);
    session.mode = mode;
    session.generationOptions = options;

    setProgress(sessionId, { stage: "Ingestion", percent: 12, status: "running" });
    const cleaned = cleanText(session.combinedText);
    const chunks = splitIntoChunks(cleaned);
    session.cleanedChunks = chunks;

    await wait(350);
    setProgress(sessionId, { stage: "Classification", percent: 24, status: "running" });
    const classifications = classifyContent(cleaned);
    session.classifications = classifications;

    await wait(350);
    setProgress(sessionId, { stage: "Extraction", percent: 40, status: "running" });
    const extracted = extractStructuredSignals(chunks);

    await wait(350);
    setProgress(sessionId, { stage: "Normalization", percent: 58, status: "running" });
    const normalized = normalizeSignals(extracted);
    session.extracted = normalized;

    await wait(350);
    setProgress(sessionId, { stage: "Conflict Detection", percent: 75, status: "running" });
    const conflicts = detectConflicts(normalized);
    session.conflicts = conflicts;

    await wait(350);
    setProgress(sessionId, { stage: "BRD Synthesis", percent: 88, status: "running" });

    const payload = {
      classifications,
      normalized,
      conflicts,
      combinedText: cleaned,
      mode,
      options
    };

    let brd;
    try {
      brd = await generateBrdWithGemini(payload);
    } catch (error) {
      console.error("Gemini synthesis failed, falling back to deterministic builder:", error.message);
      brd = buildFallbackBrd(payload, mode);
    }

    session.brd = brd;
    session.generatedAt = new Date().toISOString();
    try {
      session.brdAssessment = await generateStrategicAssessment({
        brd,
        analysis: {
          functional_count: normalized.functionalRequirements.length,
          timeline_count: normalized.timelineMilestones.length,
          risk_count: normalized.risks.length,
          conflict_count: conflicts.length
        },
        options
      });
    } catch (assessmentError) {
      console.error("Assessment generation failed:", assessmentError.message);
      session.brdAssessment = null;
    }

    setProgress(sessionId, { stage: "LLM Synthesis", percent: 100, status: "completed" });
  } catch (error) {
    setProgress(sessionId, {
      stage: "LLM Synthesis",
      percent: 100,
      status: "error",
      error: error.message || "Pipeline failed"
    });
  }
}

function normalizeMode(mode) {
  const allowed = new Set(["concise", "standard", "detailed"]);
  const normalized = String(mode || "standard").toLowerCase();
  return allowed.has(normalized) ? normalized : "standard";
}

function normalizeGenerationOptions(options = {}) {
  const safeScenario = options?.scenario && typeof options.scenario === "object"
    ? {
        scopeExpansion: Number(options.scenario.scopeExpansion || 0),
        budgetChange: Number(options.scenario.budgetChange || 0),
        timelineBuffer: Number(options.scenario.timelineBuffer || 0),
        teamCapacity: Number(options.scenario.teamCapacity || 0),
        projected: options.scenario.projected && typeof options.scenario.projected === "object"
          ? {
              risk: Number(options.scenario.projected.risk || 0),
              success: Number(options.scenario.projected.success || 0),
              alignment: Number(options.scenario.projected.alignment || 0),
              budget: Number(options.scenario.projected.budget || 0)
            }
          : null
      }
    : null;

  return {
    audience: String(options?.audience || "Product and Engineering Leadership"),
    industry: String(options?.industry || "General Technology"),
    tone: String(options?.tone || "Executive and precise"),
    compliance: String(options?.compliance || "Standard enterprise controls"),
    includeTraceability: Boolean(options?.includeTraceability),
    includeRaci: Boolean(options?.includeRaci),
    includeSuccessMetrics: options?.includeSuccessMetrics !== false,
    scenario: safeScenario
  };
}

function buildExecutiveBrief({ mode, analysis, assessment, options, generatedAt }) {
  const riskScore = clamp(Math.round(analysis.risk_count * 14 + analysis.conflict_count * 10 + 20), 0, 100);
  const timelineHealth = clamp(Math.round(78 + analysis.timeline_count * 2 - analysis.conflict_count * 6), 0, 100);
  const readiness = clamp(Math.round(assessment?.delivery_confidence ?? (72 + analysis.functional_count * 2 - analysis.risk_count * 4)), 0, 100);
  const goNoGo = readiness >= 70 && riskScore <= 55 ? "GO" : readiness >= 55 ? "CONDITIONAL GO" : "NO-GO";

  return {
    generated_at: generatedAt,
    mode,
    decision: goNoGo,
    summary:
      assessment?.summary ||
      "Executive brief synthesized from extracted requirements, conflict detection, and BRD quality signals.",
    quality_score: assessment?.quality_score ?? clamp(58 + analysis.functional_count * 3 - analysis.conflict_count * 4, 0, 100),
    delivery_confidence: readiness,
    risk_score: riskScore,
    timeline_health: timelineHealth,
    budget_outlook: riskScore > 70 ? "High budget pressure expected." : riskScore > 45 ? "Moderate budget pressure expected." : "Budget pressure appears manageable.",
    top_risks: [
      `Detected ${analysis.risk_count} risk signal(s) across communication sources.`,
      `Detected ${analysis.conflict_count} requirement conflict(s) requiring resolution.`,
      analysis.timeline_count === 0 ? "Limited explicit timeline anchors in source content." : "Timeline assumptions require active tracking."
    ],
    recommendation:
      goNoGo === "GO"
        ? "Proceed with controlled rollout and maintain risk reviews per milestone."
        : goNoGo === "CONDITIONAL GO"
          ? "Proceed only after closing critical conflicts and assigning clear owners."
          : "Delay commitment until unresolved conflicts and risk hotspots are mitigated."
  };
}

function buildEvidenceMap(session) {
  const extracted = session.extracted || {
    functionalRequirements: [],
    timelineMilestones: [],
    risks: []
  };
  const sourceItems = session.rawItems || [];

  const sections = [
    { section: "Functional Requirements", items: extracted.functionalRequirements.slice(0, 6), sourceType: "requirements" },
    { section: "Timeline and Milestones", items: extracted.timelineMilestones.slice(0, 6), sourceType: "timeline" },
    { section: "Risks and Mitigations", items: extracted.risks.slice(0, 6), sourceType: "risks" },
    {
      section: "Conflict Resolution Notes",
      items: (session.conflicts || []).slice(0, 6).map((item) => `${item.type}: ${item.detail}`),
      sourceType: "conflicts"
    }
  ];

  return sections.map((entry) => ({
    section: entry.section,
    items: entry.items.map((item) => {
      const normalized = stripPrefix(item);
      const match = findEvidenceMatch(normalized, sourceItems);
      return {
        claim: normalized,
        snippet: match?.snippet || normalized,
        source: match?.source || "derived",
        source_label: match?.label || "Derived from extracted signals",
        confidence: scoreConfidence(normalized, match?.snippet || "")
      };
    })
  }));
}

function stripPrefix(text = "") {
  return String(text).replace(/^[A-Z]+-\d+:\s*/i, "").trim();
}

function findEvidenceMatch(claim, sourceItems) {
  const claimLower = claim.toLowerCase();
  const claimWords = claimLower.split(/\s+/).filter((w) => w.length > 3);
  if (!claimWords.length) return null;

  for (const item of sourceItems) {
    const text = String(item.content || "");
    const sentences = text.split(/(?<=[.!?])\s+/).slice(0, 240);
    for (const sentence of sentences) {
      const lower = sentence.toLowerCase();
      const overlap = claimWords.filter((word) => lower.includes(word)).length;
      if (overlap >= Math.max(2, Math.ceil(claimWords.length * 0.25))) {
        return {
          snippet: sentence.trim().slice(0, 280),
          source: item.source || "unknown",
          label: item.meta?.filename || item.source || "input"
        };
      }
    }
  }
  return null;
}

function scoreConfidence(claim, snippet) {
  const claimWords = String(claim).toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  const snippetLower = String(snippet).toLowerCase();
  const overlap = claimWords.filter((word) => snippetLower.includes(word)).length;
  const ratio = claimWords.length ? overlap / claimWords.length : 0.4;
  return clamp(Math.round((0.4 + ratio * 0.6) * 100), 35, 96);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = router;
