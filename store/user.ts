import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  user: { id: string; full_name: string; email: string; phone: string } | null;
  isLoggedIn: boolean;
  setUser: (user: UserState['user']) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isLoggedIn: false,
      setUser: (user) => set({ user, isLoggedIn: !!user }),
      clearUser: () => set({ user: null, isLoggedIn: false }),
    }),
    {
      name: 'nextall-user',
    }
  )
);
