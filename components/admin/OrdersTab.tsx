"use client";

import { useState } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { Order } from '@/types';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import Image from 'next/image';

const fetcher = (url: string) => axios.get(url).then(res => res.data);

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export function OrdersTab() {
  const { data, mutate } = useSWR('/api/admin/orders', fetcher);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const orders: Order[] = data?.orders || [];

  const updateStatus = async (id: string, status: string) => {
    try {
      await axios.patch(`/api/admin/orders/${id}`, { status });
      toast.success('Status updated');
      mutate();
      if (selectedOrder?.id === id) setSelectedOrder(prev => prev ? { ...prev, status: status as any } : null);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'delivered': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
            <tr>
              <th className="p-4">ORDER ID</th>
              <th className="p-4">CUSTOMER</th>
              <th className="p-4">ITEMS</th>
              <th className="p-4">PAYMENT</th>
              <th className="p-4">AMOUNT</th>
              <th className="p-4">STATUS</th>
              <th className="p-4 text-right">DATE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map(order => (
              <tr key={order.id} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => setSelectedOrder(order)}>
                <td className="p-4 font-mono text-gray-500">{order.order_number}</td>
                <td className="p-4">
                  <div className="font-semibold">{order.customer_name}</div>
                  <div className="text-gray-500 text-xs">{order.customer_phone}</div>
                </td>
                <td className="p-4">
                  {order.items.length === 1 ? (
                    <span className="line-clamp-1 max-w-[200px]">{order.items[0].name}</span>
                  ) : (
                    <span>{order.items.length} items from cart</span>
                  )}
                </td>
                <td className="p-4">
                  {order.payment_method === 'prepaid' ? (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">✓ Prepaid</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">🚚 Half COD</Badge>
                  )}
                </td>
                <td className="p-4 font-bold">₹{order.final_amount.toLocaleString('en-IN')}</td>
                <td className="p-4" onClick={e => e.stopPropagation()}>
                  <Select value={order.status} onValueChange={v => updateStatus(order.id, v)}>
                    <SelectTrigger className={`h-8 w-32 ${getStatusColor(order.status)}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-4 text-right text-gray-500">
                  {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-gray-500">No orders yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Sheet open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Order Details</SheetTitle>
            <SheetDescription className="font-mono">{selectedOrder?.order_number}</SheetDescription>
          </SheetHeader>

          {selectedOrder && (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">Customer</h4>
                <div className="bg-gray-50 p-3 rounded-lg text-sm">
                  <div className="font-medium">{selectedOrder.customer_name}</div>
                  <div className="text-gray-600">{selectedOrder.customer_phone}</div>
                  <div className="text-gray-600">{selectedOrder.customer_email}</div>
                  <div className="mt-2 text-gray-600">
                    {selectedOrder.customer_address}<br/>
                    {selectedOrder.customer_city}, {selectedOrder.customer_state} - {selectedOrder.customer_pincode}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Items</h4>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex gap-3 text-sm border-b pb-3 last:border-0">
                      <div className="w-12 h-12 relative rounded bg-gray-100 flex-shrink-0">
                        {item.image && <Image src={item.image} alt="" fill className="object-cover rounded" unoptimized />}
                      </div>
                      <div>
                        <div className="line-clamp-2">{item.name}</div>
                        <div className="text-gray-500 mt-1">
                          Qty: {item.quantity} × ₹{(selectedOrder.payment_method === 'prepaid' ? item.prepaid_price : item.our_price).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Payment Breakdown</h4>
                <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
                  {selectedOrder.payment_method === 'prepaid' ? (
                    <>
                      <div className="flex justify-between"><span>Full Prepaid</span><span className="font-bold">₹{selectedOrder.final_amount.toLocaleString('en-IN')}</span></div>
                      <div className="text-emerald-600 text-xs mt-1">Saves ₹{selectedOrder.savings_amount?.toLocaleString('en-IN')} vs Amazon price</div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between"><span>Advance Paid</span><span>₹{selectedOrder.advance_amount?.toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between text-amber-700"><span>Remaining on Delivery</span><span>₹{selectedOrder.remaining_amount?.toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between border-t pt-1 mt-1 font-bold"><span>Total</span><span>₹{selectedOrder.final_amount.toLocaleString('en-IN')}</span></div>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-4">
                <a 
                  href={`https://wa.me/${selectedOrder.customer_phone}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center justify-center w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-3 rounded-xl font-bold transition-colors"
                >
                  Open WhatsApp
                </a>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
