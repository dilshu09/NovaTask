import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider } from '../contexts/AuthContext';
import { VoiceProvider, useVoice } from '../contexts/VoiceContext';
import VoiceOrb from '../components/VoiceOrb';

// Key listener component inside the context wrapper
const GlobalShortcuts = () => {
  const { startListening, voiceState } = useVoice();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Alt + N shortcut to toggle voice microphone
      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        if (voiceState !== 'listening') {
          startListening();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [voiceState, startListening]);

  return null;
};

const RootLayout = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <VoiceProvider>
          <GlobalShortcuts />
          
          {/* Main App Container */}
          <div className="min-h-screen relative flex flex-col bg-zinc-950 text-zinc-100 transition-colors duration-300 selection:bg-indigo-500 selection:text-white">
            {/* Background luxury gradient meshes */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
              <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[120px]" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/10 blur-[120px]" />
            </div>

            {/* Content Injection */}
            <div className="relative z-10 flex-1 flex flex-col">
              <Outlet />
            </div>

            {/* Voice Assistant Overlay */}
            <VoiceOrb />
            
            {/* Toaster notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                className: 'glass-panel text-white border border-white/10 rounded-xl',
                style: {
                  background: 'rgba(24, 24, 27, 0.85)',
                  backdropFilter: 'blur(8px)',
                  color: '#fff',
                },
                success: {
                  iconTheme: {
                    primary: '#6366f1',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </div>
        </VoiceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default RootLayout;
