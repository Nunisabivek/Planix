'use client';
import React from 'react';
import Link from 'next/link';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Welcome to <span className="text-blue-600">Planix</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          AI-powered floor plan generator with intelligent design analysis, 
          material estimation, and structural insights. Create professional 
          architectural plans in minutes.
        </p>
        
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">🏗️</div>
            <h3 className="text-lg font-semibold mb-2">AI Floor Plans</h3>
            <p className="text-gray-600">Generate detailed floor plans using advanced AI models</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-lg font-semibold mb-2">Smart Analysis</h3>
            <p className="text-gray-600">Material estimation, structural analysis, and cost calculation</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">⚡</div>
            <h3 className="text-lg font-semibold mb-2">Professional Editor</h3>
            <p className="text-gray-600">Edit and refine your plans with our AutoCAD-like editor</p>
          </div>
        </div>

        <div className="space-x-4">
          <Link href="/signup" className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors">
            Get Started Free
          </Link>
          <Link href="/login" className="bg-gray-100 text-gray-700 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-200 transition-colors">
            Sign In
          </Link>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>🆓 Free: 5 plans • 💎 Pro: Unlimited plans + analysis for ₹999/month</p>
        </div>
      </div>
    </div>
  );
}
