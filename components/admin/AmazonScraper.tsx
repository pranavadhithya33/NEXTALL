"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { ProductPreviewModal } from './ProductPreviewModal';
import { Product } from '@/types';

export function AmazonScraper({ onSaved }: { onSaved: () => void }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [scrapedProduct, setScrapedProduct] = useState<Partial<Product> | null>(null);

  const steps = [
    "Connecting to Amazon",
    "Reading product details",
    "Downloading images",
    "Uploading to store"
  ];

  const handleScrape = async () => {
    const isDirectUrl = /\/dp\/[A-Z0-9]{10}/i.test(url);
    if (!url || !url.includes('amazon.in')) {
      setError('Please enter a valid amazon.in URL');
      return;
    }
    if (!isDirectUrl) {
      setError("❌ That's a search results page. Please open a specific product, then copy its URL (must contain /dp/).");
      return;
    }

    setLoading(true);
    setError('');
    setStep(1);

    // Simulate steps progress for UI (actual work happens in single API call)
    const interval = setInterval(() => {
      setStep(s => Math.min(s + 1, 3));
    }, 2000);

    try {
      const res = await axios.post('/api/admin/scrape-amazon', { url });
      clearInterval(interval);
      setStep(4);
      setScrapedProduct(res.data.product);
    } catch (err: any) {
      clearInterval(interval);
      setError(err.response?.data?.error || 'Failed to scrape product. Try again.');
      setStep(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-[#FFFBEB] rounded-2xl p-6 border-l-4 border-amber-500 shadow-sm mb-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
            <RefreshCw className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-amber-900 mb-2">One-Click Auto-Upload from Amazon</h2>
            <p className="text-amber-800/80 mb-6 max-w-3xl text-sm">
              Paste any Amazon India product URL. We will automatically fetch the Title, High-Resolution Images, Live Price, and Complete Specifications — then apply your discounts automatically.
            </p>

            <div className="flex gap-3">
              <Input
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://www.amazon.in/dp/..."
                className="bg-white border-amber-200 focus-visible:ring-amber-500 rounded-xl"
                disabled={loading}
              />
              <Button 
                onClick={handleScrape} 
                disabled={loading}
                className="bg-amber-500 hover:bg-amber-600 text-white rounded-full font-bold px-8"
              >
                {loading ? 'Fetching...' : 'Fetch & Add'}
              </Button>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-3 border border-red-100">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <div className="text-sm">{error}</div>
              </div>
            )}

            {loading && (
              <div className="mt-6 flex justify-between max-w-2xl">
                {steps.map((text, i) => (
                  <div key={i} className={`flex flex-col items-center gap-2 text-sm ${step > i ? 'text-emerald-600' : step === i + 1 ? 'text-amber-600 font-medium' : 'text-amber-900/40'}`}>
                    {step > i ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : step === i + 1 ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-current" />
                    )}
                    <span className="text-xs text-center">{text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ProductPreviewModal 
        product={scrapedProduct}
        isOpen={!!scrapedProduct}
        onClose={() => setScrapedProduct(null)}
        onSaved={onSaved}
      />
    </>
  );
}
