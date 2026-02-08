import React, { useEffect, useMemo, useState } from "react";

type Props = {
  title: string;
  subtitle?: string;
  subtitles?: string[];
}

// Animation styles
const styles = `
  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-20px);
    }
  }

  @keyframes pulse-ring {
    0% {
      transform: scale(0.8);
      opacity: 1;
    }
    100% {
      transform: scale(1.4);
      opacity: 0;
    }
  }

  @keyframes gradient-shift {
    0%, 100% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
  }

  @keyframes dots {
    0%, 20% {
      content: '';
    }
    40% {
      content: '.';
    }
    60% {
      content: '..';
    }
    80%, 100% {
      content: '...';
    }
  }

  .animate-float {
    animation: float 3s ease-in-out infinite;
  }

  .animate-pulse-ring {
    animation: pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
  }

  .animate-gradient {
    background-size: 200% 200%;
    animation: gradient-shift 3s ease infinite;
  }

  .loading-dots::after {
    content: '';
    animation: dots 1.5s steps(1, end) infinite;
  }
`;

const VentureLoader = ({ title, subtitle, subtitles }: Props) => {
  const effectiveSubtitles = useMemo(() => {
    if (Array.isArray(subtitles) && subtitles.length > 0) return subtitles;
    if (typeof subtitle === "string" && subtitle.trim()) return [subtitle];
    return ["Please wait while we prepare your workspace"];
  }, [subtitle, subtitles]);

  const [subtitleIndex, setSubtitleIndex] = useState(0);

  useEffect(() => {
    if (effectiveSubtitles.length <= 1) return;
    const interval = window.setInterval(() => {
      setSubtitleIndex((prev) => (prev + 1) % effectiveSubtitles.length);
    }, 2200);
    return () => window.clearInterval(interval);
  }, [effectiveSubtitles]);

  return (
    <>
      <style>{styles}</style>
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
        <div className="flex flex-col items-center justify-center max-w-md mx-auto">
          {/* Animated loader container */}
          <div className="relative mb-8">
            {/* Pulsing rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-r from-teal-400 to-blue-400 opacity-20 animate-pulse-ring"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center" style={{ animationDelay: '1s' }}>
              <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 opacity-20 animate-pulse-ring"></div>
            </div>

            {/* Main icon container */}
            <div className="relative w-28 h-28 bg-gradient-to-br from-teal-500 via-blue-500 to-purple-500 rounded-3xl flex items-center justify-center shadow-2xl animate-float animate-gradient">
              {/* Rotating border effect */}
              <div className="absolute inset-0 rounded-3xl animate-spin" style={{ animationDuration: '3s' }}>
                <div className="h-full w-full rounded-3xl border-4 border-transparent border-t-white/50"></div>
              </div>

              {/* Icon */}
              <svg className="w-14 h-14 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>

          {/* Loading text */}
          <div className="text-center space-y-3">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-teal-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              <span className="loading-dots">{title}</span>
            </h3>
            <p className="text-gray-500 text-sm">{effectiveSubtitles[subtitleIndex] || effectiveSubtitles[0]}</p>
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-xs mt-8">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-teal-500 via-blue-500 to-purple-500 rounded-full animate-gradient" style={{ width: '100%' }}></div>
            </div>
          </div>

          {/* Loading dots indicator */}
          <div className="flex items-center gap-2 mt-6">
            <div className="w-3 h-3 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default VentureLoader;
