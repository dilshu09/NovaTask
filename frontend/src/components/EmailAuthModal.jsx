import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ShieldCheck, X, ArrowRight, Check, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const EmailAuthModal = ({
  isOpen,
  onClose,
  mode = 'login', // 'login' | 'register'
  initialEmail = '',
  initialName = '',
  onSuccess,
}) => {
  const { sendLoginOtp, verifyLoginOtp, register: authRegister, verifyOtp } = useAuth();
  
  const [step, setStep] = useState(mode === 'login' ? 'email' : 'otp'); // 'email' | 'otp'
  const [email, setEmail] = useState(initialEmail);
  const [emailError, setEmailError] = useState('');
  const [otp, setOtp] = useState(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef([]);

  // Sync state if initialEmail or mode changes
  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail);
      setStep(mode === 'login' ? 'email' : 'otp');
      setOtp(Array(6).fill(''));
      setEmailError('');
      setLoading(false);
      setTimer(60);
      setCanResend(false);
    }
  }, [isOpen, initialEmail, mode]);

  // Handle OTP timer
  useEffect(() => {
    let interval = null;
    if (isOpen && step === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [isOpen, step, timer]);

  // Auto-focus first OTP input when step changes to 'otp'
  useEffect(() => {
    if (step === 'otp' && isOpen) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    }
  }, [step, isOpen]);

  // Simple Email Validation
  const validateEmail = (val) => {
    if (!val) {
      setEmailError('Email address is required');
      return false;
    }
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(val)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!validateEmail(email)) return;

    setLoading(true);
    const result = await sendLoginOtp(email);
    setLoading(false);

    if (result.success) {
      setStep('otp');
      setTimer(60);
      setCanResend(false);
    }
  };

  const handleOtpChange = (index, value) => {
    const val = value.replace(/[^0-9]/g, '');
    if (!val) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    const digit = val.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-advance focus
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/[^0-9]/g, '');
    if (pastedData.length >= 6) {
      const newOtp = pastedData.slice(0, 6).split('');
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    let result;
    if (mode === 'login') {
      result = await verifyLoginOtp(email, otpCode);
    } else {
      result = await verifyOtp(email, otpCode);
    }
    setLoading(false);

    if (result.success) {
      onSuccess?.();
      onClose();
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    setLoading(true);
    let result;
    if (mode === 'login') {
      result = await sendLoginOtp(email);
    } else {
      // Register mode resend is simply re-triggering register API
      result = await authRegister(initialName, email);
    }
    setLoading(false);

    if (result.success) {
      setTimer(60);
      setCanResend(false);
      setOtp(Array(6).fill(''));
      inputRefs.current[0]?.focus();
    }
  };

  // Trigger verify automatically once all 6 digits are filled
  const isOtpComplete = otp.every((val) => val !== '');
  useEffect(() => {
    if (isOtpComplete && isOpen && step === 'otp' && !loading) {
      handleVerifyOtp();
    }
  }, [otp, isOtpComplete]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal content container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md bg-white rounded-3xl border border-zinc-150 shadow-2xl p-8 z-10 overflow-hidden text-zinc-800"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-650 rounded-full hover:bg-zinc-150 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

          <AnimatePresence mode="wait">
            {step === 'email' ? (
              <motion.div
                key="email-step"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                {/* Header */}
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-display font-bold text-xl text-black">Sign in with Email</h3>
                    <p className="text-zinc-500 text-xs font-light max-w-[280px]">
                      Enter your address below. We'll send you a 6-digit confirmation code.
                    </p>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError('');
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-850 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 transition-all placeholder-zinc-400 font-sans"
                      placeholder="name@company.com"
                      autoFocus
                    />
                    {emailError && (
                      <p className="text-red-500 text-xs font-medium">{emailError}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/10 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Sending Code...' : 'Send Verification OTP'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="otp-step"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                {/* Header */}
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-display font-bold text-xl text-black">Verify Email Address</h3>
                    <p className="text-zinc-500 text-xs font-light max-w-[280px]">
                      Enter the 6-digit confirmation code we sent to{' '}
                      <span className="font-semibold text-zinc-700">{email}</span>
                    </p>
                  </div>
                </div>

                {/* OTP Inputs Grid */}
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                        Verification Code
                      </label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => setStep('email')}
                          className="text-[10px] font-semibold text-indigo-600 hover:underline cursor-pointer transition-all"
                        >
                          Change Email
                        </button>
                      )}
                    </div>

                    {/* Code Inputs Grid */}
                    <div className="flex justify-between gap-2 py-1">
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (inputRefs.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          onPaste={handleOtpPaste}
                          className="w-12 h-14 text-center text-xl font-bold rounded-xl border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 transition-all font-mono shadow-sm"
                        />
                      ))}
                    </div>

                    {/* Developer Mock OTP Helper Note */}
                    <p className="text-[10px] text-zinc-400 text-center leading-normal px-2 mt-2 bg-zinc-50 rounded-lg p-2 border border-zinc-100">
                      Check your terminal console logs to view the verification OTP.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || !isOtpComplete}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/10 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Verifying Code...' : 'Verify & Complete'}
                    <Check className="w-4 h-4" />
                  </button>
                </form>

                {/* Resend Cooldown UI */}
                <div className="flex flex-col items-center space-y-2 pt-2 border-t border-zinc-100 text-xs">
                  {canResend ? (
                    <button
                      onClick={handleResendCode}
                      disabled={loading}
                      className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-500 font-semibold cursor-pointer disabled:opacity-50 transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                      Resend Code
                    </button>
                  ) : (
                    <span className="text-zinc-400 font-light">
                      Resend code in <span className="font-semibold text-zinc-600 font-mono">{timer}s</span>
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default EmailAuthModal;
