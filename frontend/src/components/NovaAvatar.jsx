import React from 'react';
import { motion } from 'framer-motion';

const NovaAvatar = ({ size = 'medium', state = 'ready' }) => {
  // Configs containing sizing/spacing classes for visor and eyes dynamically based on size
  const sizeConfigs = {
    small: {
      container: 'w-24 h-24',
      visorPadding: 'px-2',
      visorGap: 'gap-1.5',
      eyeWidth: 'w-1.5 h-3.5',
      eyeGlow: 'shadow-[0_0_6px_#22d3ee,0_0_12px_#06b6d4]'
    },
    medium: {
      container: 'w-48 h-48',
      visorPadding: 'px-4',
      visorGap: 'gap-4',
      eyeWidth: 'w-3 h-6',
      eyeGlow: 'shadow-[0_0_10px_#22d3ee,0_0_20px_#06b6d4]'
    },
    large: {
      container: 'w-64 h-64',
      visorPadding: 'px-6',
      visorGap: 'gap-6',
      eyeWidth: 'w-3.5 h-7',
      eyeGlow: 'shadow-[0_0_12px_#22d3ee,0_0_24px_#06b6d4]'
    },
    xlarge: {
      container: 'w-80 h-80',
      visorPadding: 'px-8',
      visorGap: 'gap-8',
      eyeWidth: 'w-4 h-8',
      eyeGlow: 'shadow-[0_0_16px_#22d3ee,0_0_32px_#06b6d4]'
    }
  };

  const config = sizeConfigs[size] || sizeConfigs.medium;

  // Outer glowing ring color mapping based on status
  const getRingGlow = () => {
    switch (state) {
      case 'listening':
        return 'shadow-[0_0_50px_rgba(6,182,212,0.6),inset_0_0_20px_rgba(6,182,212,0.4)] border-cyan-400';
      case 'thinking':
        return 'shadow-[0_0_50px_rgba(168,85,247,0.6),inset_0_0_20px_rgba(168,85,247,0.4)] border-purple-400';
      default:
        // Default ready status: Blue-Purple gradient ring glow
        return 'shadow-[0_0_40px_rgba(99,102,241,0.5),0_0_70px_rgba(168,85,247,0.35),inset_0_0_20px_rgba(99,102,241,0.3)] border-indigo-500';
    }
  };

  return (
    <div className={`relative ${config.container} flex items-center justify-center`}>
      {/* Outer spinning background aura */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 12, ease: 'linear' }}
        className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-cyan-500/10 blur-xl"
      />

      {/* Main Glowing Sphere */}
      <motion.div
        animate={
          state === 'listening'
            ? { scale: [1, 1.05, 0.97, 1.03, 1] }
            : { scale: [1, 1.02, 1] }
        }
        transition={{
          repeat: Infinity,
          duration: state === 'listening' ? 1.5 : 4,
          ease: 'easeInOut',
        }}
        className={`w-full h-full rounded-full border-2 bg-[#020205] flex items-center justify-center relative overflow-hidden transition-all duration-500 ${getRingGlow()}`}
      >
        {/* Inner shadow/reflections */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#030308]/70 to-[#020205]" />

        {/* The Black Visor/Face Mask */}
        <div className={`w-[72%] h-[38%] bg-[#08080f]/90 rounded-full flex items-center justify-center ${config.visorGap} ${config.visorPadding} relative z-10 border border-white/5 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]`}>
          {/* Left Eye */}
          <motion.div
            animate={
              state === 'thinking'
                ? { opacity: [0.3, 1, 0.3], scaleY: [1, 0.8, 1] }
                : { scaleY: [1, 1, 0.1, 1, 1] } // Blinking animation
            }
            transition={{
              repeat: Infinity,
              duration: state === 'thinking' ? 1 : 4.5,
              ease: 'easeInOut',
            }}
            className={`${config.eyeWidth} rounded-full bg-cyan-300 ${config.eyeGlow}`}
          />

          {/* Right Eye */}
          <motion.div
            animate={
              state === 'thinking'
                ? { opacity: [0.3, 1, 0.3], scaleY: [1, 0.8, 1] }
                : { scaleY: [1, 1, 0.1, 1, 1] } // Blinking sync
            }
            transition={{
              repeat: Infinity,
              duration: state === 'thinking' ? 1 : 4.5,
              ease: 'easeInOut',
            }}
            className={`${config.eyeWidth} rounded-full bg-cyan-300 ${config.eyeGlow}`}
          />
        </div>

        {/* Glass glare highlight */}
        <div className="absolute top-2 left-1/4 w-1/2 h-1/4 bg-gradient-to-b from-white/10 to-transparent rounded-full blur-[2px] transform -rotate-12" />
      </motion.div>
    </div>
  );
};

export default NovaAvatar;
