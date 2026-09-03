import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { getAccessToken } from '../../utils/tokenUtils';
import LandingCta from '../../components/landing/LandingCta';
import iconIsland from '../../assets/images/home/icon-island.png';
import iconCompass from '../../assets/images/home/icon-compass.png';
import iconLighthouse from '../../assets/images/home/icon-lighthouse.png';
import iconOars from '../../assets/images/home/icon-oars.png';

type Feature = {
  title: string;
  description: string;
  icon: string;
};

type Benefit = {
  title: string;
  description: string;
  stat: string;
};

const features: Feature[] = [
  {
    title: 'Guided business planning',
    description:
      'Get personalized guidance through every step of creating your business plan with Angel, your AI planning partner.',
    icon: iconCompass,
  },
  {
    title: 'Personalized launch roadmap',
    description:
      'Receive a customized launch roadmap with clear milestones tailored to your business type and stage.',
    icon: iconLighthouse,
  },
  {
    title: 'Step-by-step implementation',
    description:
      'Follow guided tasks broken into manageable actions — making the startup process clearer and less overwhelming.',
    icon: iconOars,
  },
  {
    title: 'Expert knowledge when you need it',
    description:
      'Access guidance across regulatory, financial, marketing, and operational aspects of starting a business.',
    icon: iconIsland,
  },
  {
    title: 'Research that stays on topic',
    description:
      'Benefit from research and insights grounded in your answers — so recommendations fit your idea, not a generic template.',
    icon: iconCompass,
  },
  {
    title: 'Progress you can see',
    description:
      'Monitor your journey from idea to launch with clear sequencing so you always know what comes next.',
    icon: iconLighthouse,
  },
];

const benefits: Benefit[] = [
  {
    title: 'Save time',
    description:
      'Reduce business planning time from months to weeks with structured guidance and clear next steps.',
    stat: 'Clearer path',
  },
  {
    title: 'Reduce costly guesswork',
    description:
      'Get expert-level planning help without piecing everything together from scattered advice online.',
    stat: 'Less overwhelm',
  },
  {
    title: 'Move with confidence',
    description:
      'Follow a proven sequence so you understand what to do, why it matters, and what to consider.',
    stat: 'More clarity',
  },
];

const howItWorks = [
  {
    step: '01',
    title: 'Share your vision',
    description:
      'Answer guided questions about your business idea, goals, and customers through an interactive conversation.',
  },
  {
    step: '02',
    title: 'Build your plan',
    description:
      'Angel helps you create a comprehensive business plan with recommendations grounded in what you shared.',
  },
  {
    step: '03',
    title: 'Get your roadmap',
    description:
      'Receive a personalized launch roadmap with clear milestones tailored to your business.',
  },
  {
    step: '04',
    title: 'Take action',
    description:
      'Follow step-by-step implementation guidance to turn your plan into reality with more confidence.',
  },
];

const faqs = [
  {
    q: 'What is Founderport?',
    a: 'Founderport is a guided platform that helps everyday people explore a business idea, build a plan, and simplify the path to launch — with Angel as your planning partner.',
  },
  {
    q: 'How much does it cost?',
    a: 'Founderport offers a free tier to get started, with Premium features available when you need the full roadmap and implementation tools.',
  },
  {
    q: 'What kinds of businesses can use it?',
    a: 'Founderport is built for the kinds of businesses people actually start — trades & home services, side hustles, online & digital offers, and product or growth businesses.',
  },
  {
    q: 'How long does planning take?',
    a: 'With guided questions and clear sequencing, most founders can complete a structured plan far faster than piecing templates and advice together alone.',
  },
];

const sectionReveal = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

