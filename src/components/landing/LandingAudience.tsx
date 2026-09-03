import React from 'react';
import { motion } from 'framer-motion';
import audienceTrades from '../../assets/images/home/audience-trades.png';
import audienceSideHustle from '../../assets/images/home/audience-side-hustle.png';
import audienceDigital from '../../assets/images/home/audience-digital.png';
import audienceProduct from '../../assets/images/home/audience-product.png';

export type AudienceCard = {
  title: string;
  description: string;
  image: string;
  imagePosition?: string;
};

export const LANDING_AUDIENCE_CARDS: AudienceCard[] = [
  {
    title: 'Trades & home services',
    description:
      'Built for plumbers, electricians, landscapers, cleaners, and other hands-on service businesses.',
    image: audienceTrades,
  },
  {
    title: 'Side hustles',
    description:
      'Turn skills you already have into extra income — with a clearer path from idea to first customers.',
    image: audienceSideHustle,
    imagePosition: 'object-[center_20%]',
  },
  {
    title: 'Online & digital businesses',
    description:
      'For coaching, freelancing, e-commerce, and other digital offers that need structure to grow.',
    image: audienceDigital,
  },
  {
    title: 'Product or growth businesses',
    description:
      'For founders building brands, selling products, and planning the next stage of growth.',
    image: audienceProduct,
  },
];

const sectionReveal = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
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
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
};

type LandingAudienceProps = {
  id?: string;
  headline?: string;
  subcopy?: string;
  cards?: AudienceCard[];
};

/**
 * Shared “Who it’s for” grid — matches client mockup:
 * soft sky image wells + left-aligned title/body (not heavy white photo-cards).
 */
export default function LandingAudience({
  id = 'who-its-for',
  headline = 'Made for the kinds of businesses people actually start.',
  subcopy = "Whether you're starting small or dreaming big, Founderport helps you move with more confidence.",
  cards = LANDING_AUDIENCE_CARDS,
}: LandingAudienceProps) {
  return (
    <motion.section
      id={id}
      className="scroll-mt-24 bg-white"
      variants={sectionReveal}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
    >
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-landing-display text-3xl font-semibold leading-snug text-[var(--landing-navy)] sm:text-4xl">
            {headline}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--landing-navy)]/70 sm:text-lg">
            {subcopy}
          </p>
        </div>

        <motion.div
          className="mt-12 grid gap-8 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6"
          variants={stagger}
        >
          {cards.map((card) => (
            <motion.article key={card.title} variants={item} className="text-left">
              <div className="overflow-hidden rounded-2xl bg-[var(--landing-sky)] p-3 sm:p-3.5">
                <div className="aspect-[4/3] overflow-hidden rounded-xl bg-[var(--landing-sky)]">
                  <img
                    src={card.image}
                    alt=""
                    className={`h-full w-full object-cover ${card.imagePosition ?? 'object-center'}`}
                  />
                </div>
              </div>
              <h3 className="mt-4 font-landing-display text-lg font-semibold text-[var(--landing-navy)]">
                {card.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--landing-navy)]/70">
                {card.description}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}
