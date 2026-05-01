import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format number as Indian currency
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Generate URL slug from product name
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 80);
}

// Generate unique order number
export function generateOrderNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const random = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `#NXT-${random}`;
}

// Calculate all prices from Amazon MRP
export function calculatePrices(originalPrice: number) {
  const ourPrice = Math.round(originalPrice * 0.90);
  const prepaidPrice = ourPrice - 1000;
  const savings = originalPrice - ourPrice;
  const prepaidSavings = originalPrice - prepaidPrice;
  return { ourPrice, prepaidPrice, savings, prepaidSavings };
}

// Half COD calculation
export function calculateHalfCOD(ourPrice: number) {
  const advance = Math.round(ourPrice / 2);
  const remaining = ourPrice - advance;
  return { advance, remaining, total: ourPrice };
}
