'use client';

import { useState } from 'react';
import { signIn, signUp, confirmSignUp } from '../lib/auth';

const inputClass =
  'w-full px-4 py-3 bg-ivory-dim border border-pine-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-pine focus:border-pine transition-all';
const labelClass = 'block text-sm font-medium text-ink mb-2';
const primaryButtonClass =
  'w-full bg-pine text-ivory px-6 py-3 rounded-full font-medium hover:bg-pine-light transition-colors disabled:opacity-60';

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

  if (showVerification) {
    return (
      <div className="max-w-md mx-auto mt-14 bg-white rounded-2xl shadow-lifted border border-pine-soft/60 p-8 space-y-6">
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
          {error && (
            <div className="bg-brick-soft border-l-4 border-brick text-brick p-4 rounded-r-lg" role="alert">
              <p className="font-medium">{error}</p>
            </div>
          )}
          <button type="submit" disabled={loading} className={primaryButtonClass}>
            {loading ? 'Verifying...' : 'Verify email'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-14 bg-white rounded-2xl shadow-lifted border border-pine-soft/60 p-8 space-y-6">
      <div className="text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-clay mb-2">MediFind</p>
        <h2 className="font-display text-2xl font-medium text-pine">
          {isSignUp ? 'Create your account' : 'Welcome back'}
        </h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        {isSignUp && (
          <div>
            <label htmlFor="name" className={labelClass}>
              Full name
            </label>
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
        )}
        <div>
          <label htmlFor="email" className={labelClass}>
            Email address
          </label>
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
        <div>
          <label htmlFor="password" className={labelClass}>
            Password
          </label>
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
        {error && (
          <div className="bg-brick-soft border-l-4 border-brick text-brick p-4 rounded-r-lg" role="alert">
            <p className="font-medium">{error}</p>
          </div>
        )}
        <button type="submit" disabled={loading} className={primaryButtonClass}>
          {loading ? 'Processing...' : isSignUp ? 'Create account' : 'Sign in'}
        </button>
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
    </div>
  );
}
