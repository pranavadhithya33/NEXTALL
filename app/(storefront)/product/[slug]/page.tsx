import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { ProductGallery } from './ProductGallery';
import { ProductActions } from './ProductActions';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ShieldCheck, Truck } from 'lucide-react';

export const revalidate = 60; // Revalidate page every 60 seconds

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!product) {
    notFound();
  }

  const savings = product.original_price - product.our_price;
  const prepaidSavings = product.original_price - product.prepaid_price;
  const savingsPercent = Math.round((prepaidSavings / product.original_price) * 100);

  // Parse specs if it's a JSON string or object
  const specs = typeof product.specs === 'string' ? JSON.parse(product.specs) : (product.specs || {});

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left: Gallery */}
        <div className="space-y-4">
          <ProductGallery images={product.images} name={product.name} />
          
          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-2 mt-8 border-t border-white/10 pt-8">
            <div className="flex flex-col items-center text-center gap-2 text-gray-400">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
              <span className="text-xs font-medium">1 Year<br/>Warranty</span>
            </div>
            <div className="flex flex-col items-center text-center gap-2 text-gray-400">
              <CheckCircle2 className="w-8 h-8 text-cyan-400" />
              <span className="text-xs font-medium">100%<br/>Genuine</span>
            </div>
            <div className="flex flex-col items-center text-center gap-2 text-gray-400">
              <Truck className="w-8 h-8 text-amber-400" />
              <span className="text-xs font-medium">Free<br/>Delivery</span>
            </div>
          </div>
        </div>

        {/* Right: Info */}
        <div className="flex flex-col">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm text-cyan-400 font-medium uppercase tracking-wider">{product.brand}</span>
            <span className="text-gray-600">•</span>
            <span className="text-sm text-gray-400">{product.category}</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-display font-bold leading-tight mb-4">
            {product.name}
          </h1>

          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center text-amber-400">
              {'★'.repeat(Math.round(product.rating || 4.5))}
              <span className="text-gray-500 text-sm ml-2">({product.review_count || 128} reviews)</span>
            </div>
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
              In Stock
            </Badge>
          </div>

          {/* Pricing Box */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-red-500 text-white font-bold text-sm px-4 py-1 rounded-bl-xl">
              Save {savingsPercent}%
            </div>
            
            <div className="flex flex-col gap-1 mb-6">
              <div className="text-gray-400 line-through text-sm">
                Amazon MRP: ₹{product.original_price.toLocaleString('en-IN')}
              </div>
              <div className="text-5xl font-display font-bold text-white flex items-baseline gap-2">
                <span className="text-2xl text-gray-400">₹</span>
                {product.prepaid_price.toLocaleString('en-IN')}
              </div>
              <div className="text-emerald-400 text-sm font-medium mt-1">
                You save ₹{prepaidSavings.toLocaleString('en-IN')} with Full Prepaid
              </div>
            </div>

            {/* Actions (Client Component) */}
            <ProductActions product={product} />
          </div>

          {/* Description */}
          {product.description && (
            <div className="mb-10">
              <h3 className="text-lg font-bold mb-4 border-b border-white/10 pb-2">Key Features</h3>
              <ul className="space-y-3 text-gray-300">
                {product.description.split('\n').filter(Boolean).map((line: string, i: number) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-cyan-400 mt-1">•</span>
                    <span className="leading-relaxed text-sm">{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Specs */}
          {Object.keys(specs).length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-4 border-b border-white/10 pb-2">Specifications</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(specs).slice(0, 10).map(([key, value]) => (
                  <div key={key} className="flex flex-col border border-white/5 rounded-lg p-3 bg-white/5">
                    <span className="text-xs text-gray-500 mb-1">{key}</span>
                    <span className="text-sm font-medium">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
