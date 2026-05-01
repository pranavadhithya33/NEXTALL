"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ShoppingCart, User, LogOut } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { useUserStore } from '@/store/user';

export function MobileNav() {
  const pathname = usePathname();
  const items = useCartStore(state => state.items);
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

    const { isLoggedIn, user, clearUser } = useUserStore();
  
    // Don't show on admin routes
    if (pathname.startsWith('/admin')) return null;
  
    return (
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0A0E1A]/95 backdrop-blur-lg border-t border-white/10 pb-safe">
        <div className="flex justify-around items-center h-16 px-2">
          <Link href="/" className={`flex flex-col items-center justify-center flex-1 h-full ${pathname === '/' ? 'text-cyan-400' : 'text-gray-400'}`}>
            <Home size={22} className={pathname === '/' ? 'drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : ''} />
            <span className="text-[10px] mt-1 font-medium">Home</span>
          </Link>
          
          <Link href="/search" className={`flex flex-col items-center justify-center flex-1 h-full ${pathname === '/search' ? 'text-cyan-400' : 'text-gray-400'}`}>
            <Search size={22} />
            <span className="text-[10px] mt-1 font-medium">Search</span>
          </Link>
          
          <Link href="/cart" className={`relative flex flex-col items-center justify-center flex-1 h-full ${pathname === '/cart' ? 'text-cyan-400' : 'text-gray-400'}`}>
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
          
          {isLoggedIn ? (
            <>
              <Link href="/orders" className={`flex flex-col items-center justify-center flex-1 h-full ${pathname === '/orders' ? 'text-cyan-400' : 'text-gray-400'}`}>
                <div className="w-6 h-6 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center text-[10px] font-bold border border-cyan-500/20">
                  {user?.full_name[0].toUpperCase()}
                </div>
                <span className="text-[10px] mt-1 font-medium truncate w-full text-center px-1">
                  {user?.full_name.split(' ')[0]}
                </span>
              </Link>
              <button 
                onClick={clearUser}
                className="flex flex-col items-center justify-center flex-1 h-full text-red-400/80 hover:text-red-400 transition-colors"
              >
                <LogOut size={20} />
                <span className="text-[10px] mt-1 font-medium">Exit</span>
              </button>
            </>
          ) : (
            <Link href="/login" className={`flex flex-col items-center justify-center flex-1 h-full ${pathname === '/login' ? 'text-cyan-400' : 'text-gray-400'}`}>
              <User size={22} />
              <span className="text-[10px] mt-1 font-medium">Sign In</span>
            </Link>
          )}
        </div>
      </div>
    );
}
