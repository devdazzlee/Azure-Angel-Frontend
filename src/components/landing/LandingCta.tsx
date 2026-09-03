import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ctaPlantMug from '../../assets/images/home/cta-plant-mug.png';
import ctaTools from '../../assets/images/home/cta-tools.png';

type LandingCtaProps = {
  headline: string;
  subcopy: string;
  primaryLabel: string;
  primaryTo: string;
  secondaryLabel?: string;
  secondaryTo?: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
  tagline?: string;
};

const sectionReveal = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

/**
 * Shared marketing CTA — matches client mockup:
 * pale sky band, centered copy, flanking plant/mug + tools (not a faded bg photo).
 */
export default function LandingCta({
  headline,
  subcopy,
  primaryLabel,
  primaryTo,
  secondaryLabel,
  secondaryTo,
  onPrimaryClick,
  onSecondaryClick,
  tagline = 'Start with your idea. Build from there.',
}: LandingCtaProps) {
  const primaryClass =
    'inline-flex rounded-md bg-[var(--landing-navy)] px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--landing-navy-deep)]';
  const secondaryClass =
    'inline-flex rounded-md border border-[var(--landing-navy)]/20 bg-white/80 px-7 py-3 text-sm font-semibold text-[var(--landing-navy)] transition hover:bg-white';

  return (
    <motion.section
      className="bg-white pb-16 pt-6 md:pb-20 md:pt-8"
      variants={sectionReveal}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-10">
        <div className="relative overflow-hidden rounded-[1.75rem] bg-[var(--landing-sky)] px-4 py-12 sm:px-8 md:px-12 md:py-16">
          {/* Flanking props — mockup layout */}
          <img
            src={ctaPlantMug}
            alt=""
            className="pointer-events-none absolute bottom-3 left-2 hidden h-24 w-24 object-contain sm:bottom-6 sm:left-6 sm:block sm:h-28 sm:w-28 md:h-32 md:w-32 lg:left-10 lg:h-36 lg:w-36"
          />
          <img
            src={ctaTools}
            alt=""
            className="pointer-events-none absolute bottom-3 right-2 hidden h-24 w-24 object-contain sm:bottom-6 sm:right-6 sm:block sm:h-28 sm:w-28 md:h-32 md:w-32 lg:right-10 lg:h-36 lg:w-36"
          />

          <div className="relative mx-auto max-w-xl px-2 text-center sm:max-w-2xl sm:px-16 md:px-20">
            <h2 className="font-landing-display text-3xl font-semibold leading-snug text-[var(--landing-navy)] sm:text-4xl">
              {headline}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--landing-navy)]/75 sm:text-lg">
              {subcopy}
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {onPrimaryClick ? (
                <button type="button" onClick={onPrimaryClick} className={primaryClass}>
                  {primaryLabel}
                </button>
              ) : (
                <Link to={primaryTo} className={primaryClass}>
                  {primaryLabel}
                </Link>
              )}
              {secondaryLabel &&
                (onSecondaryClick ? (
                  <button type="button" onClick={onSecondaryClick} className={secondaryClass}>
                    {secondaryLabel}
                  </button>
                ) : secondaryTo ? (
                  <Link to={secondaryTo} className={secondaryClass}>
                    {secondaryLabel}
                  </Link>
                ) : null)}
            </div>

            {tagline ? (
              <p className="mt-6 font-landing-display text-sm font-medium tracking-wide text-[var(--landing-navy)]/65">
                {tagline}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
