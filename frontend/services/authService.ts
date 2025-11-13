import api from "@/lib/api";
import type { User } from "@/types/user";

export type SignUpPayload = {
  username: string;
  displayName: string;
  email?: string;
  password: string;
};

export type SignInPayload = {
  username: string;
  password: string;
};

export type SignInResponse = { accessToken?: string };
export type SignUpResponse = { accessToken?: string };
export type MeResponse = { user?: User };
export type RefreshResponse = { accessToken?: string };

export const authService = {
  signUp: async (payload: SignUpPayload): Promise<SignUpResponse> => {
    const { data } = await api.post("/api/auth/signup", payload);
    return data as SignUpResponse;
  },

  signIn: async (payload: SignInPayload): Promise<SignInResponse> => {
    const { data } = await api.post("/api/auth/signin", payload);
    return data as SignInResponse;
  },

  signOut: async (): Promise<void> => {
    await api.post("/api/auth/signout", null);
  },

  fetchMe: async (): Promise<MeResponse> => {
    const { data } = await api.get("/api/users/me", {
      headers: { "Cache-Control": "no-store" }, // tránh 304 khi dev
    });
    return data as MeResponse;
  },

  refreshToken: async (): Promise<RefreshResponse> => {
    const { data } = await api.post("/api/auth/refresh-token", null, {
      withCredentials: true,
    });
    return data as RefreshResponse;
  },
};
