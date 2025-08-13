'use client';
import Link from 'next/link';

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
      <p className="text-sm text-gray-500 mb-8">We'd love to hear from you.</p>

      <div className="space-y-3">
        <p>Email: <a href="mailto:Planixapp@gmail.com" className="text-blue-600">Planixapp@gmail.com</a></p>
        <p>Support hours: Mon–Fri, 9am–6pm IST</p>
      </div>

      <div className="mt-8">
        <Link href="/" className="text-blue-600">← Back to Home</Link>
      </div>
    </div>
  );
}


