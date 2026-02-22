import { useEffect, useMemo, useState } from "react";
import { FiSearch } from "react-icons/fi";
import AnalysisDashboard from "../components/AnalysisDashboard";
import ScenarioWarRoom from "../components/ScenarioWarRoom";
import { useAppStore } from "../store/useAppStore";
import { api } from "../utils/api";

export default function InsightsPage() {
  const {
    sessionId,
    insightData,
    setInsightData,
    progress,
    history,
    brd,
    sourceText,
    generationOptions,
    setLoading,
    setError,
    setBrd,
    setPolling,
    setProgress,
    setActiveTab
  } = useAppStore();
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insightError, setInsightError] = useState("");
  const [query, setQuery] = useState("");
  const [scenarioRunning, setScenarioRunning] = useState(false);

  const fallbackInsights = useMemo(() => {
    const functional = (brd.match(/FR-|functional requirements?/gi) || []).length;
    const timeline = (brd.match(/timeline|milestone/gi) || []).length;
    const risks = (brd.match(/\brisk/gi) || []).length;
    const conflicts = (brd.match(/\bconflict/gi) || []).length;
    const lines = sourceText.split(/\n+/).filter(Boolean).length;
    return {
      session_id: sessionId || "",
      generated_at: "",
      status: progress?.status || "running",
      mode: "standard",
      generation_options: null,
      input: {
        characters: sourceText.length,
        items: lines ? 1 : 0,
        chunks: Math.max(1, Math.round(sourceText.length / 1600)),
        classifications: []
      },
      analysis: {
        functional_count: functional,
        timeline_count: timeline,
        risk_count: risks,
        conflict_count: conflicts,
        conflict_severity: {
          high: conflicts > 1 ? 1 : 0,
          medium: conflicts > 2 ? conflicts - 2 : conflicts > 0 ? 1 : 0,
          low: conflicts > 3 ? 1 : 0
        }
      },
      functional_requirements: [],
      timeline_milestones: [],
      risks: [],
      conflicts: [],
      evidence: [],
      executive_brief: null,
      brd_assessment: {
        summary: "Fallback assessment generated from local BRD content.",
        strengths: [],
        gaps: [],
        recommendations: [],
        quality_score: Math.max(0, Math.min(100, 55 + functional * 4 - risks * 3 - conflicts * 2)),
        delivery_confidence: Math.max(0, Math.min(100, 70 - risks * 4 - conflicts * 5))
      }
    };
  }, [brd, sourceText, sessionId, progress]);

  async function fetchInsights() {
    if (!sessionId) return;
    setLoadingInsights(true);
    setInsightError("");
    try {
      const data = await api.getInsights(sessionId);
      setInsightData(data);
    } catch (error) {
      setInsightError(error.message || "Could not load insights from backend");
    } finally {
      setLoadingInsights(false);
    }
  }

  useEffect(() => {
    if (!sessionId || insightData) return;
    void fetchInsights();
  }, [sessionId, insightData]);

  const effectiveInsights = insightData || fallbackInsights;
  const classifications = effectiveInsights?.input?.classifications || [];
  const executiveBrief = effectiveInsights?.executive_brief;

  async function runScenarioBrd(scenario) {
    if (!sessionId) return;
    try {
      setScenarioRunning(true);
      setLoading(true);
      setError("");
      setBrd("");
      setInsightData(null);

      const scenarioOptions = {
        ...generationOptions,
        tone: "Technical and implementation-focused",
        includeTraceability: true,
        includeRaci: true,
        includeSuccessMetrics: true,
        scenario: {
          ...scenario,
          generatedAt: new Date().toISOString()
        }
      };

      await api.startGeneration(sessionId, "detailed", scenarioOptions);
      setProgress({ stage: "Ingestion", percent: 5, status: "running" });
      setPolling(true);
      setActiveTab("workspace");
    } catch (error) {
      setError(error.message || "Failed to start scenario generation");
    } finally {
      setScenarioRunning(false);
      setLoading(false);
    }
  }

  function downloadExecutiveBrief() {
    if (!executiveBrief) return;
    const markdown = `# Executive Brief

Decision: ${executiveBrief.decision}
Quality Score: ${executiveBrief.quality_score}/100
Delivery Confidence: ${executiveBrief.delivery_confidence}/100
Risk Score: ${executiveBrief.risk_score}/100
Timeline Health: ${executiveBrief.timeline_health}/100

## Decision Summary
${executiveBrief.summary}

## Top Risks
${(executiveBrief.top_risks || []).map((item) => `- ${item}`).join("\n")}

## Budget Outlook
${executiveBrief.budget_outlook}

## Recommendation
${executiveBrief.recommendation}
`;
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `executive-brief-${Date.now()}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4 pb-12">
      <div className="neon-panel interactive-tile p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-100">Strategic Intelligence Deck</h2>
            <p className="mt-1 text-sm text-slate-400">
              Real-time operational analytics computed from actual extraction and conflict-detection outputs.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge-soft">{effectiveInsights?.status || "running"}</span>
            {executiveBrief ? (
              <button onClick={downloadExecutiveBrief} className="btn-secondary">
                Export Executive Brief
              </button>
            ) : null}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#24385f] bg-[#0a162d] px-3 py-2">
          <FiSearch className="text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search insights by requirement, risk, milestone, conflict, or assessment..."
            className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
          />
        </div>
        <p className="mt-1 text-sm text-slate-400">
          Filtered view updates below as you type.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {classifications.map((item) => (
            <span key={item} className="kpi-badge">
              {item}
            </span>
          ))}
          {classifications.length === 0 ? <span className="kpi-badge">No classifications yet</span> : null}
        </div>
      </div>

      {loadingInsights ? <div className="card p-5 text-sm text-slate-300">Loading insights from session artifacts...</div> : null}
      {insightError ? (
        <div className="rounded-xl border border-orange-400/30 bg-orange-500/10 p-4 text-sm text-orange-200">
          <p className="font-semibold">Backend insights unavailable</p>
          <p className="mt-1">Showing derived fallback metrics from current BRD/input. {insightError}</p>
          <button onClick={fetchInsights} className="btn-secondary mt-3">Retry Backend Insights</button>
        </div>
      ) : null}

      <ScenarioWarRoom insightData={effectiveInsights} onRunScenario={runScenarioBrd} running={scenarioRunning} />
      <AnalysisDashboard insightData={effectiveInsights} progress={progress} history={history} searchQuery={query} />
    </div>
  );
}
