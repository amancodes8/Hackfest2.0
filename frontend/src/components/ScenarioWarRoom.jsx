import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FiActivity, FiArrowDownRight, FiArrowUpRight, FiPlayCircle, FiTarget } from "react-icons/fi";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function DeltaPill({ label, current, proposed, invert = false }) {
  const delta = proposed - current;
  const improved = invert ? delta < 0 : delta > 0;
  const Icon = improved ? FiArrowUpRight : FiArrowDownRight;
  const color = improved ? "text-emerald-300 border-emerald-500/30 bg-emerald-500/10" : "text-orange-200 border-orange-500/30 bg-orange-500/10";

  return (
    <div className="rounded-xl border border-[#22355b] bg-[#0a152b] p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="text-sm text-slate-300">
          <p>Current: <span className="font-semibold text-slate-100">{current}</span></p>
          <p>Scenario: <span className="font-semibold text-slate-100">{proposed}</span></p>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-bold ${color}`}>
          <Icon size={12} />
          {delta > 0 ? "+" : ""}
          {Math.round(delta)}
        </span>
      </div>
    </div>
  );
}

export default function ScenarioWarRoom({ insightData, onRunScenario, running }) {
  const analysis = insightData?.analysis || {};
  const currentRisk = clamp(Math.round(analysis.risk_count * 12 + analysis.conflict_count * 9 + 22), 5, 98);
  const currentSuccess = clamp(100 - currentRisk + Math.round((analysis.functional_count || 0) * 2), 5, 98);
  const currentAlignment = clamp(Math.round(62 + (analysis.functional_count || 0) * 4 - (analysis.conflict_count || 0) * 7), 5, 98);
  const currentBudget = clamp(Math.round(58 + (analysis.timeline_count || 0) * 6 + (analysis.risk_count || 0) * 2), 10, 100);

  const [scopeExpansion, setScopeExpansion] = useState(35);
  const [budgetChange, setBudgetChange] = useState(0);
  const [timelineBuffer, setTimelineBuffer] = useState(0);
  const [teamCapacity, setTeamCapacity] = useState(0);

  const simulation = useMemo(() => {
    const risk = clamp(
      Math.round(currentRisk + scopeExpansion * 0.25 - budgetChange * 0.8 - timelineBuffer * 0.7 - teamCapacity * 0.9),
      0,
      100
    );
    const success = clamp(Math.round(currentSuccess - scopeExpansion * 0.18 + budgetChange * 0.5 + timelineBuffer * 0.45 + teamCapacity * 0.6), 0, 100);
    const alignment = clamp(Math.round(currentAlignment - scopeExpansion * 0.16 + timelineBuffer * 0.3 + teamCapacity * 0.5), 0, 100);
    const budget = clamp(Math.round(currentBudget + scopeExpansion * 0.22 + budgetChange * 0.9), 0, 100);

    return { risk, success, alignment, budget };
  }, [currentRisk, currentSuccess, currentAlignment, currentBudget, scopeExpansion, budgetChange, timelineBuffer, teamCapacity]);

  const controls = [
    { label: "Scope Expansion", value: scopeExpansion, onChange: setScopeExpansion, min: 0, max: 100, suffix: "%" },
    { label: "Budget Change", value: budgetChange, onChange: setBudgetChange, min: -30, max: 30, suffix: "%" },
    { label: "Timeline Buffer", value: timelineBuffer, onChange: setTimelineBuffer, min: -30, max: 30, suffix: "%" },
    { label: "Team Capacity", value: teamCapacity, onChange: setTeamCapacity, min: -30, max: 30, suffix: "%" }
  ];

  function runScenario() {
    onRunScenario({
      scopeExpansion,
      budgetChange,
      timelineBuffer,
      teamCapacity,
      projected: simulation
    });
  }

  return (
    <section className="neon-panel interactive-tile">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-2xl font-extrabold text-slate-100">
            <FiTarget className="text-[#97acff]" />
            Scenario War Room
          </h3>
          <p className="mt-1 text-sm text-slate-400">Run what-if controls and generate a scenario-adjusted BRD from the same source context.</p>
        </div>
        <span className="badge-soft">Current vs Proposed BRD</span>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-[#22355b] bg-[#081226] p-4">
          <p className="mb-3 text-sm font-semibold text-slate-200">Control Variables</p>
          <div className="space-y-4">
            {controls.map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between text-sm text-slate-300">
                  <span>{item.label}</span>
                  <span>{item.value > 0 ? "+" : ""}{item.value}{item.suffix}</span>
                </div>
                <input
                  type="range"
                  min={item.min}
                  max={item.max}
                  value={item.value}
                  onChange={(event) => item.onChange(Number(event.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#111f3a] accent-[#7c4dff]"
                />
              </div>
            ))}
          </div>
          <button onClick={runScenario} disabled={running} className="btn-primary mt-5 w-full">
            <FiPlayCircle />
            {running ? "Launching Scenario..." : "Generate Scenario BRD"}
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-[#22355b] bg-[#081226] p-4"
        >
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
            <FiActivity size={16} />
            BRD Delta Compare
          </div>
          <div className="grid gap-3">
            <DeltaPill label="Risk Score (/100)" current={currentRisk} proposed={simulation.risk} invert />
            <DeltaPill label="Success Probability (%)" current={currentSuccess} proposed={simulation.success} />
            <DeltaPill label="Strategic Alignment (%)" current={currentAlignment} proposed={simulation.alignment} />
            <DeltaPill label="Budget Pressure (%)" current={currentBudget} proposed={simulation.budget} invert />
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Scenario generation writes these assumptions into BRD synthesis instructions and runs the full pipeline.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
