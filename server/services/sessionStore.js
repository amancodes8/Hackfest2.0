const { v4: uuidv4 } = require("uuid");

const sessions = new Map();

const defaultProgress = {
  stage: "Ingestion",
  percent: 0,
  status: "running",
  error: null
};

function createSession() {
  const id = uuidv4();
  const session = {
    id,
    rawItems: [],
    combinedText: "",
    cleanedChunks: [],
    classifications: [],
    extracted: null,
    conflicts: [],
    brd: "",
    generationOptions: null,
    brdAssessment: null,
    progress: { ...defaultProgress },
    generatedAt: null
  };
  sessions.set(id, session);
  return session;
}

function getSession(sessionId) {
  return sessions.get(sessionId);
}

function requireSession(sessionId) {
  const session = getSession(sessionId);
  if (!session) {
    const err = new Error("Session not found");
    err.status = 404;
    throw err;
  }
  return session;
}

function appendContent(sessionId, source, content, meta = {}) {
  const session = requireSession(sessionId);
  const normalized = String(content || "").trim();
  session.rawItems.push({
    source,
    content: normalized,
    meta,
    createdAt: new Date().toISOString()
  });
  session.combinedText = session.rawItems.map((item) => item.content).join("\n\n").trim();
  return session;
}

function setProgress(sessionId, progressPatch) {
  const session = requireSession(sessionId);
  session.progress = {
    ...session.progress,
    ...progressPatch
  };
}

function resetGenerationArtifacts(sessionId) {
  const session = requireSession(sessionId);
  session.cleanedChunks = [];
  session.extracted = null;
  session.conflicts = [];
  session.brd = "";
  session.brdAssessment = null;
  session.generatedAt = null;
  setProgress(sessionId, { ...defaultProgress });
}

module.exports = {
  createSession,
  getSession,
  requireSession,
  appendContent,
  setProgress,
  resetGenerationArtifacts
};
