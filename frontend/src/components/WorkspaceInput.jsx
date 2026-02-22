import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { FiUploadCloud } from "react-icons/fi";

export default function WorkspaceInput({
  sourceText,
  onChangeText,
  onSubmitText,
  onUploadFile,
  loading,
  sessionId
}) {
  const fileRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 py-2">
        <div>
          <h2 className="section-title text-xl">Data Ingestion</h2>
          <p className="mt-1 text-xs text-slate-400">Session ID: <span className="font-mono">{sessionId || "initializing"}</span></p>
        </div>
        <span className="badge-soft">Context-aware parsing</span>
      </div>

      <div className="space-y-4 pt-3">
        <textarea
          value={sourceText}
          onChange={(e) => onChangeText(e.target.value)}
          placeholder="Paste emails, chat logs, meeting transcripts, and project notes..."
          className="h-72 w-full resize-none rounded-2xl border border-[#404040] bg-[#121212] p-5 text-sm leading-7 text-slate-100 outline-none transition focus:border-[#f59e0b]"
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {sourceText.length.toLocaleString()} characters
          </p>
          <button onClick={onSubmitText} disabled={loading || !sourceText.trim()} className="btn-primary">
            Save Input
          </button>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            onUploadFile(e.dataTransfer.files?.[0]);
          }}
          className={`rounded-3xl border-2 border-dashed px-6 py-10 text-center transition ${
            dragging ? "border-amber-500 bg-[#1f1f1f]" : "border-slate-800/90 bg-[#121212]"
          }`}
        >
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#121212] text-slate-500 shadow-sm">
            <FiUploadCloud size={22} />
          </div>
          <p className="text-sm font-bold text-slate-100">Drop source files here</p>
          <p className="mb-4 mt-1 text-xs text-slate-400">Accepted: .txt, .md, .csv</p>
          <button onClick={() => fileRef.current?.click()} className="btn-secondary">
            Browse Files
          </button>
          <input ref={fileRef} type="file" hidden accept=".txt,.md,.csv" onChange={(e) => onUploadFile(e.target.files?.[0])} />
        </div>
      </div>
    </motion.section>
  );
}
