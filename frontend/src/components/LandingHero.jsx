import { motion } from "framer-motion";

export default function LandingHero({ onStart }) {
  return (
    <section className="neon-panel interactive-tile relative overflow-hidden rounded-3xl p-8 md:p-12">
      <div className="pointer-events-none absolute -left-28 top-0 h-72 w-72 rounded-full bg-[#b45309]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-[#a16207]/20 blur-3xl" />
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10"
      >
        <p className="mb-3 inline-flex rounded-full border border-[#525252] bg-[#171717]/90 px-3 py-1 text-xs font-bold text-[#f59e0b]">
          PREFLIGHT
        </p>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
          Pre-Execution Analysis System
        </p>
        <h1 className="max-w-3xl text-4xl font-extrabold leading-tight text-slate-100 md:text-5xl">
          Turn business chaos into a clear execution blueprint
        </h1>
        <p className="mt-4 max-w-2xl text-base text-slate-300 md:text-lg">
          v1.0 | Decision Layer Active. Convert emails, chats, transcripts, and project notes into boardroom-grade BRDs with conflict intelligence and strategic analytics.
        </p>
        <div className="mt-6 grid gap-3 text-sm text-slate-200 md:grid-cols-3">
          <div className="rounded-xl border border-[#404040] bg-[#171717]/90 px-3 py-2">Requirement Extraction</div>
          <div className="rounded-xl border border-[#404040] bg-[#171717]/90 px-3 py-2">Conflict Detection</div>
          <div className="rounded-xl border border-[#404040] bg-[#171717]/90 px-3 py-2">Executive BRD Synthesis</div>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={onStart}
            className="btn-primary px-6 py-3"
          >
            Start Workspace
          </button>
          <div className="rounded-xl border border-[#404040] bg-[#171717]/90 px-4 py-3 text-sm font-medium text-slate-300">
            Real pipeline: ingestion → extraction → synthesis
          </div>
        </div>
      </motion.div>
    </section>
  );
}
