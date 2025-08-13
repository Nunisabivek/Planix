'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import * as fabric from 'fabric';
import { useRouter } from 'next/navigation';
import AdvancedEditor from '../../components/AdvancedEditor';
import ExportModal from '../../components/ExportModal';
import UsageDashboard from '../../components/UsageDashboard';
import BillingDashboard from '../../components/BillingDashboard';
import SettingsDashboard from '../../components/SettingsDashboard';
import FloorPlanRenderer from '../../components/FloorPlanRenderer';
import { API_BASE_URL } from '../../utils/api';
import { logout } from '../../utils/auth';

// export const dynamic = 'force-dynamic';

export default function EditorPage() {
  const [userPrompt, setUserPrompt] = useState('A two bedroom house with a large kitchen and living room');
  const [floorPlan, setFloorPlan] = useState<any>(null);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [buyingCredits, setBuyingCredits] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(false);
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [requirements, setRequirements] = useState({
    area: '',
    bedrooms: '',
    bathrooms: '',
    floors: '1',
    style: '',
    budget: '',
    location: ''
  });
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  // Advanced editor preference (default off, persisted)
  const [useAdvancedEditor, setUseAdvancedEditor] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pref = localStorage.getItem('useAdvancedEditor');
      if (pref !== null) setUseAdvancedEditor(pref === 'true');
    }
  }, []);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('useAdvancedEditor', String(useAdvancedEditor));
    }
  }, [useAdvancedEditor]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [currentView, setCurrentView] = useState<'editor' | 'usage' | 'billing' | 'settings'>('editor');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [aiProvider, setAiProvider] = useState<string>('ai');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvas = useRef<fabric.Canvas | null>(null);
  const advancedCanvasRef = useRef<HTMLCanvasElement | null>(null);
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
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
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
      const api = API_BASE_URL;
      
      // Prepare requirements object
      const reqData = {
        prompt: userPrompt,
        projectId: currentProject?.id,
        requirements: {
          ...(requirements.area && { area: parseInt(requirements.area) }),
          ...(requirements.bedrooms && { bedrooms: parseInt(requirements.bedrooms) }),
          ...(requirements.bathrooms && { bathrooms: parseInt(requirements.bathrooms) }),
          ...(requirements.floors && { floors: parseInt(requirements.floors) }),
          ...(requirements.style && { style: requirements.style }),
          ...(requirements.budget && { budget: parseInt(requirements.budget) }),
          ...(requirements.location && { location: requirements.location }),
        }
      };
      
      const res = await fetch(`${api}/api/generate-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reqData),
      });

      const resp = await res.json();
      
      if (!res.ok) {
        throw new Error(resp.error || 'Failed to generate plan');
      }

      setFloorPlan(resp.floorPlan);
      setAnalysisResults(null);
      
      // Set AI provider for display
      if (resp.aiProvider) {
        setAiProvider(resp.aiProvider);
      }
      
      // Update user data with plan information
      if (resp.planInfo) {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          user.planInfo = resp.planInfo;
          user.features = resp.features;
          localStorage.setItem('user', JSON.stringify(user));
        }
      }
      
      // Update project if one was being edited
      if (resp.projectId) {
        setCurrentProject({ ...currentProject, id: resp.projectId });
      }
      
      // Update credits if not PRO
      if (user.plan !== 'PRO') {
        const updatedUser = { ...user, credits: resp.creditsRemaining };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      // Render floor plan on canvas (for basic editor)
      if (!useAdvancedEditor) {
        renderFloorPlan(resp.floorPlan);
      }
      
    } catch (error: any) {
      console.error('Generation error:', error);
      
      // Show specific error messages based on the response
      let errorMessage = 'Failed to generate floor plan. Please try again.';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message?.includes('Failed to fetch')) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Request timed out. The AI is taking longer than usual. Please try again.';
      }
      
      // If it's an upgrade required error, show upgrade option
      if (error.response?.data?.upgradeRequired) {
        const userConfirmed = confirm(`${errorMessage}\n\nWould you like to upgrade to PRO now?`);
        if (userConfirmed) {
          window.location.href = '/subscribe';
          return;
        }
      }
      
      alert(errorMessage);
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
      const api = API_BASE_URL;
      
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
      const api = API_BASE_URL;
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

  // Project Management Functions
  const createNewProject = () => {
    setNewProjectName('');
    setShowProjectModal(true);
  };

  const confirmCreateProject = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const name = newProjectName.trim();
    if (!name) return;
    try {
      const api = API_BASE_URL;
      const res = await fetch(`${api}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, description: '', floorPlanData: {} }),
      });
      if (res.ok) {
        const project = await res.json();
        setCurrentProject(project);
        setFloorPlan(null);
        setAnalysisResults(null);
        setShowProjectModal(false);
        loadProjects();
      } else {
        alert('Failed to create project');
      }
    } catch (e) {
      console.error('Create project error:', e);
      alert('Failed to create project');
    }
  };

  const saveProject = async (canvasData?: any) => {
    if (!currentProject) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const api = API_BASE_URL;
      const res = await fetch(`${api}/api/projects/${currentProject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          floorPlanData: canvasData || floorPlan,
          analysisData: analysisResults
        }),
      });

      if (res.ok) {
        alert('✅ Project saved successfully!');
        loadProjects();
      }
    } catch (error) {
      console.error('Save project error:', error);
      alert('Failed to save project');
    }
  };

  const loadProjects = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const api = API_BASE_URL;
      const res = await fetch(`${api}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const projectList = await res.json();
        setProjects(projectList);
      }
    } catch (error) {
      console.error('Load projects error:', error);
    }
  };

  const loadProject = async (projectId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const api = API_BASE_URL;
      const res = await fetch(`${api}/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const project = await res.json();
        setCurrentProject(project);
        setFloorPlan(project.floorPlanData || null);
        setAnalysisResults(project.analysisData || null);
        
        if (!useAdvancedEditor && project.floorPlanData && project.floorPlanData.rooms && project.floorPlanData.rooms.length > 0) {
          renderFloorPlan(project.floorPlanData);
        }
      }
    } catch (error) {
      console.error('Load project error:', error);
      alert('Failed to load project');
    }
  };

  const exportProject = async (format?: string, advCanvas?: HTMLCanvasElement | null) => {
    if (!floorPlan) {
      alert('No floor plan to export');
      return;
    }

    if (format) {
      // Quick export for specific format
      try {
        const { FloorPlanExporter } = await import('../../utils/exportUtils');
        
        const canvasElement = useAdvancedEditor ? advCanvas || null : canvasRef.current;
        
        await FloorPlanExporter.exportFloorPlan(
          format,
          canvasElement,
          floorPlan,
          analysisResults,
          {
            quality: 'high',
            includeAnalysis: user?.plan === 'PRO',
            includeSpecs: true,
            paperSize: 'a4'
          }
        );
        
        alert(`✅ Floor plan exported successfully as ${format.toUpperCase()}!`);
        
      } catch (error) {
        console.error('Export error:', error);
        alert(`❌ Failed to export as ${format.toUpperCase()}. Please try again.`);
      }
    } else {
      // Open export modal
      setShowExportModal(true);
    }
  };

  // Load projects on component mount
  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

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
              {/* Navigation Menu */}
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => setCurrentView('editor')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    currentView === 'editor' 
                      ? 'bg-blue-100 text-blue-700 font-medium' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  Editor
                </button>
                <button
                  onClick={() => setCurrentView('usage')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    currentView === 'usage' 
                      ? 'bg-blue-100 text-blue-700 font-medium' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  Usage
                </button>
                <button
                  onClick={() => setCurrentView('billing')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    currentView === 'billing' 
                      ? 'bg-blue-100 text-blue-700 font-medium' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  Billing
                </button>
                <button
                  onClick={() => setCurrentView('settings')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    currentView === 'settings' 
                      ? 'bg-blue-100 text-blue-700 font-medium' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  Settings
                </button>
              </div>

              {/* Mobile Menu Dropdown */}
              <div className="md:hidden relative">
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                
                {showMobileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                  >
                    <button
                      onClick={() => { setCurrentView('editor'); setShowMobileMenu(false); }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        currentView === 'editor' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      📊 Editor
                    </button>
                    <button
                      onClick={() => { setCurrentView('usage'); setShowMobileMenu(false); }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        currentView === 'usage' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      📈 Usage
                    </button>
                    <button
                      onClick={() => { setCurrentView('billing'); setShowMobileMenu(false); }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        currentView === 'billing' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      💳 Billing
                    </button>
                    <button
                      onClick={() => { setCurrentView('settings'); setShowMobileMenu(false); }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        currentView === 'settings' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      ⚙️ Settings
                    </button>
                    <hr className="my-2" />
                    <button
                      onClick={logout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      🚪 Logout
                    </button>
                  </motion.div>
                )}
              </div>

              {user.plan !== 'PRO' && (
                <Link href="/subscribe" className="btn-outline text-sm">
                  Upgrade to Pro
                </Link>
              )}
              <Link href="/" className="btn-secondary text-sm">
                Home
              </Link>
              <button
                onClick={logout}
                className="btn-outline text-sm text-red-600 border-red-200 hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Render different views based on currentView */}
        {currentView === 'usage' && <UsageDashboard />}
        {currentView === 'billing' && <BillingDashboard />}
        {currentView === 'settings' && <SettingsDashboard />}
        
        {currentView === 'editor' && (
          <>
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

        {/* Editor Mode Toggle */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={useAdvancedEditor}
                onChange={(e) => setUseAdvancedEditor(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium">Use Advanced Editor</span>
            </label>
            <div className="flex gap-2">
              <button
                onClick={createNewProject}
                className="btn-outline text-sm"
              >
                📁 New Project
              </button>
              {currentProject && (
                <button
                  onClick={() => saveProject()}
                  className="btn-primary text-sm"
                >
                  💾 Save Project
                </button>
              )}
            </div>
          </div>
        </div>

        {useAdvancedEditor ? (
          /* Advanced Editor */
          <motion.div
            className="bg-white rounded-lg shadow-lg overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ height: '80vh' }}
          >
            <AdvancedEditor
              floorPlan={floorPlan}
              onSave={saveProject}
              onExport={exportProject}
              className="h-full"
              onCanvasReady={(c) => { advancedCanvasRef.current = c; }}
            />
          </motion.div>
        ) : (
          /* Basic Editor */
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Control Panel */}
            <motion.div
              className="lg:col-span-1 space-y-6"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {/* Project Panel */}
              {projects.length > 0 && (
                <div className="card p-6">
                  <h3 className="text-lg font-semibold mb-4">My Projects</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className={`p-2 rounded-lg cursor-pointer transition-colors ${
                          currentProject?.id === project.id
                            ? 'bg-blue-100 border border-blue-300'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={() => loadProject(project.id)}
                      >
                        <p className="text-sm font-medium">{project.name}</p>
                        {project.updatedAt && (
                          <p className="text-xs text-gray-500">
                            {new Date(project.updatedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Generation Panel */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold mb-4">Generate Floor Plan</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Describe your floor plan
                    </label>
                    <textarea
                      value={userPrompt}
                      onChange={(e) => setUserPrompt(e.target.value)}
                      className="input w-full resize-none min-h-[140px]"
                      rows={6}
                      placeholder="e.g., A modern 3-bedroom house with open kitchen, large living room, and 2 bathrooms"
                    />
                  </div>

                  {/* Advanced Options */}
                  <div>
                    <button
                      onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {showAdvancedOptions ? '▼' : '▶'} Advanced Options
                    </button>
                    
                    {showAdvancedOptions && (
                      <motion.div
                        className="mt-3 space-y-3"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            placeholder="Area (sq.m)"
                            value={requirements.area}
                            onChange={(e) => setRequirements({...requirements, area: e.target.value})}
                            className="input text-xs"
                          />
                          <input
                            type="number"
                            placeholder="Bedrooms"
                            value={requirements.bedrooms}
                            onChange={(e) => setRequirements({...requirements, bedrooms: e.target.value})}
                            className="input text-xs"
                          />
                          <input
                            type="number"
                            placeholder="Bathrooms"
                            value={requirements.bathrooms}
                            onChange={(e) => setRequirements({...requirements, bathrooms: e.target.value})}
                            className="input text-xs"
                          />
                          <select
                            value={requirements.floors}
                            onChange={(e) => setRequirements({...requirements, floors: e.target.value})}
                            className="input text-xs"
                          >
                            <option value="1">1 Floor</option>
                            <option value="2">2 Floors</option>
                            <option value="3">3 Floors</option>
                          </select>
                        </div>
                        <input
                          type="text"
                          placeholder="Style (e.g., Modern, Traditional)"
                          value={requirements.style}
                          onChange={(e) => setRequirements({...requirements, style: e.target.value})}
                          className="input w-full text-xs"
                        />
                        <input
                          type="number"
                          placeholder="Budget (₹)"
                          value={requirements.budget}
                          onChange={(e) => setRequirements({...requirements, budget: e.target.value})}
                          className="input w-full text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Location"
                          value={requirements.location}
                          onChange={(e) => setRequirements({...requirements, location: e.target.value})}
                          className="input w-full text-xs"
                        />
                      </motion.div>
                    )}
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
                <h3 className="text-lg font-semibold">Professional Floor Plan</h3>
                {floorPlan && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowExportModal(true)}
                      className="btn-outline text-xs px-3 py-1"
                    >
                      Export PDF
                    </button>
                    <button 
                      onClick={saveProject}
                      className="btn-outline text-xs px-3 py-1"
                    >
                      Save Project
                    </button>
                  </div>
                )}
              </div>
              
              <div className="rounded-lg" style={{ minHeight: '600px' }}>
                {floorPlan ? (
                  <FloorPlanRenderer 
                    floorPlan={floorPlan}
                    width={800}
                    height={600}
                    showGrid={true}
                    showDimensions={true}
                    interactive={true}
                    aiProvider={aiProvider}
                  />
                ) : (
                  <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center" style={{ minHeight: '600px' }}>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">🏗️</span>
                      </div>
                      <p className="text-muted-foreground mb-2">Professional Floor Plan Generator</p>
                      <p className="text-sm text-muted-foreground">
                        Enter your requirements and click "Generate Plan" to create a professional floor plan
                      </p>
                      <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-gray-500">
                        <span>✨ AI-Powered</span>
                        <span>📐 CAD-Quality</span>
                        <span>📊 Engineering Analysis</span>
                      </div>
                    </div>
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
                    <button 
                      onClick={() => exportProject()}
                      className="btn-primary text-xs px-3 py-1"
                    >
                      📤 Export
                    </button>
                    <button 
                      onClick={() => exportProject('pdf')}
                      className="btn-outline text-xs px-3 py-1"
                    >
                      📄 PDF
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
                        <span className="font-medium">{analysisResults.materialEstimation?.concrete?.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bricks:</span>
                        <span className="font-medium">{analysisResults.materialEstimation?.bricks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Steel:</span>
                        <span className="font-medium">{analysisResults.materialEstimation?.steel}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Cost Estimation</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Civil Work:</span>
                        <span className="font-medium">{analysisResults.costEstimation?.civilWork}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <span className="font-medium text-blue-600">{analysisResults.costEstimation?.total}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Excavation</h4>
                    <p className="text-sm">{analysisResults.excavationQuantity?.volume}</p>
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
        )}
          </>
        )}
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        floorPlan={floorPlan}
        analysisData={analysisResults}
        canvasElement={useAdvancedEditor ? advancedCanvasRef.current : canvasRef.current}
        projectName={currentProject?.name || 'floor-plan'}
        isPro={user?.plan === 'PRO'}
      />

      {/* Create Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Create New Project</h3>
            <input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="input w-full mb-4"
              placeholder="Enter project name"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowProjectModal(false)} className="btn-outline text-sm">Cancel</button>
              <button onClick={confirmCreateProject} className="btn-primary text-sm">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}