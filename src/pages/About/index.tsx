import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const sections = [
  {
    title: "Empowerment & Support",
    icon: "💪",
    content:
      "We empower entrepreneurs by providing clear, actionable guidance at every step, ensuring they feel confident in building their business. Our system is built to simplify even the most complex processes, so users can focus on creating the business of their dreams. We use extensive research and proven best practices to provide recommendations that are both practical and inspiring.",
  },
  {
    title: "Bespoke & Dynamic",
    icon: "⚡",
    content:
      "Every piece of advice is tailored specifically to the user's individual needs, meaning that no two journeys are alike. Our system dynamically adjusts to inputs, ensuring that recommendations, resource links, and next steps are always contextually relevant. This bespoke approach guarantees that users receive differentiated support that aligns with their unique learning and building style.",
  },
  {
    title: "Unified Experience with Agentic Expertise",
    icon: "🤖",
    content:
      "Users interact solely with Angel, our single, cohesive interface, while behind the scenes, specialized agents provide deep, domain-specific guidance. These agents are trained using comprehensive, research-backed data sourced from credible government websites, industry reports, academic journals, and reputable news outlets. This integrated, hidden agent architecture ensures a seamless, consistent user experience with expert-level insights at every step.",
  },
  {
    title: "Action-Oriented Support",
    icon: "🎯",
    content:
      "We do as much as possible on behalf of the entrepreneur, actively guiding, drafting, and assisting in every step of the process. Our system is designed to take immediate actions—such as drafting emails, generating checklists, and analyzing proposals—to help reduce friction and accelerate progress. This proactive assistance ensures that the entrepreneur's journey is not only smooth but also highly efficient.",
  },
  {
    title: "Supportive Assistance",
    icon: "🤝",
    content:
      "We offer extra help when users encounter challenges by providing additional guidance and resources. Whether through dynamic prompts or tailored advice panels, we ensure that every user, regardless of experience level, feels supported and confident. Our language is friendly, respectful, and encouraging, making sure novice and experienced entrepreneurs alike feel valued and capable.",
  },
  {
    title: "Inclusive of All Experience Levels",
    icon: "🌟",
    content:
      "Our experience is designed with the assumption that most customers are first-time or novice entrepreneurs, yet it also accommodates seasoned business founders. We provide clear, step-by-step instructions while also offering deeper, strategic insights for those who need more advanced guidance. Our approach is kind, accommodating, and always geared toward building confidence, trust and promoting success.",
  },
];

const stats = [
  { value: 100, suffix: "K+", label: "Entrepreneurs Empowered", gradient: "from-teal-600 to-blue-600" },
  { value: 95, suffix: "%", label: "Success Rate", gradient: "from-blue-600 to-indigo-600" },
  { value: 24, suffix: "/7", label: "AI Support Available", gradient: "from-indigo-600 to-teal-600" },
];

