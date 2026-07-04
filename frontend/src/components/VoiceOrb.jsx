import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoice } from '../contexts/VoiceContext';
import { Mic, MicOff, Sparkles, Volume2, X } from 'lucide-react';
import { fadeIn, scaleIn, orbPulse } from '../animations/motion';
import NovaAvatar from './NovaAvatar';

const VoiceOrb = () => {
  const { voiceState, transcript, voiceMessage, pendingAction, handleVoiceCommand, startListening, stopListening } = useVoice();
  const [isOpen, setIsOpen] = useState(false);

  // Determine background styling based on assistant status
  const getOrbGradient = () => {
    switch (voiceState) {
      case 'listening':
        return 'from-cyan-500 via-teal-400 to-emerald-500 orb-glow-listening';
      case 'thinking':
        return 'from-purple-500 via-indigo-600 to-pink-500 orb-glow-thinking';
      case 'completed':
        return 'from-emerald-400 to-sky-500';
      default:
        return 'from-indigo-600 via-purple-600 to-cyan-500 orb-glow';
    }
  };

  const getStatusText = () => {
    switch (voiceState) {
      case 'listening': return 'Listening...';
      case 'thinking': return 'Thinking...';
      case 'completed': return 'Action completed';
      default: return 'Nova Ready';
    }
  };

  const handleFaceClick = () => {
    if (isOpen) {
      stopListening();
      setIsOpen(false);
    } else {
      startListening();
      setIsOpen(true);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Expanded Interface Dialog */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-80 md:w-96 mb-4 bg-zinc-950/95 backdrop-blur-md rounded-2xl overflow-hidden p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-zinc-800/80 relative text-zinc-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 border-b border-zinc-800/80 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse-slow" />
                <span className="font-display font-semibold text-white tracking-wide">Nova AI Assistant</span>
              </div>
              <button 
                onClick={() => { setIsOpen(false); stopListening(); }}
                className="text-zinc-400 hover:text-white transition-colors"
                aria-label="Close Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="space-y-4 min-h-[120px] flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-1">
                  {getStatusText()}
                </p>
                <p className="text-sm text-zinc-100 font-medium italic">
                  "{voiceMessage}"
                </p>
              </div>

              {/* Spoken Text Result */}
              {transcript && (
                <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/60">
                  <p className="text-xs text-zinc-400 mb-1">You said:</p>
                  <p className="text-sm text-zinc-100 font-medium font-sans">"{transcript}"</p>
                </div>
              )}

              {/* Pending confirmation visual card */}
              {pendingAction && pendingAction.type === 'delete' && (
                <div className="bg-red-950/40 border border-red-900/60 rounded-xl p-3.5 flex flex-col gap-3">
                  <p className="text-xs text-red-200 font-normal leading-relaxed">
                    Are you sure you want to delete task <strong>"{pendingAction.taskTitle}"</strong>?
                  </p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleVoiceCommand('no')}
                      className="flex-1 py-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors border border-zinc-800"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleVoiceCommand('yes')}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-lg shadow-red-900/20"
                    >
                      Yes, Delete
                    </button>
                  </div>
                </div>
              )}

              {pendingAction && (pendingAction.type === 'edit' || pendingAction.type === 'selectTaskToEdit') && (
                <div className="bg-indigo-950/40 border border-indigo-900/60 rounded-xl p-3.5 flex flex-col gap-2">
                  <p className="text-xs text-indigo-200 font-normal">
                    {pendingAction.type === 'selectTaskToEdit' 
                      ? 'Select Task to Edit' 
                      : <span>Editing task: <strong>"{pendingAction.taskTitle}"</strong></span>}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-light leading-relaxed">
                    {pendingAction.type === 'selectTaskToEdit'
                      ? 'Speak the name of the task you want to edit.'
                      : 'Say something like: "change description to buy milk" or "change due date to tomorrow".'}
                  </p>
                </div>
              )}

              {pendingAction && pendingAction.type === 'selectTaskToDelete' && (
                <div className="bg-red-950/40 border border-red-900/60 rounded-xl p-3.5 flex flex-col gap-2">
                  <p className="text-xs text-red-200 font-normal">
                    Select Task to Delete
                  </p>
                  <p className="text-[10px] text-zinc-400 font-light leading-relaxed">
                    Speak the name of the task you want to delete.
                  </p>
                </div>
              )}

              {/* Active Voice Waveforms while listening */}
              {voiceState === 'listening' && (
                <div className="flex items-end justify-center gap-1 h-8 mt-2">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        height: [8, Math.random() * 32 + 8, 8],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.6 + i * 0.1,
                        ease: 'easeInOut',
                      }}
                      className="w-1.5 bg-gradient-to-t from-cyan-500 to-indigo-400 rounded-full"
                    />
                  ))}
                </div>
              )}

              {/* Guide tips */}
              <div className="text-[10px] text-zinc-500 pt-2 border-t border-zinc-850 flex justify-between">
                <span>Try saying: "Open Tasks"</span>
                <span>"Create task Buy groceries"</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Interactive Orb Button */}
      <div className="flex items-center gap-3">
        {/* Hover Hint when closed */}
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden md:block bg-zinc-950 text-zinc-300 px-3.5 py-2.5 rounded-xl text-xs shadow-[0_10px_30px_rgba(0,0,0,0.3)] border border-zinc-800/80"
          >
            Say <span className="font-bold text-indigo-400">"Hey Nova"</span> or click
          </motion.div>
        )}

        <motion.button
          onClick={handleFaceClick}
          className="relative cursor-pointer focus:outline-none"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <NovaAvatar size="small" state={voiceState} />
        </motion.button>
      </div>
    </div>
  );
};

export default VoiceOrb;
