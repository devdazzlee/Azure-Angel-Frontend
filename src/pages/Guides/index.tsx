import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const guides = [
  {
    title: "Complete Startup Guide",
    description: "A comprehensive step-by-step guide from idea to launch, covering all aspects of starting a business.",
    category: "Startups",
    difficulty: "Beginner",
    duration: "2-3 hours",
    icon: "🚀",
    steps: 12,
  },
  {
    title: "Business Plan Writing Guide",
    description: "Learn how to write a professional business plan that investors and stakeholders will love.",
    category: "Planning",
    difficulty: "Intermediate",
    duration: "3-4 hours",
    icon: "📋",
    steps: 15,
  },
  {
    title: "Legal Compliance Guide",
    description: "Navigate the legal requirements for your business type and location with confidence.",
    category: "Legal",
    difficulty: "Intermediate",
    duration: "1-2 hours",
    icon: "⚖️",
    steps: 8,
  },
  {
    title: "Funding & Finance Guide",
    description: "Understand your funding options and learn how to manage your business finances effectively.",
    category: "Finance",
    difficulty: "Intermediate",
    duration: "2-3 hours",
    icon: "💰",
    steps: 10,
  },
  {
    title: "Marketing Strategy Guide",
    description: "Create a winning marketing strategy that drives growth without breaking the bank.",
    category: "Marketing",
    difficulty: "Beginner",
    duration: "1-2 hours",
    icon: "📢",
    steps: 7,
  },
  {
    title: "Scaling Your Business Guide",
    description: "Strategies and best practices for scaling your business from startup to enterprise.",
    category: "Growth",
    difficulty: "Advanced",
    duration: "3-4 hours",
    icon: "📈",
    steps: 14,
  },
];

const categories = ["All", "Startups", "Planning", "Legal", "Finance", "Marketing", "Growth"];

export default function Guides() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    const handleMouseMove = (e: { clientX: any; clientY: any; }) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const filteredGuides = selectedCategory === "All" 
    ? guides 
    : guides.filter(guide => guide.category === selectedCategory);

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
              <span className="text-teal-600 font-medium text-sm">📖 Step-by-Step Guides</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-teal-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6 leading-tight">
              Guides
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed font-light">
              Comprehensive, easy-to-follow guides to help you 
              <span className="font-semibold text-teal-600"> succeed at every stage</span> of your business journey
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-lg scale-105'
                    : 'bg-white/80 backdrop-blur-xl border border-white/40 text-gray-700 hover:scale-105'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Guides Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {filteredGuides.map((guide, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer"
              >
                <div className="text-5xl mb-4">{guide.icon}</div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
                    {guide.category}
                  </span>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    guide.difficulty === "Beginner" ? "bg-green-100 text-green-700" :
                    guide.difficulty === "Intermediate" ? "bg-yellow-100 text-yellow-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {guide.difficulty}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-teal-700 mb-3">{guide.title}</h3>
                <p className="text-gray-600 leading-relaxed mb-4">{guide.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>⏱️ {guide.duration}</span>
                    <span>📝 {guide.steps} steps</span>
                  </div>
                  <button className="text-teal-600 font-semibold hover:text-teal-700 transition-colors">
                    Start Guide →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-teal-500 to-blue-500 rounded-3xl p-12 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-600/20 to-blue-600/20 backdrop-blur-sm" />
              <div className="relative z-10">
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  Need More Help?
                </h3>
                <p className="text-teal-100 text-xl mb-8 max-w-2xl mx-auto">
                  Our support team is here to assist you with any questions
                </p>
                <Link
                  to="/support"
                  className="inline-block bg-white text-teal-600 px-10 py-4 rounded-2xl font-bold text-lg hover:scale-105 hover:shadow-2xl transition-all duration-300 hover:bg-gray-50"
                >
                  Get Support →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}







