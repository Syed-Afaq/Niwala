import React, { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { AuthProvider } from './src/auth/AuthContext';
import { CartProvider } from './src/cart/CartContext';
import { OrderUpdatesProvider } from './src/orders/OrderUpdatesContext';
import { RootNavigator } from './src/navigation/RootNavigator';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
      staleTime: 3_000,
    },
  },
});

/**
 * React Query knows when a browser tab regains focus, but not when a phone app
 * comes back to the foreground. Tell it, so data is refreshed the moment the
 * app is reopened instead of on the next poll.
 */
function useRefetchOnAppForeground() {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const subscription = AppState.addEventListener('change', (state) => {
      focusManager.setFocused(state === 'active');
    });
    return () => subscription.remove();
  }, []);
}

export default function App() {
  useRefetchOnAppForeground();

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <OrderUpdatesProvider>
            <CartProvider>
              <StatusBar style="dark" />
              <RootNavigator />
            </CartProvider>
          </OrderUpdatesProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
