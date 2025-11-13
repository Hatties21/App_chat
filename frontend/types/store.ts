import type { User } from "./user";

export type AuthState = {
  accessToken: string | null;
  user: User | null;
  loading: boolean;

  setAccessToken: (t: string | null) => void;
  setUser: (u: User | null) => void;
  clearState: () => void;

  signUp: (payload: {
    username: string;
    displayName: string;
    email?: string;
    password: string;
  }) => Promise<void>;

  signIn: (payload: { username: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  fetchMe: () => Promise<void>;
  bootstrap: () => Promise<void>;
};
