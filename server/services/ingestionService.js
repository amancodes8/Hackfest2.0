const CHUNK_SIZE = 1600;

function cleanText(raw = "") {
  return String(raw)
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitIntoChunks(text = "") {
  const cleaned = cleanText(text);
  if (!cleaned) return [];

  const paragraphs = cleaned.split(/\n\n+/);
  const chunks = [];
  let current = "";

  for (const paragraph of paragraphs) {
    if ((current + "\n\n" + paragraph).length > CHUNK_SIZE && current) {
      chunks.push(current.trim());
      current = paragraph;
      continue;
    }
    current += current ? `\n\n${paragraph}` : paragraph;
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}

function classifyContent(text = "") {
  const checks = [
    { type: "Email", regex: /\b(from|subject|cc|bcc):/i },
    { type: "Chat", regex: /\b(slack|teams|@\w+|\d{1,2}:\d{2})\b/i },
    { type: "Meeting Transcript", regex: /\b(action items?|minutes|attendees|meeting)\b/i },
    { type: "Project Notes", regex: /\b(todo|backlog|milestone|deliverable)\b/i }
  ];

  return checks.filter((rule) => rule.regex.test(text)).map((rule) => rule.type);
}

function extractStructuredSignals(chunks = []) {
  const requirementMarkers = /(must|should|need to|requires?|shall|deliver)/i;
  const timelineMarkers = /(q[1-4]|week\s+\d+|sprint\s+\d+|deadline|eta|by\s+[A-Z][a-z]+)/i;
  const riskMarkers = /(risk|blocker|dependency|concern|issue|constraint|security|compliance)/i;

  const requirements = [];
  const timelines = [];
  const risks = [];

  chunks.forEach((chunk) => {
    const sentences = chunk
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    sentences.forEach((sentence) => {
      if (requirementMarkers.test(sentence)) requirements.push(sentence);
      if (timelineMarkers.test(sentence)) timelines.push(sentence);
      if (riskMarkers.test(sentence)) risks.push(sentence);
    });
  });

  return {
    requirements: dedupe(requirements),
    timelines: dedupe(timelines),
    risks: dedupe(risks)
  };
}

function normalizeSignals(extracted) {
  return {
    functionalRequirements: extracted.requirements.map((item, idx) => `FR-${idx + 1}: ${item}`),
    timelineMilestones: extracted.timelines.map((item, idx) => `T-${idx + 1}: ${item}`),
    risks: extracted.risks.map((item, idx) => `R-${idx + 1}: ${item}`)
  };
}

function dedupe(items) {
  return [...new Set(items.map((i) => i.trim()).filter(Boolean))];
}

module.exports = {
  cleanText,
  splitIntoChunks,
  classifyContent,
  extractStructuredSignals,
  normalizeSignals
};
