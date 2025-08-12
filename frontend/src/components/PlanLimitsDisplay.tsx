'use client';
import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface PlanInfo {
  currentPlan: string;
  generationsUsed: number;
  generationsLimit: number | string;
  creditsRemaining: number | string;
  projectsCreated: number;
  projectsLimit: number | string;
  canUpgrade: boolean;
}

interface Features {
  has3DConversion: boolean;
  hasAdvancedAnalysis: boolean;
  hasComplianceCodes: boolean;
  exportFormats: string[];
  structuralAnalysisLevel: string;
  materialCalculationLevel: string;
}

interface PlanLimitsDisplayProps {
  planInfo: PlanInfo;
  features: Features;
}

export default function PlanLimitsDisplay({ planInfo, features }: PlanLimitsDisplayProps) {
  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'FREE': return 'text-gray-600 bg-gray-100';
      case 'PRO': return 'text-blue-600 bg-blue-100';
      case 'PRO_PLUS': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getProgressColor = (used: number, limit: number | string) => {
    if (limit === 'unlimited') return 'bg-green-500';
    const percentage = (used / (limit as number)) * 100;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatLimit = (limit: number | string) => {
    return limit === 'unlimited' ? '∞' : limit.toString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border p-6"
    >
      {/* Plan Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPlanColor(planInfo.currentPlan)}`}>
            {planInfo.currentPlan === 'PRO_PLUS' ? 'PRO+' : planInfo.currentPlan}
          </span>
          <h3 className="text-lg font-semibold text-gray-800">Plan Usage</h3>
        </div>
        {planInfo.canUpgrade && (
          <Link
            href="/pricing"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Upgrade Plan →
          </Link>
        )}
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Generations */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Generations</span>
            <span className="text-sm font-medium">
              {planInfo.generationsUsed} / {formatLimit(planInfo.generationsLimit)}
            </span>
          </div>
          {planInfo.generationsLimit !== 'unlimited' && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getProgressColor(
                  planInfo.generationsUsed,
                  planInfo.generationsLimit
                )}`}
                style={{
                  width: `${Math.min(
                    (planInfo.generationsUsed / (planInfo.generationsLimit as number)) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          )}
        </div>

        {/* Projects */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Projects</span>
            <span className="text-sm font-medium">
              {planInfo.projectsCreated} / {formatLimit(planInfo.projectsLimit)}
            </span>
          </div>
          {planInfo.projectsLimit !== 'unlimited' && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getProgressColor(
                  planInfo.projectsCreated,
                  planInfo.projectsLimit
                )}`}
                style={{
                  width: `${Math.min(
                    (planInfo.projectsCreated / (planInfo.projectsLimit as number)) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          )}
        </div>

        {/* Credits */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Credits</span>
            <span className="text-sm font-medium">
              {planInfo.creditsRemaining === 'unlimited' ? '∞' : planInfo.creditsRemaining}
            </span>
          </div>
          {planInfo.creditsRemaining !== 'unlimited' && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  (planInfo.creditsRemaining as number) > 10 ? 'bg-green-500' : 
                  (planInfo.creditsRemaining as number) > 5 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{
                  width: `${Math.min(((planInfo.creditsRemaining as number) / 50) * 100, 100)}%`,
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="border-t pt-6">
        <h4 className="font-medium text-gray-800 mb-4">Available Features</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${features.has3DConversion ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className={`text-sm ${features.has3DConversion ? 'text-gray-800' : 'text-gray-500'}`}>
                3D Conversion
              </span>
              {!features.has3DConversion && (
                <span className="text-xs text-blue-600 font-medium">PRO</span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${features.hasAdvancedAnalysis ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className={`text-sm ${features.hasAdvancedAnalysis ? 'text-gray-800' : 'text-gray-500'}`}>
                Advanced Analysis
              </span>
              {!features.hasAdvancedAnalysis && (
                <span className="text-xs text-blue-600 font-medium">PRO</span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${features.hasComplianceCodes ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className={`text-sm ${features.hasComplianceCodes ? 'text-gray-800' : 'text-gray-500'}`}>
                IS Codes Compliance
              </span>
              {!features.hasComplianceCodes && (
                <span className="text-xs text-blue-600 font-medium">PRO</span>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-600">Structural Analysis:</span>
              <span className="text-sm font-medium ml-2 capitalize">
                {features.structuralAnalysisLevel}
              </span>
            </div>
            
            <div>
              <span className="text-sm text-gray-600">Material Calculation:</span>
              <span className="text-sm font-medium ml-2 capitalize">
                {features.materialCalculationLevel}
              </span>
            </div>
            
            <div>
              <span className="text-sm text-gray-600">Export Formats:</span>
              <span className="text-sm font-medium ml-2">
                {features.exportFormats.length} formats
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade CTA */}
      {planInfo.canUpgrade && (
        <div className="border-t pt-6 mt-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium text-gray-800">Unlock More Features</h5>
                <p className="text-sm text-gray-600">
                  {planInfo.currentPlan === 'FREE' 
                    ? 'Upgrade to PRO for unlimited projects, 3D conversion, and advanced analysis'
                    : 'Upgrade to PRO+ for unlimited everything and enterprise features'
                  }
                </p>
              </div>
              <Link
                href="/pricing"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Upgrade Now
              </Link>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
