import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { FiClock, FiDownload, FiFileText, FiSearch, FiTrash2 } from "react-icons/fi";
import { useAppStore } from "../store/useAppStore";

function downloadDoc(item) {
  const blob = new Blob([item.content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${item.title.replace(/\s+/g, "-").toLowerCase()}.md`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function HistoryPage() {
  const { history, openHistoryItem, deleteHistoryItem } = useAppStore();
  const [query, setQuery] = useState("");

  const filteredHistory = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return history;

    return history.filter((doc) => {
      const dateLabel = new Date(doc.date).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric"
      }).toLowerCase();

      const haystack = [
        doc.title,
        doc.outputMode,
        doc.sessionId,
        doc.content?.slice(0, 2000),
        dateLabel
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(keyword);
    });
  }, [history, query]);

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-[#22355b] bg-[#0a152b] text-slate-400">
          <FiClock size={40} />
        </div>
        <h3 className="text-xl font-bold text-slate-100">Archive is empty</h3>
        <p className="mt-2 text-slate-400">Generated BRDs will appear here automatically after each completed run.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-12">
      <div className="card p-5">
        <h2 className="text-xl font-bold text-slate-100">Saved BRD History</h2>
        <p className="mt-1 text-sm text-slate-400">Open any past analysis, export markdown, or remove outdated snapshots.</p>
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#24385f] bg-[#0a162d] px-3 py-2">
          <FiSearch className="text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by date, title, session, mode, or BRD content..."
            className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredHistory.map((doc, index) => (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="card interactive-tile group relative p-5"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-[#2a4680] bg-[#10254a] text-[#a6b8ff]">
              <FiFileText size={22} />
            </div>

            <h3 className="truncate text-base font-bold text-slate-100">{doc.title}</h3>
            <p className="mt-1 text-xs font-medium text-slate-400">
              {new Date(doc.date).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric"
              })}
            </p>
            <div className="mt-2 inline-flex rounded-full border border-[#2d4270] bg-[#0b162d] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-300">
              {doc.outputMode || "standard"}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-300">
              <div className="rounded-lg border border-[#22355b] bg-[#0b162d] p-2">Words: {doc.stats?.wordCount || 0}</div>
              <div className="rounded-lg border border-[#22355b] bg-[#0b162d] p-2">Risks: {doc.stats?.riskMentions || 0}</div>
            </div>

            <div className="mt-5 flex gap-2">
              <button onClick={() => openHistoryItem(doc.id)} className="btn-primary flex-1 py-2.5 text-xs">
                Open
              </button>
              <button onClick={() => downloadDoc(doc)} className="btn-ghost px-3" aria-label="Download">
                <FiDownload size={16} />
              </button>
              <button
                onClick={() => deleteHistoryItem(doc.id)}
                className="btn-ghost px-3 hover:bg-red-500/15 hover:text-red-300"
                aria-label="Delete"
              >
                <FiTrash2 size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
      {filteredHistory.length === 0 ? (
        <div className="rounded-2xl border border-[#23375d] bg-[#081226] p-5 text-sm text-slate-400">
          No history items match this search query.
        </div>
      ) : null}
    </div>
  );
}
