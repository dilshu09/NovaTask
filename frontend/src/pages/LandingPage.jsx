import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Sparkles, ArrowRight, Shield, Cpu, Activity, Calendar, Compass, User } from 'lucide-react';
import { useVoice } from '../contexts/VoiceContext';
import { fadeIn, slideUp, staggerContainer } from '../animations/motion';
import Logo from '../components/Logo';
import NovaAvatar from '../components/NovaAvatar';

const LandingPage = () => {
  const navigate = useNavigate();
  const { speak } = useVoice();

  const handleVoiceDemo = () => {
    speak(
      "Welcome to NovaTask Workspace. I am Nova, your intelligent productivity assistant. " +
      "You can wake me up anytime by saying Hey Nova, or using the keyboard shortcut Alt plus N. " +
      "Once you log in, I can create tasks, navigate your workspace, and filter priorities automatically. " +
      "Let's get started!"
    );
  };

  const features = [
    {
      icon: <Sparkles className="w-5 h-5 text-indigo-400" />,
      title: 'AI Assistant',
      desc: 'Always here to help'
    },
    {
      icon: <Compass className="w-5 h-5 text-purple-400" />,
      title: 'Smart Tasks',
      desc: 'Intelligent prioritization'
    },
    {
      icon: <Activity className="w-5 h-5 text-cyan-400" />,
      title: 'Focus Mode',
      desc: 'Deep work sessions'
    },
    {
      icon: <Cpu className="w-5 h-5 text-emerald-400" />,
      title: 'Analytics',
      desc: 'Track your progress'
    },
    {
      icon: <Calendar className="w-5 h-5 text-pink-400" />,
      title: 'Calendar',
      desc: 'Schedule smarter'
    },
    {
      icon: <Shield className="w-5 h-5 text-blue-400" />,
      title: 'Secure',
      desc: 'Enterprise grade'
    }
  ];

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden bg-[#030206] text-white">
      
      {/* Background glowing line mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[120px]" />
        <div className="absolute bottom-[20%] right-[-10%] w-[60%] h-[40%] rounded-full bg-indigo-600/5 blur-[120px]" />
        
        {/* Curved Wave Line SVGs at the bottom */}
        <svg className="absolute bottom-16 left-0 w-full h-48 opacity-40 text-indigo-500" viewBox="0 0 1440 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 80C240 160 480 200 720 120C960 40 1200 0 1440 40" stroke="url(#waveGrad)" strokeWidth="1.5" />
          <path d="M0 120C300 200 600 120 900 140C1200 160 1320 100 1440 120" stroke="url(#waveGrad)" strokeWidth="0.75" strokeDasharray="5 5" />
          <defs>
            <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Header Navigation */}
      <motion.header 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-20"
      >
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
          <Logo className="w-8 h-8" />
          <span className="font-display font-bold text-lg tracking-tight text-white">
            NovaTask
          </span>
        </div>
        
        
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/login')}
            className="px-4 py-2 text-sm font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            Login
          </button>
          <button 
            onClick={() => navigate('/register')}
            className="px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center px-6 relative z-10 max-w-7xl mx-auto w-full py-10 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
          
          {/* Hero Left Info */}
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="lg:col-span-6 space-y-6 text-center lg:text-left"
          >
            <motion.div 
              variants={slideUp}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[11px] font-semibold text-indigo-300"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              AI-Powered Workspace
            </motion.div>

            <motion.h1 
              variants={slideUp}
              className="font-display text-4xl sm:text-6xl font-bold tracking-tight text-white leading-[1.1]"
            >
              Work Smarter. <br />
              Powered by <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">AI.</span>
            </motion.h1>

            <motion.p 
              variants={slideUp}
              className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto lg:mx-0 font-light leading-relaxed"
            >
              NovaTask Workspace helps you plan, focus and achieve more every day with the power of intelligent assistance.
            </motion.p>

            <motion.div 
              variants={slideUp}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2"
            >
              <button 
                onClick={() => navigate('/register')}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
              >
                Get Started Free
              </button>

              
            </motion.div>

            <motion.p 
              variants={slideUp}
              className="text-xs text-zinc-500 flex items-center justify-center lg:justify-start gap-1 font-light"
            >
              ✓ No credit card required
            </motion.p>
          </motion.div>

          {/* Hero Right Avatar Panel */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6 flex justify-center items-center relative"
          >
            {/* The Maga Avatar Orbs */}
            <div className="relative flex items-center justify-center">
              <NovaAvatar size="large" state="ready" />

              {/* Floating Connected Icons */}
              {/* Command ⌘ Badge */}
              <div className="absolute top-2 right-[-20px] w-10 h-10 rounded-xl bg-[#0b0a14]/90 border border-white/10 flex items-center justify-center text-indigo-400 shadow-lg">
                <span className="font-semibold text-sm">⌘</span>
              </div>

              {/* Calendar Badge */}
              <div className="absolute bottom-6 left-[-30px] w-10 h-10 rounded-xl bg-[#0b0a14]/90 border border-white/10 flex items-center justify-center text-indigo-400 shadow-lg">
                <Calendar className="w-4 h-4" />
              </div>

              {/* Speech bubble: Maga - Ready to assist you! */}
              <div className="absolute bottom-[-10px] right-[-40px] glass-panel border border-white/10 rounded-2xl p-3 shadow-2xl max-w-[180px] text-left relative">
                {/* Speech tail */}
                <div className="absolute left-[-6px] bottom-6 w-3 h-3 bg-[#0d0d18] border-b border-l border-white/10 transform rotate-45" />
                
                 <h4 className="text-xs font-bold text-white">Nova</h4>
                <p className="text-[10px] text-zinc-400 font-light mt-0.5">Ready to assist you!</p>
              </div>
            </div>
          </motion.div>

        </div>

        {/* Six Feature Cards Row */}
        <div className="w-full mt-24">
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
          >
            {features.map((feat, index) => (
              <motion.div
                key={index}
                variants={slideUp}
                className="glass-panel p-5 rounded-2xl border border-white/5 bg-[#0a0a0f]/40 hover:bg-[#0f0e1a]/60 hover:border-white/10 transition-all text-center flex flex-col items-center justify-center gap-3.5 min-h-[140px]"
              >
                <div className="w-10 h-10 rounded-xl bg-[#141223] border border-white/5 flex items-center justify-center shrink-0">
                  {feat.icon}
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-semibold text-xs text-white tracking-wide">{feat.title}</h3>
                  <p className="text-[9px] text-zinc-500 font-light leading-normal">{feat.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 text-center text-[10px] text-zinc-600 mt-8">
        <p>© 2026 NovaTask Workspace. All rights reserved.</p>
      </footer>

    </div>
  );
};

export default LandingPage;
