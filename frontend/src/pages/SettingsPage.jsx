import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Settings, 
  Accessibility, 
  Volume2, 
  Eye, 
  VolumeX, 
  Sparkles,
  Save,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { slideUp, staggerContainer } from '../animations/motion';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { settings, updateSettings, logout } = useAuth();
  
  // Accessibility triggers from ThemeContext
  const { 
    theme, 
    toggleTheme, 
    highContrast, 
    toggleHighContrast, 
    reducedMotion, 
    toggleReducedMotion 
  } = useTheme();

  // Voice preference states
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [wakePhrase, setWakePhrase] = useState('Hey Nova');
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [voicePitch, setVoicePitch] = useState(1.0);
  const [savingSettings, setSavingSettings] = useState(false);

  // Sync settings when loaded from DB context
  useEffect(() => {
    if (settings) {
      setVoiceEnabled(settings.voiceEnabled ?? true);
      setWakePhrase(settings.voiceWakePhrase || 'Hey Nova');
      setVoiceSpeed(settings.voiceSpeed || 1.0);
      setVoicePitch(settings.voicePitch || 1.0);
    }
  }, [settings]);

  const handleSwitchAccount = async () => {
    await logout();
    navigate('/login');
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    const payload = {
      theme,
      highContrast,
      reducedMotion,
      voiceEnabled,
      voiceWakePhrase: wakePhrase,
      voiceSpeed,
      voicePitch,
    };
    
    const res = await updateSettings(payload);
    setSavingSettings(false);
    if (res.success) {
      toast.success('Preferences synchronized successfully');
    }
  };

  return (
    <motion.div 
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-8 text-zinc-700"
    >
      {/* Page Header */}
      <motion.div variants={slideUp} className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold text-black tracking-tight">Preferences Settings</h1>
          <p className="text-zinc-550 text-sm font-light">Fine-tune system themes, accessibility criteria, and voice configs.</p>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={savingSettings}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/10 flex items-center gap-2 hover:scale-[1.02] transition-all cursor-pointer disabled:opacity-50"
        >
          {savingSettings ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {savingSettings ? 'Saving...' : 'Save Settings'}
        </button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Section 1: Themes & Accessibility */}
        <motion.div variants={slideUp} className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
            <Accessibility className="w-5 h-5 text-indigo-600" />
            <h2 className="font-display font-semibold text-lg text-black">Interface & Accessibility</h2>
          </div>

          <div className="space-y-6">
            
            {/* Dark Theme toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-zinc-800">Workspace Color Theme</span>
                <p className="text-xs text-zinc-500 font-light">Switch between standard dark luxury or light surfaces.</p>
              </div>
              <button
                onClick={toggleTheme}
                className="px-4 py-2 rounded-xl bg-zinc-100 border border-zinc-200 hover:bg-zinc-200 text-xs font-semibold text-zinc-700 transition-all cursor-pointer"
              >
                Set {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>

            <div className="h-[1px] bg-zinc-100" />

            {/* High Contrast */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-zinc-800">High Contrast Mode</span>
                <p className="text-xs text-zinc-500 font-light">Enhance border readability and disable transparent blur details.</p>
              </div>
              <button
                onClick={toggleHighContrast}
                className={`px-4 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  highContrast 
                    ? 'bg-indigo-600 border-indigo-500 text-white' 
                    : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                {highContrast ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div className="h-[1px] bg-zinc-100" />

            {/* Reduced Motion */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-zinc-800">Reduced Motion Mode</span>
                <p className="text-xs text-zinc-500 font-light">Bypass entry loops and sliding transitions for quick static rendering.</p>
              </div>
              <button
                onClick={toggleReducedMotion}
                className={`px-4 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  reducedMotion 
                    ? 'bg-indigo-600 border-indigo-500 text-white' 
                    : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                {reducedMotion ? 'Enabled' : 'Disabled'}
              </button>
            </div>

          </div>
        </motion.div>

        {/* Section 2: Voice Assistant Settings */}
        <motion.div variants={slideUp} className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
            <Volume2 className="w-5 h-5 text-indigo-600" />
            <h2 className="font-display font-semibold text-lg text-black">Nova Voice Config</h2>
          </div>

          <div className="space-y-5">
            
            {/* Enable/Disable Voice Assistant */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-zinc-800">Voice Assistant Status</span>
                <p className="text-xs text-zinc-500 font-light">Enable background listening for wake words.</p>
              </div>
              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`px-4 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  voiceEnabled 
                    ? 'bg-indigo-600 border-indigo-500 text-white' 
                    : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                {voiceEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div className="h-[1px] bg-zinc-100" />

            {/* Wake Word Trigger */}
            <div className="space-y-1">
              <span className="text-sm font-semibold text-zinc-800">Custom Wake Phrase</span>
              <p className="text-xs text-zinc-500 font-light mb-2">Configure vocal wake keys matching voice models.</p>
              <input
                type="text"
                value={wakePhrase}
                onChange={(e) => setWakePhrase(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-50 rounded-xl border border-zinc-200 focus:border-indigo-500 focus:outline-none text-sm text-zinc-800 transition-colors"
              />
            </div>

            <div className="h-[1px] bg-zinc-100" />

            {/* Voice Speed Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-zinc-800">Speech Synthesis Speed</span>
                <span className="text-xs font-mono text-indigo-600 font-semibold">{voiceSpeed}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={voiceSpeed}
                onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                className="w-full h-2 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div className="h-[1px] bg-zinc-100" />

            {/* Voice Pitch Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-zinc-800">Speech Synthesis Pitch</span>
                <span className="text-xs font-mono text-indigo-600 font-semibold">{voicePitch}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={voicePitch}
                onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                className="w-full h-2 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

          </div>
        </motion.div>

        {/* Section 3: Account & Session */}
        <motion.div variants={slideUp} className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-6 md:col-span-2">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h2 className="font-display font-semibold text-lg text-black">Workspace Session</h2>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-sm font-semibold text-zinc-800">Switch Account</span>
              <p className="text-xs text-zinc-500 font-light">Sign out of the current user session to authenticate as another user.</p>
            </div>
            <button
              onClick={handleSwitchAccount}
              className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-md"
            >
              Switch Account
            </button>
          </div>
        </motion.div>

      </div>

    </motion.div>
  );
};

export default SettingsPage;
