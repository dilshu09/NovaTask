import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { scaleIn } from '../animations/motion';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center items-center px-6 relative overflow-hidden">
      
      {/* Visual background effect */}
      <div className="absolute w-[400px] h-[400px] rounded-full bg-red-900/5 blur-[120px] pointer-events-none" />

      <motion.div
        variants={scaleIn}
        initial="hidden"
        animate="visible"
        className="max-w-md w-full glass-panel border border-white/10 rounded-3xl p-8 text-center space-y-6 relative z-10 shadow-2xl"
      >
        <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
          <Sparkles className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <h1 className="font-display font-extrabold text-5xl text-white">404</h1>
          <h2 className="font-semibold text-lg text-white">Page Not Found</h2>
          <p className="text-sm text-zinc-400 font-light leading-relaxed">
            The workspace section you are trying to reach doesn't exist or has been shifted to another coordinate.
          </p>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="w-full py-3 bg-white text-black hover:bg-zinc-200 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </motion.div>

    </div>
  );
};

export default NotFoundPage;
