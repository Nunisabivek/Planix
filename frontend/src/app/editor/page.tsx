'use client';
import React from 'react';

import { useState, useEffect, useRef } from 'react';
import * as fabric from 'fabric';

export default function EditorPage() {
  const [prompt, setPrompt] = useState('A two bedroom house with a large kitchen');
  const [floorPlan, setFloorPlan] = useState<any>(null);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const canvasRef = useRef(null);
  const fabricCanvas = useRef<fabric.Canvas | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    fabricCanvas.current = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#f0f0f0',
    });

    return () => {
      fabricCanvas.current?.dispose();
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('http://localhost:8080/api/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((u) => {
        setCredits(u.credits);
        setPlan(u.plan);
        setReferralCode(u.referralCode ?? null);
      })
      .catch(() => {});
  }, []);

  const handleGenerate = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login first');
      return;
    }
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
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
      alert(resp.error || 'Failed to generate');
      return;
    }
    const newFloorPlan = resp.floorPlan;
    setFloorPlan(newFloorPlan);
    setAnalysisResults(null); // Clear previous analysis

    // Clear canvas
    fabricCanvas.current?.clear();

    // Render floor plan
    if (newFloorPlan.rooms) {
      newFloorPlan.rooms.forEach((room: any) => {
        const rect = new fabric.Rect({
          left: room.dimensions.x * 50,
          top: room.dimensions.y * 50,
          width: room.dimensions.width * 50,
          height: room.dimensions.height * 50,
          fill: '#fff',
          stroke: '#000',
          strokeWidth: 2,
        });
        rect.setControlsVisibility({ mtr: false });
        rect.set({ lockRotation: true });
        const label = new fabric.Textbox(room.label, {
          left: room.dimensions.x * 50 + 10,
          top: room.dimensions.y * 50 + 10,
          fontSize: 16,
        });
        fabricCanvas.current?.add(rect, label);
      });
    }

    if (newFloorPlan.walls) {
        newFloorPlan.walls.forEach((wall: any) => {
            const line = new fabric.Line(
                [wall.from.x * 50, wall.from.y * 50, wall.to.x * 50, wall.to.y * 50],
                {
                    stroke: '#000',
                    strokeWidth: 4,
                }
            );
            fabricCanvas.current?.add(line);
        });
    }

    if (newFloorPlan.utilities) {
      newFloorPlan.utilities.forEach((u: any) => {
        const rect = new fabric.Rect({
          left: u.area.x * 50,
          top: u.area.y * 50,
          width: u.area.width * 50,
          height: u.area.height * 50,
          fill: u.type === 'plumbing' ? 'rgba(0,0,255,0.2)' : 'rgba(255,165,0,0.2)',
          stroke: u.type === 'plumbing' ? '#00f' : '#f90',
          strokeDashArray: [6, 6],
        });
        const label = new fabric.Textbox(u.note, {
          left: u.area.x * 50 + 4,
          top: u.area.y * 50 + 4,
          fontSize: 12,
          fill: '#333',
        });
        fabricCanvas.current?.add(rect, label);
      });
    }

    fabricCanvas.current?.renderAll();
  };

  const handleAnalyze = async () => {
    if (!floorPlan) return;
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login first');
      return;
    }
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
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
  };

  const handleBuyCredits = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login first');
      return;
    }
    setBuying(true);
    try {
      const orderRes = await fetch('http://localhost:8080/api/payment/create-order-credits', {
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
        description: '10 credits',
        order_id: order.id,
        handler: async function (response: any) {
          const verifyRes = await fetch('http://localhost:8080/api/payment/verify-credits', {
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
            setCredits(verificationData.credits);
            alert('Credits added');
          } else {
            alert(verificationData.error || 'Verification failed');
          }
        },
      } as any;
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } finally {
      setBuying(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-1">Floor Plan Generator</h1>
      <p className="mb-3 text-sm text-gray-600">Plan: {plan ?? '-'} {plan !== 'PRO' && credits !== null ? `(Credits: ${credits})` : ''}</p>
      {referralCode && (
        <div className="mb-4 text-sm">
          <span className="font-medium">Your referral link:</span>
          <span className="ml-2 select-all underline">
            {typeof window !== 'undefined' ? `${window.location.origin}/signup?ref=${referralCode}` : `/signup?ref=${referralCode}`}
          </span>
        </div>
      )}
      <div className="flex gap-4 mb-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
          rows={3}
        />
        <button
          onClick={handleGenerate}
          className="bg-blue-500 text-white p-2 rounded"
        >
          Generate
        </button>
        <button
          onClick={handleAnalyze}
          className="bg-green-500 text-white p-2 rounded"
          disabled={!floorPlan}
        >
          Analyze Plan
        </button>
        {plan !== 'PRO' && (
          <button
            onClick={handleBuyCredits}
            className="bg-purple-600 text-white p-2 rounded disabled:opacity-50"
            disabled={buying}
          >
            {buying ? 'Processing…' : 'Buy 10 Credits (₹199)'}
          </button>
        )}
      </div>
      <div className="flex gap-4">
        <canvas ref={canvasRef} />
        {analysisResults && (
          <div className="bg-white p-4 rounded shadow-md w-1/3">
            <h2 className="text-2xl mb-4">Analysis Results</h2>
            <div>
              <h3 className="font-bold">Material Estimation:</h3>
              <p>Concrete: {analysisResults.materialEstimation.concrete}</p>
              <p>Bricks: {analysisResults.materialEstimation.bricks}</p>
            </div>
            <div className="mt-4">
              <h3 className="font-bold">Excavation Quantity:</h3>
              <p>{analysisResults.excavationQuantity}</p>
            </div>
            <div className="mt-4">
              <h3 className="font-bold">Structural Analysis:</h3>
              <p>{analysisResults.structuralAnalysis}</p>
            </div>
            <div className="mt-4">
              <h3 className="font-bold">Utilities:</h3>
              <p>{analysisResults.utilitiesAnalysis}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
