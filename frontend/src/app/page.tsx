'use client';
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }
  }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.15
    }
  }
};

const scaleIn = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const features = [
  {
    icon: '🎯',
    title: 'AI-Powered Generation',
    description: 'Create detailed floor plans in seconds using advanced AI technology'
  },
  {
    icon: '🔧',
    title: 'Professional Editor',
    description: 'Refine your designs with our AutoCAD-like professional editing tools'
  },
  {
    icon: '📊',
    title: 'Smart Analysis',
    description: 'Get material estimates, structural analysis, and cost calculations'
  },
  {
    icon: '⚡',
    title: 'Lightning Fast',
    description: 'Generate and iterate on designs faster than traditional methods'
  },
  {
    icon: '💰',
    title: 'Cost Estimation',
    description: 'Accurate material quantities and excavation calculations'
  },
  {
    icon: '🏗️',
    title: 'Engineering Grade',
    description: 'Professional-grade plans with structural considerations'
  }
];

export default function HomePage() {
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
            <motion.div 
              className="text-2xl font-bold gradient-primary bg-clip-text text-transparent"
              whileHover={{ scale: 1.05 }}
            >
              Planix
            </motion.div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="btn-outline">Sign In</Link>
              <Link href="/signup" className="btn-primary">Get Started</Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center max-w-4xl mx-auto"
            variants={stagger}
            initial="initial"
            animate="animate"
          >
            <motion.h1
              className="text-6xl md:text-7xl font-bold mb-8 leading-tight"
              variants={fadeInUp}
            >
              Design the Future with{' '}
              <span className="gradient-primary bg-clip-text text-transparent">
                AI-Powered
              </span>{' '}
              Floor Plans
              <span className="text-xs text-blue-300 block mt-2">v2.0 - Authentication & Forgot Password!</span>
            </motion.h1>
            
            <motion.p
              className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed"
              variants={fadeInUp}
            >
              Transform your architectural vision into reality with our intelligent floor plan generator. 
              Get professional-grade designs, material estimates, and structural analysis in minutes.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16"
              variants={fadeInUp}
            >
              <Link 
                href="/signup" 
                className="btn-primary text-lg px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Start Creating Free →
              </Link>
              <Link 
                href="/editor" 
                className="btn-outline text-lg px-8 py-4 rounded-full"
              >
                Try Demo
              </Link>
            </motion.div>

            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700 text-sm font-medium"
              variants={scaleIn}
            >
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Free tier includes 5 AI generations
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Everything you need to{' '}
              <span className="gradient-primary bg-clip-text text-transparent">
                design smarter
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Professional-grade tools powered by AI to streamline your architectural workflow
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="card p-8 hover:shadow-xl transition-all duration-300 group"
                variants={fadeInUp}
                whileHover={{ y: -8 }}
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-muted-foreground">
              Start free, upgrade when you need more power
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto"
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {/* Free Plan */}
            <motion.div
              className="card p-8 border-2 border-gray-200"
              variants={scaleIn}
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
                    Download PNG/PDF
                  </li>
                </ul>
                <Link href="/signup" className="btn-outline w-full">Get Started</Link>
              </div>
            </motion.div>

            {/* Pro Plan */}
            <motion.div
              className="card p-8 border-2 gradient-primary relative overflow-hidden"
              variants={scaleIn}
            >
              <div className="absolute top-4 right-4 bg-white text-purple-600 px-3 py-1 rounded-full text-sm font-semibold">
                Popular
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
                    Advanced editor with analysis
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
                <Link href="/subscribe" className="btn-secondary w-full bg-white text-purple-600 hover:bg-gray-100">
                  Upgrade to Pro
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to revolutionize your design process?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of architects and designers already using Planix
          </p>
          <Link 
            href="/signup" 
            className="btn-primary text-lg px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Start Building Today →
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-2xl font-bold gradient-primary bg-clip-text text-transparent mb-4">
            Planix
          </div>
          <p className="text-gray-400 mb-6">
            AI-powered floor plan generation for the modern architect
          </p>
          <div className="flex justify-center gap-8 text-sm text-gray-400">
            <Link href="/login" className="hover:text-white transition-colors">Login</Link>
            <Link href="/signup" className="hover:text-white transition-colors">Sign Up</Link>
            <Link href="/subscribe" className="hover:text-white transition-colors">Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
