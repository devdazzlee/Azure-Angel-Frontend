import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const blogPosts = [
  {
    title: "10 Essential Steps to Launch Your Startup",
    excerpt: "Discover the key steps every entrepreneur should take when launching their startup, from idea validation to market entry.",
    author: "Angel Team",
    date: "March 15, 2024",
    category: "Startups",
    readTime: "5 min read",
    icon: "🚀",
  },
  {
    title: "Understanding Business Structures: LLC vs Corporation",
    excerpt: "A comprehensive guide to choosing the right business structure for your venture, with pros and cons of each option.",
    author: "Legal Expert",
    date: "March 10, 2024",
    category: "Legal",
    readTime: "8 min read",
    icon: "⚖️",
  },
  {
    title: "Funding Your Business: A Complete Guide",
    excerpt: "Explore various funding options available to entrepreneurs, from bootstrapping to venture capital.",
    author: "Finance Advisor",
    date: "March 5, 2024",
    category: "Finance",
    readTime: "10 min read",
    icon: "💰",
  },
  {
    title: "Marketing Strategies for New Businesses",
    excerpt: "Learn effective marketing strategies that work for startups and small businesses on a budget.",
    author: "Marketing Pro",
    date: "February 28, 2024",
    category: "Marketing",
    readTime: "7 min read",
    icon: "📢",
  },
  {
    title: "Compliance Made Simple: A Beginner's Guide",
    excerpt: "Navigate the complex world of business compliance with our simplified guide to regulations and requirements.",
    author: "Compliance Expert",
    date: "February 20, 2024",
    category: "Compliance",
    readTime: "6 min read",
    icon: "🛡️",
  },
  {
    title: "Scaling Your Business: From Startup to Enterprise",
    excerpt: "Key strategies and considerations for scaling your business from a small startup to a large enterprise.",
    author: "Growth Strategist",
    date: "February 15, 2024",
    category: "Growth",
    readTime: "9 min read",
    icon: "📈",
  },
];

const categories = ["All", "Startups", "Legal", "Finance", "Marketing", "Compliance", "Growth"];

export default function Blog() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    const handleMouseMove = (e: { clientX: any; clientY: any; }) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const filteredPosts = selectedCategory === "All" 
    ? blogPosts 
    : blogPosts.filter(post => post.category === selectedCategory);

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
              <span className="text-teal-600 font-medium text-sm">📝 Latest Insights</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-teal-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6 leading-tight">
              Blog
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed font-light">
              Expert insights, tips, and guides to help you 
              <span className="font-semibold text-teal-600"> build and grow your business</span>
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

          {/* Blog Posts Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {filteredPosts.map((post, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer"
              >
                <div className="text-5xl mb-4">{post.icon}</div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
                    {post.category}
                  </span>
                  <span className="text-xs text-gray-500">{post.readTime}</span>
                </div>
                <h3 className="text-2xl font-bold text-teal-700 mb-3">{post.title}</h3>
                <p className="text-gray-600 leading-relaxed mb-4">{post.excerpt}</p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{post.author}</p>
                    <p className="text-xs text-gray-500">{post.date}</p>
                  </div>
                  <button className="text-teal-600 font-semibold hover:text-teal-700 transition-colors">
                    Read More →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Newsletter Signup */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-teal-500 to-blue-500 rounded-3xl p-12 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-600/20 to-blue-600/20 backdrop-blur-sm" />
              <div className="relative z-10">
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  Stay Updated with Our Latest Posts
                </h3>
                <p className="text-teal-100 text-xl mb-8 max-w-2xl mx-auto">
                  Subscribe to our newsletter and never miss an update
                </p>
                <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-6 py-4 rounded-2xl border-none focus:outline-none focus:ring-2 focus:ring-white"
                  />
                  <button className="bg-white text-teal-600 px-8 py-4 rounded-2xl font-bold hover:scale-105 hover:shadow-2xl transition-all duration-300">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}







