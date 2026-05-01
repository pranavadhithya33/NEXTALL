"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ShoppingCart, User } from 'lucide-react';
import { useCartStore } from '@/store/cart';

export function MobileNav() {
  const pathname = usePathname();
  const items = useCartStore(state => state.items);
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  // Don't show on admin routes
  if (pathname.startsWith('/admin')) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0A0E1A]/95 backdrop-blur-lg border-t border-white/10 pb-safe">
      <div className="flex justify-around items-center h-16 px-4">
        <Link href="/" className={`flex flex-col items-center justify-center w-16 h-full ${pathname === '/' ? 'text-cyan-400' : 'text-gray-400'}`}>
          <Home size={22} className={pathname === '/' ? 'drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : ''} />
          <span className="text-[10px] mt-1 font-medium">Home</span>
        </Link>
        
        <Link href="/search" className={`flex flex-col items-center justify-center w-16 h-full ${pathname === '/search' ? 'text-cyan-400' : 'text-gray-400'}`}>
          <Search size={22} />
          <span className="text-[10px] mt-1 font-medium">Search</span>
        </Link>
        
        <Link href="/cart" className={`relative flex flex-col items-center justify-center w-16 h-full ${pathname === '/cart' ? 'text-cyan-400' : 'text-gray-400'}`}>
          <div className="relative">
            <ShoppingCart size={22} className={pathname === '/cart' ? 'drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : ''} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 w-4 h-4 bg-cyan-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 font-medium">Cart</span>
        </Link>
        
        <Link href="/login" className={`flex flex-col items-center justify-center w-16 h-full ${pathname === '/login' || pathname === '/profile' ? 'text-cyan-400' : 'text-gray-400'}`}>
          <User size={22} />
          <span className="text-[10px] mt-1 font-medium">Account</span>
        </Link>
      </div>
    </div>
  );
}
