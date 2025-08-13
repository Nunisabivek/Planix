'use client';
import Link from 'next/link';

export default function CancellationRefundsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-4">Cancellation & Refunds</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

      <h2 className="text-xl font-semibold mb-2">Subscriptions</h2>
      <p className="mb-4">Subscriptions renew automatically unless cancelled. You can cancel anytime from your account settings; access remains until the end of the billing period.</p>

      <h2 className="text-xl font-semibold mb-2">Refunds</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>We offer refunds for duplicate charges or billing errors.</li>
        <li>For other cases, refunds are reviewed at our discretion within 7 days of purchase.</li>
        <li>Credits consumed during usage are non-refundable.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-2">How to request</h2>
      <p>Email <a href="mailto:Planixapp@gmail.com" className="text-blue-600">Planixapp@gmail.com</a> with your order ID and details.</p>

      <div className="mt-8">
        <Link href="/" className="text-blue-600">← Back to Home</Link>
      </div>
    </div>
  );
}


