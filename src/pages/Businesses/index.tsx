import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const businessTypes = [
  {
    title: "Startups",
    description: "Perfect for new businesses looking to launch quickly with comprehensive planning and implementation support.",
    icon: "🚀",
    link: "/startups",
    features: [
      "Rapid business planning",
      "AI-powered guidance",
      "Step-by-step roadmaps",
      "24/7 support",
    ],
  },
  {
    title: "Enterprise",
    description: "Scalable solutions for large organizations with complex needs and multi-department coordination.",
    icon: "🏢",
    link: "/enterprise",
    features: [
      "Enterprise-grade planning",
      "Multi-user collaboration",
      "Custom integrations",
      "Dedicated support",
    ],
  },
  {
    title: "Case Studies",
    description: "Real success stories from businesses that transformed their ideas into thriving ventures.",
    icon: "📊",
    link: "/case-studies",
    features: [
      "Success stories",
      "Industry insights",
      "Proven strategies",
      "Results & metrics",
    ],
  },
  {
    title: "Partners",
    description: "Join our partner ecosystem and grow together with mutually beneficial partnerships.",
    icon: "🤝",
    link: "/partners",
    features: [
      "Technology partners",
      "Service providers",
      "Co-marketing opportunities",
      "Revenue sharing",
    ],
  },
];

const benefits = [
  {
    title: "Comprehensive Planning",
    description: "Get complete business plans tailored to your industry and business model.",
    icon: "📋",
  },
  {
    title: "Research-Backed Guidance",
    description: "All recommendations based on government sources, academic research, and industry reports.",
    icon: "📚",
  },
  {
    title: "Implementation Support",
    description: "Don't just plan—execute with step-by-step implementation guidance.",
    icon: "⚙️",
  },
  {
    title: "24/7 AI Assistance",
    description: "Get instant answers and guidance from our AI assistant, Angel, anytime.",
    icon: "🤖",
  },
];

export default function Businesses() {
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
              <span className="text-teal-600 font-medium text-sm">💼 Business Solutions</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-teal-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6 leading-tight">
              Businesses
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed font-light">
              Comprehensive solutions for businesses of all sizes, from 
              <span className="font-semibold text-teal-600"> startups to enterprises</span>
            </p>
          </div>

          {/* Business Types Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            {businessTypes.map((type, index) => (
              <Link
                key={index}
                to={type.link}
                className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer group"
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">{type.icon}</div>
                <h3 className="text-2xl font-bold text-teal-700 mb-4">{type.title}</h3>
                <p className="text-gray-600 leading-relaxed mb-6">{type.description}</p>
                <ul className="space-y-2 mb-6">
                  {type.features.map((feature, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start">
                      <span className="text-teal-500 mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="text-teal-600 font-semibold group-hover:text-teal-700 transition-colors flex items-center gap-2">
                  Learn More
                  <span className="group-hover:translate-x-2 transition-transform">→</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Benefits Section */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/30 rounded-3xl p-8 md:p-12 shadow-2xl mb-20">
            <h2 className="text-4xl font-bold text-center text-teal-700 mb-12">
              Why Choose Our Business Solutions?
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="text-center">
                  <div className="text-5xl mb-4">{benefit.icon}</div>
                  <h3 className="text-xl font-bold text-teal-700 mb-3">{benefit.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                </div>
              ))}
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
                  200+
                </div>
                <p className="text-gray-600 font-medium">Partners</p>
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
                  Ready to Transform Your Business?
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







