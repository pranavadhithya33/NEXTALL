import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateOrderNumber } from '@/lib/utils';
import { z } from 'zod';

const orderSchema = z.object({
  user_id: z.string().optional(),
  customer_name: z.string().min(1, 'Name is required'),
  customer_phone: z.string().regex(/^\d{10}$/, 'Valid 10-digit phone number is required'),
  customer_email: z.string().email().optional().or(z.literal('')),
  customer_address: z.string().min(10, 'Full address is required'),
  customer_city: z.string().min(1, 'City is required'),
  customer_state: z.string().min(1, 'State is required'),
  customer_pincode: z.string().regex(/^\d{6}$/, 'Valid 6-digit pincode is required'),
  items: z.array(z.any()).min(1, 'Cart is empty'),
  subtotal: z.number().min(0),
  payment_method: z.enum(['prepaid', 'half_cod']),
  final_amount: z.number().min(0),
  advance_amount: z.number().optional(),
  remaining_amount: z.number().optional(),
  savings_amount: z.number().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = orderSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const order_number = generateOrderNumber();
    const supabase = createClient(true); // Need service role to insert orders from public

    const { data, error } = await supabase
      .from('orders')
      .insert([{ ...result.data, order_number, status: 'pending' }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, order: data });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to place order' }, { status: 500 });
  }
}
