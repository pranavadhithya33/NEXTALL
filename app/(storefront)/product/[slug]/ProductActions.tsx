"use client";

import { useState } from 'react';
import { useCartStore } from '@/store/cart';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Zap, Minus, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export function ProductActions({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const addItem = useCartStore(state => state.addItem);
  const router = useRouter();

  const handleAddToCart = () => {
    addItem({
      product_id: product.id,
      slug: product.slug,
      name: product.name,
      quantity: qty,
      original_price: product.original_price,
      our_price: product.our_price,
      prepaid_price: product.prepaid_price,
      image: product.images[0] || '',
    });
    toast.success('Added to cart');
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/cart');
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div className="text-sm font-medium text-gray-400">Quantity</div>
        <div className="flex items-center bg-white/5 rounded-lg border border-white/10 p-1">
          <button 
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded disabled:opacity-50"
            onClick={() => setQty(Math.max(1, qty - 1))}
            disabled={qty <= 1}
          >
            <Minus size={16} />
          </button>
          <div className="w-10 text-center font-bold">{qty}</div>
          <button 
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded"
            onClick={() => setQty(Math.min(5, qty + 1))}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button 
          variant="outline" 
          className="h-14 rounded-xl border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 font-bold"
          onClick={handleAddToCart}
          disabled={!product.in_stock}
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          Add to Cart
        </Button>
        <Button 
          className="h-14 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] transition-all"
          onClick={handleBuyNow}
          disabled={!product.in_stock}
        >
          <Zap className="w-5 h-5 mr-2" />
          Buy Now
        </Button>
      </div>
      
      {!product.in_stock && (
        <div className="mt-4 text-center text-red-400 font-medium">
          Currently Out of Stock
        </div>
      )}
    </div>
  );
}
