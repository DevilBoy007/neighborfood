import { useCallback } from 'react';
import notificationService from '@/handlers/notificationService';
import { useCart, useUser } from '@/store/reduxHooks';

/**
 * Clears everything the app keeps on-device for the signed-in user, so the next
 * person to use the device starts clean.
 */
export function useSessionReset() {
  const { clearUserData } = useUser();
  const { clearCart } = useCart();

  return useCallback(async () => {
    notificationService.cleanup();
    clearCart();
    await clearUserData();
  }, [clearCart, clearUserData]);
}
