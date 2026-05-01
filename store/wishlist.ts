import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WishlistItem {
  id: string;
  slug: string;
  name: string;
  original_price: number;
  our_price: number;
  prepaid_price: number;
  image: string;
  brand?: string;
  category?: string;
}

interface WishlistState {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  removeItem: (id: string) => void;
  clearWishlist: () => void;
  isInWishlist: (id: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const currentItems = get().items;
        const isAlreadyIn = currentItems.find((i) => i.id === item.id);
        if (!isAlreadyIn) {
          set({ items: [...currentItems, item] });
        }
      },
      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) });
      },
      clearWishlist: () => set({ items: [] }),
      isInWishlist: (id) => {
        return !!get().items.find((i) => i.id === id);
      },
    }),
    {
      name: 'wishlist-storage',
    }
  )
);
