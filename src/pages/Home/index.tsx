import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getAccessToken } from '../../utils/tokenUtils';
import LandingAudience from '../../components/landing/LandingAudience';
import LandingCta from '../../components/landing/LandingCta';
import heroShipMap from '../../assets/images/home/hero-ship-map.png';
import iconIsland from '../../assets/images/home/icon-island.png';
import iconCompass from '../../assets/images/home/icon-compass.png';
import iconLighthouse from '../../assets/images/home/icon-lighthouse.png';
import iconOars from '../../assets/images/home/icon-oars.png';

type ValueProp = {
  title: string;
  description: string;
  icon: string;
};

const valueProps: ValueProp[] = [
  {
    title: 'Explore your idea',
    description: 'Pressure-test your idea and see what may apply.',
    icon: iconIsland,
  },
  {
    title: 'Build a real plan',
    description: 'Create a business plan that actually helps you move forward.',
    icon: iconCompass,
  },
  {
    title: 'Move forward with clarity',
    description: 'Get a clear roadmap, key activities, and budgeting tools.',
    icon: iconLighthouse,
  },
  {
    title: 'Support at every step',
    description:
      'Receive the guidance and help you need to create the right documents and materials.',
    icon: iconOars,
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
  show: {
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

const FounderportHome: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = Boolean(getAccessToken());
  const primaryCta = isLoggedIn ? '/ventures' : '/login';

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
        return;
      }

      const id = hash.replace('#', '');
      if (id && !accessToken) {
        requestAnimationFrame(() => {
          document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    }
  }, [navigate, location.hash]);

  return (
    <div className="landing-page bg-[var(--landing-cream)] pt-20 text-[var(--landing-navy)]">
      {/* Hero */}
      <motion.section
        className="overflow-hidden bg-white"
        initial="hidden"
        animate="show"
        variants={stagger}
      >
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-14 md:grid-cols-2 md:gap-12 md:py-20 lg:px-10">
          <div className="max-w-xl">
            <motion.p
              variants={item}
              className="mb-3 font-landing-display text-sm font-semibold tracking-[0.08em] text-[var(--landing-navy)]/70"
            >
              FOUNDERPORT
            </motion.p>
            <motion.h1
              variants={item}
              className="font-landing-display text-4xl font-semibold leading-[1.12] tracking-tight text-[var(--landing-navy)] sm:text-5xl lg:text-[3.35rem]"
            >
              Start your business with clarity.
            </motion.h1>
            <motion.p
              variants={item}
              className="mt-5 max-w-md text-base leading-relaxed text-[var(--landing-navy)]/75 sm:text-lg"
            >
              Founderport helps everyday people explore their business idea, build a plan, and
              simplify the path to launch.
            </motion.p>
            <motion.div variants={item} className="mt-8">
              <Link
                to={primaryCta}
                className="inline-flex rounded-md bg-[var(--landing-navy)] px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--landing-navy-deep)]"
              >
                Get Started
              </Link>
            </motion.div>
            <motion.div
              variants={item}
              className="mt-5 flex items-start gap-2 text-sm text-[var(--landing-navy)]/70"
            >
              <svg
                className="mt-0.5 h-4 w-4 shrink-0 text-[var(--landing-navy)]"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 1.5a8.5 8.5 0 100 17 8.5 8.5 0 000-17zM8.97 12.53l5-5a.75.75 0 10-1.06-1.06L8.5 10.88 6.59 8.97a.75.75 0 10-1.06 1.06l2.5 2.5a.75.75 0 001.06 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Get step-by-step guidance so you always know what to do next.</span>
            </motion.div>
          </div>

          <motion.div variants={item} className="relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-[radial-gradient(circle_at_70%_40%,rgba(30,58,95,0.08),transparent_60%)]" />
            <img
              src={heroShipMap}
              alt="Illustrated sailing ship charting a course on a parchment map"
              className="relative w-full rounded-2xl object-cover shadow-[0_20px_50px_-28px_rgba(30,58,95,0.35)]"
            />
          </motion.div>
        </div>
      </motion.section>

      {/* Bridge */}
      <motion.section
        id="how-it-works"
        className="scroll-mt-24 border-t border-[var(--landing-navy)]/8 bg-[var(--landing-cream)]"
        variants={sectionReveal}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.35 }}
      >
        <div className="mx-auto max-w-3xl px-6 py-16 text-center md:py-20">
          <h2 className="font-landing-display text-3xl font-semibold leading-snug text-[var(--landing-navy)] sm:text-4xl">
            Not sure where to start? That&apos;s exactly why Founderport exists.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--landing-navy)]/70 sm:text-lg">
            Instead of piecing everything together yourself, get guided help from idea to action.
          </p>
        </div>
      </motion.section>

      {/* Value props */}
      <motion.section
        className="bg-white"
        variants={sectionReveal}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div
          className="mx-auto grid max-w-7xl gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8 lg:px-10 lg:py-20"
          variants={stagger}
        >
          {valueProps.map((prop) => (
            <motion.article key={prop.title} variants={item} className="text-center lg:text-left">
              <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center lg:mx-0">
                <img
                  src={prop.icon}
                  alt=""
                  className="h-full w-full object-contain drop-shadow-sm"
                />
              </div>
              <h3 className="font-landing-display text-xl font-semibold text-[var(--landing-navy)]">
                {prop.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--landing-navy)]/70 sm:text-[0.95rem]">
                {prop.description}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </motion.section>

      <LandingAudience />

      <LandingCta
        headline="You don't need to have it all figured out to get started."
        subcopy="Founderport helps you take the next step with more clarity, structure, and confidence."
        primaryLabel="Get Started"
        primaryTo={primaryCta}
      />
    </div>
  );
};

export default FounderportHome;
