'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import * as fabric from 'fabric';
import { useRouter } from 'next/navigation';

// export const dynamic = 'force-dynamic';

export default function EditorPage() {
  const [prompt, setPrompt] = useState('A two bedroom house with a large kitchen and living room');
  const [floorPlan, setFloorPlan] = useState<any>(null);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [buyingCredits, setBuyingCredits] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvas = useRef<fabric.Canvas | null>(null);
  const router = useRouter();

  // Initialize canvas
  useEffect(() => {
    if (canvasRef.current) {
      fabricCanvas.current = new fabric.Canvas(canvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: '#f8fafc',
      });
    }

    return () => {
      fabricCanvas.current?.dispose();
    };
  }, []);

  // Load user data
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

    // Fetch fresh user data
    const api = process.env.NEXT_PUBLIC_API_URL || 'https://planix-backend.onrender.com';
    fetch(`${api}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((u) => {
        const updatedUser = {
          id: u.id,
          credits: u.credits,
          plan: u.plan,
          referralCode: u.referralCode
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      })
      .catch(() => {});
  }, [router]);

  const handleGenerate = async () => {
    if (!user) return;
    
    if (user.plan !== 'PRO' && user.credits <= 0) {
      alert('You have no credits remaining. Please buy more credits or upgrade to Pro.');
      return;
    }

    setIsGenerating(true);
    
    try {
      const token = localStorage.getItem('token');
      const api = process.env.NEXT_PUBLIC_API_URL || 'https://planix-backend.onrender.com';
      
      const res = await fetch(`${api}/api/generate-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt }),
      });

      const resp = await res.json();
      
      if (!res.ok) {
        throw new Error(resp.error || 'Failed to generate plan');
      }

      setFloorPlan(resp.floorPlan);
      setAnalysisResults(null);
      
      // Update credits if not PRO
      if (user.plan !== 'PRO') {
        const updatedUser = { ...user, credits: user.credits - 1 };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      // Render floor plan on canvas
      renderFloorPlan(resp.floorPlan);
      
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate floor plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderFloorPlan = (plan: any) => {
    if (!fabricCanvas.current) return;

    // Clear canvas
    fabricCanvas.current.clear();

    // Render rooms
    if (plan.rooms) {
      plan.rooms.forEach((room: any) => {
        const rect = new fabric.Rect({
          left: room.dimensions.x * 50,
          top: room.dimensions.y * 50,
          width: room.dimensions.width * 50,
          height: room.dimensions.height * 50,
          fill: 'rgba(59, 130, 246, 0.1)',
          stroke: '#3b82f6',
          strokeWidth: 2,
          rx: 4,
          ry: 4,
        });
        
        const label = new fabric.Textbox(room.label, {
          left: room.dimensions.x * 50 + 10,
          top: room.dimensions.y * 50 + 10,
          fontSize: 14,
          fontFamily: 'Inter',
          fill: '#1e293b',
          fontWeight: 'bold',
        });
        
        fabricCanvas.current?.add(rect, label);
      });
    }

    // Render walls
    if (plan.walls) {
      plan.walls.forEach((wall: any) => {
        const line = new fabric.Line(
          [wall.from.x * 50, wall.from.y * 50, wall.to.x * 50, wall.to.y * 50],
          {
            stroke: '#374151',
            strokeWidth: 6,
          }
        );
        fabricCanvas.current?.add(line);
      });
    }

    // Render utilities
    if (plan.utilities) {
      plan.utilities.forEach((utility: any) => {
        const rect = new fabric.Rect({
          left: utility.area.x * 50,
          top: utility.area.y * 50,
          width: utility.area.width * 50,
          height: utility.area.height * 50,
          fill: utility.type === 'plumbing' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(245, 158, 11, 0.3)',
          stroke: utility.type === 'plumbing' ? '#3b82f6' : '#f59e0b',
          strokeDashArray: [5, 5],
          strokeWidth: 2,
        });
        
        const label = new fabric.Textbox(utility.note, {
          left: utility.area.x * 50 + 5,
          top: utility.area.y * 50 + 5,
          fontSize: 11,
          fontFamily: 'Inter',
          fill: '#374151',
        });
        
        fabricCanvas.current?.add(rect, label);
      });
    }

    fabricCanvas.current.renderAll();
  };

  const handleAnalyze = async () => {
    if (!floorPlan || user?.plan !== 'PRO') return;
    
    setIsAnalyzing(true);
    
    try {
      const token = localStorage.getItem('token');
      const api = process.env.NEXT_PUBLIC_API_URL || 'https://planix-backend.onrender.com';
      
      const res = await fetch(`${api}/api/analyze-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ floorPlan }),
      });

      const results = await res.json();
      setAnalysisResults(results);
      setShowAnalysisPanel(true);
      
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Failed to analyze floor plan. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBuyCredits = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setBuyingCredits(true);
    
    try {
      const api = process.env.NEXT_PUBLIC_API_URL || 'https://planix-backend.onrender.com';
      const orderRes = await fetch(`${api}/api/payment/create-order-credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const order = await orderRes.json();
      
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'YOUR_KEY_ID',
        amount: order.amount,
        currency: order.currency,
        name: 'Planix Credits',
        description: '10 additional credits',
        order_id: order.id,
        handler: async function (response: any) {
          const verifyRes = await fetch(`${api}/api/payment/verify-credits`, {
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
            const updatedUser = { ...user, credits: verificationData.credits };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            alert('✅ Credits added successfully!');
          } else {
            alert('❌ Credit verification failed. Please contact support.');
          }
        },
        theme: {
          color: '#3b82f6',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
      
    } catch (error) {
      console.error('Credit purchase error:', error);
      alert('Failed to start credit purchase. Please try again.');
    } finally {
      setBuyingCredits(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.header 
        className="bg-white border-b border-gray-200 sticky top-0 z-40"
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
                Planix
              </Link>
              <div className="hidden md:flex items-center gap-4 text-sm">
                <span className="px-3 py-1 bg-gray-100 rounded-full">
                  Plan: <strong className={user.plan === 'PRO' ? 'text-purple-600' : 'text-gray-600'}>{user.plan}</strong>
                </span>
                {user.plan !== 'PRO' && (
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
                    Credits: <strong>{user.credits}</strong>
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {user.plan !== 'PRO' && (
                <Link href="/subscribe" className="btn-outline text-sm">
                  Upgrade to Pro
                </Link>
              )}
              <Link href="/" className="btn-secondary text-sm">
                Home
              </Link>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Title Section */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <h1 className="text-4xl font-bold mb-2">Floor Plan Editor</h1>
          <p className="text-muted-foreground text-lg">
            Generate and customize professional floor plans with AI
          </p>
          
          {/* Referral Link */}
          {user.referralCode && (
            <motion.div
              className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-sm text-green-800 mb-2">
                <strong>🎉 Share your referral link and earn 50% discounts!</strong>
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={typeof window !== 'undefined' ? `${window.location.origin}/signup?ref=${user.referralCode}` : ''}
                  readOnly
                  className="flex-1 px-3 py-2 text-xs bg-white border border-green-300 rounded font-mono"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/signup?ref=${user.referralCode}`);
                    alert('Referral link copied!');
                  }}
                  className="px-3 py-2 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                >
                  Copy
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Control Panel */}
          <motion.div
            className="lg:col-span-1 space-y-6"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Generation Panel */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Generate Floor Plan</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Describe your floor plan
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="input w-full resize-none"
                    rows={4}
                    placeholder="e.g., A modern 3-bedroom house with open kitchen, large living room, and 2 bathrooms"
                  />
                </div>
                
                <motion.button
                  onClick={handleGenerate}
                  disabled={isGenerating || (user.plan !== 'PRO' && user.credits <= 0)}
                  className="btn-primary w-full"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isGenerating ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating...
                    </div>
                  ) : (
                    <>Generate Plan {user.plan !== 'PRO' && `(${user.credits} credits)`}</>
                  )}
                </motion.button>

                {user.plan !== 'PRO' && user.credits <= 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                    <p className="text-sm text-yellow-800 mb-2">No credits remaining</p>
                    <button
                      onClick={handleBuyCredits}
                      disabled={buyingCredits}
                      className="btn-outline text-xs w-full"
                    >
                      {buyingCredits ? 'Processing...' : 'Buy 10 Credits (₹199)'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Analysis Panel */}
            {user.plan === 'PRO' && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold mb-4">Smart Analysis</h3>
                <motion.button
                  onClick={handleAnalyze}
                  disabled={!floorPlan || isAnalyzing}
                  className="btn-secondary w-full"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isAnalyzing ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                      Analyzing...
                    </div>
                  ) : (
                    'Analyze Plan'
                  )}
                </motion.button>
                {!floorPlan && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Generate a plan first
                  </p>
                )}
              </div>
            )}

            {/* Upgrade Prompt for Free Users */}
            {user.plan !== 'PRO' && (
              <motion.div
                className="card p-6 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <h3 className="text-lg font-semibold mb-2 text-blue-900">Upgrade to Pro</h3>
                <p className="text-sm text-blue-700 mb-4">
                  Get unlimited generations, advanced analysis, and professional tools.
                </p>
                <Link href="/subscribe" className="btn-primary w-full text-sm">
                  Upgrade Now →
                </Link>
              </motion.div>
            )}
          </motion.div>

          {/* Canvas Area */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Design Canvas</h3>
                {floorPlan && (
                  <div className="flex gap-2">
                    <button className="btn-outline text-xs px-3 py-1">
                      Export PDF
                    </button>
                    <button className="btn-outline text-xs px-3 py-1">
                      Save Project
                    </button>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center" style={{ minHeight: '600px' }}>
                {floorPlan ? (
                  <canvas ref={canvasRef} className="border border-gray-300 rounded bg-white shadow-sm" />
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">📐</span>
                    </div>
                    <p className="text-muted-foreground mb-2">No floor plan generated yet</p>
                    <p className="text-sm text-muted-foreground">
                      Enter a description and click "Generate Plan" to get started
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Analysis Results Panel */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {showAnalysisPanel && analysisResults ? (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Analysis Results</h3>
                  <button
                    onClick={() => setShowAnalysisPanel(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Material Estimation</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Concrete:</span>
                        <span className="font-medium">{analysisResults.materialEstimation?.concrete}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bricks:</span>
                        <span className="font-medium">{analysisResults.materialEstimation?.bricks}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Excavation</h4>
                    <p className="text-sm">{analysisResults.excavationQuantity}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Structural Analysis</h4>
                    <p className="text-sm">{analysisResults.structuralAnalysis}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Utilities</h4>
                    <p className="text-sm">{analysisResults.utilitiesAnalysis}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card p-6 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl">📊</span>
                </div>
                <h3 className="font-medium mb-2">Analysis Results</h3>
                <p className="text-sm text-muted-foreground">
                  {user.plan === 'PRO' 
                    ? 'Generate and analyze a floor plan to see detailed insights here.'
                    : 'Upgrade to Pro to access advanced analysis features.'
                  }
                </p>
                {user.plan !== 'PRO' && (
                  <Link href="/subscribe" className="btn-outline text-xs mt-3">
                    Upgrade to Pro
                  </Link>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}