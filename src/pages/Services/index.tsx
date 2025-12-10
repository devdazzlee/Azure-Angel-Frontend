import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const services = [
  {
    title: "Business Planning",
    description: "Comprehensive business plan creation with AI-powered guidance tailored to your industry and business model.",
    icon: "📋",
    features: [
      "Industry-specific templates",
      "Financial projections",
      "Market analysis",
      "Competitive research",
    ],
    link: "/learn-more",
  },
  {
    title: "Roadmap Creation",
    description: "Detailed, phase-by-phase roadmaps that guide you from idea to launch with clear milestones and timelines.",
    icon: "🗺️",
    features: [
      "5-phase roadmap structure",
      "Research-backed recommendations",
      "Timeline management",
      "Resource allocation",
    ],
    link: "/learn-more",
  },
  {
    title: "Implementation Support",
    description: "Step-by-step implementation guidance with real-time assistance to help you execute your plans successfully.",
    icon: "⚙️",
    features: [
      "Task management",
      "Progress tracking",
      "Service provider recommendations",
      "Completion workflows",
    ],
    link: "/learn-more",
  },
  {
    title: "Legal & Compliance",
    description: "Navigate complex legal requirements with research-backed guidance on regulations and compliance.",
    icon: "⚖️",
    features: [
      "Business structure guidance",
      "Regulatory compliance",
      "Legal document templates",
      "Compliance checklists",
    ],
    link: "/learn-more",
  },
  {
    title: "Financial Planning",
    description: "Comprehensive financial planning tools and guidance to help you manage your business finances effectively.",
    icon: "💰",
    features: [
      "Financial projections",
      "Budget planning",
      "Funding guidance",
      "Cash flow management",
    ],
    link: "/learn-more",
  },
  {
    title: "Marketing Strategy",
    description: "Create winning marketing strategies that drive growth without breaking the bank.",
    icon: "📢",
    features: [
      "Marketing plan creation",
      "Brand development",
      "Digital marketing guidance",
      "Customer acquisition strategies",
    ],
    link: "/learn-more",
  },
  {
    title: "AI-Powered Assistance",
    description: "24/7 access to our AI assistant, Angel, for instant answers and personalized guidance.",
    icon: "🤖",
    features: [
      "24/7 availability",
      "Instant responses",
      "Personalized guidance",
      "Multi-language support",
    ],
    link: "/learn-more",
  },
  {
    title: "Expert Consultation",
    description: "Access to specialized agents and experts for domain-specific guidance and support.",
    icon: "👥",
    features: [
      "Specialized agents",
      "Expert consultations",
      "Industry-specific advice",
      "Strategic planning support",
    ],
    link: "/learn-more",
  },
];

const processSteps = [
  {
    step: "1",
    title: "Sign Up & Create Venture",
    description: "Create your account and start a new venture. Our system will guide you through the initial setup.",
    icon: "🚀",
  },
  {
    step: "2",
    title: "Answer Key Questions",
    description: "Complete our KYC questionnaire to help us understand your business needs and goals.",
    icon: "📝",
  },
  {
    step: "3",
    title: "Get Your Business Plan",
    description: "Receive a comprehensive, research-backed business plan tailored to your industry and business model.",
    icon: "📋",
  },
  {
    step: "4",
    title: "Follow Your Roadmap",
    description: "Get a detailed roadmap with clear phases, milestones, and actionable steps to launch your business.",
    icon: "🗺️",
  },
  {
    step: "5",
    title: "Implement & Execute",
    description: "Use our implementation tools to track progress, get help, and complete tasks step by step.",
    icon: "⚙️",
  },
  {
    step: "6",
    title: "Launch & Grow",
    description: "Launch your business with confidence and continue growing with ongoing support and guidance.",
    icon: "🎯",
  },
];

