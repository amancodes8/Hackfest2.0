function detectConflicts(normalized) {
  const conflicts = [];
  const all = [
    ...normalized.functionalRequirements,
    ...normalized.timelineMilestones,
    ...normalized.risks
  ];

  const deadlineMentions = all.filter((item) => /deadline|eta|by\s+/i.test(item));
  if (deadlineMentions.length > 2) {
    conflicts.push({
      type: "Timeline Inconsistency",
      severity: "medium",
      detail: "Multiple deadline statements were found and may be inconsistent.",
      evidence: deadlineMentions.slice(0, 4)
    });
  }

  const mustAndOptional = normalized.functionalRequirements.some(
    (item) => /must/i.test(item)
  ) && normalized.functionalRequirements.some((item) => /optional|nice to have/i.test(item));

  if (mustAndOptional) {
    conflicts.push({
      type: "Priority Ambiguity",
      severity: "high",
      detail: "Mixed mandatory and optional language without explicit prioritization.",
      evidence: normalized.functionalRequirements.slice(0, 4)
    });
  }

  const securityMention = normalized.risks.some((risk) => /security|compliance/i.test(risk));
  const missingSecurityReq = !normalized.functionalRequirements.some((item) =>
    /auth|encryption|permission|access|audit/i.test(item)
  );

  if (securityMention && missingSecurityReq) {
    conflicts.push({
      type: "Risk-Control Gap",
      severity: "high",
      detail: "Security/compliance risk identified without concrete control requirements.",
      evidence: normalized.risks.filter((risk) => /security|compliance/i.test(risk)).slice(0, 3)
    });
  }

  return conflicts;
}

module.exports = {
  detectConflicts
};
