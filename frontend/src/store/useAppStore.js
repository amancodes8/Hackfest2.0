import { create } from "zustand";
import { persist } from "zustand/middleware";

export const PIPELINE_STEPS = [
  "Ingestion",
  "Classification",
  "Extraction",
  "Normalization",
  "Conflict Detection",
  "BRD Synthesis"
];

function buildHistoryItem({ sessionId, brd, sourceText, outputMode }) {
  const now = new Date();
  return {
    id: `${sessionId || "session"}-${now.getTime()}`,
    sessionId,
    title: `BRD Analysis ${now.toLocaleDateString()}`,
    content: brd,
    sourceText,
    outputMode,
    date: now.toISOString(),
    stats: {
      characters: sourceText.length,
      wordCount: brd.split(/\s+/).filter(Boolean).length,
      sectionCount: (brd.match(/^##\s+/gm) || []).length,
      riskMentions: (brd.match(/risk/gi) || []).length
    }
  };
}

const initialChat = [
  {
    role: "assistant",
    content:
      "I can answer context-aware BRD questions. Try: 'List unresolved conflicts' or 'Summarize risks for executives.'"
  }
];

const defaultGenerationOptions = {
  audience: "Product and Engineering Leadership",
  industry: "General Technology",
  tone: "Executive and precise",
  compliance: "Standard enterprise controls",
  includeTraceability: true,
  includeRaci: false,
  includeSuccessMetrics: true
};

export const useAppStore = create(
  persist(
    (set, get) => ({
      started: false,
      boardroomMode: false,
      theme: "dark",
      activeTab: "workspace",
      outputMode: "standard",
      generationOptions: { ...defaultGenerationOptions },
      loading: false,
      error: "",
      sessionId: "",
      sourceText: "",
      progress: { stage: "Ingestion", percent: 0, status: "running" },
      brd: "",
      insightData: null,
      history: [],
      selectedHistoryId: "",
      polling: false,
      chatOpen: false,
      chatBusy: false,
      chatMessages: initialChat,
      demoMode: false,

      setStarted: (started) => set({ started }),
      toggleBoardroomMode: () =>
        set((state) => {
          const nextBoardroom = !state.boardroomMode;
          return {
            boardroomMode: nextBoardroom,
            theme: nextBoardroom ? "dark" : state.theme
          };
        }),
      toggleTheme: () =>
        set((state) => ({
          boardroomMode: false,
          theme: state.theme === "dark" ? "light" : "dark"
        })),
      setActiveTab: (activeTab) => set({ activeTab }),
      setOutputMode: (outputMode) => set({ outputMode }),
      setGenerationOption: (key, value) =>
        set((state) => ({
          generationOptions: {
            ...state.generationOptions,
            [key]: value
          }
        })),
      resetGenerationOptions: () => set({ generationOptions: { ...defaultGenerationOptions } }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setSessionId: (sessionId) => set({ sessionId }),
      setSourceText: (sourceText) => set({ sourceText }),
      setProgress: (progress) => set({ progress }),
      setInsightData: (insightData) => set({ insightData }),
      setPolling: (polling) => set({ polling }),
      toggleChat: () => set((state) => ({ chatOpen: !state.chatOpen })),
      setChatBusy: (chatBusy) => set({ chatBusy }),
      pushChatMessage: (message) => set((state) => ({ chatMessages: [...state.chatMessages, message] })),
      resetChat: () => set({ chatMessages: initialChat }),
      toggleDemoMode: () => set((state) => ({ demoMode: !state.demoMode })),

      setBrd: (brd) => {
        set({ brd });
        if (!brd.trim()) return;

        const state = get();
        const entry = buildHistoryItem({
          sessionId: state.sessionId,
          brd,
          sourceText: state.sourceText,
          outputMode: state.outputMode
        });

        set((current) => ({
          history: [entry, ...current.history].slice(0, 40),
          selectedHistoryId: entry.id
        }));
      },

      openHistoryItem: (id) => {
        const item = get().history.find((entry) => entry.id === id);
        if (!item) return;

        set({
          selectedHistoryId: id,
          brd: item.content,
          sourceText: item.sourceText,
          sessionId: item.sessionId || "",
          activeTab: "history",
          insightData: null
        });
      },

      deleteHistoryItem: (id) => {
        set((state) => {
          const next = state.history.filter((entry) => entry.id !== id);
          return {
            history: next,
            selectedHistoryId: state.selectedHistoryId === id ? (next[0]?.id || "") : state.selectedHistoryId
          };
        });
      },

      resetSession: () =>
        set({
          sessionId: "",
          brd: "",
          sourceText: "",
          progress: { stage: "Ingestion", percent: 0, status: "running" },
          insightData: null,
          error: "",
          polling: false,
          chatMessages: initialChat
        })
    }),
    {
      name: "brd-intelligence-storage",
      partialize: (state) => ({
        started: state.started,
        boardroomMode: state.boardroomMode,
        theme: state.theme,
        outputMode: state.outputMode,
        generationOptions: state.generationOptions,
        history: state.history,
        selectedHistoryId: state.selectedHistoryId,
          activeTab: state.activeTab
          ,
          demoMode: state.demoMode
      })
    }
  )
);
