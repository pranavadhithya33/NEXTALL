"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUserStore } from '@/store/user';

export default function UserLoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setUser = useUserStore(state => state.setUser);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const { data } = await axios.post(endpoint, formData);
      
      setUser(data.user);
      toast.success(isLogin ? 'Logged in successfully' : 'Account created successfully');
      router.push('/');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-[#111827] p-8 rounded-3xl border border-white/5 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-gray-400 text-sm">
            {isLogin ? 'Enter your details to access your account' : 'Join us to get the best deals on premium gadgets'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400">Full Name</label>
                <Input 
                  required 
                  value={formData.full_name} 
                  onChange={e => setFormData({...formData, full_name: e.target.value})} 
                  className="bg-white/5 border-white/10 text-white rounded-xl h-12" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400">Phone Number</label>
                <Input 
                  required 
                  pattern="\d{10}"
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                  className="bg-white/5 border-white/10 text-white rounded-xl h-12" 
                />
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400">Email Address</label>
            <Input 
              required 
              type="email"
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              className="bg-white/5 border-white/10 text-white rounded-xl h-12" 
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400">Password</label>
            <Input 
              required 
              type="password"
              minLength={6}
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
              className="bg-white/5 border-white/10 text-white rounded-xl h-12" 
            />
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl h-12 font-bold mt-6"
          >
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-400">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-cyan-400 font-bold hover:underline"
          >
            {isLogin ? 'Register now' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
