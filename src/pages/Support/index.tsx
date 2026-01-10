import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const faqs = [
  // Getting Started
  {
    question: "What is Founderport?",
    answer: "Founderport helps you turn a business idea into a clear plan and a step-by-step path to launch. Angel, our guide, walks with you through the process so you're never guessing what to do next.",
    category: "Getting Started",
  },
  {
    question: "Do my answers need to be perfect?",
    answer: "No. Founderport is built for early ideas that get better over time. Most founders change their answers as they learn — that's expected and encouraged.",
    category: "Getting Started",
  },
  {
    question: "Does Founderport guarantee the success of my business?",
    answer: "No. Founderport does not promise success. It offers guidance and information to support your planning process, but your results depend on your decisions, effort, and external factors.",
    category: "Getting Started",
  },
  // Your Idea & Privacy
  {
    question: "Do I own my business idea if I use Founderport?",
    answer: "Yes. Your idea is yours — period. We don't share it, sell it, or use it to build our own business. For more information on how we use customer data, see our Privacy Policy and Terms and Conditions. Founderport exists to support founders, not compete with them.",
    category: "Your Idea & Privacy",
  },
  // About Angel
  {
    question: "What is Angel?",
    answer: "Angel is your guide inside Founderport. Angel asks questions, gives feedback, and helps you think clearly about your business so the guidance fits your idea — not a generic template.",
    category: "About Angel",
  },
  {
    question: "Why does Angel ask so many questions?",
    answer: "The questions help Angel understand your business so the roadmap and guidance are personalized. There are no trick questions — honest answers work best. If you're unsure, that's okay. Angel helps you think it through.",
    category: "About Angel",
  },
  {
    question: "Can Angel be wrong sometimes?",
    answer: "Yes. Angel gives guidance based on what you share and common entrepreneurial patterns. It is designed to help you think critically — not to replace your judgment or outside experts.",
    category: "About Angel",
  },
  // Plans, Pricing & Subscription
  {
    question: "What do I get for free vs. paid?",
    answer: "You can answer questions and create a business plan for free. The paid plan unlocks your ability to download the full plan, a personalized roadmap, and step-by-step business launch guidance — this is where your business starts to come to life.",
    category: "Plans, Pricing & Subscription",
  },
  {
    question: "How much does Founderport Premium cost?",
    answer: "Founderport premium costs $20 per month.",
    category: "Plans, Pricing & Subscription",
  },
  {
    question: "How do I cancel my subscription?",
    answer: "You can cancel anytime from your account settings. Your subscription will remain active for the remainder of your paid period and will not auto renew once cancelled. Once you cancel, you won't be charged again.",
    category: "Plans, Pricing & Subscription",
  },
  {
    question: "Will I lose my work if I cancel?",
    answer: "No. Your answers stay saved. You'll lose access to paid features, but you can return later and pick up where you left off.",
    category: "Plans, Pricing & Subscription",
  },
  // Editing, Errors & Troubleshooting
  {
    question: "Can I go back and change my answers?",
    answer: "Yes. You can update your answers at any time. Changing answers won't break your plan — it usually makes it stronger.",
    category: "Editing, Errors & Troubleshooting",
  },
  {
    question: "Something didn't save — what should I do?",
    answer: "First, refresh the page and check again. If it still looks wrong, contact us and tell us: What question you were on, What you were trying to do. We'll help you fix it.",
    category: "Editing, Errors & Troubleshooting",
  },
  {
    question: "Why can't I go back to a previous page sometimes?",
    answer: "Some steps are designed to keep you moving forward. You'll still be able to review and edit answers later — nothing is locked forever.",
    category: "Editing, Errors & Troubleshooting",
  },
  // Expectations & Support
  {
    question: "Is Founderport a lawyer, accountant, or investor?",
    answer: "No. Founderport provides guidance and education, not legal or financial advice. For legal, tax, or licensing needs, Angel may suggest getting help from a qualified professional.",
    category: "Expectations & Support",
  },
  {
    question: "What kinds of businesses work best with Founderport?",
    answer: "Founderport works best for solo founders and small teams starting a new business in any industries — especially if you want structure and guidance.",
    category: "Expectations & Support",
  },
  {
    question: "How do I contact Founderport if I still need help?",
    answer: "If you can't find your answer here, use the contact form and tell us what's going on. We will respond within 2 business days. We read every message and do our best to help.",
    category: "Expectations & Support",
  },
];

