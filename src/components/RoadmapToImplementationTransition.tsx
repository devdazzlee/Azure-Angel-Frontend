import React from 'react';
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Loader2,
  Map,
  Rocket,
  Sparkles,
  Target,
} from 'lucide-react';
import { displayBusinessNameFromApi } from '@/utils/businessName';

const HELP_ITEMS = [
  {
    title: 'Advice & Tips',
    description: 'Focused, practical insights to guide every action.',
    icon: Target,
    card: 'border-indigo-200/80 bg-gradient-to-br from-indigo-50 to-white',
    badge: 'bg-indigo-100 text-indigo-800',
  },
  {
    title: 'Kickstart',
    description: 'Angel can draft parts of tasks for you: outreach emails, checklists, and more.',
    icon: Sparkles,
    card: 'border-violet-200/80 bg-gradient-to-br from-violet-50 to-white',
    badge: 'bg-violet-100 text-violet-800',
  },
  {
    title: 'Help',
    description: 'Detailed guidance whenever you hit a roadblock.',
    icon: CheckCircle2,
    card: 'border-teal-200/80 bg-gradient-to-br from-teal-50 to-white',
    badge: 'bg-teal-100 text-teal-800',
  },
  {
    title: 'Who do I contact?',
    description:
      'Recommendations for professionals or service providers that may help you complete steps of your implementation journey.',
    icon: Map,
    card: 'border-sky-200/80 bg-gradient-to-br from-sky-50 to-white',
    badge: 'bg-sky-100 text-sky-800',
  },
  {
    title: 'Dynamic Feedback',
    description: 'Angel flags incomplete or off-track work and helps you correct it quickly.',
    icon: Rocket,
    card: 'border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white',
    badge: 'bg-emerald-100 text-emerald-800',
  },
] as const;

const JOURNEY_STEPS = [
  { text: 'You started with an idea', done: true },
  { text: "You've built a comprehensive plan", done: true },
  { text: "You've created a detailed roadmap", done: true },
  { text: "Now we'll bring it all to life, step by step", current: true },
] as const;

interface RoadmapToImplementationTransitionProps {
  businessName: string;
  industry: string;
  location: string;
  onBeginImplementation: () => void;
  onBack: () => void;
  isStarting?: boolean;
  isPageLoading?: boolean;
}

function formatDisplayBusinessName(raw: string): string {
  return displayBusinessNameFromApi(raw) || 'your business';
}

