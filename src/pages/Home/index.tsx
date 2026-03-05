import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

type Step = {
  number: string;
  title: string;
  description: string;
};

type FeatureCard = {
  icon: string;
  title: string;
  description: string;
};

const processSteps: Step[] = [
  {
    number: '1',
    title: 'Create Your Business Plan',
    description:
      'Answer structured questions about your business idea. Founderport organizes your thinking and consolidates your decisions in one place.',
  },
  {
    number: '2',
    title: 'Get Your Launch Roadmap',
    description:
      'Founderport converts your plan into a personalized roadmap with clear milestones, ordered in a logical sequence for your business.',
  },
  {
    number: '3',
    title: 'Follow Guided Steps',
    description:
      "Each milestone breaks down into smaller, actionable steps. You'll understand what to do, why it matters, and what to consider.",
  },
  {
    number: '4',
    title: 'Move Forward with Clarity',
    description:
      "You always know what's next. Founderport keeps you oriented and helps reduce uncertainty at each stage.",
  },
];

const featureCards: FeatureCard[] = [
  {
    icon: '📋',
    title: 'Structured Business Plan',
    description:
      'Create a comprehensive plan that organizes your thinking and consolidates your decisions as your reference point for next steps.',
  },
  {
    icon: '🗺️',
    title: 'Personalized Launch Roadmap',
    description:
      'Get a roadmap that breaks your launch into major milestones, ordered in a logical sequence that reflects your business type.',
  },
  {
    icon: '✅',
    title: 'Guided Implementation Steps',
    description:
      'Each milestone decomposes into smaller, actionable steps with clear explanations of what to do and why it matters.',
  },
  {
    icon: '🎯',
    title: 'Clear Sequencing',
    description:
      "Always know what comes next. Founderport removes uncertainty about which steps to tackle first and what applies to your situation.",
  },
  {
    icon: '💬',
    title: 'Guidance When You Need It',
    description:
      "When you're unsure, Founderport's support guidance helps clarify questions, explain options, and reduce confusion.",
  },
  {
    icon: '📁',
    title: 'Centralized Workspace',
    description:
      'One place to organize your business decisions, from initial concept through launch planning and execution.',
  },
];

const stepsContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const stepCard = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45 },
  },
};

const sectionReveal = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

const fadeStagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const fadeItem = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35 },
  },
};

