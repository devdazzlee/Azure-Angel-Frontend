import React from "react";
import { motion } from "framer-motion";

interface BusinessPlanImportPromptProps {
  onUpload: () => void;
  onPaste: () => void;
  onDismiss: () => void;
}

const BusinessPlanImportPrompt: React.FC<BusinessPlanImportPromptProps> = ({
  onUpload,
  onPaste,
  onDismiss,
}) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/70 backdrop-blur">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 24 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-[0_40px_120px_-40px_rgba(79,70,229,0.32)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(129,140,248,0.18),transparent)]" />

        <div className="relative grid gap-0 md:grid-cols-[1.35fr_1fr]">
          <div className="flex flex-col gap-8 p-8 md:p-12">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-indigo-100/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600">
                📄 Already prepared?
              </span>
              <h2 className="mt-4 text-3xl font-black leading-snug text-slate-900 md:text-4xl">
                Upload or paste your business plan before the Business Planning phase begins.
              </h2>
              <p className="mt-3 text-base leading-relaxed text-slate-600">
                Angel will scan the plan you provide, auto-fill every matching answer, and only ask questions for anything still uncovered—saving you time and keeping the conversation focused.
              </p>
            </div>

            <div className="space-y-3 text-sm text-slate-600">
              {[
                {
                  icon: "🔍",
                  title: "Intelligent extraction",
                  description: "Angel maps your existing content to each Business Plan section automatically.",
                },
                {
                  icon: "⚡",
                  title: "Skip retyping",
                  description: "We’ll only ask you about gaps—no duplicate data entry or repetitive answers.",
                },
                {
                  icon: "🛡️",
                  title: "Secure handling",
                  description: "Your upload is processed instantly and used solely to prepare your personalized roadmap.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-4 rounded-2xl border border-indigo-100 bg-white/70 p-4 shadow-sm transition-all duration-300 hover:border-indigo-200 hover:shadow-md"
                >
                  <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-lg text-indigo-600">
                    {item.icon}
                  </span>
                  <div>
                    <p className="text-base font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-slate-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={onUpload}
                className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 px-7 py-4 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <span className="text-xl">⬆️</span>
                Upload document
              </button>
              <button
                onClick={onPaste}
                className="inline-flex items-center justify-center gap-3 rounded-2xl border border-indigo-200 bg-white/80 px-7 py-4 text-base font-semibold text-indigo-600 shadow-sm transition-all hover:border-indigo-300 hover:text-indigo-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <span className="text-xl">📋</span>
                Paste plan text
              </button>
              <button
                onClick={onDismiss}
                className="ml-auto inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-4 py-2 text-sm font-medium text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                Not right now
              </button>
            </div>
            <p className="text-sm text-slate-500">
              You can always upload later from your quick actions if you’d rather continue answering manually.
            </p>
          </div>

          <div className="relative hidden md:flex flex-col justify-between bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 p-10 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.22),transparent)] opacity-70" />
            <div className="relative space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white">
                Head start mode
              </div>
              <h3 className="text-3xl font-semibold leading-tight">
                Save 15–20 minutes by letting Angel pre-populate this phase for you.
              </h3>
              <p className="text-sm text-white/80">
                Angel highlights anything still needing your voice before generating your research-backed launch roadmap.
              </p>
            </div>
            <div className="relative mt-8 rounded-2xl bg-white/15 p-6 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
                Works seamlessly with
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-medium text-white">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1">
                  <span className="text-base">📄</span> PDF
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1">
                  <span className="text-base">📝</span> Word
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1">
                  <span className="text-base">📃</span> Text
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BusinessPlanImportPrompt;

