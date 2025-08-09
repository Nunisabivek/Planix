'use client';
import React from 'react';
import Link from 'next/link';
import { MotionConfig, m } from 'framer-motion';

export const dynamic = 'force-dynamic';

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay }
});

export default function HomePage() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-6">
        <m.div className="max-w-5xl mx-auto text-center" {...fadeIn(0)}>
          <m.h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6" {...fadeIn(0.1)}>
            Design with <span className="text-blue-600">Planix</span>
          </m.h1>
          <m.p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto" {...fadeIn(0.2)}>
            AI-powered floor plan generator with smart analysis, material estimation, and a pro-grade editor.
          </m.p>

          <m.div className="grid md:grid-cols-3 gap-6 mb-12" {...fadeIn(0.3)}>
            {[{
              icon: '🏗️', title: 'AI Floor Plans', desc: 'Generate detailed plans using advanced AI'
            },{
              icon: '📊', title: 'Smart Analysis', desc: 'Materials, excavation, and structural insights'
            },{
              icon: '⚡', title: 'Pro Editor', desc: 'Refine plans with an AutoCAD-like experience'
            }].map((f, i) => (
              <m.div key={i} className="bg-white p-6 rounded-xl shadow-lg" whileHover={{ scale: 1.05 }} transition={{ duration: 0.25 }}>
                <div className="text-4xl mb-3">{f.icon}</div>
                <h3 className="text-lg font-semibold mb-1">{f.title}</h3>
                <p className="text-gray-600">{f.desc}</p>
              </m.div>
            ))}
          </m.div>

          <m.div className="flex items-center justify-center gap-4" {...fadeIn(0.4)}>
            <Link href="/signup" className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors">
              Get Started Free
            </Link>
            <Link href="/login" className="bg-gray-100 text-gray-700 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-200 transition-colors">
              Sign In
            </Link>
          </m.div>

          <m.div className="mt-8 text-sm text-gray-500" {...fadeIn(0.5)}>
            <p>🆓 Free: 5 plans • 💎 Pro: Unlimited + analysis for ₹999/month</p>
          </m.div>
        </m.div>
      </div>
    </MotionConfig>
  );
}
