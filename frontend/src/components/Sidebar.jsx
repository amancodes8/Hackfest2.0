import { motion } from "framer-motion";
import { useAppStore } from "../store/useAppStore";
import { FiCpu, FiClock, FiPlus, FiChevronRight, FiBarChart2, FiX } from "react-icons/fi";

export default function Sidebar({ activeTab, setActiveTab, isOpen, closeSidebar }) {
  const { history, resetSession } = useAppStore();

  const navItems = [
    { id: "workspace", label: "Strategy Lab", icon: FiCpu },
    { id: "insights", label: "Risk Intelligence", icon: FiBarChart2 },
    { id: "history", label: "Decision Archive", icon: FiClock }
  ];

  return (
    <>
      {isOpen ? <button className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={closeSidebar} /> : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 transform border-r border-[#2f2f2f] bg-[#0d0d0d]/95 p-6 backdrop-blur-xl transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-zinc-500 to-zinc-700" />
            <div>
              <h2 className="text-lg font-extrabold tracking-tight text-slate-100">PREFLIGHT</h2>
              <p className="text-[11px] text-slate-400">Pre-Execution Analysis System</p>
            </div>
          </div>
          <button onClick={closeSidebar} className="rounded-lg p-1 text-slate-300 lg:hidden">
            <FiX size={18} />
          </button>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setActiveTab(item.id);
                closeSidebar();
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                activeTab === item.id
                  ? "border border-[#737373] bg-[#1f1f1f] text-[#f59e0b]"
                  : "text-slate-300 hover:bg-[#1f1f1f] hover:text-slate-100"
              }`}
            >
              <item.icon className="text-lg" />
              {item.label}
            </motion.button>
          ))}
        </nav>

        <div className="mt-8">
          <h3 className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Recent BRDs</h3>
          <div className="mt-3 space-y-1.5">
            {history.slice(0, 6).map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab("history");
                  closeSidebar();
                }}
                className="group flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs text-slate-300 transition hover:bg-[#1f1f1f]"
              >
                <span className="truncate">{item.title}</span>
                <FiChevronRight className="opacity-0 transition group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => {
            resetSession();
            setActiveTab("workspace");
            closeSidebar();
          }}
          className="btn-primary absolute bottom-8 left-6 right-6"
        >
          <FiPlus /> New Session
        </button>
      </aside>
    </>
  );
}
