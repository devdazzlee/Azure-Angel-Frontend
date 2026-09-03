import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { getAccessToken } from '../../utils/tokenUtils';
import LandingCta from '../../components/landing/LandingCta';
import iconCompass from '../../assets/images/home/icon-compass.png';
import iconLighthouse from '../../assets/images/home/icon-lighthouse.png';
import iconOars from '../../assets/images/home/icon-oars.png';

/** Premium headline pricing — list vs intro offer (one place to update marketing copy). */
const PREMIUM_PRICING = {
  listPriceLabel: '$20 Per Month',
  introOfferLabel: '$0 Per Month Intro Offer',
} as const;

type ServiceCard = {
  icon: string;
  title: string;
  description: string;
  tier?: 'Free' | 'Premium';
};

type ProcessStep = {
  step: string;
  title: string;
  description: string;
  tier: 'Free' | 'Premium';
};

const services: ServiceCard[] = [
  {
    icon: iconCompass,
    title: 'Structured Business Plan',
    description:
      'Create a comprehensive plan that organizes your thinking, consolidates your decisions, and serves as your reference point for next steps.',
  },
  {
    icon: iconLighthouse,
    title: 'Personalized Launch Roadmap',
    description:
      'Get a roadmap that breaks your launch into major milestones, ordered in a logical sequence that reflects your business type.',
  },
  {
    icon: iconOars,
    title: 'Guided Implementation Steps',
    description:
      'Each milestone decomposes into smaller, actionable steps with clear explanations of what to do and why it matters.',
    tier: 'Premium',
  },
];

