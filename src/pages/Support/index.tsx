import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const faqs = [
  {
    question: "How do I get started with creating a business plan?",
    answer: "Simply sign up for an account, create a new venture, and follow our guided process. Our AI assistant, Angel, will walk you through each step.",
    category: "Getting Started",
  },
  {
    question: "What information do I need to provide?",
    answer: "You'll need basic information about your business idea, industry, location, and goals. Our system will guide you through collecting all necessary details.",
    category: "Getting Started",
  },
  {
    question: "How long does it take to complete a business plan?",
    answer: "Most users complete their business plan in 2-3 days, depending on how much time they can dedicate. The process is designed to be efficient and thorough.",
    category: "Timeline",
  },
  {
    question: "Can I edit my business plan after it's created?",
    answer: "Yes! You can edit and update your business plan at any time. Simply navigate to your venture and make the changes you need.",
    category: "Editing",
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. We use industry-standard encryption and security measures to protect your data. Your information is private and secure.",
    category: "Security",
  },
  {
    question: "What if I need help during the process?",
    answer: "Our AI assistant Angel is available 24/7 to help. You can also access our support team through the support page or contact us directly.",
    category: "Support",
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
              Support
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed font-light">
              Get the help you need to 
              <span className="font-semibold text-teal-600"> succeed with your business</span>
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

          {/* FAQ Section */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/30 rounded-3xl p-8 md:p-12 shadow-2xl mb-20">
            <h2 className="text-4xl font-bold text-center text-teal-700 mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-6 shadow-lg cursor-pointer hover:shadow-xl transition-all"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
                          {faq.category}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{faq.question}</h3>
                      {openFaq === index && (
                        <p className="text-gray-600 leading-relaxed mt-3">{faq.answer}</p>
                      )}
                    </div>
                    <button className="ml-4 text-2xl text-teal-600">
                      {openFaq === index ? "−" : "+"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-teal-500 to-blue-500 rounded-3xl p-12 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-600/20 to-blue-600/20 backdrop-blur-sm" />
              <div className="relative z-10 max-w-2xl mx-auto">
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  Still Need Help?
                </h3>
                <p className="text-teal-100 text-xl mb-8">
                  Contact our support team and we'll get back to you as soon as possible
                </p>
                <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-8">
                  <form className="space-y-4">
                    <input
                      type="text"
                      placeholder="Your Name"
                      className="w-full px-6 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <input
                      type="email"
                      placeholder="Your Email"
                      className="w-full px-6 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <textarea
                      placeholder="How can we help you?"
                      rows={4}
                      className="w-full px-6 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-teal-500 to-blue-500 text-white px-8 py-4 rounded-xl font-bold hover:scale-105 hover:shadow-2xl transition-all duration-300"
                    >
                      Send Message
                    </button>
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

