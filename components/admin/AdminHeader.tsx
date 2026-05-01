"use client";

import { LogOut } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '../ui/button';
import toast from 'react-hot-toast';
import axios from 'axios';

export function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();

  // Hide header on login page
  if (pathname === '/admin/login') return null;

  const handleLogout = async () => {
    try {
      await axios.post('/api/admin/auth/logout');
      toast.success('Logged out successfully');
      router.push('/admin/login');
    } catch (err) {
      toast.error('Failed to log out');
    }
  };

  return (
    <header className="w-full bg-[var(--color-admin-header)] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-display font-bold">
            NEXT<span className="text-cyan-400">ALL</span>
          </div>
          <span className="bg-white/10 px-2 py-1 rounded text-xs uppercase tracking-wider text-cyan-100">
            Admin Panel
          </span>
        </div>
        <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </header>
  );
}
