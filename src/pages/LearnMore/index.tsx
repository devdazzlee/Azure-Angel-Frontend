import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Link, useNavigate } from 'react-router-dom';

// Animation styles
const styles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-20px);
    }
  }
`;

// Animation variants
const reveal: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

const stagger: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

interface Feature {
  title: string;
  description: string;
  icon: string;
  color: string;
}

interface Benefit {
  title: string;
  description: string;
  stat: string;
}

const features: Feature[] = [
  {
    title: 'AI-Powered Business Planning',
    description: 'Get personalized guidance through every step of creating your business plan with our intelligent AI assistant.',
    icon: '📋',
    color: 'from-teal-500 to-blue-500',
  },
  {
    title: 'Automated Roadmap Generation',
    description: 'Receive a customized launch roadmap with actionable milestones tailored to your specific business needs.',
    icon: '🗺️',
    color: 'from-blue-500 to-purple-500',
  },
  {
    title: 'Step-by-Step Implementation',
    description: 'Follow guided tasks broken down into manageable actions, making the complex startup process simple.',
    icon: '✅',
    color: 'from-purple-500 to-pink-500',
  },
  {
    title: 'Expert Knowledge Base',
    description: 'Access deep domain expertise across regulatory, financial, marketing, and operational aspects of business.',
    icon: '🎓',
    color: 'from-pink-500 to-red-500',
  },
  {
    title: 'Real-Time Research',
    description: 'Benefit from AI-powered web research that provides up-to-date information and insights for your industry.',
    icon: '🔍',
    color: 'from-teal-500 to-green-500',
  },
  {
    title: 'Progress Tracking',
    description: 'Monitor your journey from idea to launch with visual progress indicators and milestone tracking.',
    icon: '📊',
    color: 'from-orange-500 to-yellow-500',
  },
];

const benefits: Benefit[] = [
  {
    title: 'Save Time',
    description: 'Reduce business planning time from months to weeks with automated guidance and templates.',
    stat: '70% Faster',
  },
  {
    title: 'Reduce Costs',
    description: 'Eliminate expensive consulting fees while getting expert-level business planning assistance.',
    stat: '$10k+ Saved',
  },
  {
    title: 'Increase Success',
    description: 'Follow proven methodologies and best practices to maximize your chances of business success.',
    stat: '3x Higher',
  },
];

const howItWorks = [
  {
    step: '01',
    title: 'Share Your Vision',
    description: 'Answer guided questions about your business idea, goals, and target market through an interactive conversation.',
    icon: '💭',
  },
  {
    step: '02',
    title: 'Build Your Plan',
    description: 'Angel helps you create a comprehensive business plan with research-backed recommendations and insights.',
    icon: '📝',
  },
  {
    step: '03',
    title: 'Get Your Roadmap',
    description: 'Receive a personalized launch roadmap with clear milestones and timelines tailored to your business.',
    icon: '🗓️',
  },
  {
    step: '04',
    title: 'Take Action',
    description: 'Follow step-by-step implementation guidance to turn your plan into reality with confidence.',
    icon: '🚀',
  },
];

const AnimatedSection: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const controls = useAnimation();
  const [ref, inView] = useInView({ threshold: 0.2, triggerOnce: true });

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={reveal}
    >
      {children}
    </motion.div>
  );
};

const LearnMore: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <style>{styles}</style>
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50">
        {/* Hero Section */}
        <section className="relative py-20 px-4 overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-teal-200/30 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>

          <div className="relative max-w-6xl mx-auto text-center">
            {/* Decorative SVG shapes like home page */}
            <svg className="absolute -top-10 left-1/4 w-48 h-48 opacity-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="80" stroke="url(#grad1)" strokeWidth="20" />
              <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#14b8a6" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            <svg className="absolute -bottom-10 right-1/4 w-48 h-48 opacity-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 200 200">
              <rect x="20" y="20" width="160" height="160" stroke="url(#grad2)" strokeWidth="20" />
              <defs>
                <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="relative z-10"
            >
              <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 tracking-tight md:mt-20 mt-10">
                Transform Your Business Idea Into Reality
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-700 mb-12 max-w-3xl mx-auto leading-relaxed">
                Angel is your AI-powered partner that guides you from concept to launch, providing expert insights and actionable roadmaps every step of the way.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={() => navigate('/signup')}
                  className="px-8 py-4 bg-teal-600 text-white font-semibold rounded-full hover:bg-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Get Started Free
                </button>

                <Link
                  to="/"
                  className="px-8 py-4 border-2 border-teal-600 text-teal-600 font-semibold rounded-full hover:bg-teal-50 transition-all duration-300"
                >
                  Back to Home
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <AnimatedSection>
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  Powerful Features to Launch Your Business
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Everything you need to turn your entrepreneurial vision into a thriving business
                </p>
              </div>
            </AnimatedSection>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={reveal}
                  className="group bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-teal-200 transform hover:-translate-y-2"
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    <span className="text-3xl">{feature.icon}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-teal-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 px-4 bg-white/50">
          <div className="max-w-7xl mx-auto">
            <AnimatedSection>
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  How Angel Works
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  A simple, guided process from idea to implementation
                </p>
              </div>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {howItWorks.map((item, index) => (
                <AnimatedSection key={index}>
                  <div className="relative">
                    {/* Connecting line */}
                    {index < howItWorks.length - 1 && (
                      <div className="hidden lg:block absolute top-16 left-full w-full h-1 bg-gradient-to-r from-teal-200 to-blue-200 transform -translate-x-1/2"></div>
                    )}
                    
                    <div className="relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover:border-teal-300">
                      <div className="absolute -top-6 left-8 w-12 h-12 bg-gradient-to-br from-teal-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {item.step}
                      </div>
                      
                      <div className="mt-8 mb-6 text-5xl">{item.icon}</div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-3">
                        {item.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <AnimatedSection>
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  Why Choose Angel?
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Join thousands of entrepreneurs who have successfully launched their businesses
                </p>
              </div>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {benefits.map((benefit, index) => (
                <AnimatedSection key={index}>
                  <div className="bg-gradient-to-br from-white to-teal-50 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-teal-100 text-center">
                    <div className="text-5xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent mb-4">
                      {benefit.stat}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </AnimatedSection>
              ))}
            </div>

            <AnimatedSection>
              <div className="bg-gradient-to-r from-teal-500 via-blue-500 to-purple-500 rounded-3xl p-12 text-center shadow-2xl">
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  Ready to Start Your Entrepreneurial Journey?
                </h3>
                <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                  Join Angel today and transform your business idea into a successful venture with AI-powered guidance.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => navigate('/signup')}
                    className="bg-white hover:bg-gray-50 text-teal-600 px-10 py-5 rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Get Started Now
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="bg-transparent border-2 border-white hover:bg-white/10 text-white px-10 py-5 rounded-2xl font-bold text-lg transition-all duration-300"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 px-4 bg-white/50">
          <div className="max-w-4xl mx-auto">
            <AnimatedSection>
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  Frequently Asked Questions
                </h2>
              </div>
            </AnimatedSection>

            <div className="space-y-6">
              {[
                {
                  q: 'What is Angel?',
                  a: 'Angel is an AI-powered platform that guides entrepreneurs through the entire process of starting a business, from initial planning to implementation.',
                },
                {
                  q: 'How much does it cost?',
                  a: 'Angel offers a free tier to get started, with premium features available for businesses that need advanced capabilities.',
                },
                {
                  q: 'What kind of businesses can use Angel?',
                  a: 'Angel supports all types of businesses across various industries, from tech startups to traditional brick-and-mortar businesses.',
                },
                {
                  q: 'How long does it take to create a business plan?',
                  a: 'With Angel\'s guided approach, most entrepreneurs can complete a comprehensive business plan in 2-3 hours, compared to weeks or months on their own.',
                },
              ].map((faq, index) => (
                <AnimatedSection key={index}>
                  <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{faq.q}</h3>
                    <p className="text-gray-600 leading-relaxed">{faq.a}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default LearnMore;

