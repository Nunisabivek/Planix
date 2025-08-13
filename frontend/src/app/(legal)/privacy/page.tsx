'use client';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

      <p className="mb-4">Planix ("we", "our", "us") respects your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use our website and services.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Information We Collect</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Account data: name, email, password (hashed)</li>
        <li>Billing data: payment IDs and statuses via our payment partner</li>
        <li>Usage data: project counts, plan generations, exports</li>
        <li>Technical data: device/browser info and IP address for security</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-2">How We Use Information</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Provide and improve the Planix app</li>
        <li>Process payments and manage subscriptions</li>
        <li>Detect abuse, secure accounts, and comply with law</li>
        <li>Communicate important updates and support messages</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-2">Data Sharing</h2>
      <p>We do not sell personal information. We share limited data with trusted vendors (e.g., hosting, payments, analytics) to operate our services under strict agreements.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Data Retention</h2>
      <p>We retain data while your account is active and as needed to meet legal, tax, or security obligations.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Your Rights</h2>
      <p>You can access, update, or delete your account information. Contact us at <a href="mailto:Planixapp@gmail.com" className="text-blue-600">Planixapp@gmail.com</a>.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Contact</h2>
      <p>For privacy questions, email <a href="mailto:Planixapp@gmail.com" className="text-blue-600">Planixapp@gmail.com</a>.</p>

      <div className="mt-8">
        <Link href="/" className="text-blue-600">← Back to Home</Link>
      </div>
    </div>
  );
}


