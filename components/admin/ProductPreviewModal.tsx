"use client";

import { useState, useRef } from 'react';
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
import { Trash2, Plus, Upload, Link2, Loader2, CheckCircle2 } from 'lucide-react';

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
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when product prop changes (e.g. new scrape result)
  if (product && product.slug !== formData.slug && !saving) {
    setFormData(product);
  }

  const handleChange = (field: keyof Product, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'original_price') {
        const price = value as number;
        updated.our_price = Math.round(price * 0.90);
        updated.prepaid_price = Math.max(0, updated.our_price - 1000);
      }
      return updated;
    });
  };

  // Add image from pasted URL
  const handleAddImageUrl = () => {
    const url = imageUrl.trim();
    if (!url) return;
    if (!url.startsWith('http')) {
      toast.error('Please enter a valid image URL starting with http');
      return;
    }
    handleChange('images', [...(formData.images || []), url]);
    setImageUrl('');
    toast.success('Image URL added');
  };

  // Upload image file → Supabase Storage → add public URL
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);

      const { data } = await axios.post('/api/admin/upload-image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      handleChange('images', [...(formData.images || []), data.url]);
      toast.success('Image uploaded successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    handleChange('images', (formData.images || []).filter((_, i) => i !== index));
  };

  const handleSetMain = (index: number) => {
    const images = [...(formData.images || [])];
    const [selected] = images.splice(index, 1);
    images.unshift(selected);
    handleChange('images', images);
    toast.success('Main image updated');
  };

  const handleSave = async () => {
    if (!formData.name) { toast.error('Product name is required'); return; }
    if (!formData.original_price) { toast.error('Amazon MRP price is required'); return; }
    if (!formData.category) { toast.error('Please select a category'); return; }

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

  const images = formData.images || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {formData.id ? 'Edit Product' : !formData.name ? 'Add Product Manually' : 'Review Scraped Product'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* ── Left: Images ───────────────────────────── */}
          <div className="space-y-4">
            {/* Image Grid */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">
                Product Images
                <span className="ml-2 text-gray-400 font-normal">({images.length} added)</span>
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-2 min-h-[120px]">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square bg-white rounded-lg overflow-hidden group border border-gray-200 hover:border-amber-400 transition-all shadow-sm">
                  <Image src={img} alt={`Image ${i + 1}`} fill className="object-contain p-1" unoptimized />
                  
                  {/* Hover Controls */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {i !== 0 && (
                      <Button 
                        size="icon" 
                        variant="secondary" 
                        className="h-7 w-7 bg-white/90 hover:bg-white"
                        onClick={() => handleSetMain(i)}
                        title="Set as main image"
                      >
                        <CheckCircle2 size={14} className="text-emerald-600" />
                      </Button>
                    )}
                    <Button 
                      size="icon" 
                      variant="destructive" 
                      className="h-7 w-7 bg-red-500/90 hover:bg-red-500"
                      onClick={() => handleRemoveImage(i)}
                      title="Remove image"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>

                  {i === 0 && (
                    <span className="absolute top-1 left-1 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shadow-sm">Main</span>
                  )}
                </div>
              ))}
              {images.length === 0 && (
                <div className="col-span-3 flex items-center justify-center h-24 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 text-sm">
                  No images yet — add below
                </div>
              )}
            </div>

            {/* Upload from Computer */}
            <div className="border border-dashed border-gray-300 rounded-xl p-4 space-y-3 bg-gray-50">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Add Images</p>

              {/* Option 1: Upload file */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-gray-300 hover:bg-white"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                  ) : (
                    <><Upload className="w-4 h-4 mr-2" /> Upload from Computer</>
                  )}
                </Button>
                <p className="text-[11px] text-gray-400 mt-1 text-center">JPG, PNG, WebP · Max 5MB</p>
              </div>

              {/* Option 2: Paste URL */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                  <Input
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddImageUrl()}
                    placeholder="Paste image URL..."
                    className="pl-8 text-sm h-9"
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddImageUrl}
                  className="bg-gray-800 hover:bg-gray-700 text-white h-9 px-3"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* ── Right: Product Details ─────────────────── */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500">Product Name *</label>
              <Input value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} placeholder="e.g. Samsung Galaxy S24 Ultra" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500">Brand</label>
                <Input value={formData.brand || ''} onChange={e => handleChange('brand', e.target.value)} placeholder="e.g. Samsung" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Category *</label>
                <Select value={formData.category || ''} onValueChange={(val) => handleChange('category', val)}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Pricing Box */}
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 space-y-3">
              <div>
                <label className="text-xs font-semibold text-amber-700">Amazon MRP (₹) *</label>
                <Input
                  type="number"
                  value={formData.original_price || ''}
                  onChange={e => handleChange('original_price', parseFloat(e.target.value) || 0)}
                  className="bg-white border-amber-200 mt-1"
                  placeholder="e.g. 89999"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 border border-amber-100">
                  <div className="text-xs text-gray-500 mb-1">Our Price (−10%)</div>
                  <div className="text-xl font-bold text-gray-900">
                    {formData.our_price ? `₹${formData.our_price.toLocaleString('en-IN')}` : '—'}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-emerald-100">
                  <div className="text-xs text-emerald-600 mb-1">Prepaid Price (−₹1,000)</div>
                  <div className="text-xl font-bold text-emerald-600">
                    {formData.prepaid_price ? `₹${formData.prepaid_price.toLocaleString('en-IN')}` : '—'}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500">Key Features / Description</label>
              <Textarea
                value={formData.description || ''}
                onChange={e => handleChange('description', e.target.value)}
                rows={4}
                placeholder="Enter bullet points, one per line..."
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-xl bg-gray-50">
              <div>
                <div className="font-semibold text-sm">In Stock</div>
                <div className="text-xs text-gray-500">Customers can order this product</div>
              </div>
              <Switch
                checked={formData.in_stock !== false}
                onCheckedChange={v => handleChange('in_stock', v)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-xs text-gray-400">* Required fields</p>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose} disabled={saving}>Discard</Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-amber-500 hover:bg-amber-600 text-white px-8"
            >
              {saving ? 'Saving...' : formData.id ? 'Update Product' : 'Add to Store'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
