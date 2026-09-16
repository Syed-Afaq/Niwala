import { Platform } from 'react-native';

/**
 * Where the API lives.
 *
 * Override with EXPO_PUBLIC_API_URL when running on a physical device, which
 * cannot reach the host's localhost — use the machine's LAN address, e.g.
 *   EXPO_PUBLIC_API_URL=http://192.168.1.20:4000 npx expo start
 *
 * The Android emulator reaches the host through 10.0.2.2 rather than localhost.
 */
const fallbackHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? `http://${fallbackHost}:4000`;
