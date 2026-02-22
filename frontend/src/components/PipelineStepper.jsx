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
        <span className="text-2xl font-black text-[#f59e0b]">{progress.percent}%</span>
      </div>

      <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-800/70">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
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
            <div key={step} className="flex items-center gap-3 rounded-xl border border-transparent px-2 py-2 transition hover:border-[#404040] hover:bg-[#1f1f1f]">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] ${
                  done
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : active
                      ? "border-amber-500 bg-amber-500 text-white"
                      : "border-slate-600 text-slate-400"
                }`}
              >
                {done ? <FiCheck size={12} /> : active ? <FiLoader size={12} className="animate-spin" /> : idx + 1}
              </div>
              <span className={`text-xs font-semibold ${done ? "text-emerald-300" : active ? "text-amber-300" : "text-slate-400"}`}>
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
