import { useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { toast } from 'sonner';

/**
 * Hook to monitor token expiration and warn user
 * Shows warning 5 minutes before token expires
 */
export function useTokenExpiration() {
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (!accessToken) return;

    try {
      // Decode JWT to get expiration time
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const expiresAt = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;

      // If token already expired, do nothing (interceptor will handle)
      if (timeUntilExpiry <= 0) return;

      // Show warning 5 minutes before expiration
      const warningTime = timeUntilExpiry - 5 * 60 * 1000; // 5 minutes

      if (warningTime > 0) {
        const warningTimer = setTimeout(() => {
          toast.warning('Phiên đăng nhập sắp hết hạn', {
            description: 'Vui lòng lưu công việc của bạn',
            duration: 10000,
          });
        }, warningTime);

        return () => clearTimeout(warningTimer);
      } else {
        // Less than 5 minutes remaining, show warning immediately
        toast.warning('Phiên đăng nhập sắp hết hạn', {
          description: 'Vui lòng lưu công việc của bạn',
          duration: 10000,
        });
      }
    } catch (error) {
      console.error('Failed to decode token:', error);
    }
  }, [accessToken]);
}
