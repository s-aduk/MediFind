'use client';

import { useState } from 'react';
import { signIn, signUp, confirmSignUp } from '../lib/auth';

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
      <div className="max-w-md mx-auto mt-14 bg-white rounded-xl shadow-lg p-8 space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 text-center">Verify Your Email</h2>
        <p className="text-gray-600 text-center mb-4">A verification code was sent to {tempEmail}</p>
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <input
              id="verificationCode"
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter verification code"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
              required
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
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-14 bg-white rounded-xl shadow-lg p-8 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 text-center">
        {isSignUp ? 'Create Account' : 'Welcome Back'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        {isSignUp && (
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
            />
          </div>
        )}
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
            placeholder="Create a strong password"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
            required
            minLength="8"
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
          {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
        </button>
      </form>
      <div className="text-center text-sm text-gray-600">
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}
        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError('');
          }}
          className="font-medium text-green-600 hover:text-green-500 ml-1"
        >
          {isSignUp ? 'Sign In' : 'Create Account'}
        </button>
      </div>
    </div>
  );
}