export default function AboutUs() {
  const [activeSection, setActiveSection] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [counters, setCounters] = useState([0, 0, 0]);
  const statsRef = useRef(null);
  const isInView = useInView(statsRef, { once: true, margin: "-100px" });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (isInView) {
      const duration = 2000;
      const steps = 60;
      const interval = duration / steps;

      stats.forEach((stat, index) => {
        let current = 0;
        const increment = stat.value / steps;
        const timer = setInterval(() => {
          current += increment;
          if (current >= stat.value) {
            setCounters(prev => {
              const newCounters = [...prev];
              newCounters[index] = stat.value;
              return newCounters;
            });
            clearInterval(timer);
          } else {
            setCounters(prev => {
              const newCounters = [...prev];
              newCounters[index] = Math.floor(current);
              return newCounters;
            });
          }
        }, interval);
      });
    }
  }, [isInView]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.17, 0.67, 0.83, 0.67] as const,
      },
    },
  };

  const sectionVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.17, 0.67, 0.83, 0.67] as const,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-50 relative overflow-hidden pt-20">
      {/* Enhanced Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute w-96 h-96 bg-gradient-to-r from-teal-200/30 to-blue-200/30 rounded-full blur-3xl"
          animate={{
            x: mousePosition.x * 0.02,
            y: mousePosition.y * 0.02,
          }}
          transition={{ type: "spring", stiffness: 50, damping: 20 }}
          style={{
            left: '10%',
            top: '20%',
          }}
        />
        <motion.div 
          className="absolute w-80 h-80 bg-gradient-to-r from-blue-200/20 to-indigo-200/20 rounded-full blur-3xl"
          animate={{
            x: mousePosition.x * -0.015,
            y: mousePosition.y * -0.015,
          }}
          transition={{ type: "spring", stiffness: 50, damping: 20 }}
          style={{
            right: '10%',
            bottom: '20%',
          }}
        />
        {/* Additional floating elements */}
        <motion.div
          className="absolute w-64 h-64 bg-gradient-to-r from-indigo-200/15 to-teal-200/15 rounded-full blur-2xl"
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            left: '50%',
            top: '50%',
          }}
        />
      </div>

      <div className="relative z-10 py-20 px-4 md:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Hero Section */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="text-center mb-20"
          >
            <motion.div
              variants={itemVariants}
              className="inline-block bg-white/80 backdrop-blur-xl border border-white/40 rounded-full px-6 py-2 mb-6 shadow-lg"
            >
              <motion.span
                className="text-teal-600 font-medium text-sm"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ✨ Discover Our Story
              </motion.span>
            </motion.div>
            <motion.h1
              variants={itemVariants}
              className="text-6xl md:text-7xl font-black bg-gradient-to-r from-teal-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6 leading-tight"
            >
              Who We Are
            </motion.h1>
            <motion.p
              variants={itemVariants}
              className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed font-light"
            >
              We're Founderport — a platform dedicated to empowering entrepreneurs with intelligent, personalized guidance to transform 
              <span className="font-semibold text-teal-600"> ideas into successful ventures</span>
            </motion.p>
            <motion.div
              variants={itemVariants}
              className="mt-8 max-w-3xl mx-auto text-gray-700 leading-relaxed"
            >
              <p className="text-lg mb-4">
                At Founderport, we believe that starting a business shouldn't be overwhelming. That's why we've created Angel — your AI-powered mentor and assistant that guides you through every step of your entrepreneurial journey.
              </p>
              <p className="text-lg">
                Whether you're testing an idea for the first time or ready to launch, Angel provides the structure, guidance, and expertise you need to build a successful business.
              </p>
            </motion.div>
          </motion.div>

          {/* Enhanced Interactive Sections */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="grid lg:grid-cols-2 gap-8 mb-20"
          >
            {/* Navigation Pills */}
            <motion.div variants={itemVariants} className="space-y-4">
              <motion.h3
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-2xl font-bold text-teal-700 mb-6"
              >
                Our Core Values
              </motion.h3>
              {sections.map((section, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, x: 10 }}
                  className={`p-5 rounded-2xl cursor-pointer transition-all duration-300 ${
                    activeSection === index
                      ? 'bg-white/90 backdrop-blur-xl border-2 border-teal-300 shadow-xl scale-105'
                      : 'bg-white/60 backdrop-blur-md border border-white/30 hover:bg-white/70 hover:border-teal-200'
                  }`}
                  onClick={() => setActiveSection(index)}
                >
                  <div className="flex items-center space-x-4">
                    <motion.div
                      animate={{
                        scale: activeSection === index ? 1.3 : 1,
                        rotate: activeSection === index ? [0, -10, 10, -10, 0] : 0,
                      }}
                      transition={{ duration: 0.5 }}
                      className="text-3xl"
                    >
                      {section.icon}
                    </motion.div>
                    <div className="flex-1">
                      <h4 className={`font-bold transition-colors duration-200 ${
                        activeSection === index ? 'text-teal-700' : 'text-gray-700'
                      }`}>
                        {section.title}
                      </h4>
                      <motion.div
                        className="h-1 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full mt-2"
                        initial={{ width: 0 }}
                        animate={{ width: activeSection === index ? '100%' : '0%' }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Enhanced Content Display */}
            <motion.div
              key={activeSection}
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl p-8 md:p-10 shadow-2xl sticky top-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="text-center mb-6"
              >
                <motion.div
                  animate={{
                    y: [0, -10, 0],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="text-6xl mb-4"
                >
                  {sections[activeSection].icon}
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-3xl font-bold text-teal-700 mb-4"
                >
                  {sections[activeSection].title}
                </motion.h2>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-gray-700 text-lg leading-relaxed"
              >
                {sections[activeSection].content}
              </motion.p>
            </motion.div>
          </motion.div>

          {/* Enhanced Stats Section with Animated Counters */}
          <motion.div
            ref={statsRef}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="bg-white/70 backdrop-blur-xl border border-white/30 rounded-3xl p-8 md:p-12 shadow-2xl mb-20 relative overflow-hidden"
          >
            {/* Animated background pattern */}
            <motion.div
              className="absolute inset-0 opacity-5"
              animate={{
                backgroundPosition: ["0% 0%", "100% 100%"],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                repeatType: "reverse",
              }}
              style={{
                backgroundImage: "radial-gradient(circle, teal 1px, transparent 1px)",
                backgroundSize: "50px 50px",
              }}
            />
            <div className="relative z-10 grid md:grid-cols-3 gap-8 text-center">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ scale: 1.1, y: -5 }}
                  className="space-y-2"
                >
                  <motion.div
                    className={`text-4xl md:text-5xl font-black bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}
                    animate={{ scale: isInView ? [1, 1.1, 1] : 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    {counters[index]}{stat.suffix}
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isInView ? 1 : 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="text-gray-600 font-medium"
                  >
                    {stat.label}
                  </motion.p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Enhanced Call to Action */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="text-center"
          >
            <motion.div
              variants={itemVariants}
              className="bg-gradient-to-r from-teal-500 to-blue-500 rounded-3xl p-12 shadow-2xl relative overflow-hidden"
            >
              {/* Animated gradient overlay */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-teal-600/20 to-blue-600/20 backdrop-blur-sm"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{
                  backgroundSize: "200% 200%",
                }}
              />
              {/* Floating particles */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-white/30 rounded-full"
                  animate={{
                    y: [0, -30, 0],
                    x: [0, Math.random() * 40 - 20, 0],
                    opacity: [0.3, 0.7, 0.3],
                  }}
                  transition={{
                    duration: 3 + i * 0.5,
                    repeat: Infinity,
                    delay: i * 0.5,
                  }}
                  style={{
                    left: `${10 + i * 15}%`,
                    top: `${20 + i * 10}%`,
                  }}
                />
              ))}
              <div className="relative z-10">
                <motion.h3
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="text-3xl md:text-4xl font-bold text-white mb-6"
                >
                  Ready to Transform Your Vision?
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-teal-100 text-xl mb-8 max-w-2xl mx-auto"
                >
                  Join thousands of successful entrepreneurs who started their journey with us
                </motion.p>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white text-teal-600 px-10 py-4 rounded-2xl font-bold text-lg shadow-2xl transition-all duration-300 hover:bg-gray-50"
                >
                  Start Your Journey Today →
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}