'use client';
import React from 'react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function SubscribePage() {
  const handleSubscribe = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login first');
      return;
    }

    // 1. Create an order on the backend
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const orderRes = await fetch(`${api}/api/payment/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount: 999,
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        notes: {},
      }),
    });
    const order = await orderRes.json();

    // 2. Open the Razorpay checkout
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'YOUR_KEY_ID',
      amount: order.amount,
      currency: order.currency,
      name: 'Planix Pro',
      description: 'Monthly Subscription',
      order_id: order.id,
      handler: async function (response: any) {
        // 3. Verify the payment on the backend
        const verifyRes = await fetch(`${api}/api/payment/verify`, {
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
        console.log(verificationData);
        alert(verificationData.message);
        // Redirect to a success page or update UI
      },
      prefill: {
        name: 'Test User', // Prefill user details if available
        email: 'test.user@example.com',
      },
      notes: {
        address: 'Test Address',
      },
      theme: {
        color: '#3399cc',
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="bg-white p-8 rounded shadow-md text-center">
        <h1 className="text-3xl font-bold mb-4">Upgrade to Pro</h1>
        <p className="mb-6">Get unlimited floor plans, advanced analysis, and more! Referral discount auto-applied.</p>
        <button
          onClick={handleSubscribe}
          className="bg-blue-500 text-white font-bold py-2 px-4 rounded"
        >
          Subscribe for ₹999/month
        </button>
      </div>
    </div>
  );
}
