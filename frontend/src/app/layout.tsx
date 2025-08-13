import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import React from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Planix",
  description: "AI Floor Plan Generator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="beforeInteractive" />
      </head>
      <body className={inter.className}>
        {children}
        <footer className="border-t mt-12 py-8 text-sm text-gray-600">
          <div className="max-w-7xl mx-auto px-6 flex flex-wrap gap-4 justify-between">
            <div>© {new Date().getFullYear()} Planix</div>
            <div className="flex gap-4">
              <a href="/privacy">Privacy</a>
              <a href="/terms">Terms</a>
              <a href="/cancellation-and-refunds">Cancellation & Refunds</a>
              <a href="/shipping">Shipping</a>
              <a href="/contact">Contact</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
