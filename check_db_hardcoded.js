import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://YOUR_PROJECT.supabase.co'; // Replace with real values from .env.local
const supabaseKey = 'YOUR_SERVICE_ROLE_KEY';

async function checkProducts() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase.from('products').select('name, category, created_at').order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Total Products:', data.length);
  data.forEach(p => {
    console.log(`- ${p.name} | Category: "${p.category}" | Created: ${p.created_at}`);
  });
}

checkProducts();
