"use client";

import useSWR from 'swr';
import axios from 'axios';
import { Skeleton } from '@/components/ui/skeleton';

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export function StatsCards() {
  const { data, error, isLoading } = useSWR('/api/admin/stats', fetcher, { refreshInterval: 60000 });

  if (error) return <div className="text-red-500 mb-8">Failed to load stats.</div>;

  const cards = [
    { label: 'TOTAL PRODUCTS', value: data?.totalProducts, color: 'text-gray-900' },
    { label: 'IN STOCK', value: data?.inStock, color: 'text-emerald-500' },
    { label: 'TOTAL ORDERS', value: data?.totalOrders, color: 'text-gray-900' },
    { label: 'PENDING ORDERS', value: data?.pendingOrders, color: 'text-amber-500' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 flex flex-col justify-center h-32">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{card.label}</h3>
          {isLoading ? (
            <Skeleton className="h-10 w-20" />
          ) : (
            <div className={`text-4xl font-display font-bold ${card.color}`}>
              {card.value}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
