import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from './lib/supabase/server';

async function checkProducts() {
  const supabase = createClient(true); // use service role to see everything
  const { data, error } = await supabase.from('products').select('name, category, created_at').order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Total Products:', data.length);
  console.log('Products:', JSON.stringify(data, null, 2));
}

checkProducts();