const LearnMore: React.FC = () => {
  const navigate = useNavigate();
  const isLoggedIn = Boolean(getAccessToken());
  const primaryCta = isLoggedIn ? '/ventures' : '/signup';

  return (
    <div className="landing-page min-h-screen bg-[var(--landing-cream)] pt-20 text-[var(--landing-navy)]">
      {/* Hero */}
      <motion.section
        className="bg-white"
        initial="hidden"
        animate="show"
        variants={stagger}
      >
        <div className="mx-auto max-w-3xl px-6 py-16 text-center md:py-20">
          <motion.p
            variants={item}
            className="mb-3 text-sm font-semibold tracking-[0.08em] text-[var(--landing-navy)]/60"
          >
            LEARN MORE
          </motion.p>
          <motion.h1
            variants={item}
            className="font-landing-display text-4xl font-semibold leading-tight text-[var(--landing-navy)] sm:text-5xl"
          >
            From idea to action — with more clarity along the way
          </motion.h1>
          <motion.p
            variants={item}
            className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[var(--landing-navy)]/70 sm:text-lg"
          >
            Founderport helps you explore your business idea, build a real plan, and simplify the
            path to launch — so you always know what to do next.
          </motion.p>
          <motion.div
            variants={item}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <button
              type="button"
              onClick={() => navigate(primaryCta)}
              className="inline-flex rounded-md bg-[var(--landing-navy)] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[var(--landing-navy-deep)]"
            >
              Get Started Free
            </button>
            <Link
              to="/"
              className="inline-flex rounded-md border border-[var(--landing-navy)]/20 px-7 py-3 text-sm font-semibold text-[var(--landing-navy)] transition hover:bg-[var(--landing-cream)]"
            >
              Back to Home
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Features */}
      <motion.section
        className="bg-[var(--landing-cream)]"
        variants={sectionReveal}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
      >
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-landing-display text-3xl font-semibold text-[var(--landing-navy)] sm:text-4xl">
              What you get with Founderport
            </h2>
            <p className="mt-3 text-base text-[var(--landing-navy)]/70">
              Everything you need to turn a business idea into a clearer plan — without the noise.
            </p>
          </div>

          <motion.div
            className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
          >
            {features.map((feature) => (
              <motion.article
                key={feature.title}
                variants={item}
                className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[var(--landing-navy)]/8"
              >
                <div className="mb-4 h-14 w-14">
                  <img src={feature.icon} alt="" className="h-full w-full object-contain" />
                </div>
                <h3 className="font-landing-display text-xl font-semibold text-[var(--landing-navy)]">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--landing-navy)]/70">
                  {feature.description}
                </p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* How it works */}
      <motion.section
        className="bg-white"
        variants={sectionReveal}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
      >
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-landing-display text-3xl font-semibold text-[var(--landing-navy)] sm:text-4xl">
              How Founderport works
            </h2>
            <p className="mt-3 text-base text-[var(--landing-navy)]/70">
              A simple, guided process from idea to implementation.
            </p>
          </div>

          <motion.div
            className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
          >
            {howItWorks.map((step) => (
              <motion.article
                key={step.step}
                variants={item}
                className="rounded-2xl bg-[var(--landing-cream)] p-6 ring-1 ring-[var(--landing-navy)]/8"
              >
                <span className="font-landing-display text-2xl font-semibold text-[var(--landing-navy)]/35">
                  {step.step}
                </span>
                <h3 className="mt-3 font-landing-display text-lg font-semibold text-[var(--landing-navy)]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--landing-navy)]/70">
                  {step.description}
                </p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Benefits */}
      <motion.section
        className="bg-[var(--landing-cream)]"
        variants={sectionReveal}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
      >
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-landing-display text-3xl font-semibold text-[var(--landing-navy)] sm:text-4xl">
              Why founders choose Founderport
            </h2>
            <p className="mt-3 text-base text-[var(--landing-navy)]/70">
              Built for clarity — not for clutter.
            </p>
          </div>

          <motion.div
            className="mt-12 grid gap-6 md:grid-cols-3"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
          >
            {benefits.map((benefit) => (
              <motion.article
                key={benefit.title}
                variants={item}
                className="rounded-2xl bg-white p-7 text-center shadow-sm ring-1 ring-[var(--landing-navy)]/8"
              >
                <p className="font-landing-display text-xl font-semibold text-[var(--landing-navy)]">
                  {benefit.stat}
                </p>
                <h3 className="mt-3 text-lg font-semibold text-[var(--landing-navy)]">
                  {benefit.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--landing-navy)]/70">
                  {benefit.description}
                </p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* FAQ */}
      <motion.section
        className="bg-white"
        variants={sectionReveal}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
      >
        <div className="mx-auto max-w-3xl px-6 py-16 lg:px-10">
          <h2 className="text-center font-landing-display text-3xl font-semibold text-[var(--landing-navy)] sm:text-4xl">
            Frequently asked questions
          </h2>
          <div className="mt-10 space-y-4">
            {faqs.map((faq) => (
              <article
                key={faq.q}
                className="rounded-2xl bg-[var(--landing-cream)] p-6 ring-1 ring-[var(--landing-navy)]/8"
              >
                <h3 className="font-landing-display text-lg font-semibold text-[var(--landing-navy)]">
                  {faq.q}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--landing-navy)]/70">{faq.a}</p>
              </article>
            ))}
          </div>
        </div>
      </motion.section>

      <LandingCta
        headline="Ready to start with more clarity?"
        subcopy="Start with your idea. Build from there — with guided help every step of the way."
        primaryLabel="Get Started Now"
        primaryTo={primaryCta}
        secondaryLabel="Sign In"
        secondaryTo="/login"
        tagline="Start with your idea. Build from there."
      />
    </div>
  );
};

export default LearnMore;
