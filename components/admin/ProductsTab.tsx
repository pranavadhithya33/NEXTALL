"use client";

import { useState } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { AmazonScraper } from './AmazonScraper';
import { ProductPreviewModal } from './ProductPreviewModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Product } from '@/types';
import { Pencil, Trash2, Search, Plus } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export function ProductsTab() {
  const { data, mutate } = useSWR('/api/admin/products?limit=100', fetcher);
  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  const products: Product[] = data?.products || [];
  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.brand?.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const toggleStock = async (product: Product, inStock: boolean) => {
    try {
      // Optimistic update
      mutate({ ...data, products: products.map(p => p.id === product.id ? { ...p, in_stock: inStock } : p) }, false);
      await axios.put(`/api/admin/products/${product.id}`, { in_stock: inStock });
      toast.success(inStock ? 'Marked in stock' : 'Marked out of stock');
      mutate();
    } catch {
      toast.error('Failed to update stock');
      mutate();
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await axios.delete(`/api/admin/products/${id}`);
      toast.success('Product deleted');
      mutate();
    } catch {
      toast.error('Failed to delete product');
    }
  };

  return (
    <div>
      <AmazonScraper onSaved={() => mutate()} />

      <div className="flex justify-between items-center mb-6">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input 
            placeholder="Search products..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>
        <Button onClick={() => setEditingProduct({})} className="bg-amber-500 hover:bg-amber-600">
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
            <tr>
              <th className="p-4 w-12"></th>
              <th className="p-4">Product</th>
              <th className="p-4">Category</th>
              <th className="p-4">Amazon Price</th>
              <th className="p-4">Our Price</th>
              <th className="p-4">Prepaid Price</th>
              <th className="p-4">Stock</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(product => (
              <tr key={product.id} className="hover:bg-gray-50/50">
                <td className="p-4">
                  <div className="w-10 h-10 relative rounded-lg bg-gray-100 overflow-hidden border">
                    {product.images?.[0] && <Image src={product.images[0]} alt="" fill className="object-cover" unoptimized />}
                  </div>
                </td>
                <td className="p-4">
                  <div className="font-semibold text-gray-900 line-clamp-1">{product.name}</div>
                  <div className="text-gray-500 text-xs">{product.brand}</div>
                </td>
                <td className="p-4">
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">{product.category}</span>
                </td>
                <td className="p-4 text-gray-500 line-through">₹{product.original_price?.toLocaleString('en-IN')}</td>
                <td className="p-4 font-semibold">₹{product.our_price?.toLocaleString('en-IN')}</td>
                <td className="p-4 font-bold text-emerald-600">₹{product.prepaid_price?.toLocaleString('en-IN')}</td>
                <td className="p-4">
                  <Switch checked={product.in_stock} onCheckedChange={(v) => toggleStock(product, v)} />
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setEditingProduct(product)}>
                      <Pencil className="w-4 h-4 text-gray-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteProduct(product.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500">
                  No products found. Add your first product above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ProductPreviewModal 
        isOpen={!!editingProduct} 
        product={editingProduct} 
        onClose={() => setEditingProduct(null)} 
        onSaved={() => mutate()} 
      />
    </div>
  );
}
