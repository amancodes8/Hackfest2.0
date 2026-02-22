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
            className="mb-3 flex h-[72vh] max-h-[560px] flex-col overflow-hidden rounded-[1.5rem] border border-[#23375d] bg-[#070f20] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#1e2f52] bg-[#050d1c] px-5 py-3 text-white">
              <span className="text-sm font-bold">BRD Assistant</span>
              <button onClick={onToggle} className="rounded-lg p-1 hover:bg-white/10">
                <FiMinimize2 size={16} />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => !busy && onSend(suggestion)}
                    className="rounded-full border border-[#2d4270] bg-[#0c1a34] px-2.5 py-1 text-[11px] font-semibold text-slate-300 transition hover:border-[#4e68a5] hover:text-slate-100"
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
                        ? "bg-gradient-to-r from-[#5f72ff] to-[#7c4dff] text-white"
                        : "border border-[#23375d] bg-[#0b162d] text-slate-200"
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

            <div className="border-t border-[#1e2f52] p-3">
              <div className="relative">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask: summarize top risks"
                  className="w-full rounded-xl border border-[#28406c] bg-[#08152d] py-2.5 pl-3 pr-11 text-sm text-slate-100 outline-none focus:border-[#6d8dff]"
                />
                <button
                  onClick={handleSend}
                  disabled={busy || !text.trim()}
                  className="absolute right-1.5 top-1.5 rounded-lg bg-gradient-to-r from-[#5f72ff] to-[#7c4dff] p-2 text-white disabled:opacity-50"
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
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#5f72ff] to-[#7c4dff] text-white shadow-2xl transition hover:scale-105"
      >
        <FiMessageSquare size={22} />
      </button>
    </div>
  );
}
