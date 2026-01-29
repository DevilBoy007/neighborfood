import React from 'react';
import { useNotifications } from '@/hooks/useNotifications';

/**
 * Component that initializes push notifications for the app.
 * Must be rendered inside the Redux Provider since it uses useUser hook.
 * This component renders no UI, just handles notification setup.
 */
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize notifications - this hook handles:
  // - Registering for push notifications when user is logged in
  // - Setting up foreground notification handlers (toasts)
  // - Setting up notification tap navigation
  // - Cleaning up on unmount
  useNotifications();

  return <>{children}</>;
};

export default NotificationProvider;
