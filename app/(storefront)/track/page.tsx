"use client";

import { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Order } from '@/types';
import { Badge } from '@/components/ui/badge';
import { PackageSearch, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TrackOrderPage() {
  const [query, setQuery] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    
    setLoading(true);
    setSearched(true);
    try {
      const { data } = await axios.post('/api/public/track', { query });
      setOrders(data.orders);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to find orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'confirmed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'shipped': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
      case 'delivered': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-800 text-gray-400 border-gray-700';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 min-h-[70vh]">
      <div className="text-center mb-12">
        <PackageSearch className="w-16 h-16 mx-auto mb-6 text-cyan-500 opacity-80" />
        <h1 className="text-4xl font-display font-bold mb-4">Track Your Order</h1>
        <p className="text-gray-400">Enter your Order ID (#NXT-XXXX) or Phone Number to check the status.</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-4 max-w-xl mx-auto mb-16">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input 
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="e.g. #NXT-A1B2C3D4 or 9876543210"
            className="w-full bg-[#111827] border-white/10 text-white rounded-xl py-6 pl-12 pr-4 text-lg"
          />
        </div>
        <Button 
          type="submit" 
          disabled={loading}
          className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl px-8 h-auto"
        >
          {loading ? 'Searching...' : 'Track'}
        </Button>
      </form>

      {searched && (
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="text-center text-gray-500 py-12 bg-[#111827] rounded-2xl border border-white/5">
              No orders found matching "{query}"
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-6">Found {orders.length} Order(s)</h2>
              {orders.map(order => (
                <div key={order.id} className="bg-[#111827] rounded-2xl border border-white/5 p-6 md:p-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-white/5">
                    <div>
                      <div className="text-2xl font-mono font-bold text-white mb-2">{order.order_number}</div>
                      <div className="text-sm text-gray-400">Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    </div>
                    <Badge variant="outline" className={`px-4 py-2 text-sm uppercase tracking-wider font-bold ${getStatusColor(order.status)}`}>
                      {order.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Items</h4>
                      <div className="space-y-3">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-gray-300 line-clamp-1 pr-4">{item.quantity} × {item.name}</span>
                            <span className="font-medium">₹{(order.payment_method === 'prepaid' ? item.prepaid_price : item.our_price).toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Payment Info</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Method</span>
                          <span className="font-medium text-white">{order.payment_method === 'prepaid' ? 'Full Prepaid' : 'Half COD'}</span>
                        </div>
                        {order.payment_method === 'half_cod' && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Advance Paid</span>
                              <span className="font-medium text-white">₹{order.advance_amount?.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Remaining</span>
                              <span className="font-medium text-amber-400">₹{order.remaining_amount?.toLocaleString('en-IN')}</span>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between border-t border-white/10 pt-2 mt-2">
                          <span className="text-gray-400">Total Amount</span>
                          <span className="font-bold text-white text-lg">₹{order.final_amount.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
