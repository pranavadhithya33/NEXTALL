import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Please enter Order ID or Phone Number' }, { status: 400 });
    }

    const supabase = createClient(true);
    
    // Check if it's an order number or phone
    const isOrderNumber = query.toUpperCase().startsWith('#NXT-');
    
    let dbQuery = supabase.from('orders').select('*');
    
    if (isOrderNumber) {
      dbQuery = dbQuery.eq('order_number', query.toUpperCase());
    } else {
      dbQuery = dbQuery.eq('customer_phone', query);
    }

    const { data: orders, error } = await dbQuery.order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to track order' }, { status: 500 });
  }
}
