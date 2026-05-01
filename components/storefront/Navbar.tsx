"use client";

import Link from 'next/link';
import { 
  ShoppingCart, Search, Menu, User, X, 
  Home, Package, Truck, LayoutGrid, 
  Heart, Settings, LogOut, MapPin, 
  CreditCard, HelpCircle, Phone, Info,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { useCartStore } from '@/store/cart';
import { useUserStore } from '@/store/user';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const items = useCartStore(state => state.items);
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const { isLoggedIn, user, clearUser } = useUserStore();

  const menuItems = [
    {
      group: "SHOP",
      items: [
        { icon: Home, label: "Home", href: "/" },
        { icon: Package, label: "Orders", href: "/orders" },
        { icon: Truck, label: "Track Order", href: "/track" },
        { icon: LayoutGrid, label: "Category", href: "/#categories" },
      ]
    },
    {
      group: "ACCOUNT",
      items: [
        { icon: User, label: "My Account", href: isLoggedIn ? "/profile" : "/login" },
        { icon: Heart, label: "Wishlist", href: "/wishlist" },
        { icon: MapPin, label: "Addresses", href: "/addresses" },
        { icon: CreditCard, label: "Payment Methods", href: "/payments" },
      ]
    },
    {
      group: "SUPPORT",
      items: [
        { icon: HelpCircle, label: "Help Center", href: "/help" },
        { icon: Phone, label: "Contact Us", href: "/contact" },
        { icon: Info, label: "About Us", href: "/about" },
      ]
    }
  ];

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

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <>
          {/* Dark Blurred Overlay */}
          <div 
            className="fixed inset-0 z-[998] bg-black/80 backdrop-blur-md md:hidden" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Premium Sidebar */}
          <div 
            className="fixed left-0 top-0 bottom-0 z-[999] w-[300px] bg-[#0B0F19] shadow-2xl flex flex-col slide-in border-r border-white/10 md:hidden overflow-hidden"
          >
            {/* Header / Profile Section */}
            <div className="p-6 border-b border-white/10">
              <div className="flex justify-between items-center mb-8">
                <span className="text-2xl font-display font-bold">NEXT<span className="text-cyan-400">ALL</span></span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-lg">
                  <X size={20} />
                </button>
              </div>
              
              {isLoggedIn ? (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-cyan-500/20 text-cyan-400 rounded-2xl flex items-center justify-center font-bold text-xl border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                    {user?.full_name[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-white truncate">{user?.full_name}</div>
                    <div className="text-xs text-gray-500 truncate">{user?.email}</div>
                  </div>
                </div>
              ) : (
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl h-12 font-bold shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                    Sign In / Register
                  </Button>
                </Link>
              )}
            </div>

            {/* Menu Sections */}
            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
              {menuItems.map((section, idx) => (
                <div key={idx} className="space-y-3">
                  <div className="px-2 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                    {section.group}
                  </div>
                  <div className="space-y-1">
                    {section.items.map((item, i) => (
                      <Link 
                        key={i} 
                        href={item.href} 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-between group px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-2xl transition-all duration-200"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-white/[0.03] rounded-xl group-hover:bg-cyan-500/10 group-hover:text-cyan-400 transition-colors">
                            <item.icon size={20} strokeWidth={1.5} />
                          </div>
                          <span className="font-medium">{item.label}</span>
                        </div>
                        <ChevronRight size={16} className="text-gray-600 group-hover:text-cyan-400 transition-colors" />
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Sign Out Section */}
            {isLoggedIn && (
              <div className="p-6 border-t border-white/10 bg-white/[0.02]">
                <button 
                  onClick={() => { clearUser(); setIsMobileMenuOpen(false); }} 
                  className="w-full flex items-center justify-center gap-3 py-4 text-red-400 font-bold hover:bg-red-400/10 rounded-2xl transition-all duration-200 border border-red-400/10"
                >
                  <LogOut size={20} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </nav>
  );
}
