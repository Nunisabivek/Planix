'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

// export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [info, setInfo] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/editor');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const api = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? window.location.origin.replace('vercel.app','up.railway.app').replace('https://planix-seven.','https://planix-production-5228.') : '');
      const response = await fetch(`${api}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.step === 'verify-otp') {
        setOtpStep(true);
        setError('');
        setInfo('We have sent a verification code to your email.');
        return;
      }

      if (response.ok && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({ id: data.userId, plan: data.plan, credits: data.credits, referralCode: data.referralCode }));
        router.push('/editor');
        return;
      }

      if (response.status === 401) setError('Invalid email or password.');
      else if (response.status === 404) setError('No account found with this email.');
      else setError(data.error || 'Login failed. Please try again.');
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const api = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? window.location.origin.replace('vercel.app','up.railway.app').replace('https://planix-seven.','https://planix-production-5228.') : '');
      const response = await fetch(`${api}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await response.json();
      if (response.ok && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({ id: data.userId, plan: data.plan, credits: data.credits, referralCode: data.referralCode }));
        router.push('/editor');
        return;
      }
      setError(data.error || 'Invalid or expired code');
    } catch (e) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-6">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Side - Marketing Content */}
        <motion.div
          className="hidden lg:block"
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Link href="/" className="inline-flex items-center text-2xl font-bold gradient-primary bg-clip-text text-transparent mb-8">
            ← Planix
          </Link>
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Welcome back to the future of{' '}
            <span className="gradient-primary bg-clip-text text-transparent">
              architectural design
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Continue creating professional floor plans with AI-powered precision and analysis.
          </p>
          <div className="space-y-4">
            {[
              '🎯 AI-powered floor plan generation',
              '📊 Smart material & cost analysis',
              '⚡ Real-time collaborative editing',
              '🏗️ Professional-grade output'
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="flex items-center gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1, duration: 0.6 }}
              >
                <span className="text-2xl">{feature.split(' ')[0]}</span>
                <span className="text-muted-foreground">{feature.split(' ').slice(1).join(' ')}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right Side - Login Form */}
        <motion.div
          className="w-full max-w-md mx-auto lg:mx-0"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="glass rounded-2xl p-8 shadow-2xl">
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold mb-2">Sign In</h2>
              <p className="text-muted-foreground">Access your design workspace</p>
            </motion.div>

            {error && (
              <motion.div
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {error}
              </motion.div>
            )}

            <motion.form
              onSubmit={otpStep ? handleVerifyOtp : handleSubmit}
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <div className="space-y-4">
                <div className={otpStep ? 'opacity-60 pointer-events-none' : ''}>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input w-full"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div className={otpStep ? 'hidden' : ''}>
                  <label htmlFor="password" className="block text-sm font-medium mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input w-full"
                    placeholder="Enter your password"
                    required
                  />
                </div>

                {otpStep && (
                  <div>
                    <label htmlFor="otp" className="block text-sm font-medium mb-2">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      id="otp"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="input w-full tracking-widest"
                      placeholder="Enter 6-digit code"
                      minLength={4}
                      maxLength={6}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-2">We sent a 6-digit code to your email. It expires in 10 minutes.</p>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
                          const r = await fetch(`${api}/api/auth/resend-verification`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email })
                          });
                          const d = await r.json();
                          setInfo(d.message || 'If the account exists, we sent a new email.');
                        } catch {
                          setInfo('Unable to resend now. Please try again in a moment.');
                        }
                      }}
                      className="mt-3 text-sm text-primary hover:underline"
                    >
                      Resend verification email
                    </button>
                    {info && <p className="text-xs text-green-600 mt-2">{info}</p>}
                  </div>
                )}
              </div>

              <motion.button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full text-base py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {otpStep ? 'Verifying...' : 'Signing In...'}
                  </div>
                ) : otpStep ? 'Verify Code →' : 'Sign In →'}
              </motion.button>
            </motion.form>

            <motion.div
              className="mt-8 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <p className="text-muted-foreground text-sm mb-3">
                Don't have an account?{' '}
                <Link href="/signup" className="text-primary hover:underline font-medium transition-colors">
                  Create one now
                </Link>
              </p>
              <p className="text-muted-foreground text-sm">
                Forgot your password?{' '}
                <Link href="/forgot-password" className="text-primary hover:underline font-medium transition-colors">
                  Reset it here
                </Link>
              </p>
              <div className="mt-4 pt-4 border-t border-border">
                <Link href="/" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                  ← Back to Home
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Mobile Logo */}
          <div className="lg:hidden text-center mt-8">
            <Link href="/" className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
              Planix
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}