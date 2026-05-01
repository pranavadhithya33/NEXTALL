import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateSlug } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const supabase = createClient(true);
    let query = supabase.from('products').select('*', { count: 'exact' });

    const { data: products, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({ products, total: count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const product = await request.json();
    const supabase = createClient(true);

    if (!product.slug) {
      let slug = generateSlug(product.name);
      let isUnique = false;
      let counter = 1;
      let finalSlug = slug;

      while (!isUnique) {
        const { data } = await supabase.from('products').select('id').eq('slug', finalSlug).single();
        if (!data) isUnique = true;
        else { counter++; finalSlug = `${slug}-${counter}`; }
      }
      product.slug = finalSlug;
    }

    // Sanitize product object to only include valid DB columns
    const validColumns = [
      'name', 'slug', 'description', 'category', 'brand', 
      'amazon_url', 'original_price', 'our_price', 'prepaid_price', 
      'images', 'specs', 'in_stock'
    ];
    const sanitizedProduct: any = {};
    validColumns.forEach(col => {
      if (product[col] !== undefined) {
        sanitizedProduct[col] = product[col];
      }
    });

    const { data, error } = await supabase.from('products').insert([sanitizedProduct]).select().single();

    if (error) throw error;
    return NextResponse.json({ success: true, product: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
