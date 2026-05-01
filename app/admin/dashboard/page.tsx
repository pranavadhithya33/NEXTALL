"use client";

import { StatsCards } from '@/components/admin/StatsCards';
import { ProductsTab } from '@/components/admin/ProductsTab';
import { OrdersTab } from '@/components/admin/OrdersTab';
import { ReviewsTab } from '@/components/admin/ReviewsTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminDashboardPage() {
  return (
    <div>
      <StatsCards />

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="mb-8 bg-gray-100 p-1 rounded-xl">
          <TabsTrigger value="products" className="rounded-lg data-[state=active]:bg-gray-900 data-[state=active]:text-white">
            Products
          </TabsTrigger>
          <TabsTrigger value="orders" className="rounded-lg data-[state=active]:bg-gray-900 data-[state=active]:text-white">
            Orders
          </TabsTrigger>
          <TabsTrigger value="reviews" className="rounded-lg data-[state=active]:bg-gray-900 data-[state=active]:text-white">
            Reviews
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-0 outline-none">
          <ProductsTab />
        </TabsContent>
        
        <TabsContent value="orders" className="mt-0 outline-none">
          <OrdersTab />
        </TabsContent>
        
        <TabsContent value="reviews" className="mt-0 outline-none">
          <ReviewsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
