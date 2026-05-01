import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';

export const revalidate = 60;

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  
  // Convert slug back to readable category name (capitalized)
  const categoryName = params.slug.charAt(0).toUpperCase() + params.slug.slice(1);

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .ilike('category', categoryName)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
        <h1 className="text-3xl font-display font-bold">{categoryName}</h1>
        <span className="text-gray-400">{products?.length || 0} Products</span>
      </div>

      {!products || products.length === 0 ? (
        <div className="text-center py-24 text-gray-500">
          No products found in this category.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map(product => (
            <Link href={`/product/${product.slug}`} key={product.id} className="group bg-[#111827] rounded-2xl border border-white/5 overflow-hidden hover:border-cyan-500/50 transition-all hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] flex flex-col h-full">
              <div className="relative aspect-square bg-white p-4">
                {product.images?.[0] && (
                  <Image 
                    src={product.images[0]} 
                    alt={product.name} 
                    fill 
                    className="object-contain group-hover:scale-105 transition-transform duration-500" 
                    unoptimized 
                  />
                )}
                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                  -{Math.round(((product.original_price - product.prepaid_price) / product.original_price) * 100)}%
                </div>
              </div>
              <div className="p-4 flex flex-col flex-grow">
                <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">{product.brand}</div>
                <h3 className="font-medium text-white mb-2 line-clamp-2 leading-snug group-hover:text-cyan-400 transition-colors flex-grow">
                  {product.name}
                </h3>
                <div className="mt-auto">
                  <div className="text-xs text-gray-500 line-through mb-0.5">₹{product.original_price.toLocaleString('en-IN')}</div>
                  <div className="text-lg font-bold text-white flex items-center gap-2">
                    ₹{product.prepaid_price.toLocaleString('en-IN')}
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded text-nowrap">Prepaid</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
