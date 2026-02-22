import { useEffect } from "react";
import { FiPlayCircle } from "react-icons/fi";
import { api } from "../utils/api";
import { useAppStore } from "../store/useAppStore";
import WorkspaceInput from "../components/WorkspaceInput";
import PipelineStepper from "../components/PipelineStepper";
import BrdViewer from "../components/BrdViewer";
import ChatAssistant from "../components/ChatAssistant";

export default function WorkspacePage() {
  const {
    loading,
    error,
    sessionId,
    sourceText,
    outputMode,
    generationOptions,
    progress,
    brd,
    insightData,
    polling,
    demoMode,
    chatOpen,
    chatBusy,
    chatMessages,
    setLoading,
    setError,
    setSessionId,
    setSourceText,
    setOutputMode,
    setGenerationOption,
    setProgress,
    setInsightData,
    setBrd,
    setPolling,
    toggleChat,
    setChatBusy,
    pushChatMessage,
    resetChat
  } = useAppStore();

  const demoDataset = `Subject: Q3 Payments Modernization
From: product@company.com
We need to launch the new checkout platform by end of Q3. It must support card, UPI, and wallet flows with <2s API latency.

Slack 10:23 AM @engineering-lead
Current staffing cannot support parallel migration and new feature development. We need either 2 contractors or a phased rollout.

Meeting Notes
Action items:
1) Security review must complete before production launch.
2) Compliance requires audit trails for all refunds.
3) Sales requested enterprise invoice workflow in same release.

Project Note
Potential conflict: Sales wants full invoice workflow by Q3, but Engineering estimates Q4 unless scope is reduced.`;

  useEffect(() => {
    if (sessionId) return;

    api
      .createSession()
      .then((data) => setSessionId(data.session_id))
      .catch((err) => setError(err.message));
  }, [sessionId, setError, setSessionId]);

  useEffect(() => {
    if (!polling || !sessionId) return undefined;

    const timer = setInterval(async () => {
      try {
        const next = await api.getProgress(sessionId);
        setProgress(next);

        if (next.status === "completed") {
          const doc = await api.getBrd(sessionId);
          setBrd(doc.brd);
          const insights = await api.getInsights(sessionId);
          setInsightData(insights);
          setPolling(false);
        }

        if (next.status === "error") {
          setError(next.error || "Pipeline failed");
          setPolling(false);
        }
      } catch (err) {
        setError(err.message);
        setPolling(false);
      }
    }, 1200);

    return () => clearInterval(timer);
  }, [polling, sessionId, setBrd, setError, setInsightData, setPolling, setProgress]);

  async function submitPaste() {
    if (!sessionId || !sourceText.trim()) return;

    try {
      setLoading(true);
      setError("");
      await api.pasteContent(sessionId, sourceText);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitFile(file) {
    if (!file) return;

    try {
      setLoading(true);
      setError("");
      const data = await api.uploadFile(file);
      setSessionId(data.session_id);
      setSourceText(`Uploaded file: ${data.filename}`);
      setBrd("");
      setInsightData(null);
      resetChat();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function generateBrd() {
    if (!sessionId) return;

    try {
      setLoading(true);
      setError("");
      setBrd("");
      setInsightData(null);
      resetChat();
      await api.startGeneration(sessionId, outputMode, generationOptions);
      setProgress({ stage: "Ingestion", percent: 5, status: "running" });
      setPolling(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadDemoData() {
    if (!sessionId) return;
    try {
      setLoading(true);
      setError("");
      setSourceText(demoDataset);
      await api.pasteContent(sessionId, demoDataset);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function sendChat(message) {
    const question = String(message || "").trim();
    if (!question) return;

    if (!sessionId || !brd) {
      pushChatMessage({ role: "assistant", content: "Generate BRD first, then I can answer context-aware questions." });
      return;
    }

    pushChatMessage({ role: "user", content: question });

    try {
      setChatBusy(true);
      const reply = await api.chat(sessionId, question);
      pushChatMessage({ role: "assistant", content: reply.reply });
    } catch (err) {
      pushChatMessage({ role: "assistant", content: `Error: ${err.message}` });
    } finally {
      setChatBusy(false);
    }
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/70 pb-4">
        <div>
          <h3 className="section-title text-lg">Workspace Overview</h3>
          <p className="section-subtitle">Ingest sources, run synthesis, then review and chat against the generated BRD.</p>
        </div>
        <div className="flex items-center gap-2">
          {demoMode ? (
            <button onClick={loadDemoData} className="btn-secondary">
              <FiPlayCircle />
              Load Demo Dataset
            </button>
          ) : null}
          <span className="badge-soft">Stage: {progress.stage}</span>
          <span className="badge-soft">Progress: {progress.percent}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <WorkspaceInput
            sourceText={sourceText}
            onChangeText={setSourceText}
            onSubmitText={submitPaste}
            onUploadFile={submitFile}
            loading={loading}
            sessionId={sessionId}
          />
        </div>

        <div className="space-y-6">
          <div className="neon-panel interactive-tile pb-5">
            <h4 className="mb-2 text-lg font-bold text-slate-100">BRD Synthesis</h4>
            <p className="mb-5 text-sm text-slate-400">
              Runs extraction, normalization, conflict detection, and Gemini synthesis using your current session context.
            </p>
            <div className="mb-4">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Output Mode
              </label>
              <select
                value={outputMode}
                onChange={(event) => setOutputMode(event.target.value)}
                className="w-full rounded-xl border border-[#2a3d66] bg-[#0a162c] px-3 py-2 text-sm text-slate-100 outline-none focus:border-[#5a7dff]"
              >
                <option value="concise">Concise (executive summary)</option>
                <option value="standard">Standard (balanced)</option>
                <option value="detailed">Detailed (implementation depth)</option>
              </select>
            </div>
            <div className="mb-4 grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Audience</label>
                <select
                  value={generationOptions.audience}
                  onChange={(event) => setGenerationOption("audience", event.target.value)}
                  className="w-full rounded-xl border border-[#2a3d66] bg-[#0a162c] px-3 py-2 text-sm text-slate-100 outline-none focus:border-[#5a7dff]"
                >
                  <option>Product and Engineering Leadership</option>
                  <option>Executive Board and CXOs</option>
                  <option>Engineering Delivery Teams</option>
                  <option>Client Stakeholders</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Industry</label>
                <select
                  value={generationOptions.industry}
                  onChange={(event) => setGenerationOption("industry", event.target.value)}
                  className="w-full rounded-xl border border-[#2a3d66] bg-[#0a162c] px-3 py-2 text-sm text-slate-100 outline-none focus:border-[#5a7dff]"
                >
                  <option>General Technology</option>
                  <option>FinTech</option>
                  <option>Healthcare</option>
                  <option>E-commerce</option>
                  <option>Enterprise SaaS</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Tone</label>
                <select
                  value={generationOptions.tone}
                  onChange={(event) => setGenerationOption("tone", event.target.value)}
                  className="w-full rounded-xl border border-[#2a3d66] bg-[#0a162c] px-3 py-2 text-sm text-slate-100 outline-none focus:border-[#5a7dff]"
                >
                  <option>Executive and precise</option>
                  <option>Technical and implementation-focused</option>
                  <option>Business-friendly and concise</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Compliance Focus</label>
                <select
                  value={generationOptions.compliance}
                  onChange={(event) => setGenerationOption("compliance", event.target.value)}
                  className="w-full rounded-xl border border-[#2a3d66] bg-[#0a162c] px-3 py-2 text-sm text-slate-100 outline-none focus:border-[#5a7dff]"
                >
                  <option>Standard enterprise controls</option>
                  <option>SOC 2 and ISO 27001</option>
                  <option>GDPR and privacy controls</option>
                  <option>HIPAA and healthcare safeguards</option>
                </select>
              </div>
            </div>
            <div className="mb-4 grid gap-2 text-sm text-slate-200">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={generationOptions.includeTraceability}
                  onChange={(event) => setGenerationOption("includeTraceability", event.target.checked)}
                />
                Include Traceability Matrix
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={generationOptions.includeRaci}
                  onChange={(event) => setGenerationOption("includeRaci", event.target.checked)}
                />
                Include RACI responsibilities
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={generationOptions.includeSuccessMetrics}
                  onChange={(event) => setGenerationOption("includeSuccessMetrics", event.target.checked)}
                />
                Include Success Metrics section
              </label>
            </div>
            <button onClick={generateBrd} disabled={loading || !sessionId} className="btn-primary w-full py-3">
              Run AI Pipeline
            </button>
          </div>

          <div className="border-t border-slate-800/60 pt-4">
            <PipelineStepper progress={progress} />
          </div>
        </div>
      </div>

      {error ? <div className="rounded-xl border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm font-semibold text-red-200">{error}</div> : null}

      {polling && !brd ? (
        <div className="rounded-2xl border border-slate-800 bg-[#091226] p-6">
          <div className="skeleton mb-4 h-5 w-1/4 rounded" />
          <div className="skeleton mb-2 h-3 w-full rounded" />
          <div className="skeleton mb-2 h-3 w-5/6 rounded" />
          <div className="skeleton h-3 w-4/6 rounded" />
        </div>
      ) : null}

      {brd ? <BrdViewer brd={brd} insightData={insightData} /> : null}

      <ChatAssistant open={chatOpen} busy={chatBusy} onToggle={toggleChat} onSend={sendChat} messages={chatMessages} />
    </div>
  );
}
