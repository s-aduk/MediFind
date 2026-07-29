'use client';

import { useState } from 'react';
import {
  signIn,
  signUp,
  confirmSignUp,
  forgotPassword,
  confirmForgotPassword,
} from '../lib/auth';

export default function Login({ onLogin }) {
  // Auth modes: 'signin', 'signup', 'verify', 'forgot', 'reset'
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tempEmail, setTempEmail] = useState('');

  const clearForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setVerificationCode('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      clearForm();
      onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signUp(email, password, name);
      if (result.isSignUpComplete !== true) {
        setTempEmail(email);
        setMode('verify');
        setError('Please check your email for a verification code.');
      } else {
        alert('Sign up successful! Please sign in.');
        setMode('signin');
        clearForm();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await confirmSignUp(tempEmail, verificationCode);
      alert('Email verified! Please sign in.');
      setMode('signin');
      clearForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setTempEmail(email);
      setMode('reset');
      setError('Reset code sent to your email. Please check your inbox.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await confirmForgotPassword(tempEmail, verificationCode, newPassword);
      alert('Password reset successful! Please sign in with your new password.');
      setMode('signin');
      clearForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderSignIn = () => (
    <form onSubmit={handleSignIn} className="space-y-5">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
          required
          autoComplete="email"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
          required
          autoComplete="current-password"
        />
      </div>
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p className="font-medium">{error}</p>
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-green-600 to-green-400 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity shadow-lg transform hover:-translate-y-1 flex items-center justify-center space-x-2"
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );

  const renderSignUp = () => (
    <form onSubmit={handleSignUp} className="space-y-5">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Full Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your full name"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
          required
          autoComplete="name"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
          required
          autoComplete="email"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Create a strong password (min 8 chars)"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p className="font-medium">{error}</p>
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-green-600 to-green-400 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity shadow-lg transform hover:-translate-y-1 flex items-center justify-center space-x-2"
      >
        {loading ? 'Creating account...' : 'Create Account'}
      </button>
    </form>
  );

  const renderVerify = () => (
    <form onSubmit={handleVerify} className="space-y-4">
      <p className="text-gray-600 text-center mb-4">
        A verification code was sent to <strong>{tempEmail}</strong>
      </p>
      <div>
        <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-2">
          Verification Code
        </label>
        <input
          id="verificationCode"
          type="text"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          placeholder="Enter 6-digit code"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-center tracking-widest"
          required
          maxLength={6}
          autoComplete="one-time-code"
        />
      </div>
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p className="font-medium">{error}</p>
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-green-600 to-green-400 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity shadow-lg transform hover:-translate-y-1 flex items-center justify-center space-x-2"
      >
        {loading ? 'Verifying...' : 'Verify Email'}
      </button>
    </form>
  );

  const renderForgotPassword = () => (
    <form onSubmit={handleForgotPassword} className="space-y-5">
      <p className="text-gray-600 text-center mb-4">
        Enter your email address and we'll send you a reset code.
      </p>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
          required
          autoComplete="email"
        />
      </div>
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p className="font-medium">{error}</p>
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-green-600 to-green-400 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity shadow-lg transform hover:-translate-y-1 flex items-center justify-center space-x-2"
      >
        {loading ? 'Sending code...' : 'Send Reset Code'}
      </button>
    </form>
  );

  const renderResetPassword = () => (
    <form onSubmit={handleResetPassword} className="space-y-5">
      <p className="text-gray-600 text-center mb-4">
        Enter the reset code sent to <strong>{tempEmail}</strong> and your new password.
      </p>
      <div>
        <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-2">
          Reset Code
        </label>
        <input
          id="verificationCode"
          type="text"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          placeholder="Enter 6-digit code"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-center tracking-widest"
          required
          maxLength={6}
          autoComplete="one-time-code"
        />
      </div>
      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
          New Password
        </label>
        <input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New password (min 8 chars)"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
          Confirm New Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p className="font-medium">{error}</p>
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-green-600 to-green-400 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity shadow-lg transform hover:-translate-y-1 flex items-center justify-center space-x-2"
      >
        {loading ? 'Resetting...' : 'Reset Password'}
      </button>
    </form>
  );

  return (
    <div className="max-w-md mx-auto mt-14 bg-white rounded-xl shadow-lg p-8 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 text-center">
        {mode === 'signin' && 'Welcome Back'}
        {mode === 'signup' && 'Create Account'}
        {mode === 'verify' && 'Verify Your Email'}
        {mode === 'forgot' && 'Forgot Password'}
        {mode === 'reset' && 'Reset Password'}
      </h2>

      {mode === 'signin' && renderSignIn()}
      {mode === 'signup' && renderSignUp()}
      {mode === 'verify' && renderVerify()}
      {mode === 'forgot' && renderForgotPassword()}
      {mode === 'reset' && renderResetPassword()}

      <div className="text-center text-sm text-gray-600 space-y-2">
        {mode === 'signin' && (
          <>
            <p>
              Don't have an account?{' '}
              <button
                onClick={() => {
                  setMode('signup');
                  clearForm();
                }}
                className="font-medium text-green-600 hover:text-green-500 ml-1"
              >
                Create Account
              </button>
            </p>
            <p>
              <button
                onClick={() => {
                  setMode('forgot');
                  clearForm();
                }}
                className="font-medium text-green-600 hover:text-green-500"
              >
                Forgot Password?
              </button>
            </p>
          </>
        )}
        {mode === 'signup' && (
          <p>
            Already have an account?{' '}
            <button
              onClick={() => {
                setMode('signin');
                clearForm();
              }}
              className="font-medium text-green-600 hover:text-green-500 ml-1"
            >
              Sign In
            </button>
          </p>
        )}
        {mode === 'verify' && (
          <p>
            <button
              onClick={() => {
                setMode('signin');
                clearForm();
              }}
              className="font-medium text-green-600 hover:text-green-500"
            >
              Back to Sign In
            </button>
          </p>
        )}
        {mode === 'forgot' && (
          <p>
            <button
              onClick={() => {
                setMode('signin');
                clearForm();
              }}
              className="font-medium text-green-600 hover:text-green-500"
            >
              Back to Sign In
            </button>
          </p>
        )}
        {mode === 'reset' && (
          <p>
            <button
              onClick={() => {
                setMode('signin');
                clearForm();
              }}
              className="font-medium text-green-600 hover:text-green-500"
            >
              Back to Sign In
            </button>
          </p>
        )}
      </div>
    </div>
  );
}