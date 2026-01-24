import { create } from 'zustand';

// 1. Storeの「型（設計図）」を定義する
interface AuthState {
  token: string | null;
  isPremium: boolean;
  setToken: (newToken: string | null) => void;
  setPremium: (status: boolean) => void;
  logout: () => void;
}

// 2. create<AuthState>() と書くことで、Zustandに型を教える
export const useAuthStore = create<AuthState>()((set) => ({
  // --- 状態 (State) ---
  token: localStorage.getItem('authToken') || null,
  isPremium: false,

  // --- アクション (Actions) ---
  setToken: (newToken) => {
    if (newToken) {
      localStorage.setItem('authToken', newToken);
    } else {
      localStorage.removeItem('authToken');
    }
    set({ token: newToken });
  },

  setPremium: (status) => set({ isPremium: status }),

  logout: () => {
    localStorage.removeItem('authToken');
    set({ token: null, isPremium: false });
  },
}));