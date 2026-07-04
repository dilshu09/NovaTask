import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, Chrome, Apple, Facebook, Sparkles, Mic, MicOff, ShieldAlert, KeyRound, Check, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useVoice } from '../contexts/VoiceContext';
import { slideUp, staggerContainer, scaleIn } from '../animations/motion';
import Logo from '../components/Logo';
import NovaAvatar from '../components/NovaAvatar';
import EmailAuthModal from '../components/EmailAuthModal';

const LoginPage = () => {
  const navigate = useNavigate();
  const { loginOAuthMock } = useAuth();
  const { startListening, stopListening, voiceState, voiceMessage } = useVoice();
  const [loading, setLoading] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const handleOAuthLogin = async (provider) => {
    if (provider === 'google') {
      window.location.href = '/api/auth/google';
      return;
    }

    setLoading(true);
    let mockEmail = '';
    let mockName = '';

    if (provider === 'facebook') {
      mockEmail = 'john.facebook@fb.com';
      mockName = 'John Doe (Facebook)';
    } else if (provider === 'apple') {
      mockEmail = 'john.apple@icloud.com';
      mockName = 'John Doe (Apple)';
    }

    const result = await loginOAuthMock(provider, mockEmail, mockName);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  React.useEffect(() => {
    const handleVoiceGoogle = () => handleOAuthLogin('google');
    const handleVoiceApple = () => handleOAuthLogin('apple');
    const handleVoiceFacebook = () => handleOAuthLogin('facebook');
    const handleVoiceEmail = () => setIsEmailModalOpen(true);

    window.addEventListener('voice_oauth_google', handleVoiceGoogle);
    window.addEventListener('voice_oauth_apple', handleVoiceApple);
    window.addEventListener('voice_oauth_facebook', handleVoiceFacebook);
    window.addEventListener('voice_login_email', handleVoiceEmail);

    return () => {
      window.removeEventListener('voice_oauth_google', handleVoiceGoogle);
      window.removeEventListener('voice_oauth_apple', handleVoiceApple);
      window.removeEventListener('voice_oauth_facebook', handleVoiceFacebook);
      window.removeEventListener('voice_login_email', handleVoiceEmail);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row items-stretch justify-center bg-white text-zinc-800">
      
      {/* Left side: Light Auth Panel */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-24 py-12 bg-[#fafafc] relative z-10 max-w-full lg:max-w-[50%] shrink-0">
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-6 max-w-md w-full mx-auto"
        >
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <Logo className="w-8 h-8" />
            <div className="flex flex-col -space-y-1">
              <span className="font-display font-bold text-lg text-black">NovaTask</span>
              <span className="text-[10px] text-zinc-400 font-light">Workspace</span>
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-3 pt-4">
            <span className="inline-flex px-3 py-1 rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600">
              Welcome Back! 👋
            </span>
            <h2 className="text-3xl font-display font-bold text-black tracking-tight leading-tight">
              Sign in to your <span className="text-[#6366f1]">workspace</span>
            </h2>
            <p className="text-zinc-500 text-xs font-light leading-relaxed">
              Access your tasks, projects and AI assistant to boost your productivity.
            </p>
          </div>

          {/* Providers Lists */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => handleOAuthLogin('google')}
              className="w-full py-3 px-4 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-xl flex items-center justify-start gap-4 transition-all shadow-sm cursor-pointer"
            >
              <Chrome className="w-5 h-5 text-red-500" />
              <span className="text-xs font-semibold text-zinc-700">Continue with Google</span>
            </button>
            
            <button
              onClick={() => handleOAuthLogin('apple')}
              className="w-full py-3 px-4 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-xl flex items-center justify-start gap-4 transition-all shadow-sm cursor-pointer"
            >
              <Apple className="w-5 h-5 text-black fill-black" />
              <span className="text-xs font-semibold text-zinc-700">Continue with Apple</span>
            </button>
            
            <button
              onClick={() => handleOAuthLogin('facebook')}
              className="w-full py-3 px-4 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-xl flex items-center justify-start gap-4 transition-all shadow-sm cursor-pointer"
            >
              <Facebook className="w-5 h-5 text-blue-600 fill-blue-600" />
              <span className="text-xs font-semibold text-zinc-700">Continue with Facebook</span>
            </button>

            <button
              onClick={() => setIsEmailModalOpen(true)}
              className="w-full py-3 px-4 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-xl flex items-center justify-start gap-4 transition-all shadow-sm cursor-pointer"
            >
              <Mail className="w-5 h-5 text-indigo-500" />
              <span className="text-xs font-semibold text-zinc-700">Continue with Email</span>
            </button>
          </div>

          <EmailAuthModal
            isOpen={isEmailModalOpen}
            onClose={() => setIsEmailModalOpen(false)}
            mode="login"
            onSuccess={() => navigate('/dashboard')}
          />

          {/* Divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-zinc-200"></div>
            <span className="flex-shrink mx-4 text-zinc-400 text-[10px] font-bold tracking-widest">OR</span>
            <div className="flex-grow border-t border-zinc-200"></div>
          </div>

          {/* Redirect link */}
          <p className="text-center text-xs text-zinc-500 font-light">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-indigo-600 hover:underline">
              Create account
            </Link>
          </p>

          {/* Security policy footer */}
          <div className="pt-6 border-t border-zinc-100 flex items-center justify-center gap-1.5 text-[10px] text-zinc-400 font-light">
            <ShieldAlert className="w-4 h-4 text-zinc-400" />
            Your data is protected with enterprise-grade security
          </div>

        </motion.div>
      </div>

      {/* Right side: Dark Interactive AI Display */}
      <div className="hidden lg:flex flex-1 bg-[#030206] border-l border-white/5 relative items-center justify-center p-12 overflow-hidden">
        
        {/* Glow gradients meshes */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none" />

        {/* Wave pattern at bottom */}
        <svg className="absolute bottom-0 w-full h-32 opacity-25 text-indigo-500 pointer-events-none" viewBox="0 0 720 150" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 60C120 120 240 150 360 90C480 30 600 0 720 30" stroke="currentColor" strokeWidth="1" />
        </svg>

        {/* Outer UI structure */}
        <div className="max-w-md w-full flex flex-col items-center justify-center space-y-8 z-10">
          
          {/* Nova Avatar sphere */}
          <NovaAvatar size="large" state={voiceState} />

          {/* Nova Ready State Badge */}
          <div className="text-center space-y-1">
            <h3 className="font-display font-bold text-2xl text-white">Nova</h3>
            <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Ready
            </div>
          </div>

          {/* Controls Capsule card */}
          <div className="w-full max-w-sm bg-[#0a0a0f]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6 text-center">
            <p className="text-sm text-zinc-300 font-medium italic px-4">
              "{voiceMessage}"
            </p>

            {/* Glowing Microphone action */}
            <div className="flex justify-center">
              <motion.button
                onClick={voiceState === 'listening' ? stopListening : startListening}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all shadow-lg ${
                  voiceState === 'listening' 
                    ? 'bg-red-500 text-white shadow-red-500/20' 
                    : 'bg-indigo-600 text-white shadow-indigo-600/30'
                }`}
              >
                {voiceState === 'listening' ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </motion.button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default LoginPage;