const FounderportHome: React.FC = () => {
  const navigate = useNavigate();
  const isLoggedIn = Boolean(localStorage.getItem('sb_access_token'));

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const hashParams = new URLSearchParams(hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');
      const error = hashParams.get('error');
      const errorCode = hashParams.get('error_code');
      
      if ((accessToken && type === 'recovery') || error || errorCode) {
        navigate(`/reset-password${hash}`, { replace: true });
      }
    }
  }, [navigate]);

  const primaryCta = isLoggedIn ? '/ventures' : '/login';

  return (
    <div className="bg-slate-100 pt-20 text-slate-900">
      <motion.section
        className="w-full pb-10"
        variants={sectionReveal}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.25 }}
      >
        <div className="w-full bg-blue-700 px-5 py-12 text-white md:px-10">
          <motion.h1
            className="mx-auto max-w-4xl text-center text-3xl font-bold leading-tight md:text-5xl"
            variants={fadeItem}
          >
            Transform Your Business Idea Into a Clear, Actionable Plan
          </motion.h1>
          <motion.p className="mx-auto mt-5 max-w-4xl text-center text-base text-blue-100 md:text-lg" variants={fadeItem}>
            Founderport is a centralized platform that helps first-time entrepreneurs move from idea
            to launch through guided, step-by-step planning. Replace fragmented advice with clarity,
            structure, and confidence for any business idea.
          </motion.p>
          <motion.div className="mt-7 flex flex-wrap items-center justify-center gap-3" variants={fadeItem}>
            <Link
              to={primaryCta}
              className="rounded-md bg-white px-7 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              Start Planning Your Business
            </Link>
            <Link
              to="/services"
              className="rounded-md border border-white px-7 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              See How It Works
            </Link>
          </motion.div>

          <motion.div
            className="mt-10 grid grid-cols-1 gap-6 text-center sm:grid-cols-2 md:grid-cols-4"
            variants={fadeStagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
          >
            <motion.div variants={fadeItem}>
              <h3 className="text-3xl font-bold leading-tight sm:text-2xl">One Place</h3>
              <p className="mt-1.5 text-xl leading-snug text-blue-100 sm:text-base">For All Your Planning</p>
            </motion.div>
            <motion.div variants={fadeItem}>
              <h3 className="text-3xl font-bold leading-tight sm:text-2xl">Clear Steps</h3>
              <p className="mt-1.5 text-xl leading-snug text-blue-100 sm:text-base">Always Know What&apos;s Next</p>
            </motion.div>
            <motion.div variants={fadeItem}>
              <h3 className="text-3xl font-bold leading-tight sm:text-2xl">Guided Process</h3>
              <p className="mt-1.5 text-xl leading-snug text-blue-100 sm:text-base">Built for First-Time Entrepreneurs</p>
            </motion.div>
            <motion.div variants={fadeItem}>
              <h3 className="text-3xl font-bold leading-tight sm:text-2xl">Start Free</h3>
              <p className="mt-1.5 text-xl leading-snug text-blue-100 sm:text-base">No Credit Card Required</p>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        className="mx-auto w-full max-w-6xl px-4 pb-10"
        variants={sectionReveal}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.25 }}
      >
        <motion.h2 className="text-center text-3xl font-bold md:text-4xl" variants={fadeItem}>What Founderport Unlocks for You</motion.h2>
        <motion.div
          className="mt-6 grid gap-5 md:grid-cols-2"
          variants={fadeStagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.article
            variants={fadeItem}
            whileHover={{ y: -6 }}
            className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <h3 className="text-2xl font-bold text-slate-800">Common Challenges</h3>
            <ul className="mt-4 list-disc space-y-2.5 pl-5 text-base text-slate-600">
              <li>Advice scattered across websites, videos, and templates</li>
              <li>Unclear which steps come first</li>
              <li>No single place to organize your business decisions</li>
              <li>Decision paralysis from uncertainty</li>
              <li>Worry about doing things incorrectly</li>
            </ul>
          </motion.article>
          <motion.article
            variants={fadeItem}
            whileHover={{ y: -6 }}
            className="rounded-2xl border-2 border-emerald-400 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <h3 className="text-2xl font-bold text-slate-800">With Founderport</h3>
            <ul className="mt-4 space-y-2.5 text-base text-slate-700">
              <li>✓ Centralized workspace for all your planning</li>
              <li>✓ Clear sequence of steps tailored to your idea</li>
              <li>✓ Organized structure to capture your decisions</li>
              <li>✓ Guidance when you&apos;re unsure what to do next</li>
              <li>✓ Clarity and confidence at each stage</li>
            </ul>
          </motion.article>
        </motion.div>
      </motion.section>

      <motion.section
        className="mx-auto w-full max-w-6xl px-4 pb-10"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.45 }}
      >
        <h2 className="text-center text-3xl font-bold md:text-4xl">How Founderport Works</h2>
        <p className="mt-3 text-center text-base text-slate-500 md:text-lg">
          A guided, phased workflow that takes you from idea to structured plan to actionable steps
        </p>
              <motion.div
          className="mt-6 grid gap-5 overflow-visible md:grid-cols-2 xl:grid-cols-4 xl:gap-10"
          variants={stepsContainer}
                initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          {processSteps.map((step, index) => (
            <div key={step.number} className="relative overflow-visible">
              <motion.article
                variants={stepCard}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/80 p-6 text-center shadow-md transition-shadow duration-300 hover:shadow-xl"
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-200/40 blur-2xl" />
                  <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-indigo-200/40 blur-2xl" />
                </div>
                <div className="relative mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-md ring-4 ring-blue-100">
                  {step.number}
        </div>
                <h3 className="relative min-h-[5.5rem] text-2xl font-bold leading-tight text-slate-800">{step.title}</h3>
                <p className="relative mt-3 text-base leading-relaxed text-slate-600">{step.description}</p>
              </motion.article>
              {index < processSteps.length - 1 && (
                <span className="pointer-events-none absolute right-[-1.5rem] top-[56%] z-20 hidden -translate-y-1/2 rounded bg-slate-100 px-1 text-2xl font-bold text-blue-600 xl:block">
                  →
                </span>
          )}
        </div>
          ))}
        </motion.div>
      </motion.section>

      <motion.section
        className="mx-auto w-full max-w-6xl px-4 pb-10"
        variants={sectionReveal}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.25 }}
      >
        <motion.h2 className="text-center text-3xl font-bold md:text-4xl" variants={fadeItem}>What Founderport Provides</motion.h2>
        <motion.p className="mt-3 text-center text-base text-slate-500 md:text-lg" variants={fadeItem}>
          A centralized platform that brings clarity and structure to your entrepreneurial journey
        </motion.p>
            <motion.div
          className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3"
          variants={fadeStagger}
              initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          {featureCards.map((card) => (
            <motion.article
              key={card.title}
              variants={fadeItem}
              whileHover={{ y: -6, scale: 1.01 }}
              className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="text-2xl">{card.icon}</div>
              <h3 className="mt-3 text-xl font-bold text-slate-800">{card.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-slate-500">{card.description}</p>
            </motion.article>
          ))}
        </motion.div>
      </motion.section>

      <motion.section
        className="mx-auto w-full max-w-5xl px-4 pb-14"
        variants={sectionReveal}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.25 }}
      >
        <motion.div
          className="rounded-2xl bg-blue-700 px-6 py-10 text-center text-white"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.25 }}
        >
          <motion.h2 className="text-3xl font-bold md:text-4xl" variants={fadeItem}>Start Your Business Planning Journey</motion.h2>
          <motion.p className="mx-auto mt-3 max-w-3xl text-base text-blue-100 md:text-lg" variants={fadeItem}>
            Founderport provides the structure and guidance to help you move from idea to plan to action with clarity and confidence.
          </motion.p>
          <motion.div variants={fadeItem}>
            <Link
            to={primaryCta}
            className="mt-6 inline-block rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
          >
            Begin Planning Your Business
          </Link>
          </motion.div>
          <motion.p className="mt-5 text-sm text-blue-100" variants={fadeItem}>
            ✓ Start free, no credit card required &nbsp;&nbsp; ✓ Work at your own pace &nbsp;&nbsp; ✓ Always know what&apos;s next
          </motion.p>
        </motion.div>
      </motion.section>
    </div>
  );
};

export default FounderportHome;
