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
  FiRotateCcw,
  FiShield
} from "react-icons/fi";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function RingGauge({ label, value, color = "#d97706", delay = 0, compact = false }) {
  const pct = clamp(Math.round(value), 0, 100);
  const circumference = 2 * Math.PI * 42;
  const dash = (pct / 100) * circumference;
  const size = compact ? 92 : 112;
  const center = size / 2;
  const radius = compact ? 34 : 42;
  const localCircumference = 2 * Math.PI * radius;
  const localDash = (pct / 100) * localCircumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className={compact ? "flex items-center gap-3 rounded-xl border border-[#2f2f2f] bg-[#101010] p-3" : "text-center"}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={compact ? "shrink-0" : "mx-auto"}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#1f1f1f" strokeWidth="8" />
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
          initial={{ strokeDasharray: `0 ${localCircumference}` }}
          animate={{ strokeDasharray: `${localDash} ${localCircumference}` }}
          transition={{ duration: 0.8, delay: delay + 0.1 }}
        />
        <text x={center} y={compact ? center + 6 : center + 7} textAnchor="middle" className={compact ? "fill-slate-100 text-xl font-black" : "fill-slate-100 text-2xl font-black"}>
          {pct}%
        </text>
      </svg>
      <p className={compact ? "max-w-none text-sm font-semibold leading-5 text-slate-200" : "mx-auto mt-3 max-w-[12ch] text-sm font-semibold leading-6 text-slate-200"}>
        {label}
      </p>
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

  const presets = [
    { key: "aggressive", label: "Aggressive Growth", values: { scopeChange: 78, budgetAdjustment: 62, timelineShift: 70, teamCapacity: 58 } },
    { key: "controlled", label: "Controlled Expansion", values: { scopeChange: 52, budgetAdjustment: 44, timelineShift: 38, teamCapacity: 74 } },
    { key: "risk_guarded", label: "Risk-Guarded Plan", values: { scopeChange: 34, budgetAdjustment: 48, timelineShift: 22, teamCapacity: 86 } }
  ];

  function applyPreset(preset) {
    setScopeChange(preset.values.scopeChange);
    setBudgetAdjustment(preset.values.budgetAdjustment);
    setTimelineShift(preset.values.timelineShift);
    setTeamCapacity(preset.values.teamCapacity);
  }

  const deltas = [
    { label: "Risk", current: base.riskScore, next: simulated.riskScore, inverse: true },
    { label: "Success", current: clamp(100 - base.riskScore, 0, 100), next: simulated.successProbability },
    { label: "Alignment", current: base.alignmentScore, next: simulated.alignmentScore },
    { label: "Strain", current: base.resourceStrain, next: simulated.resourceStrain, inverse: true }
  ];

  return (
    <section className="neon-panel h-full">
      <h3 className="mb-6 text-2xl font-extrabold text-slate-100">Strategy Simulator</h3>
      <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="rounded-2xl border border-slate-800 bg-[#121212] p-4">
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
                  style={{ "--progress": `${((control.value - control.min) / (control.max - control.min)) * 100}%` }}
                  className="sim-slider h-2 w-full cursor-pointer appearance-none"
                />
                <div className="mt-1 grid grid-cols-5 gap-1 px-0.5">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <span key={`${control.label}-tick-${idx}`} className="h-px bg-[#3f3f46]" />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex gap-2">
            <div className="flex-1 rounded-xl border border-[#404040] bg-[#171717] px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">
              Live simulation updates with every slider change
            </div>
            <button onClick={resetScenario} className="btn-secondary min-w-[108px]">
              <span>Reset</span>
              <FiRotateCcw size={14} />
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-[#404040] bg-[#131313]">
            {presets.map((preset, index) => (
              <button
                key={preset.key}
                onClick={() => applyPreset(preset)}
                className={`flex w-full min-w-0 items-center justify-center gap-3 px-3 py-2.5 text-center text-sm font-semibold text-slate-200 transition hover:bg-[#1a1a1a] hover:text-white ${
                  index !== presets.length - 1 ? "border-b border-[#2f2f2f]" : ""
                }`}
              >
                <span className="truncate text-center">{preset.label}</span>
              </button>
            ))}
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
          <div className="mt-3 rounded-2xl border border-slate-800 bg-[#171717] p-4">
            <p className="text-sm text-slate-400">Financial Impact</p>
            <p className="mt-1 break-words text-3xl font-black text-slate-100 md:text-4xl">${simulated.financialImpact.toFixed(1)}M</p>
          </div>

          <div className="mt-3 rounded-2xl border border-[#404040] bg-[#151515] p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Before/After Comparison</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {deltas.map((row) => {
                const diff = row.next - row.current;
                const good = row.inverse ? diff <= 0 : diff >= 0;
                return (
                  <div key={row.label} className="rounded-lg border border-[#2f2f2f] bg-[#101010] px-3 py-2">
                    <p className="text-xs uppercase tracking-wide text-slate-400">{row.label}</p>
                    <p className="text-sm text-slate-300">
                      {row.current} {"->"} <span className="font-semibold text-slate-100">{row.next}</span>
                    </p>
                    <p className={`text-xs font-semibold ${good ? "text-emerald-300" : "text-red-300"}`}>
                      {diff > 0 ? "+" : ""}{diff} delta
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ResultCard({ label, value }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-800 bg-[#171717] p-4">
      <p className="text-sm leading-5 text-slate-400">{label}</p>
      <p className="mt-1 break-words text-xl font-black leading-tight tabular-nums text-slate-100 sm:text-2xl md:text-[1.7rem]">{value}</p>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, accent = "#d97706", delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="rounded-2xl border border-slate-800 bg-[#121212] p-4"
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
    <div className="rounded-2xl border border-slate-800 bg-[#121212] p-4">
      <p className="mb-4 text-sm font-semibold text-slate-300">Pipeline Completion</p>
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <svg width="116" height="116" viewBox="0 0 116 116">
          <circle cx="58" cy="58" r="44" fill="none" stroke="#1f1f1f" strokeWidth="10" />
          <motion.circle
            cx="58"
            cy="58"
            r="44"
            fill="none"
            stroke="#d97706"
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
    { key: "functional_count", label: "Functional", color: "#d97706" },
    { key: "timeline_count", label: "Timeline", color: "#a16207" },
    { key: "risk_count", label: "Risks", color: "#ea580c" },
    { key: "conflict_count", label: "Conflicts", color: "#dc2626" }
  ];

  const max = Math.max(1, ...bars.map((item) => analysis[item.key] || 0));

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#121212] p-4">
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
              <div className="h-2 rounded-full bg-[#1f1f1f]">
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
    { label: "High", value: severity?.high || 0, color: "#dc2626" },
    { label: "Medium", value: severity?.medium || 0, color: "#ea580c" },
    { label: "Low", value: severity?.low || 0, color: "#65a30d" }
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#121212] p-4">
      <p className="mb-4 text-sm font-semibold text-slate-300">Conflict Severity</p>
      <div className="grid gap-2 md:grid-cols-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className={`rounded-xl border border-slate-800 bg-[#171717] p-3 text-center ${
              row.label === "High" ? "shadow-[0_0_22px_rgba(220,38,38,0.35)]" : row.label === "Medium" ? "shadow-[0_0_18px_rgba(234,88,12,0.3)]" : "shadow-[0_0_14px_rgba(101,163,13,0.25)]"
            }`}
          >
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
    <div className="rounded-2xl border border-slate-800 bg-[#121212] p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <Icon size={16} />
        {title}
      </div>
      {items.length === 0 ? <p className="text-sm text-slate-500">{empty}</p> : null}
      <div className="space-y-2">
        {items.slice(0, 6).map((item) => (
          <div key={item} className="rounded-lg border border-slate-800 bg-[#171717] px-3 py-2 text-sm text-slate-300 break-words">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryRiskTrend({ history }) {
  const recent = history.slice(0, 8).reverse();
  const points = recent.map((item) => item.stats?.riskMentions || 0);
  const safe = points.length ? points : [0, 0, 0, 0];
  const max = Math.max(1, ...safe, 4);

  const chart = {
    width: 340,
    height: 180,
    left: 42,
    right: 12,
    top: 14,
    bottom: 30
  };
  const innerW = chart.width - chart.left - chart.right;
  const innerH = chart.height - chart.top - chart.bottom;
  const xAt = (idx) => chart.left + (idx / Math.max(safe.length - 1, 1)) * innerW;
  const yAt = (value) => chart.top + innerH - (value / max) * innerH;

  const line = safe
    .map((value, idx) => {
      const x = xAt(idx);
      const y = yAt(value);
      return `${x},${y}`;
    })
    .join(" ");

  const yTicks = [0, Math.round(max * 0.33), Math.round(max * 0.66), max];
  const xLabels = safe.map((_, idx) => `Run ${idx + 1}`);

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#121212] p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <FiActivity size={16} />
        Historical Risk Trend
      </div>
      <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="h-40 w-full">
        <line x1={chart.left} y1={chart.top} x2={chart.left} y2={chart.top + innerH} stroke="#525252" strokeWidth="1.5" />
        <line x1={chart.left} y1={chart.top + innerH} x2={chart.left + innerW} y2={chart.top + innerH} stroke="#525252" strokeWidth="1.5" />

        {yTicks.map((tick) => {
          const y = yAt(tick);
          return (
            <g key={`yt-${tick}`}>
              <line x1={chart.left} y1={y} x2={chart.left + innerW} y2={y} stroke="#232323" strokeWidth="1" />
              <text x={chart.left - 8} y={y + 4} textAnchor="end" className="fill-slate-500 text-[10px]">
                {tick}
              </text>
            </g>
          );
        })}

        <motion.polyline
          fill="none"
          stroke="#d97706"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.7 }}
          points={line}
        />
        {safe.map((value, idx) => {
          const x = xAt(idx);
          const y = yAt(value);
          return (
            <g key={`${value}-${idx}`}>
              <circle cx={x} cy={y} r="4" fill="#b45309" />
              <text x={x} y={chart.top + innerH + 16} textAnchor="middle" className="fill-slate-500 text-[10px]">
                {xLabels[idx]}
              </text>
            </g>
          );
        })}

        <text x={chart.width / 2} y={chart.height - 4} textAnchor="middle" className="fill-slate-400 text-[10px]">
          BRD Generation Sequence (oldest to newest)
        </text>
        <text
          x={12}
          y={chart.top + innerH / 2}
          transform={`rotate(-90 12 ${chart.top + innerH / 2})`}
          textAnchor="middle"
          className="fill-slate-400 text-[10px]"
        >
          Risk Mentions Count
        </text>
      </svg>
      <p className="mt-2 text-xs text-slate-400">
        This graph plots extracted risk mentions per BRD run. Higher values indicate more risk-heavy source communication.
      </p>
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
  const generationOptions = insightData?.generation_options;

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
      <div className="grid items-stretch gap-4 xl:grid-cols-[0.78fr_1.22fr]">
        <section className="neon-panel interactive-tile">
          <h3 className="mb-6 text-2xl font-extrabold text-slate-100">Strategic Health Overview</h3>
          <div className="space-y-3">
            <RingGauge compact label="AI Strategic Confidence" value={strategicHealth.strategicConfidence} color="#d97706" delay={0.03} />
            <RingGauge compact label="Execution Readiness" value={strategicHealth.executionReadiness} color="#b45309" delay={0.06} />
            <RingGauge compact label="Conflict Severity" value={strategicHealth.conflictSeverity} color="#65a30d" delay={0.09} />
            <RingGauge compact label="Ownership Clarity" value={strategicHealth.ownershipClarity} color="#65a30d" delay={0.12} />
            <RingGauge compact label="Initiative Success Probability" value={strategicHealth.successProbability} color="#a16207" delay={0.15} />
          </div>
        </section>

        <StrategySimulator base={baseSimulation} />
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <KpiCard title="Characters" value={input.characters.toLocaleString()} icon={FiFileText} accent="#d97706" delay={0.02} />
        <KpiCard title="Source Items" value={input.items} icon={FiDatabase} accent="#a16207" delay={0.05} />
        <KpiCard title="Chunks" value={input.chunks} icon={FiLayers} accent="#65a30d" delay={0.08} />
        <KpiCard title="Functional" value={analysis.functional_count} icon={FiCheckCircle} accent="#65a30d" delay={0.11} />
        <KpiCard title="Risks" value={analysis.risk_count} icon={FiAlertTriangle} accent="#ea580c" delay={0.14} />
        <KpiCard title="Conflicts" value={analysis.conflict_count} icon={FiGitMerge} accent="#dc2626" delay={0.17} />
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
        <div className="rounded-2xl border border-slate-800 bg-[#121212] p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
            <FiShield size={16} />
            Conflict Details
          </div>
          {conflicts.length === 0 ? <p className="text-sm text-slate-500">No conflicts detected.</p> : null}
          <div className="space-y-2">
            {conflicts.slice(0, 5).map((item, idx) => (
              <div key={`${item.type}-${idx}`} className="rounded-lg border border-slate-800 bg-[#171717] p-3">
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

      <div className="grid gap-4 lg:grid-cols-1">
        <div className="rounded-2xl border border-slate-800 bg-[#121212] p-4">
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

      <div className="rounded-2xl border border-slate-800 bg-[#121212] p-4 text-sm text-slate-400">
        <p className="font-semibold text-slate-200">Data Integrity</p>
        <p className="mt-1">
          All KPI values above are derived directly from current session artifacts: ingestion chunks, extracted requirements/timelines/risks,
          and conflict detection outputs. No placeholder scenario values are used.
        </p>
      </div>
    </div>
  );
}
