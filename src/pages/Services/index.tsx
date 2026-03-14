import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

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
  icon: string;
  title: string;
  description: string;
  tier: 'Free' | 'Premium';
};

const services: ServiceCard[] = [
  {
    icon: '📋',
    title: 'Structured Business Plan',
    description:
      'Create a comprehensive plan that organizes your thinking, consolidates your decisions, and serves as your reference point for next steps.',
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
    tier: 'Premium',
  },
];

const processSteps: ProcessStep[] = [
  {
    step: '1',
    icon: '🚀',
    title: 'Sign Up & Create Venture',
    description: 'Create your account and start a new venture. Our system will guide you through the initial setup.',
    tier: 'Free',
  },
  {
    step: '2',
    icon: '📝',
    title: 'Answer Key Questions',
    description: 'Complete our business planning questionnaire to help us understand your business needs and goals.',
    tier: 'Free',
  },
  {
    step: '3',
    icon: '📋',
    title: 'Get Your Business Plan',
    description: 'Receive a comprehensive, research-backed business plan tailored to your industry and business model.',
    tier: 'Free',
  },
  {
    step: '4',
    icon: '🗺️',
    title: 'Follow Your Roadmap',
    description: 'Get a detailed roadmap with clear phases, milestones, and actionable steps to launch your business.',
    tier: 'Premium',
  },
  {
    step: '5',
    icon: '⚙️',
    title: 'Implement & Execute',
    description: 'Use our implementation tools to track progress, get help, and complete tasks step by step.',
    tier: 'Premium',
  },
  {
    step: '6',
    icon: '🎯',
    title: 'Launch & Grow',
    description: 'Launch your business with confidence and continue growing with ongoing support and guidance.',
    tier: 'Premium',
  },
];

const sectionReveal = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45 },
  },
};

const stagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1 },
  },
};

const itemReveal = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function Services() {
  const navigate = useNavigate();
  const isLoggedIn = Boolean(localStorage.getItem('sb_access_token'));

  const handlePremiumSubscribe = () => {
    if (isLoggedIn) {
      navigate('/profile');
      return;
    }
    navigate('/signup?plan=premium');
  };

  return (
    <div className="min-h-screen bg-slate-100 pt-20 text-slate-800">
      <div className="mx-auto w-full max-w-6xl px-4 pb-14">
        <motion.section
          className="text-center"
          variants={sectionReveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
        >
          <h1 className="inline-block rounded-xl bg-blue-50 px-6 py-2 text-4xl font-black text-blue-600 md:text-6xl">Services</h1>
          <p className="mx-auto mt-5 max-w-5xl rounded-xl bg-sky-50 px-4 py-3 text-lg text-slate-600 md:text-xl">
            Comprehensive business services to help you <span className="font-semibold text-teal-600">plan, launch, and grow</span> your business successfully
          </p>
        </motion.section>

        <motion.section
          className="mt-9 grid gap-4 md:grid-cols-3"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.div variants={itemReveal} className="md:col-span-1">
            <div className="rounded-2xl border-2 border-blue-700 bg-blue-600 px-6 py-5 text-center text-2xl font-bold text-white shadow-sm">
              Free Tier
            </div>
          </motion.div>
          <motion.div variants={itemReveal} className="md:col-span-2">
            <button
              type="button"
              onClick={handlePremiumSubscribe}
              className="w-full rounded-2xl border-2 border-blue-700 bg-blue-600 px-6 py-5 text-center text-2xl font-bold text-white shadow-sm transition hover:bg-blue-700"
            >
              Premium Tier
              <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xl font-semibold">
                <span className="line-through opacity-80 decoration-2" aria-hidden="true">
                  {PREMIUM_PRICING.listPriceLabel}
                </span>
                <span className="rounded-lg bg-white/15 px-2 py-0.5 text-white ring-1 ring-white/30">
                  {PREMIUM_PRICING.introOfferLabel}
                </span>
              </div>
              <span className="sr-only">
                Regular price {PREMIUM_PRICING.listPriceLabel}, currently {PREMIUM_PRICING.introOfferLabel}
              </span>
            </button>
          </motion.div>
        </motion.section>

        <motion.section
          className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
        >
          {services.map((service) =>
            service.tier === 'Premium' ? (
              <motion.button
                key={service.title}
                type="button"
                onClick={handlePremiumSubscribe}
                variants={itemReveal}
                whileHover={{ y: -6 }}
                className="rounded-2xl border-2 border-blue-500 bg-white p-6 text-left shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="text-3xl">{service.icon}</div>
                  <span className="rounded bg-blue-600 px-2 py-1 text-xs font-bold text-white">Premium</span>
                </div>
                <h3 className="mt-3 text-xl font-bold text-slate-800">{service.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-slate-600">{service.description}</p>
              </motion.button>
            ) : (
              <motion.article
                key={service.title}
                variants={itemReveal}
                whileHover={{ y: -6 }}
                className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="text-3xl">{service.icon}</div>
                <h3 className="mt-3 text-xl font-bold text-slate-800">{service.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-slate-600">{service.description}</p>
              </motion.article>
            ),
          )}
        </motion.section>

        <motion.section
          className="mt-10 rounded-xl bg-slate-200 px-5 py-8"
          variants={sectionReveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <h2 className="text-center text-3xl font-bold text-teal-700 md:text-4xl">How It Works</h2>
          <motion.div
            className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
          >
            {processSteps.map((step) =>
              step.tier === 'Premium' ? (
                <motion.button
                  key={step.step}
                  type="button"
                  onClick={handlePremiumSubscribe}
                  variants={itemReveal}
                  whileHover={{ y: -5 }}
                  className="rounded-2xl border-2 border-blue-500 bg-white p-5 text-left shadow-sm transition hover:shadow-md"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500 text-base font-bold text-white">
                        {step.step}
                      </span>
                      <span className="text-xl">{step.icon}</span>
                    </div>
                    <span className="rounded bg-blue-600 px-3 py-1 text-sm font-bold text-white">
                      {step.tier}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-teal-700">{step.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-slate-600">{step.description}</p>
                </motion.button>
              ) : (
                <motion.article
                  key={step.step}
                  variants={itemReveal}
                  whileHover={{ y: -5 }}
                  className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500 text-base font-bold text-white">
                        {step.step}
                      </span>
                      <span className="text-xl">{step.icon}</span>
                    </div>
                    <span className="rounded bg-blue-600 px-3 py-1 text-sm font-bold text-white">
                      {step.tier}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-teal-700">{step.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-slate-600">{step.description}</p>
                </motion.article>
              ),
            )}
          </motion.div>
        </motion.section>

        <motion.section
          className="mt-10 text-center"
          variants={sectionReveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
        >
          <h3 className="mx-auto max-w-4xl rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-5 text-3xl font-bold text-white md:text-4xl shadow-sm">
            Ready to Get Started?
          </h3>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handlePremiumSubscribe}
              className="rounded-xl border-2 border-blue-700 bg-blue-600 px-8 py-3 text-lg font-bold text-white transition hover:bg-blue-700"
            >
              Join Premium
            </button>
            <Link
              to={isLoggedIn ? '/ventures' : '/signup'}
              className="rounded-xl border-2 border-blue-700 bg-blue-600 px-8 py-3 text-lg font-bold text-white transition hover:bg-blue-700"
            >
              Start For Free
            </Link>
          </div>
        </motion.section>
      </div>
    </div>
  );
}







