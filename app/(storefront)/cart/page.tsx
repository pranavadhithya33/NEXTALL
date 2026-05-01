"use client";

import { useState } from 'react';
import { useCartStore } from '@/store/cart';
import { useUserStore } from '@/store/user';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Plus, Minus, ArrowRight, ShieldCheck, Banknote, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, getTotals } = useCartStore();
  const { user } = useUserStore();
  const { subtotal, totalSavings, totalPrepaidSavings, itemCount } = getTotals();
  
  const [step, setStep] = useState<1 | 2>(1); // 1: Cart, 2: Checkout Details & Payment
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: user?.full_name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    paymentMethod: 'prepaid' as 'prepaid' | 'half_cod',
  });

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
          <span className="text-4xl">🛒</span>
        </div>
        <h2 className="text-2xl font-bold mb-4">Your Cart is Empty</h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">Looks like you haven't added any premium gadgets to your cart yet.</p>
        <Link href="/">
          <Button className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl px-8 h-12">
            Start Shopping
          </Button>
        </Link>
      </div>
    );
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const finalAmount = formData.paymentMethod === 'prepaid' ? subtotal - totalPrepaidSavings : subtotal;
      const advanceAmount = formData.paymentMethod === 'half_cod' ? Math.round(finalAmount / 2) : undefined;
      const remainingAmount = formData.paymentMethod === 'half_cod' ? finalAmount - advanceAmount! : undefined;

      const orderData = {
        user_id: user?.id,
        customer_name: formData.name,
        customer_phone: formData.phone,
        customer_email: formData.email,
        customer_address: formData.address,
        customer_city: formData.city,
        customer_state: formData.state,
        customer_pincode: formData.pincode,
        items,
        subtotal,
        payment_method: formData.paymentMethod,
        final_amount: finalAmount,
        advance_amount: advanceAmount,
        remaining_amount: remainingAmount,
        savings_amount: formData.paymentMethod === 'prepaid' ? totalSavings + totalPrepaidSavings : totalSavings,
      };

      const { data } = await axios.post('/api/public/orders', orderData);
      
      // Clear cart
      clearCart();
      
      // Redirect to WhatsApp via local API route (or directly format it here)
      // For security & clean URL, we'll hit our API to generate WhatsApp message
      const res = await axios.post('/api/public/whatsapp', { orderId: data.order.id });
      
      if (res.data.url) {
        window.location.href = res.data.url;
      }
      
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <h1 className="text-3xl font-display font-bold mb-8">
        {step === 1 ? 'Your Cart' : 'Secure Checkout'}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {step === 1 ? (
            // Cart Items
            <div className="bg-[#111827] rounded-2xl border border-white/5 overflow-hidden">
              <div className="p-4 border-b border-white/5 flex justify-between items-center text-sm font-medium text-gray-400">
                <span>Product</span>
                <span className="hidden md:block">Price</span>
              </div>
              <div className="divide-y divide-white/5">
                {items.map(item => (
                  <div key={item.product_id} className="p-4 md:p-6 flex gap-4 md:gap-6 items-start md:items-center">
                    <Link href={`/product/${item.slug}`} className="relative w-20 h-20 md:w-24 md:h-24 bg-white rounded-xl flex-shrink-0 p-2">
                      <Image src={item.image} alt={item.name} fill className="object-contain" unoptimized />
                    </Link>
                    
                    <div className="flex-1">
                      <Link href={`/product/${item.slug}`} className="font-medium text-white hover:text-cyan-400 transition-colors line-clamp-2 md:line-clamp-1 mb-2">
                        {item.name}
                      </Link>
                      
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center bg-white/5 rounded-lg border border-white/10 p-1 w-max">
                          <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded">
                            <Minus size={14} />
                          </button>
                          <div className="w-8 text-center text-sm font-bold">{item.quantity}</div>
                          <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded">
                            <Plus size={14} />
                          </button>
                        </div>
                        
                        <div className="text-right">
                          <div className="font-bold text-lg">₹{(item.our_price * item.quantity).toLocaleString('en-IN')}</div>
                          <div className="text-xs text-emerald-400">Save ₹{((item.original_price - item.our_price) * item.quantity).toLocaleString('en-IN')}</div>
                        </div>
                      </div>
                    </div>
                    
                    <button onClick={() => removeItem(item.product_id)} className="text-gray-500 hover:text-red-400 transition-colors p-2 md:p-0">
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Checkout Form
            <form id="checkout-form" onSubmit={handleCheckout} className="space-y-6">
              {/* Shipping Details */}
              <div className="bg-[#111827] rounded-2xl border border-white/5 p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-sm">1</span>
                  Delivery Details
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-400">Full Name</label>
                    <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-white/5 border-white/10" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-400">Phone (10 digits)</label>
                    <Input required pattern="\d{10}" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="bg-white/5 border-white/10" />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-medium text-gray-400">Full Address</label>
                    <Input required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="bg-white/5 border-white/10" placeholder="House No, Building, Street, Area" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-400">City</label>
                    <Input required value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="bg-white/5 border-white/10" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-400">State</label>
                      <Input required value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="bg-white/5 border-white/10" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-400">PIN Code</label>
                      <Input required pattern="\d{6}" value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} className="bg-white/5 border-white/10" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Selection */}
              <div className="bg-[#111827] rounded-2xl border border-white/5 p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-sm">2</span>
                  Payment Method
                </h2>

                <RadioGroup value={formData.paymentMethod} onValueChange={(v: 'prepaid'|'half_cod') => setFormData({...formData, paymentMethod: v})} className="space-y-4">
                  {/* Prepaid Option */}
                  <label className={`relative flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.paymentMethod === 'prepaid' ? 'border-cyan-500 bg-cyan-500/5' : 'border-white/10 hover:border-white/20'}`}>
                    <RadioGroupItem value="prepaid" className="mt-1 mr-4 border-white/30 text-cyan-400 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500" />
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <div className="font-bold flex items-center gap-2">
                          <ShieldCheck size={18} className="text-cyan-400" />
                          Full Prepaid
                        </div>
                        <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded font-bold">Recommended</span>
                      </div>
                      <p className="text-sm text-gray-400">Pay via UPI, Card, or Netbanking on WhatsApp. Get a flat discount of ₹{totalPrepaidSavings.toLocaleString('en-IN')}.</p>
                    </div>
                  </label>

                  {/* Half COD Option */}
                  <label className={`relative flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.paymentMethod === 'half_cod' ? 'border-cyan-500 bg-cyan-500/5' : 'border-white/10 hover:border-white/20'}`}>
                    <RadioGroupItem value="half_cod" className="mt-1 mr-4 border-white/30 text-cyan-400 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500" />
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <div className="font-bold flex items-center gap-2">
                          <Banknote size={18} className="text-amber-400" />
                          Half COD
                        </div>
                      </div>
                      <p className="text-sm text-gray-400">Pay 50% now and 50% on delivery. No extra discounts applied.</p>
                      {formData.paymentMethod === 'half_cod' && (
                        <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2">
                          <ShieldAlert size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-amber-200">You will pay ₹{Math.round(subtotal/2).toLocaleString('en-IN')} now. The remaining ₹{(subtotal - Math.round(subtotal/2)).toLocaleString('en-IN')} will be collected at the time of delivery.</p>
                        </div>
                      )}
                    </div>
                  </label>
                </RadioGroup>
              </div>
            </form>
          )}
        </div>

        {/* Right Column (Order Summary) */}
        <div>
          <div className="bg-[#111827] rounded-2xl border border-white/5 p-6 sticky top-24">
            <h2 className="text-xl font-bold mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal ({itemCount} items)</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Delivery Charges</span>
                <span className="text-emerald-400">FREE</span>
              </div>
              
              {formData.paymentMethod === 'prepaid' && (
                <div className="flex justify-between text-emerald-400 font-medium">
                  <span>Prepaid Discount</span>
                  <span>- ₹{totalPrepaidSavings.toLocaleString('en-IN')}</span>
                </div>
              )}
              
              <div className="border-t border-white/10 pt-4 mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-bold">Total Amount</span>
                  <span className="text-2xl font-display font-bold text-cyan-400">
                    ₹{(formData.paymentMethod === 'prepaid' ? subtotal - totalPrepaidSavings : subtotal).toLocaleString('en-IN')}
                  </span>
                </div>
                {formData.paymentMethod === 'prepaid' && (
                  <div className="text-right text-xs text-emerald-500 font-medium">
                    Total Savings: ₹{(totalSavings + totalPrepaidSavings).toLocaleString('en-IN')} vs Amazon
                  </div>
                )}
              </div>
            </div>

            {step === 1 ? (
              <Button 
                className="w-full h-14 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-lg group"
                onClick={() => setStep(2)}
              >
                Proceed to Checkout
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            ) : (
              <Button 
                form="checkout-form"
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-lg"
              >
                {loading ? 'Processing...' : 'Place Order via WhatsApp'}
              </Button>
            )}
            
            {step === 2 && (
              <button onClick={() => setStep(1)} className="w-full text-center mt-4 text-sm text-gray-400 hover:text-white transition-colors">
                ← Back to Cart
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
