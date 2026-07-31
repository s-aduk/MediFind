'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ShieldCheck, Loader2, ArrowRight } from 'lucide-react';
import { signIn, signUp, confirmSignUp } from '../lib/auth';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';

const inputWrapClass = 'relative';
const inputClass =
  'w-full pl-11 pr-4 py-3 bg-ivory-dim border border-pine-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-pine focus:border-pine transition-all text-ink placeholder:text-ink-soft/60';
const inputIconClass = 'absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sage pointer-events-none';
const labelClass = 'block text-sm font-medium text-ink mb-2';
const primaryButtonClass =
  'w-full bg-pine text-ivory px-6 py-3 rounded-full font-medium hover:bg-pine-light transition-colors disabled:opacity-60 flex items-center justify-center gap-2';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [tempEmail, setTempEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const result = await signUp(email, password, name);
        if (result.isSignUpComplete !== true) {
          setTempEmail(email);
          setShowVerification(true);
          setError('Please check your email for a verification code.');
        } else {
          alert('Sign up successful! Please log in.');
          setIsSignUp(false);
        }
      } else {
        await signIn(email, password);
        onLogin(); // parent component will update state
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await confirmSignUp(tempEmail, verificationCode);
      alert('Email verified! Please log in.');
      setShowVerification(false);
      setVerificationCode('');
      setIsSignUp(false);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative max-w-md mx-auto mt-14">
      <div className="ambient-glow" aria-hidden="true" />

      <div className="flex items-center justify-between mb-6">
        <Logo href="/" />
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="glass-panel rounded-2xl shadow-lifted p-8 space-y-6"
      >
        <AnimatePresence mode="wait">
          {showVerification ? (
            <motion.div
              key="verify"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              className="space-y-6"
            >
              <div className="text-center">
                <p className="font-mono text-xs uppercase tracking-widest text-clay mb-2">Almost there</p>
                <h2 className="font-display text-2xl font-medium text-pine">Verify your email</h2>
                <p className="text-ink-soft mt-2">A verification code was sent to {tempEmail}</p>
              </div>
              <form onSubmit={handleVerify} className="space-y-5">
                <div>
                  <label htmlFor="verificationCode" className={labelClass}>
                    Verification code
                  </label>
                  <div className={inputWrapClass}>
                    <ShieldCheck className={inputIconClass} aria-hidden="true" />
                    <input
                      id="verificationCode"
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="Enter verification code"
                      className={`${inputClass} font-mono tracking-widest`}
                      required
                    />
                  </div>
                </div>
                {error && (
                  <div className="bg-brick-soft border-l-4 border-brick text-brick p-4 rounded-r-lg" role="alert">
                    <p className="font-medium">{error}</p>
                  </div>
                )}
                <motion.button
                  whileHover={{ scale: loading ? 1 : 1.01 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  type="submit"
                  disabled={loading}
                  className={primaryButtonClass}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify email
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              className="space-y-6"
            >
              <div className="text-center">
                <p className="font-mono text-xs uppercase tracking-widest text-clay mb-2">
                  {isSignUp ? 'Get started' : 'Secure sign-in'}
                </p>
                <h2 className="font-display text-2xl font-medium text-pine">
                  {isSignUp ? 'Create your account' : 'Welcome back'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <AnimatePresence initial={false}>
                  {isSignUp && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginBottom: 0 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <label htmlFor="name" className={labelClass}>
                        Full name
                      </label>
                      <div className={inputWrapClass}>
                        <User className={inputIconClass} aria-hidden="true" />
                        <input
                          id="name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter your full name"
                          className={inputClass}
                          required
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label htmlFor="email" className={labelClass}>
                    Email address
                  </label>
                  <div className={inputWrapClass}>
                    <Mail className={inputIconClass} aria-hidden="true" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className={inputClass}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className={labelClass}>
                    Password
                  </label>
                  <div className={inputWrapClass}>
                    <Lock className={inputIconClass} aria-hidden="true" />
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a strong password"
                      className={inputClass}
                      required
                      minLength="8"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-brick-soft border-l-4 border-brick text-brick p-4 rounded-r-lg" role="alert">
                    <p className="font-medium">{error}</p>
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: loading ? 1 : 1.01 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  type="submit"
                  disabled={loading}
                  className={primaryButtonClass}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {isSignUp ? 'Create account' : 'Sign in'}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </>
                  )}
                </motion.button>
              </form>

              <div className="text-center text-sm text-ink-soft">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                  }}
                  className="font-medium text-pine hover:text-pine-light ml-1.5"
                >
                  {isSignUp ? 'Sign in' : 'Create account'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