const RoadmapToImplementationTransition: React.FC<RoadmapToImplementationTransitionProps> = ({
  businessName,
  industry,
  location,
  onBeginImplementation,
  onBack,
  isStarting = false,
  isPageLoading = false,
}) => {
  const displayBusinessName = formatDisplayBusinessName(businessName);
  const displayIndustry = industry.trim() || 'your industry';
  const displayLocation = location.trim() || 'your location';
  const busy = isPageLoading || isStarting;

  if (isPageLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-indigo-50/40 via-gray-50 to-teal-50/30">
        <header className="border-b border-indigo-100 bg-white/90 backdrop-blur-sm">
          <div className="mx-auto flex h-14 max-w-7xl items-center px-4 sm:px-6 lg:px-8" />
        </header>
        <div className="flex flex-1 items-center justify-center px-4">
          <div className="flex flex-col items-center gap-3 rounded-xl border border-indigo-100 bg-white px-8 py-6 shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" aria-hidden />
            <p className="text-sm font-medium text-indigo-900">Preparing your implementation workspace</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen min-w-0 flex-col overflow-x-hidden bg-gradient-to-b from-indigo-50/60 via-slate-50 to-teal-50/50">
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="absolute -left-32 top-24 h-96 w-96 rounded-full bg-indigo-200/25 blur-3xl" />
        <div className="absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-teal-200/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-64 w-[32rem] -translate-x-1/2 rounded-full bg-violet-200/20 blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-indigo-100/80 bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-teal-500" aria-hidden />
        <div className="mx-auto flex max-w-7xl min-w-0 items-center gap-3 px-4 py-3 sm:gap-6 sm:px-6 sm:py-4 lg:px-8">
          <button
            type="button"
            onClick={onBack}
            disabled={busy}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">Back to Roadmap</span>
            <span className="sm:hidden">Back</span>
          </button>
          <div className="hidden h-10 w-px shrink-0 bg-indigo-100 sm:block" aria-hidden />
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm sm:h-12 sm:w-12"
              aria-hidden
            >
              <Rocket className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-600 sm:text-xs">
                Founderport
              </p>
              <h1 className="truncate text-lg font-bold tracking-tight text-gray-900 sm:text-2xl">
                Implementation transition
              </h1>
              <p className="mt-0.5 hidden text-sm text-gray-500 sm:block">
                From roadmap to hands-on execution
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-7xl min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Hero banner — full width */}
        <section className="overflow-hidden rounded-2xl border border-indigo-200/60 bg-gradient-to-r from-indigo-600 via-violet-600 to-teal-600 p-6 text-white shadow-lg shadow-indigo-300/25 sm:p-8 md:p-10">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-start gap-4 md:max-w-2xl">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30 sm:h-16 sm:w-16"
                aria-hidden
              >
                <Award className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-100">
                  Milestone unlocked
                </p>
                <h2 className="mt-1 text-2xl font-bold sm:text-3xl">Ready for implementation</h2>
                <p className="mt-2 text-sm leading-relaxed text-indigo-50/95 sm:text-base">
                  Your launch roadmap is complete. The next step is hands-on execution with Angel,
                  one task at a time.
                </p>
              </div>
            </div>
            <div className="shrink-0 rounded-xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur-sm md:min-w-[220px]">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-100">
                Up next
              </p>
              <p className="mt-1 text-lg font-bold">Implementation</p>
              <p className="mt-2 text-sm text-indigo-50/90">Documentation, outreach, marketing, and more</p>
            </div>
          </div>
        </section>

        {/* Two-column body */}
        <div className="mt-6 grid gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-5 lg:col-span-8">
            <div className="rounded-2xl border border-indigo-100 bg-white/90 p-5 shadow-sm backdrop-blur-sm sm:p-6">
              <p className="text-base leading-relaxed text-gray-800 sm:text-lg">
                You reviewed your full launch roadmap: formation, operations, marketing, and launch.
                You are ready to bring{' '}
                <span className="font-semibold text-indigo-700">{displayBusinessName}</span> to life.
              </p>
              <p className="mt-4 rounded-xl border border-violet-100 bg-violet-50/60 px-4 py-3 text-sm leading-relaxed text-violet-950/90 sm:text-base">
                <span className="font-semibold text-violet-900">Next phase: Implementation.</span>{' '}
                We will work through your roadmap tasks one at a time with clear guidance at every
                step.
              </p>
            </div>

            <section className="rounded-2xl border border-indigo-100 bg-white/90 p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-violet-600" aria-hidden />
                    <h3 className="text-lg font-bold text-gray-900 sm:text-xl">How Angel helps</h3>
                  </div>
                  <p className="text-sm text-violet-700/90">What you can expect in this phase</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {HELP_ITEMS.map((item) => (
                  <div
                    key={item.title}
                    className={`rounded-xl border p-4 shadow-sm ${item.card}`}
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <span
                        className={`inline-flex rounded-lg p-2 ${item.badge}`}
                        aria-hidden
                      >
                        <item.icon className="h-4 w-4" />
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-semibold ${item.badge}`}
                      >
                        {item.title}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-gray-700">{item.description}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-5 lg:col-span-4">
            <div className="rounded-2xl border border-teal-200/80 bg-gradient-to-br from-teal-50/80 to-white p-5 shadow-sm sm:p-6">
              <h3 className="text-base font-bold text-teal-900 sm:text-lg">Your journey so far</h3>
              <ul className="mt-4 space-y-2">
                {JOURNEY_STEPS.map((step) => (
                  <li
                    key={step.text}
                    className={`flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm sm:text-base ${
                      step.current
                        ? 'bg-indigo-100 font-medium text-indigo-900 ring-1 ring-indigo-200/80'
                        : 'bg-white/60 text-gray-700'
                    }`}
                  >
                    <CheckCircle2
                      className={`mt-0.5 h-4 w-4 shrink-0 sm:h-5 sm:w-5 ${
                        step.current ? 'text-indigo-600' : 'text-emerald-600'
                      }`}
                      aria-hidden
                    />
                    <span>{step.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <section className="rounded-2xl border border-teal-200/80 bg-gradient-to-br from-white via-teal-50/50 to-indigo-50/40 p-5 shadow-md sm:p-6">
              <h3 className="text-base font-bold text-teal-900 sm:text-lg">Ready to begin?</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-700 sm:text-base">
                We will show you the first real-world action when you continue, and tackle it
                together.
              </p>
              <dl className="mt-4 space-y-2 rounded-xl bg-white/80 px-4 py-3 text-sm ring-1 ring-indigo-100/80">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                    Business
                  </dt>
                  <dd className="mt-0.5 font-semibold text-indigo-900 break-words">
                    {displayBusinessName}
                  </dd>
                </div>
                {displayIndustry !== 'your industry' && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-violet-600">
                      Industry
                    </dt>
                    <dd className="mt-0.5 text-violet-900 break-words">{displayIndustry}</dd>
                  </div>
                )}
                {displayLocation !== 'your location' && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-teal-600">
                      Location
                    </dt>
                    <dd className="mt-0.5 text-teal-900 break-words">{displayLocation}</dd>
                  </div>
                )}
              </dl>

              <button
                type="button"
                onClick={onBeginImplementation}
                disabled={busy}
                aria-busy={isStarting}
                className="mt-5 inline-flex min-h-[3rem] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-teal-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-300/30 transition-all hover:from-indigo-700 hover:via-violet-700 hover:to-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                    <span>Starting implementation</span>
                  </>
                ) : (
                  'Begin Implementation'
                )}
              </button>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default RoadmapToImplementationTransition;
