import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = createClient(true);

    // Use a more robust counting method
    const [productsRes, inStockRes, ordersRes, pendingOrdersRes] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('in_stock', true),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);

    // Log errors for debugging (visible in Vercel logs)
    if (productsRes.error) console.error('Stats Products Error:', productsRes.error);
    if (ordersRes.error) console.error('Stats Orders Error:', ordersRes.error);

    return NextResponse.json({
      totalProducts: productsRes.count || 0,
      inStock: inStockRes.count || 0,
      totalOrders: ordersRes.count || 0,
      pendingOrders: pendingOrdersRes.count || 0,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error: any) {
    console.error('Stats API General Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
