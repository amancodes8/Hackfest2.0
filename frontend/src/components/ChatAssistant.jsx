import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSend, FiMessageSquare, FiMinimize2 } from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatAssistant({ open, busy, onToggle, onSend, messages }) {
  const [text, setText] = useState("");
  const suggestions = [
    "Summarize top risks for executives",
    "List unresolved conflicts with mitigation",
    "Rewrite functional requirements clearly",
    "What assumptions can break this plan?"
  ];

  const handleSend = () => {
    const message = text.trim();
    if (!message || busy) return;
    onSend(message);
    setText("");
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[calc(100%-2rem)] max-w-md md:bottom-8 md:right-8">
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            className="mb-3 flex h-[72vh] max-h-[560px] flex-col overflow-hidden rounded-[1.5rem] border border-[#404040] bg-[#101010] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#2f2f2f] bg-[#0d0d0d] px-5 py-3 text-white">
              <span className="text-sm font-bold text-[#bfdbfe]">BRD Assistant</span>
              <button onClick={onToggle} className="rounded-lg p-1 text-[#93c5fd] hover:bg-white/10">
                <FiMinimize2 size={16} />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => !busy && onSend(suggestion)}
                    className="rounded-full border border-[#525252] bg-[#1f1f1f] px-2.5 py-1 text-[11px] font-semibold text-slate-300 transition hover:border-[#a3a3a3] hover:text-slate-100"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
              {messages.map((item, idx) => (
                <div key={`${item.role}-${idx}`} className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-7 ${
                      item.role === "user"
                        ? "bg-gradient-to-r from-[#d97706] to-[#b45309] text-white"
                        : "border border-[#404040] bg-[#171717] text-slate-200"
                    }`}
                  >
                    {item.role === "assistant" ? (
                      <div className="chat-markdown text-[14px] leading-7">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{item.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {busy ? <div className="skeleton h-9 w-24 rounded-xl" /> : null}
            </div>

            <div className="border-t border-[#2f2f2f] p-3">
              <div className="relative">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask: summarize top risks"
                  className="w-full rounded-xl border border-[#404040] bg-[#121212] py-2.5 pl-3 pr-11 text-sm text-slate-100 outline-none focus:border-[#f59e0b]"
                />
                <button
                  onClick={handleSend}
                  disabled={busy || !text.trim()}
                  className="absolute right-1.5 top-1.5 rounded-lg border border-[#2563eb] bg-gradient-to-r from-[#2563eb] to-[#38bdf8] p-2 text-white shadow-[0_0_18px_rgba(56,189,248,0.45)] disabled:opacity-50"
                >
                  <FiSend size={13} />
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <button
        onClick={onToggle}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#2563eb] bg-gradient-to-r from-[#2563eb] to-[#38bdf8] text-white shadow-[0_0_24px_rgba(56,189,248,0.55)] transition hover:scale-105"
      >
        <FiMessageSquare size={22} />
      </button>
    </div>
  );
}
