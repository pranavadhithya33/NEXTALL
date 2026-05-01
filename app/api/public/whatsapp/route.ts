import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildWhatsAppMessage } from '@/lib/whatsapp';

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const supabase = createClient(true);
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const message = buildWhatsAppMessage(order);
    const encodedMessage = encodeURIComponent(message);
    const waNumber = process.env.ADMIN_WHATSAPP_NUMBER || '919876543210';
    
    // Construct the wa.me URL
    const url = `https://wa.me/${waNumber}?text=${encodedMessage}`;

    return NextResponse.json({ success: true, url });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
