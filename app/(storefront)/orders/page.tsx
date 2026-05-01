"use client";

import { useEffect, useState } from 'react';
import { useUserStore } from '@/store/user';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import axios from 'axios';
import { Order } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Package, Truck, CheckCircle2, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export default function MyOrdersPage() {
  const { user, isLoggedIn } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, router]);

  const { data, error, isLoading } = useSWR(
    user ? `/api/public/orders/user/${user.id}` : null, 
    fetcher
  );

  const orders: Order[] = data?.orders || [];

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'pending': return <Clock size={20} className="text-amber-500" />;
      case 'confirmed': return <CheckCircle2 size={20} className="text-blue-500" />;
      case 'shipped': return <Truck size={20} className="text-indigo-500" />;
      case 'delivered': return <CheckCircle2 size={20} className="text-emerald-500" />;
      case 'cancelled': return <XCircle size={20} className="text-red-500" />;
      default: return <Package size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'confirmed': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'shipped': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
      case 'delivered': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-400';
    }
  };

  if (!isLoggedIn) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 min-h-[70vh]">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-cyan-500/10 rounded-2xl">
          <Package className="w-8 h-8 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold">My Orders</h1>
          <p className="text-gray-400">Manage and track your recent purchases</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-40 bg-white/5 rounded-2xl animate-pulse border border-white/10" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-[#111827] rounded-3xl border border-white/5 border-dashed">
          <p className="text-gray-500 mb-6">You haven't placed any orders yet.</p>
          <Link href="/">
            <button className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-3 rounded-xl font-bold transition-all">
              Start Shopping
            </button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="bg-[#111827] rounded-3xl border border-white/5 overflow-hidden transition-all hover:border-white/10">
              <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between gap-6 border-b border-white/5 bg-white/[0.02]">
                <div className="space-y-1">
                  <div className="text-lg font-mono font-bold text-white">{order.order_number}</div>
                  <div className="text-sm text-gray-500">Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={`px-4 py-2 text-xs uppercase tracking-widest font-bold flex items-center gap-2 ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    {order.status}
                  </Badge>
                </div>
              </div>

              <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Items</h4>
                  <div className="space-y-4">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex gap-4 group">
                        <div className="w-16 h-16 relative rounded-xl bg-white p-2 flex-shrink-0">
                          {item.image && <img src={item.image} alt="" className="w-full h-full object-contain" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white font-medium line-clamp-1 mb-1">{item.name}</div>
                          <div className="text-xs text-gray-500">
                            Qty: {item.quantity} × ₹{(order.payment_method === 'prepaid' ? item.prepaid_price : item.our_price).toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white/[0.03] rounded-2xl p-6 border border-white/5 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Payment Method</span>
                      <span className="text-white font-medium">{order.payment_method === 'prepaid' ? 'Full Prepaid' : 'Half COD'}</span>
                    </div>
                    {order.payment_method === 'half_cod' && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Advance Paid</span>
                        <span className="text-emerald-400 font-bold">₹{order.advance_amount?.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-end">
                    <div className="text-xs text-gray-500 uppercase tracking-widest">Total Amount</div>
                    <div className="text-2xl font-bold text-white">₹{order.final_amount.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
