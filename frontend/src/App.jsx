import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiCheckCircle, FiMenu, FiMoon, FiPlayCircle, FiSun } from "react-icons/fi";
import LandingHero from "./components/LandingHero";
import Sidebar from "./components/Sidebar";
import HistoryPage from "./pages/HistoryPage";
import InsightsPage from "./pages/InsightsPage";
import BoardroomPage from "./pages/BoardroomPage";
import { useAppStore } from "./store/useAppStore";
import StrategyLab from "./pages/WorkspacePage";

export default function App() {
  const {
    started,
    setStarted,
    activeTab,
    setActiveTab,
    theme,
    toggleTheme,
    boardroomMode,
    toggleBoardroomMode,
    demoMode,
    toggleDemoMode,
    sourceText,
    brd
  } =
    useAppStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    document.documentElement.classList.remove("dark", "light", "boardroom");
    document.documentElement.classList.add(theme === "dark" ? "dark" : "light");
    if (boardroomMode) {
      document.documentElement.classList.add("boardroom");
    }
  }, [theme, boardroomMode]);

  return (
    <div className="min-h-screen">
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="orb orb-a"
          animate={{ x: [0, 40, 0], y: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="orb orb-b"
          animate={{ x: [0, -30, 0], y: [0, 25, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
      <main className={`page-shell relative z-10 min-h-screen px-4 py-6 md:px-8 md:py-8 ${boardroomMode ? "boardroom-shell" : ""}`}>
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`mb-6 flex items-center justify-between border-b px-1 pb-4 md:pb-6 ${
            boardroomMode
              ? "rounded-2xl border-[#525252] bg-gradient-to-r from-[#0d0d0d] via-[#121212] to-[#171717] px-4 pt-4 shadow-[0_20px_45px_rgba(8,5,20,0.5)]"
              : "border-[#2f2f2f]"
          }`}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#d97706]">PREFLIGHT</p>
            <h1 className="text-2xl font-extrabold text-slate-100 md:text-3xl">Pre-Execution Analysis System</h1>
            <p className="mt-1 text-sm text-slate-400">v1.0 | Decision Layer Active</p>
            {boardroomMode ? (
              <span className="mt-2 inline-flex rounded-full border border-[#525252] bg-[#171717] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.13em] text-[#f59e0b]">
                Boardroom Mode Active
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="interactive-tile rounded-xl border border-[#525252] bg-[#171717] p-2.5 text-slate-200 transition hover:scale-105"
              title="Toggle theme"
            >
              {theme === "dark" ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>
            {started ? (
              <button
                onClick={() => setSidebarOpen(true)}
                className="interactive-tile rounded-xl border border-[#525252] bg-[#171717] p-2.5 text-slate-200 lg:hidden"
              >
                <FiMenu size={18} />
              </button>
            ) : null}
            <button
              className="btn-secondary hidden md:inline-flex"
              onClick={() => {
                toggleBoardroomMode();
              }}
            >
              {boardroomMode ? "Exit Boardroom Mode" : "Enter Boardroom Mode"}
            </button>
            <button className="btn-secondary hidden md:inline-flex" onClick={toggleDemoMode}>
              <FiPlayCircle />
              {demoMode ? "Exit Demo Script" : "Demo Script"}
            </button>
          </div>
        </motion.header>

        {!started ? (
          <LandingHero onStart={() => setStarted(true)} />
        ) : boardroomMode ? (
          <BoardroomPage onExit={toggleBoardroomMode} />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <Sidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              isOpen={sidebarOpen}
              closeSidebar={() => setSidebarOpen(false)}
            />

            <section className="min-h-[80vh]">
              <AnimatePresence mode="wait">
                {activeTab === "workspace" ? (
                  <motion.div
                    key="workspace"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.28 }}
                  >
                    <StrategyLab />
                  </motion.div>
                ) : null}

                {activeTab === "insights" ? (
                  <motion.div
                    key="insights"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.28 }}
                  >
                    <InsightsPage />
                  </motion.div>
                ) : null}

                {activeTab === "history" ? (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.28 }}
                  >
                    <HistoryPage />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </section>
          </div>
        )}

        {started && demoMode ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-5 left-5 z-40 w-[min(420px,calc(100vw-2.5rem))] rounded-2xl border border-[#525252] bg-[#101010]/95 p-4 shadow-[0_20px_45px_rgba(0,0,0,0.55)] backdrop-blur"
          >
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#d97706]">Demo Script</p>
            <h3 className="mt-1 text-lg font-extrabold text-slate-100">Guided Demo Flow</h3>
            <div className="mt-3 space-y-2 text-sm">
              <DemoStep
                done={Boolean(sourceText.trim())}
                label="Step 1: Ingest sample communications in Workspace."
                onClick={() => setActiveTab("workspace")}
              />
              <DemoStep
                done={Boolean(brd.trim())}
                label="Step 2: Run AI pipeline and generate BRD."
                onClick={() => setActiveTab("workspace")}
              />
              <DemoStep
                done={Boolean(brd.trim())}
                label="Step 3: Open Insights and run Scenario War Room."
                onClick={() => setActiveTab("insights")}
              />
              <DemoStep
                done={Boolean(brd.trim())}
                label="Step 4: Show Executive Brief + Evidence links in BRD."
                onClick={() => setActiveTab("workspace")}
              />
            </div>
          </motion.div>
        ) : null}
      </main>
    </div>
  );
}

function DemoStep({ done, label, onClick }) {
  return (
    <button onClick={onClick} className="flex w-full items-start gap-2 rounded-xl border border-[#404040] bg-[#171717] px-3 py-2 text-left transition hover:bg-[#1f1f1f]">
      <FiCheckCircle className={done ? "mt-0.5 text-emerald-300" : "mt-0.5 text-slate-500"} />
      <span className={done ? "text-slate-100" : "text-slate-300"}>{label}</span>
    </button>
  );
}
