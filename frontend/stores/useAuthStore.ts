import { create } from "zustand";
import { authService } from "@/services/authService";
import type { AuthState } from "@/types/store";
import type { User } from "@/types/user";

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken:
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null,
  user: null,
  loading: true,

  setAccessToken: (t) => {
    if (typeof window !== "undefined") {
      if (t) localStorage.setItem("accessToken", t);
      else localStorage.removeItem("accessToken");
    }
    set({ accessToken: t });
  },

  setUser: (u) => set({ user: u }),

  clearState: () => {
    if (typeof window !== "undefined") localStorage.removeItem("accessToken");
    set({ accessToken: null, user: null });
  },

  // ---- Sign up ----
  signUp: async (payload) => {
    try {
      const { accessToken } = await authService.signUp(payload);
      if (accessToken) {
        get().setAccessToken(accessToken);
        await get().fetchMe();
      }
    } catch (err) {
      console.error("Sign-up failed:", err);
    }
  },

  // ---- Sign in ----
  signIn: async ({ username, password }) => {
    try {
      const { accessToken } = await authService.signIn({ username, password });
      if (accessToken) {
        get().setAccessToken(accessToken);
        await get().fetchMe();
      }
    } catch (err) {
      console.error("Sign-in failed:", err);
    }
  },

  // ---- Sign out ----
  signOut: async () => {
    try {
      await authService.signOut();
    } catch (err) {
      console.error("Sign-out failed:", err);
    } finally {
      get().clearState();
    }
  },

  // ---- Fetch user profile ----
  fetchMe: async () => {
    try {
      const { user: raw } = await authService.fetchMe();
      if (!raw) {
        set({ user: null });
        return;
      }

      const user: User = {
        id: (raw as any)._id ?? (raw as any).id,
        username: raw.username,
        email: raw.email,
        displayName: raw.displayName,
        avatarUrl: raw.avatarUrl,
        bio: raw.bio,
        phone: raw.phone,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      };
      set({ user });
    } catch (err) {
      console.error("Fetch user failed:", err);
      set({ user: null });
    }
  },

  // ---- Bootstrap ----
  bootstrap: async () => {
    try {
      if (!get().accessToken) {
        try {
          const { accessToken } = await authService.refreshToken();
          if (accessToken) get().setAccessToken(accessToken);
        } catch (err) {
          console.error("Refresh token failed:", err);
        }
      }
      await get().fetchMe();
    } finally {
      set({ loading: false });
    }
  },
}));