const processSteps: ProcessStep[] = [
  {
    step: '1',
    title: 'Sign Up & Create Venture',
    description:
      'Create your account and start a new venture. Our system will guide you through the initial setup.',
    tier: 'Free',
  },
  {
    step: '2',
    title: 'Answer Key Questions',
    description:
      'Complete our business planning questionnaire to help us understand your business needs and goals.',
    tier: 'Free',
  },
  {
    step: '3',
    title: 'Get Your Business Plan',
    description:
      'Receive a comprehensive, research-backed business plan tailored to your industry and business model.',
    tier: 'Free',
  },
  {
    step: '4',
    title: 'Follow Your Roadmap',
    description:
      'Get a detailed roadmap with clear phases, milestones, and actionable steps to launch your business.',
    tier: 'Premium',
  },
  {
    step: '5',
    title: 'Implement & Execute',
    description:
      'Use our implementation tools to track progress, get help, and complete tasks step by step.',
    tier: 'Premium',
  },
  {
    step: '6',
    title: 'Launch & Grow',
    description:
      'Launch your business with confidence and continue growing with ongoing support and guidance.',
    tier: 'Premium',
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

export default function Services() {
  const navigate = useNavigate();
  const isLoggedIn = Boolean(getAccessToken());

  const handlePremiumSubscribe = () => {
    if (isLoggedIn) {
      navigate('/profile');
      return;
    }
    navigate('/signup?plan=premium');
  };

  return (
    <div className="landing-page min-h-screen bg-[var(--landing-cream)] pt-20 text-[var(--landing-navy)]">
      {/* Hero */}
      <motion.section
        className="bg-white"
        variants={sectionReveal}
        initial="hidden"
        animate="show"
      >
        <div className="mx-auto max-w-3xl px-6 py-16 text-center md:py-20">
          <p className="mb-3 text-sm font-semibold tracking-[0.08em] text-[var(--landing-navy)]/60">
            SERVICES & PRICING
          </p>
          <h1 className="font-landing-display text-4xl font-semibold leading-tight text-[var(--landing-navy)] sm:text-5xl">
            Plan, launch, and grow with clarity
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[var(--landing-navy)]/70 sm:text-lg">
            Comprehensive guidance to help you organize your idea, build a real plan, and move
            forward with confidence — at your own pace.
          </p>
        </div>
      </motion.section>

      {/* Pricing tiers */}
      <motion.section
        className="bg-[var(--landing-cream)]"
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="mx-auto grid max-w-5xl gap-5 px-6 py-12 md:grid-cols-2 lg:px-10">
          <motion.div
            variants={item}
            className="rounded-2xl bg-white p-8 shadow-[0_12px_40px_-24px_rgba(30,58,95,0.35)] ring-1 ring-[var(--landing-navy)]/8"
          >
            <p className="text-sm font-semibold tracking-wide text-[var(--landing-navy)]/55">
              FREE
            </p>
            <h2 className="mt-2 font-landing-display text-2xl font-semibold text-[var(--landing-navy)]">
              Free Tier
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--landing-navy)]/70">
              Start exploring your idea and build a structured business plan with guided support.
            </p>
            <Link
              to={isLoggedIn ? '/ventures' : '/signup'}
              className="mt-6 inline-flex rounded-md border border-[var(--landing-navy)]/20 px-5 py-2.5 text-sm font-semibold text-[var(--landing-navy)] transition hover:bg-[var(--landing-cream)]"
            >
              Start for free
            </Link>
          </motion.div>

          <motion.div
            variants={item}
            className="rounded-2xl bg-[var(--landing-navy)] p-8 text-white shadow-[0_12px_40px_-20px_rgba(30,58,95,0.5)]"
          >
            <p className="text-sm font-semibold tracking-wide text-white/70">PREMIUM</p>
            <h2 className="mt-2 font-landing-display text-2xl font-semibold">Premium Tier</h2>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="text-base text-white/55 line-through decoration-2">
                {PREMIUM_PRICING.listPriceLabel}
              </span>
              <span className="rounded-md bg-white/15 px-3 py-1 text-sm font-semibold ring-1 ring-white/25">
                {PREMIUM_PRICING.introOfferLabel}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white/75">
              Unlock your full roadmap, implementation steps, and ongoing guidance to launch with
              clarity.
            </p>
            <button
              type="button"
              onClick={handlePremiumSubscribe}
              className="mt-6 inline-flex rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-[var(--landing-navy)] transition hover:bg-[var(--landing-cream)]"
            >
              Join Premium
            </button>
          </motion.div>
        </div>
      </motion.section>

      {/* What you get */}
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
              What Founderport provides
            </h2>
            <p className="mt-3 text-base text-[var(--landing-navy)]/70">
              Clear structure from idea to action — without the overwhelm.
            </p>
          </div>

          <motion.div
            className="mt-12 grid gap-6 md:grid-cols-3"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
          >
            {services.map((service) => {
              const body = (
                <>
                  <div className="mb-5 flex h-16 w-16 items-center justify-center">
                    <img src={service.icon} alt="" className="h-full w-full object-contain" />
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-landing-display text-xl font-semibold text-[var(--landing-navy)]">
                      {service.title}
                    </h3>
                    {service.tier === 'Premium' && (
                      <span className="shrink-0 rounded-md bg-[var(--landing-navy)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                        Premium
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--landing-navy)]/70">
                    {service.description}
                  </p>
                </>
              );

              return service.tier === 'Premium' ? (
                <motion.button
                  key={service.title}
                  type="button"
                  onClick={handlePremiumSubscribe}
                  variants={item}
                  className="rounded-2xl bg-[var(--landing-cream)] p-6 text-left ring-1 ring-[var(--landing-navy)]/10 transition hover:ring-[var(--landing-navy)]/25"
                >
                  {body}
                </motion.button>
              ) : (
                <motion.article
                  key={service.title}
                  variants={item}
                  className="rounded-2xl bg-[var(--landing-cream)] p-6 ring-1 ring-[var(--landing-navy)]/10"
                >
                  {body}
                </motion.article>
              );
            })}
          </motion.div>
        </div>
      </motion.section>

      {/* How it works */}
      <motion.section
        className="bg-[var(--landing-cream)]"
        variants={sectionReveal}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
      >
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-landing-display text-3xl font-semibold text-[var(--landing-navy)] sm:text-4xl">
              How it works
            </h2>
            <p className="mt-3 text-base text-[var(--landing-navy)]/70">
              A calm, guided path from signup to launch.
            </p>
          </div>

          <motion.div
            className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
          >
            {processSteps.map((step) => {
              const body = (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--landing-navy)] text-sm font-semibold text-white">
                      {step.step}
                    </span>
                    <span
                      className={`rounded-md px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                        step.tier === 'Premium'
                          ? 'bg-[var(--landing-navy)] text-white'
                          : 'bg-white text-[var(--landing-navy)] ring-1 ring-[var(--landing-navy)]/15'
                      }`}
                    >
                      {step.tier}
                    </span>
                  </div>
                  <h3 className="font-landing-display text-lg font-semibold text-[var(--landing-navy)]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--landing-navy)]/70">
                    {step.description}
                  </p>
                </>
              );

              return step.tier === 'Premium' ? (
                <motion.button
                  key={step.step}
                  type="button"
                  onClick={handlePremiumSubscribe}
                  variants={item}
                  className="rounded-2xl bg-white p-5 text-left shadow-sm ring-1 ring-[var(--landing-navy)]/8 transition hover:ring-[var(--landing-navy)]/20"
                >
                  {body}
                </motion.button>
              ) : (
                <motion.article
                  key={step.step}
                  variants={item}
                  className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[var(--landing-navy)]/8"
                >
                  {body}
                </motion.article>
              );
            })}
          </motion.div>
        </div>
      </motion.section>

      <LandingCta
        headline="Ready to get started?"
        subcopy="Begin free, or unlock Premium when you're ready for the full roadmap and implementation tools."
        primaryLabel="Join Premium"
        primaryTo="/signup?plan=premium"
        onPrimaryClick={handlePremiumSubscribe}
        secondaryLabel="Start for free"
        secondaryTo={isLoggedIn ? '/ventures' : '/signup'}
        tagline="Start with your idea. Build from there."
      />
    </div>
  );
}
