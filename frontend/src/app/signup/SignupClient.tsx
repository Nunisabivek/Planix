'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function SignupClient() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) setReferralCode(ref);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Client-side validation
    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    try {
      const api = process.env.NEXT_PUBLIC_API_URL || 'https://planix-backend.onrender.com';
      const response = await fetch(`${api}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: name.trim(), 
          email: email.trim().toLowerCase(), 
          password, 
          referralCode: referralCode.trim() || undefined 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({ 
          id: data.userId, 
          referralCode: data.referralCode, 
          plan: 'FREE', 
          credits: 5 
        }));
        router.push('/editor');
      } else {
        // Handle specific error messages from backend
        if (data.error.includes('already exists')) {
          setError('An account with this email already exists. Please try logging in instead.');
        } else if (data.error.includes('Invalid referral')) {
          setError('The referral code you entered is invalid. Please check and try again.');
        } else {
          setError(data.error || 'Signup failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Signup error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-6">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, 270, 360],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"
          animate={{
            scale: [1.3, 1, 1.3],
            rotate: [360, 90, 0],
          }}
          transition={{
            duration: 28,
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
            Start designing the{' '}
            <span className="gradient-primary bg-clip-text text-transparent">
              future of architecture
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Join thousands of architects and designers using AI to create professional floor plans in minutes.
          </p>
          
          {/* Benefits */}
          <div className="space-y-6 mb-8">
            {[
              { icon: '🎯', title: 'Get Started Free', desc: '5 AI generations included' },
              { icon: '⚡', title: 'Instant Results', desc: 'Generate plans in seconds' },
              { icon: '💰', title: 'Save Money', desc: 'Reduce design costs by 80%' }
            ].map((benefit, index) => (
              <motion.div
                key={index}
                className="flex items-start gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1, duration: 0.6 }}
              >
                <div className="text-2xl">{benefit.icon}</div>
                <div>
                  <h3 className="font-semibold text-lg">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {referralCode && (
            <motion.div
              className="bg-green-50 border border-green-200 rounded-lg p-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <div className="flex items-center gap-2 text-green-700">
                <span className="text-lg">🎉</span>
                <span className="font-semibold">You're invited!</span>
              </div>
              <p className="text-green-600 text-sm mt-1">
                Get 50% off your first Pro subscription with referral code: <strong>{referralCode}</strong>
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Right Side - Signup Form */}
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
              <h2 className="text-3xl font-bold mb-2">Create Account</h2>
              <p className="text-muted-foreground">Start your architectural journey</p>
            </motion.div>

            {error && (
              <motion.div
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {error}
                {error.includes('already exists') && (
                  <div className="mt-2">
                    <Link href="/login" className="text-red-800 underline hover:text-red-900 font-medium">
                      Go to Login →
                    </Link>
                  </div>
                )}
              </motion.div>
            )}

            <motion.form
              onSubmit={handleSubmit}
              className="space-y-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input w-full"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
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

                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input w-full"
                    placeholder="Create a secure password"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="referralCode" className="block text-sm font-medium mb-2">
                    Referral Code{' '}
                    <span className="text-muted-foreground text-xs">(optional)</span>
                  </label>
                  <input
                    type="text"
                    id="referralCode"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    className="input w-full"
                    placeholder="Enter referral code"
                  />
                  {referralCode && (
                    <p className="text-green-600 text-xs mt-1">
                      ✓ 50% discount will be applied to your first Pro subscription
                    </p>
                  )}
                </div>
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
                    Creating Account...
                  </div>
                ) : (
                  'Create Account →'
                )}
              </motion.button>

              <p className="text-xs text-muted-foreground text-center">
                By creating an account, you agree to our Terms of Service and Privacy Policy
              </p>
            </motion.form>

            <motion.div
              className="mt-8 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <p className="text-muted-foreground text-sm">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:underline font-medium transition-colors">
                  Sign in here
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