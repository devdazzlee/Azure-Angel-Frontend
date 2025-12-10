import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const partnerTypes = [
  {
    title: "Technology Partners",
    icon: "💻",
    description: "Integrate with leading technology platforms and tools to enhance your business capabilities.",
    benefits: [
      "API access and integrations",
      "Co-marketing opportunities",
      "Technical support and resources",
    ],
  },
  {
    title: "Service Providers",
    icon: "🤝",
    description: "Connect with trusted service providers recommended through our platform.",
    benefits: [
      "Verified provider network",
      "Preferred pricing",
      "Quality assurance",
    ],
  },
  {
    title: "Consulting Partners",
    icon: "📊",
    description: "Partner with expert consultants who specialize in business planning and implementation.",
    benefits: [
      "Expert guidance",
      "Industry-specific knowledge",
      "Strategic planning support",
    ],
  },
  {
    title: "Financial Partners",
    icon: "💰",
    description: "Access funding opportunities and financial services through our partner network.",
    benefits: [
      "Funding connections",
      "Financial planning tools",
      "Investment opportunities",
    ],
  },
  {
    title: "Educational Partners",
    icon: "🎓",
    description: "Collaborate with educational institutions to provide training and resources.",
    benefits: [
      "Training programs",
      "Educational resources",
      "Certification programs",
    ],
  },
  {
    title: "Marketing Partners",
    icon: "📢",
    description: "Partner with marketing agencies to boost your brand and reach.",
    benefits: [
      "Marketing expertise",
      "Brand development",
      "Digital marketing support",
    ],
  },
];

const partnershipBenefits = [
  "Expand your reach and customer base",
  "Access to exclusive resources and tools",
  "Co-marketing and promotional opportunities",
  "Technical support and integration assistance",
  "Revenue sharing opportunities",
  "Priority customer referrals",
];

export default function Partners() {
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
              <span className="text-teal-600 font-medium text-sm">🤝 Partnership Program</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-teal-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6 leading-tight">
              Partners
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed font-light">
              Join our partner ecosystem and 
              <span className="font-semibold text-teal-600"> grow together</span> with mutually beneficial partnerships
            </p>
          </div>

          {/* Partner Types Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {partnerTypes.map((partner, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <div className="text-5xl mb-4">{partner.icon}</div>
                <h3 className="text-2xl font-bold text-teal-700 mb-4">{partner.title}</h3>
                <p className="text-gray-600 leading-relaxed mb-4">{partner.description}</p>
                <ul className="space-y-2">
                  {partner.benefits.map((benefit, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start">
                      <span className="text-teal-500 mr-2">✓</span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Partnership Benefits */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/30 rounded-3xl p-8 md:p-12 shadow-2xl mb-20">
            <h2 className="text-4xl font-bold text-center text-teal-700 mb-12">
              Partnership Benefits
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {partnershipBenefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">✓</span>
                  </div>
                  <p className="text-lg text-gray-700">{benefit}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Section */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/30 rounded-3xl p-8 md:p-12 shadow-2xl mb-20">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="space-y-2">
                <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                  200+
                </div>
                <p className="text-gray-600 font-medium">Active Partners</p>
              </div>
              <div className="space-y-2">
                <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  50+
                </div>
                <p className="text-gray-600 font-medium">Partner Categories</p>
              </div>
              <div className="space-y-2">
                <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-indigo-600 to-teal-600 bg-clip-text text-transparent">
                  1000+
                </div>
                <p className="text-gray-600 font-medium">Partner Referrals</p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-teal-500 to-blue-500 rounded-3xl p-12 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-600/20 to-blue-600/20 backdrop-blur-sm" />
              <div className="relative z-10">
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  Become a Partner Today
                </h3>
                <p className="text-teal-100 text-xl mb-8 max-w-2xl mx-auto">
                  Join our growing partner network and unlock new opportunities for growth
                </p>
                <Link
                  to="/contact"
                  className="inline-block bg-white text-teal-600 px-10 py-4 rounded-2xl font-bold text-lg hover:scale-105 hover:shadow-2xl transition-all duration-300 hover:bg-gray-50"
                >
                  Apply to Become a Partner →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}