const supportOptions = [
  {
    title: "Live Chat",
    description: "Get instant help from our AI assistant or support team",
    icon: "💬",
    available: "24/7",
  },
  {
    title: "Email Support",
    description: "Send us an email and we'll respond within 24 hours",
    icon: "📧",
    available: "24/7",
  },
  {
    title: "Documentation",
    description: "Browse our comprehensive documentation and guides",
    icon: "📚",
    available: "Always",
  },
  {
    title: "Video Tutorials",
    description: "Watch step-by-step video tutorials for common tasks",
    icon: "🎥",
    available: "Always",
  },
];

export default function Support() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: { clientX: any; clientY: any; }) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-50 relative overflow-hidden pt-20">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute w-96 h-96 bg-gradient-to-r from-teal-200/30 to-blue-200/30 rounded-full blur-3xl transition-transform duration-1000 ease-out"
          style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
            left: '10%',
            top: '20%',
          }}
        />
        <div 
          className="absolute w-80 h-80 bg-gradient-to-r from-blue-200/20 to-indigo-200/20 rounded-full blur-3xl transition-transform duration-1000 ease-out"
          style={{
            transform: `translate(${mousePosition.x * -0.015}px, ${mousePosition.y * -0.015}px)`,
            right: '10%',
            bottom: '20%',
          }}
        />
      </div>

      <div className="relative z-10 py-20 px-4 md:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-20">
            <div className="inline-block bg-white/80 backdrop-blur-xl border border-white/40 rounded-full px-6 py-2 mb-6 shadow-lg">
              <span className="text-teal-600 font-medium text-sm">💬 We're Here to Help</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-teal-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6 leading-tight">
              FAQ & Contact Us
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed font-light">
              Find answers to common questions or 
              <span className="font-semibold text-teal-600"> get in touch with our team</span>
            </p>
          </div>

          {/* Support Options Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            {supportOptions.map((option, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 text-center"
              >
                <div className="text-5xl mb-4">{option.icon}</div>
                <h3 className="text-xl font-bold text-teal-700 mb-2">{option.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{option.description}</p>
                <span className="text-xs text-teal-600 font-semibold">Available {option.available}</span>
              </div>
            ))}
          </div>

          {/* FAQ Section with Search */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/30 rounded-3xl p-8 md:p-12 shadow-2xl mb-20">
            <h2 className="text-4xl font-bold text-center text-teal-700 mb-8">
              Frequently Asked Questions
            </h2>
            <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
              Browse our comprehensive FAQ or search for specific topics
            </p>
            
            {/* Category Filter */}
            <div className="flex flex-wrap gap-3 justify-center mb-8">
              {['All', 'Getting Started', 'Your Idea & Privacy', 'About Angel', 'Plans, Pricing & Subscription', 'Editing, Errors & Troubleshooting', 'Expectations & Support'].map((category) => (
                <button
                  key={category}
                  className="px-4 py-2 rounded-full bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors text-sm font-medium"
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-6 shadow-lg cursor-pointer hover:shadow-xl transition-all"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
                          {faq.category}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{faq.question}</h3>
                      {openFaq === index && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-gray-600 leading-relaxed mt-3"
                        >
                          {faq.answer}
                        </motion.p>
                      )}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="ml-4 text-2xl text-teal-600 flex-shrink-0"
                    >
                      {openFaq === index ? "−" : "+"}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-teal-500 to-blue-500 rounded-3xl p-12 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-600/20 to-blue-600/20 backdrop-blur-sm" />
              <div className="relative z-10 max-w-2xl mx-auto">
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  Contact Us
                </h3>
                <p className="text-teal-100 text-xl mb-4">
                  Have a question that's not answered above? We're here to help!
                </p>
                <p className="text-teal-200 text-sm mb-8">
                  Email us at <a href="mailto:support@founderport.ai" className="underline font-semibold">support@founderport.ai</a> or fill out the form below
                </p>
                <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-8">
                  <form className="space-y-4">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Your Name</label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        required
                        className="w-full px-6 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Your Email</label>
                      <input
                        type="email"
                        placeholder="john@example.com"
                        required
                        className="w-full px-6 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Subject</label>
                      <select className="w-full px-6 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all">
                        <option>General Inquiry</option>
                        <option>Technical Support</option>
                        <option>Billing Question</option>
                        <option>Feature Request</option>
                        <option>Bug Report</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">How can we help you?</label>
                      <textarea
                        placeholder="Please describe your question or issue in detail..."
                        rows={5}
                        required
                        className="w-full px-6 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all resize-none"
                      />
                    </div>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-gradient-to-r from-teal-500 to-blue-500 text-white px-8 py-4 rounded-xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300"
                    >
                      Send Message
                    </motion.button>
                    <p className="text-xs text-gray-500 text-center mt-4">
                      We typically respond within 24 hours. For urgent matters, please email us directly at support@founderport.ai
                    </p>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}