export default function Services() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

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
              <span className="text-teal-600 font-medium text-sm">✨ Our Services</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-teal-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6 leading-tight">
              Services
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed font-light">
              Comprehensive business services to help you 
              <span className="font-semibold text-teal-600"> plan, launch, and grow</span> your business successfully
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <div className="text-5xl mb-4">{service.icon}</div>
                <h3 className="text-2xl font-bold text-teal-700 mb-4">{service.title}</h3>
                <p className="text-gray-600 leading-relaxed mb-6">{service.description}</p>
                <ul className="space-y-2 mb-6">
                  {service.features.map((feature, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start">
                      <span className="text-teal-500 mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  to={service.link}
                  className="text-teal-600 font-semibold hover:text-teal-700 transition-colors flex items-center gap-2"
                >
                  Learn More
                  <span className="hover:translate-x-2 transition-transform">→</span>
                </Link>
              </div>
            ))}
          </div>

          {/* Process Section */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/30 rounded-3xl p-8 md:p-12 shadow-2xl mb-20">
            <h2 className="text-4xl font-bold text-center text-teal-700 mb-12">
              How It Works
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {processSteps.map((step, index) => (
                <div
                  key={index}
                  className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {step.step}
                    </div>
                    <div className="text-3xl">{step.icon}</div>
                  </div>
                  <h3 className="text-xl font-bold text-teal-700 mb-3">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits Section */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/30 rounded-3xl p-8 md:p-12 shadow-2xl mb-20">
            <h2 className="text-4xl font-bold text-center text-teal-700 mb-12">
              Why Choose Our Services?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-5xl mb-4">🎯</div>
                <h3 className="text-xl font-bold text-teal-700 mb-3">Research-Backed</h3>
                <p className="text-gray-600">All recommendations are based on government sources, academic research, and industry reports.</p>
              </div>
              <div className="text-center">
                <div className="text-5xl mb-4">⚡</div>
                <h3 className="text-xl font-bold text-teal-700 mb-3">Fast & Efficient</h3>
                <p className="text-gray-600">Complete your business plan in days, not months. Get results quickly without compromising quality.</p>
              </div>
              <div className="text-center">
                <div className="text-5xl mb-4">🤖</div>
                <h3 className="text-xl font-bold text-teal-700 mb-3">AI-Powered</h3>
                <p className="text-gray-600">Leverage advanced AI technology for personalized guidance and instant support 24/7.</p>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/30 rounded-3xl p-8 md:p-12 shadow-2xl mb-20">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div className="space-y-2">
                <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                  10,000+
                </div>
                <p className="text-gray-600 font-medium">Businesses Served</p>
              </div>
              <div className="space-y-2">
                <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  95%
                </div>
                <p className="text-gray-600 font-medium">Success Rate</p>
              </div>
              <div className="space-y-2">
                <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-indigo-600 to-teal-600 bg-clip-text text-transparent">
                  2-3 Days
                </div>
                <p className="text-gray-600 font-medium">Average Completion</p>
              </div>
              <div className="space-y-2">
                <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-teal-600 to-purple-600 bg-clip-text text-transparent">
                  24/7
                </div>
                <p className="text-gray-600 font-medium">Support Available</p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-teal-500 to-blue-500 rounded-3xl p-12 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-600/20 to-blue-600/20 backdrop-blur-sm" />
              <div className="relative z-10">
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  Ready to Get Started?
                </h3>
                <p className="text-teal-100 text-xl mb-8 max-w-2xl mx-auto">
                  Join thousands of successful businesses that started their journey with us
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/signup"
                    className="inline-block bg-white text-teal-600 px-10 py-4 rounded-2xl font-bold text-lg hover:scale-105 hover:shadow-2xl transition-all duration-300 hover:bg-gray-50"
                  >
                    Get Started →
                  </Link>
                  <Link
                    to="/learn-more"
                    className="inline-block bg-transparent border-2 border-white text-white px-10 py-4 rounded-2xl font-bold text-lg hover:scale-105 hover:bg-white/10 transition-all duration-300"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}







