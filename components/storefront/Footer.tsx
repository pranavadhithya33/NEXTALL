"use client";

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-[#0A0E1A] text-gray-400 py-12 border-t border-white/5 pb-24 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-2">
          <Link href="/" className="text-2xl font-display font-bold text-white mb-4 block">
            NEXT<span className="text-cyan-400">ALL</span>
          </Link>
          <p className="max-w-md text-sm mb-6">
            Next-Level Gadgets. Unbeatable Prices. We bring you premium electronics at prices that disrupt the market. Guaranteed genuine products with complete warranty.
          </p>
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} NEXTALL. All rights reserved.
          </p>
        </div>
        
        <div>
          <h4 className="text-white font-semibold mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="hover:text-cyan-400 transition-colors">Home</Link></li>
            <li><Link href="/track" className="hover:text-cyan-400 transition-colors">Track Order</Link></li>
            <li><Link href="/contact" className="hover:text-cyan-400 transition-colors">Contact Support</Link></li>
            <li><Link href="/terms" className="hover:text-cyan-400 transition-colors">Terms & Conditions</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">Categories</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/category/smartphones" className="hover:text-cyan-400 transition-colors">Smartphones</Link></li>
            <li><Link href="/category/tablets" className="hover:text-cyan-400 transition-colors">Tablets</Link></li>
            <li><Link href="/category/laptops" className="hover:text-cyan-400 transition-colors">Laptops</Link></li>
            <li><Link href="/category/audio" className="hover:text-cyan-400 transition-colors">Audio & Wearables</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
