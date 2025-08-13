'use client';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-4">Terms & Conditions</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

      <p className="mb-4">These Terms govern your use of Planix. By using our site, you agree to these Terms.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Use of Service</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>You must have legal capacity to enter a contract.</li>
        <li>Do not misuse our services (e.g., abuse, reverse engineering, or unlawful use).</li>
        <li>Accounts may be suspended for violations.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-2">Subscriptions & Credits</h2>
      <p>Free plan includes limited projects and credits. Paid plans provide higher limits. Credits are consumed when generating plans based on complexity.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Intellectual Property</h2>
      <p>All software and content are owned by Planix or licensors. You retain rights to your designs.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Limitation of Liability</h2>
      <p>Planix is provided “as is”. We are not liable for indirect or consequential damages to the fullest extent permitted by law.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Contact</h2>
      <p>Support: <a href="mailto:Planixapp@gmail.com" className="text-blue-600">Planixapp@gmail.com</a></p>

      <div className="mt-8">
        <Link href="/" className="text-blue-600">← Back to Home</Link>
      </div>
    </div>
  );
}


