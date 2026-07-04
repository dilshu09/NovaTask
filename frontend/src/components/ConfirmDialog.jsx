import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { fadeIn, slideUp } from '../animations/motion';

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Delete', 
  cancelText = 'Cancel', 
  type = 'danger' 
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Dialog Card */}
          <motion.div
            variants={slideUp}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full max-w-sm bg-white rounded-2xl border border-zinc-150 p-6 relative z-10 shadow-2xl space-y-4"
          >
            {/* Header section */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  type === 'danger' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-sm text-black">{title}</h3>
              </div>
              <button 
                onClick={onClose}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Message Body */}
            <p className="text-zinc-500 text-xs font-light leading-relaxed">
              {message}
            </p>

            {/* Buttons Controls */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border border-zinc-200 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-1 py-2.5 text-white text-xs font-semibold rounded-xl shadow-lg cursor-pointer transition-colors ${
                  type === 'danger' 
                    ? 'bg-red-600 hover:bg-red-500 shadow-red-600/10' 
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/10'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;
