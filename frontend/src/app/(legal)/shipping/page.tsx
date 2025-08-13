'use client';
import Link from 'next/link';

export default function ShippingPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-4">Shipping Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

      <p>Planix is a digital software service. We do not ship physical goods. All deliverables (plans, PDFs, images, DXF, JSON) are delivered electronically within the app.</p>

      <div className="mt-8">
        <Link href="/" className="text-blue-600">← Back to Home</Link>
      </div>
    </div>
  );
}


