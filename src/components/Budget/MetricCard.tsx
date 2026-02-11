import React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  subtitle?: string;
  color?: 'blue' | 'green' | 'red' | 'purple' | 'amber' | 'orange';
  delay?: number;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  subtitle, 
  color = 'blue', 
  delay = 0 
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-emerald-500 to-teal-500',
    red: 'from-red-500 to-pink-500',
    purple: 'from-purple-500 to-indigo-500',
    amber: 'from-amber-500 to-orange-500',
    orange: 'from-orange-500 to-red-500',
  };

  const bgGradientClass = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
    >
      {/* Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${bgGradientClass} opacity-5`} />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-r ${bgGradientClass} text-white shadow-lg`}>
            <Icon className="w-6 h-6" />
          </div>
          {trend && (
            <div className={`text-sm font-medium ${
              trend.startsWith('+') ? 'text-emerald-600' : 
              trend.startsWith('-') ? 'text-red-600' : 'text-gray-600'
            }`}>
              {trend}
            </div>
          )}
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white to-transparent rounded-full -mr-10 -mt-10 opacity-50" />
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-white to-transparent rounded-full -ml-8 -mb-8 opacity-30" />
    </motion.div>
  );
};

export default MetricCard;
