import { motion } from "framer-motion";

const AngelThinkingLoader = () => {
  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.12,
      },
    },
  };

  const dotVariants = {
    animate: {
      y: [0, -10, 0],
      scale: [1, 1.3, 1],
      opacity: [0.4, 1, 0.4],
      transition: {
        duration: 0.8,
        repeat: Infinity,
        ease: "easeInOut" as const,
      },
    },
  };

  return (
    <div className="flex items-center gap-3 py-4 px-4">
      {/* Animated Icon with Rings */}
      <div className="relative flex items-center justify-center w-10 h-10">
        {/* Outer pulsing ring */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-400 to-blue-400"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            filter: "blur(3px)",
          }}
        />
        
        {/* Main rotating spinner */}
        <motion.div
          className="relative w-8 h-8"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {/* Gradient ring */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "conic-gradient(from 0deg, #14b8a6, #3b82f6, #14b8a6)",
              mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 3px))",
              WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 3px))",
            }}
          />
          
          {/* Inner white circle */}
          <div className="absolute inset-2 rounded-full bg-white shadow-sm" />
          
          {/* Center pulsing dot */}
          <motion.div
            className="absolute inset-3 rounded-full bg-gradient-to-br from-teal-500 to-blue-500"
            animate={{
              scale: [0.9, 1.1, 0.9],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      </div>

      {/* Text with animated dots */}
      <div className="flex items-center gap-1">
        <span className="text-sm font-semibold text-gray-700">
          Angel is thinking
        </span>
        
        {/* Animated dots */}
        <motion.div
          className="flex gap-0.5"
          variants={containerVariants}
          animate="animate"
        >
          {[0, 1, 2].map((index) => (
            <motion.span
              key={index}
              className="text-lg font-bold text-teal-600"
              variants={dotVariants}
            >
              .
            </motion.span>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default AngelThinkingLoader;

