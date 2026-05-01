"use client";

import Link from 'next/link';
import { ShoppingCart, Search, Menu, User, X } from 'lucide-react';
import { useState } from 'react';
import { useCartStore } from '@/store/cart';
import { useUserStore } from '@/store/user';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const items = useCartStore(state => state.items);
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const { isLoggedIn, user, clearUser } = useUserStore();

  return (
    <nav className="sticky top-0 z-50 bg-[#0A0E1A]/90 backdrop-blur-xl border-b border-white/10 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Menu (Mobile) */}
          <div className="flex items-center gap-4">
            <button className="md:hidden text-gray-300" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
            <Link href="/" className="text-2xl font-display font-bold tracking-tight">
              NEXT<span className="text-cyan-400">ALL</span>
            </Link>
          </div>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-cyan-400 transition-colors w-5 h-5" />
              <input 
                type="text"
                placeholder="Search premium gadgets..."
                className="w-full bg-white/5 border border-white/10 text-white rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:bg-white/10 transition-all placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <Link href="/track" className="hidden md:block text-sm font-medium text-gray-300 hover:text-white transition-colors">
              Track Order
            </Link>
            
            <div className="hidden md:flex items-center gap-2 border-l border-white/10 pl-4 ml-2">
              {isLoggedIn ? (
                <div className="relative group cursor-pointer">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
                    <User size={20} />
                    <span>{user?.full_name.split(' ')[0]}</span>
                  </div>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[#1A1F2E] border border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <div className="p-4 border-b border-white/10">
                      <div className="font-medium text-white">{user?.full_name}</div>
                      <div className="text-xs text-gray-400 truncate">{user?.email}</div>
                    </div>
                    <div className="p-2 border-b border-white/10">
                      <Link href="/orders">
                        <button className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                          My Orders
                        </button>
                      </Link>
                    </div>
                    <div className="p-2">
                      <button onClick={clearUser} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-white/5 rounded-lg transition-colors">
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link href="/login">
                  <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>

            <Link href="/cart" className="relative p-2 text-gray-300 hover:text-cyan-400 transition-colors">
              <ShoppingCart size={24} />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-cyan-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse-soft">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden">
          <div className="absolute left-0 top-0 bottom-0 w-4/5 max-w-sm bg-[#0A0E1A] shadow-2xl flex flex-col slide-in">
            <div className="flex justify-between items-center p-4 border-b border-white/10">
              <span className="text-xl font-display font-bold">NEXT<span className="text-cyan-400">ALL</span></span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-4 border-b border-white/10">
              {isLoggedIn ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center font-bold text-lg">
                    {user?.full_name[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">{user?.full_name}</div>
                    <div className="text-xs text-gray-400">{user?.email}</div>
                  </div>
                </div>
              ) : (
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl">Sign In / Register</Button>
                </Link>
              )}
            </div>

            <div className="flex flex-col flex-1 p-4 gap-2">
              <Link href="/" className="px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors font-medium" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
              <Link href="/track" className="px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors font-medium" onClick={() => setIsMobileMenuOpen(false)}>Track Order</Link>
              {isLoggedIn && (
                <Link href="/orders" className="px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors font-medium" onClick={() => setIsMobileMenuOpen(false)}>My Orders</Link>
              )}
              <div className="my-2 border-t border-white/10"></div>
              <Link href="/category/smartphones" className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Smartphones</Link>
              <Link href="/category/tablets" className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Tablets</Link>
              <Link href="/category/laptops" className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Laptops</Link>
              <Link href="/category/audio" className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Audio & Wearables</Link>
            </div>

            {isLoggedIn && (
              <div className="p-4 border-t border-white/10">
                <button onClick={() => { clearUser(); setIsMobileMenuOpen(false); }} className="w-full py-3 text-center text-red-400 font-medium hover:bg-red-400/10 rounded-xl transition-colors">
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
