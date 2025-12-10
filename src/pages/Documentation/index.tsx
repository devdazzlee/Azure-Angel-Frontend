import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const docSections = [
  {
    title: "Getting Started",
    icon: "🚀",
    description: "Learn the basics of using our platform to plan and launch your business.",
    topics: [
      "Creating Your First Venture",
      "Understanding the Planning Process",
      "Navigating the Dashboard",
      "Setting Up Your Profile",
    ],
  },
  {
    title: "Business Planning",
    icon: "📋",
    description: "Comprehensive guides on creating business plans with our AI-powered system.",
    topics: [
      "Business Plan Structure",
      "Industry-Specific Guidance",
      "Financial Projections",
      "Market Analysis",
    ],
  },
  {
    title: "Roadmap Creation",
    icon: "🗺️",
    description: "Step-by-step instructions for building and customizing your launch roadmap.",
    topics: [
      "Roadmap Phases",
      "Milestone Planning",
      "Timeline Management",
      "Resource Allocation",
    ],
  },
  {
    title: "Implementation",
    icon: "⚙️",
    description: "Detailed documentation on executing your business plan and roadmap.",
    topics: [
      "Task Management",
      "Progress Tracking",
      "Service Provider Integration",
      "Completion Workflows",
    ],
  },
  {
    title: "API & Integration",
    icon: "🔌",
    description: "Technical documentation for developers and system integrators.",
    topics: [
      "API Reference",
      "Webhook Setup",
      "Authentication",
      "Rate Limits",
    ],
  },
  {
    title: "Troubleshooting",
    icon: "🔧",
    description: "Common issues and solutions to help you resolve problems quickly.",
    topics: [
      "Common Errors",
      "Performance Issues",
      "Data Recovery",
      "Account Management",
    ],
  },
];

export default function Documentation() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleMouseMove = (e: { clientX: any; clientY: any; }) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const filteredSections = docSections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.topics.some(topic => topic.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
              <span className="text-teal-600 font-medium text-sm">📚 Complete Documentation</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-teal-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6 leading-tight">
              Documentation
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed font-light mb-8">
              Everything you need to know to 
              <span className="font-semibold text-teal-600"> successfully use our platform</span>
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-6 py-4 pl-12 rounded-2xl border border-white/40 bg-white/80 backdrop-blur-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
              </div>
            </div>
          </div>

          {/* Documentation Sections Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {filteredSections.map((section, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer"
              >
                <div className="text-5xl mb-4">{section.icon}</div>
                <h3 className="text-2xl font-bold text-teal-700 mb-4">{section.title}</h3>
                <p className="text-gray-600 leading-relaxed mb-6">{section.description}</p>
                <ul className="space-y-2">
                  {section.topics.map((topic, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start">
                      <span className="text-teal-500 mr-2">•</span>
                      {topic}
                    </li>
                  ))}
                </ul>
                <button className="mt-6 text-teal-600 font-semibold hover:text-teal-700 transition-colors">
                  View Docs →
                </button>
              </div>
            ))}
          </div>

          {/* Quick Links */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/30 rounded-3xl p-8 md:p-12 shadow-2xl mb-20">
            <h2 className="text-4xl font-bold text-center text-teal-700 mb-12">
              Quick Links
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link to="/guides" className="text-center p-6 bg-teal-50 rounded-2xl hover:bg-teal-100 transition-colors">
                <div className="text-4xl mb-2">📖</div>
                <p className="font-semibold text-teal-700">Guides</p>
              </Link>
              <Link to="/support" className="text-center p-6 bg-blue-50 rounded-2xl hover:bg-blue-100 transition-colors">
                <div className="text-4xl mb-2">💬</div>
                <p className="font-semibold text-blue-700">Support</p>
              </Link>
              <Link to="/blog" className="text-center p-6 bg-indigo-50 rounded-2xl hover:bg-indigo-100 transition-colors">
                <div className="text-4xl mb-2">📝</div>
                <p className="font-semibold text-indigo-700">Blog</p>
              </Link>
              <Link to="/contact" className="text-center p-6 bg-purple-50 rounded-2xl hover:bg-purple-100 transition-colors">
                <div className="text-4xl mb-2">📧</div>
                <p className="font-semibold text-purple-700">Contact</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}







