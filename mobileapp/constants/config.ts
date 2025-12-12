/**
 * Application configuration constants
 *
 * Handles correct Socket.IO URL for:
 * - Web / iOS simulator: localhost
 * - Android emulator: 10.0.2.2 (host loopback)
 * - Physical devices: EXPO_PUBLIC_SOCKET_URL (required)
 */

import { Platform } from 'react-native';

// Get socket URL from environment or use sensible defaults per platform.
// Handles Android emulator localhost mapping automatically.
const getSocketUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_SOCKET_URL;
  if (envUrl) {
    // If user configured localhost but we're on Android emulator, map to 10.0.2.2
    if (Platform.OS === 'android' && envUrl.includes('localhost')) {
      return envUrl.replace('localhost', '10.0.2.2');
    }
    return envUrl;
  }

  // Android emulator cannot reach host via localhost; must use 10.0.2.2
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  // iOS simulator / web can use localhost directly
  return 'http://localhost:3000';
};

export const SOCKET_URL = getSocketUrl();

export const APP_CONFIG = {
  name: 'Socket Chat',
  version: '1.0.0',
  socketUrl: SOCKET_URL,
} as const;

// Log the socket URL for debugging (only once, not on every import)
if (__DEV__) {
  // Only log if not already logged (check a global flag)
  if (!(global as any).__SOCKET_URL_LOGGED) {
    (global as any).__SOCKET_URL_LOGGED = true;
    console.log('🔌 Socket.IO URL:', SOCKET_URL);

    if (SOCKET_URL.includes('10.0.2.2')) {
      console.log('💡 Android emulator detected - using 10.0.2.2 to reach localhost:3000 on host');
    } else if (SOCKET_URL.includes('localhost')) {
      console.log('💡 Using localhost - works for web and iOS simulator');
      console.log('💡 For Android emulator, prefer 10.0.2.2:3000 or set EXPO_PUBLIC_SOCKET_URL');
    } else {
      console.log('💡 Using custom Socket.IO URL from EXPO_PUBLIC_SOCKET_URL');
    }
  }
}

