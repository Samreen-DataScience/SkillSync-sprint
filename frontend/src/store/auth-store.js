import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : state.user,
      })),
      clearAuth: () => {
        localStorage.removeItem("skillsync-auth");
        sessionStorage.removeItem("skillsync-auth");
        set({ token: null, user: null });
      },
      hasRole: (roles) => {
        const user = get().user;
        if (!user) return false;
        return user.roles.some((r) => roles.includes(r));
      },
    }),
    {
      name: "skillsync-auth",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
