'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../utils/api';

interface UsageData {
  id: string;
  action: string;
  timestamp: string;
  creditsUsed: number;
  details?: string;
}

interface UsageStats {
  totalGenerations: number;
  totalAnalyses: number;
  totalCreditsUsed: number;
  remainingCredits: number;
  currentPlan: string;
}

export default function UsageDashboard() {
  const [usageHistory, setUsageHistory] = useState<UsageData[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsageData();
  }, []);

  const fetchUsageData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/usage-history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsageHistory(data.history || []);
        setUsageStats(data.stats || null);
      } else {
        setError('Failed to load usage data');
      }
    } catch (error) {
      console.error('Usage data error:', error);
      setError('Network error loading usage data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'generation':
        return '🏗️';
      case 'analysis':
        return '📊';
      case 'subscription':
        return '💳';
      default:
        return '📝';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Usage Statistics */}
      {usageStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white">
            <h3 className="text-sm font-medium opacity-90">Total Generations</h3>
            <p className="text-2xl font-bold">{usageStats.totalGenerations}</p>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-lg p-4 text-white">
            <h3 className="text-sm font-medium opacity-90">Total Analyses</h3>
            <p className="text-2xl font-bold">{usageStats.totalAnalyses}</p>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-lg p-4 text-white">
            <h3 className="text-sm font-medium opacity-90">Credits Used</h3>
            <p className="text-2xl font-bold">{usageStats.totalCreditsUsed}</p>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg p-4 text-white">
            <h3 className="text-sm font-medium opacity-90">Remaining Credits</h3>
            <p className="text-2xl font-bold">{usageStats.remainingCredits}</p>
          </div>
        </motion.div>
      )}

      {/* Usage History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg shadow-sm border"
      >
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Usage History</h2>
          <p className="text-gray-600 mt-1">Track your recent activity and credit usage</p>
        </div>

        <div className="divide-y">
          {usageHistory.length > 0 ? (
            usageHistory.map((usage) => (
              <motion.div
                key={usage.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getActionIcon(usage.action)}</span>
                    <div>
                      <p className="font-medium text-gray-800 capitalize">{usage.action}</p>
                      <p className="text-sm text-gray-600">{formatDate(usage.timestamp)}</p>
                      {usage.details && (
                        <p className="text-xs text-gray-500 mt-1">{usage.details}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-800">
                      {usage.creditsUsed > 0 ? `-${usage.creditsUsed}` : '+0'} credits
                    </p>
                    <p className="text-xs text-gray-500">
                      {usage.creditsUsed > 0 ? 'Used' : 'Free'}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              <p>No usage history available yet.</p>
              <p className="text-sm mt-1">Start creating floor plans to see your activity here!</p>
            </div>
          )}
        </div>
      </motion.div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
