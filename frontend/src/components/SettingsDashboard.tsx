'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../utils/api';

interface UserProfile {
  id: number;
  email: string;
  name?: string;
  plan: string;
  credits: number;
  referralCode?: string;
  createdAt: string;
}

export default function SettingsDashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form states
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (userData) {
        const user = JSON.parse(userData);
        // For now, use localStorage data
        // In production, fetch from API: /api/profile
        setProfile({
          id: user.id,
          email: user.email || 'user@example.com',
          name: user.name || '',
          plan: user.plan || 'FREE',
          credits: user.credits || 0,
          referralCode: user.referralCode || '',
          createdAt: new Date().toISOString()
        });
        setName(user.name || '');
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      // For now, just update localStorage
      // In production, send to API: PUT /api/profile
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        user.name = name;
        localStorage.setItem('user', JSON.stringify(user));
        
        if (profile) {
          setProfile({ ...profile, name });
        }
        
        setSuccess('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (response.ok) {
        setSuccess('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Password change error:', error);
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const copyReferralCode = () => {
    if (profile?.referralCode) {
      navigator.clipboard.writeText(profile.referralCode);
      setSuccess('Referral code copied to clipboard!');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // In production, send DELETE request to /api/profile
        // For now, just logout
        handleLogout();
      } catch (error) {
        console.error('Account deletion error:', error);
        setError('Failed to delete account');
      }
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
      {/* Profile Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border"
      >
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Profile Information</h2>
          <p className="text-gray-600 mt-1">Update your account details</p>
        </div>

        <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={profile?.email || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Plan
              </label>
              <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                <span className={`font-medium ${profile?.plan === 'PRO' ? 'text-purple-600' : 'text-gray-600'}`}>
                  {profile?.plan} Plan
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Credits
              </label>
              <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                <span className="font-medium text-blue-600">
                  {profile?.credits} credits
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Update Profile'}
          </button>
        </form>
      </motion.div>

      {/* Change Password */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border"
      >
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Change Password</h2>
          <p className="text-gray-600 mt-1">Update your account password</p>
        </div>

        <form onSubmit={handleChangePassword} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              minLength={6}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </motion.div>

      {/* Referral Code */}
      {profile?.referralCode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border"
        >
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-800">Referral Program</h2>
            <p className="text-gray-600 mt-1">Share your referral code and earn rewards</p>
          </div>

          <div className="p-6">
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={profile.referralCode}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
              <button
                onClick={copyReferralCode}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Copy Code
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Share this code with friends to give them 50% off their first subscription!
            </p>
          </div>
        </motion.div>
      )}

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-lg shadow-sm border border-red-200"
      >
        <div className="p-6 border-b border-red-200">
          <h2 className="text-xl font-semibold text-red-600">Danger Zone</h2>
          <p className="text-gray-600 mt-1">Irreversible and destructive actions</p>
        </div>

        <div className="p-6 space-y-4">
          <button
            onClick={handleLogout}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Logout
          </button>
          
          <button
            onClick={handleDeleteAccount}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors ml-3"
          >
            Delete Account
          </button>
        </div>
      </motion.div>

      {/* Success/Error Messages */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-lg p-4"
        >
          <p className="text-green-600">{success}</p>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <p className="text-red-600">{error}</p>
        </motion.div>
      )}
    </div>
  );
}
