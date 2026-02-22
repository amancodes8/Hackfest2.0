import { motion } from "framer-motion";
import { PIPELINE_STEPS } from "../store/useAppStore";
import { FiCheck, FiLoader } from "react-icons/fi";

export default function PipelineStepper({ progress }) {
  const activeIndex = Math.max(0, PIPELINE_STEPS.findIndex((s) => s === progress.stage));

  return (
    <div className="neon-panel text-white">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h3 className="text-lg font-bold">Pipeline</h3>
          <p className="text-xs text-slate-400">Real-time synthesis progress</p>
        </div>
        <span className="text-2xl font-black text-[#9fb4ff]">{progress.percent}%</span>
      </div>

      <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-800/70">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
          initial={{ width: 0 }}
          animate={{ width: `${progress.percent}%` }}
          transition={{ duration: 0.35 }}
        />
      </div>

      <div className="space-y-2">
        {PIPELINE_STEPS.map((step, idx) => {
          const done = idx < activeIndex || progress.percent === 100;
          const active = step === progress.stage && progress.status === "running";

          return (
            <div key={step} className="flex items-center gap-3 rounded-xl border border-transparent px-2 py-2 transition hover:border-[#243a66] hover:bg-[#0d1931]">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] ${
                  done
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : active
                      ? "border-blue-500 bg-blue-500 text-white"
                      : "border-slate-600 text-slate-400"
                }`}
              >
                {done ? <FiCheck size={12} /> : active ? <FiLoader size={12} className="animate-spin" /> : idx + 1}
              </div>
              <span className={`text-xs font-semibold ${done ? "text-emerald-300" : active ? "text-blue-300" : "text-slate-400"}`}>
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
