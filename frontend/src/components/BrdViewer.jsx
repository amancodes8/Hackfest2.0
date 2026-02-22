import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FiCopy, FiDownload, FiFileText, FiLink2 } from "react-icons/fi";

function toAnchor(text = "") {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
}

function extractText(node) {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node && typeof node === "object" && "props" in node) return extractText(node.props?.children);
  return "";
}

function parseSections(markdown) {
  const lines = markdown.split("\n");
  const sections = [];
  let current = null;

  for (const line of lines) {
    if (/^##\s+/.test(line)) {
      const heading = line.replace(/^##\s+/, "").trim();
      current = { heading, content: `${line}\n` };
      sections.push(current);
      continue;
    }

    if (!current) {
      current = { heading: "Executive Summary", content: "" };
      sections.push(current);
    }

    current.content += `${line}\n`;
  }

  return sections.filter((item) => item.heading && item.content.trim());
}

function findByKeywords(sections, keywords) {
  const lower = keywords.map((item) => item.toLowerCase());
  return sections.find((section) => lower.some((word) => section.heading.toLowerCase().includes(word)));
}

export default function BrdViewer({ brd, insightData }) {
  const sections = useMemo(() => parseSections(brd), [brd]);
  const headings = sections.map((item) => item.heading);
  const brief = insightData?.executive_brief || null;
  const evidence = insightData?.evidence || [];

  const executiveBriefMarkdown = useMemo(() => {
    if (!brief) return "";
    return `## Executive Brief

**Decision:** ${brief.decision}  
**Quality Score:** ${brief.quality_score}/100  
**Delivery Confidence:** ${brief.delivery_confidence}/100  
**Risk Score:** ${brief.risk_score}/100  
**Timeline Health:** ${brief.timeline_health}/100

### Decision Summary
${brief.summary}

### Top Risks
${(brief.top_risks || []).map((item) => `- ${item}`).join("\n")}

### Budget Outlook
${brief.budget_outlook}

### Recommendation
${brief.recommendation}
`;
  }, [brief]);

  const tabs = useMemo(() => {
    const picks = [
      { key: "all", label: "Full Document", content: brd },
      { key: "execbrief", label: "Executive Brief", content: executiveBriefMarkdown },
      { key: "summary", label: "Summary", section: findByKeywords(sections, ["executive summary", "business objectives"]) },
      { key: "functional", label: "Functional", section: findByKeywords(sections, ["functional requirements"]) },
      { key: "nonfunctional", label: "Non-Functional", section: findByKeywords(sections, ["non-functional", "non functional"]) },
      { key: "timeline", label: "Timeline", section: findByKeywords(sections, ["timeline", "milestones"]) },
      { key: "risks", label: "Risks", section: findByKeywords(sections, ["risks", "risk"]) },
      { key: "conflicts", label: "Conflicts", section: findByKeywords(sections, ["conflict"]) },
      { key: "questions", label: "Open Questions", section: findByKeywords(sections, ["open questions"]) }
    ];

    return picks
      .map((item) => ({
        key: item.key,
        label: item.label,
        content: item.content || item.section?.content || ""
      }))
      .filter((item) => item.key === "all" || item.content.trim());
  }, [brd, sections, executiveBriefMarkdown]);

  const [activeTab, setActiveTab] = useState("all");
  useEffect(() => {
    if (!tabs.some((tab) => tab.key === activeTab)) {
      setActiveTab("all");
    }
  }, [tabs, activeTab]);

  const activeContent = tabs.find((tab) => tab.key === activeTab)?.content || brd;
  const words = brd.split(/\s+/).filter(Boolean).length;

  function download() {
    const blob = new Blob([brd], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `BRD-${Date.now()}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function copy() {
    navigator.clipboard.writeText(activeContent);
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-8 card p-4">
          <h4 className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">Document Map</h4>
          <nav className="space-y-1.5 text-sm">
            {headings.map((heading, idx) => (
              <a
                key={heading}
                href={`#${toAnchor(heading)}`}
                className="block rounded-lg px-2 py-1.5 text-slate-300 transition hover:bg-[#102040] hover:text-[#b6c6ff]"
              >
                <span className="mr-2 text-xs text-slate-400">{idx + 1}.</span>
                {heading}
              </a>
            ))}
          </nav>
        </div>
      </aside>

      <article className="doc-surface">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#1f3054] pb-5">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-extrabold text-slate-100">
              <FiFileText className="text-[#88a0ff]" />
              Document Preview
            </h2>
            <p className="mt-1 text-sm text-slate-400">Switch tabs to focus quickly on Risks, Timeline, Conflicts, and other key sections.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="badge-soft">{headings.length} sections</span>
            <span className="badge-soft">{words.toLocaleString()} words</span>
            <button onClick={copy} className="btn-secondary">
              <FiCopy /> Copy Tab
            </button>
            <button onClick={download} className="btn-primary">
              <FiDownload /> Export MD
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                activeTab === tab.key
                  ? "bg-gradient-to-r from-[#5f72ff] to-[#7c4dff] text-white"
                  : "border border-[#2b3f69] bg-[#0b162d] text-slate-300 hover:bg-[#102040]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="doc-preview">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h2: ({ children }) => {
                const raw = extractText(children);
                return <h2 id={toAnchor(raw)}>{children}</h2>;
              }
            }}
          >
            {activeContent}
          </ReactMarkdown>
        </div>

        {evidence.length ? (
          <div className="mt-8 border-t border-[#1f3054] pt-6">
            <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-100">
              <FiLink2 className="text-[#8ea6ff]" />
              Source Evidence Links
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {evidence.map((group) => (
                <div key={group.section} className="rounded-xl border border-[#22355b] bg-[#091226] p-3">
                  <p className="mb-2 text-sm font-semibold text-slate-200">{group.section}</p>
                  <div className="space-y-2">
                    {(group.items || []).slice(0, 3).map((item, index) => (
                      <div key={`${group.section}-${index}`} className="rounded-lg border border-[#22355b] bg-[#0c1a34] p-2">
                        <p className="text-xs text-slate-300">{item.claim}</p>
                        <p className="mt-1 text-xs text-slate-400">“{item.snippet}”</p>
                        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                          <span>{item.source_label} ({item.source})</span>
                          <span>{item.confidence}% confidence</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </article>
    </motion.div>
  );
}
