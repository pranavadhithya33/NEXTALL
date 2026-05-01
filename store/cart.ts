import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { OrderItem } from '../types';

interface CartState {
  items: OrderItem[];
  addItem: (item: OrderItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotals: () => { subtotal: number; totalSavings: number; totalPrepaidSavings: number; itemCount: number };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => set((state) => {
        const existingItem = state.items.find(i => i.product_id === item.product_id);
        if (existingItem) {
          return {
            items: state.items.map(i =>
              i.product_id === item.product_id
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            )
          };
        }
        return { items: [...state.items, item] };
      }),
      removeItem: (productId) => set((state) => ({
        items: state.items.filter(i => i.product_id !== productId)
      })),
      updateQuantity: (productId, quantity) => set((state) => ({
        items: state.items.map(i =>
          i.product_id === productId ? { ...i, quantity: Math.max(1, quantity) } : i
        )
      })),
      clearCart: () => set({ items: [] }),
      getTotals: () => {
        const { items } = get();
        let subtotal = 0;
        let itemCount = 0;
        let totalPrepaidSavings = 0;

        let totalSavings = 0;

        items.forEach(item => {
          subtotal += item.our_price * item.quantity;
          itemCount += item.quantity;
          totalPrepaidSavings += (item.our_price - item.prepaid_price) * item.quantity;
          totalSavings += (item.original_price - item.our_price) * item.quantity;
        });

        return { subtotal, totalSavings, totalPrepaidSavings, itemCount };
      }
    }),
    {
      name: 'nextall-cart',
    }
  )
);
