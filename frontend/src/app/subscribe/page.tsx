'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    Razorpay: any;
  }
}

// export const dynamic = 'force-dynamic';

export default function SubscribePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token) {
      router.push('/login');
      return;
    }
    
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [router]);

  const handleSubscribe = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    setIsLoading(true);

    try {
      // Create order on backend
      const api = process.env.NEXT_PUBLIC_API_URL || 'https://planix-production.up.railway.app';
      const orderRes = await fetch(`${api}/api/payment/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount: 999,
        currency: 'INR',
          receipt: `receipt_${Date.now()}`,
          notes: { plan: 'PRO' },
      }),
    });

      if (!orderRes.ok) {
        throw new Error('Failed to create order');
      }

    const order = await orderRes.json();

      // Open Razorpay checkout
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'YOUR_KEY_ID',
      amount: order.amount,
      currency: order.currency,
      name: 'Planix Pro',
        description: 'Monthly Pro Subscription',
      order_id: order.id,
      handler: async function (response: any) {
          try {
            // Verify payment on backend
            const verifyRes = await fetch(`${api}/api/payment/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            order_id: response.razorpay_order_id,
            payment_id: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          }),
        });
            
        const verificationData = await verifyRes.json();
            
            if (verifyRes.ok) {
              // Update local user data
              const updatedUser = { ...user, plan: 'PRO' };
              localStorage.setItem('user', JSON.stringify(updatedUser));
              setUser(updatedUser);
              
              // Show success and redirect
              alert('🎉 Welcome to Planix Pro! Your subscription is now active.');
              router.push('/editor');
            } else {
              throw new Error(verificationData.message || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            alert('Payment verification failed. Please contact support.');
          }
      },
      prefill: {
          name: user?.name || 'User',
          email: user?.email || '',
      },
      theme: {
          color: '#3b82f6',
      },
        modal: {
          ondismiss: function() {
            setIsLoading(false);
          }
        }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
      
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to start subscription process. Please try again.');
      setIsLoading(false);
    }
  };

  const features = [
    { icon: '🚀', title: 'Unlimited AI Generations', desc: 'Create as many floor plans as you need' },
    { icon: '📊', title: 'Advanced Analysis', desc: 'Material estimation & structural insights' },
    { icon: '💎', title: 'Pro Editor Tools', desc: 'Advanced editing with precision controls' },
    { icon: '🔄', title: 'Unlimited Revisions', desc: 'Iterate and perfect your designs' },
    { icon: '📱', title: 'Priority Support', desc: 'Get help when you need it most' },
    { icon: '📁', title: 'Export Formats', desc: 'Download in multiple professional formats' }
  ];

  return (
    <div className="min-h-screen gradient-bg">
      {/* Navigation */}
      <motion.nav 
        className="fixed top-0 w-full z-50 glass"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
              Planix
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/editor" className="btn-outline">Back to Editor</Link>
              {user?.plan === 'PRO' ? (
                <div className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  ✓ Pro Member
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Unlock the Full Power of{' '}
              <span className="gradient-primary bg-clip-text text-transparent">
                Planix Pro
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Take your architectural designs to the next level with unlimited AI generations, 
              advanced analysis tools, and professional-grade features.
            </p>
            
            {user?.plan === 'PRO' ? (
              <motion.div
                className="inline-flex items-center gap-3 px-6 py-3 bg-green-50 border border-green-200 rounded-full text-green-700 font-medium"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                You're already a Pro member!
              </motion.div>
            ) : (
              <motion.button
                onClick={handleSubscribe}
                disabled={isLoading}
                className="btn-primary text-lg px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  'Upgrade to Pro for ₹999/month →'
                )}
              </motion.button>
            )}
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-6">
              Everything you need to design like a{' '}
              <span className="gradient-primary bg-clip-text text-transparent">
                professional
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Pro features that save time and deliver exceptional results
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="card p-6 hover:shadow-xl transition-all duration-300 group"
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: { opacity: 1, y: 0 }
                }}
                whileHover={{ y: -5 }}
              >
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Comparison */}
      <section className="py-20 px-6 bg-white/50">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-6">Simple, transparent pricing</h2>
            <p className="text-xl text-muted-foreground">
              Start free, upgrade when you're ready for more power
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.2
                }
              }
            }}
          >
            {/* Free Plan */}
            <motion.div
              className="card p-8 border border-gray-200"
              variants={{
                hidden: { opacity: 0, scale: 0.95 },
                visible: { opacity: 1, scale: 1 }
              }}
            >
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">Free</h3>
                <div className="text-4xl font-bold mb-6">₹0<span className="text-lg text-muted-foreground">/month</span></div>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center gap-3">
                    <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm">✓</span>
                    5 AI floor plan generations
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm">✓</span>
                    Basic 2D editor
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm">✓</span>
                    Standard export formats
                  </li>
                  <li className="flex items-center gap-3 opacity-50">
                    <span className="w-5 h-5 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-sm">×</span>
                    Advanced analysis
                  </li>
                  <li className="flex items-center gap-3 opacity-50">
                    <span className="w-5 h-5 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-sm">×</span>
                    Priority support
                  </li>
                </ul>
                <Link href="/signup" className="btn-outline w-full">Current Plan</Link>
              </div>
            </motion.div>

            {/* Pro Plan */}
            <motion.div
              className="card p-8 border-2 gradient-primary relative overflow-hidden"
              variants={{
                hidden: { opacity: 0, scale: 0.95 },
                visible: { opacity: 1, scale: 1 }
              }}
            >
              <div className="absolute top-4 right-4 bg-white text-purple-600 px-3 py-1 rounded-full text-sm font-semibold">
                Recommended
              </div>
              <div className="text-center text-white">
                <h3 className="text-2xl font-bold mb-2">Pro</h3>
                <div className="text-4xl font-bold mb-6">₹999<span className="text-lg opacity-80">/month</span></div>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center gap-3">
                    <span className="w-5 h-5 bg-white/20 text-white rounded-full flex items-center justify-center text-sm">✓</span>
                    Unlimited AI generations
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-5 h-5 bg-white/20 text-white rounded-full flex items-center justify-center text-sm">✓</span>
                    Advanced pro editor
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-5 h-5 bg-white/20 text-white rounded-full flex items-center justify-center text-sm">✓</span>
                    Material & cost estimation
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-5 h-5 bg-white/20 text-white rounded-full flex items-center justify-center text-sm">✓</span>
                    Structural analysis
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-5 h-5 bg-white/20 text-white rounded-full flex items-center justify-center text-sm">✓</span>
                    Priority support
                  </li>
                </ul>
                {user?.plan === 'PRO' ? (
                  <div className="w-full bg-white/20 text-white py-3 rounded-lg font-semibold">
                    ✓ Active Subscription
                  </div>
                ) : (
        <button
          onClick={handleSubscribe}
                    disabled={isLoading}
                    className="btn-secondary w-full bg-white text-purple-600 hover:bg-gray-100"
        >
                    {isLoading ? 'Processing...' : 'Upgrade Now'}
        </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-6">Frequently Asked Questions</h2>
          </motion.div>

          <motion.div
            className="space-y-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
          >
            {[
              {
                q: "Can I cancel my subscription anytime?",
                a: "Yes, you can cancel your Pro subscription at any time. You'll continue to have Pro access until the end of your billing period."
              },
              {
                q: "Do you offer refunds?",
                a: "We offer a 7-day money-back guarantee for new Pro subscriptions. Contact our support team for assistance."
              },
              {
                q: "What happens to my designs if I downgrade?",
                a: "All your designs remain accessible. However, you'll be limited to the Free plan features for new generations."
              },
              {
                q: "Is there a discount for annual billing?",
                a: "Contact our sales team for annual billing options and potential discounts for long-term commitments."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                className="card p-6"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
              >
                <h3 className="font-semibold text-lg mb-2">{faq.q}</h3>
                <p className="text-muted-foreground">{faq.a}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-2xl font-bold gradient-primary bg-clip-text text-transparent mb-4">
            Planix
          </div>
          <p className="text-gray-400 mb-6">
            Professional AI-powered floor plan generation
          </p>
          <div className="flex justify-center gap-8 text-sm text-gray-400">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/editor" className="hover:text-white transition-colors">Editor</Link>
            <Link href="/login" className="hover:text-white transition-colors">Login</Link>
          </div>
      </div>
      </footer>
    </div>
  );
}