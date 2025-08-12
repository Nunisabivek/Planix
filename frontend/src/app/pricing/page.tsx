'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans = {
    FREE: {
      name: 'FREE',
      tagline: 'Perfect for getting started',
      price: { monthly: 0, yearly: 0 },
      features: {
        projects: '5 projects',
        generations: '5 floor plan generations',
        credits: '50 editing credits',
        buildingHeight: 'G+3 buildings only',
        structuralAnalysis: 'Basic structural analysis',
        materialCalculation: 'Limited material calculation',
        exportFormats: 'PDF & PNG export',
        support: 'Community support',
        has3D: false,
        hasAdvanced: false,
        hasCodes: false
      },
      limitations: [
        'Maximum 5 projects',
        'G+3 building height limit',
        'Basic structural analysis only',
        'Limited export formats'
      ],
      cta: 'Get Started Free',
      popular: false
    },
    PRO: {
      name: 'PRO',
      tagline: 'For professional architects & engineers',
      price: { monthly: 999, yearly: 9990 }, // First time user discount
      originalPrice: { monthly: 1599, yearly: 15990 },
      discount: '37% OFF First Time Users',
      features: {
        projects: '20 projects/month',
        generations: '20 floor plan generations',
        credits: 'Unlimited editing credits',
        buildingHeight: 'Unlimited building height',
        structuralAnalysis: 'Advanced structural analysis',
        materialCalculation: 'Full material calculation & estimation',
        exportFormats: 'PDF, PNG, SVG, DXF, AutoCAD, 3D',
        support: 'Priority email support',
        has3D: true,
        hasAdvanced: true,
        hasCodes: true,
        compliance: 'Indian Standard codes (IS codes, NBC 2016)',
        additional: [
          '3D floor plan conversion',
          'Advanced MEP analysis',
          'Cost estimation reports',
          'Structural compliance checks'
        ]
      },
      cta: 'Start PRO Trial',
      popular: true
    },
    PRO_PLUS: {
      name: 'PRO+',
      tagline: 'For enterprises & large firms',
      price: { monthly: 2499, yearly: 24990 },
      features: {
        projects: 'Unlimited projects',
        generations: 'Unlimited generations',
        credits: 'Unlimited editing credits',
        buildingHeight: 'Unlimited building height',
        structuralAnalysis: 'Advanced structural analysis',
        materialCalculation: 'Unlimited quantity calculation',
        exportFormats: 'All formats + Revit integration',
        support: 'Priority phone & email support',
        has3D: true,
        hasAdvanced: true,
        hasCodes: true,
        compliance: 'Global building codes compliance',
        additional: [
          'Unlimited projects & analysis',
          'Revit file export',
          'Team collaboration tools',
          'API access',
          'Custom integrations'
        ]
      },
      cta: 'Contact Sales',
      popular: false
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
              Planix
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-gray-600 hover:text-gray-800">
                Login
              </Link>
              <Link href="/signup" className="btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Professional Pricing for
            <span className="gradient-primary bg-clip-text text-transparent"> Every Need</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            From individual architects to enterprise firms - choose the plan that fits your workflow
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span className={`${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`${billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
              Yearly
            </span>
            {billingCycle === 'yearly' && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                Save 17%
              </span>
            )}
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {Object.entries(plans).map(([planKey, plan], index) => (
            <motion.div
              key={planKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-white rounded-2xl shadow-lg overflow-hidden ${
                plan.popular ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-blue-500 text-white text-center py-2 text-sm font-medium">
                  Most Popular
                </div>
              )}

              <div className={`p-8 ${plan.popular ? 'pt-12' : ''}`}>
                {/* Plan Header */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.tagline}</p>
                  
                  <div className="mb-4">
                    {plan.originalPrice && (
                      <div className="text-sm text-gray-500 line-through mb-1">
                        ₹{plan.originalPrice[billingCycle].toLocaleString()}/{billingCycle.slice(0, -2)}
                      </div>
                    )}
                    <div className="text-4xl font-bold text-gray-900">
                      {plan.price[billingCycle] === 0 ? (
                        'Free'
                      ) : (
                        <>
                          ₹{plan.price[billingCycle].toLocaleString()}
                          <span className="text-lg text-gray-600">/{billingCycle.slice(0, -2)}</span>
                        </>
                      )}
                    </div>
                    {plan.discount && (
                      <div className="text-sm text-green-600 font-medium mt-1">
                        {plan.discount}
                      </div>
                    )}
                  </div>

                  <button className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                    plan.popular 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : planKey === 'FREE'
                      ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      : 'bg-gray-800 text-white hover:bg-gray-900'
                  }`}>
                    {plan.cta}
                  </button>
                </div>

                {/* Features */}
                <div className="space-y-4">
                  <div className="border-t pt-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Core Features</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center text-sm">
                        <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {plan.features.projects}
                      </li>
                      <li className="flex items-center text-sm">
                        <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {plan.features.generations}
                      </li>
                      <li className="flex items-center text-sm">
                        <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {plan.features.credits}
                      </li>
                      <li className="flex items-center text-sm">
                        <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {plan.features.buildingHeight}
                      </li>
                    </ul>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Analysis & Export</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center text-sm">
                        <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {plan.features.structuralAnalysis}
                      </li>
                      <li className="flex items-center text-sm">
                        <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {plan.features.materialCalculation}
                      </li>
                      <li className="flex items-center text-sm">
                        <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {plan.features.exportFormats}
                      </li>
                      {plan.features.compliance && (
                        <li className="flex items-center text-sm">
                          <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {plan.features.compliance}
                        </li>
                      )}
                    </ul>
                  </div>

                  {plan.features.additional && (
                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Advanced Features</h4>
                      <ul className="space-y-2">
                        {plan.features.additional.map((feature, idx) => (
                          <li key={idx} className="flex items-center text-sm">
                            <svg className="w-4 h-4 text-blue-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {plan.limitations && (
                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-red-600 mb-3">Limitations</h4>
                      <ul className="space-y-2">
                        {plan.limitations.map((limitation, idx) => (
                          <li key={idx} className="flex items-center text-sm text-red-600">
                            <svg className="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            {limitation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Feature Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Detailed Feature Comparison
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-4 px-4">Features</th>
                    <th className="text-center py-4 px-4">FREE</th>
                    <th className="text-center py-4 px-4">PRO</th>
                    <th className="text-center py-4 px-4">PRO+</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="py-4 px-4 font-medium">Projects per month</td>
                    <td className="text-center py-4 px-4">5</td>
                    <td className="text-center py-4 px-4">20</td>
                    <td className="text-center py-4 px-4">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-medium">Building height limit</td>
                    <td className="text-center py-4 px-4">G+3</td>
                    <td className="text-center py-4 px-4">Unlimited</td>
                    <td className="text-center py-4 px-4">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-medium">3D Conversion</td>
                    <td className="text-center py-4 px-4">❌</td>
                    <td className="text-center py-4 px-4">✅</td>
                    <td className="text-center py-4 px-4">✅</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-medium">Advanced Structural Analysis</td>
                    <td className="text-center py-4 px-4">❌</td>
                    <td className="text-center py-4 px-4">✅</td>
                    <td className="text-center py-4 px-4">✅</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-medium">Material Quantity Calculation</td>
                    <td className="text-center py-4 px-4">Limited</td>
                    <td className="text-center py-4 px-4">Full</td>
                    <td className="text-center py-4 px-4">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-medium">Indian Standard Codes</td>
                    <td className="text-center py-4 px-4">❌</td>
                    <td className="text-center py-4 px-4">✅</td>
                    <td className="text-center py-4 px-4">✅</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-medium">Export Formats</td>
                    <td className="text-center py-4 px-4">PDF, PNG</td>
                    <td className="text-center py-4 px-4">PDF, PNG, DXF, 3D</td>
                    <td className="text-center py-4 px-4">All + Revit</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 mb-2">What does G+3 mean?</h3>
              <p className="text-gray-600 text-sm">
                G+3 means Ground floor + 3 additional floors (4 floors total). This is the maximum building height for FREE users.
              </p>
            </div>
            
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 mb-2">What are editing credits?</h3>
              <p className="text-gray-600 text-sm">
                Credits are used when you make modifications to generated floor plans. FREE users get 50 credits, PRO users have unlimited.
              </p>
            </div>
            
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 mb-2">What Indian standards are supported?</h3>
              <p className="text-gray-600 text-sm">
                We support IS codes (IS 456:2000, IS 875:1987, IS 1893:2016) and NBC 2016 for structural design and building compliance.
              </p>
            </div>
            
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 mb-2">Can I export to AutoCAD?</h3>
              <p className="text-gray-600 text-sm">
                Yes! PRO and PRO+ users can export to DXF format compatible with AutoCAD, plus other professional formats.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
