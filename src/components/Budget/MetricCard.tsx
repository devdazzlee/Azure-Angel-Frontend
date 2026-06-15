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
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  subtitle, 
  color = 'blue', 
  delay = 0,
  onClick,
}) => {
  const colorMap: Record<string, { gradient: string; ring: string }> = {
    blue:   { gradient: 'from-teal-500 to-cyan-600',    ring: 'ring-teal-200' },
    green:  { gradient: 'from-emerald-500 to-green-600', ring: 'ring-emerald-200' },
    red:    { gradient: 'from-red-500 to-rose-600',     ring: 'ring-red-200' },
    purple: { gradient: 'from-teal-500 to-cyan-600',  ring: 'ring-teal-200' },
    amber:  { gradient: 'from-amber-500 to-orange-600', ring: 'ring-amber-200' },
    orange: { gradient: 'from-orange-500 to-red-500',   ring: 'ring-orange-200' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="group"
    >
      <div
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        onKeyDown={
          onClick
            ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
        className={`relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-md border border-gray-200/60 shadow-md hover:shadow-xl transition-all duration-300 ring-1 ${c.ring} ${
          onClick ? 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2' : ''
        }`}
      >
        {/* decorative blob */}
        <div className={`absolute -top-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-br ${c.gradient} opacity-[0.08] group-hover:scale-125 transition-transform duration-500`} />

        <div className="p-5 relative">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</p>
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${c.gradient} shadow-lg shadow-teal-500/10`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
          </div>

          <p className="text-2xl font-extrabold text-gray-900 tracking-tight">{value}</p>
          {subtitle && <p className="text-[11px] text-gray-500 mt-1">{subtitle}</p>}
          {onClick && (
            <p className="text-[11px] text-teal-600 mt-2 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              View details ↓
            </p>
          )}

          {trend && (
            <div className={`mt-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
              trend.startsWith('+') ? 'bg-emerald-100 text-emerald-700' :
              trend.startsWith('-') ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {trend}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MetricCard;
