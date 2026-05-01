"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useDebounce } from 'use-debounce';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 500);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`/api/public/products?search=${encodeURIComponent(debouncedQuery)}&limit=20`);
        setResults(data.products);
      } catch (err) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-[70vh]">
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <Input 
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search for smartphones, laptops..."
          className="w-full bg-[#111827] border-white/10 text-white rounded-xl py-6 pl-12 pr-4 text-lg"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
        </div>
      ) : query && results.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No products found matching "{query}"
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {results.map(product => (
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
              </div>
              <div className="p-4 flex flex-col flex-grow">
                <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">{product.brand}</div>
                <h3 className="font-medium text-white mb-2 line-clamp-2 leading-snug group-hover:text-cyan-400 transition-colors flex-grow">
                  {product.name}
                </h3>
                <div className="mt-auto text-lg font-bold text-cyan-400">
                  ₹{product.prepaid_price.toLocaleString('en-IN')}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
