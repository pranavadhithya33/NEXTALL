"use client";

import Link from 'next/link';
import { useWishlistStore } from '@/store/wishlist';
import { useCartStore } from '@/store/cart';
import { Trash2, ShoppingCart, Heart, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

export default function WishlistPage() {
  const { items, removeItem } = useWishlistStore();
  const addItemToCart = useCartStore(state => state.addItem);

  const handleAddToCart = (item: any) => {
    addItemToCart({
      product_id: item.id,
      slug: item.slug,
      name: item.name,
      original_price: item.original_price,
      our_price: item.our_price,
      prepaid_price: item.prepaid_price,
      image: item.image,
      quantity: 1
    });
    toast.success("Added to cart!");
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white pt-24 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-3xl font-display font-bold">My Wishlist</h1>
              <p className="text-gray-400 text-sm">{items.length} items saved</p>
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <Heart size={40} className="text-gray-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Your wishlist is empty</h2>
            <p className="text-gray-400 mb-8 max-w-xs">
              Save your favorite gadgets here to keep track of them and buy them later.
            </p>
            <Link href="/">
              <Button className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl px-8 h-12 font-bold">
                Go Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <div 
                key={item.id} 
                className="group relative bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden hover:border-cyan-500/50 transition-all duration-300"
              >
                {/* Image */}
                <Link href={`/product/${item.slug}`} className="block aspect-square overflow-hidden bg-white/5">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 p-4"
                  />
                </Link>

                {/* Content */}
                <div className="p-5">
                  <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">{item.brand}</div>
                  <Link href={`/product/${item.slug}`}>
                    <h3 className="font-bold text-white line-clamp-2 mb-4 group-hover:text-cyan-400 transition-colors">
                      {item.name}
                    </h3>
                  </Link>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <div className="text-xl font-display font-bold text-cyan-400">
                      ₹{item.prepaid_price.toLocaleString('en-IN')}
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                        title="Remove"
                      >
                        <Trash2 size={20} />
                      </button>
                      <button 
                        onClick={() => handleAddToCart(item)}
                        className="p-2 bg-cyan-500 text-white hover:bg-cyan-600 rounded-xl transition-all shadow-lg shadow-cyan-500/20"
                        title="Add to Cart"
                      >
                        <ShoppingCart size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
