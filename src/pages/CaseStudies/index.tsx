import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const caseStudies = [
  {
    company: "TechStart Inc.",
    industry: "Technology",
    challenge: "Needed to launch a SaaS product within 3 months",
    solution: "Used our comprehensive planning and implementation roadmap",
    results: [
      "Launched 2 weeks ahead of schedule",
      "Secured $500K in seed funding",
      "Reached 1,000 users in first month",
    ],
    icon: "💻",
  },
  {
    company: "GreenEnergy Solutions",
    industry: "Clean Energy",
    challenge: "Navigating complex regulatory requirements",
    solution: "Leveraged our research-backed compliance guidance",
    results: [
      "Obtained all necessary permits in record time",
      "Complied with 100% of regulatory requirements",
      "Expanded to 3 new states",
    ],
    icon: "🌱",
  },
  {
    company: "HealthCare Plus",
    industry: "Healthcare",
    challenge: "Scaling from startup to enterprise",
    solution: "Implemented enterprise-grade planning and execution",
    results: [
      "Scaled from 10 to 200 employees",
      "Increased revenue by 400%",
      "Maintained 95% customer satisfaction",
    ],
    icon: "🏥",
  },
  {
    company: "Retail Revolution",
    industry: "E-commerce",
    challenge: "Building omnichannel presence",
    solution: "Followed our multi-phase implementation roadmap",
    results: [
      "Launched online and physical stores simultaneously",
      "Achieved $2M in first-year revenue",
      "Expanded to 5 locations",
    ],
    icon: "🛍️",
  },
  {
    company: "FinTech Innovations",
    industry: "Financial Services",
    challenge: "Meeting strict compliance requirements",
    solution: "Used our specialized compliance and legal guidance",
    results: [
      "Passed all regulatory audits",
      "Secured banking partnerships",
      "Processed $10M in transactions",
    ],
    icon: "💳",
  },
  {
    company: "FoodTech Ventures",
    industry: "Food & Beverage",
    challenge: "Rapid expansion across multiple markets",
    solution: "Implemented our scalable growth strategy",
    results: [
      "Expanded to 15 cities",
      "Increased production capacity by 500%",
      "Achieved profitability in 8 months",
    ],
    icon: "🍔",
  },
];

export default function CaseStudies() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [selectedCase, setSelectedCase] = useState(0);

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
              <span className="text-teal-600 font-medium text-sm">📊 Success Stories</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-teal-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6 leading-tight">
              Case Studies
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed font-light">
              Real success stories from businesses that transformed their ideas into 
              <span className="font-semibold text-teal-600"> thriving ventures</span> with our platform
            </p>
          </div>

          {/* Case Studies Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {caseStudies.map((study, index) => (
              <div
                key={index}
                onClick={() => setSelectedCase(index)}
                className={`bg-white/80 backdrop-blur-xl border-2 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer ${
                  selectedCase === index
                    ? 'border-teal-500 scale-105'
                    : 'border-white/40 hover:scale-102'
                }`}
              >
                <div className="text-5xl mb-4">{study.icon}</div>
                <h3 className="text-2xl font-bold text-teal-700 mb-2">{study.company}</h3>
                <p className="text-sm text-gray-500 mb-4">{study.industry}</p>
                <p className="text-gray-600 mb-4">
                  <strong className="text-teal-600">Challenge:</strong> {study.challenge}
                </p>
                <p className="text-gray-600 mb-4">
                  <strong className="text-teal-600">Solution:</strong> {study.solution}
                </p>
                <div className="mt-4">
                  <p className="text-sm font-semibold text-teal-700 mb-2">Results:</p>
                  <ul className="space-y-1">
                    {study.results.map((result, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start">
                        <span className="text-teal-500 mr-2">✓</span>
                        {result}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Stats Section */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/30 rounded-3xl p-8 md:p-12 shadow-2xl mb-20">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="space-y-2">
                <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                  1,000+
                </div>
                <p className="text-gray-600 font-medium">Success Stories</p>
              </div>
              <div className="space-y-2">
                <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  95%
                </div>
                <p className="text-gray-600 font-medium">Success Rate</p>
              </div>
              <div className="space-y-2">
                <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-indigo-600 to-teal-600 bg-clip-text text-transparent">
                  $50M+
                </div>
                <p className="text-gray-600 font-medium">Revenue Generated</p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-teal-500 to-blue-500 rounded-3xl p-12 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-600/20 to-blue-600/20 backdrop-blur-sm" />
              <div className="relative z-10">
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  Ready to Write Your Success Story?
                </h3>
                <p className="text-teal-100 text-xl mb-8 max-w-2xl mx-auto">
                  Join thousands of successful businesses that started their journey with us
                </p>
                <Link
                  to="/signup"
                  className="inline-block bg-white text-teal-600 px-10 py-4 rounded-2xl font-bold text-lg hover:scale-105 hover:shadow-2xl transition-all duration-300 hover:bg-gray-50"
                >
                  Start Your Journey →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}







