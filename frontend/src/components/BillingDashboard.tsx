'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../utils/api';

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  description: string;
  downloadUrl?: string;
}

interface BillingInfo {
  currentPlan: string;
  nextBillingDate?: string;
  subscriptionStatus: string;
  totalSpent: number;
  invoices: Invoice[];
}

export default function BillingDashboard() {
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // For now, we'll use mock data since billing integration needs Razorpay webhook setup
      // In production, this would fetch from /api/billing endpoint
      
      // Mock billing data
      const mockBillingInfo: BillingInfo = {
        currentPlan: 'FREE',
        subscriptionStatus: 'active',
        totalSpent: 0,
        invoices: []
      };

      // Get user data from localStorage to determine plan
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        mockBillingInfo.currentPlan = user.plan || 'FREE';
        
        if (user.plan === 'PRO') {
          mockBillingInfo.nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          mockBillingInfo.totalSpent = 999;
          mockBillingInfo.invoices = [
            {
              id: 'INV-001',
              date: new Date().toISOString(),
              amount: 999,
              status: 'paid',
              description: 'Planix Pro Monthly Subscription',
              downloadUrl: '#'
            }
          ];
        }
      }

      setBillingInfo(mockBillingInfo);
    } catch (error) {
      console.error('Billing data error:', error);
      setError('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
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
      {/* Current Plan */}
      {billingInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Current Plan</h2>
              <p className="text-blue-100 mt-1">Your subscription details</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{billingInfo.currentPlan}</p>
              <p className="text-blue-100 text-sm">
                {billingInfo.currentPlan === 'FREE' ? 'Free Plan' : 'Pro Plan'}
              </p>
            </div>
          </div>

          {billingInfo.nextBillingDate && (
            <div className="mt-4 pt-4 border-t border-blue-400">
              <p className="text-blue-100 text-sm">Next billing date</p>
              <p className="font-medium">{formatDate(billingInfo.nextBillingDate)}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Billing Overview */}
      {billingInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-sm font-medium text-gray-600">Total Spent</h3>
            <p className="text-2xl font-bold text-gray-800 mt-1">
              {formatCurrency(billingInfo.totalSpent)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-sm font-medium text-gray-600">Subscription Status</h3>
            <p className="text-2xl font-bold text-green-600 mt-1 capitalize">
              {billingInfo.subscriptionStatus}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-sm font-medium text-gray-600">Total Invoices</h3>
            <p className="text-2xl font-bold text-gray-800 mt-1">
              {billingInfo.invoices.length}
            </p>
          </div>
        </motion.div>
      )}

      {/* Invoices */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg shadow-sm border"
      >
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Invoices</h2>
          <p className="text-gray-600 mt-1">Download and manage your billing history</p>
        </div>

        <div className="divide-y">
          {billingInfo?.invoices.length > 0 ? (
            billingInfo.invoices.map((invoice) => (
              <motion.div
                key={invoice.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium">📄</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{invoice.description}</p>
                      <p className="text-sm text-gray-600">{formatDate(invoice.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                      {invoice.status.toUpperCase()}
                    </span>
                    <p className="font-semibold text-gray-800">{formatCurrency(invoice.amount)}</p>
                    {invoice.downloadUrl && (
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Download
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              <p>No invoices available.</p>
              <p className="text-sm mt-1">Your billing history will appear here once you make a purchase.</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Upgrade Section */}
      {billingInfo?.currentPlan === 'FREE' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-green-500 to-teal-600 rounded-lg p-6 text-white"
        >
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">Upgrade to Pro</h3>
            <p className="text-green-100 mb-4">
              Get unlimited generations, advanced analysis, and priority support
            </p>
            <button 
              onClick={() => window.location.href = '/subscribe'}
              className="bg-white text-green-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Upgrade Now - ₹999/month
            </button>
          </div>
        </motion.div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
