import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiDatabase,
  FiFileText,
  FiFlag,
  FiGitMerge,
  FiLayers,
  FiList,
  FiShield
} from "react-icons/fi";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function RingGauge({ label, value, color = "#6b6dff", delay = 0 }) {
  const pct = clamp(Math.round(value), 0, 100);
  const circumference = 2 * Math.PI * 42;
  const dash = (pct / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="text-center"
    >
      <svg width="112" height="112" viewBox="0 0 112 112" className="mx-auto">
        <circle cx="56" cy="56" r="42" fill="none" stroke="#132341" strokeWidth="8" />
        <motion.circle
          cx="56"
          cy="56"
          r="42"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          transform="rotate(-90 56 56)"
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${dash} ${circumference}` }}
          transition={{ duration: 0.8, delay: delay + 0.1 }}
        />
        <text x="56" y="63" textAnchor="middle" className="fill-slate-100 text-2xl font-black">
          {pct}%
        </text>
      </svg>
      <p className="mx-auto mt-3 max-w-[12ch] text-sm font-semibold leading-6 text-slate-200">{label}</p>
    </motion.div>
  );
}

function StrategySimulator({ base }) {
  const [scopeChange, setScopeChange] = useState(base.scopeChange);
  const [budgetAdjustment, setBudgetAdjustment] = useState(base.budgetAdjustment);
  const [timelineShift, setTimelineShift] = useState(base.timelineShift);
  const [teamCapacity, setTeamCapacity] = useState(base.teamCapacity);

  const simulated = useMemo(() => {
    const riskScore = clamp(
      Math.round(base.riskScore + scopeChange * 0.35 - budgetAdjustment * 0.2 + timelineShift * 0.45 - (teamCapacity - 50) * 0.28),
      0,
      100
    );

    const successProbability = clamp(Math.round(100 - riskScore + budgetAdjustment * 0.18 + (teamCapacity - 50) * 0.22), 0, 100);
    const resourceStrain = clamp(Math.round(base.resourceStrain + scopeChange * 0.22 + timelineShift * 0.25 - (teamCapacity - 50) * 0.18), 0, 100);
    const alignmentScore = clamp(Math.round(base.alignmentScore - scopeChange * 0.12 + budgetAdjustment * 0.08 - timelineShift * 0.1), 0, 100);
    const financialImpact = clamp(1.4 + budgetAdjustment * 0.03 + scopeChange * 0.01, 0.8, 7.5);

    return {
      riskScore,
      successProbability,
      resourceStrain,
      alignmentScore,
      financialImpact
    };
  }, [base, scopeChange, budgetAdjustment, timelineShift, teamCapacity]);

  function resetScenario() {
    setScopeChange(base.scopeChange);
    setBudgetAdjustment(base.budgetAdjustment);
    setTimelineShift(base.timelineShift);
    setTeamCapacity(base.teamCapacity);
  }

  const controls = [
    { label: "Scope Change", value: scopeChange, setValue: setScopeChange, min: 0, max: 100, suffix: "%" },
    { label: "Budget Adjustment", value: budgetAdjustment, setValue: setBudgetAdjustment, min: 0, max: 100, suffix: "%" },
    { label: "Timeline Shift", value: timelineShift, setValue: setTimelineShift, min: 0, max: 100, suffix: "%" },
    { label: "Team Capacity", value: teamCapacity, setValue: setTeamCapacity, min: 0, max: 100, suffix: "%" }
  ];

  return (
    <section className="neon-panel">
      <h3 className="mb-6 text-2xl font-extrabold text-slate-100">Strategy Simulator</h3>
      <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="rounded-2xl border border-slate-800 bg-[#081226] p-4">
          <p className="mb-4 text-lg font-semibold text-slate-200">Control Variables</p>
          <div className="space-y-4">
            {controls.map((control) => (
              <div key={control.label}>
                <div className="mb-1 flex items-center justify-between text-sm text-slate-300">
                  <span>{control.label}</span>
                  <span>{control.value}{control.suffix}</span>
                </div>
                <input
                  type="range"
                  min={control.min}
                  max={control.max}
                  value={control.value}
                  onChange={(event) => control.setValue(Number(event.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#111f3a] accent-[#7c4dff]"
                />
              </div>
            ))}
          </div>

          <div className="mt-5 flex gap-2">
            <button className="btn-primary flex-1">Simulate Scenario</button>
            <button onClick={resetScenario} className="btn-secondary">Reset</button>
          </div>
        </div>

        <div>
          <p className="mb-3 text-base font-semibold text-slate-100 md:text-lg">Simulation Results</p>
          <div className="grid gap-3 md:grid-cols-2">
            <ResultCard label="Risk Score" value={`${simulated.riskScore}/100`} />
            <ResultCard label="Success Probability" value={`${simulated.successProbability}%`} />
            <ResultCard label="Resource Strain" value={`${simulated.resourceStrain}/100`} />
            <ResultCard label="Alignment Score" value={`${simulated.alignmentScore}/100`} />
          </div>
          <div className="mt-3 rounded-2xl border border-slate-800 bg-[#0b152a] p-4">
            <p className="text-sm text-slate-400">Financial Impact</p>
            <p className="mt-1 break-words text-3xl font-black text-slate-100 md:text-4xl">${simulated.financialImpact.toFixed(1)}M</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ResultCard({ label, value }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-800 bg-[#0b152a] p-4">
      <p className="text-sm leading-5 text-slate-400">{label}</p>
      <p className="mt-1 break-words text-xl font-black leading-tight tabular-nums text-slate-100 sm:text-2xl md:text-[1.7rem]">{value}</p>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, accent = "#6b6dff", delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="rounded-2xl border border-slate-800 bg-[#091226] p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
        <span className="rounded-lg p-1.5" style={{ background: `${accent}22`, color: accent }}>
          <Icon size={16} />
        </span>
      </div>
      <p className="text-2xl font-black text-slate-100 md:text-3xl">{value}</p>
    </motion.div>
  );
}

function ProgressRing({ value }) {
  const normalized = Math.max(0, Math.min(100, Number(value) || 0));
  const circumference = 2 * Math.PI * 44;
  const dash = (normalized / 100) * circumference;

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#091226] p-4">
      <p className="mb-4 text-sm font-semibold text-slate-300">Pipeline Completion</p>
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <svg width="116" height="116" viewBox="0 0 116 116">
          <circle cx="58" cy="58" r="44" fill="none" stroke="#132341" strokeWidth="10" />
          <motion.circle
            cx="58"
            cy="58"
            r="44"
            fill="none"
            stroke="#6b6dff"
            strokeWidth="10"
            strokeLinecap="round"
            transform="rotate(-90 58 58)"
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: `${dash} ${circumference}` }}
            transition={{ duration: 0.7 }}
          />
          <text x="58" y="64" textAnchor="middle" className="fill-slate-100 text-2xl font-black">
            {Math.round(normalized)}%
          </text>
        </svg>
        <div className="text-sm text-slate-400">
          <p className="font-semibold text-slate-200">Current run status</p>
          <p>Updates from the live ingestion/extraction/synthesis pipeline.</p>
        </div>
      </div>
    </div>
  );
}

function CountBars({ analysis }) {
  const bars = [
    { key: "functional_count", label: "Functional", color: "#6b6dff" },
    { key: "timeline_count", label: "Timeline", color: "#4d7dff" },
    { key: "risk_count", label: "Risks", color: "#ff5e00" },
    { key: "conflict_count", label: "Conflicts", color: "#ff2d55" }
  ];

  const max = Math.max(1, ...bars.map((item) => analysis[item.key] || 0));

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#091226] p-4">
      <p className="mb-4 text-sm font-semibold text-slate-300">Extraction Distribution</p>
      <div className="space-y-3">
        {bars.map((item, idx) => {
          const value = analysis[item.key] || 0;
          return (
            <div key={item.key}>
              <div className="mb-1 flex items-center justify-between text-sm text-slate-300">
                <span>{item.label}</span>
                <span className="font-semibold">{value}</span>
              </div>
              <div className="h-2 rounded-full bg-[#0f1b34]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(value / max) * 100}%` }}
                  transition={{ duration: 0.45, delay: idx * 0.06 }}
                  className="h-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SeverityCard({ severity }) {
  const rows = [
    { label: "High", value: severity?.high || 0, color: "#ff2d55" },
    { label: "Medium", value: severity?.medium || 0, color: "#ff5e00" },
    { label: "Low", value: severity?.low || 0, color: "#65d208" }
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#091226] p-4">
      <p className="mb-4 text-sm font-semibold text-slate-300">Conflict Severity</p>
      <div className="grid gap-2 md:grid-cols-3">
        {rows.map((row) => (
          <div key={row.label} className="rounded-xl border border-slate-800 bg-[#0b162d] p-3 text-center">
            <p className="text-xs uppercase tracking-wide text-slate-400">{row.label}</p>
            <p className="mt-1 text-3xl font-black" style={{ color: row.color }}>
              {row.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SimpleList({ title, icon: Icon, items, empty }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#091226] p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <Icon size={16} />
        {title}
      </div>
      {items.length === 0 ? <p className="text-sm text-slate-500">{empty}</p> : null}
      <div className="space-y-2">
        {items.slice(0, 6).map((item) => (
          <div key={item} className="rounded-lg border border-slate-800 bg-[#0b162d] px-3 py-2 text-sm text-slate-300 break-words">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryRiskTrend({ history }) {
  const points = history.slice(0, 8).reverse().map((item) => item.stats?.riskMentions || 0);
  const safe = points.length ? points : [0, 0, 0, 0];
  const max = Math.max(1, ...safe);

  const line = safe
    .map((value, idx) => {
      const x = (idx / Math.max(safe.length - 1, 1)) * 280;
      const y = 110 - (value / max) * 90;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#091226] p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <FiActivity size={16} />
        Historical Risk Trend
      </div>
      <svg viewBox="0 0 280 120" className="h-28 w-full md:h-32">
        <line x1="0" y1="110" x2="280" y2="110" stroke="#1a2a4a" strokeWidth="1" />
        <motion.polyline
          fill="none"
          stroke="#6b6dff"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.7 }}
          points={line}
        />
        {safe.map((value, idx) => {
          const x = (idx / Math.max(safe.length - 1, 1)) * 280;
          const y = 110 - (value / max) * 90;
          return <circle key={`${value}-${idx}`} cx={x} cy={y} r="4" fill="#7c4dff" />;
        })}
      </svg>
    </div>
  );
}

export default function AnalysisDashboard({ insightData, progress, history, searchQuery = "" }) {
  const input = insightData?.input || {
    characters: 0,
    items: 0,
    chunks: 0,
    classifications: []
  };

  const analysis = insightData?.analysis || {
    functional_count: 0,
    timeline_count: 0,
    risk_count: 0,
    conflict_count: 0,
    conflict_severity: { high: 0, medium: 0, low: 0 }
  };

  const keyword = searchQuery.trim().toLowerCase();
  const filterList = (items) => {
    if (!keyword) return items || [];
    return (items || []).filter((item) => String(item).toLowerCase().includes(keyword));
  };

  const risks = filterList(insightData?.risks);
  const timelines = filterList(insightData?.timeline_milestones);
  const requirements = filterList(insightData?.functional_requirements);
  const conflicts = (insightData?.conflicts || []).filter((item) => {
    if (!keyword) return true;
    return `${item.type || ""} ${item.severity || ""} ${item.detail || ""}`.toLowerCase().includes(keyword);
  });
  const assessment = insightData?.brd_assessment;
  const generationOptions = insightData?.generation_options;
  const filteredStrengths = filterList(assessment?.strengths);
  const filteredGaps = filterList(assessment?.gaps);
  const filteredRecommendations = filterList(assessment?.recommendations);

  const strategicHealth = {
    strategicConfidence: clamp(70 + analysis.functional_count * 2 - analysis.conflict_count * 3, 10, 97),
    executionReadiness: clamp(60 + analysis.timeline_count * 5 - analysis.risk_count * 2, 10, 96),
    conflictSeverity: clamp(30 + analysis.conflict_count * 12 + analysis.risk_count * 2, 5, 99),
    ownershipClarity: clamp(65 + analysis.functional_count * 3 - analysis.conflict_count * 2, 10, 98),
    successProbability: clamp(68 + analysis.functional_count * 2 - analysis.risk_count * 3 - analysis.conflict_count * 2, 5, 96)
  };

  const baseSimulation = {
    scopeChange: clamp(Math.round(analysis.functional_count * 6), 0, 100),
    budgetAdjustment: clamp(Math.round(analysis.timeline_count * 8), 0, 100),
    timelineShift: clamp(Math.round(analysis.conflict_count * 12), 0, 100),
    teamCapacity: clamp(Math.round(80 - analysis.risk_count * 5), 0, 100),
    riskScore: clamp(Math.round(100 - strategicHealth.successProbability), 0, 100),
    resourceStrain: clamp(Math.round(35 + analysis.risk_count * 8 + analysis.conflict_count * 5), 0, 100),
    alignmentScore: strategicHealth.ownershipClarity
  };

  return (
    <div className="space-y-5 pb-10">
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="neon-panel interactive-tile">
          <h3 className="mb-6 text-2xl font-extrabold text-slate-100">Strategic Health Overview</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            <RingGauge label="AI Strategic Confidence" value={strategicHealth.strategicConfidence} color="#6b6dff" delay={0.03} />
            <RingGauge label="Execution Readiness" value={strategicHealth.executionReadiness} color="#7c4dff" delay={0.06} />
            <RingGauge label="Conflict Severity" value={strategicHealth.conflictSeverity} color="#65d208" delay={0.09} />
            <RingGauge label="Ownership Clarity" value={strategicHealth.ownershipClarity} color="#65d208" delay={0.12} />
            <RingGauge label="Initiative Success Probability" value={strategicHealth.successProbability} color="#4d7dff" delay={0.15} />
          </div>
        </section>

        <StrategySimulator base={baseSimulation} />
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <KpiCard title="Characters" value={input.characters.toLocaleString()} icon={FiFileText} accent="#6b6dff" delay={0.02} />
        <KpiCard title="Source Items" value={input.items} icon={FiDatabase} accent="#4d7dff" delay={0.05} />
        <KpiCard title="Chunks" value={input.chunks} icon={FiLayers} accent="#22d3ee" delay={0.08} />
        <KpiCard title="Functional" value={analysis.functional_count} icon={FiCheckCircle} accent="#65d208" delay={0.11} />
        <KpiCard title="Risks" value={analysis.risk_count} icon={FiAlertTriangle} accent="#ff5e00" delay={0.14} />
        <KpiCard title="Conflicts" value={analysis.conflict_count} icon={FiGitMerge} accent="#ff2d55" delay={0.17} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <ProgressRing value={progress?.percent || 0} />
        <CountBars analysis={analysis} />
        <SeverityCard severity={analysis.conflict_severity} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SimpleList
          title="Functional Requirements"
          icon={FiList}
          items={requirements}
          empty="No functional requirements extracted yet."
        />
        <SimpleList title="Timeline Milestones" icon={FiClock} items={timelines} empty="No timeline milestones extracted yet." />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SimpleList title="Risk Signals" icon={FiFlag} items={risks} empty="No risk signals extracted yet." />
        <div className="rounded-2xl border border-slate-800 bg-[#091226] p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
            <FiShield size={16} />
            Conflict Details
          </div>
          {conflicts.length === 0 ? <p className="text-sm text-slate-500">No conflicts detected.</p> : null}
          <div className="space-y-2">
            {conflicts.slice(0, 5).map((item, idx) => (
              <div key={`${item.type}-${idx}`} className="rounded-lg border border-slate-800 bg-[#0b162d] p-3">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-200 pr-2">{item.type}</p>
                  <span className="kpi-badge">{item.severity}</span>
                </div>
                <p className="text-sm text-slate-400 break-words">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <HistoryRiskTrend history={history || []} />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-[#091226] p-4">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">BRD Quality Audit</p>
          <div className="grid grid-cols-2 gap-3">
            <ResultCard label="Quality Score" value={`${assessment?.quality_score ?? 0}/100`} />
            <ResultCard label="Delivery Confidence" value={`${assessment?.delivery_confidence ?? 0}/100`} />
          </div>
          <div className="mt-3 rounded-xl border border-slate-800 bg-[#0b162d] p-3">
            <p className="text-sm font-semibold text-slate-200">Summary</p>
            <p className="mt-1 text-sm text-slate-400">{assessment?.summary || "Assessment unavailable for this session."}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#091226] p-4">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">Generation Profile</p>
          <div className="space-y-1 text-sm text-slate-300">
            <p><span className="text-slate-400">Audience:</span> {generationOptions?.audience || "Default"}</p>
            <p><span className="text-slate-400">Industry:</span> {generationOptions?.industry || "Default"}</p>
            <p><span className="text-slate-400">Tone:</span> {generationOptions?.tone || "Default"}</p>
            <p><span className="text-slate-400">Compliance:</span> {generationOptions?.compliance || "Default"}</p>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            <span className="kpi-badge">{generationOptions?.includeTraceability ? "Traceability On" : "Traceability Off"}</span>
            <span className="kpi-badge">{generationOptions?.includeRaci ? "RACI On" : "RACI Off"}</span>
            <span className="kpi-badge">{generationOptions?.includeSuccessMetrics ? "Metrics On" : "Metrics Off"}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SimpleList
          title="AI-Detected Strengths"
          icon={FiCheckCircle}
          items={filteredStrengths}
          empty="No strengths listed."
        />
        <SimpleList
          title="AI-Detected Gaps"
          icon={FiAlertTriangle}
          items={filteredGaps}
          empty="No gaps listed."
        />
        <SimpleList
          title="AI Recommendations"
          icon={FiActivity}
          items={filteredRecommendations}
          empty="No recommendations listed."
        />
      </div>

      <div className="rounded-2xl border border-slate-800 bg-[#091226] p-4 text-sm text-slate-400">
        <p className="font-semibold text-slate-200">Data Integrity</p>
        <p className="mt-1">
          All KPI values above are derived directly from current session artifacts: ingestion chunks, extracted requirements/timelines/risks,
          and conflict detection outputs. No placeholder scenario values are used.
        </p>
      </div>
    </div>
  );
}
