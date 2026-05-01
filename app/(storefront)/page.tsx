"use client";

import { useState, useEffect, Fragment, Suspense } from 'react';
import useSWRInfinite from 'swr/infinite';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { Badge } from '@/components/ui/badge';
import { useInView } from 'react-intersection-observer';
import { useSearchParams, useRouter } from 'next/navigation';

const fetcher = (url: string) => axios.get(url).then(res => res.data);

const CATEGORIES = ['All', 'Smartphones', 'Laptops', 'Tablets', 'Audio', 'Smartwatches', 'Accessories'];

function HomeContent() {
  const { ref, inView } = useInView();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get category from URL or default to 'All'
  const currentCategory = searchParams.get('cat') || 'All';

  const getKey = (pageIndex: number, previousPageData: any) => {
    if (previousPageData && !previousPageData.products.length) return null;
    const catParam = currentCategory === 'All' ? '' : `&category=${currentCategory}`;
    return `/api/public/products?page=${pageIndex + 1}&limit=20${catParam}`;
  };

  const { data, size, setSize, isValidating, mutate } = useSWRInfinite(getKey, fetcher, {
    refreshInterval: 10000,
    revalidateOnFocus: true
  });
  
  const products = data ? data.flatMap(page => page.products) : [];
  const isLoadingMore = isValidating && size > 0;
  const isReachingEnd = data?.[data.length - 1]?.products?.length < 20;

  useEffect(() => {
    if (inView && !isReachingEnd && !isLoadingMore) {
      setSize(size + 1);
    }
  }, [inView, isReachingEnd, isLoadingMore, setSize, size]);

  const handleCategoryChange = (cat: string) => {
    if (cat === 'All') {
      router.push('/', { scroll: false });
    } else {
      router.push(`/?cat=${cat}`, { scroll: false });
    }
  };

  return (
    <div className="pb-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0D1326] via-[#0A0E1A] to-[#0D1326] py-20 border-b border-white/5">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 mb-6 px-4 py-1.5 rounded-full backdrop-blur-md">
            🚀 100% Genuine • Fast Delivery • Lowest Prices
          </Badge>
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 tracking-tight leading-tight slide-up-element">
            Premium Gadgets.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              Unbeatable Prices.
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 slide-up-element" style={{ animationDelay: '0.1s' }}>
            Direct-to-consumer deals on the latest tech. All products verified and shipped with full warranty.
          </p>
        </div>
      </section>

      {/* Categories Bar */}
      <div className="sticky top-16 z-40 bg-[#0A0E1A]/80 backdrop-blur-md border-b border-white/5 overflow-x-auto hide-scrollbar">
        <div className="flex items-center gap-2 max-w-7xl mx-auto px-4 py-3 min-w-max">
          {CATEGORIES.map((cat) => (
            <button 
              key={cat} 
              onClick={() => handleCategoryChange(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                currentCategory === cat 
                ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' 
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8 pb-2 border-b border-white/5">
          <h2 className="text-2xl font-display font-bold">
            {currentCategory === 'All' ? 'All Products' : currentCategory}
          </h2>
          <span className="text-sm text-gray-500">
            {products.length} {products.length === 1 ? 'Product' : 'Products'}
          </span>
        </div>
        
        {products.length === 0 && !isValidating ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
            <p className="text-gray-400">No products found in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {data?.map((page, i) => (
              <Fragment key={i}>
                {page.products.map((product: Product) => (
                  <Link 
                    href={`/product/${product.slug}`} 
                    key={product.id} 
                    className="group bg-[#111827] rounded-2xl border border-white/5 overflow-hidden hover:border-cyan-500/50 transition-all hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] flex flex-col h-full"
                  >
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
                      <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider line-clamp-1">{product.brand}</div>
                      <h3 className="font-medium text-white mb-2 line-clamp-3 leading-snug group-hover:text-cyan-400 transition-colors flex-grow overflow-hidden">
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
              </Fragment>
            ))}
          </div>
        )}

        <div ref={ref} className="py-12 flex justify-center">
          {isLoadingMore && (
            <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
          )}
          {!isLoadingMore && isReachingEnd && products.length > 0 && (
            <p className="text-gray-500 text-sm">You've seen all products</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0A0E1A]">
        <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
