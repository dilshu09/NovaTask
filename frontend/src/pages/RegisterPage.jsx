import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Sparkles, ArrowRight, Check, KeyRound, Chrome, Apple, Facebook, ShieldCheck, HelpCircle, Compass, Activity } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useVoice } from '../contexts/VoiceContext';
import { registerSchema } from '../validators/authValidator';
import { slideUp, staggerContainer, scaleIn } from '../animations/motion';
import Logo from '../components/Logo';
import NovaAvatar from '../components/NovaAvatar';
import EmailAuthModal from '../components/EmailAuthModal';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register: authRegister, loginOAuthMock } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [savedEmail, setSavedEmail] = useState('');
  const [savedName, setSavedName] = useState('');
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);

  // Forms setup
  const infoForm = useForm({ resolver: zodResolver(registerSchema) });

  const onInfoSubmit = async (data) => {
    setLoading(true);
    const result = await authRegister(data.name, data.email);
    setLoading(false);
    if (result.success) {
      setSavedEmail(data.email);
      setSavedName(data.name);
      setIsOtpModalOpen(true);
    }
  };

  const handleOAuthRegister = async (provider) => {
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
    const handleVoiceGoogle = () => handleOAuthRegister('google');
    const handleVoiceApple = () => handleOAuthRegister('apple');
    const handleVoiceFacebook = () => handleOAuthRegister('facebook');

    window.addEventListener('voice_oauth_google', handleVoiceGoogle);
    window.addEventListener('voice_oauth_apple', handleVoiceApple);
    window.addEventListener('voice_oauth_facebook', handleVoiceFacebook);

    return () => {
      window.removeEventListener('voice_oauth_google', handleVoiceGoogle);
      window.removeEventListener('voice_oauth_apple', handleVoiceApple);
      window.removeEventListener('voice_oauth_facebook', handleVoiceFacebook);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row items-stretch justify-center bg-white text-zinc-800">
      
      {/* Left side: Light SignUp Form Panel */}
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

          {/* Stepper info banner */}
          <div className="space-y-3 pt-4">
            <span className="inline-flex px-3 py-1 rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600">
              Create Account 👋
            </span>
            <h2 className="text-3xl font-display font-bold text-black tracking-tight leading-tight">
              Create <span className="text-[#6366f1]">your account</span>
            </h2>
            <p className="text-zinc-500 text-xs font-light leading-relaxed">
              Start your productivity journey today.
            </p>
          </div>

          <div className="space-y-5">
            {/* Social Actions */}
            <div className="space-y-3">
              <button
                onClick={() => handleOAuthRegister('google')}
                className="w-full py-3 px-4 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-xl flex items-center justify-start gap-4 transition-all shadow-sm cursor-pointer"
              >
                <Chrome className="w-5 h-5 text-red-500" />
                <span className="text-xs font-semibold text-zinc-700">Continue with Google</span>
              </button>

              <button
                onClick={() => handleOAuthRegister('facebook')}
                className="w-full py-3 px-4 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-xl flex items-center justify-start gap-4 transition-all shadow-sm cursor-pointer"
              >
                <Facebook className="w-5 h-5 text-blue-600 fill-blue-600" />
                <span className="text-xs font-semibold text-zinc-700">Continue with Facebook</span>
              </button>

              <button
                onClick={() => handleOAuthRegister('apple')}
                className="w-full py-3 px-4 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-xl flex items-center justify-start gap-4 transition-all shadow-sm cursor-pointer"
              >
                <Apple className="w-5 h-5 text-black fill-black" />
                <span className="text-xs font-semibold text-zinc-700">Continue with Apple</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-zinc-200"></div>
              <span className="flex-shrink mx-4 text-zinc-400 text-[10px] font-bold tracking-widest">OR</span>
              <div className="flex-grow border-t border-zinc-200"></div>
            </div>

            {/* Registration inputs */}
            <form onSubmit={infoForm.handleSubmit(onInfoSubmit)} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    {...infoForm.register('name')}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-800 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="Enter your full name"
                  />
                </div>
                {infoForm.formState.errors.name && (
                  <p className="text-red-500 text-xs mt-1">{infoForm.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    {...infoForm.register('email')}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-800 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="Enter your email address"
                  />
                </div>
                {infoForm.formState.errors.email && (
                  <p className="text-red-500 text-xs mt-1">{infoForm.formState.errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-indigo-600/10"
              >
                {loading ? 'Requesting OTP...' : 'Continue'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Redirect login */}
            <p className="text-center text-xs text-zinc-500 font-light">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-indigo-600 hover:underline">
                Sign In
              </Link>
            </p>

            {/* Agreement */}
            <p className="text-center text-[10px] text-zinc-400 font-light leading-relaxed px-4">
              By continuing, you agree to our <a href="#" className="text-indigo-600 hover:underline">Terms of Service</a> and <a href="#" className="text-indigo-600 hover:underline">Privacy Policy</a>.
            </p>
          </div>

          <EmailAuthModal
            isOpen={isOtpModalOpen}
            onClose={() => setIsOtpModalOpen(false)}
            mode="register"
            initialEmail={savedEmail}
            initialName={savedName}
            onSuccess={() => navigate('/dashboard')}
          />

        </motion.div>
      </div>

      {/* Right side: Dark Feature Presentation Panel */}
      <div className="hidden lg:flex flex-1 bg-[#030206] border-l border-white/5 relative items-center justify-center p-12 overflow-hidden">
        
        {/* Glow meshes */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none" />

        {/* Wave details */}
        <svg className="absolute bottom-0 w-full h-32 opacity-25 text-indigo-500 pointer-events-none" viewBox="0 0 720 150" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 60C120 120 240 150 360 90C480 30 600 0 720 30" stroke="currentColor" strokeWidth="1" />
        </svg>

        <div className="max-w-md w-full flex flex-col items-center justify-center space-y-10 z-10">
          
          {/* Avatar sphere */}
          <NovaAvatar size="medium" state="ready" />

          {/* Heading */}
          <div className="text-center space-y-1.5">
            <h3 className="font-display font-bold text-3xl text-white">Meet Nova</h3>
            <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Ready to assist you!
            </div>
          </div>

          {/* Feature highlights grid */}
          <div className="grid grid-cols-2 gap-4 w-full px-4">
            
            {/* AI Powered */}
            <div className="glass-panel p-4 rounded-xl border border-white/5 bg-[#0a0a0f]/40 flex flex-col gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#141223] border border-white/5 flex items-center justify-center text-indigo-400">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-semibold text-white">AI Powered</h4>
                <p className="text-[9px] text-zinc-500 font-light leading-normal">Intelligent assistance for smarter decisions.</p>
              </div>
            </div>

            {/* Stay Organized */}
            <div className="glass-panel p-4 rounded-xl border border-white/5 bg-[#0a0a0f]/40 flex flex-col gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#141223] border border-white/5 flex items-center justify-center text-indigo-400">
                <Compass className="w-4.5 h-4.5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-semibold text-white">Stay Organized</h4>
                <p className="text-[9px] text-zinc-500 font-light leading-normal">Tasks, projects, and schedules in perfect harmony.</p>
              </div>
            </div>

            {/* Boost Productivity */}
            <div className="glass-panel p-4 rounded-xl border border-white/5 bg-[#0a0a0f]/40 flex flex-col gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#141223] border border-white/5 flex items-center justify-center text-indigo-400">
                <Activity className="w-4.5 h-4.5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-semibold text-white">Boost Productivity</h4>
                <p className="text-[9px] text-zinc-500 font-light leading-normal">Focus on what matters, Nova handles the rest.</p>
              </div>
            </div>

            {/* Enterprise Grade */}
            <div className="glass-panel p-4 rounded-xl border border-white/5 bg-[#0a0a0f]/40 flex flex-col gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#141223] border border-white/5 flex items-center justify-center text-indigo-400">
                <ShieldCheck className="w-4.5 h-4.5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-semibold text-white">Enterprise Grade</h4>
                <p className="text-[9px] text-zinc-500 font-light leading-normal">Your data is secure with top-tier encryption.</p>
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
};

export default RegisterPage;
