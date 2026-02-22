function buildFallbackBrd(context, mode = "standard") {
  const normalizedMode = normalizeMode(mode);
  const now = new Date().toISOString();
  const {
    classifications = [],
    normalized = { functionalRequirements: [], timelineMilestones: [], risks: [] },
    conflicts = [],
    combinedText = ""
  } = context;

  const scopeSummary = summarizeScope(combinedText, normalizedMode);
  const functional = clampByMode(normalized.functionalRequirements, normalizedMode);
  const milestones = clampByMode(normalized.timelineMilestones, normalizedMode);
  const risks = clampByMode(normalized.risks, normalizedMode);
  const condensedConflicts = clampByMode(conflicts, normalizedMode);

  return `# Business Requirements Document (BRD)

## 1. Executive Summary
This BRD consolidates business communications into a structured set of requirements, delivery milestones, and risks. The objective is to align stakeholders on scope, execution plan, and operating constraints.

## 2. Document Metadata
- Generated At: ${now}
- Source Types: ${classifications.length ? classifications.join(", ") : "Unspecified"}
- Input Size: ${combinedText.length} characters
- Output Mode: ${normalizedMode}

## 3. Business Context and Scope
${scopeSummary}

## 4. Functional Requirements
${asBulletList(functional, "No explicit functional requirements were detected.")}

## 5. Non-Functional Requirements
- System must maintain enterprise-level reliability, observability, and security controls.
- Access control and auditability are required for all BRD-related workflows.
- Output quality must remain consistent, unambiguous, and stakeholder-ready.

## 6. Timeline and Milestones
${asBulletList(milestones, "No explicit timeline milestones were detected.")}

## 7. Risks and Mitigations
${renderRisks(risks)}

## 8. Conflict Analysis
${renderConflicts(condensedConflicts)}

## 9. Open Questions
- Which requirements are mandatory for MVP versus post-MVP phases?
- Which dependencies are externally owned and may affect delivery confidence?
- What are acceptance criteria and sign-off owners for each major requirement?

## 10. Approval and Next Steps
- Validate requirement ownership with business and engineering leads.
- Convert approved requirements into implementation epics and delivery roadmap.
- Run weekly BRD reviews until all conflicts are resolved.
`;
}

function normalizeMode(mode) {
  const allowed = new Set(["concise", "standard", "detailed"]);
  const normalized = String(mode || "standard").toLowerCase();
  return allowed.has(normalized) ? normalized : "standard";
}

function clampByMode(items, mode) {
  if (!Array.isArray(items)) return items;
  if (mode === "concise") return items.slice(0, 4);
  if (mode === "standard") return items.slice(0, 8);
  return items;
}

function asBulletList(items, fallback) {
  if (!items || items.length === 0) return fallback;
  return items.map((item) => `- ${item}`).join("\n");
}

function renderRisks(risks) {
  if (!risks || risks.length === 0) {
    return "- No critical risks were explicitly identified in the provided communications.";
  }

  return risks
    .map((risk) => `- ${risk}\n  - Mitigation: Define owner, trigger, and contingency plan in execution tracker.`)
    .join("\n");
}

function renderConflicts(conflicts) {
  if (!conflicts || conflicts.length === 0) {
    return "- No direct requirement conflicts detected.";
  }

  return conflicts
    .map(
      (conflict) =>
        `- **${conflict.type}** (${conflict.severity})\n  - Detail: ${conflict.detail}\n  - Evidence: ${
          conflict.evidence.length ? conflict.evidence.join(" | ") : "No direct evidence available"
        }`
    )
    .join("\n");
}

function summarizeScope(text, mode) {
  const trimmed = text.trim();
  if (!trimmed) return "Scope could not be inferred due to missing source content.";
  const maxChars = mode === "concise" ? 320 : mode === "detailed" ? 900 : 600;
  const summary = trimmed.length > maxChars ? `${trimmed.slice(0, maxChars)}...` : trimmed;
  return summary.replace(/\n+/g, " ");
}

module.exports = {
  buildFallbackBrd
};
