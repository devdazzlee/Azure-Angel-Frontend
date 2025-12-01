import { motion } from "framer-motion";

const AngelThinkingLoader = () => {
  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const dotVariants = {
    animate: {
      y: [0, -8, 0],
      opacity: [0.3, 1, 0.3],
      scale: [0.8, 1.2, 0.8],
      transition: {
        duration: 0.9,
        repeat: Infinity,
        ease: "easeInOut" as const,
      },
    },
  };

  const textVariants = {
    animate: {
      opacity: [0.6, 1, 0.6],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut" as const,
      },
    },
  };

  const particleVariants = {
    animate: {
      y: [0, -20, 0],
      opacity: [0, 1, 0],
      scale: [0.5, 1, 0.5],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeOut" as const,
      },
    },
  };

  // Generate particles around the loader
  const particles = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    angle: (i * 360) / 6,
    delay: i * 0.2,
  }));

  return (
    <div className="relative flex items-center gap-4 py-3 px-2">
      {/* Background glow effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-teal-500/10 via-indigo-500/10 to-purple-500/10 blur-xl"
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Animated Icon Container */}
      <div className="relative flex items-center justify-center w-10 h-10 z-10">
        {/* Floating particles around the loader */}
        {particles.map((particle) => {
          const radius = 20;
          const x = Math.cos((particle.angle * Math.PI) / 180) * radius;
          const y = Math.sin((particle.angle * Math.PI) / 180) * radius;
          
          return (
            <motion.div
              key={particle.id}
              className="absolute rounded-full bg-gradient-to-r from-teal-400 to-indigo-400"
              style={{
                width: 4,
                height: 4,
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: "translate(-50%, -50%)",
              }}
              variants={particleVariants}
              animate="animate"
              transition={{
                delay: particle.delay,
                duration: 2,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          );
        })}

        {/* Outer pulsing ring with glow */}
        <motion.div
          className="absolute rounded-full bg-gradient-to-r from-teal-400 via-indigo-400 to-purple-400"
          animate={{
            scale: [1, 1.6, 1],
            opacity: [0.2, 0.5, 0.2],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            width: 36,
            height: 36,
            filter: "blur(4px)",
          }}
        />
        
        {/* Middle ring with rotation */}
        <motion.div
          className="absolute rounded-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.3, 0.7, 0.3],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            width: 32,
            height: 32,
            filter: "blur(2px)",
          }}
        />
        
        {/* Main spinner with multiple layers */}
        <div className="relative w-8 h-8">
          {/* Outer rotating gradient border */}
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{ rotate: 360 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              background: "conic-gradient(from 0deg, #14b8a6, #6366f1, #a855f7, #ec4899, #14b8a6)",
              mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 3px))",
              WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 3px))",
            }}
          />
          
          {/* Middle rotating ring (counter-rotation) */}
          <motion.div
            className="absolute inset-1 rounded-full"
            animate={{ rotate: -360 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              background: "conic-gradient(from 180deg, #a855f7, #14b8a6, #6366f1, #a855f7)",
              mask: "radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 2px))",
              WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 2px))",
            }}
          />
          
          {/* White center circle with shadow */}
          <div className="absolute inset-1.5 rounded-full bg-white shadow-lg" />
          
          {/* Inner pulsing gradient dot */}
          <motion.div
            className="absolute inset-2.5 rounded-full bg-gradient-to-br from-teal-500 via-indigo-500 to-purple-500"
            animate={{
              opacity: [0.7, 1, 0.7],
              scale: [0.95, 1.15, 0.95],
              rotate: [0, 360],
            }}
            transition={{
              opacity: {
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              },
              scale: {
                duration: 1.2,
                repeat: Infinity,
                ease: "easeInOut",
              },
              rotate: {
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              },
            }}
            style={{
              boxShadow: "0 0 10px rgba(99, 102, 241, 0.5)",
            }}
          />
        </div>
      </div>

      {/* Text with animated dots and shimmer effect */}
      <div className="relative flex items-center gap-1.5 z-10">
        {/* Shimmer overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{
            x: ["-100%", "200%"],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "4px",
          }}
        />
        
        <motion.span
          className="relative text-sm font-bold bg-gradient-to-r from-teal-600 via-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
          style={{
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
          variants={textVariants}
          animate="animate"
        >
          Angel is thinking
        </motion.span>
        
        {/* Animated dots with enhanced effects */}
        <motion.div
          className="flex gap-1"
          variants={containerVariants}
          animate="animate"
        >
          {[0, 1, 2].map((index) => (
            <motion.span
              key={index}
              className="relative text-xl font-bold bg-gradient-to-r from-teal-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent"
              variants={dotVariants}
              style={{
                filter: "drop-shadow(0 0 3px rgba(99, 102, 241, 0.5))",
              }}
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

