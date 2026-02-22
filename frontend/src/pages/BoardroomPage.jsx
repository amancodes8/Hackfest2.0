import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiArrowLeft, FiArrowRight, FiChevronLeft, FiMonitor, FiRefreshCw } from "react-icons/fi";
import { api } from "../utils/api";
import { useAppStore } from "../store/useAppStore";

function punchySummary(deck) {
  const summary = String(deck?.strategic_summary || "").trim();
  const action = deck?.required_actions?.[0]?.title || "Activate risk-control actions immediately.";
  if (!summary) return `Decision Signal: Proceed in controlled phases. Immediate Action: ${action}`;
  if (/^decision signal:/i.test(summary)) return summary;
  return `Decision Signal: ${summary} Immediate Action: ${action}`;
}

function MetricCard({ label, value, caption }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[#2f2f2f] bg-[#0d0d0d] p-4 text-center sm:p-6"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 sm:text-sm">{label}</p>
      <p className="mt-3 break-words text-3xl font-extrabold leading-tight text-slate-100 sm:text-4xl lg:text-5xl">{value}</p>
      {caption ? <p className="mt-2 text-sm text-slate-400 sm:text-base">{caption}</p> : null}
    </motion.div>
  );
}

export default function BoardroomPage({ onExit }) {
  const { sessionId, insightData, brd } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deck, setDeck] = useState(null);
  const [slide, setSlide] = useState(0);
  const attemptedRef = useRef(new Set());

  async function loadBoardroom() {
    if (!sessionId) {
      setError("No active session. Generate BRD first.");
      return;
    }
    if (!String(brd || "").trim()) {
      setError("Generate BRD first, then enter Boardroom mode.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await api.getBoardroom(sessionId);
      setDeck(data.boardroom);
    } catch (err) {
      const msg = String(err?.message || "Boardroom briefing unavailable");
      if (msg.includes("404")) {
        setError("Boardroom API unavailable on this running backend. Using local strategic fallback.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const key = `${sessionId || "none"}:${Boolean(brd?.trim())}`;
    if (attemptedRef.current.has(key)) return;
    attemptedRef.current.add(key);
    void loadBoardroom();
  }, [sessionId, brd]);

  const effectiveDeck = useMemo(() => {
    if (deck) return deck;
    const brief = insightData?.executive_brief;
    if (!brief) return null;

    return {
      verdict: brief.decision || "PROCEED WITH CAUTION",
      ai_confidence: brief.delivery_confidence || 78,
      strategic_summary: brief.summary || "Strategic summary unavailable.",
      financial_exposure: brief.financial_exposure || "$450K",
      strategic_upside: brief.strategic_upside || "$45M",
      critical_risks: (brief.top_risks || []).map((item, idx) => ({ statement: item, confidence: 90 - idx * 5 })),
      required_actions: [
        { title: "Secure engineering resource commitment by end of week", priority_note: "Priority for board engagement" },
        { title: "Conduct executive alignment workshop on scope boundaries", priority_note: "Priority for board engagement" },
        { title: "Establish weekly risk monitoring cadence", priority_note: "Priority for board engagement" }
      ],
      monitoring_notes: ["Track resources weekly", "Close unresolved conflicts before commitments"]
    };
  }, [deck, insightData]);

  const slides = useMemo(() => {
    if (!effectiveDeck) return [];

    return [
      {
        title: "Strategic Initiative Assessment",
        subtitle: "Executive Summary",
        content: (
          <div className="text-center">
            <p className="text-2xl font-extrabold tracking-tight text-slate-100 sm:text-3xl lg:text-5xl">{effectiveDeck.verdict}</p>
            <p className="mt-3 text-base text-slate-400 sm:text-lg lg:text-2xl">AI Confidence: {effectiveDeck.ai_confidence}%</p>
            <p className="mx-auto mt-6 max-w-4xl text-sm leading-relaxed text-slate-200 sm:text-base lg:mt-8 lg:text-xl">{punchySummary(effectiveDeck)}</p>
          </div>
        )
      },
      {
        title: "PREFLIGHT Intelligence",
        subtitle: "Executive Verdict",
        content: (
          <div className="space-y-4 sm:space-y-6">
            <div className="rounded-2xl border border-[#2f2f2f] bg-[#0d0d0d] p-4 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 sm:text-sm">Executive Verdict</p>
              <p className="mt-2 text-2xl font-extrabold text-slate-100 sm:text-3xl lg:text-4xl">{effectiveDeck.verdict}</p>
              <p className="mt-2 text-sm text-slate-400 sm:text-base lg:text-lg">AI Confidence: <span className="font-bold text-slate-100">{effectiveDeck.ai_confidence}%</span></p>
            </div>
            <div className="grid gap-4 xl:grid-cols-[1.8fr_1fr]">
              <div className="rounded-2xl border border-[#2f2f2f] bg-[#0d0d0d] p-4 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 sm:text-sm">Strategic Summary</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-200 sm:text-base lg:text-lg">{punchySummary(effectiveDeck)}</p>
              </div>
              <div className="space-y-4">
                <MetricCard label="Financial Exposure" value={effectiveDeck.financial_exposure} />
                <MetricCard label="Strategic Upside" value={effectiveDeck.strategic_upside} />
              </div>
            </div>
          </div>
        )
      },
      {
        title: "Risk Assessment",
        subtitle: "Critical Failure Vectors",
        content: (
          <div className="space-y-4 sm:space-y-6">
            {(effectiveDeck.critical_risks || []).slice(0, 5).map((risk, idx) => (
              <p key={`${risk.statement}-${idx}`} className="text-sm leading-relaxed text-slate-200 sm:text-base lg:text-xl">
                {risk.statement} <span className="text-slate-400">({risk.confidence}% confidence)</span>
              </p>
            ))}
          </div>
        )
      },
      {
        title: "Financial Impact",
        subtitle: "Upside vs. Exposure",
        content: (
          <div className="grid gap-6 lg:gap-10 xl:grid-cols-2">
            <MetricCard label="Strategic Upside" value={effectiveDeck.strategic_upside} caption="Potential revenue impact if successful" />
            <MetricCard label="Financial Exposure" value={effectiveDeck.financial_exposure} caption="Maximum capital at risk" />
          </div>
        )
      },
      {
        title: "Next Steps",
        subtitle: "Required Actions",
        content: (
          <div className="space-y-5 sm:space-y-7">
            {(effectiveDeck.required_actions || []).slice(0, 5).map((item, idx) => (
              <div key={`${item.title}-${idx}`} className="flex gap-3 sm:gap-5">
                <span className="text-2xl font-bold text-slate-200 sm:text-3xl lg:text-4xl">{idx + 1}</span>
                <div>
                  <p className="text-base font-semibold text-slate-100 sm:text-xl lg:text-2xl">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-400 sm:text-sm lg:text-base">{item.priority_note}</p>
                </div>
              </div>
            ))}
          </div>
        )
      }
    ];
  }, [effectiveDeck]);

  const total = slides.length || 1;
  const canPrev = slide > 0;
  const canNext = slide < total - 1;

  return (
    <div className="flex min-h-[82vh] flex-col rounded-[1.8rem] border border-[#2f2f2f] bg-black">
      <div className="flex items-center justify-between border-b border-[#2f2f2f] px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-2 text-slate-400">
          <button className="rounded-lg border border-[#2f2f2f] p-2"><FiChevronLeft /></button>
          <button className="rounded-lg border border-[#2f2f2f] p-2"><FiMonitor /></button>
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <button onClick={loadBoardroom} className="rounded-lg border border-[#2f2f2f] p-2" title="Refresh">
            <FiRefreshCw />
          </button>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 sm:px-6 sm:py-7 lg:px-10 lg:py-9">
        {loading ? <p className="text-base text-slate-400 sm:text-lg">Generating boardroom briefing...</p> : null}
        {error ? <p className="text-base text-red-300 sm:text-lg">{error}</p> : null}

        {!loading && !error && slides.length ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={slide}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-300 sm:text-sm">Slide {slide + 1} of {total}</p>
              <h2 className="mt-2 break-words text-2xl font-extrabold tracking-tight text-slate-100 sm:text-4xl lg:mt-3 lg:text-5xl">{slides[slide].title}</h2>
              <p className="mt-1 text-base text-slate-400 sm:text-xl lg:text-2xl">{slides[slide].subtitle}</p>
              <motion.div
                className="mt-5 sm:mt-8 lg:mt-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35, delay: 0.08 }}
              >
                {slides[slide].content}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#2f2f2f] px-4 py-4 sm:px-8 lg:px-10 lg:py-5">
        <button
          onClick={() => canPrev && setSlide((s) => s - 1)}
          disabled={!canPrev}
          className="btn-secondary px-4 py-2.5 text-xs sm:px-6 sm:py-3 sm:text-sm disabled:opacity-40"
        >
          <FiArrowLeft /> Previous
        </button>

        <div className="flex items-center gap-3">
          {Array.from({ length: total }).map((_, idx) => (
            <span key={idx} className={`h-2.5 w-2.5 rounded-full ${idx === slide ? "bg-amber-500" : "bg-zinc-700"}`} />
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => canNext && setSlide((s) => s + 1)}
            disabled={!canNext}
            className="btn-secondary px-4 py-2.5 text-xs sm:px-6 sm:py-3 sm:text-sm disabled:opacity-40"
          >
            Next <FiArrowRight />
          </button>
          <button onClick={onExit} className="text-base font-bold text-slate-100 hover:text-slate-300 sm:text-xl">
            Exit Boardroom
          </button>
        </div>
      </div>
    </div>
  );
}
