"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/admin/auth/login', { password });
      toast.success('Logged in successfully');
      router.push('/admin/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0E1A]">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
            NEXT<span className="text-cyan-500">ALL</span> Admin
          </h1>
          <p className="text-gray-500 text-sm">Enter your password to access the dashboard</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Input
              type="password"
              placeholder="Admin Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-lg p-6 rounded-xl"
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full text-lg py-6 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-white"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login to Dashboard'}
          </Button>
        </form>
      </div>
    </div>
  );
}
