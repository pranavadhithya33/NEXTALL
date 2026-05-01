"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Product } from '@/types';
import axios from 'axios';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { Trash2 } from 'lucide-react';

interface Props {
  product: Partial<Product> | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const CATEGORIES = ['Smartphones', 'Tablets', 'Accessories', 'Smartwatches', 'Audio', 'Laptops', 'Other'];

export function ProductPreviewModal({ product, isOpen, onClose, onSaved }: Props) {
  const [formData, setFormData] = useState<Partial<Product>>(product || {});
  const [saving, setSaving] = useState(false);

  // Sync state when product prop changes
  if (product && product.slug !== formData.slug && !saving) {
    setFormData(product);
  }

  const handleChange = (field: keyof Product, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'original_price') {
        updated.our_price = Math.round((value as number) * 0.90);
        updated.prepaid_price = updated.our_price - 1000;
      }
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (formData.id) {
        await axios.put(`/api/admin/products/${formData.id}`, formData);
        toast.success('Product updated');
      } else {
        await axios.post('/api/admin/products', formData);
        toast.success('Product added to store');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{formData.id ? 'Edit Product' : 'Review Scraped Product'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Images */}
          <div className="space-y-4">
            <h3 className="font-semibold">Images ({formData.images?.length || 0})</h3>
            <div className="grid grid-cols-2 gap-2">
              {formData.images?.map((img, i) => (
                <div key={i} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
                  <Image src={img} alt={`Img ${i}`} fill className="object-contain p-2" unoptimized />
                  <button 
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleChange('images', formData.images?.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500">Name</label>
              <Input value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500">Brand</label>
                <Input value={formData.brand || ''} onChange={e => handleChange('brand', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Category</label>
                <Select value={formData.category} onValueChange={(val) => handleChange('category', val)}>
                  <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 p-4 bg-amber-50 rounded-lg border border-amber-100">
              <div>
                <label className="text-xs font-semibold text-amber-700">Amazon MRP (₹)</label>
                <Input 
                  type="number" 
                  value={formData.original_price || ''} 
                  onChange={e => handleChange('original_price', parseFloat(e.target.value) || 0)} 
                  className="bg-white border-amber-200"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Our Price (-10%)</label>
                <div className="text-lg font-bold pt-2">₹{formData.our_price?.toLocaleString('en-IN')}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-emerald-600">Prepaid Price (-₹1000)</label>
                <div className="text-lg font-bold pt-2 text-emerald-600">₹{formData.prepaid_price?.toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500">Description (Bullet points)</label>
              <Textarea 
                value={formData.description || ''} 
                onChange={e => handleChange('description', e.target.value)}
                rows={5}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="font-semibold">In Stock</div>
                <div className="text-sm text-gray-500">Is this product available?</div>
              </div>
              <Switch 
                checked={formData.in_stock !== false} 
                onCheckedChange={v => handleChange('in_stock', v)} 
              />
            </div>

          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="ghost" onClick={onClose}>Discard</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-amber-500 hover:bg-amber-600">
            {saving ? 'Saving...' : formData.id ? 'Update Product' : 'Add to Store'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
