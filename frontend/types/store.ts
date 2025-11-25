import type { User } from "./user";
import type { SignUpPayload, SignInPayload } from "@/services/authService";

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  loading: boolean;

  setAccessToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  clearState: () => void;

  signUp: (payload: SignUpPayload) => Promise<void>;
  signIn: (payload: SignInPayload) => Promise<void>;
  signOut: () => Promise<void>;
  fetchMe: () => Promise<void>;
  bootstrap: () => Promise<void>;
}
