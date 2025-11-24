import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../stores/useAuthStore";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, // e.g. http://localhost:5001
  withCredentials: true, // send/receive refresh cookie
});

// Refresh token logic
let isRefreshing = false;
let queue: Array<{
  resolve: (t: string | null) => void;
  reject: (e: unknown) => void;
}> = [];
const flush = (err: unknown, token: string | null = null) => {
  queue.forEach(({ resolve, reject }) => (err ? reject(err) : resolve(token)));
  queue = [];
};

// Tự động gắn accessToken vào header Authorization
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers = config.headers ?? {}; // đảm bảo headers không undefined
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Xử lý lỗi 401/403 và làm mới token
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    if (!error.response || !original) throw error;

    const status = error.response.status;
    const isAuthPath =
      original.url?.includes("/auth/signin") ||
      original.url?.includes("/auth/signup") ||
      original.url?.includes("/auth/refresh") ||
      original.url?.includes("/auth/refresh-token");

    const shouldRefresh =
      (status === 401 || status === 403) && !original._retry && !isAuthPath;
    if (!shouldRefresh) throw error;

    original._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({
          resolve: (t) => {
            if (t && original.headers)
              original.headers.Authorization = `Bearer ${t}`;
            resolve(api(original));
          },
          reject,
        });
      });
    }

    isRefreshing = true;
    try {
      const res = await api.post("/api/auth/refresh-token", null, {
        withCredentials: true,
      });
      const newToken = (res.data as any)?.accessToken as string | undefined;

      useAuthStore.getState().setAccessToken(newToken ?? null);
      flush(null, newToken ?? null);

      if (newToken && original.headers)
        original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch (e) {
      // Refresh token expired - logout user
      useAuthStore.getState().clearState();
      flush(e, null);
      
      // Show notification
      if (typeof window !== 'undefined') {
        const { toast } = await import('sonner');
        toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
        
        // Redirect to signin after a short delay
        setTimeout(() => {
          window.location.href = '/signin';
        }, 1500);
      }
      
      throw e;
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
