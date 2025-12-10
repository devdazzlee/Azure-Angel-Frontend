import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const solutions = [
  {
    title: "Enterprise-Grade Planning",
    icon: "🏢",
    description: "Comprehensive business planning solutions designed for large-scale operations and complex organizational structures.",
  },
  {
    title: "Multi-Department Coordination",
    icon: "👥",
    description: "Coordinate planning across multiple departments with centralized guidance and consistent methodologies.",
  },
  {
    title: "Scalable Implementation",
    icon: "📈",
    description: "Implementation roadmaps that scale with your organization, from initial setup to full deployment.",
  },
  {
    title: "Compliance & Risk Management",
    icon: "🛡️",
    description: "Stay compliant with industry regulations and manage risks with research-backed compliance frameworks.",
  },
  {
    title: "Custom Integration",
    icon: "🔗",
    description: "Integrate with your existing enterprise systems and workflows for seamless adoption.",
  },
  {
    title: "Dedicated Support",
    icon: "🎯",
    description: "Priority support and dedicated resources to ensure your enterprise needs are met.",
  },
];

const enterpriseFeatures = [
  "Multi-user collaboration and team management",
  "Advanced analytics and reporting",
  "Custom workflow configuration",
  "API access for system integration",
  "Dedicated account management",
  "SLA guarantees and priority support",
];

export default function Enterprise() {
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
              <span className="text-teal-600 font-medium text-sm">🏢 Enterprise Solutions</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-teal-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6 leading-tight">
              Enterprise
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed font-light">
              Powerful business planning and implementation solutions for 
              <span className="font-semibold text-teal-600"> large organizations</span> and enterprise teams
            </p>
          </div>

          {/* Solutions Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {solutions.map((solution, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <div className="text-5xl mb-4">{solution.icon}</div>
                <h3 className="text-2xl font-bold text-teal-700 mb-4">{solution.title}</h3>
                <p className="text-gray-600 leading-relaxed">{solution.description}</p>
              </div>
            ))}
          </div>

          {/* Enterprise Features */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/30 rounded-3xl p-8 md:p-12 shadow-2xl mb-20">
            <h2 className="text-4xl font-bold text-center text-teal-700 mb-12">
              Enterprise Features
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {enterpriseFeatures.map((feature, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">✓</span>
                  </div>
                  <p className="text-lg text-gray-700">{feature}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Section */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/30 rounded-3xl p-8 md:p-12 shadow-2xl mb-20">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="space-y-2">
                <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                  500+
                </div>
                <p className="text-gray-600 font-medium">Enterprise Clients</p>
              </div>
              <div className="space-y-2">
                <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  99.9%
                </div>
                <p className="text-gray-600 font-medium">Uptime SLA</p>
              </div>
              <div className="space-y-2">
                <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-indigo-600 to-teal-600 bg-clip-text text-transparent">
                  24/7
                </div>
                <p className="text-gray-600 font-medium">Enterprise Support</p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-teal-500 to-blue-500 rounded-3xl p-12 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-600/20 to-blue-600/20 backdrop-blur-sm" />
              <div className="relative z-10">
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  Ready to Transform Your Enterprise?
                </h3>
                <p className="text-teal-100 text-xl mb-8 max-w-2xl mx-auto">
                  Contact our enterprise team to discuss custom solutions for your organization
                </p>
                <Link
                  to="/contact"
                  className="inline-block bg-white text-teal-600 px-10 py-4 rounded-2xl font-bold text-lg hover:scale-105 hover:shadow-2xl transition-all duration-300 hover:bg-gray-50"
                >
                  Contact Enterprise Sales →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}







