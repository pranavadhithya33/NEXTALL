import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Please enter Order ID or Phone Number' }, { status: 400 });
    }

    const supabase = createClient(true);
    
    // Clean up the query
    const cleanQuery = query.trim().toUpperCase();
    const isOrderNumber = cleanQuery.startsWith('#NXT-') || cleanQuery.startsWith('NXT-');
    
    let dbQuery = supabase.from('orders').select('*');
    
    if (isOrderNumber) {
      // Normalize to #NXT- format
      const orderId = cleanQuery.startsWith('#') ? cleanQuery : `#${cleanQuery}`;
      dbQuery = dbQuery.eq('order_number', orderId);
    } else {
      // Clean phone number (remove spaces, dashes, etc)
      const phone = query.replace(/\D/g, '');
      // Try both exact match and partial match for phone
      dbQuery = dbQuery.or(`customer_phone.eq.${phone},customer_phone.ilike.%${phone}%`);
    }

    const { data: orders, error } = await dbQuery.order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(
      { success: true, orders },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        }
      }
    );
  } catch (error: any) {
    console.error('Tracking Error:', error);
    return NextResponse.json({ error: 'Failed to track order' }, { status: 500 });
  }
}
